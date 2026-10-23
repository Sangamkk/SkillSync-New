import { useEffect, useState, useMemo } from "react";
import { getPendingProjects, updateProjectStatus } from "../../services/projectService";
<<<<<<< Updated upstream
import {
    getIssuerRequests,
    approveVerificationRequest,
    rejectVerificationRequest
} from "../../services/requestService";
import MeshBackground from "../../components/common/MeshBackground";
import { Link } from "react-router-dom";
=======
import { Link, useNavigate } from "react-router-dom";
>>>>>>> Stashed changes

const PendingProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [issuerRequests, setIssuerRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ id: null, text: "", type: "" });
<<<<<<< Updated upstream

    const [darkMode] = useState(() => {
        return localStorage.getItem("skillsync-theme") !== "light";
    });
=======
    const [searchQuery, setSearchQuery] = useState("");
>>>>>>> Stashed changes

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
<<<<<<< Updated upstream
            const [pendingData, reqs] = await Promise.all([
                getPendingProjects().catch(() => []),
                getIssuerRequests().catch(() => [])
            ]);
            console.log("Pending Projects:", pendingData);
            console.log("Issuer on-chain requests:", reqs);
            setProjects(pendingData || []);
            setIssuerRequests(reqs || []);
=======
            const pendingData = await getPendingProjects().catch(() => []);
            setProjects(Array.isArray(pendingData) ? pendingData : []);
>>>>>>> Stashed changes
        } catch (error) {
            console.error("Failed to load pending projects:", error);
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const findOnChainRequestId = (project) => {
        const rawHash = (project.githubHash || "").toLowerCase();
        const formattedHash = rawHash.startsWith("0x") ? rawHash : "0x" + rawHash;

        const matchedReq = issuerRequests.find((r) => {
            const rHash = (r.credentialHash || "").toLowerCase();
            return rHash === formattedHash || rHash === rawHash;
        });

        return matchedReq ? matchedReq.id : null;
    };

    const handleApprove = async (project) => {
        const projId = project._id;
        setProcessingId(projId);
<<<<<<< Updated upstream
        setStatusMessage({ id: projId, text: "Finding on-chain verification request...", type: "info" });

        try {
            const reqId = findOnChainRequestId(project);
            if (reqId === null || reqId === undefined) {
                throw new Error("No matching on-chain verification request was found for this project.");
            }

            setStatusMessage({
                id: projId,
                text: `Prompting MetaMask to approve request #${reqId.toString()} on-chain...`,
                type: "info"
            });

            const txHash = await approveVerificationRequest(reqId);
            console.log("On-chain approval tx:", txHash);

            setStatusMessage({ id: projId, text: "Updating database verification status...", type: "info" });
            await updateProjectStatus(projId, "APPROVED", txHash, "");

            setStatusMessage({
                id: projId,
                text: `✓ Project verified successfully. Tx: ${txHash.slice(0, 14)}...`,
=======
        setStatusMessage({ id: projId, text: "Processing approval on blockchain…", type: "info" });

        try {
            const result = await updateProjectStatus(projId, "APPROVED", null, "");
            const txHash = result?.transactionHash || result?.txHash || "";

            setStatusMessage({
                id: projId,
                text: txHash
                    ? `✓ Project approved on-chain! Tx: ${txHash.slice(0, 14)}…`
                    : "✓ Project approved & verified successfully.",
>>>>>>> Stashed changes
                type: "success"
            });

            setTimeout(() => {
                loadData();
                setStatusMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (error) {
            console.error("Project approval error:", error);
            const errText = error.shortMessage || error.reason || error.message || "Approval failed";
            setStatusMessage({ id: projId, text: `❌ ${errText}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (project) => {
        const reason = window.prompt(
            "Enter reason for project rejection:",
            "Project does not meet repository standards or verification criteria."
        );

        if (reason === null || String(reason).trim() === "") {
            setStatusMessage({ id: project._id, text: "❌ Rejection reason is required.", type: "error" });
            return;
        }

        const projId = project._id;
        setProcessingId(projId);
        setStatusMessage({ id: projId, text: "Processing rejection...", type: "info" });

        try {
<<<<<<< Updated upstream
            const reqId = findOnChainRequestId(project);
            if (reqId === null || reqId === undefined) {
                throw new Error("No matching on-chain verification request was found for this project.");
            }

            setStatusMessage({
                id: projId,
                text: `Prompting MetaMask to reject request #${reqId.toString()} on-chain...`,
                type: "info"
            });

            const txHash = await rejectVerificationRequest(reqId);
            console.log("On-chain rejection tx:", txHash);

            await updateProjectStatus(projId, "REJECTED", txHash, reason);

            setStatusMessage({ id: projId, text: "Project verification rejected.", type: "success" });
=======
            await updateProjectStatus(projId, "REJECTED", null, reason);
            setStatusMessage({ id: projId, text: "✓ Project verification rejected.", type: "success" });
>>>>>>> Stashed changes

            setTimeout(() => {
                loadData();
                setStatusMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (error) {
            console.error("Project rejection error:", error);
            const errText = error.shortMessage || error.reason || error.message || "Rejection failed";
            setStatusMessage({ id: projId, text: `❌ ${errText}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Filter projects by search query
    const filteredProjects = useMemo(() => {
        if (!searchQuery.trim()) return projects;
        const q = searchQuery.toLowerCase();
        return projects.filter((p) => {
            const name = (p.projectName || "").toLowerCase();
            const desc = (p.description || "").toLowerCase();
            const studentName = (p.student?.name || "").toLowerCase();
            const usn = (p.student?.usn || "").toLowerCase();
            const hash = (p.githubHash || "").toLowerCase();
            return (
                name.includes(q) ||
                desc.includes(q) ||
                studentName.includes(q) ||
                usn.includes(q) ||
                hash.includes(q)
            );
        });
    }, [projects, searchQuery]);

    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
    const paginatedProjects = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredProjects.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProjects, currentPage]);

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
                        <span>Project Verifications</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            to="/organisation"
                            className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/organisation/pending-verifications"
                            className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
                        >
                            Pending Certificates
                        </Link>
                    </div>
                </div>

                {/* Header Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-2">
                                Verification Queue
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                                Pending Project Verifications
                            </h1>
                            <p className="mt-1 text-xs text-[#666666]">
                                Review student GitHub repositories and attest to cryptographic proof of project completion on Ethereum Sepolia.
                            </p>
                        </div>

                        <div className="text-right sm:border-l sm:border-[#D9E1E8] sm:pl-6">
                            <p className="text-3xl font-extrabold text-[#0A66C2]">{projects.length}</p>
                            <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Awaiting Review</p>
                        </div>
                    </div>

                    {/* Search & Browse Bar */}
                    <div className="mt-5 pt-4 border-t border-[#D9E1E8] flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666666]">🔍</span>
                            <input
                                type="text"
                                placeholder="Search by project name, student, USN, or repository hash..."
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
                        <p className="text-xs text-[#666666]">Loading pending project verifications…</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && projects.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA] text-[#16805D] text-2xl mb-3">
                            ✓
                        </div>
                        <h2 className="text-base font-bold text-[#191919]">No Pending Project Verifications</h2>
                        <p className="mt-1 text-xs text-[#666666] max-w-sm mx-auto">
                            All student project verification requests directed to your organisation have been reviewed and attested.
                        </p>
                    </div>
                )}

                {/* Filter Empty State */}
                {!loading && projects.length > 0 && filteredProjects.length === 0 && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-10 text-center shadow-xs">
                        <p className="text-xs text-[#666666]">No pending projects match your search.</p>
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="mt-2 text-xs font-semibold text-[#0A66C2] hover:underline"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* Projects List */}
                {!loading && paginatedProjects.length > 0 && (
                    <div className="space-y-4">
                        {paginatedProjects.map((project) => {
                            const requestId = project.blockchainRequestId || project._id;
                            const isProcessing = processingId === project._id;
                            const cleanHash = project.githubHash
                                ? project.githubHash.startsWith("0x")
                                    ? project.githubHash
                                    : `0x${project.githubHash}`
                                : "—";

                            return (
                                <div
                                    key={project._id}
                                    className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2]/40 transition"
                                >
                                    {/* Card Top */}
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F3FF] text-[#0A66C2] text-lg font-bold">
                                                💻
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h2 className="text-base font-bold text-[#191919]">
                                                        {project.projectName || "Untitled Project"}
                                                    </h2>
                                                    {project.projectType && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]">
                                                            {project.projectType}
                                                        </span>
                                                    )}
                                                    {requestId && (
                                                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20 font-semibold">
                                                            Req #{String(requestId).slice(-6)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-[#666666] mt-1 leading-relaxed">
                                                    {project.description || "No project description provided."}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20 whitespace-nowrap">
                                            Pending Verification
                                        </span>
                                    </div>

                                    {/* Student & Project Metadata Grid */}
                                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-3 border-t border-[#D9E1E8] text-xs">
                                        <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#D9E1E8]">
                                            <span className="font-semibold text-[#666666] uppercase text-[10px] tracking-wider block mb-1">
                                                Student / Author
                                            </span>
                                            <p className="font-bold text-[#191919]">{project.student?.name || "Verified Student"}</p>
                                            <div className="text-[11px] text-[#666666] mt-0.5">
                                                {project.student?.usn && <span>USN: {project.student.usn} · </span>}
                                                {project.student?.college && <span>{project.student.college}</span>}
                                            </div>
                                            {project.student?.email && (
                                                <p className="text-[11px] text-[#0A66C2] mt-0.5">{project.student.email}</p>
                                            )}
                                        </div>

                                        <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#D9E1E8]">
                                            <span className="font-semibold text-[#666666] uppercase text-[10px] tracking-wider block mb-1">
                                                Student Wallet
                                            </span>
                                            <p className="font-mono text-[11px] text-[#191919] break-all select-all">
                                                {project.student?.walletAddress || "—"}
                                            </p>
                                            <span className="font-semibold text-[#666666] uppercase text-[10px] tracking-wider block mt-2 mb-0.5">
                                                Submitted Date
                                            </span>
                                            <p className="text-[11px] text-[#191919]">
                                                {project.createdAt ? new Date(project.createdAt).toLocaleString() : "—"}
                                            </p>
                                        </div>

                                        <div className="bg-[#F3F6F8] p-3 rounded-lg border border-[#D9E1E8] sm:col-span-2 lg:col-span-1">
                                            <span className="font-semibold text-[#666666] uppercase text-[10px] tracking-wider block mb-1">
                                                Cryptographic Hash
                                            </span>
                                            <p className="font-mono text-[10px] text-[#191919] break-all select-all">
                                                {cleanHash}
                                            </p>
                                            {project.githubLink && (
                                                <a
                                                    href={project.githubLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:underline mt-2.5"
                                                >
                                                    <span>Inspect Repository</span>
                                                    <span>↗</span>
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status Message */}
                                    {statusMessage.id === project._id && statusMessage.text && (
                                        <div
                                            className={`mt-4 rounded-md p-3 text-xs font-medium ${
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

                                    {/* Action Buttons */}
                                    <div className="mt-4 pt-4 border-t border-[#D9E1E8] flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {project.githubLink && (
                                                <a
                                                    href={project.githubLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition"
                                                >
                                                    Open GitHub Code ↗
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => handleReject(project)}
                                                className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#C5221F]/40 bg-white text-[#C5221F] hover:bg-[#FCE8E6] transition cursor-pointer disabled:opacity-50"
                                            >
                                                Reject Verification
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isProcessing}
                                                onClick={() => handleApprove(project)}
                                                className="px-4 py-1.5 rounded-md text-xs font-semibold bg-[#16805D] text-white hover:bg-[#137352] transition shadow-xs cursor-pointer disabled:opacity-50"
                                            >
                                                {isProcessing ? "Attesting On-Chain…" : "✓ Approve & Verify On-Chain"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && filteredProjects.length > ITEMS_PER_PAGE && (
                    <div className="mt-6 flex items-center justify-between border-t border-[#D9E1E8] pt-4 text-xs text-[#666666]">
                        <span>
                            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                            {Math.min(currentPage * ITEMS_PER_PAGE, filteredProjects.length)} of {filteredProjects.length} projects
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
};

export default PendingProjects;