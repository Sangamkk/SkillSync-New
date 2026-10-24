import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
    getOrganisationEmployees,
    terminateEmployment,
} from "../../services/employmentService";

const STATUS_CONFIG = {
    Active: { label: "Active", bg: "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20" },
    Terminated: { label: "Terminated", bg: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20" },
    Completed: { label: "Completed", bg: "bg-[#F3F6F8] text-[#666666] border-[#D9E1E8]" },
};

function Employees() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [terminatingId, setTerminatingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ id: null, text: "", type: "" });

    // Category filter: 'ALL', 'Active', 'Terminated'
    const [categoryFilter, setCategoryFilter] = useState("ALL");
    // Browse / search
    const [searchQuery, setSearchQuery] = useState("");
    // Sort
    const [sortBy, setSortBy] = useState("NEWEST");

    useEffect(() => {
        fetchEmployees();
    }, []);

    async function fetchEmployees() {
        setLoading(true);
        try {
            const data = await getOrganisationEmployees();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    }

    async function handleTerminate(record) {
        const studentName = record.student?.name || "this employee";
        const confirmTerminate = window.confirm(
            `Are you sure you want to terminate employment for ${studentName}? This will record an immutable termination event on the Ethereum blockchain ledger.`
        );
        if (!confirmTerminate) return;

        const id = typeof record === "object" ? (record._id || record.offerId) : record;
        setTerminatingId(id);
        setStatusMessage({ id, text: "Recording termination on Ethereum Sepolia…", type: "info" });

        try {
            const result = await terminateEmployment(id);
            const txHash = result?.transactionHash || result?.txHash || "";

            setStatusMessage({
                id,
                text: txHash
                    ? `✓ Employment Terminated on-chain. Tx: ${txHash.slice(0, 14)}…`
                    : "✓ Employment terminated successfully.",
                type: "success"
            });

            setTimeout(() => {
                fetchEmployees();
                setStatusMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (err) {
            console.error("Termination error:", err);
            const errMsg = err.response?.data?.message || err.message || "Termination failed";
            setStatusMessage({ id, text: `❌ ${errMsg}`, type: "error" });
        } finally {
            setTerminatingId(null);
        }
    }

    // Counts for categories
    const counts = useMemo(() => {
        let active = 0;
        let terminated = 0;
        employees.forEach((emp) => {
            if (emp.status === "Terminated") terminated += 1;
            else if (emp.status === "Active") active += 1;
        });
        return {
            all: employees.length,
            active,
            terminated,
        };
    }, [employees]);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Filter and browse employees
    const filteredEmployees = useMemo(() => {
        return employees
            .filter((emp) => {
                // Category filter
                if (categoryFilter === "Active" && emp.status !== "Active") return false;
                if (categoryFilter === "Terminated" && emp.status !== "Terminated") return false;

                // Search query
                if (!searchQuery.trim()) return true;
                const q = searchQuery.toLowerCase();
                const name = (emp.student?.name || "").toLowerCase();
                const email = (emp.student?.email || "").toLowerCase();
                const jobTitle = (emp.job?.title || emp.job?.jobTitle || "").toLowerCase();
                const usn = (emp.student?.usn || "").toLowerCase();
                const college = (emp.student?.college || "").toLowerCase();
                const offerId = String(emp.offerId || "").toLowerCase();

                return (
                    name.includes(q) ||
                    email.includes(q) ||
                    jobTitle.includes(q) ||
                    usn.includes(q) ||
                    college.includes(q) ||
                    offerId.includes(q)
                );
            })
            .sort((a, b) => {
                if (sortBy === "NAME_ASC") {
                    return (a.student?.name || "").localeCompare(b.student?.name || "");
                }
                if (sortBy === "OLDEST") {
                    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
                }
                // Default: NEWEST
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }, [employees, categoryFilter, searchQuery, sortBy]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEmployees, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
            <div className="mx-auto max-w-5xl">
                {/* Top Action Bar */}
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
                        <span>Workforce</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/organisation"
                            className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/organisation/jobs"
                            className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
                        >
                            Job Postings
                        </Link>
                    </div>
                </div>

                {/* Header Card with Stats */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-2">
                                Employee Management
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                                Organisation Workforce Directory
                            </h1>
                            <p className="mt-1 text-xs text-[#666666]">
                                Manage hired candidates, monitor active employment status, and attest on-chain employment lifecycle events.
                            </p>
                        </div>

                        {/* Top Summary Stats */}
                        <div className="flex items-center gap-3 sm:border-l sm:border-[#D9E1E8] sm:pl-6">
                            <div className="text-center px-2">
                                <p className="text-2xl font-bold text-[#191919]">{counts.all}</p>
                                <p className="text-[10px] font-semibold text-[#666666] uppercase">Total</p>
                            </div>
                            <div className="h-8 w-px bg-[#D9E1E8]" />
                            <div className="text-center px-2">
                                <p className="text-2xl font-bold text-[#16805D]">{counts.active}</p>
                                <p className="text-[10px] font-semibold text-[#666666] uppercase">Active</p>
                            </div>
                            <div className="h-8 w-px bg-[#D9E1E8]" />
                            <div className="text-center px-2">
                                <p className="text-2xl font-bold text-[#C5221F]">{counts.terminated}</p>
                                <p className="text-[10px] font-semibold text-[#666666] uppercase">Terminated</p>
                            </div>
                        </div>
                    </div>

                    {/* Category Tabs & Browse Filter Bar */}
                    <div className="mt-6 pt-5 border-t border-[#D9E1E8] space-y-4">
                        {/* Category Navigation Pills */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter("ALL")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        categoryFilter === "ALL"
                                            ? "bg-[#0A66C2] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#E8F3FF] hover:text-[#0A66C2]"
                                    }`}
                                >
                                    <span>All Employees</span>
                                    <span className="text-[11px] opacity-80 font-normal">({counts.all})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter("Active")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        categoryFilter === "Active"
                                            ? "bg-[#16805D] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#E6F4EA] hover:text-[#16805D]"
                                    }`}
                                >
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>Active Employees</span>
                                    <span className="text-[11px] opacity-80 font-normal">({counts.active})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCategoryFilter("Terminated")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        categoryFilter === "Terminated"
                                            ? "bg-[#C5221F] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#FCE8E6] hover:text-[#C5221F]"
                                    }`}
                                >
                                    <span>Terminated Employees</span>
                                    <span className="text-[11px] opacity-80 font-normal">({counts.terminated})</span>
                                </button>
                            </div>

                            {/* Sort Options */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[#666666]">Sort:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-2.5 py-1 text-xs text-[#191919] focus:bg-white focus:outline-none"
                                >
                                    <option value="NEWEST">Newest Hired</option>
                                    <option value="OLDEST">Oldest Hired</option>
                                    <option value="NAME_ASC">Name (A-Z)</option>
                                </select>
                            </div>
                        </div>

                        {/* Search & Browse Bar */}
                        <div className="relative w-full">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666666]">🔍</span>
                            <input
                                type="text"
                                placeholder="Browse and search by employee name, email, job title, USN, college, or offer ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] pl-9 pr-3 py-2 text-xs text-[#191919] placeholder-[#888888] focus:bg-white focus:border-[#0A66C2] focus:outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#0A66C2] border-t-transparent" />
                        <p className="text-xs text-[#666666]">Loading organisation workforce records…</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && employees.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F3FF] text-[#0A66C2] text-2xl mb-3">
                            👥
                        </div>
                        <h2 className="text-base font-bold text-[#191919]">No Employees Found</h2>
                        <p className="mt-1 text-xs text-[#666666] max-w-sm mx-auto">
                            Candidates will appear here after they accept official verified employment offers from your organisation.
                        </p>
                        <Link
                            to="/organisation/jobs"
                            className="mt-4 inline-flex items-center text-xs font-semibold text-[#0A66C2] hover:underline"
                        >
                            View Active Job Postings →
                        </Link>
                    </div>
                )}

                {/* Filter Empty State */}
                {!loading && employees.length > 0 && filteredEmployees.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-10 text-center shadow-xs">
                        <p className="text-xs text-[#666666]">
                            No employees match your current filter ({categoryFilter}) or search criteria.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setCategoryFilter("ALL");
                                setSearchQuery("");
                            }}
                            className="mt-2 text-xs font-semibold text-[#0A66C2] hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}

                {/* Employee Directory Grid */}
                {!loading && paginatedEmployees.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {paginatedEmployees.map((emp) => {
                            const student = emp.student || {};
                            const job = emp.job || {};
                            const statusKey = emp.status || "Active";
                            const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.Active;
                            const isTerminated = statusKey === "Terminated";
                            const isTerminating = terminatingId === (emp._id || emp.offerId);

                            return (
                                <div
                                    key={emp._id}
                                    className={`rounded-xl border p-5 shadow-xs transition flex flex-col justify-between ${
                                        isTerminated
                                            ? "border-[#D9E1E8] bg-[#FAFAFA]"
                                            : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
                                    }`}
                                >
                                    <div>
                                        {/* Card Top */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-xs ${
                                                        isTerminated
                                                            ? "bg-[#666666] text-white"
                                                            : "bg-[#0A66C2] text-white"
                                                    }`}
                                                >
                                                    {student.name ? student.name.charAt(0).toUpperCase() : "E"}
                                                </div>
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <h2 className="text-base font-bold text-[#191919]">
                                                            {student.name || "Employee"}
                                                        </h2>
                                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                                                            ✓ Verified
                                                        </span>
                                                    </div>

                                                    <p className="text-xs font-semibold text-[#0A66C2] mt-0.5">
                                                        {job.title || "Software Engineer"}
                                                    </p>
                                                    {job.employmentType && (
                                                        <span className="inline-block text-[11px] text-[#666666]">
                                                            {job.employmentType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusCfg.bg}`}
                                            >
                                                {statusCfg.label}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="mt-4 pt-3 border-t border-[#D9E1E8] space-y-2 text-xs">
                                            <div className="flex justify-between items-center text-[#666666]">
                                                <span className="font-semibold uppercase text-[10px] tracking-wider">Email</span>
                                                <span className="text-[#191919] font-medium break-all">{student.email || "—"}</span>
                                            </div>

                                            {(student.college || student.usn) && (
                                                <div className="flex justify-between items-center text-[#666666]">
                                                    <span className="font-semibold uppercase text-[10px] tracking-wider">College / USN</span>
                                                    <span className="text-[#191919] font-medium">
                                                        {student.college ? student.college : ""} {student.usn ? `(${student.usn})` : ""}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex justify-between items-center text-[#666666]">
                                                <span className="font-semibold uppercase text-[10px] tracking-wider">Offer ID</span>
                                                <span className="font-mono text-xs text-[#0A66C2]">
                                                    #{emp.offerId}
                                                </span>
                                            </div>

                                            {emp.createdAt && (
                                                <div className="flex justify-between items-center text-[#666666]">
                                                    <span className="font-semibold uppercase text-[10px] tracking-wider">Hire Date</span>
                                                    <span className="text-[#191919]">
                                                        {new Date(emp.createdAt).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            )}

                                            {isTerminated && emp.updatedAt && (
                                                <div className="flex justify-between items-center text-[#C5221F]">
                                                    <span className="font-semibold uppercase text-[10px] tracking-wider">Terminated On</span>
                                                    <span>
                                                        {new Date(emp.updatedAt).toLocaleDateString("en-IN", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric"
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Banner & Terminate Button */}
                                    <div className="mt-4 pt-3 border-t border-[#D9E1E8]">
                                        {statusMessage.id === (emp._id || emp.offerId) && statusMessage.text && (
                                            <div
                                                className={`mb-3 p-2.5 rounded-md text-xs font-medium ${
                                                    statusMessage.type === "success"
                                                        ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                                                        : statusMessage.type === "error"
                                                        ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                                                        : "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20"
                                                }`}
                                            >
                                                {statusMessage.text}
                                            </div>
                                        )}

                                        {!isTerminated ? (
                                            <button
                                                type="button"
                                                disabled={isTerminating}
                                                onClick={() => handleTerminate(emp)}
                                                className="w-full py-2 rounded-md text-xs font-semibold border border-[#C5221F]/30 bg-white text-[#C5221F] hover:bg-[#FCE8E6] transition cursor-pointer disabled:opacity-50"
                                            >
                                                {isTerminating ? "Terminating On-Chain…" : "Terminate Employment"}
                                            </button>
                                        ) : (
                                            <div className="py-1.5 text-center text-xs text-[#666666] font-medium bg-[#F3F6F8] rounded-md">
                                                Employment Concluded
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && filteredEmployees.length > ITEMS_PER_PAGE && (
                    <div className="mt-6 flex items-center justify-between border-t border-[#D9E1E8] pt-4 text-xs text-[#666666]">
                        <span>
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} of {filteredEmployees.length} employees
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
                            >
                                ← Previous
                            </button>
                            <span className="px-3 py-1.5 font-semibold text-[#191919]">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Employees;