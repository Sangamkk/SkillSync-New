import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getStudentProjects, getGitHubStatus } from "../../../services/projectService";
import { getMyRequests } from "../../../services/verificationService";
import GitHubRepoModal from "../../../components/student/GitHubRepoModal";
import NotificationBell from "../../../components/common/NotificationBell";
import SettingsModal from "../../../components/common/SettingsModal";
import { FaCog } from "react-icons/fa";

const ITEMS_PER_PAGE = 6;

// Reusable Pagination Bar matching Dashboard
const PaginationBar = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
  if (totalItems <= itemsPerPage) return null;
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between border-t border-[#D9E1E8] pt-4 text-xs text-[#666666] gap-2">
      <span>
        Showing {(currentPage - 1) * itemsPerPage + 1}–
        {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
        >
          ← Previous
        </button>
        <span className="px-2 font-semibold text-[#191919]">
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          type="button"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const formatHash = (value) => {
  if (!value) return "—";
  const str = String(value).toLowerCase();
  const cleaned = str.startsWith("0x") ? str : `0x${str}`;
  return cleaned.length > 20 ? `${cleaned.slice(0, 10)}...${cleaned.slice(-8)}` : cleaned;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return !isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
};

const getStatusLabel = (status) => {
  if (typeof status === "string") return status.toUpperCase();
  switch (status) {
    case 0:
      return "PENDING";
    case 1:
      return "APPROVED";
    case 2:
      return "REJECTED";
    case 3:
      return "CANCELLED";
    default:
      return "UNKNOWN";
  }
};

const MyProjects = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser = {}, logout } = useAuth();

  // Active sub-tab: "all" | "verified" | "pending" | "showcase" | "requests"
  const [subTab, setSubTab] = useState(() => searchParams.get("tab") || "all");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [gitHubStatus, setGitHubStatus] = useState({ connected: false, username: "" });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [copiedHash, setCopiedHash] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);

  // GitHub Modal
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [projsRes, reqsRes, ghRes] = await Promise.all([
        getStudentProjects().catch(() => []),
        getMyRequests().catch(() => []),
        getGitHubStatus().catch(() => ({ connected: false })),
      ]);

      setGitHubStatus({
        connected: Boolean(ghRes?.connected),
        username: ghRes?.username || "",
      });

      const rawProjects = Array.isArray(projsRes) ? projsRes : projsRes?.projects || [];
      const rawRequests = Array.isArray(reqsRes) ? reqsRes : reqsRes?.requests || [];

      const projectRequests = rawRequests.filter(
        (r) => r.requestType === "project" || r.project
      );
      setRequests(projectRequests);

      const enriched = rawProjects.map((p) => {
        const pId = String(p._id || "");
        const pHash = String(p.githubHash || p.projectHash || "").toLowerCase();

        const matching = projectRequests.filter((r) => {
          const reqProjId = String(r.project?._id || r.project || "");
          const reqHash = String(r.credentialHash || "").toLowerCase();
          return (reqProjId && reqProjId === pId) || (reqHash && pHash && reqHash === pHash);
        });

        const isVerified = Boolean(
          p.isVerified ||
          String(p.status).toUpperCase() === "APPROVED" ||
          matching.some((r) => String(r.status).toUpperCase() === "APPROVED" || r.status === 1)
        );

        let category = "SHOWCASE";
        if (String(p.status || "").toUpperCase() === "REJECTED") {
          category = "REJECTED";
        } else if (isVerified) {
          category = "VERIFIED";
        } else if (matching.length > 0) {
          category = "PENDING";
        }

        return {
          ...p,
          isVerified,
          matchingRequests: matching,
          category,
        };
      });

      setProjects(enriched);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (tab) => {
    setSubTab(tab);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setSearchParams(params, { replace: true });
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const handleSignOut = () => {
    if (logout) logout();
    navigate("/login");
  };

  // Metrics
  const stats = useMemo(() => {
    const verified = projects.filter((p) => p.isVerified).length;
    const pending = projects.filter((p) => p.category === "PENDING").length;
    const showcase = projects.filter((p) => p.category === "SHOWCASE").length;
    return { total: projects.length, verified, pending, showcase };
  }, [projects]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Sub-tab filter
      if (subTab === "verified" && !p.isVerified) return false;
      if (subTab === "pending" && p.category !== "PENDING") return false;
      if (subTab === "showcase" && p.category !== "SHOWCASE") return false;

      // Type filter
      if (typeFilter !== "ALL" && (p.projectType || "").toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (p.projectName || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const link = (p.githubLink || "").toLowerCase();
        if (!title.includes(q) && !desc.includes(q) && !link.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [projects, subTab, typeFilter, searchQuery]);

  // Paginated Projects
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProjects, currentPage]);

  // Paginated Requests
  const totalReqPages = Math.ceil(requests.length / ITEMS_PER_PAGE);
  const paginatedRequests = useMemo(() => {
    const start = (requestsPage - 1) * ITEMS_PER_PAGE;
    return requests.slice(start, start + ITEMS_PER_PAGE);
  }, [requests, requestsPage]);

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* ─── Top Header Welcome Bar ────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-1.5">
              🎓 Verified Applicant Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
              Welcome back, {currentUser.name?.split(" ")[0] || "Student"} 👋
            </h1>
            <p className="mt-1 text-xs text-[#666666]">
              {currentUser.headline ? `${currentUser.headline} · ` : ""}
              Manage technical project credentials, connect GitHub repositories, and request blockchain verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Link
              to="/student/profile"
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition shadow-xs flex items-center gap-1.5"
            >
              <span>👤</span>
              <span>View Profile</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings & Account"
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] hover:border-[#0A66C2]/40 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FaCog className="text-sm text-[#555555]" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Global Settings & Preferences Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

        {/* ─── 3 KPI Cards ────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: All Projects */}
          <div
            onClick={() => handleTabChange("all")}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              subTab === "all"
                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                PROJECT PORTFOLIO
              </span>
              <span className="text-base">💼</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0A66C2]">
              {projects.length} <span className="text-xs font-normal text-[#666666]">in portfolio</span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {stats.verified} verified on-chain · {stats.pending} in review
            </p>
            <p className="mt-1 text-[11px] text-[#0A66C2] font-semibold">
              Browse all projects & code →
            </p>
          </div>

          {/* Card 2: Verification Requests */}
          <div
            onClick={() => handleTabChange("requests")}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              subTab === "requests"
                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                REQUEST VERIFICATION
              </span>
              <span className="text-base text-[#0A66C2]">🛡️</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#B06000]">
              {requests.filter((r) => r.status === "PENDING" || r.status === 0).length}{" "}
              <span className="text-xs font-normal text-[#666666]">pending review</span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {stats.verified} verified credentials on chain
            </p>
            <p className="mt-1 text-[11px] text-[#B06000] font-semibold">
              View verification requests →
            </p>
          </div>

          {/* Card 3: GitHub Integration */}
          <div
            onClick={() => navigate("/student/github-connected")}
            className="p-4 rounded-xl border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                GITHUB INTEGRATION
              </span>
              <span className="text-base">🐙</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#16805D]">
              {gitHubStatus.connected ? `@${gitHubStatus.username}` : "Connect"}{" "}
              <span className="text-xs font-normal text-[#666666]">
                {gitHubStatus.connected ? "linked" : "account"}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {gitHubStatus.connected ? "OAuth live sync active" : "Link repositories directly to portfolio"}
            </p>
            <p className="mt-1 text-[11px] text-[#16805D] font-semibold">
              {gitHubStatus.connected ? "Browse GitHub Repositories →" : "Connect with GitHub now →"}
            </p>
          </div>
        </div>

        {/* ─── Sub-Tab Navigation Bar ──────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#D9E1E8] pb-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange("all")}
              className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                subTab === "all"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              <span>💼 All Projects</span>
              <span className="text-[11px] font-normal opacity-80">({projects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("verified")}
              className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                subTab === "verified"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              <span>✓ Verified</span>
              <span className="text-[11px] font-normal opacity-80">({stats.verified})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("pending")}
              className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                subTab === "pending"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              <span>⏳ In Review</span>
              <span className="text-[11px] font-normal opacity-80">({stats.pending})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("showcase")}
              className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                subTab === "showcase"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              <span>💻 Showcase</span>
              <span className="text-[11px] font-normal opacity-80">({stats.showcase})</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("requests")}
              className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                subTab === "requests"
                  ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              <span>📝 Verification Requests</span>
              <span className="text-[11px] font-normal opacity-80">({requests.length})</span>
            </button>
          </div>

          {/* ─── Main Content White Card ──────────────────────── */}
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
            {subTab === "requests" ? (
              /* Verification Requests Tab */
              <div>
                <div className="mb-4 pb-3 border-b border-[#D9E1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#191919]">Project Verification Requests</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Track academic and organisation review requests submitted on Sepolia blockchain.
                    </p>
                  </div>
                  <Link
                    to="/student/project/verify"
                    className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#0A66C2] hover:bg-[#084e96] text-white transition self-start sm:self-auto cursor-pointer"
                  >
                    + Submit New Request
                  </Link>
                </div>

                {loading ? (
                  <div className="p-10 text-center text-xs text-[#666666]">
                    Loading verification requests…
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                    No verification requests submitted yet. Select any project to request organisation accreditation.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {paginatedRequests.map((req, idx) => {
                        const statusLabel = getStatusLabel(req.status);
                        const isApproved = statusLabel === "APPROVED" || statusLabel === "VERIFIED";
                        const isPending = statusLabel === "PENDING";
                        const isRejected = statusLabel === "REJECTED";

                        return (
                          <div
                            key={req._id || idx}
                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition text-xs flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-[#191919] text-sm">
                                  {req.project?.projectName || "Technical Project"}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isApproved
                                      ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                                      : isPending
                                      ? "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30"
                                      : isRejected
                                      ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                                      : "bg-[#F3F6F8] text-[#666666] border-[#D9E1E8]"
                                  }`}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <p className="text-[#666666] mt-1">
                                Reviewer:{" "}
                                <strong className="text-[#0A66C2]">
                                  {req.organisation?.organisationName || req.organisation?.email || "Partner Organisation"}
                                </strong>
                              </p>

                              {req.createdAt && (
                                <p className="text-[#666666] text-[11px] mt-0.5">
                                  Submitted: {formatDate(req.createdAt)}
                                </p>
                              )}

                              {req.rejectionReason && (
                                <p className="mt-2 text-[11px] text-[#C5221F] bg-[#FCE8E6] p-2 rounded">
                                  Reason: {req.rejectionReason}
                                </p>
                              )}
                            </div>

                            {req.blockchainRequestId && (
                              <div className="mt-3 pt-2 border-t border-[#D9E1E8] text-[11px] text-[#666666] flex items-center justify-between">
                                <span>Request #{req.blockchainRequestId}</span>
                                <span className="font-mono text-[#0A66C2]">On-Chain</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <PaginationBar
                      currentPage={requestsPage}
                      totalPages={totalReqPages}
                      totalItems={requests.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setRequestsPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* Projects View */
              <div>
                <div className="mb-4 pb-3 border-b border-[#D9E1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#191919]">Browse Verified Project Portfolio</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Showcase software, engineering, and research work to recruiters with GitHub code and blockchain proof.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowGitHubModal(true)}
                      className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-[#F3F6F8] text-[#191919] hover:bg-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>🐙</span> Connect GitHub
                    </button>
                    <Link
                      to="/student/project/add"
                      className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#0A66C2] hover:bg-[#084e96] text-white transition shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>+</span> Upload Project
                    </Link>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Search projects by title, tech stack, or description..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />

                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Classifications</option>
                    <option value="Academic">Academic / University Project</option>
                    <option value="Personal">Personal Side Project</option>
                    <option value="Industry">Industry / Client Work</option>
                    <option value="OpenSource">Open Source Contribution</option>
                  </select>

                  <select
                    value={subTab}
                    onChange={(e) => handleTabChange(e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Verification Statuses</option>
                    <option value="verified">Verified On-Chain Only</option>
                    <option value="pending">In Review / Pending</option>
                    <option value="showcase">Showcase Only</option>
                  </select>
                </div>

                {/* Projects Grid matching Dashboard Job Cards */}
                {loading ? (
                  <div className="p-12 text-center text-xs text-[#666666]">
                    Loading your student projects…
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg space-y-2">
                    <p className="font-semibold text-[#191919]">No projects found</p>
                    <p className="text-[11px]">
                      {searchQuery
                        ? "Try clearing your search terms or filters."
                        : "Upload a project or import from your GitHub account to showcase in your portfolio."}
                    </p>
                    <div className="pt-2 flex justify-center gap-2">
                      <Link
                        to="/student/project/add"
                        className="px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#0A66C2] text-white hover:bg-[#084e96]"
                      >
                        + Add Project
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {paginatedProjects.map((project) => {
                        const hash = project.githubHash || project.projectHash;
                        const isVerified = project.isVerified;
                        const isPending = project.category === "PENDING";
                        const isRejected = project.category === "REJECTED";

                        return (
                          <div
                            key={project._id}
                            className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2]/50 transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-sm font-bold text-[#191919]">
                                    {project.projectName}
                                  </h3>
                                  {project.githubLink && (
                                    <a
                                      href={project.githubLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs font-medium text-[#0A66C2] hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <span>🔗</span>
                                      <span className="truncate max-w-[200px] sm:max-w-[260px]">
                                        {project.githubLink.replace("https://github.com/", "")}
                                      </span>
                                    </a>
                                  )}
                                </div>

                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                                    isVerified
                                      ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                                      : isPending
                                      ? "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30"
                                      : isRejected
                                      ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                                      : "bg-[#E8F3FF] text-[#0A66C2] border-[#0A66C2]/20"
                                  }`}
                                >
                                  {isVerified
                                    ? "Verified"
                                    : isPending
                                    ? "Pending Review"
                                    : isRejected
                                    ? "Rejected"
                                    : project.projectType || "Showcase"}
                                </span>
                              </div>

                              <p className="text-xs text-[#666666] mt-2 flex flex-wrap items-center gap-2">
                                <span>📁 {project.projectType || "Academic Project"}</span>
                                {project.createdAt && (
                                  <>
                                    <span>·</span>
                                    <span>⏱ {formatDate(project.createdAt)}</span>
                                  </>
                                )}
                              </p>

                              {project.description && (
                                <p className="text-xs text-[#666666] mt-2 line-clamp-2 leading-relaxed">
                                  {project.description}
                                </p>
                              )}

                              {hash && (
                                <div className="mt-2.5 flex items-center gap-1 text-[11px] text-[#666666]">
                                  <span className="font-semibold text-slate-500">Hash:</span>
                                  <span className="font-mono text-[#0A66C2] bg-[#F3F6F8] px-1.5 py-0.5 rounded border border-[#D9E1E8]">
                                    {formatHash(hash)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(hash)}
                                    className="text-slate-400 hover:text-[#0A66C2] cursor-pointer ml-1"
                                    title="Copy SHA-256 Hash"
                                  >
                                    {copiedHash === hash ? "✓" : "📋"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-[#D9E1E8] flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                {project.githubLink && (
                                  <a
                                    href={project.githubLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#0A66C2] hover:underline"
                                  >
                                    GitHub ↗
                                  </a>
                                )}
                                <Link
                                  to="/student/project-history"
                                  className="text-[#666666] hover:text-[#191919] hover:underline text-[11px]"
                                >
                                  History
                                </Link>
                              </div>

                              {!isVerified && !isRejected ? (
                                <Link
                                  to={`/student/project/verify?type=project&projectId=${encodeURIComponent(
                                    project._id
                                  )}`}
                                  className="px-3.5 py-1.5 rounded-md font-bold text-xs bg-[#0A66C2] hover:bg-[#084e96] text-white transition shadow-xs cursor-pointer"
                                >
                                  Request Verification
                                </Link>
                              ) : isVerified ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-[#137333]">
                                  <span>✓</span> Verified on Sepolia
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <PaginationBar
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={filteredProjects.length}
                      itemsPerPage={ITEMS_PER_PAGE}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Repo Modal */}
      <GitHubRepoModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        onSelectRepo={(repo) => {
          setShowGitHubModal(false);
          navigate("/student/project/add", {
            state: {
              selectedGitHubRepo: {
                name: repo.name,
                htmlUrl: repo.htmlUrl,
                description: repo.description || "",
                language: repo.language || "",
              },
            },
          });
        }}
        darkMode={false}
        returnUrl="/student/projects"
      />
    </div>
  );
};

export default MyProjects;
