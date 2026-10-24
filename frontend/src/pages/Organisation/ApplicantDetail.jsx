import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  getApplicantDetail,
  createEmploymentOffer,
  getStudentEmploymentById,
} from "../../services/employmentService";
import {
  getCandidateCertificates,
  getCertificateDocument,
} from "../../services/certificateService";
import { getCandidateProjects } from "../../services/projectService";
import { calculateDuration } from "../../components/student/EditProfileModal";

const formatWallet = (value) => {
  if (!value) return "—";
  return value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;
};

const ApplicantDetail = () => {
  const { jobId, applicationId } = useParams();
  const navigate = useNavigate();

  const [application, setApplication] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employmentHistory, setEmploymentHistory] = useState({
    currentEmployment: [],
    previousEmployment: [],
  });

  const [loading, setLoading] = useState(true);
  const [viewingCertId, setViewingCertId] = useState(null);

  // Offer State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerType, setOfferType] = useState("FullTime");
  const [sendingOffer, setSendingOffer] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchApplicantData();
  }, [jobId, applicationId]);

  const fetchApplicantData = async () => {
    setLoading(true);
    try {
      const detail = await getApplicantDetail(jobId, applicationId).catch(() => null);
      setApplication(detail);

      const studentId = detail?.student?._id;
      if (studentId) {
        const [certsRes, projRes, empRes] = await Promise.allSettled([
          getCandidateCertificates(studentId),
          getCandidateProjects(studentId),
          getStudentEmploymentById(studentId),
        ]);

        // Certificates
        const certsRaw =
          certsRes.status === "fulfilled" && certsRes.value
            ? Array.isArray(certsRes.value.certificates)
              ? certsRes.value.certificates
              : Array.isArray(certsRes.value)
              ? certsRes.value
              : []
            : [];
        setCertificates(certsRaw);

        // Projects
        const projsRaw =
          projRes.status === "fulfilled" && projRes.value
            ? Array.isArray(projRes.value.projects)
              ? projRes.value.projects
              : Array.isArray(projRes.value)
              ? projRes.value
              : []
            : [];
        setProjects(projsRaw);

        // Employments
        const empRaw =
          empRes.status === "fulfilled" && empRes.value ? empRes.value : {};
        setEmploymentHistory({
          currentEmployment: Array.isArray(empRaw.currentEmployment)
            ? empRaw.currentEmployment
            : [],
          previousEmployment: Array.isArray(empRaw.previousEmployment)
            ? empRaw.previousEmployment
            : [],
        });
      }
    } catch (error) {
      console.error("Applicant detail load error:", error);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setSendingOffer(true);
    setStatusMessage({ type: "info", text: "Creating employment offer on blockchain…" });

    try {
      const res = await createEmploymentOffer(applicationId, null, null, null);
      const tx = res?.transactionHash || res?.txHash || "";
      setStatusMessage({
        type: "success",
        text: `✓ Employment offer created successfully! ${tx ? `Tx: ${tx.slice(0, 10)}…` : ""}`,
      });
      setIsOfferModalOpen(false);
      await fetchApplicantData();
    } catch (err) {
      console.error("Offer error:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to create employment offer.",
      });
    } finally {
      setSendingOffer(false);
    }
  };

  const handleViewCertificate = async (certificate) => {
    const certId = certificate._id || certificate.certificateHash;
    const directUrl = certificate.certificateURL;
    const hashOrId = certificate.certificateHash || certificate._id;

    if (!directUrl && !hashOrId) {
      alert("No certificate document available.");
      return;
    }

    setViewingCertId(certId);
    const docWindow = window.open("about:blank", "_blank");
    if (!docWindow) {
      setViewingCertId(null);
      alert("Popup blocked by browser. Please allow popups for this site.");
      return;
    }

    docWindow.opener = null;

    try {
      docWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Certificate - ${certificate.certificateName || "SkillSync"}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                background-color: #F3F6F8;
                color: #191919;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .loader-card {
                text-align: center;
                background: #FFFFFF;
                border: 1px solid #D9E1E8;
                border-radius: 12px;
                padding: 32px 40px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
              }
              .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #E8F3FF;
                border-top-color: #0A66C2;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader-card">
              <div class="spinner"></div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Loading Verified Certificate</h3>
              <p style="margin: 0; font-size: 13px; color: #666666;">Streaming document from secure storage...</p>
            </div>
          </body>
        </html>
      `);

      if (hashOrId) {
        try {
          const docBlobUrl = await getCertificateDocument(hashOrId);
          docWindow.location.href = docBlobUrl;
          return;
        } catch (streamErr) {
          console.warn("Stream failed, fallback to direct url:", streamErr);
        }
      }

      if (directUrl) {
        docWindow.location.href = directUrl;
        return;
      }

      throw new Error("Certificate document file not available.");
    } catch (err) {
      console.error("View certificate error:", err);
      docWindow.close();
      alert("Failed to load certificate document: " + (err.response?.data?.message || err.message));
    } finally {
      setViewingCertId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F8] flex items-center justify-center p-6 text-center">
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 shadow-xs max-w-sm w-full">
          <div className="w-8 h-8 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#191919]">Loading Applicant Profile</h3>
          <p className="text-xs text-[#666666] mt-1">Retrieving candidate resume & on-chain proofs...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-[#F3F6F8] p-8 flex items-center justify-center">
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-8 max-w-md text-center shadow-xs space-y-3">
          <h2 className="text-lg font-bold text-[#191919]">Applicant Not Found</h2>
          <p className="text-xs text-[#666666]">
            This application is not accessible or may have been removed.
          </p>
          <button
            onClick={() => navigate(`/organisation/jobs/${jobId}/applications`)}
            className="inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182]"
          >
            ← Back to Applicants List
          </button>
        </div>
      </div>
    );
  }

  const student = application.student || {};
  const job = application.job || {};

  const skills = Array.isArray(student.skills)
    ? student.skills
    : typeof student.skills === "string" && student.skills.trim()
    ? student.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const customExperiences = Array.isArray(student.experience) ? student.experience : [];
  const systemEmployments = [
    ...(employmentHistory.currentEmployment || []),
    ...(employmentHistory.previousEmployment || []),
  ];
  const totalExperienceCount = customExperiences.length + systemEmployments.length;

  const verifiedCertificates = certificates.filter(
    (c) =>
      c.verifiedOnChain ||
      c.verificationStatus === "Verified" ||
      c.verificationStatus === "VERIFIED"
  );

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D9E1E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/organisation" className="flex items-center gap-1.5 focus:outline-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#191919]">
                Skill<span className="text-[#0A66C2]">Sync</span>
                <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#E8F3FF] text-[#0A66C2]">
                  Employer Hub
                </span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#666666]">
              <Link to="/organisation" className="hover:text-[#0A66C2] transition-colors">
                Dashboard
              </Link>
              <Link to="/organisation/jobs" className="hover:text-[#0A66C2] transition-colors">
                Manage Jobs
              </Link>
              <Link to={`/organisation/jobs/${jobId}/applications`} className="text-[#0A66C2] font-semibold">
                Applicants
              </Link>
              <Link to="/organisation/employees" className="hover:text-[#0A66C2] transition-colors">
                Employees
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/organisation/jobs/${jobId}/applications`}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              ← Back to Applicants
            </Link>
            <Link
              to="/organisation"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(`/organisation/jobs/${jobId}/applications`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
          >
            ← Back to All Applicants for "{job.title || "Job"}"
          </button>
          <span className="text-xs text-[#666666]">
            Application ID: <strong className="font-mono text-[#191919]">{applicationId.slice(-8)}</strong>
          </span>
        </div>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-md text-xs font-medium border ${
              statusMessage.type === "success"
                ? "border-[#16805D]/30 bg-[#E6F4EA] text-[#16805D]"
                : statusMessage.type === "error"
                ? "border-[#C5221F]/30 bg-[#FCE8E6] text-[#C5221F]"
                : "border-[#0A66C2]/30 bg-[#E8F3FF] text-[#0A66C2]"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            1. CANDIDATE RESUME HEADER CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Candidate Avatar */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-2xl font-bold text-white shadow-xs">
                {student.name ? student.name.slice(0, 2).toUpperCase() : "CA"}
                {student.applicantId && (
                  <span
                    title="Blockchain Identity Verified"
                    className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-[#16805D] text-xs text-white border-2 border-white"
                  >
                    ✓
                  </span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                    {student.name || "Candidate Name"}
                  </h1>
                  <span className="rounded-md bg-[#E8F3FF] text-[#0A66C2] px-2.5 py-0.5 text-xs font-semibold">
                    Applicant
                  </span>
                  {student.applicantId && (
                    <span className="rounded-md bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                      <span>✓</span> On-Chain Identity Verified
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm sm:text-base font-medium text-[#0A66C2]">
                  {student.headline || "Candidate Professional Profile & Resume"}
                </p>

                {/* Resume Contact Row */}
                <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#666666]">
                  {student.college && (
                    <span className="flex items-center gap-1">
                      <span>🏛️</span>
                      <strong className="text-[#191919]">{student.college}</strong>
                    </span>
                  )}
                  {student.usn && (
                    <span className="flex items-center gap-1">
                      <span>🆔</span>
                      <span className="font-mono text-[#191919]">USN: {student.usn}</span>
                    </span>
                  )}
                  {student.email && (
                    <span className="flex items-center gap-1">
                      <span>✉️</span>
                      <span>{student.email}</span>
                    </span>
                  )}
                  {student.phone && (
                    <span className="flex items-center gap-1">
                      <span>📞</span>
                      <span>{student.phone}</span>
                    </span>
                  )}
                  {student.walletAddress && (
                    <span className="flex items-center gap-1" title={student.walletAddress}>
                      <span>🔗</span>
                      <span className="font-mono text-[11px] text-[#191919]">
                        {formatWallet(student.walletAddress)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume External Links */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              {student.githubUrl && (
                <a
                  href={student.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition"
                >
                  GitHub ↗
                </a>
              )}
              {student.linkedinUrl && (
                <a
                  href={student.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#0A66C2] bg-white text-[#0A66C2] hover:bg-[#E8F3FF] transition"
                >
                  LinkedIn ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. APPLICATION STATUS & HIRING DECISION CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E1E8] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Applied Position:
                </span>
                <span className="text-base font-bold text-[#191919]">{job.title || "Job Role"}</span>
                <span className="rounded bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8] px-2 py-0.5 text-[11px] font-semibold">
                  {job.employmentType || "Position"}
                </span>
              </div>
              <p className="text-xs text-[#666666] mt-0.5">
                Applied on {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Recently"} · Location: {job.location || "Remote"}
              </p>
            </div>

            {/* Current Application Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666666]">Status:</span>
              <span
                className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  application.status === "Offered"
                    ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                    : application.status === "Accepted"
                    ? "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20"
                    : application.status === "Rejected"
                    ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                    : "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20"
                }`}
              >
                {application.status || "Applied"}
              </span>
            </div>
          </div>

          {/* Hiring Decision Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            <div className="text-xs text-[#666666]">
              {application.status === "Offered" ? (
                <span>
                  ✓ Employment offer sent to candidate. Offer ID: <strong className="font-mono text-[#191919]">{application.offerId}</strong>
                </span>
              ) : application.status === "Accepted" ? (
                <span className="text-[#16805D] font-semibold">
                  ✓ Candidate accepted offer! Employment active on ledger.
                </span>
              ) : (
                <span>Review this candidate's verified credentials and employment history before making an offer.</span>
              )}
            </div>

            {application.status === "Applied" && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs cursor-pointer"
                >
                  Make Employment Offer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            3. ABOUT / PROFESSIONAL SUMMARY
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#191919] border-b border-[#D9E1E8] pb-3 mb-3">
            Professional Summary
          </h2>
          {student.bio ? (
            <p className="text-sm leading-relaxed text-[#191919] whitespace-pre-line">
              {student.bio}
            </p>
          ) : (
            <p className="text-xs text-[#666666] italic">No bio summary provided by candidate.</p>
          )}

          {/* Skills & Competencies */}
          {skills.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#D9E1E8]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                Skills & Technical Competencies
              </p>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-md px-2.5 py-1 text-xs font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            4. EXPERIENCE & EMPLOYMENT HISTORY (With Calculated Duration)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="border-b border-[#D9E1E8] pb-3 mb-4">
            <h2 className="text-base font-bold text-[#191919]">Experience & Employment History</h2>
            <p className="text-xs text-[#666666]">
              Previous employment, internships, and on-chain verified work duration.
            </p>
          </div>

          {totalExperienceCount === 0 ? (
            <p className="text-xs text-[#666666] italic py-2">
              No previous employment or internship records added by candidate.
            </p>
          ) : (
            <div className="space-y-4">
              {/* Custom Candidate Experiences */}
              {customExperiences.map((exp, index) => {
                const duration = calculateDuration(exp.startDate, exp.endDate, exp.current);
                return (
                  <div
                    key={`custom-${index}`}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-bold text-[#191919]">{exp.title}</h3>
                        <p className="text-xs font-semibold text-[#0A66C2]">
                          {exp.company} {exp.location ? `· ${exp.location}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center self-start sm:self-auto px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8]">
                        {exp.current ? "Current Role" : "Previous Employment"}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                      <span>
                        {exp.startDate || "—"} – {exp.current ? "Present" : exp.endDate || "—"}
                      </span>
                      {duration && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-[#0A66C2] bg-[#E8F3FF] px-2 py-0.5 rounded-full">
                            Duration: {duration}
                          </span>
                        </>
                      )}
                    </div>

                    {exp.description && (
                      <p className="mt-2 text-xs text-[#666666] leading-relaxed whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* System Verified Employments */}
              {systemEmployments.map((rec, index) => {
                const isCurrent = rec.status === "Active";
                const startRaw = rec.joinedAt
                  ? typeof rec.joinedAt === "number"
                    ? rec.joinedAt * 1000
                    : rec.joinedAt
                  : rec.createdAt;
                const endRaw = !isCurrent ? rec.leftAt || rec.updatedAt : null;
                const duration = calculateDuration(startRaw, endRaw, isCurrent);

                const startedDate = startRaw ? new Date(startRaw).toLocaleDateString() : null;
                const endDateFormatted = isCurrent
                  ? "Present"
                  : endRaw
                  ? new Date(endRaw).toLocaleDateString()
                  : "Completed";

                return (
                  <div
                    key={`sys-${index}`}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-bold text-[#191919]">
                          {rec.role || rec.job?.title || "Staff Position"}
                        </h3>
                        <p className="text-xs font-semibold text-[#0A66C2]">
                          {rec.organisation?.organisationName || rec.organisation?.name || "Verified Organisation"}
                        </p>
                      </div>
                      <span className="inline-flex items-center self-start sm:self-auto px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                        ✓ On-Chain Verified Role
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                      <span>
                        {startedDate || "Registered"} – {endDateFormatted}
                      </span>
                      {duration && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-[#0A66C2] bg-[#E8F3FF] px-2 py-0.5 rounded-full">
                            Duration: {duration}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            5. VERIFIED CERTIFICATES & CREDENTIALS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#191919]">Verified Academic & Skill Credentials</h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E8F3FF] text-[#0A66C2]">
                  {verifiedCertificates.length} Verified On-Chain
                </span>
              </div>
              <p className="text-xs text-[#666666]">
                Cryptographically attested credentials submitted by candidate.
              </p>
            </div>
          </div>

          {verifiedCertificates.length === 0 ? (
            <p className="text-xs text-[#666666] italic py-2">
              No on-chain verified certificates associated with this applicant.
            </p>
          ) : (
            <div className="space-y-3.5">
              {verifiedCertificates.map((cert) => {
                const certId = cert._id || cert.certificateHash;
                const isViewingThis = viewingCertId === certId;

                return (
                  <div
                    key={certId}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#191919]">
                            {cert.certificateName || "Academic Credential"}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                            ✓ Verified On-Chain
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] mt-0.5">
                          Issued by: <strong className="text-[#191919]">{cert.issuer || "Accredited Organisation"}</strong>
                          {cert.certificateType && ` · ${cert.certificateType}`}
                          {cert.issueDate && ` · ${new Date(cert.issueDate).toLocaleDateString()}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewCertificate(cert)}
                          disabled={isViewingThis}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
                        >
                          {isViewingThis ? "Loading…" : "View Document"}
                        </button>
                        {(cert.certificateHash || cert._id) && (
                          <Link
                            to={`/verify/${cert.certificateHash || cert._id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs flex items-center gap-1"
                          >
                            <span>Verify Credential & QR</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-[#666666] pt-2 border-t border-[#D9E1E8]">
                      <p>
                        <span>Verified Hash:</span>{" "}
                        <span className="font-mono text-[11px] text-[#191919]">
                          {cert.certificateHash
                            ? `${cert.certificateHash.slice(0, 10)}…${cert.certificateHash.slice(-8)}`
                            : "—"}
                        </span>
                      </p>
                      <p className="sm:text-right">
                        <span>Status:</span> <strong className="text-[#16805D]">Authenticated Ledger</strong>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            6. PROJECTS SHOWCASE
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
            <h2 className="text-base font-bold text-[#191919]">Projects & Work Artifacts</h2>
            <span className="text-xs text-[#666666]">{projects.length} Projects</span>
          </div>

          {projects.length === 0 ? (
            <p className="text-xs text-[#666666] italic py-2">No projects submitted by applicant.</p>
          ) : (
            <div className="space-y-3.5">
              {projects.map((proj) => (
                <div
                  key={proj._id || proj.projectHash}
                  className="p-4 rounded-lg border border-[#D9E1E8] bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#191919]">{proj.projectName || "Project"}</h3>
                      <p className="text-xs text-[#666666] mt-0.5">{proj.projectType || "Software Project"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold border border-[#D9E1E8] rounded bg-white hover:bg-[#F3F6F8]"
                        >
                          Repository ↗
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a
                          href={proj.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-xs font-semibold border border-[#0A66C2] text-[#0A66C2] rounded bg-white hover:bg-[#E8F3FF]"
                        >
                          Live Demo ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {proj.description && (
                    <p className="mt-2 text-xs text-[#666666] leading-relaxed">
                      {proj.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          OFFER MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E1E8] pb-3">
              <h3 className="text-base font-bold text-[#191919]">Send Employment Offer</h3>
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Candidate Name
                </label>
                <input
                  type="text"
                  disabled
                  value={student.name || "Candidate"}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-sm text-[#191919] opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Role / Job
                </label>
                <input
                  type="text"
                  disabled
                  value={job.title || "Job Position"}
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-sm text-[#191919] opacity-80"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Employment Type *
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                >
                  <option value="FullTime">Full-Time</option>
                  <option value="Internship">Internship</option>
                  <option value="PartTime">Part-Time</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#D9E1E8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#191919] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingOffer}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {sendingOffer ? "Transacting on Blockchain…" : "Confirm & Send Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicantDetail;
