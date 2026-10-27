import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCurrentUser, updateUserSettings } from "../../services/authService";
import {
  FaUser,
  FaBell,
  FaSignOutAlt,
  FaLink,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaShieldAlt,
  FaEnvelope,
  FaExternalLinkAlt,
  FaGithub,
  FaLinkedin,
  FaGlobe,
  FaBriefcase,
  FaCertificate,
  FaTasks,
} from "react-icons/fa";

export default function SettingsModal({ isOpen, onClose, initialTab = "account" }) {
  const { currentUser, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(initialTab); // "account" | "notifications"
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const isOrg =
    (currentUser?.role || "").toUpperCase() === "ORGANISATION" ||
    !!currentUser?.organisationName;

  // Account & Links form state
  const [formData, setFormData] = useState({
    name: "",
    organisationName: "",
    headline: "",
    bio: "",
    phone: "",
    college: "",
    usn: "",
    githubUrl: "",
    linkedinUrl: "",
    website: "",
    emailNotificationsEnabled: true,
    notificationPreferences: {
      jobOffers: true,
      jobPostings: true,
      applications: true,
      certificates: true,
      verifications: true,
      projects: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setStatusMessage({ type: "", text: "" });
      fetchProfile();
    }
  }, [isOpen, initialTab]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getCurrentUser();
      const user = res?.user || currentUser || {};
      const prefs = user.notificationPreferences || {};
      setFormData({
        name: user.name || user.organisationName || "",
        organisationName: user.organisationName || user.name || "",
        headline: user.headline || "",
        bio: user.bio || user.description || "",
        phone: user.phone || "",
        college: user.college || "",
        usn: user.usn || "",
        githubUrl: user.githubUrl || "",
        linkedinUrl: user.linkedinUrl || "",
        website: user.website || "",
        emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
        notificationPreferences: {
          jobOffers: prefs.jobOffers !== false,
          jobPostings: prefs.jobPostings !== false,
          applications: prefs.applications !== false,
          certificates: prefs.certificates !== false,
          verifications: prefs.verifications !== false,
          projects: prefs.projects !== false,
        },
      });
    } catch {
      // Fallback to context user
      if (currentUser) {
        const prefs = currentUser.notificationPreferences || {};
        setFormData((prev) => ({
          ...prev,
          name: currentUser.name || currentUser.organisationName || "",
          organisationName: currentUser.organisationName || currentUser.name || "",
          headline: currentUser.headline || "",
          bio: currentUser.bio || currentUser.description || "",
          phone: currentUser.phone || "",
          college: currentUser.college || "",
          usn: currentUser.usn || "",
          githubUrl: currentUser.githubUrl || "",
          linkedinUrl: currentUser.linkedinUrl || "",
          website: currentUser.website || "",
          emailNotificationsEnabled: currentUser.emailNotificationsEnabled !== false,
          notificationPreferences: {
            jobOffers: prefs.jobOffers !== false,
            jobPostings: prefs.jobPostings !== false,
            applications: prefs.applications !== false,
            certificates: prefs.certificates !== false,
            verifications: prefs.verifications !== false,
            projects: prefs.projects !== false,
          },
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAccount = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const payload = {
        name: formData.name.trim(),
        organisationName: formData.organisationName.trim(),
        headline: formData.headline.trim(),
        bio: formData.bio.trim(),
        description: formData.bio.trim(),
        phone: formData.phone.trim(),
        college: formData.college.trim(),
        usn: formData.usn.trim(),
        githubUrl: formData.githubUrl.trim(),
        linkedinUrl: formData.linkedinUrl.trim(),
        website: formData.website.trim(),
      };

      const res = await updateUserSettings(payload);
      if (res?.user) {
        updateUser({ ...currentUser, ...res.user });
      }
      setStatusMessage({
        type: "success",
        text: "✓ Account profile and links updated successfully!",
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3500);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleNotifications = async () => {
    const nextVal = !formData.emailNotificationsEnabled;
    setFormData((prev) => ({ ...prev, emailNotificationsEnabled: nextVal }));
    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const res = await updateUserSettings({ emailNotificationsEnabled: nextVal });
      if (res?.user) {
        updateUser({ ...currentUser, ...res.user });
      }
      setStatusMessage({
        type: "success",
        text: nextVal
          ? "✓ Email notifications enabled! Important alerts will be sent to your verified email."
          : "✓ Email notifications paused.",
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3500);
    } catch (err) {
      // Revert state on failure
      setFormData((prev) => ({ ...prev, emailNotificationsEnabled: !nextVal }));
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update preference.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = async (key) => {
    const currentVal = formData.notificationPreferences?.[key] !== false;
    const nextVal = !currentVal;
    const updatedPreferences = {
      ...formData.notificationPreferences,
      [key]: nextVal,
    };

    setFormData((prev) => ({
      ...prev,
      notificationPreferences: updatedPreferences,
    }));
    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const res = await updateUserSettings({ notificationPreferences: updatedPreferences });
      if (res?.user) {
        updateUser({ ...currentUser, ...res.user });
      }
      setStatusMessage({
        type: "success",
        text: "✓ Notification preferences saved!",
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      // Revert state on failure
      setFormData((prev) => ({
        ...prev,
        notificationPreferences: {
          ...prev.notificationPreferences,
          [key]: currentVal,
        },
      }));
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update category preference.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of SkillSync?")) {
      logout();
      onClose();
      navigate("/login");
    }
  };

  const notificationCategories = isOrg
    ? [
        {
          key: "applications",
          icon: <FaUser className="text-xs" />,
          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
          title: "Candidate Job Applications",
          description: "Alerts when students apply to your published job postings or internship openings.",
        },
        {
          key: "jobOffers",
          icon: "⭐",
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          title: "Offer Responses & Hiring Decisions",
          description: "Immediate alerts when candidates accept or decline your official employment offers.",
        },
        {
          key: "verifications",
          icon: <FaShieldAlt className="text-xs" />,
          iconBg: "bg-sky-50 text-sky-600 border-sky-200",
          title: "Student Verification Requests",
          description: "Incoming requests from students asking your organisation to review and verify credentials on-chain.",
        },
        {
          key: "certificates",
          icon: <FaCertificate className="text-xs" />,
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          title: "Certificate Issuances & Direct Awards",
          description: "Confirmations and blockchain anchoring updates for credentials issued by your organisation.",
        },
        {
          key: "jobPostings",
          icon: <FaBriefcase className="text-xs" />,
          iconBg: "bg-blue-50 text-blue-600 border-blue-200",
          title: "Job Listings & Posting Activity",
          description: "Confirmation alerts when your organisation creates or updates job listings and internships.",
        },
        {
          key: "projects",
          icon: "🚀",
          iconBg: "bg-purple-50 text-purple-600 border-purple-200",
          title: "Project Verification Reviews",
          description: "Updates when student projects are assigned or submitted to your organisation for verification.",
        },
      ]
    : [
        {
          key: "jobOffers",
          icon: "⭐",
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          title: "Job Offers & Employment Updates",
          description: "Official employment/internship offers extended to you, acceptance confirmations, and status updates.",
        },
        {
          key: "jobPostings",
          icon: <FaBriefcase className="text-xs" />,
          iconBg: "bg-blue-50 text-blue-600 border-blue-200",
          title: "New Job & Internship Postings",
          description: "Announcements when new jobs and internships are published by verified organisations.",
        },
        {
          key: "applications",
          icon: <FaUser className="text-xs" />,
          iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
          title: "Job Application Status Updates",
          description: "Alerts when organisations review your job applications or update your candidacy status.",
        },
        {
          key: "certificates",
          icon: <FaCertificate className="text-xs" />,
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          title: "Certificates & Credentials",
          description: "Accredited certificate issuances, uploads, and tamper-proof verification on-chain.",
        },
        {
          key: "verifications",
          icon: <FaShieldAlt className="text-xs" />,
          iconBg: "bg-sky-50 text-sky-600 border-sky-200",
          title: "Verification Requests & Decisions",
          description: "Instant alerts when organisations approve or reject your certificate verification requests.",
        },
        {
          key: "projects",
          icon: "🚀",
          iconBg: "bg-purple-50 text-purple-600 border-purple-200",
          title: "Projects & GitHub Sync",
          description: "Portfolio project submissions, GitHub repository linkings, and verification approvals.",
        },
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl border border-[#D9E1E8] bg-white text-[#191919] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A66C2] text-white flex items-center justify-center text-base shadow-xs">
              ⚙️
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] tracking-tight">
                Settings & Preferences
              </h2>
              <p className="text-xs text-[#64748B]">
                Manage your account credentials, links, notifications, and security
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition cursor-pointer"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E2E8F0] bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "account"
                ? "border-[#0A66C2] text-[#0A66C2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FaUser className="text-xs" />
            <span>Account & Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === "notifications"
                ? "border-[#0A66C2] text-[#0A66C2]"
                : "border-transparent text-[#64748B] hover:text-[#0F172A]"
            }`}
          >
            <FaBell className="text-xs" />
            <span>Notifications</span>
            {formData.emailNotificationsEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Global Toast Alert */}
        {statusMessage.text && (
          <div
            className={`mx-6 mt-4 p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
              statusMessage.type === "success"
                ? "bg-[#E6F4EA] border-[#16805D]/30 text-[#16805D]"
                : "bg-[#FCE8E6] border-[#C5221F]/30 text-[#C5221F]"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              type="button"
              onClick={() => setStatusMessage({ type: "", text: "" })}
              className="font-bold opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-[#64748B]">
              <FaSpinner className="animate-spin text-2xl text-[#0A66C2] mb-2" />
              <p className="text-xs">Loading settings…</p>
            </div>
          ) : activeTab === "account" ? (
            /* ═══════════════════════════════════════════════════════════════
               TAB 1: ACCOUNT (Profile, Links, Logout)
            ═══════════════════════════════════════════════════════════════ */
            <form onSubmit={handleSaveAccount} className="space-y-6">
              {/* 1. Basic Profile Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
                  <FaUser className="text-[11px]" />
                  <span>Profile Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      {isOrg ? "Organisation Name" : "Full Name"} *
                    </label>
                    <input
                      type="text"
                      name={isOrg ? "organisationName" : "name"}
                      value={isOrg ? formData.organisationName : formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Headline / Title
                    </label>
                    <input
                      type="text"
                      name="headline"
                      placeholder={isOrg ? "e.g. Leading Tech Innovator" : "e.g. Full Stack Developer | Final Year CS"}
                      value={formData.headline}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                    />
                  </div>

                  {!isOrg && (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1">
                          College / University
                        </label>
                        <input
                          type="text"
                          name="college"
                          value={formData.college}
                          onChange={handleChange}
                          placeholder="e.g. MIT, Cambridge, RVCE"
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1">
                          USN / Student ID
                        </label>
                        <input
                          type="text"
                          name="usn"
                          value={formData.usn}
                          onChange={handleChange}
                          placeholder="e.g. 1RV21CS001"
                          className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#334155] mb-1">
                      Bio / Description
                    </label>
                    <textarea
                      rows={3}
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder={isOrg ? "Brief overview of the organisation and mission…" : "Brief description of your passion, background, and goals…"}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Add Links Section */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3 flex items-center gap-1.5">
                  <FaLink className="text-[11px]" />
                  <span>External & Social Links</span>
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1 flex items-center gap-1.5">
                      <FaGithub className="text-slate-700" />
                      <span>GitHub Profile Link</span>
                    </label>
                    <input
                      type="url"
                      name="githubUrl"
                      placeholder="https://github.com/username"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1 flex items-center gap-1.5">
                      <FaLinkedin className="text-[#0A66C2]" />
                      <span>LinkedIn Profile Link</span>
                    </label>
                    <input
                      type="url"
                      name="linkedinUrl"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#334155] mb-1 flex items-center gap-1.5">
                      <FaGlobe className="text-emerald-600" />
                      <span>Portfolio / Website Link</span>
                    </label>
                    <input
                      type="url"
                      name="website"
                      placeholder="https://yourportfolio.dev"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] outline-none"
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {saving && <FaSpinner className="animate-spin text-xs" />}
                    <span>Save Profile & Links</span>
                  </button>
                </div>
              </div>

              {/* 3. Session & Logout Zone (cleanly housed inside Settings -> Account) */}
              <div className="pt-4 border-t border-[#E2E8F0]">
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                      <FaSignOutAlt className="text-rose-600" />
                      <span>Session & Sign Out</span>
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      End your active authenticated session on this browser.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white border border-rose-300 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <FaSignOutAlt className="text-xs" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ═══════════════════════════════════════════════════════════════
               TAB 2: NOTIFICATIONS ("allow notifications" toggle)
            ═══════════════════════════════════════════════════════════════ */
            <div className="space-y-6">
              {/* Verified Email Banner */}
              <div className="rounded-xl border border-sky-100 bg-[#E8F3FF]/70 p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <FaEnvelope className="text-xs" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0F172A]">
                      Verified Email Address:
                    </span>
                    <span className="text-xs font-semibold text-[#0A66C2] bg-white px-2 py-0.5 rounded border border-[#0A66C2]/20">
                      {currentUser?.email || "verified email"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <FaCheck className="text-[9px]" />
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                    This email was verified during signup. Activity updates and critical notifications are routed here.
                  </p>
                </div>
              </div>

              {/* Allow Notifications Toggle Card */}
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <FaBell className="text-[#0A66C2]" />
                      <span>Allow Email Notifications</span>
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1 leading-relaxed max-w-md">
                      When enabled, SkillSync will deliver real-time notifications directly to your email address whenever:
                    </p>
                    <ul className="mt-2 space-y-1.5 text-xs text-[#334155] list-disc list-inside">
                      {isOrg ? (
                        <>
                          <li>
                            Candidates submit <strong className="text-blue-800 bg-blue-50 px-1 rounded">Applications</strong> to your job or internship openings
                          </li>
                          <li>
                            Candidates <strong className="text-emerald-800 bg-emerald-50 px-1 rounded">Accept</strong> or <strong className="text-rose-800 bg-rose-50 px-1 rounded">Decline</strong> your official job offers
                          </li>
                          <li>
                            Students submit <strong className="text-sky-800 bg-sky-50 px-1 rounded">Verification Requests</strong> for credentials or certificates
                          </li>
                          <li>
                            Direct certificate issuances or organization administrative updates occur
                          </li>
                        </>
                      ) : (
                        <>
                          <li>
                            <strong className="text-amber-800 bg-amber-50 px-1 rounded">⭐ Official Job Offers</strong> are sent to you
                          </li>
                          <li>
                            A certificate or project verification request is <span className="text-emerald-700 font-semibold">Approved</span> on-chain
                          </li>
                          <li>
                            A verification request is <span className="text-rose-700 font-semibold">Rejected</span> with reviewer feedback
                          </li>
                          <li>
                            An accredited organisation issues a new verified certificate to your portfolio
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={formData.emailNotificationsEnabled}
                      onChange={handleToggleNotifications}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0A66C2]"></div>
                  </label>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>
                    Status:{" "}
                    <strong
                      className={
                        formData.emailNotificationsEnabled
                          ? "text-emerald-600 font-bold"
                          : "text-slate-500"
                      }
                    >
                      {formData.emailNotificationsEnabled
                        ? "Active (Email Delivery ON)"
                        : "Paused (Only In-App Bell Active)"}
                    </strong>
                  </span>
                  <span>Zero-Spam Policy</span>
                </div>
              </div>

              {/* Granular Notification Categories Section */}
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <FaTasks className="text-[#0A66C2]" />
                    <span>Choose What Notifications You Receive</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-1">
                    {isOrg
                      ? "Toggle organisation activity topics. Disabled categories will not generate in-app bell alerts or email notifications."
                      : "Toggle individual activity topics. Disabled categories will not generate in-app bell alerts or email notifications."}
                  </p>
                </div>

                <div className="divide-y divide-[#F1F5F9]">
                  {notificationCategories.map((cat) => (
                    <div key={cat.key} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${cat.iconBg}`}
                        >
                          {cat.icon}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0F172A]">
                            {cat.title}
                          </h4>
                          <p className="text-[11px] text-[#64748B] mt-0.5">
                            {cat.description}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={formData.notificationPreferences?.[cat.key] !== false}
                          onChange={() => handleToggleCategory(cat.key)}
                          disabled={saving}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0A66C2]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
