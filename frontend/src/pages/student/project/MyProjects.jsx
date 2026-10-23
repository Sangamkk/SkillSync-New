import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStudentProjects } from "../../../services/projectService";
import { getStudentRequests } from "../../../services/requestService";
import ApplicantManagerAbi from "../../../abhi/ApplicantManager.json";
import { ethers } from "ethers";
import MeshBackground from "../../../components/common/MeshBackground";

const formatProjectId = (value) => {
    if (!value) return "—";
    const normalized = String(value).startsWith("0x") ? String(value) : `0x${String(value)}`;
    return normalized.length > 22 ? `${normalized.slice(0, 12)}...${normalized.slice(-10)}` : normalized;
};

const normalizeProjectId = (value) => {
    if (!value) return null;
    const cleaned = String(value).startsWith("0x") ? String(value) : `0x${String(value)}`;
    return cleaned.toLowerCase();
};

const getStatusLabel = (status) => {
    if (typeof status === "string") return status.toUpperCase();
    switch (status) {
        case 0:
            return "PENDING";
        case 1:
            return "VERIFIED";
        case 2:
            return "REJECTED";
        case 3:
            return "CANCELLED";
        default:
            return "UNKNOWN";
    }
};

const MyProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [requestHistory, setRequestHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [darkMode] = useState(() => {
        return localStorage.getItem("skillsync-theme") !== "light";
    });

    const loadProjects = async () => {
        try {
            setLoading(true);
            setError("");

            const [studentProjects, studentRequests] = await Promise.all([
                getStudentProjects().catch(() => []),
                getMyRequests().catch(() => [])
            ]);

            const projectList = Array.isArray(studentProjects) ? studentProjects : [];
            const rawRequests = Array.isArray(studentRequests) ? studentRequests : [];
            const requests = rawRequests.filter(
                (req) => req.requestType === "project" || req.project
            );

            const enrichedProjects = projectList.map((project) => {
                const projectHash = normalizeProjectId(project.githubHash || project.projectHash);
                const projectIdStr = String(project._id || "");

                const matchingRequests = requests.filter((req) => {
                    const reqProjId = String(req.project?._id || req.project || "");
                    const reqHash = normalizeProjectId(req.credentialHash);
                    return (reqProjId && reqProjId === projectIdStr) || (reqHash && reqHash === projectHash);
                });

                const requestEntries = matchingRequests.map((req) => ({
                    type: "REQUEST",
                    label: getStatusLabel(req.status),
                    requestId: req.blockchainRequestId || req._id,
                    expectedVerifier: req.organisation?.organisationName || req.organisation?.email || "Organisation",
                    verifier: req.organisation?.organisationName || req.organisation?.email,
                    status: req.status,
                    createdAt: req.createdAt ? Math.floor(new Date(req.createdAt).getTime() / 1000) : null,
                    verifiedAt: req.updatedAt ? Math.floor(new Date(req.updatedAt).getTime() / 1000) : null,
                    reason: req.rejectionReason || ""
                }));

                const isVerified = Boolean(
                    project.isVerified ||
                    project.status === "APPROVED" ||
                    matchingRequests.some((r) => String(r.status).toUpperCase() === "APPROVED")
                );

                const onChainRegistered = Boolean(
                    project.onChainRegistered ||
                    project.txHash ||
                    isVerified
                );

                return {
                    ...project,
                    projectHash,
                    isVerified,
                    onChainRegistered,
                    verificationHistory: requestEntries.length > 0 ? requestEntries : (project.verificationHistory || [])
                };
            });

            setProjects(enrichedProjects);
            setRequestHistory(requests);
        } catch (err) {
            console.error("Failed to load student projects:", err);
            setError("Unable to load your projects right now.");
            setProjects([]);
            setRequestHistory([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    return (
        <div
            className={`relative min-h-screen overflow-hidden px-6 py-10 transition-colors duration-500 ${
                darkMode ? "bg-[#070B14] text-white" : "bg-[#F6F8FC] text-slate-900"
            }`}
        >
            <MeshBackground darkMode={darkMode} />

            <div className="relative z-10 mx-auto max-w-6xl">
                {/* Top Navigation Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            darkMode
                                ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                        }`}
                    >
                        ← Back
                    </button>
                    <Link
                        to="/student/dashboard"
                        className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition ${
                            darkMode
                                ? "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
                                : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 shadow-sm"
                        }`}
                    >
                        <span>👤</span> Profile Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div
                    className={`mb-8 rounded-3xl border p-7 backdrop-blur-xl ${
                        darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"
                    }`}
                >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
                                Student Projects
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-tight">My Projects</h1>
                            <p className="mt-2 text-sm text-slate-400">
                                Manage your projects and request verification from organisations.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to="/student/project-history"
                                className={`rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                                    darkMode
                                        ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                📜 Project History
                            </Link>
                            <Link
                                to="/student/project/add"
                                className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 shadow-lg shadow-violet-600/30"
                            >
                                + Add Project
                            </Link>
                        </div>
                    </div>
                </div>

                {/* My Verification Requests */}
                {requestHistory.length > 0 && (
                    <div className={`mb-8 rounded-3xl border p-6 ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"}`}>
                        <h2 className="mb-4 text-xl font-bold">My Verification Requests</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {requestHistory.map((request, idx) => {
                                const requestStatus = getStatusLabel(request.status);
                                const reqId = request.blockchainRequestId || request._id || idx + 1;
                                const verifierName = request.organisation?.organisationName || request.organisation?.email || request.expectedVerifier || "Organisation";
                                const createdDate = request.createdAt ? new Date(request.createdAt).toLocaleString() : "—";
                                return (
                                    <div key={request._id || idx} className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-[#0b1020]" : "border-slate-200 bg-slate-50"}`}>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-sm font-semibold">Request #{reqId}</span>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                                requestStatus === "PENDING"
                                                    ? "bg-amber-500/10 text-amber-400"
                                                    : requestStatus === "APPROVED" || requestStatus === "VERIFIED"
                                                    ? "bg-emerald-500/10 text-emerald-400"
                                                    : requestStatus === "REJECTED"
                                                    ? "bg-rose-500/10 text-rose-400"
                                                    : "bg-slate-500/10 text-slate-400"
                                            }`}>
                                                {requestStatus}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm text-slate-400">
                                            Project: <span className="font-semibold text-slate-200">{request.project?.projectName || formatProjectId(request.credentialHash)}</span>
                                        </p>
                                        <p className="mt-1 text-sm text-slate-400">Verifier: {verifierName}</p>
                                        <p className="mt-1 text-sm text-slate-400">Submitted: {createdDate}</p>
                                        {request.rejectionReason && (
                                            <p className="mt-1 text-xs text-rose-400">Reason: {request.rejectionReason}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-slate-500">
                        Loading your projects...
                    </div>
                ) : error ? (
                    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-400">
                        {error}
                    </div>
                ) : projects.length === 0 ? (
                    <div
                        className={`rounded-3xl border p-10 text-center backdrop-blur-xl ${
                            darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85"
                        }`}
                    >
                        <p className="text-lg font-semibold">No projects found</p>
                        <p className="mt-2 text-sm text-slate-400">
                            Add a project to showcase in your portfolio.
                        </p>
                        <Link
                            to="/student/project/add"
                            className="mt-5 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md"
                        >
                            + Add Project
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {projects.map((project) => (
                            <div
                                key={project._id}
                                className={`rounded-3xl border p-6 backdrop-blur-xl ${
                                    darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white/85 shadow-sm"
                                }`}
                            >
                                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Project</span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                                project.isVerified
                                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                    : project.status === "REJECTED"
                                                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                                    : project.status === "PENDING" && project.verificationHistory?.length > 0
                                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                    : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                            }`}>
                                                {project.isVerified
                                                    ? "Verified"
                                                    : project.status === "REJECTED"
                                                    ? "Rejected"
                                                    : project.status === "PENDING" && project.verificationHistory?.length > 0
                                                    ? "Pending Verification"
                                                    : "Project"}
                                            </span>
                                        </div>
                                        <h2 className="mt-1 text-2xl font-bold">{project.projectName}</h2>

                                        <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-400">
                                            <p><span className="font-semibold text-slate-500">Type:</span> {project.projectType}</p>
                                            <p><span className="font-semibold text-slate-500">Project ID:</span> <span className="font-mono text-[11px] text-slate-200">{formatProjectId(project.projectHash || project.githubHash)}</span></p>
                                            <p className="sm:col-span-2"><span className="font-semibold text-slate-500">GitHub:</span> <a href={project.githubLink} target="_blank" rel="noreferrer" className="text-violet-400 underline">{project.githubLink}</a></p>
                                            {project.description && (
                                                <p className="sm:col-span-2"><span className="font-semibold text-slate-500">Description:</span> {project.description}</p>
                                            )}
                                            <p><span className="font-semibold text-slate-500">Verification:</span> {project.isVerified ? "✓ Verified" : "Showcase Project"}</p>
                                            {project.txHash && (
                                                <p className="sm:col-span-2 font-mono text-[11px] text-slate-400 break-all"><span className="font-semibold text-slate-500">Tx:</span> {project.txHash}</p>
                                            )}
                                            {project.rejectionReason && (
                                                <p className="sm:col-span-2 text-rose-400"><span className="font-semibold">Rejection Reason:</span> {project.rejectionReason}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        {!project.isVerified && project.status !== "REJECTED" && (
                                            <Link
                                                to={`/student/project/verify?type=project&projectId=${encodeURIComponent(project._id)}`}
                                                className="inline-flex rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-violet-500 shadow-md shadow-violet-600/30"
                                            >
                                                Request Verification
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 border-t border-white/5 pt-4">
                                    <h3 className="mb-3 text-base font-semibold">Verification History</h3>
                                    {(project.verificationHistory || []).length === 0 ? (
                                        <div className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-[#0b1020]" : "border-slate-200 bg-slate-50"}`}>
                                            <p className="text-sm text-slate-400">No verification records yet. Requests can be sent to approved organisations.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {(project.verificationHistory || []).map((entry, index) => (
                                                <div key={`${project._id}-${index}`} className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-[#0b1020]" : "border-slate-200 bg-slate-50"}`}>
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold">Verification #{index + 1}</p>
                                                            <p className="text-xs text-slate-400">Organization: {entry.verifier || entry.expectedVerifier || "—"}</p>
                                                        </div>
                                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                                                            entry.label === "VERIFIED" || entry.label === "APPROVED"
                                                                ? "bg-emerald-500/10 text-emerald-400"
                                                                : entry.label === "PENDING"
                                                                ? "bg-amber-500/10 text-amber-400"
                                                                : entry.label === "REJECTED"
                                                                ? "bg-rose-500/10 text-rose-400"
                                                                : "bg-slate-500/10 text-slate-400"
                                                        }`}>
                                                            {entry.label || "UNKNOWN"}
                                                        </span>
                                                    </div>

                                                    {entry.requestId && (
                                                        <p className="mt-1 text-xs text-slate-400">Request ID: {entry.requestId}</p>
                                                    )}
                                                    {(entry.verifiedAt || entry.createdAt) && (
                                                        <p className="mt-1 text-xs text-slate-400">Date: {new Date(Number(entry.verifiedAt || entry.createdAt) * 1000).toLocaleString()}</p>
                                                    )}
                                                    {entry.reason && (
                                                        <p className="mt-1 text-xs text-rose-400">Reason: {entry.reason}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProjects;
