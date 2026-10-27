import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
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
  getGitHubStatus,
  getGitHubConnectUrl,
  disconnectGitHub,
} from "../../services/projectService";
import GitHubRepoModal from "../../components/student/GitHubRepoModal";
import NotificationBell from "../../components/common/NotificationBell";
import SettingsModal from "../../components/common/SettingsModal";
import { FaCog } from "react-icons/fa";
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
};

export default function StudentDashboard() {
  const { currentUser = {}, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

  // GitHub Modal & Integration state for Project Upload
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [selectedGitHubRepo, setSelectedGitHubRepo] = useState(null);
  const [gitHubAccount, setGitHubAccount] = useState({ connected: false, username: "" });
  const [connectingGitHub, setConnectingGitHub] = useState(false);
  const [disconnectingGitHub, setDisconnectingGitHub] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  const checkGitHub = async () => {
    try {
      const status = await getGitHubStatus();
      if (status.connected) {
        setGitHubAccount({ connected: true, username: status.username });
      } else {
        setGitHubAccount({ connected: false, username: "" });
      }
    } catch (err) {
      console.error("Failed to check GitHub status in Dashboard:", err);
    }
  };

  // Check GitHub integration status & handle OAuth callback / repo passed via location state
  useEffect(() => {
    checkGitHub();

    if (location.state?.selectedGitHubRepo) {
      const repo = location.state.selectedGitHubRepo;
      setSelectedGitHubRepo(repo);
      setProjectUploadForm((prev) => ({
        ...prev,
        githubLink: repo.htmlUrl,
        projectName: repo.name || prev.projectName,
        description: repo.description || prev.description || "",
      }));
      setMainSection("upload");
      setUploadSubTab("project-upload");
    }

    // Handle OAuth callback parameters in URL
    const connectedParam = searchParams.get("github_connected");
    const userParam = searchParams.get("github_user");
    const errorParam = searchParams.get("github_error");

    if (connectedParam === "true") {
      setMainSection("upload");
      setUploadSubTab("project-upload");
      setGitHubAccount({ connected: true, username: userParam || "" });
      setShowGitHubModal(true);
      checkGitHub();
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("github_connected");
      newParams.delete("github_user");
      newParams.set("section", "upload");
      newParams.set("tab", "project-upload");
      setSearchParams(newParams, { replace: true });
    } else if (errorParam) {
      alert(`GitHub connection failed: ${errorParam}`);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("github_error");
      setSearchParams(newParams, { replace: true });
    }
  }, [location.state, searchParams]);

  const handleConnectGitHub = async () => {
    try {
      setConnectingGitHub(true);
      const returnUrl = "/student/dashboard?section=upload&tab=project-upload";
      const { authUrl } = await getGitHubConnectUrl(returnUrl);
      if (authUrl) {
        // Direct full-page navigation to GitHub's authorization page
        window.location.href = authUrl;
      } else {
        alert("Could not generate GitHub authorization URL.");
        setConnectingGitHub(false);
      }
    } catch (err) {
      console.error("Failed to initiate GitHub OAuth:", err);
      alert(err.response?.data?.message || "Failed to connect with GitHub.");
      setConnectingGitHub(false);
    }
  };

  const handleDisconnectGitHub = async () => {
    if (!window.confirm("Are you sure you want to disconnect your GitHub account?")) return;
    try {
      setDisconnectingGitHub(true);
      await disconnectGitHub();
      setGitHubAccount({ connected: false, username: "" });
      setSelectedGitHubRepo(null);
    } catch (err) {
      console.error("Failed to disconnect GitHub:", err);
      alert(err.response?.data?.message || "Failed to disconnect GitHub.");
    } finally {
      setDisconnectingGitHub(false);
    }
  };

  const handleRepoSelected = (repo) => {
    setSelectedGitHubRepo(repo);
    setProjectUploadForm((prev) => ({
      ...prev,
      githubLink: repo.htmlUrl,
      projectName: repo.name || prev.projectName,
      description: repo.description || prev.description || "",
    }));
    setShowGitHubModal(false);
  };

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
      setSelectedGitHubRepo(null);

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
                          {organisations.map((org) => {
                            const displayName = org.organisationName || org.name || "Unnamed Organisation";
                            const typeInfo = org.organisationType || (org.website ? org.website.replace(/^https?:\/\//, "") : "Verified");
                            return (
                              <option key={org._id || org.organisationId} value={org._id || org.organisationId}>
                                {displayName} ({typeInfo})
                              </option>
                            );
                          })}
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
                                Reviewing Organisation: <strong className="text-[#191919]">{org.organisationName || org.name || "Organisation"}</strong>
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
                          {organisations.map((org) => {
                            const displayName = org.organisationName || org.name || "Unnamed Organisation";
                            const typeInfo = org.organisationType || (org.website ? org.website.replace(/^https?:\/\//, "") : "Verified");
                            return (
                              <option key={org._id || org.organisationId} value={org._id || org.organisationId}>
                                {displayName} ({typeInfo})
                              </option>
                            );
                          })}
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
                                Reviewing Organisation: <strong className="text-[#191919]">{org.organisationName || org.name || "Organisation"}</strong>
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
                          placeholder="https://github.com/username/project"
                          value={projectUploadForm.githubLink}
                          onChange={(e) =>
                            setProjectUploadForm({ ...projectUploadForm, githubLink: e.target.value })
                          }
                          className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                        />
                        {selectedGitHubRepo && (
                          <div className="mt-2 p-2.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-bold">✓ Selected:</span>
                              <span className="font-mono text-[11px] truncate">{selectedGitHubRepo.name}</span>
                              {selectedGitHubRepo.language && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 font-semibold">
                                  {selectedGitHubRepo.language}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGitHubRepo(null);
                                setProjectUploadForm({ ...projectUploadForm, githubLink: "" });
                              }}
                              className="text-emerald-700 hover:text-emerald-900 text-[11px] cursor-pointer ml-2"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        )}
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

      {/* GitHub Repo Selector Modal for Dashboard Project Upload */}
      <GitHubRepoModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
        onSelectRepo={handleRepoSelected}
        darkMode={false}
        returnUrl="/student/dashboard?section=upload&tab=project-upload"
      />
    </div>
  );
}