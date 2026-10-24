import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
    getApplicants,
    createEmploymentOffer,
} from "../../services/employmentService";

const STATUS_CONFIG = {
    Applied: { label: "Applied", bg: "bg-[#E8F3FF] text-[#0A66C2] border-[#0A66C2]/20" },
    Offered: { label: "Offer Sent", bg: "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/20" },
    Accepted: { label: "Offer Accepted", bg: "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20" },
    Rejected: { label: "Rejected", bg: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20" },
};

function Applicants() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Quick Offer form state
    const [activeOfferAppId, setActiveOfferAppId] = useState(null);
    const [employmentType, setEmploymentType] = useState("Employment");
    const [deadline, setDeadline] = useState("");
    const [sendingId, setSendingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ id: null, text: "", type: "" });

    useEffect(() => {
        fetchApplicants();
    }, [jobId]);

    const fetchApplicants = async () => {
        try {
            setLoading(true);
            const data = await getApplicants(jobId);
            setApplicants(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Fetch applicants error:", error);
            setApplicants([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOffer = async (application) => {
        if (!employmentType) {
            setStatusMessage({ id: application._id, text: "Please select an Employment Type.", type: "error" });
            return;
        }
        if (!deadline) {
            setStatusMessage({ id: application._id, text: "Please select an Offer Deadline.", type: "error" });
            return;
        }

        setSendingId(application._id);
        setStatusMessage({ id: application._id, text: "Generating on-chain offer…", type: "info" });

        try {
            const result = await createEmploymentOffer(
                application._id,
                null,
                null,
                null
            );

            const txHash = result?.transactionHash || result?.txHash || "";
            setStatusMessage({
                id: application._id,
                text: txHash
                    ? `✓ Offer dispatched! Tx: ${txHash.slice(0, 14)}…`
                    : "✓ Employment Offer sent successfully.",
                type: "success"
            });

            setTimeout(() => {
                fetchApplicants();
                setActiveOfferAppId(null);
                setStatusMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (err) {
            console.error("Create offer error:", err);
            const errMsg = err.response?.data?.message || err.message || "Failed to send offer";
            setStatusMessage({ id: application._id, text: `❌ ${errMsg}`, type: "error" });
        } finally {
            setSendingId(null);
        }
    };

    const jobInfo = applicants[0]?.job;

    // Filtered applicants
    const filteredApplicants = useMemo(() => {
        return applicants.filter((app) => {
            const student = app.student || {};
            const matchesSearch =
                !searchQuery ||
                (student.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.college || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (student.usn || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (Array.isArray(student.skills) &&
                    student.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())));

            const matchesStatus =
                statusFilter === "ALL" || app.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [applicants, searchQuery, statusFilter]);

    return (
        <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
            <div className="mx-auto max-w-5xl">
                {/* Top Breadcrumb & Navigation */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-[#666666]">
                        <button
                            type="button"
                            onClick={() => navigate("/organisation/jobs")}
                            className="font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                        >
                            ← Back to Jobs
                        </button>
                        <span>/</span>
                        <span>Candidate Pipeline</span>
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
                            All Job Postings
                        </Link>
                    </div>
                </div>

                {/* Page Title Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-2">
                                Job Applicants
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                                {jobInfo?.jobTitle ? `${jobInfo.jobTitle} Applicants` : "Job Applicants"}
                            </h1>
                            <p className="mt-1 text-xs text-[#666666]">
                                Review candidate resumes, verify authentic blockchain credentials, and dispatch verified employment offers.
                            </p>
                        </div>
                        <div className="text-right sm:border-l sm:border-[#D9E1E8] sm:pl-6">
                            <p className="text-3xl font-extrabold text-[#0A66C2]">{applicants.length}</p>
                            <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Total Received</p>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="mt-6 pt-5 border-t border-[#D9E1E8] flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666666]">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by candidate name, USN, college, or skills..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] pl-9 pr-3 py-2 text-xs text-[#191919] placeholder-[#888888] focus:bg-white focus:border-[#0A66C2] focus:outline-none transition"
                            />
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                            {["ALL", "Applied", "Offered", "Accepted"].map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                                        statusFilter === status
                                            ? "bg-[#0A66C2] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#E8F3FF] hover:text-[#0A66C2]"
                                    }`}
                                >
                                    {status === "ALL" ? "All Statuses" : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#0A66C2] border-t-transparent" />
                        <p className="text-xs text-[#666666]">Loading candidate applications…</p>
                    </div>
                )}

                {/* No Applicants Found */}
                {!loading && applicants.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F3FF] text-[#0A66C2] text-2xl mb-3">
                            👥
                        </div>
                        <h2 className="text-base font-bold text-[#191919]">No Applicants Yet</h2>
                        <p className="mt-1 text-xs text-[#666666] max-w-sm mx-auto">
                            Candidates who apply for this job listing will appear here with full verifiable resumes and cryptographic credentials.
                        </p>
                    </div>
                )}

                {/* Filter Empty State */}
                {!loading && applicants.length > 0 && filteredApplicants.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-10 text-center shadow-xs">
                        <p className="text-xs text-[#666666]">No candidates match your current filter search.</p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("ALL");
                            }}
                            className="mt-3 text-xs font-semibold text-[#0A66C2] hover:underline"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Applicants List */}
                {!loading && filteredApplicants.length > 0 && (
                    <div className="space-y-4">
                        {filteredApplicants.map((application) => {
                            const student = application.student || {};
                            const statusCfg = STATUS_CONFIG[application.status] || {
                                label: application.status,
                                bg: "bg-[#F3F6F8] text-[#666666] border-[#D9E1E8]",
                            };
                            const isOfferOpen = activeOfferAppId === application._id;

                            return (
                                <div
                                    key={application._id}
                                    className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2]/40 transition"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        {/* Candidate Header */}
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                                                {student.name ? student.name.charAt(0).toUpperCase() : "S"}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-base font-bold text-[#191919]">
                                                        {student.name || "Candidate"}
                                                    </h2>
                                                    <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                                                        ✓ Verified Student
                                                    </span>
                                                </div>

                                                <p className="text-xs text-[#666666] mt-0.5">
                                                    {student.headline || "Aspiring Software Engineer"}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#666666]">
                                                    {student.college && <span>🎓 {student.college}</span>}
                                                    {student.usn && <span>🆔 {student.usn}</span>}
                                                    {student.email && <span>✉️ {student.email}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="self-start sm:self-auto flex items-center gap-2">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${statusCfg.bg}`}
                                            >
                                                {statusCfg.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Skills snippet */}
                                    {Array.isArray(student.skills) && student.skills.length > 0 && (
                                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                                            <span className="text-[11px] font-semibold text-[#666666] mr-1">Skills:</span>
                                            {student.skills.slice(0, 6).map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]"
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                            {student.skills.length > 6 && (
                                                <span className="text-[11px] text-[#666666]">
                                                    +{student.skills.length - 6} more
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Candidate Actions */}
                                    <div className="mt-5 pt-4 border-t border-[#D9E1E8] flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/organisation/jobs/${jobId}/applications/${application._id}`}
                                                className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs flex items-center gap-1.5"
                                            >
                                                <span>📄 View Candidate Resume & Credentials</span>
                                                <span>→</span>
                                            </Link>
                                        </div>

                                        {/* Offer Button for applied status */}
                                        {application.status === "Applied" && (
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveOfferAppId(isOfferOpen ? null : application._id)}
                                                    className={`px-3.5 py-2 rounded-md text-xs font-semibold border transition cursor-pointer ${
                                                        isOfferOpen
                                                            ? "bg-[#191919] text-white border-[#191919]"
                                                            : "bg-white text-[#0A66C2] border-[#0A66C2] hover:bg-[#E8F3FF]"
                                                    }`}
                                                >
                                                    {isOfferOpen ? "✕ Close Offer Form" : "Send Employment Offer"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quick Offer Inline Drawer */}
                                    {isOfferOpen && application.status === "Applied" && (
                                        <div className="mt-4 rounded-xl border border-[#0A66C2]/30 bg-[#F8FBFF] p-5">
                                            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] mb-1">
                                                Dispatch Employment Offer
                                            </h3>
                                            <p className="text-xs text-[#666666] mb-4">
                                                Issuing this offer will register a cryptographic commitment on the Sepolia ledger.
                                            </p>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div>
                                                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                                                        Employment Type
                                                    </label>
                                                    <select
                                                        value={employmentType}
                                                        onChange={(e) => setEmploymentType(e.target.value)}
                                                        className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-xs text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                                                    >
                                                        <option value="Internship">Internship</option>
                                                        <option value="Employment">Full-Time Employment</option>
                                                        <option value="Contract">Contract</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                                                        Acceptance Deadline
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={deadline}
                                                        onChange={(e) => setDeadline(e.target.value)}
                                                        className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-xs text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                                                    />
                                                </div>
                                            </div>

                                            {/* Status message */}
                                            {statusMessage.id === application._id && statusMessage.text && (
                                                <div
                                                    className={`mt-3 p-2.5 rounded-md text-xs font-medium ${
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

                                            <div className="mt-4 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveOfferAppId(null)}
                                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#666666] hover:bg-[#F3F6F8]"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={sendingId === application._id}
                                                    onClick={() => handleOffer(application)}
                                                    className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#16805D] text-white hover:bg-[#137352] transition disabled:opacity-50"
                                                >
                                                    {sendingId === application._id ? "Sending On-Chain…" : "Confirm & Send Offer →"}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Applicants;