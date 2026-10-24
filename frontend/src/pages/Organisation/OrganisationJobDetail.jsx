import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getJobById,
  updateJob,
  deleteJob,
  getApplicants,
} from "../../services/employmentService";

const EMPLOYMENT_TYPES = ["FullTime", "Internship", "PartTime"];

function OrganisationJobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applicantCount, setApplicantCount] = useState(0);

  // Edit Mode Toggle
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Edit Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    employmentType: "FullTime",
    location: "Remote",
    stipend: "",
    isActive: true,
  });

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  const fetchJobData = async () => {
    setLoading(true);
    try {
      const [jobData, applicantsData] = await Promise.all([
        getJobById(jobId),
        getApplicants(jobId).catch(() => []),
      ]);

      setJob(jobData);
      setApplicantCount(Array.isArray(applicantsData) ? applicantsData.length : 0);

      const skillsStr = Array.isArray(jobData?.requiredSkills)
        ? jobData.requiredSkills.join(", ")
        : jobData?.requiredSkills || "";

      setFormData({
        title: jobData?.title || "",
        description: jobData?.description || "",
        requiredSkills: skillsStr,
        employmentType: jobData?.employmentType || "FullTime",
        location: jobData?.location || "Remote",
        stipend: jobData?.stipend !== null && jobData?.stipend !== undefined ? String(jobData.stipend) : "",
        isActive: jobData?.isActive !== undefined ? jobData.isActive : true,
      });
    } catch (err) {
      console.error("Failed to load job details:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to load job role details.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setStatusMessage({ type: "error", text: "Role title cannot be empty." });
      return;
    }
    if (!formData.description.trim()) {
      setStatusMessage({ type: "error", text: "Role description cannot be empty." });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: "", text: "" });

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        employmentType: formData.employmentType,
        location: formData.location.trim() || "Remote",
        stipend: formData.stipend !== "" ? Number(formData.stipend) : null,
        isActive: formData.isActive,
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      const updated = await updateJob(jobId, payload);
      setJob(updated);
      setIsEditing(false);
      setStatusMessage({
        type: "success",
        text: "✓ Job role details updated successfully!",
      });

      setTimeout(() => {
        setStatusMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      console.error("Save job error:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update role details.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete the job posting "${job?.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await deleteJob(jobId);
      navigate("/organisation");
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to delete job posting.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Top Breadcrumb Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#666666]">
            <button
              type="button"
              onClick={() => navigate("/organisation")}
              className="font-semibold text-[#0A66C2] hover:underline cursor-pointer"
            >
              ← Back to Dashboard
            </button>
            <span>/</span>
            <span>Job Opportunities</span>
            <span>/</span>
            <span className="text-[#191919] font-medium truncate max-w-xs">
              {job?.title || "Role Details"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/organisation/jobs/${jobId}/applications`}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs flex items-center gap-1.5"
            >
              <span>👥 View Applicants ({applicantCount})</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#0A66C2] border-t-transparent" />
            <p className="text-xs text-[#666666]">Loading role specifications & details…</p>
          </div>
        )}

        {/* Status Message Alert */}
        {statusMessage.text && (
          <div
            className={`mb-6 p-4 rounded-xl border text-xs font-medium shadow-xs ${
              statusMessage.type === "success"
                ? "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20"
                : "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Not Found */}
        {!loading && !job && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-10 text-center shadow-xs">
            <p className="text-sm font-semibold text-[#191919]">Job Posting Not Found</p>
            <p className="text-xs text-[#666666] mt-1">This job opportunity might have been removed.</p>
            <Link
              to="/organisation"
              className="mt-4 inline-block px-4 py-2 rounded-md bg-[#0A66C2] text-white text-xs font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Main Content Card */}
        {!loading && job && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs">
            {/* Header / Actions Row */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-[#D9E1E8]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                    {job.title}
                  </h1>
                  {job.employmentType && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20">
                      {job.employmentType}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-semibold border ${
                      job.isActive !== false
                        ? "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20"
                        : "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20"
                    }`}
                  >
                    {job.isActive !== false ? "Active Role" : "Closed"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-[#666666]">
                  <span>📍 {job.location || "Remote"}</span>
                  <span>💰 {job.stipend ? `₹${job.stipend.toLocaleString()} / month` : "Competitive"}</span>
                  {job.createdAt && (
                    <span>
                      📅 Posted {new Date(job.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit / Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-md text-xs font-semibold border transition cursor-pointer ${
                    isEditing
                      ? "bg-[#191919] text-white border-[#191919]"
                      : "bg-white text-[#0A66C2] border-[#0A66C2] hover:bg-[#E8F3FF]"
                  }`}
                >
                  {isEditing ? "✕ Cancel Editing" : "✏️ Edit Role Details"}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-md text-xs font-semibold border border-[#C5221F]/30 bg-white text-[#C5221F] hover:bg-[#FCE8E6] transition cursor-pointer"
                  title="Delete job posting"
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* ══ VIEW MODE ══ */}
            {!isEditing && (
              <div className="mt-6 space-y-6">
                {/* Required Skills Section */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                    Required Skills & Competencies
                  </h2>
                  {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {job.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-md text-xs font-medium bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#888888]">No specific skills listed.</p>
                  )}
                </div>

                {/* Job Description Section */}
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-2.5">
                    Role Description & Expectations
                  </h2>
                  <div className="rounded-lg bg-[#F8FBFF] border border-[#D9E1E8] p-5 text-xs text-[#191919] leading-relaxed whitespace-pre-line font-normal">
                    {job.description || "No detailed description provided."}
                  </div>
                </div>

                {/* Candidate Pipeline Banner */}
                <div className="pt-4 border-t border-[#D9E1E8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#191919]">
                      Candidate Pipeline ({applicantCount} Applications)
                    </p>
                    <p className="text-[11px] text-[#666666]">
                      Review candidate resumes, inspect verified academic credentials, and send blockchain offers.
                    </p>
                  </div>
                  <Link
                    to={`/organisation/jobs/${jobId}/applications`}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs flex items-center gap-1"
                  >
                    <span>View All Applicants</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ══ EDIT MODE ══ */}
            {isEditing && (
              <form onSubmit={handleSave} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Role Title <span className="text-[#C5221F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Employment Type <span className="text-[#C5221F]">*</span>
                    </label>
                    <select
                      name="employmentType"
                      value={formData.employmentType}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Location / Workplace Type <span className="text-[#C5221F]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. Remote, Hybrid, Bengaluru"
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Monthly Stipend / Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="stipend"
                      value={formData.stipend}
                      onChange={handleInputChange}
                      placeholder="e.g. 50000"
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-[#D9E1E8] text-[#0A66C2] focus:ring-[#0A66C2]"
                    />
                    <label htmlFor="isActive" className="text-xs font-semibold text-[#191919] cursor-pointer">
                      Job Opening Active & Accepting Applicants
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Required Skills <span className="text-[#666666] font-normal">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={handleInputChange}
                      placeholder="e.g. Node.js, React, MongoDB, Docker, TypeScript"
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                      Role Description & Expectations <span className="text-[#C5221F]">*</span>
                    </label>
                    <textarea
                      rows={6}
                      required
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Outline core responsibilities, key project deliverables, and qualifications..."
                      className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="pt-4 border-t border-[#D9E1E8] flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#666666] hover:bg-[#F3F6F8] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-md text-xs font-semibold bg-[#16805D] text-white hover:bg-[#137352] transition shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {saving ? "Saving Changes…" : "✓ Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganisationJobDetail;
