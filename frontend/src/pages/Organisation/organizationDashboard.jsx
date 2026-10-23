<<<<<<< Updated upstream
import { useEffect, useState } from "react";

import {
    getIssuerRequests,
    approveVerificationRequest,
    rejectVerificationRequest
} from "../../services/requestService"
=======
import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    getPendingRequests,
    getOrganisationRequestHistory,
    approveRequest,
    rejectRequest,
} from "../../services/verificationService";
>>>>>>> Stashed changes
import {
    getCertificateDocument,
<<<<<<< Updated upstream
    updateCertificateStatus
} from "../../services/certificateService";
import { getPendingProjects } from "../../services/projectService";
import { getMyJobs, getOrganisationEmployees } from "../../services/employmentService";
import { CredentialType, RequestType } from "../../utils/enums";
import MeshBackground from "../../components/common/MeshBackground";
import { Link } from "react-router-dom";
import { mlBackend } from "../../services/mlServices";
import { useNavigate } from "react-router-dom";

const OrganisationRequests = () => {

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);
    const [actionMessage, setActionMessage] = useState({ id: null, text: "", type: "" });
    const [orgStats, setOrgStats] = useState({
        pendingCerts: 0,
        pendingProjects: 0,
        myJobs: 0,
        myEmployees: 0
    });

    const [darkMode] = useState(() => {
        return localStorage.getItem("skillsync-theme") !== "light";
    });

    useEffect(() => {
        loadRequestsAndStats();
    }, []);
    const navigate = useNavigate();

    const loadRequestsAndStats = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadRequests(),
                loadOrgStats()
            ]);
        } catch (err) {
            console.error("Error loading dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadOrgStats = async () => {
        try {
            const [pendingProjs, jobs, employees] = await Promise.all([
                getPendingProjects().catch(() => []),
                getMyJobs().catch(() => []),
                getOrganisationEmployees().catch(() => [])
            ]);

            setOrgStats({
                pendingProjects: (pendingProjs || []).length,
                myJobs: (jobs || []).length,
                myEmployees: (employees || []).length
            });
        } catch (err) {
            console.error("Error loading org stats:", err);
        }
    };

    const loadRequests = async () => {
        setLoading(true);
        console.log("Loading Requests...");

        try {
            const blockchainRequests = await getIssuerRequests();
            console.log("Blockchain Requests:", blockchainRequests);

            const data = [];

            for (const request of blockchainRequests) {
                console.log("Request:", request);

                if (Number(request.credentialType) !== CredentialType.Certificate) {
                    continue;
                }

                try {
                    const certificate = await getCertificateByHash(
                        request.credentialHash
                    );

                    console.log("Certificate:", certificate);

                    if (certificate) {
                        data.push({
                            request,
                            certificate,
                        });
                    }
                } catch (certErr) {
                    console.error("Error loading cert for request:", certErr);
                }
            }

            console.log("Final Data:", data);
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewCertificate = async (certificateHash) => {
        const documentWindow = window.open("about:blank", "_blank");
        console.log("Certificate document window:", { isNull: documentWindow === null });

        if (!documentWindow) {
            console.error("Certificate document window was blocked by the browser.");
            return;
        }

        documentWindow.opener = null;

        try {
            const documentUrl = await getCertificateDocument(certificateHash);
            documentWindow.location.href = documentUrl;
        } catch (error) {
            console.error("Error loading certificate document:", error);
            documentWindow.close();
        }
    };

    const handleApprove = async (item) => {
        const reqId = item.request.id.toString();
        setProcessingId(reqId);
        setActionMessage({ id: reqId, text: "Prompting MetaMask transaction...", type: "info" });

        try {
            setActionMessage({ id: reqId, text: "Waiting for blockchain confirmation...", type: "info" });
            const txHash = await approveVerificationRequest(item.request.id);

            setActionMessage({ id: reqId, text: "Synchronizing database status...", type: "info" });
            await updateCertificateStatus(item.certificate.certificateHash, "Verified", txHash);

            setActionMessage({ id: reqId, text: `✓ Certificate Verified on-chain! Tx: ${txHash.slice(0, 14)}...`, type: "success" });
            setTimeout(() => {
                loadRequests();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1500);
        } catch (error) {
            console.error("Certificate approval error:", error);
            const errText = error.shortMessage || error.reason || error.message || "Approval failed";
            setActionMessage({ id: reqId, text: `❌ ${errText}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (item) => {
        const reason = window.prompt("Reason for certificate rejection:", "Document verification failed");
        if (reason === null) return;

        const reqId = item.request.id.toString();
        setProcessingId(reqId);
        setActionMessage({ id: reqId, text: "Prompting MetaMask transaction to reject...", type: "info" });

        try {
            setActionMessage({ id: reqId, text: "Waiting for blockchain confirmation...", type: "info" });
            const txHash = await rejectVerificationRequest(item.request.id);

            setActionMessage({ id: reqId, text: "Updating database status...", type: "info" });
            await updateCertificateStatus(item.certificate.certificateHash, "Rejected", txHash, reason);

            setActionMessage({ id: reqId, text: "Certificate Request Rejected.", type: "success" });
            setTimeout(() => {
                loadRequests();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1500);
        } catch (error) {
            console.error("Certificate rejection error:", error);
            const errText = error.shortMessage || error.reason || error.message || "Rejection failed";
            setActionMessage({ id: reqId, text: `❌ ${errText}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleDirectPredict = async (item) => {
        try {
            const certificateId = item.certificate._id;
            const result = await mlBackend(certificateId);
            console.log("Prediction result:", result);
            alert(`Prediction: ${result.prediction.label} Confidence: ${(result.prediction.confidence * 100).toFixed(2)}%`);
        } catch (error) {
            console.error(
                "Direct prediction error:",
                error.response?.data || error.message
            );
        }
    };

    const handleExtractCertificate = (item) => {

        const certificateId = item.certificate._id;

        navigate(`/organisation/extract-certificate/${certificateId}`);

    };


    return (

        <div
            className={`relative min-h-screen overflow-hidden px-6 py-10 transition-colors duration-500 ${darkMode
                ? "bg-[#070B14] text-white"
                : "bg-[#F6F8FC] text-slate-900"
                }`}
        >

            {/* ================= MESH BACKGROUND ================= */}

            <MeshBackground darkMode={darkMode} />


            {/* ================= BACKGROUND GLOW ================= */}

            <div
                className={`pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full blur-[130px] ${darkMode
                    ? "bg-blue-600/15"
                    : "bg-blue-500/10"
                    }`}
            />

            <div
                className={`pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full blur-[130px] ${darkMode
                    ? "bg-violet-600/15"
                    : "bg-violet-500/10"
                    }`}
            />


            {/* ================= MAIN CONTENT ================= */}

            <div className="relative z-10 mx-auto max-w-6xl">


                {/* ================= HEADER ================= */}

                <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">
                            Organisation Portal
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Dashboard & Verification
                        </h1>

                        <p
                            className={`mt-2 max-w-2xl text-sm leading-6 ${darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                                }`}
                        >
                            Review pending credentials, verify projects, and manage employment offers.
                        </p>

                    </div>

                    <div className="flex flex-wrap gap-2 sm:items-center">
                        <Link
                            to="/organisation/project"
                            className="rounded-xl bg-blue-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-600"
                        >
                            📂 Pending Projects {orgStats.pendingProjects > 0 && `(${orgStats.pendingProjects})`}
                        </Link>
                        <Link
                            to="/organisation/jobs/new"
                            className="rounded-xl bg-violet-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-600"
                        >
                            ➕ Post Job
                        </Link>
                        <Link
                            to="/organisation/jobs"
                            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                        >
                            💼 My Jobs ({orgStats.myJobs})
                        </Link>
                        <Link
                            to="/organisation/employees"
                            className="rounded-xl bg-emerald-600/90 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                        >
                            👥 Employees ({orgStats.myEmployees})
                        </Link>
                    </div>

                </div>

                {/* ================= ORGANISATION STATS CARDS ================= */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Certificate Requests</p>
                            <span className="text-lg">📜</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{requests.length}</p>
                            <span className="text-xs font-semibold text-violet-400">Pending Review</span>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Project Requests</p>
                            <span className="text-lg">📂</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{orgStats.pendingProjects}</p>
                            <span className="text-xs font-semibold text-blue-400">Awaiting Verification</span>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Postings</p>
                            <span className="text-lg">💼</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{orgStats.myJobs}</p>
                            <span className="text-xs text-slate-400">Published Jobs</span>
                        </div>
                    </div>

                    <div className={`rounded-2xl border p-5 backdrop-blur-xl ${darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm"}`}>
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Employees</p>
                            <span className="text-lg">👥</span>
                        </div>
                        <div className="mt-3 flex items-baseline justify-between">
                            <p className="text-2xl font-bold">{orgStats.myEmployees}</p>
                            <span className="text-xs font-semibold text-emerald-400">Active Team</span>
                        </div>
                    </div>
                </div>


                {/* ================= REQUEST COUNT ================= */}

                <div
                    className={`mb-6 inline-flex items-center gap-3 rounded-2xl border px-5 py-3 ${darkMode
                        ? "border-white/10 bg-white/[0.04]"
                        : "border-slate-200 bg-white shadow-sm"
                        }`}
                >

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                        ✓
                    </div>

                    <div>

                        <p className="text-xs text-slate-500">
                            Pending Requests
                        </p>

                        <p className="text-lg font-bold">
                            {requests.length}
                        </p>

                    </div>

                </div>


                {/* ================= EMPTY STATE ================= */}

                {requests.length === 0 && (

                    <div
                        className={`rounded-3xl border p-12 text-center backdrop-blur-xl ${darkMode
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200 bg-white/80 shadow-sm"
                            }`}
                    >

                        <div
                            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl ${darkMode
                                ? "bg-violet-500/10"
                                : "bg-violet-50"
                                }`}
                        >
                            📜
                        </div>

                        <h2 className="mt-5 text-xl font-bold">
                            No Requests Found
                        </h2>

                        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                            Certificate verification requests will
                            appear here when they are submitted.
                        </p>

                    </div>

                )}


                {/* ================= REQUESTS ================= */}

                {requests.length > 0 && (

                    <div className="grid gap-6 md:grid-cols-2">

                        {requests.map((item, index) => (

                            <div
                                key={index}
                                className={`rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 ${darkMode
                                    ? "border-white/10 bg-white/[0.045] shadow-xl shadow-black/20 hover:-translate-y-1 hover:border-violet-500/20"
                                    : "border-slate-200 bg-white/85 shadow-sm hover:-translate-y-1 hover:shadow-lg"
                                    }`}
                            >

                                {/* Card Header */}

                                <div className="flex items-start justify-between gap-4">

                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${darkMode
                                            ? "bg-violet-500/10 text-violet-400"
                                            : "bg-violet-50 text-violet-600"
                                            }`}
                                    >
                                        📜
                                    </div>

                                    {item.request.status === 1 || item.certificate.verificationStatus === "Verified" ? (
                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400">
                                            ✓ VERIFIED
                                        </span>
                                    ) : item.request.status === 2 || item.certificate.verificationStatus === "Rejected" ? (
                                        <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400">
                                            REJECTED
                                        </span>
                                    ) : (
                                        <span
                                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${darkMode
                                                ? "bg-amber-500/10 text-amber-400"
                                                : "bg-amber-50 text-amber-600"
                                                }`}
                                        >
                                            PENDING VERIFICATION
                                        </span>
                                    )}

                                </div>


                                {/* Certificate Name */}

                                <h2 className="mt-6 text-xl font-bold">
                                    {item.certificate.certificateName}
                                </h2>


                                {/* Details */}

                                <div className="mt-5 space-y-3">

                                    {/* Issuer */}

                                    <div
                                        className={`rounded-2xl p-4 ${darkMode
                                            ? "bg-white/[0.03]"
                                            : "bg-slate-50"
                                            }`}
                                    >

                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Issuer
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {item.certificate.issuer}
                                        </p>

                                    </div>


                                    {/* Certificate Type */}

                                    <div
                                        className={`rounded-2xl p-4 ${darkMode
                                            ? "bg-white/[0.03]"
                                            : "bg-slate-50"
                                            }`}
                                    >

                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Certificate Type
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {item.certificate.certificateType}
                                        </p>

                                    </div>

                                    {/* Student Wallet */}
                                    <div
                                        className={`rounded-2xl p-4 ${darkMode
                                            ? "bg-white/[0.03]"
                                            : "bg-slate-50"
                                            }`}
                                    >
                                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                                            Student Address
                                        </p>
                                        <p className="mt-1 break-all font-mono text-xs text-slate-400">
                                            {item.request.student}
                                        </p>
                                    </div>

                                </div>

                                {/* ACTION FEEDBACK */}
                                {actionMessage.id === item.request.id.toString() && actionMessage.text && (
                                    <div
                                        className={`mt-4 rounded-2xl p-3 text-xs font-medium ${actionMessage.type === "success"
                                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                            : actionMessage.type === "error"
                                                ? "border border-red-500/30 bg-red-500/10 text-red-400"
                                                : "border border-blue-500/30 bg-blue-500/10 text-blue-400"
                                            }`}
                                    >
                                        {actionMessage.text}
                                    </div>
                                )}


                                {/* View Certificate */}

                                <button
                                    type="button"
                                    onClick={() => handleViewCertificate(item.certificate.certificateHash)}
                                    className="mt-6 flex w-full items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/5 py-3 text-sm font-semibold text-violet-400 transition-all hover:bg-violet-500/10"
                                >
                                    View Certificate Document ↗
                                </button>

                                {/* ML ANALYSIS BUTTONS */}

                                {Number(item.request.status) === 0 && (
                                    <div className="mt-4 grid grid-cols-2 gap-3">

                                        {/* DIRECT PREDICTION */}

                                        <button
                                            type="button"
                                            onClick={() => handleDirectPredict(item)}
                                            className={`rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${darkMode
                                                ? "border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                                                : "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                }`}
                                        >
                                            🤖 Direct Predict
                                        </button>


                                        {/* EXTRACTION */}

                                        <button
                                            type="button"
                                            onClick={() => handleExtractCertificate(item)}
                                            className={`rounded-xl py-3 text-sm font-semibold transition-all duration-300 ${darkMode
                                                ? "border border-violet-500/30 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                                                : "border border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100"
                                                }`}
                                        >
                                            🔍 Extract Certificate
                                        </button>

                                    </div>
                                )}

                                {/* ACTION BUTTONS */}
                                {Number(item.request.credentialType) === CredentialType.Certificate &&
                                    Number(item.request.requestType) === RequestType.AddCertificate &&
                                    Number(item.request.status) === 0 &&
                                    item.certificate.verificationStatus !== "Verified" &&
                                    item.certificate.verificationStatus !== "Rejected" &&
                                    item.certificate.verificationStatus !== "Cancelled" && (
                                        <div className="mt-4 flex gap-3">
                                            <button
                                                disabled={processingId === item.request.id.toString()}
                                                onClick={() => handleApprove(item)}
                                                className={`flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${processingId === item.request.id.toString() ? "cursor-not-allowed opacity-60" : ""
                                                    }`}
                                            >
                                                {processingId === item.request.id.toString() ? "Verifying..." : "✓ Approve & Verify On-Chain"}
                                            </button>
                                            <button
                                                disabled={processingId === item.request.id.toString()}
                                                onClick={() => handleReject(item)}
                                                className={`rounded-xl border px-5 py-3 text-sm font-semibold transition-all duration-300 ${darkMode
                                                    ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                                                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                    } ${processingId === item.request.id.toString() ? "cursor-not-allowed opacity-60" : ""}`}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}

                            </div>

                        ))}

                    </div>

                )}

=======
    getIssuedCertificates,
} from "../../services/certificateService";
import { getPendingProjects, updateProjectStatus } from "../../services/projectService";
import {
    getMyJobs,
    getOrganisationEmployees,
    terminateEmployment,
} from "../../services/employmentService";

const ITEMS_PER_PAGE = 5;

// Reusable Pagination Component
const PaginationBar = ({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) => {
    if (totalItems <= itemsPerPage) return null;
    return (
        <div className="mt-5 flex flex-wrap items-center justify-between border-t border-[#D9E1E8] pt-4 text-xs text-[#666666] gap-2">
            <span>
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} items
            </span>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
                >
                    ← Previous
                </button>
                <span className="px-2 font-semibold text-[#191919]">
                    Page {currentPage} of {totalPages || 1}
                </span>
                <button
                    type="button"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] disabled:opacity-40 cursor-pointer"
                >
                    Next →
                </button>
>>>>>>> Stashed changes
            </div>

        </div>

    );
};

const OrganisationDashboard = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    // 4 Main Sections: "issue-cert", "requests", "jobs", "employees"
    const [mainSection, setMainSection] = useState("issue-cert");

    // Sub-tab for Requests section: "cert-requests", "project-requests", "history"
    const [requestSubTab, setRequestSubTab] = useState("cert-requests");

    // Data States
    const [loading, setLoading] = useState(true);
    const [certRequests, setCertRequests] = useState([]);
    const [projectRequests, setProjectRequests] = useState([]);
    const [historyRequests, setHistoryRequests] = useState([]);
    const [issuedCertificates, setIssuedCertificates] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Action & Processing States
    const [processingId, setProcessingId] = useState(null);
    const [actionMessage, setActionMessage] = useState({ id: null, text: "", type: "" });

    // Search queries per section
    const [issuedSearch, setIssuedSearch] = useState("");
    const [certReqSearch, setCertReqSearch] = useState("");
    const [projReqSearch, setProjReqSearch] = useState("");
    const [historySearch, setHistorySearch] = useState("");
    const [jobsSearch, setJobsSearch] = useState("");
    const [employeeSearch, setEmployeeSearch] = useState("");

    // Pagination pages per section
    const [pageIssued, setPageIssued] = useState(1);
    const [pageCertReq, setPageCertReq] = useState(1);
    const [pageProjReq, setPageProjReq] = useState(1);
    const [pageHistory, setPageHistory] = useState(1);
    const [pageJobs, setPageJobs] = useState(1);
    const [pageEmployees, setPageEmployees] = useState(1);

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
            return {};
        }
    }, []);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [cReqs, pReqs, hist, issued, myJobList, empList] = await Promise.all([
                getPendingRequests().catch(() => []),
                getPendingProjects().catch(() => []),
                getOrganisationRequestHistory().catch(() => []),
                getIssuedCertificates().catch(() => []),
                getMyJobs().catch(() => []),
                getOrganisationEmployees().catch(() => []),
            ]);

            setCertRequests(Array.isArray(cReqs) ? cReqs : []);
            setProjectRequests(Array.isArray(pReqs) ? pReqs : []);
            setHistoryRequests(Array.isArray(hist) ? hist : []);
            setIssuedCertificates(Array.isArray(issued) ? issued : []);
            setJobs(Array.isArray(myJobList) ? myJobList : []);
            setEmployees(Array.isArray(empList) ? empList : []);
        } catch (error) {
            console.error("Dashboard data load error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Actions for Certificate Requests
    const handleApproveCert = async (req) => {
        const id = req._id || req.id;
        setProcessingId(id);
        setActionMessage({ id, text: "Processing certificate approval on-chain…", type: "info" });
        try {
            const result = await approveRequest(id);
            const txHash = result?.transactionHash || result?.txHash || "";
            setActionMessage({
                id,
                text: txHash ? `✓ Certificate approved! Tx: ${txHash.slice(0, 14)}…` : "✓ Certificate approved successfully.",
                type: "success",
            });
            setTimeout(() => {
                loadAllData();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (err) {
            setActionMessage({ id, text: `❌ ${err.response?.data?.message || err.message}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectCert = async (req) => {
        const reason = window.prompt("Reason for certificate rejection:", "Does not meet verification criteria.");
        if (reason === null || String(reason).trim() === "") return;
        const id = req._id || req.id;
        setProcessingId(id);
        setActionMessage({ id, text: "Processing rejection…", type: "info" });
        try {
            await rejectRequest(id, reason);
            setActionMessage({ id, text: "✓ Request rejected.", type: "success" });
            setTimeout(() => {
                loadAllData();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (err) {
            setActionMessage({ id, text: `❌ ${err.response?.data?.message || err.message}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    // Actions for Project Requests
    const handleApproveProj = async (project) => {
        const projId = project._id;
        setProcessingId(projId);
        setActionMessage({ id: projId, text: "Attesting project on blockchain…", type: "info" });
        try {
            const result = await updateProjectStatus(projId, "APPROVED", null, "");
            const txHash = result?.transactionHash || result?.txHash || "";
            setActionMessage({
                id: projId,
                text: txHash ? `✓ Project approved! Tx: ${txHash.slice(0, 14)}…` : "✓ Project verified successfully.",
                type: "success",
            });
            setTimeout(() => {
                loadAllData();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (error) {
            setActionMessage({ id: projId, text: `❌ ${error.response?.data?.message || error.message}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleRejectProj = async (project) => {
        const reason = window.prompt("Reason for project rejection:", "Does not meet verification criteria.");
        if (reason === null || String(reason).trim() === "") return;
        const projId = project._id;
        setProcessingId(projId);
        setActionMessage({ id: projId, text: "Processing rejection…", type: "info" });
        try {
            await updateProjectStatus(projId, "REJECTED", null, reason);
            setActionMessage({ id: projId, text: "✓ Project request rejected.", type: "success" });
            setTimeout(() => {
                loadAllData();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (error) {
            setActionMessage({ id: projId, text: `❌ ${error.response?.data?.message || error.message}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    // Action for Employee Termination
    const handleTerminateEmp = async (emp) => {
        const name = emp.student?.name || "this employee";
        if (!window.confirm(`Are you sure you want to terminate employment for ${name}? This will record an immutable on-chain event.`)) return;

        const id = emp._id || emp.offerId;
        setProcessingId(id);
        setActionMessage({ id, text: "Recording termination on Ethereum Sepolia…", type: "info" });
        try {
            const result = await terminateEmployment(id);
            const txHash = result?.transactionHash || result?.txHash || "";
            setActionMessage({
                id,
                text: txHash ? `✓ Employment terminated on-chain. Tx: ${txHash.slice(0, 14)}…` : "✓ Employment terminated.",
                type: "success",
            });
            setTimeout(() => {
                loadAllData();
                setActionMessage({ id: null, text: "", type: "" });
            }, 1800);
        } catch (err) {
            setActionMessage({ id, text: `❌ ${err.response?.data?.message || err.message}`, type: "error" });
        } finally {
            setProcessingId(null);
        }
    };

    // Document file viewer
    const handleViewDoc = async (hash, fallbackUrl) => {
        if (fallbackUrl) {
            window.open(fallbackUrl, "_blank", "noopener,noreferrer");
            return;
        }
        if (!hash) return;
        const w = window.open("about:blank", "_blank");
        if (!w) {
            alert("Popup blocked. Please allow popups for document inspection.");
            return;
        }
        w.opener = null;
        try {
            const url = await getCertificateDocument(hash);
            w.location.href = url;
        } catch {
            w.close();
            alert("Unable to fetch certificate document.");
        }
    };

    // ─── Filtered & Paginated Lists ──────────────────────────────────────────

    // 1. Issued Certificates
    const filteredIssued = useMemo(() => {
        if (!issuedSearch.trim()) return issuedCertificates;
        const q = issuedSearch.toLowerCase();
        return issuedCertificates.filter((c) => {
            const name = (c.certificateName || "").toLowerCase();
            const recipient = (c.student?.name || c.studentName || "").toLowerCase();
            const hash = (c.certificateHash || "").toLowerCase();
            const type = (c.certificateType || "").toLowerCase();
            return name.includes(q) || recipient.includes(q) || hash.includes(q) || type.includes(q);
        });
    }, [issuedCertificates, issuedSearch]);

    const totalPagesIssued = Math.ceil(filteredIssued.length / ITEMS_PER_PAGE) || 1;
    const paginatedIssued = useMemo(() => {
        const start = (pageIssued - 1) * ITEMS_PER_PAGE;
        return filteredIssued.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredIssued, pageIssued]);

    // 2. Certificate Requests
    const filteredCertReqs = useMemo(() => {
        if (!certReqSearch.trim()) return certRequests;
        const q = certReqSearch.toLowerCase();
        return certRequests.filter((r) => {
            const name = (r.certificateName || r.certificate?.certificateName || "").toLowerCase();
            const student = (r.studentName || r.student?.name || "").toLowerCase();
            const hash = (r.certificateHash || r.credentialHash || "").toLowerCase();
            return name.includes(q) || student.includes(q) || hash.includes(q);
        });
    }, [certRequests, certReqSearch]);

    const totalPagesCertReqs = Math.ceil(filteredCertReqs.length / ITEMS_PER_PAGE) || 1;
    const paginatedCertReqs = useMemo(() => {
        const start = (pageCertReq - 1) * ITEMS_PER_PAGE;
        return filteredCertReqs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredCertReqs, pageCertReq]);

    // 3. Project Requests
    const filteredProjReqs = useMemo(() => {
        if (!projReqSearch.trim()) return projectRequests;
        const q = projReqSearch.toLowerCase();
        return projectRequests.filter((p) => {
            const name = (p.projectName || "").toLowerCase();
            const student = (p.student?.name || "").toLowerCase();
            const hash = (p.githubHash || "").toLowerCase();
            return name.includes(q) || student.includes(q) || hash.includes(q);
        });
    }, [projectRequests, projReqSearch]);

    const totalPagesProjReqs = Math.ceil(filteredProjReqs.length / ITEMS_PER_PAGE) || 1;
    const paginatedProjReqs = useMemo(() => {
        const start = (pageProjReq - 1) * ITEMS_PER_PAGE;
        return filteredProjReqs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredProjReqs, pageProjReq]);

    // 4. Verification History
    const filteredHistory = useMemo(() => {
        if (!historySearch.trim()) return historyRequests;
        const q = historySearch.toLowerCase();
        return historyRequests.filter((h) => {
            const name = (h.certificateName || h.certificate?.certificateName || h.project?.projectName || "").toLowerCase();
            const student = (h.student?.name || "").toLowerCase();
            const status = (h.status || "").toLowerCase();
            return name.includes(q) || student.includes(q) || status.includes(q);
        });
    }, [historyRequests, historySearch]);

    const totalPagesHistory = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
    const paginatedHistory = useMemo(() => {
        const start = (pageHistory - 1) * ITEMS_PER_PAGE;
        return filteredHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredHistory, pageHistory]);

    // 5. Jobs
    const filteredJobs = useMemo(() => {
        if (!jobsSearch.trim()) return jobs;
        const q = jobsSearch.toLowerCase();
        return jobs.filter((j) => {
            const title = (j.title || j.jobTitle || "").toLowerCase();
            const loc = (j.location || "").toLowerCase();
            const type = (j.employmentType || "").toLowerCase();
            return title.includes(q) || loc.includes(q) || type.includes(q);
        });
    }, [jobs, jobsSearch]);

    const totalPagesJobs = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE) || 1;
    const paginatedJobs = useMemo(() => {
        const start = (pageJobs - 1) * ITEMS_PER_PAGE;
        return filteredJobs.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredJobs, pageJobs]);

    // 6. Employees
    const filteredEmployees = useMemo(() => {
        if (!employeeSearch.trim()) return employees;
        const q = employeeSearch.toLowerCase();
        return employees.filter((e) => {
            const name = (e.student?.name || "").toLowerCase();
            const email = (e.student?.email || "").toLowerCase();
            const title = (e.job?.title || "").toLowerCase();
            const status = (e.status || "").toLowerCase();
            return name.includes(q) || email.includes(q) || title.includes(q) || status.includes(q);
        });
    }, [employees, employeeSearch]);

    const totalPagesEmployees = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE) || 1;
    const paginatedEmployees = useMemo(() => {
        const start = (pageEmployees - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEmployees, pageEmployees]);

    // Stats calculations
    const totalPendingRequests = certRequests.length + projectRequests.length;
    const activeEmployeesCount = employees.filter((e) => e.status === "Active").length;

    return (
        <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
            <div className="mx-auto max-w-6xl">
                {/* Header Welcome Bar */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-1.5">
                            Verified Organisation Portal
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            {currentUser.name || "Organisation"} Dashboard
                        </h1>
                        <p className="mt-1 text-xs text-[#666666]">
                            Issue authentic blockchain credentials, review student verification requests, and manage workforce & recruitment.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                logout();
                                navigate("/login");
                            }}
                            className="px-3.5 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] hover:border-[#C5221F]/30 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                            <span>🚪</span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* 4 Main Summary Cards */}
                <div className="mb-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. Issue Certificate Stat */}
                    <div
                        onClick={() => setMainSection("issue-cert")}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            mainSection === "issue-cert"
                                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                                Issued Credentials
                            </span>
                            <span className="text-base">📜</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-[#191919]">{issuedCertificates.length}</p>
                        <p className="mt-0.5 text-[11px] text-[#0A66C2] font-medium">View issued certificates →</p>
                    </div>

                    {/* 2. Requests Stat */}
                    <div
                        onClick={() => setMainSection("requests")}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            mainSection === "requests"
                                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                                Pending Requests
                            </span>
                            <span className="text-base">📥</span>
                        </div>
                        <div className="mt-2 flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-[#B06000]">{totalPendingRequests}</p>
                            <span className="text-[10px] text-[#666666]">
                                ({certRequests.length} certs · {projectRequests.length} projects)
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-[#B06000] font-medium">Review pending queue →</p>
                    </div>

                    {/* 3. Jobs Stat */}
                    <div
                        onClick={() => setMainSection("jobs")}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            mainSection === "jobs"
                                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                                Active Job Postings
                            </span>
                            <span className="text-base">💼</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-[#191919]">{jobs.length}</p>
                        <p className="mt-0.5 text-[11px] text-[#0A66C2] font-medium">Manage job postings →</p>
                    </div>

                    {/* 4. Employees Stat */}
                    <div
                        onClick={() => setMainSection("employees")}
                        className={`p-4 rounded-xl border transition cursor-pointer ${
                            mainSection === "employees"
                                ? "border-[#0A66C2] bg-white shadow-sm ring-1 ring-[#0A66C2]"
                                : "border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666666]">
                                Active Employees
                            </span>
                            <span className="text-base">👥</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-[#16805D]">{activeEmployeesCount}</p>
                        <p className="mt-0.5 text-[11px] text-[#16805D] font-medium">Manage workforce →</p>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
                        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#0A66C2] border-t-transparent" />
                        <p className="text-xs text-[#666666]">Loading organisation records…</p>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 1: ISSUE CERTIFICATE
                ══════════════════════════════════════════════════════════════════ */}
                {!loading && mainSection === "issue-cert" && (
                    <div className="space-y-6">
                        {/* Direct Issuance Card */}
                        <div className="rounded-xl border border-[#0A66C2]/30 bg-[#F8FBFF] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-[11px] font-semibold text-[#0A66C2] uppercase tracking-wide">
                                    Instant Credential Minting
                                </span>
                                <h2 className="text-lg font-bold text-[#191919] mt-0.5">
                                    Directly Issue a Verified Certificate
                                </h2>
                                <p className="text-xs text-[#666666] mt-1 max-w-xl">
                                    Compute SHA-256 document proofs and anchor accredited course, internship, or workshop certificates directly on Ethereum Sepolia.
                                </p>
                            </div>
                            <Link
                                to="/organisation/issue-certificate"
                                className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs whitespace-nowrap self-start sm:self-auto"
                            >
                                Launch Issuance Form →
                            </Link>
                        </div>

                        {/* Issued Certificates Directory */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-[#191919]">
                                        Issued Certificates Directory
                                    </h3>
                                    <p className="text-xs text-[#666666] mt-0.5">
                                        Tamper-proof credentials issued by your organisation.
                                    </p>
                                </div>
                                <div className="w-full sm:w-72">
                                    <input
                                        type="text"
                                        placeholder="Search by title, student, or hash..."
                                        value={issuedSearch}
                                        onChange={(e) => {
                                            setIssuedSearch(e.target.value);
                                            setPageIssued(1);
                                        }}
                                        className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                                    />
                                </div>
                            </div>

                            {filteredIssued.length === 0 ? (
                                <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                    No issued certificates found. Use &quot;Launch Issuance Form&quot; to issue your first verified certificate.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paginatedIssued.map((cert) => (
                                        <div
                                            key={cert._id}
                                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#191919] text-sm">
                                                        {cert.certificateName || "Verified Certificate"}
                                                    </span>
                                                    {cert.certificateType && (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]">
                                                            {cert.certificateType}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[#666666] mt-1">
                                                    Recipient: <strong className="text-[#191919]">{cert.student?.name || cert.studentName || "Student"}</strong>
                                                    {cert.student?.email && ` (${cert.student.email})`}
                                                </p>
                                                <p className="text-[11px] font-mono text-[#888888] mt-0.5 break-all">
                                                    SHA-256: {cert.certificateHash || "—"}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                                {cert.certificateURL && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDoc(cert.certificateHash, cert.certificateURL)}
                                                        className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs cursor-pointer"
                                                    >
                                                        View Document
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/verify/${cert.certificateHash || cert._id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs"
                                                >
                                                    Verify & QR →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            <PaginationBar
                                currentPage={pageIssued}
                                totalPages={totalPagesIssued}
                                totalItems={filteredIssued.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                onPageChange={setPageIssued}
                            />
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 2: REQUESTS (CERTIFICATES & PROJECTS SEPARATE)
                ══════════════════════════════════════════════════════════════════ */}
                {!loading && mainSection === "requests" && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
                        {/* Sub-tab Navigation */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-[#D9E1E8]">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRequestSubTab("cert-requests")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        requestSubTab === "cert-requests"
                                            ? "bg-[#0A66C2] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#E8F3FF] hover:text-[#0A66C2]"
                                    }`}
                                >
                                    <span>📜 Certificate Requests</span>
                                    <span className="text-[11px] opacity-80 font-normal">({certRequests.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRequestSubTab("project-requests")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        requestSubTab === "project-requests"
                                            ? "bg-[#0A66C2] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-[#E8F3FF] hover:text-[#0A66C2]"
                                    }`}
                                >
                                    <span>💻 Project Requests</span>
                                    <span className="text-[11px] opacity-80 font-normal">({projectRequests.length})</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRequestSubTab("history")}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                        requestSubTab === "history"
                                            ? "bg-[#191919] text-white"
                                            : "bg-[#F3F6F8] text-[#666666] hover:bg-slate-200"
                                    }`}
                                >
                                    <span>📋 Request History</span>
                                    <span className="text-[11px] opacity-80 font-normal">({historyRequests.length})</span>
                                </button>
                            </div>

                            <Link
                                to={requestSubTab === "project-requests" ? "/organisation/pending-projects" : "/organisation/pending-verifications"}
                                className="text-xs font-semibold text-[#0A66C2] hover:underline"
                            >
                                Dedicated Full Page →
                            </Link>
                        </div>

                        {/* SUB-TAB 1: Certificate Requests */}
                        {requestSubTab === "cert-requests" && (
                            <div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search certificate requests by title, student, or hash..."
                                        value={certReqSearch}
                                        onChange={(e) => {
                                            setCertReqSearch(e.target.value);
                                            setPageCertReq(1);
                                        }}
                                        className="w-full sm:w-80 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                                    />
                                </div>

                                {filteredCertReqs.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                        No pending certificate verification requests awaiting review.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginatedCertReqs.map((req) => {
                                            const id = req._id || req.id;
                                            const isProc = processingId === id;
                                            const certHash = req.certificateHash || req.credentialHash || req.certificate?.certificateHash;

                                            return (
                                                <div
                                                    key={id}
                                                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-[#191919] text-sm">
                                                            {req.certificateName || req.certificate?.certificateName || "Certificate Request"}
                                                        </h4>
                                                        <p className="text-[#666666] mt-0.5">
                                                            Submitted by: <strong className="text-[#191919]">{req.studentName || req.student?.name || "Student"}</strong>
                                                            {req.student?.usn && ` (${req.student.usn})`}
                                                        </p>
                                                        {certHash && (
                                                            <p className="font-mono text-[11px] text-[#888888] mt-1 break-all">
                                                                Hash: {certHash}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                                        {certHash && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleViewDoc(certHash)}
                                                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs cursor-pointer"
                                                            >
                                                                View Doc
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={isProc}
                                                            onClick={() => handleApproveCert(req)}
                                                            className="px-3.5 py-1.5 rounded-md bg-[#16805D] text-white hover:bg-[#137352] font-semibold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isProc ? "…" : "Approve"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isProc}
                                                            onClick={() => handleRejectCert(req)}
                                                            className="px-3 py-1.5 rounded-md border border-[#C5221F]/40 bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <PaginationBar
                                    currentPage={pageCertReq}
                                    totalPages={totalPagesCertReqs}
                                    totalItems={filteredCertReqs.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setPageCertReq}
                                />
                            </div>
                        )}

                        {/* SUB-TAB 2: Project Requests */}
                        {requestSubTab === "project-requests" && (
                            <div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search project requests by name, student, or hash..."
                                        value={projReqSearch}
                                        onChange={(e) => {
                                            setProjReqSearch(e.target.value);
                                            setPageProjReq(1);
                                        }}
                                        className="w-full sm:w-80 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                                    />
                                </div>

                                {filteredProjReqs.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                        No pending student GitHub project verifications awaiting review.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginatedProjReqs.map((proj) => {
                                            const isProc = processingId === proj._id;
                                            return (
                                                <div
                                                    key={proj._id}
                                                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-bold text-[#191919] text-sm">
                                                                {proj.projectName || "Untitled Project"}
                                                            </h4>
                                                            {proj.projectType && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]">
                                                                    {proj.projectType}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[#666666] mt-0.5">
                                                            Student: <strong className="text-[#191919]">{proj.student?.name || "Student"}</strong>
                                                            {proj.student?.usn && ` (${proj.student.usn})`}
                                                        </p>
                                                        <p className="text-[11px] font-mono text-[#888888] mt-1 break-all">
                                                            Hash: {proj.githubHash || "—"}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                                        {proj.githubLink && (
                                                            <a
                                                                href={proj.githubLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs"
                                                            >
                                                                GitHub ↗
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            disabled={isProc}
                                                            onClick={() => handleApproveProj(proj)}
                                                            className="px-3.5 py-1.5 rounded-md bg-[#16805D] text-white hover:bg-[#137352] font-semibold text-xs transition shadow-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            {isProc ? "…" : "Approve"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isProc}
                                                            onClick={() => handleRejectProj(proj)}
                                                            className="px-3 py-1.5 rounded-md border border-[#C5221F]/40 bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs cursor-pointer disabled:opacity-50"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <PaginationBar
                                    currentPage={pageProjReq}
                                    totalPages={totalPagesProjReqs}
                                    totalItems={filteredProjReqs.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setPageProjReq}
                                />
                            </div>
                        )}

                        {/* SUB-TAB 3: Request History */}
                        {requestSubTab === "history" && (
                            <div>
                                <div className="mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search history by name, student, or status..."
                                        value={historySearch}
                                        onChange={(e) => {
                                            setHistorySearch(e.target.value);
                                            setPageHistory(1);
                                        }}
                                        className="w-full sm:w-80 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                                    />
                                </div>

                                {filteredHistory.length === 0 ? (
                                    <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                        No past verification history recorded yet.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {paginatedHistory.map((item) => {
                                            const isApproved = item.status === "Approved" || item.status === "APPROVED";
                                            return (
                                                <div
                                                    key={item._id}
                                                    className="p-3.5 rounded-lg border border-[#D9E1E8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                                >
                                                    <div>
                                                        <p className="font-bold text-[#191919]">
                                                            {item.certificateName || item.certificate?.certificateName || item.project?.projectName || "Verification Request"}
                                                        </p>
                                                        <p className="text-[#666666] mt-0.5">
                                                            Student: {item.student?.name || "Student"} · Type: {item.requestType || "Request"}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border ${
                                                                isApproved
                                                                    ? "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20"
                                                                    : "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20"
                                                            }`}
                                                        >
                                                            {item.status || "Completed"}
                                                        </span>
                                                        {item.actionTxHash && (
                                                            <a
                                                                href={`https://sepolia.etherscan.io/tx/${item.actionTxHash}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-[#0A66C2] hover:underline font-mono text-[11px]"
                                                            >
                                                                Tx ↗
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                <PaginationBar
                                    currentPage={pageHistory}
                                    totalPages={totalPagesHistory}
                                    totalItems={filteredHistory.length}
                                    itemsPerPage={ITEMS_PER_PAGE}
                                    onPageChange={setPageHistory}
                                />
                            </div>
                        )}

                        {/* Inline Action Message */}
                        {actionMessage.text && (
                            <div
                                className={`mt-4 p-2.5 rounded-md text-xs font-medium ${
                                    actionMessage.type === "success"
                                        ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                                        : actionMessage.type === "error"
                                        ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                                        : "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20"
                                }`}
                            >
                                {actionMessage.text}
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 3: JOBS SECTION (MY JOBS & POST JOBS)
                ══════════════════════════════════════════════════════════════════ */}
                {!loading && mainSection === "jobs" && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#D9E1E8]">
                            <div>
                                <h2 className="text-base font-bold text-[#191919]">
                                    Organisation Job Postings
                                </h2>
                                <p className="text-xs text-[#666666] mt-0.5">
                                    Manage active recruitment listings and review verified candidate applications.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    to="/organisation/create-job"
                                    className="px-3.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs flex items-center gap-1"
                                >
                                    <span>➕ Post a Job</span>
                                </Link>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search posted jobs by title, location, or type..."
                                value={jobsSearch}
                                onChange={(e) => {
                                    setJobsSearch(e.target.value);
                                    setPageJobs(1);
                                }}
                                className="w-full sm:w-80 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                            />
                        </div>

                        {filteredJobs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                No job postings created yet. Click &quot;Post a Job&quot; to hire verified candidates.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedJobs.map((job) => (
                                    <div
                                        key={job._id}
                                        className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/organisation/jobs/${job._id}`}
                                                    className="font-bold text-[#191919] text-sm hover:text-[#0A66C2] hover:underline transition cursor-pointer"
                                                >
                                                    {job.title || job.jobTitle || "Job Listing"}
                                                </Link>
                                                {job.employmentType && (
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20">
                                                        {job.employmentType}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[#666666] mt-1">
                                                📍 {job.location || "Remote"} · {job.stipend || job.salary ? `₹${job.stipend || job.salary}` : "Competitive"}
                                                {job.createdAt && ` · Posted: ${new Date(job.createdAt).toLocaleDateString()}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F3F6F8] text-[#191919] border border-[#D9E1E8]">
                                                👥 {job.applicantCount || 0} Applicants
                                            </span>

                                            <Link
                                                to={`/organisation/jobs/${job._id}/applications`}
                                                className="px-3.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs"
                                            >
                                                View Applicants →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
                        <PaginationBar
                            currentPage={pageJobs}
                            totalPages={totalPagesJobs}
                            totalItems={filteredJobs.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setPageJobs}
                        />
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════════
                    SECTION 4: EMPLOYEES SECTION
                ══════════════════════════════════════════════════════════════════ */}
                {!loading && mainSection === "employees" && (
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-[#D9E1E8]">
                            <div>
                                <h2 className="text-base font-bold text-[#191919]">
                                    Organisation Workforce
                                </h2>
                                <p className="text-xs text-[#666666] mt-0.5">
                                    Employees hired through verified SkillSync employment offers.
                                </p>
                            </div>

                            <Link
                                to="/organisation/employees"
                                className="px-3.5 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs"
                            >
                                Full Workforce Directory →
                            </Link>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search employees by name, role, email, or status..."
                                value={employeeSearch}
                                onChange={(e) => {
                                    setEmployeeSearch(e.target.value);
                                    setPageEmployees(1);
                                }}
                                className="w-full sm:w-80 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-1.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                            />
                        </div>

                        {filteredEmployees.length === 0 ? (
                            <div className="p-8 text-center text-xs text-[#666666] border border-dashed border-[#D9E1E8] rounded-lg">
                                No employee records found. Hired candidates will appear here automatically upon offer acceptance.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {paginatedEmployees.map((emp) => {
                                    const student = emp.student || {};
                                    const job = emp.job || {};
                                    const isActive = emp.status === "Active";
                                    const isProc = processingId === (emp._id || emp.offerId);

                                    return (
                                        <div
                                            key={emp._id}
                                            className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0A66C2] text-white font-bold text-xs">
                                                    {student.name ? student.name.charAt(0).toUpperCase() : "E"}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-[#191919] text-sm">
                                                            {student.name || "Employee"}
                                                        </h3>
                                                        <span
                                                            className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                                                                isActive
                                                                    ? "bg-[#E6F4EA] text-[#16805D] border-[#16805D]/20"
                                                                    : "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/20"
                                                            }`}
                                                        >
                                                            {emp.status || "Active"}
                                                        </span>
                                                    </div>
                                                    <p className="text-[#666666] mt-0.5">
                                                        Role: <strong className="text-[#191919]">{job.title || "Software Engineer"}</strong>
                                                        {student.email && ` · ${student.email}`}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-[#888888] mt-0.5">
                                                        Offer ID: #{emp.offerId}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                                                {isActive && (
                                                    <button
                                                        type="button"
                                                        disabled={isProc}
                                                        onClick={() => handleTerminateEmp(emp)}
                                                        className="px-3 py-1.5 rounded-md border border-[#C5221F]/40 bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isProc ? "Terminating…" : "Terminate"}
                                                    </button>
                                                )}
                                                <Link
                                                    to="/organisation/employees"
                                                    className="px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] font-semibold text-xs"
                                                >
                                                    Details →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        <PaginationBar
                            currentPage={pageEmployees}
                            totalPages={totalPagesEmployees}
                            totalItems={filteredEmployees.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setPageEmployees}
                        />

                        {/* Action Message */}
                        {actionMessage.text && (
                            <div
                                className={`mt-4 p-2.5 rounded-md text-xs font-medium ${
                                    actionMessage.type === "success"
                                        ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                                        : actionMessage.type === "error"
                                        ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                                        : "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20"
                                }`}
                            >
                                {actionMessage.text}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganisationDashboard;