<<<<<<< Updated upstream
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getProfile } from "../../services/studentService";
import { getStudentCertificates } from "../../services/certificateService";
import { getStudentProjectsFromBlockchain, getStudentEmploymentOnChain } from "../../services/blockchainServices/blockchainService";
import { getMyApplications, getMyOffers } from "../../services/employmentService";
import { getStudentProjects } from "../../services/projectService";
import { getStudentRequests } from "../../services/requestService";
import { useNavigate, Link } from "react-router-dom";
import MeshBackground from "../../components/common/MeshBackground";
import ProfessionalProfile from "../../components/common/ProfessionalProfile";
import ApplicantManagerAbi from "../../abhi/ApplicantManager.json";

const normalizeToArray = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") {
        if (Array.isArray(value.certificates)) return value.certificates;
        if (Array.isArray(value.projects)) return value.projects;
        if (Array.isArray(value.projectHashes)) return value.projectHashes;
        if (Array.isArray(value.data)) return value.data;
        if (Array.isArray(value.items)) return value.items;
        if (Array.isArray(value.results)) return value.results;
        if (typeof value[Symbol.iterator] === "function") return Array.from(value);
        return [];
    }
    return [];
};

const normalizeHash = (value) => {
    if (!value) return "";
    const text = String(value).toLowerCase();
    return text.startsWith("0x") ? text : `0x${text}`;
};

const formatHash = (value) => {
    if (!value) return "—";
    const hash = normalizeHash(value);
    return hash.length > 18 ? `${hash.slice(0, 12)}...${hash.slice(-10)}` : hash;
};

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [studentId, setStudentId] = useState(null);
    const [projects, setProjects] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [employmentHistory, setEmploymentHistory] = useState({ currentEmployment: [], previousEmployment: [] });
    const [stats, setStats] = useState({ certificates: 0, verifiedCertificates: 0, projects: 0, approvedProjects: 0, offers: 0, applications: 0 });
    const [darkMode] = useState(() => localStorage.getItem("skillsync-theme") !== "light");
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfileAndStats();
    }, []);

    const fetchProfileAndStats = async () => {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) return;

            const userData = JSON.parse(userStr);
            const walletAddress = userData.walletAddress;
            const profile = await getProfile(walletAddress);
            setUser(profile);

            const resolvedStudentId = profile?._id || userData.id || userData._id;
            setStudentId(resolvedStudentId);
            const blockchainProjectStats = await getStudentProjectsFromBlockchain(walletAddress);
            const projectMetadata = await getStudentProjects(studentId).catch(() => []);
            const requests = await getStudentRequests().catch(() => []);

            const [certs, apps, offers] = await Promise.all([
                getStudentCertificates(resolvedStudentId).catch(() => []),
                getMyApplications().catch(() => []),
                getMyOffers().catch(() => [])
            ]);

            const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com");
            const contract = new ethers.Contract(import.meta.env.VITE_APPLICANT_MANAGER_ADDRESS, ApplicantManagerAbi.abi, provider);

            const metadataMap = new Map(
                (Array.isArray(projectMetadata) ? projectMetadata : []).map((project) => [normalizeHash(project.githubHash || project.projectHash || project._id), project])
            );

            const projectHashes = normalizeToArray(blockchainProjectStats?.projectHashes ?? blockchainProjectStats?.projects ?? []);
            const projectRecords = await Promise.all(
                projectHashes.map(async (projectHash) => {
                    const normalizedHash = normalizeHash(projectHash);
                    const metadata = metadataMap.get(normalizedHash) || metadataMap.get(normalizeHash(String(projectHash).replace(/^0x/, ""))) || {};

                    let verifications = [];
                    try {
                        verifications = await contract.getProjectVerifications(normalizedHash);
                    } catch (error) {
                        console.warn("Verification fetch failed for project hash:", normalizedHash, error);
                    }

                    const history = [
                        ...(Array.isArray(verifications) ? verifications : []).map((item) => ({
                            label: item.revoked ? "REVOKED" : "VERIFIED",
                            verifier: item.verifier,
                            wallet: item.verifier,
                            verifiedAt: Number(item.verifiedAt),
                            revoked: Boolean(item.revoked)
                        })),
                        ...requests
                            .filter((request) => normalizeHash(request.credentialHash) === normalizedHash)
                            .map((request) => ({
                                label: "PENDING",
                                expectedVerifier: request.expectedVerifier,
                                requestId: request.id,
                                createdAt: Number(request.createdAt),
                                wallet: request.expectedVerifier
                            }))
                    ];

                    return {
                        hash: normalizedHash,
                        name: metadata.projectName || "Project",
                        projectType: metadata.projectType || "Project",
                        githubLink: metadata.githubLink || "",
                        description: metadata.description || "",
                        isVerified: await contract.isProjectVerified(normalizedHash).catch(() => false),
                        onChainRegistered: true,
                        verificationHistory: history
                    };
                })
            );

            const certList = normalizeToArray(certs);
            const appList = normalizeToArray(apps);
            const offerList = normalizeToArray(offers);
            const employmentOnChain = walletAddress ? await getStudentEmploymentOnChain(walletAddress) : { currentEmployment: [], previousEmployment: [] };

            setProjects(projectRecords);
            setCertificates(certList);
            setEmploymentHistory(employmentOnChain);

            setStats({
                certificates: certList.length,
                verifiedCertificates: certList.filter((c) => c.verificationStatus === "Verified").length,
                projects: Number(blockchainProjectStats?.projects ?? projectRecords.length ?? 0),
                approvedProjects: Number(blockchainProjectStats?.verifiedProjects ?? 0),
                applications: appList.length,
                offers: offerList.filter((o) => o.status === "Offered" || o.status === "Pending").length
            });
        } catch (error) {
            console.error("Dashboard profile/stats fetch error:", error);
        }
    };

    const nxtPage = () => navigate("/certificate");

    return (
        <div className={`relative min-h-screen overflow-hidden px-6 py-10 transition-colors duration-500 ${darkMode ? "bg-[#070B14] text-white" : "bg-[#F6F8FC] text-slate-900"}`}>
            <MeshBackground darkMode={darkMode} />
            <div className={`pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full blur-[130px] ${darkMode ? "bg-blue-600/15" : "bg-blue-500/10"}`} />
            <div className={`pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full blur-[130px] ${darkMode ? "bg-violet-600/15" : "bg-violet-500/10"}`} />

            <div className="relative z-10 mx-auto max-w-6xl">
                <div className={`mb-6 rounded-3xl border p-7 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"}`}>
                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">Student Dashboard</p>
                            <h1 className={`mt-2 text-3xl font-bold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                                Welcome back{user?.name ? `, ${user.name}` : ""}
                            </h1>
                            <p className={`mt-2 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                Manage your digital identity and professional credentials.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:items-center">
                            <Link to="/student/jobs" className="rounded-xl bg-blue-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600">💼 Browse Jobs</Link>
                            <Link to="/student/offers" className="rounded-xl bg-violet-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-600">✉ Offers {stats.offers > 0 && `(${stats.offers})`}</Link>
                            <Link to="/student/project/add" className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700">🚀 Add Project</Link>
                            <Link to="/student/projects" className="rounded-xl bg-slate-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-600">📁 My Projects</Link>
                            <Link to="/student/project/verify" className="rounded-xl bg-indigo-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-600">📜 Request Verification</Link>
                        </div>
                    </div>
                </div>

                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificates</p><span className="text-lg">📜</span></div>
                        <div className="mt-3 flex items-baseline justify-between"><p className="text-2xl font-bold">{stats.certificates}</p><span className="text-xs font-semibold text-emerald-400">{stats.verifiedCertificates} Verified</span></div>
                    </div>
                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Projects</p><span className="text-lg">📂</span></div>
                        <div className="mt-3 flex items-baseline justify-between"><p className="text-2xl font-bold">{stats.projects}</p><span className="text-xs font-semibold text-emerald-400">{stats.approvedProjects} Verified</span></div>
                    </div>
                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Applications</p><span className="text-lg">💼</span></div>
                        <div className="mt-3 flex items-baseline justify-between"><p className="text-2xl font-bold">{stats.applications}</p><span className="text-xs text-slate-400">Submitted</span></div>
                    </div>
                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job Offers</p><span className="text-lg">✉</span></div>
                        <div className="mt-3 flex items-baseline justify-between"><p className="text-2xl font-bold">{stats.offers}</p><span className="text-xs font-semibold text-violet-400">Pending Action</span></div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_0.7fr]">
                    <div className={`rounded-3xl border p-7 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Profile</p>
                                <h2 className={`mt-2 text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Student Information</h2>
                            </div>
                            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>◈</div>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className={`rounded-2xl p-5 ${darkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                                <p className="text-xs uppercase tracking-wider text-slate-500">Full Name</p>
                                <p className={`mt-2 font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{user?.name || "—"}</p>
                            </div>
                            <div className={`rounded-2xl p-5 ${darkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                                <p className="text-xs uppercase tracking-wider text-slate-500">Email</p>
                                <p className={`mt-2 break-all font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{user?.email || "—"}</p>
                            </div>
                            <div className={`rounded-2xl p-5 ${darkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                                <p className="text-xs uppercase tracking-wider text-slate-500">USN</p>
                                <p className={`mt-2 font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{user?.usn || "—"}</p>
                            </div>
                            <div className={`rounded-2xl p-5 ${darkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                                <p className="text-xs uppercase tracking-wider text-slate-500">College</p>
                                <p className={`mt-2 font-semibold ${darkMode ? "text-slate-100" : "text-slate-800"}`}>{user?.college || "—"}</p>
                            </div>
                        </div>

                        <div className={`mt-4 rounded-2xl border p-5 ${darkMode ? "border-blue-500/10 bg-blue-500/[0.04]" : "border-blue-100 bg-blue-50/50"}`}>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-lg">🦊</div>
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-wider text-slate-500">Connected Wallet</p>
                                    <p className={`mt-1 break-all font-mono text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{user?.walletAddress || "—"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`relative overflow-hidden rounded-3xl border p-7 backdrop-blur-xl ${darkMode ? "border-white/10 bg-[#111827]/90" : "border-slate-200 bg-white/85 shadow-sm"}`}>
                        <div className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[80px] ${darkMode ? "bg-blue-600/15" : "bg-blue-500/10"}`} />
                        <div className="relative">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-500">Digital Identity</p>
                            <div className="mt-8 flex items-center justify-center">
                                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-blue-500/20 bg-gradient-to-br from-blue-600/10 to-violet-600/10">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-3xl font-bold text-white shadow-xl shadow-blue-500/20">
                                        {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-7 text-center">
                                <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>{user?.name || "Student"}</h3>
                                <p className="mt-1 text-sm text-slate-500">{user?.role || "STUDENT"}</p>
                            </div>
                            <div className={`mt-7 rounded-2xl border p-4 text-center ${darkMode ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-emerald-200 bg-emerald-50"}`}>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-semibold text-emerald-500">Identity Active</span>
                                </div>
                                <p className="mt-2 text-xs text-slate-500">Connected to SkillSync blockchain</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>Hello</div>

                <Link
                    to="/student/project-history"
                    className="rounded-xl bg-indigo-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-600"
                >
                    📜 Project History
                </Link>

                <div>Hello</div>
                <div className={`mt-6 rounded-3xl border p-7 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"}`}>
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">Credentials</p>
                            <h2 className={`mt-2 text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Manage Certificates</h2>
                            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Upload and manage your academic and professional certificates.</p>
                        </div>
                        <button onClick={nxtPage} className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">View Certificates →</button>
                    </div>
                </div>
            </div>
        </div>
    );
=======
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAllJobs,
  applyToJob,
  getMyApplications,
  getMyOffers,
  acceptOffer,
  rejectOffer,
} from "../../services/employmentService";
import {
  getCertificates,
  uploadCertificate,
  getCertificateDocument,
} from "../../services/certificateService";
import {
  getStudentProjects,
  createProject,
} from "../../services/projectService";
import {
  createVerificationRequest,
  createProjectVerificationRequest,
  getMyRequests,
  cancelRequest,
} from "../../services/verificationService";
import { getVerifiedOrganisations } from "../../services/organisationService";
import { formatTimeAgo, formatSalary } from "./Jobs";

const ITEMS_PER_PAGE = 6;

// Reusable Pagination Bar
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
>>>>>>> Stashed changes
};

export default function StudentDashboard() {
  const { currentUser = {}, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 3 Main Sections: "jobs", "verify", "upload" — Defaults to "jobs"
  const [mainSection, setMainSection] = useState(() => searchParams.get("section") || "jobs");

  // Sub-tabs:
  // Jobs: "browse" | "applied" | "offered" (Defaults to "browse")
  const [jobsSubTab, setJobsSubTab] = useState(() => searchParams.get("tab") || "browse");
  // Verification: "cert-verify" | "project-verify"
  const [verifySubTab, setVerifySubTab] = useState("cert-verify");
  // Upload: "cert-upload" | "project-upload"
  const [uploadSubTab, setUploadSubTab] = useState("cert-upload");

  // Global Data States
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [myApplications, setMyApplications] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [organisations, setOrganisations] = useState([]);

  // Filter & Search states
  const [jobSearch, setJobSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("ALL");
  const [jobLocationFilter, setJobLocationFilter] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [offersSearch, setOffersSearch] = useState("");

  // Pagination states
  const [pageBrowseJobs, setPageBrowseJobs] = useState(1);
  const [pageApplied, setPageApplied] = useState(1);
  const [pageOffers, setPageOffers] = useState(1);
  const [pageCertReqs, setPageCertReqs] = useState(1);
  const [pageProjectReqs, setPageProjectReqs] = useState(1);

  // Action status messages
  const [actionStatus, setActionStatus] = useState({ id: null, type: "", text: "" });
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [processingOfferId, setProcessingOfferId] = useState(null);
  const [viewingDocId, setViewingDocId] = useState(null);

  // Forms: Request Verification
  const [certVerifyForm, setCertVerifyForm] = useState({ certificateId: "", organisationId: "", notes: "" });
  const [projectVerifyForm, setProjectVerifyForm] = useState({ projectId: "", organisationId: "" });
  const [submittingVerify, setSubmittingVerify] = useState(false);

  // Forms: Upload Certificate
  const [certUploadForm, setCertUploadForm] = useState({
    certificateName: "",
    issuer: "",
    certificateType: "Course",
    issueDate: "",
    hasExpiry: "no",
    expiryDate: "",
    description: "",
  });
  const [certFile, setCertFile] = useState(null);
  const [submittingCertUpload, setSubmittingCertUpload] = useState(false);

  // Forms: Upload Project
  const [projectUploadForm, setProjectUploadForm] = useState({
    projectName: "",
    projectType: "Academic",
    githubLink: "",
    liveDemo: "",
    description: "",
  });
  const [submittingProjectUpload, setSubmittingProjectUpload] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  // Sync state with URL params
  const handleSwitchSection = (section, tab = null) => {
    setMainSection(section);
    const params = new URLSearchParams(searchParams);
    params.set("section", section);
    if (tab) {
      params.set("tab", tab);
      if (section === "jobs") setJobsSubTab(tab);
      if (section === "verify") setVerifySubTab(tab);
      if (section === "upload") setUploadSubTab(tab);
    } else {
      params.delete("tab");
    }
    setSearchParams(params, { replace: true });
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        jobsRes,
        appsRes,
        offersRes,
        certsRes,
        projsRes,
        reqsRes,
        orgsRes,
      ] = await Promise.allSettled([
        getAllJobs(),
        getMyApplications(),
        getMyOffers(),
        getCertificates(),
        getStudentProjects(),
        getMyRequests(),
        getVerifiedOrganisations(),
      ]);

      const jobsData = jobsRes.status === "fulfilled" && Array.isArray(jobsRes.value) ? jobsRes.value : [];
      setJobs(jobsData);

      const appsData = appsRes.status === "fulfilled" && Array.isArray(appsRes.value) ? appsRes.value : [];
      setMyApplications(appsData);
      setAppliedJobIds(
        new Set(appsData.map((app) => (typeof app.job === "object" ? app.job?._id : app.job)).filter(Boolean))
      );

      const offersData = offersRes.status === "fulfilled" && Array.isArray(offersRes.value) ? offersRes.value : [];
      setMyOffers(offersData);

      const certsRaw = certsRes.status === "fulfilled" ? certsRes.value : null;
      const certsList = Array.isArray(certsRaw?.certificates)
        ? certsRaw.certificates
        : Array.isArray(certsRaw)
        ? certsRaw
        : [];
      setCertificates(certsList);

      const projsRaw = projsRes.status === "fulfilled" ? projsRes.value : null;
      const projsList = Array.isArray(projsRaw?.projects)
        ? projsRaw.projects
        : Array.isArray(projsRaw)
        ? projsRaw
        : [];
      setProjects(projsList);

      const reqsRaw = reqsRes.status === "fulfilled" ? reqsRes.value : null;
      const reqsList = Array.isArray(reqsRaw?.requests)
        ? reqsRaw.requests
        : Array.isArray(reqsRaw)
        ? reqsRaw
        : [];
      setMyRequests(reqsList);

      const orgsData = orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value) ? orgsRes.value : [];
      setOrganisations(orgsData);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  // ─── Section 1: Jobs Actions ────────────────────────────────────────────────
  const handleApply = async (jobId) => {
    setApplyingJobId(jobId);
    setActionStatus({ id: jobId, type: "info", text: "Submitting application…" });
    try {
      await applyToJob(jobId);
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      setActionStatus({ id: jobId, type: "success", text: "✓ Application submitted successfully!" });
      // Refresh applications
      const apps = await getMyApplications().catch(() => []);
      setMyApplications(Array.isArray(apps) ? apps : []);
    } catch (err) {
      setActionStatus({
        id: jobId,
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to submit application.",
      });
    } finally {
      setApplyingJobId(null);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    setProcessingOfferId(offerId);
    setActionStatus({ id: offerId, type: "info", text: "Confirming acceptance on-chain…" });
    try {
      const res = await acceptOffer(offerId);
      setActionStatus({
        id: offerId,
        type: "success",
        text: res?.txHash ? `✓ Offer accepted! On-chain Tx: ${res.txHash.slice(0, 14)}…` : "✓ Offer accepted successfully!",
      });
      const offers = await getMyOffers().catch(() => []);
      setMyOffers(Array.isArray(offers) ? offers : []);
    } catch (err) {
      setActionStatus({
        id: offerId,
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to accept offer.",
      });
    } finally {
      setProcessingOfferId(null);
    }
  };

  const handleRejectOffer = async (offerId) => {
    if (!window.confirm("Are you sure you want to decline this job offer?")) return;
    setProcessingOfferId(offerId);
    setActionStatus({ id: offerId, type: "info", text: "Processing decline…" });
    try {
      await rejectOffer(offerId);
      setActionStatus({ id: offerId, type: "success", text: "✓ Offer declined." });
      const offers = await getMyOffers().catch(() => []);
      setMyOffers(Array.isArray(offers) ? offers : []);
    } catch (err) {
      setActionStatus({
        id: offerId,
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to decline offer.",
      });
    } finally {
      setProcessingOfferId(null);
    }
  };

  // ─── Section 2: Request Verification Actions ────────────────────────────────
  const handleCertVerifySubmit = async (e) => {
    e.preventDefault();
    if (!certVerifyForm.certificateId || !certVerifyForm.organisationId) {
      setActionStatus({ type: "error", text: "Please select both a certificate and an organisation." });
      return;
    }
    setSubmittingVerify(true);
    setActionStatus({ type: "", text: "" });
    try {
      await createVerificationRequest({
        certificateId: certVerifyForm.certificateId,
        organisationId: certVerifyForm.organisationId,
        notes: certVerifyForm.notes,
      });
      setActionStatus({
        type: "success",
        text: "✓ Certificate verification request sent to organisation for review!",
      });
      setCertVerifyForm({ certificateId: "", organisationId: "", notes: "" });
      const reqs = await getMyRequests().catch(() => []);
      setMyRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      setActionStatus({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to submit certificate verification request.",
      });
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleProjectVerifySubmit = async (e) => {
    e.preventDefault();
    if (!projectVerifyForm.projectId || !projectVerifyForm.organisationId) {
      setActionStatus({ type: "error", text: "Please select both a project and an organisation." });
      return;
    }
    setSubmittingVerify(true);
    setActionStatus({ type: "", text: "" });
    try {
      await createProjectVerificationRequest({
        projectId: projectVerifyForm.projectId,
        organisationId: projectVerifyForm.organisationId,
      });
      setActionStatus({
        type: "success",
        text: "✓ Project verification request sent to organisation for review!",
      });
      setProjectVerifyForm({ projectId: "", organisationId: "" });
      const reqs = await getMyRequests().catch(() => []);
      setMyRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      setActionStatus({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to submit project verification request.",
      });
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Cancel this pending verification request?")) return;
    try {
      await cancelRequest(requestId);
      setActionStatus({ type: "success", text: "✓ Verification request cancelled." });
      const reqs = await getMyRequests().catch(() => []);
      setMyRequests(Array.isArray(reqs) ? reqs : []);
    } catch (err) {
      setActionStatus({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to cancel request.",
      });
    }
  };

  // ─── Section 3: Upload Actions ──────────────────────────────────────────────
  const handleUploadCertSubmit = async (e) => {
    e.preventDefault();
    setActionStatus({ type: "", text: "" });
    if (!certFile) {
      setActionStatus({ type: "error", text: "Please attach a certificate file (PDF, PNG, JPG)." });
      return;
    }
    if (!certUploadForm.certificateName || !certUploadForm.issuer || !certUploadForm.issueDate) {
      setActionStatus({ type: "error", text: "Please complete Certificate Name, Issuer, and Issue Date." });
      return;
    }

    setSubmittingCertUpload(true);
    try {
      const payload = new FormData();
      payload.append("student", currentUser._id || currentUser.id);
      payload.append("certificateName", certUploadForm.certificateName);
      payload.append("issuer", certUploadForm.issuer);
      payload.append("certificateType", certUploadForm.certificateType);
      payload.append("issueDate", certUploadForm.issueDate);
      if (certUploadForm.hasExpiry === "yes" && certUploadForm.expiryDate) {
        payload.append("expiryDate", certUploadForm.expiryDate);
      }
      payload.append("description", certUploadForm.description);
      payload.append("certificate", certFile);

      await uploadCertificate(payload);
      setActionStatus({
        type: "success",
        text: `✓ "${certUploadForm.certificateName}" uploaded successfully!`,
      });
      setCertUploadForm({
        certificateName: "",
        issuer: "",
        certificateType: "Course",
        issueDate: "",
        hasExpiry: "no",
        expiryDate: "",
        description: "",
      });
      setCertFile(null);

      // Refresh certificates
      const certs = await getCertificates().catch(() => []);
      setCertificates(Array.isArray(certs?.certificates) ? certs.certificates : Array.isArray(certs) ? certs : []);
    } catch (err) {
      setActionStatus({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to upload certificate.",
      });
    } finally {
      setSubmittingCertUpload(false);
    }
  };

  const handleUploadProjectSubmit = async (e) => {
    e.preventDefault();
    setActionStatus({ type: "", text: "" });
    if (!projectUploadForm.projectName.trim() || !projectUploadForm.description.trim()) {
      setActionStatus({ type: "error", text: "Project name and description are required." });
      return;
    }

    setSubmittingProjectUpload(true);
    try {
      const payload = {
        projectName: projectUploadForm.projectName.trim(),
        projectType: projectUploadForm.projectType,
        githubLink: projectUploadForm.githubLink.trim(),
        liveDemo: projectUploadForm.liveDemo.trim(),
        description: projectUploadForm.description.trim(),
      };
      await createProject(payload);
      setActionStatus({
        type: "success",
        text: `✓ Project "${projectUploadForm.projectName}" added to your portfolio!`,
      });
      setProjectUploadForm({
        projectName: "",
        projectType: "Academic",
        githubLink: "",
        liveDemo: "",
        description: "",
      });

      // Refresh projects
      const projs = await getStudentProjects().catch(() => []);
      setProjects(Array.isArray(projs?.projects) ? projs.projects : Array.isArray(projs) ? projs : []);
    } catch (err) {
      setActionStatus({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to add project.",
      });
    } finally {
      setSubmittingProjectUpload(false);
    }
  };

  const handleViewDocument = async (certId) => {
    setViewingDocId(certId);
    try {
      const doc = await getCertificateDocument(certId);
      if (doc?.documentUrl) {
        window.open(doc.documentUrl, "_blank");
      } else {
        alert("Document preview not available.");
      }
    } catch (err) {
      console.error("View doc error:", err);
      alert("Failed to load certificate document.");
    } finally {
      setViewingDocId(null);
    }
  };

  // ─── Filtered Data ──────────────────────────────────────────────────────────
  const filteredBrowseJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (jobTypeFilter !== "ALL" && (job.employmentType || "").toLowerCase() !== jobTypeFilter.toLowerCase()) {
        return false;
      }
      if (jobLocationFilter.trim()) {
        const q = jobLocationFilter.toLowerCase();
        if (!(job.location || "").toLowerCase().includes(q)) return false;
      }
      if (jobSearch.trim()) {
        const q = jobSearch.toLowerCase();
        const title = (job.title || "").toLowerCase();
        const desc = (job.description || "").toLowerCase();
        const orgName = (typeof job.organisation === "object" ? job.organisation?.name : "")?.toLowerCase() || "";
        const skills = Array.isArray(job.requiredSkills) ? job.requiredSkills.join(" ").toLowerCase() : "";
        if (!title.includes(q) && !desc.includes(q) && !orgName.includes(q) && !skills.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, jobTypeFilter, jobLocationFilter, jobSearch]);

  const filteredApplications = useMemo(() => {
    return myApplications.filter((app) => {
      if (!appliedSearch.trim()) return true;
      const q = appliedSearch.toLowerCase();
      const title = (app.job?.title || "").toLowerCase();
      const orgName = (app.organisation?.name || "").toLowerCase();
      return title.includes(q) || orgName.includes(q);
    });
  }, [myApplications, appliedSearch]);

  const filteredOffers = useMemo(() => {
    return myOffers.filter((offer) => {
      if (!offersSearch.trim()) return true;
      const q = offersSearch.toLowerCase();
      const title = (offer.job?.title || offer.role || "").toLowerCase();
      const orgName = (offer.organisation?.name || "").toLowerCase();
      return title.includes(q) || orgName.includes(q);
    });
  }, [myOffers, offersSearch]);

  // Certificate requests vs Project requests
  const certRequests = useMemo(() => {
    return myRequests.filter((r) => r.targetType === "CERTIFICATE" || r.certificate);
  }, [myRequests]);

  const projectRequests = useMemo(() => {
    return myRequests.filter((r) => r.targetType === "PROJECT" || r.project);
  }, [myRequests]);

  // Paginated Slices
  const paginatedBrowseJobs = useMemo(() => {
    const start = (pageBrowseJobs - 1) * ITEMS_PER_PAGE;
    return filteredBrowseJobs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBrowseJobs, pageBrowseJobs]);

  const paginatedApplications = useMemo(() => {
    const start = (pageApplied - 1) * ITEMS_PER_PAGE;
    return filteredApplications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredApplications, pageApplied]);

  const paginatedOffers = useMemo(() => {
    const start = (pageOffers - 1) * ITEMS_PER_PAGE;
    return filteredOffers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOffers, pageOffers]);

  const paginatedCertReqs = useMemo(() => {
    const start = (pageCertReqs - 1) * ITEMS_PER_PAGE;
    return certRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [certRequests, pageCertReqs]);

  const paginatedProjectReqs = useMemo(() => {
    const start = (pageProjectReqs - 1) * ITEMS_PER_PAGE;
    return projectRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [projectRequests, pageProjectReqs]);

  // Quick statistics
  const verifiedCertsCount = certificates.filter(
    (c) => (c.verificationStatus || "").toUpperCase() === "VERIFIED"
  ).length;
  const verifiedProjectsCount = projects.filter(
    (p) => (p.status || "").toUpperCase() === "APPROVED" || p.isVerified
  ).length;
  const pendingRequestsCount = myRequests.filter(
    (r) => (r.status || "").toUpperCase() === "PENDING"
  ).length;

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Top Header Welcome Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-1.5">
              🎓 Verified Applicant Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
              Welcome back, {currentUser.name?.split(" ")[0] || "Applicant"} 👋
            </h1>
            <p className="mt-1 text-xs text-[#666666]">
              {currentUser.headline ? `${currentUser.headline} · ` : ""}
              Browse opportunities, manage blockchain verification requests, and upload verified credentials.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/student/profile"
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition shadow-xs flex items-center gap-1.5"
            >
              <span>👤</span>
              <span>View Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] hover:border-[#C5221F]/30 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Global Action Banner */}
        {actionStatus.text && (
          <div
            className={`mb-6 p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
              actionStatus.type === "success"
                ? "bg-[#E6F4EA] border-[#137333]/30 text-[#137333]"
                : actionStatus.type === "error"
                ? "bg-[#FCE8E6] border-[#C5221F]/30 text-[#C5221F]"
                : "bg-[#E8F3FF] border-[#0A66C2]/30 text-[#0A66C2]"
            }`}
          >
            <span>{actionStatus.text}</span>
            <button
              type="button"
              onClick={() => setActionStatus({ id: null, type: "", text: "" })}
              className="font-bold ml-2 opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            3 MAIN SECTION SUMMARY KPI CARDS
            1. Jobs Section (DEFAULT)
            2. Request Verification Section
            3. Upload Section
        ════════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Jobs Section */}
          <div
            onClick={() => handleSwitchSection("jobs", "browse")}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              mainSection === "jobs"
                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                Jobs & Recruitment
              </span>
              <span className="text-base">💼</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0A66C2]">
              {jobs.length} <span className="text-xs font-normal text-[#666666]">available</span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {appliedJobIds.size} applied · {myOffers.length} offers received
            </p>
            <p className="mt-1 text-[11px] text-[#0A66C2] font-semibold">
              Browse jobs, applied & offers →
            </p>
          </div>

          {/* Card 2: Request Verification Section */}
          <div
            onClick={() => handleSwitchSection("verify", "cert-verify")}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              mainSection === "verify"
                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                Request Verification
              </span>
              <span className="text-base">🛡️</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#B06000]">
              {pendingRequestsCount} <span className="text-xs font-normal text-[#666666]">pending review</span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {verifiedCertsCount + verifiedProjectsCount} verified credentials on-chain
            </p>
            <p className="mt-1 text-[11px] text-[#B06000] font-semibold">
              Verify certificates & projects →
            </p>
          </div>

          {/* Card 3: Upload Section */}
          <div
            onClick={() => handleSwitchSection("upload", "cert-upload")}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              mainSection === "upload"
                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                Upload Credentials
              </span>
              <span className="text-base">⬆️</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#16805D]">
              {certificates.length + projects.length} <span className="text-xs font-normal text-[#666666]">in portfolio</span>
            </p>
            <p className="mt-1 text-[11px] text-[#666666]">
              {certificates.length} certificates · {projects.length} projects
            </p>
            <p className="mt-1 text-[11px] text-[#16805D] font-semibold">
              Upload certificates & projects →
            </p>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center text-xs text-[#666666] shadow-xs">
            Loading your student dashboard…
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            MAIN SECTION 1: JOBS SECTION
            Sub-tabs: Browse Jobs (Default), Applied, Offered
        ════════════════════════════════════════════════════════════════════ */}
        {!loading && mainSection === "jobs" && (
          <div className="space-y-4">
            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-[#D9E1E8] pb-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => handleSwitchSection("jobs", "browse")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  jobsSubTab === "browse"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>💼 Browse Jobs</span>
                <span className="text-[11px] font-normal opacity-80">({jobs.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchSection("jobs", "applied")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  jobsSubTab === "applied"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>📝 Applied</span>
                <span className="text-[11px] font-normal opacity-80">({myApplications.length})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchSection("jobs", "offered")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  jobsSubTab === "offered"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>🎉 Offered</span>
                {myOffers.length > 0 && <span className="w-2 h-2 rounded-full bg-[#137333]" />}
                <span className="text-[11px] font-normal opacity-80">({myOffers.length})</span>
              </button>
            </div>

            {/* Sub-view 1: Browse Jobs */}
            {jobsSubTab === "browse" && (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#D9E1E8]">
                  <div>
                    <h2 className="text-base font-bold text-[#191919]">Browse Verified Job Openings</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Explore full-time positions and internships posted directly by verified partner organisations.
                    </p>
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Search roles by title, skill, or company..."
                    value={jobSearch}
                    onChange={(e) => {
                      setJobSearch(e.target.value);
                      setPageBrowseJobs(1);
                    }}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Filter by location (e.g. Remote, Bengaluru)..."
                    value={jobLocationFilter}
                    onChange={(e) => {
                      setJobLocationFilter(e.target.value);
                      setPageBrowseJobs(1);
                    }}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                  <select
                    value={jobTypeFilter}
                    onChange={(e) => {
                      setJobTypeFilter(e.target.value);
                      setPageBrowseJobs(1);
                    }}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Employment Types</option>
                    <option value="FullTime">Full-Time</option>
                    <option value="Internship">Internship</option>
                    <option value="PartTime">Part-Time</option>
                  </select>
                </div>

                {/* Job Cards */}
                {filteredBrowseJobs.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                    No matching job opportunities found. Try adjusting your keyword or location filters.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {paginatedBrowseJobs.map((job) => {
                      const isApplied = appliedJobIds.has(job._id);
                      const isApplying = applyingJobId === job._id;
                      const orgName = typeof job.organisation === "object" ? job.organisation?.name : "Partner Organisation";

                      return (
                        <div
                          key={job._id}
                          className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2]/50 transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link
                                  to={`/student/jobs/${job._id}`}
                                  className="text-sm font-bold text-[#191919] hover:text-[#0A66C2] hover:underline transition"
                                >
                                  {job.title}
                                </Link>
                                <p className="text-xs font-medium text-[#0A66C2] mt-0.5">
                                  {orgName}
                                </p>
                              </div>
                              {job.employmentType && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20 shrink-0">
                                  {job.employmentType}
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#666666] mt-2 flex flex-wrap items-center gap-2">
                              <span>📍 {job.location || "Remote"}</span>
                              <span>·</span>
                              <span>💰 {formatSalary(job.stipend || job.salary)}</span>
                              <span>·</span>
                              <span>🕒 {formatTimeAgo(job.createdAt)}</span>
                            </p>

                            {job.description && (
                              <p className="text-xs text-[#666666] mt-2 line-clamp-2">
                                {job.description}
                              </p>
                            )}

                            {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {job.requiredSkills.slice(0, 4).map((skill, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="px-2 py-0.5 rounded text-[10px] bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {job.requiredSkills.length > 4 && (
                                  <span className="text-[10px] text-[#666666] self-center">
                                    +{job.requiredSkills.length - 4} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#D9E1E8] flex items-center justify-between gap-2">
                            <Link
                              to={`/student/jobs/${job._id}`}
                              className="text-xs font-semibold text-[#0A66C2] hover:underline"
                            >
                              Role Details →
                            </Link>

                            <button
                              type="button"
                              disabled={isApplied || isApplying}
                              onClick={() => handleApply(job._id)}
                              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition shadow-xs cursor-pointer ${
                                isApplied
                                  ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/30 cursor-default"
                                  : "bg-[#0A66C2] text-white hover:bg-[#004182]"
                              }`}
                            >
                              {isApplied ? "✓ Applied" : isApplying ? "Submitting…" : "Apply Now"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination */}
                <PaginationBar
                  currentPage={pageBrowseJobs}
                  totalPages={Math.ceil(filteredBrowseJobs.length / ITEMS_PER_PAGE)}
                  totalItems={filteredBrowseJobs.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPageBrowseJobs}
                />
              </div>
            )}

            {/* Sub-view 2: Applied Jobs */}
            {jobsSubTab === "applied" && (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#D9E1E8]">
                  <div>
                    <h2 className="text-base font-bold text-[#191919]">My Job Applications</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Review recruitment status and track active applications submitted to employers.
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search applied roles..."
                    value={appliedSearch}
                    onChange={(e) => {
                      setAppliedSearch(e.target.value);
                      setPageApplied(1);
                    }}
                    className="w-full sm:w-64 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                {filteredApplications.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                    {myApplications.length === 0
                      ? "You haven't submitted any job applications yet."
                      : "No applications matched your search."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedApplications.map((app) => {
                      const job = app.job || {};
                      const orgName = app.organisation?.name || "Organisation";
                      const status = (app.status || "APPLIED").toUpperCase();

                      const statusColor =
                        status === "OFFERED" || status === "HIRED"
                          ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                          : status === "REJECTED"
                          ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                          : "bg-[#E8F3FF] text-[#0A66C2] border-[#0A66C2]/30";

                      return (
                        <div
                          key={app._id}
                          className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/student/jobs/${job._id || ""}`}
                                className="font-bold text-[#191919] text-sm hover:text-[#0A66C2] hover:underline"
                              >
                                {job.title || "Job Application"}
                              </Link>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {app.status || "Applied"}
                              </span>
                            </div>
                            <p className="text-[#666666] mt-1">
                              Employer: <strong className="text-[#191919]">{orgName}</strong>
                              {app.createdAt && ` · Applied: ${new Date(app.createdAt).toLocaleDateString()}`}
                              {job.location && ` · 📍 ${job.location}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {job._id && (
                              <Link
                                to={`/student/jobs/${job._id}`}
                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs transition"
                              >
                                View Job Listing →
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <PaginationBar
                  currentPage={pageApplied}
                  totalPages={Math.ceil(filteredApplications.length / ITEMS_PER_PAGE)}
                  totalItems={filteredApplications.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPageApplied}
                />
              </div>
            )}

            {/* Sub-view 3: Offered Jobs */}
            {jobsSubTab === "offered" && (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#D9E1E8]">
                  <div>
                    <h2 className="text-base font-bold text-[#191919]">Job Offers Received</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Formal employment offers issued to you on the blockchain. You can review, accept, or decline.
                    </p>
                  </div>
                  <input
                    type="text"
                    placeholder="Search offers..."
                    value={offersSearch}
                    onChange={(e) => {
                      setOffersSearch(e.target.value);
                      setPageOffers(1);
                    }}
                    className="w-full sm:w-64 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                {filteredOffers.length === 0 ? (
                  <div className="p-10 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                    {myOffers.length === 0
                      ? "No job offers received yet. Apply to verified listings to receive interview offers."
                      : "No offers matched your search criteria."}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paginatedOffers.map((offer) => {
                      const offerId = offer._id || offer.offerId;
                      const job = offer.job || {};
                      const orgName = offer.organisation?.name || "Organisation";
                      const status = (offer.status || offer.offerStatus || "OFFERED").toUpperCase();
                      const isProcessing = processingOfferId === offerId;

                      const statusColor =
                        status === "ACCEPTED"
                          ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                          : status === "REJECTED"
                          ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                          : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30";

                      return (
                        <div
                          key={offerId}
                          className="p-5 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[#191919] text-sm">
                                {job.title || offer.role || "Employment Offer"}
                              </h3>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                {status}
                              </span>
                            </div>

                            <p className="text-[#666666]">
                              From: <strong className="text-[#191919]">{orgName}</strong>
                              {offer.createdAt && ` · Date: ${new Date(offer.createdAt).toLocaleDateString()}`}
                            </p>

                            <p className="text-[#666666]">
                              💰 Compensation: <strong className="text-[#191919]">{formatSalary(offer.stipend || job.stipend)}</strong>
                              {offer.employmentType && ` · ${offer.employmentType}`}
                            </p>

                            {offer.txHash && (
                              <p className="font-mono text-[10px] text-[#666666] truncate max-w-md">
                                On-Chain Tx: {offer.txHash}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {status === "OFFERED" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleAcceptOffer(offerId)}
                                  className="px-4 py-2 rounded-md bg-[#16805D] text-white hover:bg-[#11674a] font-semibold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                                >
                                  {isProcessing ? "Processing…" : "Accept Offer"}
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing}
                                  onClick={() => handleRejectOffer(offerId)}
                                  className="px-3.5 py-2 rounded-md border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                                >
                                  Decline
                                </button>
                              </>
                            )}

                            {status === "ACCEPTED" && (
                              <span className="px-3 py-1.5 rounded-md bg-[#E6F4EA] text-[#137333] font-semibold text-xs border border-[#137333]/30">
                                ✓ Employment Contract Active
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <PaginationBar
                  currentPage={pageOffers}
                  totalPages={Math.ceil(filteredOffers.length / ITEMS_PER_PAGE)}
                  totalItems={filteredOffers.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                  onPageChange={setPageOffers}
                />
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            MAIN SECTION 2: REQUEST VERIFICATION SECTION
            Sub-tabs: Certificate Verification, Project Verification
        ════════════════════════════════════════════════════════════════════ */}
        {!loading && mainSection === "verify" && (
          <div className="space-y-4">
            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-[#D9E1E8] pb-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setVerifySubTab("cert-verify")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  verifySubTab === "cert-verify"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>📜 Certificate Verification</span>
                <span className="text-[11px] font-normal opacity-80">({certRequests.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setVerifySubTab("project-verify")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  verifySubTab === "project-verify"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>💻 Project Verification</span>
                <span className="text-[11px] font-normal opacity-80">({projectRequests.length})</span>
              </button>
            </div>

            {/* Sub-view 1: Certificate Verification Request */}
            {verifySubTab === "cert-verify" && (
              <div className="space-y-6">
                {/* Form Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="mb-4 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-base font-bold text-[#191919]">Request Certificate Verification</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Select one of your uploaded certificates and choose an approved partner organisation to verify its authenticity on-chain.
                    </p>
                  </div>

                  <form onSubmit={handleCertVerifySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Select Certificate *
                        </label>
                        <select
                          value={certVerifyForm.certificateId}
                          onChange={(e) =>
                            setCertVerifyForm({ ...certVerifyForm, certificateId: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="">-- Choose from your certificates --</option>
                          {certificates.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.certificateName || "Untitled"} ({c.issuer}) — [
                              {c.verificationStatus || "Pending"}]
                            </option>
                          ))}
                        </select>
                        {certificates.length === 0 && (
                          <p className="text-[11px] text-[#B06000] mt-1">
                            You have no uploaded certificates yet.{" "}
                            <button
                              type="button"
                              onClick={() => handleSwitchSection("upload", "cert-upload")}
                              className="underline font-semibold"
                            >
                              Upload one first →
                            </button>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Select Verifying Organisation *
                        </label>
                        <select
                          value={certVerifyForm.organisationId}
                          onChange={(e) =>
                            setCertVerifyForm({ ...certVerifyForm, organisationId: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="">-- Choose verified organisation --</option>
                          {organisations.map((org) => (
                            <option key={org._id || org.organisationId} value={org._id || org.organisationId}>
                              {org.name} ({org.officialEmail || org.website || "Verified"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#191919] mb-1">
                        Optional Notes for Verifier
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Completed during summer internship with mentor John Doe"
                        value={certVerifyForm.notes}
                        onChange={(e) =>
                          setCertVerifyForm({ ...certVerifyForm, notes: e.target.value })
                        }
                        className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingVerify || certificates.length === 0}
                        className="px-4 py-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingVerify ? "Submitting Request…" : "🛡️ Submit Verification Request"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Status Table of Certificate Requests */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#191919] mb-3">
                    Certificate Verification History ({certRequests.length})
                  </h3>

                  {certRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                      No certificate verification requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedCertReqs.map((req) => {
                        const cert = req.certificate || {};
                        const org = req.organisation || {};
                        const status = (req.status || "PENDING").toUpperCase();

                        const statusColor =
                          status === "APPROVED" || status === "VERIFIED"
                            ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                            : status === "REJECTED"
                            ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                            : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30";

                        return (
                          <div
                            key={req._id}
                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#191919] text-sm">
                                  {cert.certificateName || req.targetName || "Certificate Verification"}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                  {status}
                                </span>
                              </div>
                              <p className="text-[#666666] mt-1">
                                Reviewing Organisation: <strong className="text-[#191919]">{org.name || "Organisation"}</strong>
                                {req.createdAt && ` · Requested: ${new Date(req.createdAt).toLocaleDateString()}`}
                              </p>
                              {req.notes && (
                                <p className="text-xs text-[#666666] italic mt-0.5">&quot;{req.notes}&quot;</p>
                              )}
                              {req.txHash && (
                                <p className="font-mono text-[10px] text-[#666666] truncate max-w-sm mt-0.5">
                                  Tx: {req.txHash}
                                </p>
                              )}
                            </div>

                            {status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleCancelRequest(req._id)}
                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs transition cursor-pointer"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <PaginationBar
                    currentPage={pageCertReqs}
                    totalPages={Math.ceil(certRequests.length / ITEMS_PER_PAGE)}
                    totalItems={certRequests.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPageCertReqs}
                  />
                </div>
              </div>
            )}

            {/* Sub-view 2: Project Verification Request */}
            {verifySubTab === "project-verify" && (
              <div className="space-y-6">
                {/* Form Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="mb-4 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-base font-bold text-[#191919]">Request Project Verification</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Submit your technical projects to an approved partner organisation to receive verified credentials and employer endorsements.
                    </p>
                  </div>

                  <form onSubmit={handleProjectVerifySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Select Project *
                        </label>
                        <select
                          value={projectVerifyForm.projectId}
                          onChange={(e) =>
                            setProjectVerifyForm({ ...projectVerifyForm, projectId: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="">-- Choose from your projects --</option>
                          {projects.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.projectName || p.title || "Project"} ({p.projectType || "Academic"}) — [
                              {p.status || (p.isVerified ? "Verified" : "Pending")}]
                            </option>
                          ))}
                        </select>
                        {projects.length === 0 && (
                          <p className="text-[11px] text-[#B06000] mt-1">
                            You have no uploaded projects yet.{" "}
                            <button
                              type="button"
                              onClick={() => handleSwitchSection("upload", "project-upload")}
                              className="underline font-semibold"
                            >
                              Add one first →
                            </button>
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Select Verifying Organisation *
                        </label>
                        <select
                          value={projectVerifyForm.organisationId}
                          onChange={(e) =>
                            setProjectVerifyForm({ ...projectVerifyForm, organisationId: e.target.value })
                          }
                          required
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="">-- Choose verified organisation --</option>
                          {organisations.map((org) => (
                            <option key={org._id || org.organisationId} value={org._id || org.organisationId}>
                              {org.name} ({org.officialEmail || org.website || "Verified"})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingVerify || projects.length === 0}
                        className="px-4 py-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingVerify ? "Submitting Request…" : "🛡️ Submit Project Verification"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Status Table of Project Requests */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-[#191919] mb-3">
                    Project Verification History ({projectRequests.length})
                  </h3>

                  {projectRequests.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                      No project verification requests submitted yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paginatedProjectReqs.map((req) => {
                        const proj = req.project || {};
                        const org = req.organisation || {};
                        const status = (req.status || "PENDING").toUpperCase();

                        const statusColor =
                          status === "APPROVED" || status === "VERIFIED"
                            ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                            : status === "REJECTED"
                            ? "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30"
                            : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30";

                        return (
                          <div
                            key={req._id}
                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-[#191919] text-sm">
                                  {proj.projectName || req.targetName || "Project Verification"}
                                </h4>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                                  {status}
                                </span>
                              </div>
                              <p className="text-[#666666] mt-1">
                                Reviewing Organisation: <strong className="text-[#191919]">{org.name || "Organisation"}</strong>
                                {req.createdAt && ` · Requested: ${new Date(req.createdAt).toLocaleDateString()}`}
                              </p>
                              {req.txHash && (
                                <p className="font-mono text-[10px] text-[#666666] truncate max-w-sm mt-0.5">
                                  Tx: {req.txHash}
                                </p>
                              )}
                            </div>

                            {status === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleCancelRequest(req._id)}
                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs transition cursor-pointer"
                              >
                                Cancel Request
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <PaginationBar
                    currentPage={pageProjectReqs}
                    totalPages={Math.ceil(projectRequests.length / ITEMS_PER_PAGE)}
                    totalItems={projectRequests.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setPageProjectReqs}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            MAIN SECTION 3: UPLOAD SECTION
            Sub-tabs: Upload Certificate, Upload Project
        ════════════════════════════════════════════════════════════════════ */}
        {!loading && mainSection === "upload" && (
          <div className="space-y-4">
            {/* Sub-tab navigation */}
            <div className="flex items-center gap-2 border-b border-[#D9E1E8] pb-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setUploadSubTab("cert-upload")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  uploadSubTab === "cert-upload"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>📜 Upload Certificate</span>
                <span className="text-[11px] font-normal opacity-80">({certificates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUploadSubTab("project-upload")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 whitespace-nowrap ${
                  uploadSubTab === "project-upload"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>🚀 Upload Project</span>
                <span className="text-[11px] font-normal opacity-80">({projects.length})</span>
              </button>
            </div>

            {/* Sub-view 1: Upload Certificate Form */}
            {uploadSubTab === "cert-upload" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="mb-4 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-base font-bold text-[#191919]">Upload Academic / Professional Certificate</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Upload your credential document to your portfolio. Once saved, you can request on-chain verification from partner organisations.
                    </p>
                  </div>

                  <form onSubmit={handleUploadCertSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Certificate Name / Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Full Stack Web Development Specialization"
                          value={certUploadForm.certificateName}
                          onChange={(e) =>
                            setCertUploadForm({ ...certUploadForm, certificateName: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Issuing Authority / University / Company *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Stanford Online, Google, Coursera"
                          value={certUploadForm.issuer}
                          onChange={(e) =>
                            setCertUploadForm({ ...certUploadForm, issuer: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Credential Type
                        </label>
                        <select
                          value={certUploadForm.certificateType}
                          onChange={(e) =>
                            setCertUploadForm({ ...certUploadForm, certificateType: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="Course">Course Certificate</option>
                          <option value="Degree">Degree / Graduation</option>
                          <option value="Diploma">Diploma</option>
                          <option value="Achievement">Hackathon / Award</option>
                          <option value="Other">Other Credential</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Issue Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={certUploadForm.issueDate}
                          onChange={(e) =>
                            setCertUploadForm({ ...certUploadForm, issueDate: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Attach Document (PDF, PNG, JPG) *
                        </label>
                        <input
                          type="file"
                          required
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => setCertFile(e.target.files[0] || null)}
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#0A66C2] file:text-white hover:file:bg-[#004182] cursor-pointer"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Does this certificate expire?
                        </label>
                        <div className="flex items-center gap-4 py-2">
                          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="hasExpiry"
                              value="no"
                              checked={certUploadForm.hasExpiry === "no"}
                              onChange={() =>
                                setCertUploadForm({ ...certUploadForm, hasExpiry: "no", expiryDate: "" })
                              }
                            />
                            <span>No Expiration</span>
                          </label>
                          <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer">
                            <input
                              type="radio"
                              name="hasExpiry"
                              value="yes"
                              checked={certUploadForm.hasExpiry === "yes"}
                              onChange={() =>
                                setCertUploadForm({ ...certUploadForm, hasExpiry: "yes" })
                              }
                            />
                            <span>Has Expiry Date</span>
                          </label>
                        </div>
                      </div>

                      {certUploadForm.hasExpiry === "yes" && (
                        <div>
                          <label className="block text-xs font-semibold text-[#191919] mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="date"
                            value={certUploadForm.expiryDate}
                            onChange={(e) =>
                              setCertUploadForm({ ...certUploadForm, expiryDate: e.target.value })
                            }
                            className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#191919] mb-1">
                        Credential Description (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Key skills demonstrated, grades or achievements..."
                        value={certUploadForm.description}
                        onChange={(e) =>
                          setCertUploadForm({ ...certUploadForm, description: e.target.value })
                        }
                        className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingCertUpload}
                        className="px-5 py-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingCertUpload ? "Uploading Document…" : "⬆️ Upload Certificate"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Uploaded Certificates List */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#191919]">
                      Your Uploaded Certificates ({certificates.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleSwitchSection("verify", "cert-verify")}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline"
                    >
                      Request Verification for any Certificate →
                    </button>
                  </div>

                  {certificates.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                      No certificates uploaded yet. Fill out the form above to add your first credential.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {certificates.map((cert) => {
                        const isVerified = (cert.verificationStatus || "").toUpperCase() === "VERIFIED";

                        return (
                          <div
                            key={cert._id}
                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-[#191919] text-sm">
                                  {cert.certificateName || "Certificate"}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isVerified
                                      ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                                      : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30"
                                  }`}
                                >
                                  {cert.verificationStatus || "Pending"}
                                </span>
                              </div>
                              <p className="text-[#666666] mt-1">
                                Issuer: <strong className="text-[#191919]">{cert.issuer}</strong>
                                {cert.issueDate && ` · ${new Date(cert.issueDate).toLocaleDateString()}`}
                              </p>
                              {cert.certificateType && (
                                <p className="text-[11px] text-[#0A66C2] font-semibold mt-0.5">
                                  {cert.certificateType}
                                </p>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-[#D9E1E8] flex items-center justify-between">
                              <button
                                type="button"
                                disabled={viewingDocId === cert._id}
                                onClick={() => handleViewDocument(cert._id)}
                                className="text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer disabled:opacity-50"
                              >
                                {viewingDocId === cert._id ? "Loading doc…" : "📄 View Document"}
                              </button>

                              {!isVerified && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCertVerifyForm({
                                      ...certVerifyForm,
                                      certificateId: cert._id,
                                    });
                                    handleSwitchSection("verify", "cert-verify");
                                  }}
                                  className="text-xs font-semibold text-[#B06000] hover:underline"
                                >
                                  Request Verification →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-view 2: Upload Project Form */}
            {uploadSubTab === "project-upload" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="mb-4 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-base font-bold text-[#191919]">Upload Technical Project to Portfolio</h2>
                    <p className="text-xs text-[#666666] mt-0.5">
                      Showcase your software, engineering, and research work to recruiters with GitHub code and live links.
                    </p>
                  </div>

                  <form onSubmit={handleUploadProjectSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Project Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Distributed Task Queue in Go"
                          value={projectUploadForm.projectName}
                          onChange={(e) =>
                            setProjectUploadForm({ ...projectUploadForm, projectName: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Project Classification
                        </label>
                        <select
                          value={projectUploadForm.projectType}
                          onChange={(e) =>
                            setProjectUploadForm({ ...projectUploadForm, projectType: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        >
                          <option value="Academic">Academic / University Project</option>
                          <option value="Personal">Personal Side Project</option>
                          <option value="Industry">Industry / Client Work</option>
                          <option value="OpenSource">Open Source Contribution</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          GitHub Repository URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://github.com/username/project"
                          value={projectUploadForm.githubLink}
                          onChange={(e) =>
                            setProjectUploadForm({ ...projectUploadForm, githubLink: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#191919] mb-1">
                          Live Demo URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://myproject.dev"
                          value={projectUploadForm.liveDemo}
                          onChange={(e) =>
                            setProjectUploadForm({ ...projectUploadForm, liveDemo: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#191919] mb-1">
                        Detailed Project Description *
                      </label>
                      <textarea
                        rows={4}
                        required
                        placeholder="Explain the problem solved, tech stack utilized, architecture highlights, and your contributions..."
                        value={projectUploadForm.description}
                        onChange={(e) =>
                          setProjectUploadForm({ ...projectUploadForm, description: e.target.value })
                        }
                        className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingProjectUpload}
                        className="px-5 py-2 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {submittingProjectUpload ? "Adding Project…" : "🚀 Add Project to Portfolio"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Uploaded Projects List */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-[#191919]">
                      Your Portfolio Projects ({projects.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleSwitchSection("verify", "project-verify")}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline"
                    >
                      Request Verification for any Project →
                    </button>
                  </div>

                  {projects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                      No projects added yet. Fill out the form above to add your first portfolio project.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {projects.map((proj) => {
                        const isVerified = (proj.status || "").toUpperCase() === "APPROVED" || proj.isVerified;

                        return (
                          <div
                            key={proj._id}
                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col justify-between text-xs"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-bold text-[#191919] text-sm">
                                  {proj.projectName || proj.title || "Project"}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    isVerified
                                      ? "bg-[#E6F4EA] text-[#137333] border-[#137333]/30"
                                      : "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30"
                                  }`}
                                >
                                  {isVerified ? "Verified" : proj.status || "Showcase"}
                                </span>
                              </div>

                              {proj.projectType && (
                                <p className="text-[11px] text-[#0A66C2] font-semibold mt-0.5">
                                  {proj.projectType}
                                </p>
                              )}

                              <p className="text-[#666666] mt-2 line-clamp-2">
                                {proj.description}
                              </p>
                            </div>

                            <div className="mt-3 pt-3 border-t border-[#D9E1E8] flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-3">
                                {proj.githubLink && (
                                  <a
                                    href={proj.githubLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#0A66C2] hover:underline"
                                  >
                                    GitHub ↗
                                  </a>
                                )}
                                {proj.liveDemo && (
                                  <a
                                    href={proj.liveDemo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-[#0A66C2] hover:underline"
                                  >
                                    Live Demo ↗
                                  </a>
                                )}
                              </div>

                              {!isVerified && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProjectVerifyForm({
                                      ...projectVerifyForm,
                                      projectId: proj._id,
                                    });
                                    handleSwitchSection("verify", "project-verify");
                                  }}
                                  className="text-xs font-semibold text-[#B06000] hover:underline"
                                >
                                  Request Verification →
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}