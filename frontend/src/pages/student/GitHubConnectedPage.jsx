import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MeshBackground from "../../components/common/MeshBackground";
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

const GitHubConnectedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const statusParam = searchParams.get("status"); // "success" | "error" | null
  const usernameParam = searchParams.get("username");
  const messageParam = searchParams.get("message");
  const returnUrlParam = searchParams.get("returnUrl") || "/student/project/add";

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("skillsync-theme") !== "light";
  });

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState({
    connected: false,
    username: usernameParam || "",
    avatarUrl: "",
    githubUrl: "",
    connectedAt: null,
  });

  const [repos, setRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("ALL");
  const [disconnecting, setDisconnecting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(messageParam || "");
  const [successBanner, setSuccessBanner] = useState(
    statusParam === "success"
      ? `GitHub account @${usernameParam || "connected"} successfully linked!`
      : ""
  );

  useEffect(() => {
    loadAccountStatus();
  }, []);

  const loadAccountStatus = async () => {
    setLoading(true);
    try {
      const data = await getGitHubStatus();
      if (data.connected) {
        setAccount({
          connected: true,
          username: data.username,
          avatarUrl: data.avatarUrl,
          githubUrl: data.githubUrl,
          connectedAt: data.connectedAt,
        });
        await loadRepos();
      } else {
        setAccount({
          connected: false,
          username: "",
          avatarUrl: "",
          githubUrl: "",
          connectedAt: null,
        });
      }
    } catch (err) {
      console.error("Failed to load GitHub status:", err);
      if (statusParam !== "error") {
        setErrorMsg("Failed to check GitHub status.");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRepos = async () => {
    setLoadingRepos(true);
    try {
      const fetched = await fetchAuthenticatedGitHubRepos();
      setRepos(fetched);
    } catch (err) {
      console.error("Failed to fetch repos:", err);
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setErrorMsg("");
    try {
      const { authUrl } = await getGitHubConnectUrl(returnUrlParam);
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error("Failed to initiate OAuth:", err);
      setErrorMsg(err.response?.data?.message || "Failed to start GitHub authorization.");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account?")) return;
    setDisconnecting(true);
    try {
      await disconnectGitHub();
      setAccount({
        connected: false,
        username: "",
        avatarUrl: "",
        githubUrl: "",
        connectedAt: null,
      });
      setRepos([]);
      setSuccessBanner("");
    } catch (err) {
      console.error("Disconnect error:", err);
      setErrorMsg("Failed to disconnect GitHub account.");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSelectRepoForProject = (repo) => {
    // Navigate to returnUrl or project creation with state
    navigate(returnUrlParam, {
      state: {
        selectedGitHubRepo: {
          name: repo.name,
          htmlUrl: repo.htmlUrl,
          description: repo.description || "",
          language: repo.language || "",
        },
      },
    });
  };

  const languages = useMemo(() => {
    const set = new Set();
    repos.forEach((r) => {
      if (r.language && r.language !== "Other") set.add(r.language);
    });
    return ["ALL", ...Array.from(set).sort()];
  }, [repos]);

  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLang = selectedLanguage === "ALL" || r.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [repos, searchQuery, selectedLanguage]);

  return (
    <div
      className={`min-h-screen px-4 py-8 sm:px-6 lg:px-8 relative font-sans transition-colors duration-300 ${
        darkMode ? "bg-[#070b14] text-slate-100" : "bg-[#F3F6F8] text-slate-900"
      }`}
    >
      <MeshBackground darkMode={darkMode} />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(returnUrlParam)}
            className={`inline-flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
              darkMode
                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                : "border-[#D9E1E8] bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
            }`}
          >
            ← Back to {returnUrlParam.includes("dashboard") ? "Dashboard" : "Project Form"}
          </button>

          <div className="flex items-center gap-2.5">
            <Link
              to="/student/dashboard"
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                darkMode
                  ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  : "border-[#D9E1E8] bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
              }`}
            >
              📊 Dashboard
            </Link>
            <Link
              to="/student/project/add"
              className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20"
            >
              + Add Project
            </Link>
          </div>
        </div>

        {/* Feedback Banners */}
        {successBanner && (
          <div className="flex items-center justify-between p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                ✓
              </span>
              <span>{successBanner}</span>
            </div>
            <button
              onClick={() => setSuccessBanner("")}
              className="text-emerald-400/70 hover:text-emerald-300 cursor-pointer text-xs"
            >
              Dismiss ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm animate-fadeIn">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Main Card */}
        <div
          className={`rounded-3xl border p-6 sm:p-8 backdrop-blur-xl transition-all ${
            darkMode
              ? "border-white/10 bg-white/[0.045] shadow-2xl shadow-black/40"
              : "border-[#D9E1E8] bg-white shadow-md"
          }`}
        >
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <span className="w-10 h-10 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" />
              <p className="text-sm text-slate-400">Verifying GitHub connection…</p>
            </div>
          ) : account.connected ? (
            /* Connected State */
            <div className="space-y-8">
              {/* Header profile row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  {account.avatarUrl ? (
                    <img
                      src={account.avatarUrl}
                      alt={account.username}
                      className="w-16 h-16 rounded-2xl border-2 border-emerald-500/40 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#24292F] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      GH
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h1 className="text-2xl font-bold">@{account.username}</h1>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Official GitHub OAuth Authentication • SkillSync Verified Developer
                    </p>
                    {account.githubUrl && (
                      <a
                        href={account.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 mt-1 underline"
                      >
                        View Profile on GitHub ↗
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadRepos}
                    disabled={loadingRepos}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      darkMode
                        ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        : "border-[#D9E1E8] bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {loadingRepos ? "Syncing…" : "🔄 Sync Repos"}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="px-3 py-2 rounded-xl text-xs font-semibold border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                  >
                    {disconnecting ? "Disconnecting…" : "Disconnect"}
                  </button>
                </div>
              </div>

              {/* Repositories Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Your Repositories</h2>
                    <p className="text-xs text-slate-400">
                      Select any repository below to instantly attach it to your SkillSync project submission.
                    </p>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 self-start sm:self-auto">
                    {filteredRepos.length} {filteredRepos.length === 1 ? "Repo" : "Repos"} Found
                  </span>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search repositories by name or description…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs outline-none transition ${
                        darkMode
                          ? "border-white/10 bg-white/5 text-white placeholder-slate-500 focus:border-violet-500/60"
                          : "border-[#D9E1E8] bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-[#0A66C2]"
                      }`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className={`rounded-xl border px-3 py-2.5 text-xs outline-none transition ${
                      darkMode
                        ? "border-white/10 bg-[#0d1322] text-white focus:border-violet-500/60"
                        : "border-[#D9E1E8] bg-white text-slate-900 focus:border-[#0A66C2]"
                    }`}
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang === "ALL" ? "All Languages" : lang}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Repos Grid */}
                {loadingRepos ? (
                  <div className="py-12 text-center space-y-3">
                    <span className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin inline-block" />
                    <p className="text-xs text-slate-400">Loading repositories from GitHub API…</p>
                  </div>
                ) : filteredRepos.length === 0 ? (
                  <div className="py-12 text-center rounded-2xl border border-dashed border-white/10 p-6 space-y-2">
                    <p className="text-sm font-semibold text-slate-300">No repositories found</p>
                    <p className="text-xs text-slate-500">
                      {searchQuery
                        ? "Try clearing your search filters."
                        : "No public or permitted repositories were returned by GitHub."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                    {filteredRepos.map((repo) => {
                      const langColor = LANGUAGE_COLORS[repo.language] || "#94a3b8";

                      return (
                        <div
                          key={repo.id}
                          className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                            darkMode
                              ? "border-white/10 bg-white/[0.03] hover:border-violet-500/50 hover:bg-white/[0.06]"
                              : "border-[#D9E1E8] bg-slate-50/70 hover:border-[#0A66C2] hover:bg-white"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-bold text-sm text-sky-400 truncate flex-1">
                                {repo.name}
                              </h3>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  repo.isPrivate
                                    ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                    : "border-slate-500/30 bg-slate-500/10 text-slate-400"
                                }`}
                              >
                                {repo.isPrivate ? "Private" : "Public"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                              {repo.description || "No description provided."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              {repo.language && (
                                <span className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: langColor }}
                                  />
                                  <span>{repo.language}</span>
                                </span>
                              )}
                              <span>★ {repo.stars || 0}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectRepoForProject(repo)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow transition cursor-pointer"
                            >
                              Attach Repo →
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Unconnected State Hero */
            <div className="py-12 text-center space-y-6 max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-[#24292F] flex items-center justify-center text-white shadow-2xl shadow-black/50">
                <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                  Developer Integration
                </span>
                <h2 className="text-2xl font-bold">Connect Your GitHub Account</h2>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Seamlessly import your repositories, showcase your code, and cryptographically verify your software projects on the SkillSync academic network.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-left space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>1-click repository import to your project submissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Direct commit & code verification for university accreditation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span>
                  <span>Private repositories supported with secure access tokens</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold bg-[#24292F] hover:bg-[#1a1e22] text-white border border-white/20 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
                <span>{connecting ? "Connecting to GitHub…" : "Authorize with GitHub"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubConnectedPage;
