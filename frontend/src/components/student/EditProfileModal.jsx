import { useState, useEffect } from "react";
import { updateProfile } from "../../services/studentService";
import { getGitHubConnectUrl } from "../../services/projectService";
import { useAuth } from "../../context/AuthContext";

export const calculateDuration = (startDate, endDate, current) => {
  if (!startDate) return "";
  const start = new Date(startDate);
  const end = current || !endDate ? new Date() : new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  months++;
  if (months >= 12) {
    years++;
    months -= 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? "mo" : "mos"}`);
  return parts.join(" ") || "1 mo";
};

const EditProfileModal = ({ isOpen, onClose, onProfileUpdated }) => {
  const { currentUser, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("personal"); // "personal" | "experience"

  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    bio: "",
    skills: "",
    college: "",
    usn: "",
    phone: "",
    githubUrl: "",
    linkedinUrl: "",
    experience: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        headline: currentUser.headline || "",
        bio: currentUser.bio || "",
        skills: Array.isArray(currentUser.skills)
          ? currentUser.skills.join(", ")
          : currentUser.skills || "",
        college: currentUser.college || "",
        usn: currentUser.usn || "",
        phone: currentUser.phone || "",
        githubUrl: currentUser.githubUrl || "",
        linkedinUrl: currentUser.linkedinUrl || "",
        experience: Array.isArray(currentUser.experience) ? currentUser.experience : [],
      });
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          title: "",
          company: "",
          location: "",
          startDate: "",
          endDate: "",
          current: false,
          description: "",
        },
      ],
    }));
  };

  const handleRemoveExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleExperienceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, experience: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const updated = await updateProfile(formData);
      updateUser(updated);
      setSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] outline-none transition focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider mb-1 text-[#666666]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#000000]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-lg text-[#191919]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#D9E1E8]">
          <div>
            <h2 className="text-lg font-bold text-[#191919]">Edit Applicant Profile</h2>
            <p className="text-xs text-[#666666]">Update your personal details, bio, and employment experience</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-md border border-[#D9E1E8] hover:bg-[#F3F6F8] flex items-center justify-center text-sm font-semibold text-[#666666] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mt-4 pb-1 border-b border-[#D9E1E8]">
          <button
            type="button"
            onClick={() => setActiveTab("personal")}
            className={`pb-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "personal"
                ? "border-[#0A66C2] text-[#0A66C2]"
                : "border-transparent text-[#666666] hover:text-[#191919]"
            }`}
          >
            Personal & Bio
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("experience")}
            className={`pb-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "experience"
                ? "border-[#0A66C2] text-[#0A66C2]"
                : "border-transparent text-[#666666] hover:text-[#191919]"
            }`}
          >
            Work Experience ({formData.experience.length})
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-[#C5221F]/30 bg-[#FCE8E6] p-3 text-xs font-medium text-[#C5221F]">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-md border border-[#16805D]/30 bg-[#E6F4EA] p-3 text-xs font-medium text-[#16805D]">
            ✓ Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {activeTab === "personal" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className={labelClass}>Professional Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. Software Engineer | Full-Stack"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Bio / Summary</label>
                <textarea
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Professional summary, achievements, and career focus..."
                />
              </div>

              <div>
                <label className={labelClass}>Skills (comma separated)</label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="e.g. React, Node.js, Python, Solidity, SQL"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>College / Institution</label>
                  <input
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. National Institute of Technology"
                  />
                </div>
                <div>
                  <label className={labelClass}>USN / Student ID</label>
                  <input
                    type="text"
                    name="usn"
                    value={formData.usn}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. 1MS21CS042"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>GitHub URL</label>
                    {currentUser.githubConnected ? (
                      <span className="text-[10px] font-semibold text-[#16805D] bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#16805D]/20">
                        ✓ @{currentUser.githubUsername} Linked
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const { authUrl } = await getGitHubConnectUrl("/student/profile");
                            if (authUrl) window.location.href = authUrl;
                          } catch (err) {
                            alert(err.response?.data?.message || "Could not connect with GitHub");
                          }
                        }}
                        className="text-[11px] font-semibold text-[#0A66C2] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Connect GitHub</span> ↗
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label className={labelClass}>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#666666]">
                  Record your employment history, internships, and roles with dates & duration.
                </p>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition cursor-pointer"
                >
                  + Add Role / Employment
                </button>
              </div>

              {formData.experience.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[#D9E1E8] p-6 text-center text-xs text-[#666666]">
                  No employment records added yet. Click "+ Add Role / Employment" to add previous or current positions.
                </div>
              ) : (
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                  {formData.experience.map((exp, index) => {
                    const durationText = calculateDuration(exp.startDate, exp.endDate, exp.current);
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-[#D9E1E8] bg-[#F3F6F8]/60 p-4 space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#191919]">
                            Position #{index + 1} {durationText ? `• ${durationText}` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperience(index)}
                            className="text-xs text-[#C5221F] hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className={labelClass}>Job Title / Role *</label>
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => handleExperienceChange(index, "title", e.target.value)}
                              required
                              className={inputClass}
                              placeholder="e.g. Software Engineer Intern"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Company / Organisation *</label>
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                              required
                              className={inputClass}
                              placeholder="e.g. Acme Tech Solutions"
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className={labelClass}>Location</label>
                            <input
                              type="text"
                              value={exp.location}
                              onChange={(e) => handleExperienceChange(index, "location", e.target.value)}
                              className={inputClass}
                              placeholder="e.g. Bengaluru, India (or Remote)"
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Start Date</label>
                            <input
                              type="month"
                              value={exp.startDate}
                              onChange={(e) => handleExperienceChange(index, "startDate", e.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              {exp.current ? "End Date (Current)" : "End Date"}
                            </label>
                            <input
                              type="month"
                              disabled={exp.current}
                              value={exp.endDate}
                              onChange={(e) => handleExperienceChange(index, "endDate", e.target.value)}
                              className={`${inputClass} ${exp.current ? "bg-[#F3F6F8] opacity-60" : ""}`}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`curr-${index}`}
                              checked={exp.current}
                              onChange={(e) => handleExperienceChange(index, "current", e.target.checked)}
                              className="rounded border-[#D9E1E8] text-[#0A66C2] focus:ring-[#0A66C2]"
                            />
                            <label htmlFor={`curr-${index}`} className="text-xs text-[#191919] cursor-pointer">
                              I currently work here
                            </label>
                          </div>

                          {durationText && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] bg-[#E8F3FF] px-2 py-0.5 rounded-full">
                              Duration: {durationText}
                            </span>
                          )}
                        </div>

                        <div>
                          <label className={labelClass}>Description / Responsibilities</label>
                          <textarea
                            rows="2"
                            value={exp.description}
                            onChange={(e) => handleExperienceChange(index, "description", e.target.value)}
                            className={inputClass}
                            placeholder="Key responsibilities, achievements, technologies used..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#D9E1E8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition disabled:opacity-60 cursor-pointer shadow-xs"
            >
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
