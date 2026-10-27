import crypto from "crypto";
import axios from "axios";
import User from "../models/User.js";
import GithubOAuthState from "../models/GithubOAuthState.js";

/**
 * Initiates the GitHub OAuth authorization flow.
 * Validates credentials, generates a CSRF state token, and returns the authorization URL.
 */
export const initiateGitHubOAuth = async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret || clientId.trim() === "" || clientSecret.trim() === "") {
      return res.status(400).json({
        success: false,
        message:
          "GitHub OAuth is not configured on the server. Please configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env.",
      });
    }

    const userId = req.user?.userId || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to connect with GitHub.",
      });
    }

    // Cryptographically secure random 32-byte hex state to prevent CSRF
    const state = crypto.randomBytes(32).toString("hex");
    const returnUrl = req.query.returnUrl || "/student/project/add";

    // Dynamically detect client origin so redirects match the exact port user is browsing (5173, 5174, etc.)
    let clientOrigin = "";
    if (req.headers.origin) {
      clientOrigin = req.headers.origin;
    } else if (req.headers.referer) {
      try {
        const parsed = new URL(req.headers.referer);
        clientOrigin = parsed.origin;
      } catch (e) {}
    }
    const frontendOrigin = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";

    // Store state in DB with TTL
    await GithubOAuthState.create({
      state,
      userId,
      returnUrl,
      frontendOrigin,
    });

    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ||
      `http://localhost:${process.env.PORT || 5000}/api/student/github/callback`;

    // Request permissions to read user profile and access public + private repositories
    const scope = "read:user,repo";
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId.trim()}&redirect_uri=${encodeURIComponent(
      callbackUrl.trim()
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;

    return res.status(200).json({
      success: true,
      authUrl,
      state,
    });
  } catch (error) {
    console.error("[GITHUB OAUTH INITIATE ERROR]:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initialize GitHub OAuth. Please try again.",
    });
  }
};

/**
 * Handles the redirect callback from GitHub OAuth.
 * Validates CSRF state, exchanges authorization code for access token,
 * fetches the GitHub profile, and securely stores the connection on the student model.
 * Redirects the user to the dedicated /student/github-connected page.
 */
export const handleGitHubCallback = async (req, res) => {
  let frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  try {
    const { code, state, error, error_description } = req.query;

    let stateRecord = null;
    if (state) {
      stateRecord = await GithubOAuthState.findOne({ state });
      if (stateRecord?.frontendOrigin) {
        frontendUrl = stateRecord.frontendOrigin;
      }
    }

    // Handle user cancellation or GitHub errors
    if (error) {
      console.warn("[GITHUB OAUTH CANCELLED/ERROR]:", error, error_description);
      const returnUrl = stateRecord?.returnUrl || "/student/project/add";
      const err = error_description || error || "GitHub authorization was cancelled";
      const separator = returnUrl.includes("?") ? "&" : "?";
      return res.redirect(
        `${frontendUrl}${returnUrl}${separator}github_error=${encodeURIComponent(err)}`
      );
    }

    if (!code || !state) {
      const err = "Invalid OAuth response from GitHub. Missing code or state.";
      return res.redirect(
        `${frontendUrl}/student/project/add?github_error=${encodeURIComponent(err)}`
      );
    }

    // Validate CSRF state against DB
    if (!stateRecord) {
      const err = "Security check failed: Invalid or expired OAuth state. Please try connecting again.";
      return res.redirect(
        `${frontendUrl}/student/project/add?github_error=${encodeURIComponent(err)}`
      );
    }

    const { userId, returnUrl = "/student/project/add" } = stateRecord;

    // Remove state record so it cannot be reused
    await GithubOAuthState.deleteOne({ _id: stateRecord._id });

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const callbackUrl =
      process.env.GITHUB_CALLBACK_URL ||
      `http://localhost:${process.env.PORT || 5000}/api/student/github/callback`;

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId.trim(),
        client_secret: clientSecret.trim(),
        code,
        redirect_uri: callbackUrl.trim(),
      },
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "SkillSync-Platform",
        },
      }
    );

    const tokenData = tokenResponse.data;
    if (tokenData.error || !tokenData.access_token) {
      console.error("[GITHUB TOKEN EXCHANGE ERROR]:", tokenData);
      const errReason = tokenData.error_description || tokenData.error || "Failed to exchange token";
      const separator = returnUrl.includes("?") ? "&" : "?";
      return res.redirect(
        `${frontendUrl}${returnUrl}${separator}github_error=${encodeURIComponent(errReason)}`
      );
    }

    const accessToken = tokenData.access_token;

    // Retrieve authenticated GitHub user profile
    const profileResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SkillSync-Platform",
      },
    });

    const ghUser = profileResponse.data;

    // Associate GitHub account with student user
    const student = await User.findById(userId);
    if (!student) {
      const separator = returnUrl.includes("?") ? "&" : "?";
      return res.redirect(
        `${frontendUrl}${returnUrl}${separator}github_error=${encodeURIComponent("User not found")}`
      );
    }

    student.githubConnected = true;
    student.githubId = String(ghUser.id);
    student.githubUsername = ghUser.login;
    student.githubAvatarUrl = ghUser.avatar_url || "";
    student.githubUrl = ghUser.html_url || `https://github.com/${ghUser.login}`;
    student.githubAccessToken = accessToken;
    student.githubConnectedAt = new Date();
    await student.save();

    console.log(`[GITHUB OAUTH SUCCESS]: User ${student._id} linked GitHub account @${ghUser.login}`);

    // Redirect user back to the originating page with success query param
    const separator = returnUrl.includes("?") ? "&" : "?";
    return res.redirect(
      `${frontendUrl}${returnUrl}${separator}github_connected=true&github_user=${encodeURIComponent(
        ghUser.login
      )}`
    );
  } catch (error) {
    console.error("[GITHUB CALLBACK EXCEPTION]:", error.response?.data || error.message);
    const msg = error.response?.data?.message || error.message || "OAuth processing failed";
    return res.redirect(
      `${frontendUrl}/student/project/add?github_error=${encodeURIComponent(msg)}`
    );
  }
};

/**
 * Returns current GitHub connection status for the logged-in student.
 */
export const getGitHubStatus = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const student = await User.findById(userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      connected: Boolean(student.githubConnected && student.githubUsername),
      username: student.githubUsername || "",
      avatarUrl: student.githubAvatarUrl || "",
      githubUrl: student.githubUrl || "",
      connectedAt: student.githubConnectedAt || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get GitHub status",
    });
  }
};

/**
 * Fetches repositories for the authenticated user using their stored OAuth access token.
 * Never requires or accepts a frontend-supplied username or token.
 */
export const getAuthenticatedGitHubRepos = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    // Explicitly select the hidden githubAccessToken field
    const student = await User.findById(userId).select("+githubAccessToken");

    if (!student || !student.githubConnected || !student.githubAccessToken) {
      return res.status(400).json({
        success: false,
        message: "GitHub account is not connected. Please connect with GitHub first.",
        requireOAuth: true,
      });
    }

    try {
      const response = await axios.get(
        "https://api.github.com/user/repos?sort=updated&per_page=100&affiliation=owner,collaborator",
        {
          headers: {
            Authorization: `Bearer ${student.githubAccessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "SkillSync-Platform",
          },
        }
      );

      const repos = (response.data || []).map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        htmlUrl: repo.html_url,
        description: repo.description || "",
        language: repo.language || "Other",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        isPrivate: repo.private,
        updatedAt: repo.updated_at,
        defaultBranch: repo.default_branch,
        topics: repo.topics || [],
      }));

      return res.status(200).json({
        success: true,
        repos,
        count: repos.length,
        username: student.githubUsername,
        avatarUrl: student.githubAvatarUrl,
      });
    } catch (apiError) {
      // If token expired or was revoked by user in GitHub settings
      if (apiError.response?.status === 401) {
        student.githubConnected = false;
        student.githubAccessToken = "";
        await student.save();

        return res.status(401).json({
          success: false,
          message: "Your GitHub session has expired or was revoked. Please reconnect with GitHub.",
          requireOAuth: true,
        });
      }

      throw apiError;
    }
  } catch (error) {
    console.error("[GET AUTH GITHUB REPOS ERROR]:", error.response?.data || error.message);
    const status = error.response?.status || 500;
    return res.status(status).json({
      success: false,
      message: error.response?.data?.message || error.message || "Failed to fetch repositories from GitHub",
    });
  }
};

/**
 * Disconnects the user's GitHub account and clears stored tokens.
 */
export const disconnectGitHub = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const student = await User.findById(userId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    student.githubConnected = false;
    student.githubId = "";
    student.githubUsername = "";
    student.githubAvatarUrl = "";
    student.githubAccessToken = "";
    student.githubConnectedAt = null;
    await student.save();

    console.log(`[GITHUB DISCONNECT]: User ${student._id} disconnected their GitHub account`);

    return res.status(200).json({
      success: true,
      message: "GitHub account disconnected successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to disconnect GitHub account",
    });
  }
};
