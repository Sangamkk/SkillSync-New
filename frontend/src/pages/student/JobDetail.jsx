import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getJobById, getMyApplications, applyToJob } from "../../services/employmentService";
import { formatTimeAgo, formatJobDate, formatSalary } from "./Jobs";

const JobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  const fetchJobDetail = async () => {
    try {
      setLoading(true);
      const [jobData, myApplications] = await Promise.all([
        getJobById(jobId).catch(() => null),
        getMyApplications().catch(() => []),
      ]);

      setJob(jobData);
      const matched = (myApplications || []).find((app) => {
        const appJobId = typeof app.job === "object" ? app.job?._id : app.job;
        return appJobId === jobId;
      });
      setApplication(matched || null);
    } catch (error) {
      console.error("Fetch job detail error:", error);
      setJob(null);
      setApplication(null);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job || !job.isActive) return;

    setApplying(true);
    setStatusMessage({ type: "info", text: "Submitting application..." });

    try {
      await applyToJob(jobId);
      await fetchJobDetail();
      setStatusMessage({ type: "success", text: "✓ Application submitted successfully." });
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message || "Failed to submit application.";
      setStatusMessage({ type: "error", text: `✕ ${errMsg}` });
    } finally {
      setApplying(false);
    }
  };

  const canApply = job && job.isActive && !application;
  const orgName = job?.organisation?.organisationName || job?.organisation?.name || "Accredited Organisation";
  const timeAgo = job ? formatTimeAgo(job.createdAt) : "";
  const postedDate = job ? formatJobDate(job.createdAt) : "";
  const salaryFormatted = job ? formatSalary(job.stipend) : "";

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
              <Link to="/student/profile" className="hover:text-[#0A66C2] transition-colors">
                Profile
              </Link>
              <Link to="/student/certificates" className="hover:text-[#0A66C2] transition-colors">
                Certificates
              </Link>
              <Link to="/student/projects" className="hover:text-[#0A66C2] transition-colors">
                Projects
              </Link>
              <Link to="/student/jobs" className="text-[#0A66C2] font-semibold">
                Jobs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/jobs"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              Browse All Jobs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
        >
          ← Back to Jobs
        </button>

        {loading ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center text-xs text-[#666666]">
            Loading job details…
          </div>
        ) : !job ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center space-y-3 shadow-xs">
            <h2 className="text-base font-bold text-[#191919]">Job not found</h2>
            <p className="text-xs text-[#666666]">This opportunity may have been removed or is no longer active.</p>
            <Link
              to="/student/jobs"
              className="inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition"
            >
              Browse Available Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Message */}
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

            {/* Main Job Header Card */}
            <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2] text-white font-bold text-xl shadow-xs">
                    {orgName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-[#191919]">{job.title}</h1>
                    <div className="flex items-center gap-1.5 text-sm text-[#666666]">
                      <span className="font-semibold text-[#191919]">{orgName}</span>
                      <span className="text-[#16805D]" title="Verified Organisation">
                        ✓
                      </span>
                      <span>·</span>
                      <span>{job.location || "Remote"}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                      <span className="rounded-md bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8] px-2.5 py-1 font-semibold">
                        {job.employmentType === "FullTime"
                          ? "Full-Time"
                          : job.employmentType === "PartTime"
                          ? "Part-Time"
                          : job.employmentType || "Internship"}
                      </span>

                      <span className="rounded-md bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2.5 py-1 font-semibold">
                        💰 {salaryFormatted}
                      </span>

                      <span className="rounded-md bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8] px-2.5 py-1 font-medium">
                        🕒 Posted {timeAgo} {postedDate && `(${postedDate})`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="shrink-0 self-start sm:self-auto">
                  {application ? (
                    <div className="rounded-md bg-[#E6F4EA] border border-[#16805D]/30 px-4 py-2 text-xs font-semibold text-[#16805D] text-center">
                      ✓ Applied on {formatJobDate(application.createdAt)}
                    </div>
                  ) : canApply ? (
                    <button
                      type="button"
                      disabled={applying}
                      onClick={handleApply}
                      className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {applying ? "Submitting Application…" : "Apply Now"}
                    </button>
                  ) : (
                    <span className="text-xs text-[#666666] italic">Applications Closed</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description & Responsibilities */}
            <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-[#191919] border-b border-[#D9E1E8] pb-3 mb-4">
                  Job Description & Overview
                </h2>
                <div className="text-sm leading-relaxed text-[#191919] whitespace-pre-line">
                  {job.description}
                </div>
              </div>

              {/* Required Skills */}
              {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                <div className="border-t border-[#D9E1E8] pt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666] mb-3">
                    Required Skills & Qualifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-md px-3 py-1 text-xs font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Organisation Info */}
              <div className="border-t border-[#D9E1E8] pt-5 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                  About the Hiring Organisation
                </h3>
                <p className="text-xs text-[#666666]">
                  This opportunity is posted by <strong className="text-[#191919]">{orgName}</strong>, an accredited organisation verified on SkillSync's decentralized trust registry.
                  {job.organisation?.email && ` Contact email: ${job.organisation.email}`}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default JobDetail;
