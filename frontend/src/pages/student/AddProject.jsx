import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createProject,
  getGitHubStatus,
  getGitHubConnectUrl,
  disconnectGitHub,
} from "../../services/projectService";
import GitHubRepoModal from "../../components/student/GitHubRepoModal";
import NotificationBell from "../../components/common/NotificationBell";
import SettingsModal from "../../components/common/SettingsModal";
import { FaCog } from "react-icons/fa";

const AddProject = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser = {}, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "Academic",
    githubLink: "",
    liveDemo: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // GitHub Repo Selector Modal state
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [gitHubAccount, setGitHubAccount] = useState({ connected: false, username: "" });
  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [disconnectingGitHub, setDisconnectingGitHub] = useState(false);

  const checkStatus = async () => {
    try {
      const status = await getGitHubStatus();
      if (status.connected) {
        setGitHubAccount({ connected: true, username: status.username });
      } else {
        setGitHubAccount({ connected: false, username: "" });
      }
    } catch (err) {
      console.error("Failed to fetch GitHub account status:", err);
    }
  };

  // Check GitHub status and handle OAuth redirect callback params
  useEffect(() => {
    checkStatus();

    // Check if a repo was passed from the GitHubConnectedPage
    if (location.state?.selectedGitHubRepo) {
      const repo = location.state.selectedGitHubRepo;
      setSelectedRepo(repo);
      setFormData((prev) => ({
        ...prev,
        githubLink: repo.htmlUrl,
        projectName: repo.name || prev.projectName,
        description: repo.description || prev.description || "",
      }));
      setStatusMessage({
        type: "success",
        text: `✓ Linked repository ${repo.name} from your GitHub account.`,
      });
    }

    // Handle OAuth callback parameters in URL
    const connectedParam = searchParams.get("github_connected");
    const userParam = searchParams.get("github_user");
    const errorParam = searchParams.get("github_error");

    if (connectedParam === "true") {
      setStatusMessage({
        type: "success",
        text: `✓ Successfully authenticated with GitHub${userParam ? ` as @${userParam}` : ""}! Choose a repository to link.`,
      });
      setGitHubAccount({ connected: true, username: userParam || "" });
      setShowGitHubModal(true);
      checkStatus();
      navigate("/student/project/add", { replace: true });
    } else if (errorParam) {
      setStatusMessage({
        type: "error",
        text: `❌ GitHub connection failed: ${errorParam}`,
      });
      navigate("/student/project/add", { replace: true });
    }
  }, [searchParams, location.state, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleConnectGitHub = async () => {
    try {
      setConnectingGitHub(true);
      setStatusMessage({ type: "info", text: "Redirecting to GitHub authorization..." });
      const { authUrl } = await getGitHubConnectUrl("/student/project/add");
      if (authUrl) {
        // Full page redirect to official GitHub authorization page
        window.location.href = authUrl;
      } else {
        setStatusMessage({
          type: "error",
          text: "Could not generate GitHub authorization URL.",
        });
        setConnectingGitHub(false);
      }
    } catch (err) {
      console.error("Failed to initiate GitHub OAuth:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to connect with GitHub.",
      });
      setConnectingGitHub(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account?")) return;
    try {
      setDisconnectingGitHub(true);
      await disconnectGitHub();
      setGitHubAccount({ connected: false, username: "" });
      setSelectedRepo(null);
      setStatusMessage({
        type: "success",
        text: "GitHub account disconnected successfully.",
      });
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to disconnect GitHub account.",
      });
    } finally {
      setDisconnectingGitHub(false);
    }
  };

  const handleRepoSelected = (repo) => {
    setSelectedRepo(repo);
    setFormData((prev) => ({
      ...prev,
      githubLink: repo.htmlUrl,
      projectName: repo.name || prev.projectName,
      description: repo.description || prev.description || "",
    }));
    setShowGitHubModal(false);
    setStatusMessage({
      type: "success",
      text: `✓ Linked repository "${repo.name}". Project details populated.`,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!formData.projectName.trim() || !formData.description.trim()) {
      setStatusMessage({
        type: "error",
        text: "Project name and description are required.",
      });
      return;
    }

    setLoading(true);

    try {
      const data = {
        projectName: formData.projectName.trim(),
        description: formData.description.trim(),
        githubLink: formData.githubLink.trim(),
        liveDemo: formData.liveDemo.trim(),
        projectType: formData.projectType,
      };

      await createProject(data);

      setStatusMessage({
        type: "success",
        text: `✓ Project "${formData.projectName}" added successfully to your portfolio!`,
      });

      setFormData({
        projectName: "",
        projectType: "Academic",
        githubLink: "",
        liveDemo: "",
        description: "",
      });
      setSelectedRepo(null);
    } catch (error) {
      console.error("Project creation error:", error);
      const errText =
        error.response?.data?.message || error.message || "Failed to create project.";
      setStatusMessage({
        type: "error",
        text: `❌ ${errText}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (logout) logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ─── Top Header Bar ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-1.5">
              🎓 Verified Applicant Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
              Upload Technical Project
            </h1>
            <p className="mt-1 text-xs text-[#666666]">
              Showcase your software, engineering, and research work with official GitHub code and live deployments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/student/projects"
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition shadow-xs flex items-center gap-1.5"
            >
              <span>📁</span>
              <span>My Projects</span>
            </Link>
            <Link
              to="/student/dashboard"
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition shadow-xs flex items-center gap-1.5"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>
            <NotificationBell />
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Settings & Preferences"
            >
              <FaCog className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── 3 Information KPI Cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            onClick={() => setShowGitHubModal(true)}
            className="p-4 rounded-xl border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                GITHUB SYNC
              </span>
              <span className="text-base">🐙</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#0A66C2]">
              {gitHubAccount.connected ? `@${gitHubAccount.username}` : "Connect Account"}
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {gitHubAccount.connected ? "Click to pick from your repos" : "Authorize to import repos in 1-click"}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#D9E1E8] bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                BLOCKCHAIN PROOF
              </span>
              <span className="text-base text-[#0A66C2]">🛡️</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#191919]">
              SHA-256 Hash Verification
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              Projects generate immutable cryptographic hashes for organisation review
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[#D9E1E8] bg-white shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                SEPOLIA NETWORK
              </span>
              <span className="text-base text-[#16805D]">⛓</span>
            </div>
            <p className="mt-2 text-sm font-bold text-[#16805D]">
              Accredited Credentials
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              Eligible for on-chain verification by university or employer
            </p>
          </div>
        </div>

        {/* ─── Feedback Banner ────────────────────────────────────────── */}
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold border flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#E6F4EA] border-[#137333]/30 text-[#137333]"
                : statusMessage.type === "error"
                ? "bg-[#FCE8E6] border-[#C5221F]/30 text-[#C5221F]"
                : "bg-[#E8F3FF] border-[#0A66C2]/30 text-[#0A66C2]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="font-bold opacity-60 hover:opacity-100 cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── Main White Form Card ────────────────────────────────────── */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-7 shadow-xs">
          <div className="mb-5 pb-3 border-b border-[#D9E1E8] flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#191919]">Project Specifications</h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Provide comprehensive information so recruiters and partner organisations can assess your contributions.
              </p>
            </div>
            <Link
              to="/student/projects"
              className="text-xs font-semibold text-[#0A66C2] hover:underline"
            >
              View Existing Projects →
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  name="projectName"
                  required
                  placeholder="e.g. Distributed Task Queue in Go"
                  value={formData.projectName}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              {/* Project Classification */}
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">
                  Project Classification
                </label>
                <select
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none cursor-pointer"
                >
                  <option value="Academic">Academic / University Project</option>
                  <option value="Personal">Personal Side Project</option>
                  <option value="Industry">Industry / Client Work</option>
                  <option value="OpenSource">Open Source Contribution</option>
                </select>
              </div>

              {/* GitHub Repository URL with Connect Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#191919]">
                    GitHub Repository URL
                  </label>
                  {gitHubAccount.connected ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowGitHubModal(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        title="Choose a repository from your connected GitHub account"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          />
                        </svg>
                        <span>Select @{gitHubAccount.username} Repo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectGitHub}
                        disabled={disconnectingGitHub}
                        className="px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                        title="Disconnect your GitHub account"
                      >
                        {disconnectingGitHub ? "…" : "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGitHub}
                      disabled={connectingGitHub}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer border border-[#0A66C2]/40 bg-[#0A66C2]/10 text-[#0A66C2] hover:bg-[#0A66C2]/15 disabled:opacity-60"
                      title="Connect with GitHub in a separate page"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        />
                      </svg>
                      <span>{connectingGitHub ? "Redirecting to GitHub…" : "Connect with GitHub"}</span>
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  name="githubLink"
                  placeholder="https://github.com/username/project"
                  value={formData.githubLink}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                />

                {/* Selected Repo Preview Pill */}
                {selectedRepo && (
                  <div className="mt-2 p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold">✓ Selected:</span>
                      <span className="font-mono text-[11px] truncate">
                        {selectedRepo.fullName || selectedRepo.name}
                      </span>
                      {selectedRepo.language && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 font-semibold">
                          {selectedRepo.language}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRepo(null);
                        setFormData((prev) => ({ ...prev, githubLink: "" }));
                      }}
                      className="text-emerald-700 hover:text-emerald-900 text-[11px] cursor-pointer ml-2"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Live Demo URL */}
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">
                  Live Demo URL (Optional)
                </label>
                <input
                  type="url"
                  name="liveDemo"
                  placeholder="https://myproject.dev"
                  value={formData.liveDemo}
                  onChange={handleChange}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1">
                Detailed Project Description *
              </label>
              <textarea
                name="description"
                rows={4}
                required
                placeholder="Explain the technical problem solved, core tech stack utilized, architecture design, and your individual engineering contributions..."
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#D9E1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-[11px] text-[#666666]">
                Once uploaded, this project will appear in your portfolio and can be submitted for verification.
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-md text-xs font-bold bg-[#0A66C2] hover:bg-[#084e96] text-white transition shadow-xs cursor-pointer flex items-center gap-1.5 ${
                    loading ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                >
                  <span>{loading ? "Saving Project…" : "+ Add to Portfolio"}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Connect with GitHub Modal */}
      <GitHubRepoModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        onSelectRepo={handleRepoSelected}
        darkMode={false}
        returnUrl="/student/project/add"
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default AddProject;