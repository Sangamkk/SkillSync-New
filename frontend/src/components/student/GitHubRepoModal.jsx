import { useState, useEffect, useMemo } from "react";
import {
  getGitHubStatus,
  getGitHubConnectUrl,
  fetchAuthenticatedGitHubRepos,
  disconnectGitHub,
} from "../../services/projectService";

const LANGUAGE_COLORS = {
  JavaScript: "#f1e05a",
  TypeScript: "#3178c6",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Go: "#00ADD8",
  Rust: "#dea584",
  PHP: "#4F5D95",
  Ruby: "#701516",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Solidity: "#aa6746",
  Shell: "#89e051",
  Kotlin: "#A97BFF",
  Swift: "#F05138",
};

const GitHubRepoModal = ({
  isOpen,
  onClose,
  onSelectRepo,
  darkMode = true,
  returnUrl = "/student/project/add",
}) => {
  const [connectionStatus, setConnectionStatus] = useState({
    loading: true,
    connected: false,
    username: "",
    avatarUrl: "",
    githubUrl: "",
  });

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [error, setError] = useState("");

  // Check connection status whenever modal opens
  useEffect(() => {
    if (isOpen) {
      checkStatusAndLoad();
    }
  }, [isOpen]);

  const checkStatusAndLoad = async () => {
    setError("");
    setConnectionStatus((prev) => ({ ...prev, loading: true }));
    try {
      const status = await getGitHubStatus();
      setConnectionStatus({
        loading: false,
        connected: status.connected,
        username: status.username || "",
        avatarUrl: status.avatarUrl || "",
        githubUrl: status.githubUrl || "",
      });

      if (status.connected) {
        await loadRepos();
      }
    } catch (err) {
      console.error("Failed to check GitHub status:", err);
      setConnectionStatus({
        loading: false,
        connected: false,
        username: "",
        avatarUrl: "",
        githubUrl: "",
      });
      setError(err.response?.data?.message || "Failed to check GitHub connection status.");
    }
  };

  const loadRepos = async () => {
    setLoadingRepos(true);
    setError("");
    try {
      const fetchedRepos = await fetchAuthenticatedGitHubRepos();
      setRepos(fetchedRepos);
    } catch (err) {
      console.error("Failed to fetch authenticated repos:", err);
      const msg =
        err.response?.data?.message ||
        "Could not load repositories from your GitHub account.";
      setError(msg);

      if (err.response?.data?.requireOAuth) {
        setConnectionStatus((prev) => ({ ...prev, connected: false }));
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleStartOAuth = async () => {
    setConnecting(true);
    setError("");
    try {
      const { authUrl } = await getGitHubConnectUrl(returnUrl);
      if (authUrl) {
        // Redirect user to official GitHub OAuth authorization page
        window.location.href = authUrl;
      } else {
        setError("Could not generate GitHub authorization URL.");
        setConnecting(false);
      }
    } catch (err) {
      console.error("Failed to initiate GitHub OAuth:", err);
      setError(
        err.response?.data?.message ||
          "GitHub OAuth is not configured on the server. Please check your backend configuration."
      );
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account?")) return;

    setDisconnecting(true);
    setError("");
    try {
      await disconnectGitHub();
      setConnectionStatus({
        loading: false,
        connected: false,
        username: "",
        avatarUrl: "",
        githubUrl: "",
      });
      setRepos([]);
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err);
      setError(err.response?.data?.message || "Failed to disconnect GitHub account.");
    } finally {
      setDisconnecting(false);
    }
  };

  // Distinct languages for filter dropdown
  const languages = useMemo(() => {
    const set = new Set();
    repos.forEach((r) => {
      if (r.language && r.language !== "Other") set.add(r.language);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [repos]);

  // Filtered repositories based on search and language
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      const matchesSearch =
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLang =
        selectedLanguage === "ALL" || repo.language === selectedLanguage;

      return matchesSearch && matchesLang;
    });
  }, [repos, searchQuery, selectedLanguage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl transition-all ${
          darkMode
            ? "border-white/10 bg-[#0d1322] text-white shadow-black/60"
            : "border-slate-200 bg-white text-slate-900 shadow-slate-400/40"
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            darkMode ? "border-white/10" : "border-slate-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#24292F] text-white shadow-sm">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Connect with GitHub</h2>
              <p className="text-xs text-slate-400">
                Official GitHub OAuth verification & repository linking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl text-slate-400 hover:text-white transition cursor-pointer ${
              darkMode ? "hover:bg-white/10" : "hover:bg-slate-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          {connectionStatus.loading ? (
            <div className="py-16 text-center space-y-3">
              <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" />
              <p className="text-xs text-slate-400">Checking GitHub connection status…</p>
            </div>
          ) : !connectionStatus.connected ? (
            /* OAuth Authorization Prompt */
            <div className="py-10 text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-[#24292F] flex items-center justify-center text-white shadow-xl shadow-black/40">
                <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-bold">Authorize with GitHub</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with your official GitHub account to grant SkillSync permission to view and link your repositories. Private repositories are only listed if granted.
                </p>
              </div>

              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartOAuth}
                  disabled={connecting}
                  className="w-full max-w-sm py-3.5 px-6 rounded-2xl bg-[#24292F] hover:bg-[#1a1e22] text-white text-sm font-semibold transition flex items-center justify-center gap-3 shadow-lg shadow-black/40 cursor-pointer border border-white/10"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  {connecting ? "Redirecting to GitHub…" : "Continue with GitHub"}
                </button>

                <p className="text-[11px] text-slate-500">
                  🔒 Server-side token exchange. Credentials are never exposed to browser.
                </p>
              </div>
            </div>
          ) : (
            /* Connected GitHub View */
            <div className="space-y-4">
              {/* Connected Account Bar */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  darkMode
                    ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                    : "border-emerald-200 bg-emerald-50/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  {connectionStatus.avatarUrl ? (
                    <img
                      src={connectionStatus.avatarUrl}
                      alt={connectionStatus.username}
                      className="w-9 h-9 rounded-full border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      GH
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-xs ${darkMode ? "text-white" : "text-slate-900"}`}>
                        Connected as
                      </span>
                      <a
                        href={connectionStatus.githubUrl || `https://github.com/${connectionStatus.username}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        @{connectionStatus.username}
                      </a>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        OAuth Verified ✓
                      </span>
                    </div>
                    <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                      Your GitHub account is securely linked to your SkillSync profile.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition cursor-pointer"
                >
                  {disconnecting ? "Disconnecting…" : "Disconnect"}
                </button>
              </div>

              {/* Repositories Search and Language Filters */}
              {loadingRepos ? (
                <div className="py-16 text-center space-y-3">
                  <span className="w-7 h-7 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" />
                  <p className="text-xs text-slate-400">Loading your repositories from GitHub…</p>
                </div>
              ) : repos.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="text-2xl">📂</div>
                  <p className="text-sm font-semibold">No repositories found</p>
                  <p className="text-xs text-slate-400">
                    No public or accessible private repositories were found in your GitHub account.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your repositories by name or description…"
                      className={`flex-1 px-3.5 py-2 text-xs rounded-xl border outline-none transition ${
                        darkMode
                          ? "border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-violet-500/60"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-violet-500/60"
                      }`}
                    />

                    {languages.length > 1 && (
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className={`px-3 py-2 text-xs rounded-xl border outline-none cursor-pointer ${
                          darkMode
                            ? "border-white/10 bg-[#111827] text-white"
                            : "border-slate-200 bg-white text-slate-900"
                        }`}
                      >
                        {languages.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang === "ALL" ? "All Languages" : lang}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                    <span>
                      Showing {filteredRepos.length} of {repos.length} repositories
                    </span>
                    <button
                      type="button"
                      onClick={loadRepos}
                      className="text-[11px] text-violet-400 hover:underline cursor-pointer"
                    >
                      ↻ Refresh
                    </button>
                  </div>

                  {/* Repo Cards List */}
                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {filteredRepos.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No repositories match your filter criteria.
                      </div>
                    ) : (
                      filteredRepos.map((repo) => (
                        <div
                          key={repo.id}
                          onClick={() => onSelectRepo(repo)}
                          className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            darkMode
                              ? "border-white/10 bg-white/[0.03] hover:border-violet-500/50 hover:bg-violet-500/[0.07]"
                              : "border-slate-200 bg-white hover:border-violet-400 hover:bg-violet-50/50 shadow-xs"
                          }`}
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`font-bold text-sm truncate transition ${
                                  darkMode
                                    ? "text-violet-400 group-hover:text-violet-300"
                                    : "text-[#0A66C2] group-hover:text-[#004182]"
                                }`}
                              >
                                {repo.name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  repo.isPrivate
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                }`}
                              >
                                {repo.isPrivate ? "Private" : "Public"}
                              </span>
                            </div>

                            {repo.description ? (
                              <p
                                className={`text-xs line-clamp-2 leading-relaxed ${
                                  darkMode ? "text-slate-400" : "text-slate-600"
                                }`}
                              >
                                {repo.description}
                              </p>
                            ) : (
                              <p className={`text-xs italic ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                No description
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                              {repo.language && (
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full inline-block"
                                    style={{
                                      backgroundColor:
                                        LANGUAGE_COLORS[repo.language] || "#888888",
                                    }}
                                  />
                                  <span>{repo.language}</span>
                                </span>
                              )}
                              <span>⭐ {repo.stars}</span>
                              <span>🍴 {repo.forks}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRepo(repo);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition shrink-0 cursor-pointer ${
                              darkMode
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-300 group-hover:bg-violet-600 group-hover:text-white"
                                : "border-[#0A66C2]/30 bg-[#0A66C2]/10 text-[#0A66C2] group-hover:bg-[#0A66C2] group-hover:text-white"
                            }`}
                          >
                            Select →
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-end p-4 border-t ${
            darkMode ? "border-white/10" : "border-slate-200"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition cursor-pointer ${
              darkMode
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubRepoModal;
