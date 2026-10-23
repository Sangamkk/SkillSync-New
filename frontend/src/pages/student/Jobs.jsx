import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAllJobs, applyToJob, getMyApplications } from "../../services/employmentService";

export const formatTimeAgo = (dateValue) => {
  if (!dateValue) return "Recently posted";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "Recently posted";

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks === 1) return "1w ago";
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths === 1) return "1mo ago";
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

export const formatJobDate = (dateValue) => {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const formatSalary = (stipend) => {
  if (stipend === null || stipend === undefined || stipend === "" || isNaN(Number(stipend))) {
    return "Competitive Stipend";
  }
  const num = Number(stipend);
  if (num === 0) return "Unpaid / Academic Credit";
  return `₹${num.toLocaleString("en-IN")} / mo`;
};

const Jobs = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [statusMessage, setStatusMessage] = useState({ id: null, text: "", type: "" });

  // Filter States
  const [searchKeyword, setSearchKeyword] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "FullTime" | "Internship" | "PartTime"
  const [salaryFilter, setSalaryFilter] = useState("ALL"); // "ALL" | "PAID" | "15000" | "30000" | "50000" | "100000"
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "highest-salary" | "company"

  useEffect(() => {
    fetchJobsAndApplications();
  }, []);

  const fetchJobsAndApplications = async () => {
    try {
      setLoading(true);
      const [allJobs, myApps] = await Promise.all([
        getAllJobs().catch(() => []),
        getMyApplications().catch(() => []),
      ]);

      setJobs(Array.isArray(allJobs) ? allJobs : []);

      const appliedSet = new Set(
        (myApps || []).map((app) => (typeof app.job === "object" ? app.job?._id : app.job))
      );
      setAppliedJobIds(appliedSet);
    } catch (err) {
      console.error("Fetch jobs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    setApplyingId(jobId);
    setStatusMessage({ id: jobId, text: "Submitting application...", type: "info" });

    try {
      await applyToJob(jobId);
      setAppliedJobIds((prev) => new Set([...prev, jobId]));
      setStatusMessage({ id: jobId, text: "✓ Application submitted successfully!", type: "success" });

      setTimeout(() => {
        setStatusMessage({ id: null, text: "", type: "" });
      }, 3000);
    } catch (err) {
      console.error("Apply error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to submit application";
      setStatusMessage({ id: jobId, text: `✕ ${errMsg}`, type: "error" });
    } finally {
      setApplyingId(null);
    }
  };

  // Extract unique companies for dropdown filter
  const companyOptions = useMemo(() => {
    const set = new Set();
    jobs.forEach((job) => {
      const name = job.organisation?.organisationName || job.organisation?.name;
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Extract unique locations for suggestions
  const locationOptions = useMemo(() => {
    const set = new Set();
    jobs.forEach((job) => {
      if (job.location) set.add(job.location);
    });
    return Array.from(set).sort();
  }, [jobs]);

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Keyword Search (Title, Description, Skills, Company)
        if (searchKeyword.trim()) {
          const q = searchKeyword.toLowerCase();
          const title = (job.title || "").toLowerCase();
          const desc = (job.description || "").toLowerCase();
          const comp = (job.organisation?.organisationName || job.organisation?.name || "").toLowerCase();
          const skills = Array.isArray(job.requiredSkills)
            ? job.requiredSkills.join(" ").toLowerCase()
            : "";
          if (!title.includes(q) && !desc.includes(q) && !comp.includes(q) && !skills.includes(q)) {
            return false;
          }
        }

        // Location Filter
        if (locationFilter.trim()) {
          const locQuery = locationFilter.toLowerCase();
          const loc = (job.location || "").toLowerCase();
          if (!loc.includes(locQuery)) return false;
        }

        // Role / Employment Type Filter
        if (roleFilter !== "ALL") {
          const type = (job.employmentType || "").toLowerCase();
          if (type !== roleFilter.toLowerCase()) return false;
        }

        // Salary / Stipend Filter
        if (salaryFilter !== "ALL") {
          const stipend = Number(job.stipend || 0);
          if (salaryFilter === "PAID" && stipend <= 0) return false;
          if (salaryFilter === "15000" && stipend < 15000) return false;
          if (salaryFilter === "30000" && stipend < 30000) return false;
          if (salaryFilter === "50000" && stipend < 50000) return false;
          if (salaryFilter === "100000" && stipend < 100000) return false;
        }

        // Company Filter
        if (companyFilter !== "ALL") {
          const compName = job.organisation?.organisationName || job.organisation?.name;
          if (compName !== companyFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "highest-salary") {
          return Number(b.stipend || 0) - Number(a.stipend || 0);
        }
        if (sortBy === "company") {
          const nameA = a.organisation?.organisationName || a.organisation?.name || "";
          const nameB = b.organisation?.organisationName || b.organisation?.name || "";
          return nameA.localeCompare(nameB);
        }
        // Default: newest first by createdAt
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
  }, [jobs, searchKeyword, locationFilter, roleFilter, salaryFilter, companyFilter, sortBy]);

  const hasActiveFilters =
    Boolean(searchKeyword.trim()) ||
    Boolean(locationFilter.trim()) ||
    roleFilter !== "ALL" ||
    salaryFilter !== "ALL" ||
    companyFilter !== "ALL";

  const clearAllFilters = () => {
    setSearchKeyword("");
    setLocationFilter("");
    setRoleFilter("ALL");
    setSalaryFilter("ALL");
    setCompanyFilter("ALL");
    setSortBy("newest");
  };

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
              <Link to="/student/offers" className="hover:text-[#0A66C2] transition-colors">
                Offers
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/offers"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              My Offers
            </Link>
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
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
          >
            ← Back
          </button>
          <div className="text-xs text-[#666666]">
            Total Opportunities: <strong className="text-[#191919]">{jobs.length}</strong> · Applied:{" "}
            <strong className="text-[#16805D]">{appliedJobIds.size}</strong>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            HERO SEARCH & FILTER CARD (LinkedIn Minimalist Style)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9E1E8] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] text-sm font-bold">
                  💼
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                  Explore Job Opportunities
                </h1>
              </div>
              <p className="mt-1 text-xs text-[#666666]">
                Browse and filter verified internships and full-time positions posted by accredited organisations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#666666]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border border-[#D9E1E8] bg-white px-2.5 py-1 text-xs font-medium text-[#191919] focus:border-[#0A66C2] focus:outline-none"
              >
                <option value="newest">Most Recent</option>
                <option value="highest-salary">Highest Salary / Stipend</option>
                <option value="company">Company Name (A–Z)</option>
              </select>
            </div>
          </div>

          {/* Search Inputs Row */}
          <div className="grid gap-3 sm:grid-cols-12">
            {/* Keyword Search */}
            <div className="sm:col-span-7 relative">
              <span className="absolute left-3 top-2.5 text-[#666666] text-sm">🔍</span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Search by role title, skills, or company name..."
                className="w-full rounded-md border border-[#D9E1E8] bg-white pl-9 pr-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
              />
            </div>

            {/* Location Search */}
            <div className="sm:col-span-5 relative">
              <span className="absolute left-3 top-2.5 text-[#666666] text-sm">📍</span>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="City, Remote, or Hybrid..."
                className="w-full rounded-md border border-[#D9E1E8] bg-white pl-9 pr-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
              />
            </div>
          </div>

          {/* Filters Bar Row */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            {/* Role / Job Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#666666]">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-md border border-[#D9E1E8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191919] focus:border-[#0A66C2] focus:outline-none"
              >
                <option value="ALL">All Employment Types</option>
                <option value="FullTime">Full-Time</option>
                <option value="Internship">Internship</option>
                <option value="PartTime">Part-Time</option>
              </select>
            </div>

            {/* Salary / Stipend Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#666666]">Salary:</span>
              <select
                value={salaryFilter}
                onChange={(e) => setSalaryFilter(e.target.value)}
                className="rounded-md border border-[#D9E1E8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191919] focus:border-[#0A66C2] focus:outline-none"
              >
                <option value="ALL">Any Salary / Stipend</option>
                <option value="PAID">Paid Positions Only</option>
                <option value="15000">₹15,000+ / mo</option>
                <option value="30000">₹30,000+ / mo</option>
                <option value="50000">₹50,000+ / mo</option>
                <option value="100000">₹1,00,000+ / mo</option>
              </select>
            </div>

            {/* Company / Organisation Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[#666666]">Company:</span>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="rounded-md border border-[#D9E1E8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191919] focus:border-[#0A66C2] focus:outline-none max-w-[200px]"
              >
                <option value="ALL">All Companies ({companyOptions.length})</option>
                {companyOptions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs font-semibold text-[#C5221F] hover:underline px-2 py-1 cursor-pointer"
              >
                ✕ Reset Filters
              </button>
            )}
          </div>

          {/* Filter Match Count */}
          <div className="text-xs text-[#666666] pt-1">
            Showing <strong className="text-[#191919]">{filteredJobs.length}</strong> of {jobs.length} opportunities
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            JOB CARDS LIST
        ═══════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center text-xs text-[#666666]">
            Loading job postings…
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2]">
              🔎
            </div>
            <h3 className="text-base font-bold text-[#191919]">No jobs match your criteria</h3>
            <p className="text-xs text-[#666666] max-w-sm mx-auto">
              We couldn't find any positions matching your active filters. Try broadening your salary range, role type, or location.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-xs cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredJobs.map((job) => {
              const orgName =
                job.organisation?.organisationName ||
                job.organisation?.name ||
                "Accredited Organisation";
              const isApplied = appliedJobIds.has(job._id);
              const isApplyingThis = applyingId === job._id;
              const timeAgo = formatTimeAgo(job.createdAt);
              const postedDate = formatJobDate(job.createdAt);
              const salaryFormatted = formatSalary(job.stipend);

              return (
                <div
                  key={job._id}
                  className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2] transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Company Avatar & Role Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                          {orgName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            to={`/student/jobs/${job._id}`}
                            className="text-base font-bold text-[#191919] hover:text-[#0A66C2] hover:underline transition-colors block"
                          >
                            {job.title}
                          </Link>
                          <div className="flex items-center gap-1.5 text-xs text-[#666666] mt-0.5">
                            <span className="font-semibold text-[#191919]">{orgName}</span>
                            <span className="text-[#16805D]" title="Verified Organisation">
                              ✓
                            </span>
                            <span>·</span>
                            <span>{job.location || "Remote"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Employment Type Tag */}
                      <span className="rounded-md bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8] px-2.5 py-0.5 text-xs font-semibold shrink-0">
                        {job.employmentType === "FullTime"
                          ? "Full-Time"
                          : job.employmentType === "PartTime"
                          ? "Part-Time"
                          : job.employmentType || "Internship"}
                      </span>
                    </div>

                    {/* Metadata Pill Row: Salary & Time of Posting */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {/* Salary / Stipend */}
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2.5 py-1 font-semibold">
                        <span>💰</span> {salaryFormatted}
                      </span>

                      {/* Time of Posting */}
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8] px-2.5 py-1 font-medium"
                        title={postedDate ? `Posted on ${postedDate}` : ""}
                      >
                        <span>🕒</span> Posted {timeAgo}
                        {postedDate && <span className="opacity-70">({postedDate})</span>}
                      </span>
                    </div>

                    {/* Job Description Preview */}
                    <p className="text-xs text-[#666666] leading-relaxed line-clamp-3">
                      {job.description}
                    </p>

                    {/* Required Skills */}
                    {Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requiredSkills.slice(0, 5).map((skill, idx) => (
                          <span
                            key={idx}
                            className="rounded px-2 py-0.5 text-[11px] font-medium bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                          >
                            {skill}
                          </span>
                        ))}
                        {job.requiredSkills.length > 5 && (
                          <span className="text-[11px] text-[#666666] self-center">
                            +{job.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom: Status & Actions */}
                  <div className="mt-5 pt-4 border-t border-[#D9E1E8] space-y-2">
                    {/* Inline Status Message */}
                    {statusMessage.id === job._id && statusMessage.text && (
                      <div
                        className={`p-2 rounded text-xs font-medium ${
                          statusMessage.type === "success"
                            ? "bg-[#E6F4EA] text-[#16805D]"
                            : statusMessage.type === "error"
                            ? "bg-[#FCE8E6] text-[#C5221F]"
                            : "bg-[#E8F3FF] text-[#0A66C2]"
                        }`}
                      >
                        {statusMessage.text}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <Link
                        to={`/student/jobs/${job._id}`}
                        className="text-xs font-semibold text-[#0A66C2] hover:underline"
                      >
                        View Full Details →
                      </Link>

                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#E6F4EA] border border-[#16805D]/20 px-3.5 py-1.5 text-xs font-semibold text-[#16805D]">
                          ✓ Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isApplyingThis}
                          onClick={() => handleApply(job._id)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {isApplyingThis ? "Applying…" : "Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Jobs;