import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyJobs, deleteJob } from "../../services/employmentService";
import { formatTimeAgo, formatJobDate, formatSalary } from "../student/Jobs";

function MyJobs() {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getMyJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch my jobs error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId, jobTitle) => {
    if (!window.confirm(`Are you sure you want to remove the job posting "${jobTitle}"?`)) {
      return;
    }

    setDeletingId(jobId);
    try {
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setStatusMessage({
        type: "success",
        text: `✓ Job posting "${jobTitle}" removed successfully.`,
      });
      setTimeout(() => setStatusMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Delete job error:", error);
      setStatusMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to delete job.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (job.title || "").toLowerCase();
        const desc = (job.description || "").toLowerCase();
        const skills = Array.isArray(job.requiredSkills)
          ? job.requiredSkills.join(" ").toLowerCase()
          : "";
        if (!title.includes(q) && !desc.includes(q) && !skills.includes(q)) {
          return false;
        }
      }

      if (typeFilter !== "ALL") {
        if ((job.employmentType || "").toLowerCase() !== typeFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, searchQuery, typeFilter]);

  const totalApplicants = useMemo(() => {
    return jobs.reduce((acc, job) => acc + (job.applicantCount || 0), 0);
  }, [jobs]);

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
              <Link to="/organisation/jobs" className="text-[#0A66C2] font-semibold">
                Manage Jobs
              </Link>
              <Link to="/organisation/create-job" className="hover:text-[#0A66C2] transition-colors">
                Post Job
              </Link>
              <Link to="/organisation/employees" className="hover:text-[#0A66C2] transition-colors">
                Employees
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/organisation/create-job"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs cursor-pointer"
            >
              + Post New Opportunity
            </Link>
            <Link
              to="/organisation"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
          >
            ← Back
          </button>
        </div>

        {/* Page Title & Stats Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9E1E8] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] text-sm font-bold">
                  📋
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                  Published Job Postings
                </h1>
              </div>
              <p className="mt-1 text-xs text-[#666666]">
                Manage published employment roles, track candidate applications, and inspect on-chain verifiable applicant profiles.
              </p>
            </div>

            <Link
              to="/organisation/create-job"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs self-start sm:self-auto cursor-pointer"
            >
              + Post Opportunity
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-[#D9E1E8] bg-[#F3F6F8] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">Total Postings</p>
              <p className="text-2xl font-bold text-[#191919] mt-0.5">{jobs.length}</p>
            </div>
            <div className="rounded-lg border border-[#D9E1E8] bg-[#F3F6F8] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">Active Positions</p>
              <p className="text-2xl font-bold text-[#16805D] mt-0.5">
                {jobs.filter((j) => j.isActive).length}
              </p>
            </div>
            <div className="rounded-lg border border-[#D9E1E8] bg-[#F3F6F8] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#666666]">Total Candidates Applied</p>
              <p className="text-2xl font-bold text-[#0A66C2] mt-0.5">{totalApplicants}</p>
            </div>
          </div>
        </div>

        {/* Status Alert */}
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

        {/* Filter Controls */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search published roles by title, skill..."
              className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none flex-1 max-w-sm"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-md border border-[#D9E1E8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191919] focus:border-[#0A66C2] focus:outline-none"
            >
              <option value="ALL">All Role Types</option>
              <option value="FullTime">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="PartTime">Part-Time</option>
            </select>
          </div>

          <span className="text-xs text-[#666666]">
            Showing <strong className="text-[#191919]">{filteredJobs.length}</strong> postings
          </span>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center text-xs text-[#666666]">
            Loading your published jobs…
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2]">
              💼
            </div>
            <h3 className="text-base font-bold text-[#191919]">No job postings found</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              {jobs.length === 0
                ? "You haven't posted any jobs yet. Publish your first opportunity to receive verifiable candidate applications."
                : "No postings matched your search filter criteria."}
            </p>
            {jobs.length === 0 && (
              <Link
                to="/organisation/create-job"
                className="inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-xs"
              >
                Post Your First Job
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const timeAgo = formatTimeAgo(job.createdAt);
              const postedDate = formatJobDate(job.createdAt);
              const salaryFormatted = formatSalary(job.stipend);
              const isDeletingThis = deletingId === job._id;

              return (
                <div
                  key={job._id}
                  className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={`/organisation/jobs/${job._id}`}
                          className="text-base font-bold text-[#191919] hover:text-[#0A66C2] hover:underline transition"
                        >
                          {job.title}
                        </Link>
                        <p className="text-xs text-[#666666] mt-0.5">
                          Location: <strong className="text-[#191919]">{job.location || "Remote"}</strong>
                        </p>
                      </div>

                      <span className="rounded-md bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8] px-2.5 py-0.5 text-xs font-semibold">
                        {job.employmentType === "FullTime"
                          ? "Full-Time"
                          : job.employmentType === "PartTime"
                          ? "Part-Time"
                          : job.employmentType || "Internship"}
                      </span>
                    </div>

                    {/* Metadata: Salary & Time of Posting */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="rounded bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2.5 py-0.5 font-semibold">
                        💰 {salaryFormatted}
                      </span>

                      <span className="rounded bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8] px-2.5 py-0.5 font-medium">
                        🕒 Posted {timeAgo} {postedDate && `(${postedDate})`}
                      </span>
                    </div>

                    <p className="text-xs text-[#666666] line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>

                    {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded px-2 py-0.5 text-[11px] font-medium bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions & Applicant Count */}
                  <div className="mt-5 pt-4 border-t border-[#D9E1E8] flex items-center justify-between gap-3">
                    <Link
                      to={`/organisation/jobs/${job._id}/applications`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-[#E8F3FF] border border-[#0A66C2]/30 rounded-md hover:bg-[#D0E6FF] transition"
                    >
                      <span>👥</span> View Applicants ({job.applicantCount || 0})
                    </Link>

                    <button
                      type="button"
                      disabled={isDeletingThis}
                      onClick={() => handleDelete(job._id, job.title)}
                      className="text-xs font-semibold text-[#C5221F] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingThis ? "Removing…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default MyJobs;