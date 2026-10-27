import * as StudentService from "../services/student.service.js";
import axios from "axios";
import User from "../models/User.js";

// ─── GET /api/student/profile ──────────────────────────────────────────────────
/** Student gets their own profile. */
export const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const user = await StudentService.getProfile(userId);

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── GET /api/student/profile/full ────────────────────────────────────────────
/** Student gets their full professional profile (certs + projects + employment). */
export const getFullProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const profile = await StudentService.getFullProfile(userId);

        return res.status(200).json({
            success: true,
            ...profile,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message,
        });
    }
};

// ─── PUT /api/student/profile ──────────────────────────────────────────────────
/** Student updates their profile (bio, headline, skills, phone, college, etc.). */
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?._id;
        const user = await StudentService.updateProfile(userId, req.body);

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Failed to update profile",
        });
    }
};

// ─── GET /api/student/github/repos ─────────────────────────────────────────────
/**
 * Fetch GitHub repositories for the connected student.
 * Accepts ?username=... or ?token=... (Personal Access Token).
 * If neither is passed, attempts to derive username from student's githubUrl in profile.
 */
export const fetchGitHubRepos = async (req, res) => {
    try {
        let { username, token } = req.query;

        if (!username && !token) {
            const userId = req.user?.userId || req.user?._id;
            const student = await User.findById(userId).select("githubUrl");
            if (student?.githubUrl) {
                // Parse username from https://github.com/username
                const match = student.githubUrl.match(/github\.com\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    username = match[1];
                }
            }
        }

        if (!username && !token) {
            return res.status(400).json({
                success: false,
                message: "Please provide a GitHub username or personal access token to fetch repositories.",
            });
        }

        const headers = {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "SkillSync-Platform",
        };

        let url = "";
        if (token) {
            headers.Authorization = `Bearer ${token.trim()}`;
            url = "https://api.github.com/user/repos?sort=updated&per_page=100&type=all";
        } else {
            url = `https://api.github.com/users/${encodeURIComponent(username.trim())}/repos?sort=updated&per_page=100`;
        }

        const response = await axios.get(url, { headers });

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
            username: username || "authenticated-user",
        });
    } catch (error) {
        console.error("[FETCH GITHUB REPOS ERROR]:", error.response?.data?.message || error.message);

        const status = error.response?.status || 500;
        let message = "Failed to fetch GitHub repositories.";

        if (status === 404) {
            message = "GitHub user not found. Please check the username.";
        } else if (status === 401) {
            message = "Invalid or expired GitHub access token.";
        } else if (status === 403) {
            message = "GitHub API rate limit exceeded. Please wait a few minutes or provide a GitHub personal access token.";
        }

        return res.status(status).json({
            success: false,
            message,
        });
    }
};
