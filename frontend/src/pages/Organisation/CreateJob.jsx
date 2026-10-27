import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createJob } from "../../services/employmentService";
import { formatSalary } from "../student/Jobs";
import NotificationBell from "../../components/common/NotificationBell";
import SettingsModal from "../../components/common/SettingsModal";
import { FaCog } from "react-icons/fa";

function CreateJob() {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requiredSkills: "",
    employmentType: "Internship",
    location: "Remote",
    stipend: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedSkills = formData.requiredSkills.trim();
    const trimmedLocation = formData.location.trim();

    if (!trimmedTitle || !trimmedDescription || !formData.employmentType || !trimmedLocation || !trimmedSkills) {
      setStatusMessage({
        type: "error",
        text: "Please fill in title, description, employment type, location, and required skills.",
      });
      return;
    }

    const payload = {
      ...formData,
      title: trimmedTitle,
      description: trimmedDescription,
      location: trimmedLocation,
      stipend: formData.stipend !== "" ? Number(formData.stipend) : null,
      requiredSkills: trimmedSkills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    setLoading(true);
    try {
      await createJob(payload);
      setStatusMessage({
        type: "success",
        text: "✓ Opportunity posted successfully! It is now live for all student applicants.",
      });

      setFormData({
        title: "",
        description: "",
        requiredSkills: "",
        employmentType: "Internship",
        location: "Remote",
        stipend: "",
      });

      setTimeout(() => {
        navigate("/organisation/jobs");
      }, 1500);
    } catch (error) {
      console.error("Create job error:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to create job posting.",
      });
    } finally {
      setLoading(false);
    }
  };

  const skillsArray = formData.requiredSkills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

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
              <Link to="/organisation/create-job" className="text-[#0A66C2] font-semibold">
                Post Job
              </Link>
              <Link to="/organisation/employees" className="hover:text-[#0A66C2] transition-colors">
                Employees
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Settings & Preferences"
            >
              <FaCog className="w-5 h-5" />
            </button>
            <Link
              to="/organisation/jobs"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              My Job Postings
            </Link>
            <Link
              to="/organisation"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {/* Page Title Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] text-sm font-bold">
              💼
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-[#191919]">Post a New Opportunity</h1>
          </div>
          <p className="mt-1 text-xs text-[#666666]">
            Publish internships, full-time positions, or research roles for on-chain verified applicants.
          </p>
        </div>

        {/* Status Message */}
        {statusMessage.text && (
          <div
            className={`p-3.5 rounded-md text-xs font-medium border ${
              statusMessage.type === "success"
                ? "border-[#16805D]/30 bg-[#E6F4EA] text-[#16805D]"
                : "border-[#C5221F]/30 bg-[#FCE8E6] text-[#C5221F]"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Form and Live Preview Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Form Column */}
          <div className="lg:col-span-7 rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-7 shadow-xs">
            <h2 className="text-base font-bold text-[#191919] border-b border-[#D9E1E8] pb-3 mb-5">
              Opportunity Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Job / Role Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Senior Frontend Engineer, Blockchain Research Intern"
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Employment Type *
                  </label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    required
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="Internship">Internship</option>
                    <option value="FullTime">Full-Time</option>
                    <option value="PartTime">Part-Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Work Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Remote, Bengaluru, Mumbai"
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Monthly Stipend / Salary (in ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-[#666666] text-sm">₹</span>
                  <input
                    type="number"
                    name="stipend"
                    value={formData.stipend}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 50000 (leave blank for negotiable)"
                    className="w-full rounded-md border border-[#D9E1E8] bg-white pl-8 pr-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#666666]">
                  Enter monthly remuneration in INR. Used by candidates for browsing and salary filters.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Required Skills * (comma-separated)
                </label>
                <input
                  type="text"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleChange}
                  required
                  placeholder="React, TypeScript, Node.js, Solidity"
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Job Description & Qualifications *
                </label>
                <textarea
                  rows="5"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Outline responsibilities, required qualifications, project mission, and what the applicant will build..."
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#D9E1E8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/organisation/jobs")}
                  className="px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#191919] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? "Publishing Opportunity…" : "Publish Opportunity"}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D9E1E8]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  Live Candidate Preview
                </h3>
                <span className="text-[11px] text-[#0A66C2] font-semibold">How students will see it</span>
              </div>

              {/* Mock Job Card */}
              <div className="rounded-lg border border-[#D9E1E8] bg-white p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] text-white font-bold text-sm shadow-xs">
                      OR
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#191919]">
                        {formData.title || "Job Title Preview"}
                      </h4>
                      <p className="text-xs text-[#666666]">
                        Your Organisation <span className="text-[#16805D]">✓</span> · {formData.location || "Remote"}
                      </p>
                    </div>
                  </div>

                  <span className="rounded bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8] px-2 py-0.5 text-[11px] font-semibold">
                    {formData.employmentType}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="rounded bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2 py-0.5 font-semibold">
                    💰 {formatSalary(formData.stipend)}
                  </span>
                  <span className="rounded bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8] px-2 py-0.5 font-medium">
                    🕒 Posted Just now
                  </span>
                </div>

                <p className="text-xs text-[#666666] line-clamp-3">
                  {formData.description || "Enter a role description on the left to see the candidate preview here..."}
                </p>

                {skillsArray.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {skillsArray.map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded px-2 py-0.5 text-[10px] font-medium bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default CreateJob;