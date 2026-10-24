import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../services/studentService";
import { getCertificates, getCertificateDocument } from "../../services/certificateService";
import { getStudentProjects } from "../../services/projectService";
import { getMyEmployment } from "../../services/employmentService";
import EditProfileModal, { calculateDuration } from "../../components/student/EditProfileModal";

const StudentProfile = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState({
    user: null,
    certificates: [],
    projects: [],
    currentEmployment: [],
    previousEmployment: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viewingCertId, setViewingCertId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, certsRes, projectsRes, empRes] = await Promise.allSettled([
        getProfile(),
        getCertificates(),
        getStudentProjects(),
        getMyEmployment(),
      ]);

      const fetchedUser =
        profileRes.status === "fulfilled" && profileRes.value
          ? profileRes.value
          : {};

      const certs =
        certsRes.status === "fulfilled" && certsRes.value
          ? Array.isArray(certsRes.value.certificates)
            ? certsRes.value.certificates
            : Array.isArray(certsRes.value)
            ? certsRes.value
            : []
          : [];

      const projs =
        projectsRes.status === "fulfilled" && projectsRes.value
          ? Array.isArray(projectsRes.value.projects)
            ? projectsRes.value.projects
            : Array.isArray(projectsRes.value)
            ? projectsRes.value
            : []
          : [];

      const emp =
        empRes.status === "fulfilled" && empRes.value ? empRes.value : {};

      const currentEmployment = Array.isArray(emp.currentEmployment)
        ? emp.currentEmployment
        : [];
      const previousEmployment = Array.isArray(emp.previousEmployment)
        ? emp.previousEmployment
        : [];

      setProfileData({
        user: { ...currentUser, ...fetchedUser },
        certificates: certs,
        projects: projs,
        currentEmployment,
        previousEmployment,
      });
    } catch (err) {
      console.error("Failed to load student profile data:", err);
      setProfileData((prev) => ({
        ...prev,
        user: currentUser,
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleProfileUpdated = (updatedUser) => {
    setProfileData((prev) => ({
      ...prev,
      user: { ...prev.user, ...updatedUser },
    }));
    loadData();
  };

  const handleViewCertificate = async (certificate) => {
    const certId = certificate._id || certificate.certificateHash;
    const directUrl = certificate.certificateURL;
    const hashOrId = certificate.certificateHash || certificate._id;

    if (!directUrl && !hashOrId) {
      alert("No certificate document or hash available for this certificate.");
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
              <h3 style="margin: 0 0 8px; font-size: 16px;">Loading Certificate</h3>
              <p style="margin: 0; font-size: 13px; color: #666666;">Fetching verified document...</p>
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
          console.warn("Backend stream failed, attempting direct URL:", streamErr);
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

  const user = profileData.user || currentUser || {};
  const certificates = profileData.certificates || [];
  const projects = profileData.projects || [];
  const skills = Array.isArray(user.skills)
    ? user.skills
    : typeof user.skills === "string" && user.skills.trim()
    ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // Filter for verified and accepted certificates only
  const verifiedCertsRaw = certificates.filter((c) => {
    const status = String(c.verificationStatus || "").toUpperCase();
    return (
      c.verifiedOnChain === true ||
      status === "VERIFIED" ||
      status === "ACCEPTED" ||
      status === "APPROVED"
    );
  });

  // Ensure each verified certificate appears only once (deduplicate by hash or ID)
  const uniqueVerifiedCerts = [];
  const seenCertKeys = new Set();
  for (const cert of verifiedCertsRaw) {
    const key = (cert.certificateHash || cert._id || "").toString().toLowerCase();
    if (key && !seenCertKeys.has(key)) {
      seenCertKeys.add(key);
      uniqueVerifiedCerts.push(cert);
    }
  }

  const customExperiences = Array.isArray(user.experience) ? user.experience : [];
  const systemEmployments = [...(profileData.currentEmployment || []), ...(profileData.previousEmployment || [])];

  const totalExperienceCount = customExperiences.length + systemEmployments.length;

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D9E1E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1.5 focus:outline-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#191919]">
                Skill<span className="text-[#0A66C2]">Sync</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#666666]">
              <Link to="/student/dashboard" className="hover:text-[#0A66C2] transition-colors">
                Dashboard
              </Link>
              <Link to="/student/certificates" className="hover:text-[#0A66C2] transition-colors">
                Certificates
              </Link>
              <Link to="/student/projects" className="hover:text-[#0A66C2] transition-colors">
                Projects
              </Link>
              <Link to="/student/jobs" className="hover:text-[#0A66C2] transition-colors">
                Jobs
              </Link>
              <Link to="/student/offers" className="hover:text-[#0A66C2] transition-colors">
                Offers
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition cursor-pointer"
            >
              Edit Profile
            </button>
            <Link
              to="/student/dashboard"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="rounded-md border border-[#C5221F]/30 bg-[#FCE8E6] p-3 text-xs font-medium text-[#C5221F]">
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            1. PERSONAL INFO & RESUME HEADER CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Profile Avatar */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-2xl font-bold text-white shadow-xs">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "ST"}
                {user.applicantId && (
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
                    {user.name || "Student Profile"}
                  </h1>
                  <span className="rounded-md bg-[#E8F3FF] text-[#0A66C2] px-2.5 py-0.5 text-xs font-semibold">
                    Applicant
                  </span>
                  {user.applicantId && (
                    <span className="rounded-md bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                      <span>✓</span> On-Chain Verified
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm sm:text-base font-medium text-[#0A66C2]">
                  {user.headline || "Aspiring Engineer & Technology Professional"}
                </p>

                {/* Limited Personal Info / Resume Contact Row */}
                <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-[#666666]">
                  {user.college && (
                    <span className="flex items-center gap-1">
                      <span>🏛️</span>
                      <span className="font-medium text-[#191919]">{user.college}</span>
                    </span>
                  )}
                  {user.usn && (
                    <span className="flex items-center gap-1">
                      <span>🆔</span>
                      <span className="font-mono text-[#191919]">USN: {user.usn}</span>
                    </span>
                  )}
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <span>✉️</span>
                      <span>{user.email}</span>
                    </span>
                  )}
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <span>📞</span>
                      <span>{user.phone}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Links & Edit Button */}
            <div className="flex flex-wrap items-center gap-2 self-start">
              {user.githubUrl && (
                <a
                  href={user.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition"
                >
                  GitHub ↗
                </a>
              )}
              {user.linkedinUrl && (
                <a
                  href={user.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#0A66C2] bg-white text-[#0A66C2] hover:bg-[#E8F3FF] transition"
                >
                  LinkedIn ↗
                </a>
              )}
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition cursor-pointer shadow-xs"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. ABOUT / BIO CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9E1E8]">
            <h2 className="text-base font-bold text-[#191919]">About</h2>
            {!user.bio && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer"
              >
                + Add Bio
              </button>
            )}
          </div>
          {user.bio ? (
            <p className="text-sm leading-relaxed text-[#191919] whitespace-pre-line">
              {user.bio}
            </p>
          ) : (
            <p className="text-xs text-[#666666] italic">
              No professional summary added yet. Click "Edit Profile" to share your background and career focus.
            </p>
          )}

          {/* Skills Tag Pills */}
          {skills.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#D9E1E8]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                Skills & Competencies
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
            3. EXPERIENCE & EMPLOYMENT SECTION (With Duration)
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="experience-section" className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
            <div>
              <h2 className="text-base font-bold text-[#191919]">Experience & Employment</h2>
              <p className="text-xs text-[#666666]">
                Previous employment history, internships, and verified on-chain roles with duration.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition cursor-pointer"
            >
              + Add / Edit Experience
            </button>
          </div>

          {totalExperienceCount === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2] mb-2">
                💼
              </div>
              <h3 className="text-sm font-semibold text-[#191919]">No employment history added</h3>
              <p className="text-xs text-[#666666] mt-0.5 max-w-sm mx-auto">
                Add previous internships, full-time employment, or part-time roles to showcase your experience.
              </p>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="mt-3.5 inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition"
              >
                + Add Experience
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Custom Student Experiences */}
              {customExperiences.map((exp, index) => {
                const duration = calculateDuration(exp.startDate, exp.endDate, exp.current);
                return (
                  <div
                    key={`custom-${index}`}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2] transition-colors"
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

                    {/* Employment Duration */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[#666666]">
                      <span>
                        {exp.startDate ? exp.startDate : "—"} – {exp.current ? "Present" : exp.endDate || "—"}
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

              {/* System SkillSync Employments */}
              {systemEmployments.map((rec, index) => {
                const isCurrent = rec.status === "Active";
                const startRaw = rec.joinedAt
                  ? typeof rec.joinedAt === "number"
                    ? rec.joinedAt * 1000
                    : rec.joinedAt
                  : rec.createdAt;
                const endRaw = !isCurrent ? (rec.leftAt || rec.updatedAt) : null;
                const duration = calculateDuration(startRaw, endRaw, isCurrent);

                const startedDate = startRaw
                  ? new Date(startRaw).toLocaleDateString()
                  : null;
                const endDateFormatted = isCurrent
                  ? "Present"
                  : endRaw
                  ? new Date(endRaw).toLocaleDateString()
                  : "Completed";

                const status = rec.status || "Active";

                return (
                  <div
                    key={`sys-${index}`}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <h3 className="text-sm font-bold text-[#191919]">
                          {rec.role || rec.job?.title || "Staff Position"}
                        </h3>
                        <p className="text-xs font-semibold text-[#0A66C2]">
                          {rec.organisation?.name || rec.organisation?.organisationName || "Verified Organisation"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center self-start sm:self-auto px-2 py-0.5 rounded text-[11px] font-semibold ${
                          status === "Active"
                            ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                            : "bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8]"
                        }`}
                      >
                        {status === "Active" ? "✓ Verified Active" : "Completed Employment"}
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
                      {rec.job?.jobType && (
                        <>
                          <span>·</span>
                          <span>{rec.job.jobType}</span>
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
            4. VERIFIED CERTIFICATES & CREDENTIALS SECTION (Only Verified & Accepted Once)
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="certificates-section" className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#191919]">Verified Certificates</h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E8F3FF] text-[#0A66C2]">
                  {uniqueVerifiedCerts.length} Verified On-Chain
                </span>
              </div>
              <p className="text-xs text-[#666666]">
                Only verified and accepted credentials appear on your public profile.
              </p>
            </div>

            <Link
              to="/student/certificates"
              className="px-3 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              + Upload & Manage Certificates
            </Link>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-[#666666]">Loading certificates…</div>
          ) : uniqueVerifiedCerts.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2] mb-2">
                📜
              </div>
              <h3 className="text-sm font-semibold text-[#191919]">No verified certificates on profile</h3>
              <p className="text-xs text-[#666666] mt-0.5 max-w-sm mx-auto">
                Only credentials verified and accepted by accredited organisations appear on your public profile. Upload a certificate and submit a verification request to showcase it here.
              </p>
              <Link
                to="/student/certificates"
                className="mt-3.5 inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-xs"
              >
                Upload & Request Verification
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {uniqueVerifiedCerts.map((cert) => {
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
                          Issued by: <strong className="text-[#191919]">{cert.issuer || cert.issuingOrganisation?.organisationName || "Accredited Organisation"}</strong>
                          {cert.certificateType && ` · ${cert.certificateType}`}
                        </p>
                      </div>

                      {/* Action buttons */}
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

                    <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs text-[#666666] pt-2.5 border-t border-[#D9E1E8]">
                      <p>
                        <span>Issue Date:</span>{" "}
                        <strong className="text-[#191919]">{cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "—"}</strong>
                      </p>
                      <p>
                        <span>Verified Status:</span>{" "}
                        <strong className="text-[#16805D]">
                          Authenticated Ledger
                        </strong>
                      </p>
                      <p>
                        <span>Hash:</span>{" "}
                        <span className="font-mono text-[11px] text-[#191919]">
                          {cert.certificateHash
                            ? `${cert.certificateHash.slice(0, 8)}…${cert.certificateHash.slice(-6)}`
                            : "—"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}

              {certificates.length > uniqueVerifiedCerts.length && (
                <div className="mt-4 pt-3 border-t border-[#D9E1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#666666]">
                  <span>
                    You have {certificates.length - uniqueVerifiedCerts.length} unverified or pending certificate(s) in your locker.
                  </span>
                  <Link to="/student/certificates" className="font-semibold text-[#0A66C2] hover:underline">
                    View All & Request Verification →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            5. PROJECTS SECTION
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="projects-section" className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#191919]">Projects</h2>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#E8F3FF] text-[#0A66C2]">
                  {projects.length} Total
                </span>
              </div>
              <p className="text-xs text-[#666666]">
                Technical projects showcase with verified deliverables and GitHub links.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/student/project-history"
                className="px-3 py-1.5 text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] rounded-md transition"
              >
                Project History
              </Link>
              <Link
                to="/student/project/add"
                className="px-3 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
              >
                + Add Project
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-6 text-center text-xs text-[#666666]">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2] mb-2">
                📁
              </div>
              <h3 className="text-sm font-semibold text-[#191919]">No projects added yet</h3>
              <p className="text-xs text-[#666666] mt-0.5 max-w-sm mx-auto">
                Add projects to showcase your repositories, technical applications, and verified deliverables.
              </p>
              <Link
                to="/student/project/add"
                className="mt-3.5 inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition"
              >
                + Add Project
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {projects.map((proj) => {
                const isVerified = proj.isVerified || proj.status === "APPROVED";
                const isPending =
                  proj.status === "PENDING" &&
                  (proj.verificationHistory?.length > 0 || proj.requests?.length > 0);

                return (
                  <div
                    key={proj._id || proj.githubHash}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2] transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-[#191919]">
                            {proj.projectName || "Project"}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isVerified
                                ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                                : proj.status === "REJECTED"
                                ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                                : isPending
                                ? "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20"
                                : "bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8]"
                            }`}
                          >
                            {isVerified
                              ? "✓ Verified"
                              : proj.status === "REJECTED"
                              ? "Rejected"
                              : isPending
                              ? "Pending Verification"
                              : "Portfolio Project"}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] mt-0.5">
                          Type: <strong className="text-[#191919]">{proj.projectType || "Technical Showcase"}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {proj.githubLink && (
                          <a
                            href={proj.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition"
                          >
                            GitHub Repo ↗
                          </a>
                        )}
                        {!isVerified && proj.status !== "REJECTED" && (
                          <Link
                            to={`/student/project/verify?type=project&projectId=${encodeURIComponent(proj._id)}`}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] hover:bg-[#E8F3FF] transition"
                          >
                            Request Verification
                          </Link>
                        )}
                      </div>
                    </div>

                    {proj.description && (
                      <p className="mt-2 text-xs text-[#666666] leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-xs text-[#666666] pt-2 border-t border-[#D9E1E8]">
                      <span>
                        Status: <strong className={isVerified ? "text-[#16805D]" : "text-[#191919]"}>{isVerified ? "Verified on Blockchain" : "Portfolio Item"}</strong>
                      </span>
                      {proj.createdAt && (
                        <span>Added: {new Date(proj.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default StudentProfile;
