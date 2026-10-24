import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { getStudentProjects } from "../../../services/projectService";
import { getMyRequests } from "../../../services/verificationService";
import MeshBackground from "../../../components/common/MeshBackground";


/* =========================================================
   HELPERS
========================================================= */

const normalizeToArray = (value) => {
    if (value == null) return [];
    if (Array.isArray(value)) { return value; }
    if (typeof value === "object") {
        if (Array.isArray(value.projects)) {
            return value.projects;
        }
        if (Array.isArray(value.projectHashes)) {
            return value.projectHashes;
        }
        if (Array.isArray(value.data)) {
            return value.data;
        }
        if (Array.isArray(value.items)) {
            return value.items;
        }
        if (Array.isArray(value.results)) {
            return value.results;
        }
        if (typeof value[Symbol.iterator] === "function") {
            return Array.from(value);
        }
        return [];
    }

    return [];
};

const normalizeHash = (value) => {
    if (!value) { return ""; }
    const text = String(value).toLowerCase();
    return text.startsWith("0x") ? text : `0x${text}`;
};

const formatHash = (value) => {
    if (!value) { return "—"; }
    const hash = normalizeHash(value);
    if (hash.length <= 20) { return hash; }
    return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
};


const formatWallet = (value) => {
    if (!value) { return "—"; }
    const wallet = String(value);
    if (wallet.length <= 16) { return wallet; }
    return `${wallet.slice(0, 8)}...${wallet.slice(-6)}`;
};

const formatDate = (value) => {
    if (!value) { return "—"; }
    if (typeof value === "number" || (!isNaN(Number(value)) && !isNaN(parseFloat(value)) && String(value).trim() !== "" && !String(value).includes("-") && !String(value).includes("T"))) {
        const timestamp = Number(value);
        const milliseconds = timestamp < 100000000000 ? timestamp * 1000 : timestamp;
        return new Date(milliseconds).toLocaleString();
    }
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
        return date.toLocaleString();
    }
    return "—";
};

/* =========================================================
   PROJECT STATUS
========================================================= */

const getProjectCategory = (project) => {
    // Rejected gets highest priority.
    if (String(project.status || "").toUpperCase() === "REJECTED") { return "REJECTED"; }
    // Verified
    if (project.isVerified || String(project.status || "").toUpperCase() === "APPROVED") {
        return "VERIFIED";
    }
    // Pending verification
    if (String(project.status || "").toUpperCase() === "PENDING" && (project.verificationHistory?.length > 0 || project.requests?.length > 0)) {
        return "PENDING";
    }
    // Regular showcase project
    return "PROJECT";
};

/* =========================================================
   STATUS UI
========================================================= */

const statusConfig = {
    ALL: {
        label: "All",
        icon: "📂"
    },
    VERIFIED: {
        label: "Verified",
        icon: "✓"
    },
    PENDING: {
        label: "Pending",
        icon: "⏳"
    },
    PROJECT: {
        label: "Projects",
        icon: "💻"
    },
    REJECTED: {
        label: "Rejected",
        icon: "✕"
    }
};

/* =========================================================
   PROJECT CARD
========================================================= */

const ProjectCard = ({ project, darkMode }) => {

    const category = getProjectCategory(project) || "PROJECT";

    const statusStyles = {
        VERIFIED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        PROJECT: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        REJECTED: "bg-red-500/10 text-red-400 border-red-500/20"
    };

    const currentConfig = statusConfig[category] || statusConfig.PROJECT;

    return (
        <div
            className={`rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 ${darkMode
                    ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                    : "border-slate-200 bg-white/90 shadow-sm hover:shadow-md"
                }`}
        >
            {/* =========================================
                HEADER
            ========================================= */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h2
                        className={`text-xl font-bold ${darkMode
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                    >
                        {project.projectName || "Untitled Project"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {project.projectType || "Project"}
                    </p>
                </div>
                <span
                    className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${statusStyles[category] || statusStyles.NOT_REGISTERED
                        }`}
                >
                    <span>
                        {currentConfig.icon}
                    </span>

                    {currentConfig.label}
                </span>
            </div>
            {/* =========================================
                DESCRIPTION
            ========================================= */}
            {project.description && (
                <div className="mt-5">
                    <p
                        className={`text-sm leading-6 ${darkMode
                                ? "text-slate-400"
                                : "text-slate-600"
                            }`}
                    >
                        {project.description}
                    </p>
                </div>
            )}
            {project.rejectionReason && (
                <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    <span className="font-semibold">Rejection Reason:</span> {project.rejectionReason}
                </div>
            )}
            {/* =========================================
                PROJECT INFORMATION
            ========================================= */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div
                    className={`rounded-2xl p-4 ${darkMode
                            ? "bg-white/[0.035]"
                            : "bg-slate-50"
                        }`}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        GitHub Repository
                    </p>
                    {project.githubLink ? (
                        <a
                            href={project.githubLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 block break-all text-sm font-medium text-blue-500 hover:underline"
                        >
                            {project.githubLink}
                        </a>
                    ) : (
                        <p className="mt-2 text-sm text-slate-400">
                            —
                        </p>
                    )}
                </div>
                <div
                    className={`rounded-2xl p-4 ${darkMode
                            ? "bg-white/[0.035]"
                            : "bg-slate-50"
                        }`}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Project Hash
                    </p>
                    <p
                        className={`mt-2 break-all font-mono text-xs ${darkMode
                                ? "text-slate-300"
                                : "text-slate-600"
                            }`}
                    >
                        {formatHash(project.githubHash)}
                    </p>
                </div>
            </div>
            {/* =========================================
                STATUS & VERIFICATION INFORMATION
            ========================================= */}
            <div
                className={`mt-3 grid gap-3 sm:grid-cols-2`}
            >
                <div
                    className={`rounded-2xl p-4 ${darkMode
                            ? "bg-white/[0.035]"
                            : "bg-slate-50"
                        }`}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Status
                    </p>
                    <p
                        className={`mt-2 text-sm font-semibold ${
                            project.isVerified
                                ? "text-emerald-500"
                                : project.status === "REJECTED"
                                ? "text-red-500"
                                : project.status === "PENDING" && (project.verificationHistory?.length > 0 || project.requests?.length > 0)
                                ? "text-amber-500"
                                : "text-blue-400"
                        }`}
                    >
                        {project.isVerified
                            ? "Verified"
                            : project.status === "REJECTED"
                            ? "Rejected"
                            : project.status === "PENDING" && (project.verificationHistory?.length > 0 || project.requests?.length > 0)
                            ? "Pending Verification"
                            : "Showcase Project"}
                    </p>
                </div>
                <div
                    className={`rounded-2xl p-4 ${darkMode
                            ? "bg-white/[0.035]"
                            : "bg-slate-50"
                        }`}
                >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Verification
                    </p>
                    <p
                        className={`mt-2 text-sm font-semibold ${project.isVerified
                                ? "text-emerald-500"
                                : "text-slate-400"
                            }`}
                    >
                        {project.isVerified
                            ? "Verified by Organisation"
                            : "Self-Reported / Showcase"}
                    </p>
                </div>
            </div>
            {project.txHash && (
                <div className={`mt-3 rounded-2xl p-4 ${darkMode ? "bg-white/[0.035]" : "bg-slate-50"}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Transaction Hash</p>
                    <p className={`mt-1 break-all font-mono text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        {project.txHash}
                    </p>
                </div>
            )}
            {/* =========================================
                VERIFICATION HISTORY
            ========================================= */}
            {project.verificationHistory?.length > 0 && (
                <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Verification History
                    </p>
                    <div className="space-y-2">
                        {project.verificationHistory.map(
                            (entry, index) => {
                                const st = String(entry.status || "").toUpperCase();
                                return (
                                    <div
                                        key={`${project.hash || project._id || index}-${index}`}
                                        className={`rounded-2xl border p-4 ${darkMode
                                                ? "border-white/10 bg-black/10"
                                                : "border-slate-200 bg-slate-50"
                                            }`}
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                    st === "VERIFIED" || st === "APPROVED"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : st === "REJECTED" || st === "REVOKED"
                                                            ? "bg-red-500/10 text-red-500"
                                                            : st === "PENDING"
                                                                ? "bg-amber-500/10 text-amber-500"
                                                                : "bg-slate-500/10 text-slate-500"
                                                }`}
                                            >
                                                {entry.status || "UNKNOWN"}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {formatDate(
                                                    entry.verifiedAt ||
                                                    entry.createdAt
                                                )}
                                            </span>
                                        </div>
                                        {entry.verifierOrganisation && (
                                            <p className="mt-3 text-xs text-slate-500">
                                                Verifier:{" "}
                                                <span className="font-semibold">
                                                    {entry.verifierOrganisation}
                                                </span>
                                            </p>
                                        )}
                                        {entry.reason && (
                                            <p className="mt-2 text-xs text-red-400">
                                                <span className="font-semibold">Reason:</span> {entry.reason}
                                            </p>
                                        )}
                                        {entry.verifier && entry.verifier !== entry.verifierOrganisation && (
                                            <p className="mt-1 font-mono text-xs text-slate-500">
                                                Identifier:{" "}
                                                {formatWallet(
                                                    entry.verifier
                                                )}
                                            </p>
                                        )}
                                    </div>
                                );
                            }
                        )}

                    </div>

                </div>

            )}


            {/* =========================================
                CREATED DATE
            ========================================= */}

            {project.createdAt && (

                <div className="mt-5 border-t border-slate-500/10 pt-4">

                    <p className="text-xs text-slate-500">
                        Project created:{" "}
                        {formatDate(project.createdAt)}
                    </p>

                </div>

            )}

        </div>
    );
};


/* =========================================================
   MAIN PAGE
========================================================= */

const ProjectHistory = () => {
    const navigate = useNavigate();
    const { currentUser: user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedSection, setSelectedSection] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [darkMode] = useState(
        () =>
            localStorage.getItem("skillsync-theme") !==
            "light"
    );

    /* =====================================================
       FETCH PROJECTS
    ===================================================== */
    useEffect(() => {
        fetchProjectHistory();
    }, []);

    const fetchProjectHistory = async () => {
        try {
            setLoading(true);
            setError("");

            const [rawProjects, rawRequests] = await Promise.all([
                getStudentProjects().catch((err) => {
                    console.error("getStudentProjects error:", err);
                    return [];
                }),
                getMyRequests().catch(() => [])
            ]);

            const list = normalizeToArray(rawProjects);
            const requests = Array.isArray(rawRequests) ? rawRequests : [];

            const enriched = list.map((project) => {
                const projId = project._id?.toString();
                const projHash = (project.githubHash || project.projectHash || "").toLowerCase();

                // Find matching verification requests from student's verification requests
                const matchingRequests = requests.filter((r) => {
                    const reqProjId = (r.project?._id || r.project)?.toString();
                    const reqHash = (r.credentialHash || r.githubHash || "").toLowerCase();
                    return (projId && reqProjId === projId) || (projHash && reqHash === projHash);
                });

                const formattedMatchingHistory = matchingRequests.map((req) => ({
                    requestId: req.blockchainRequestId || req._id,
                    status: (req.status || "Pending").toUpperCase(),
                    verifierOrganisation: req.organisation?.organisationName || req.expectedVerifier || "Organisation",
                    verifier: req.organisation?.walletAddress || req.organisation?.organisationName || req.expectedVerifier,
                    createdAt: req.createdAt,
                    verifiedAt: req.updatedAt,
                    reason: req.rejectionReason || "",
                }));

                const combinedHistory = [
                    ...(project.verificationHistory || []),
                    ...formattedMatchingHistory.filter((mh) =>
                        !(project.verificationHistory || []).some((vh) =>
                            String(vh.requestId || "") === String(mh.requestId || "")
                        )
                    )
                ];

                const isVerified = Boolean(
                    project.isVerified ||
                    project.status === "APPROVED" ||
                    combinedHistory.some(
                        (h) => String(h.status || "").toUpperCase() === "APPROVED" || String(h.status || "").toUpperCase() === "VERIFIED"
                    )
                );
                const onChainRegistered = Boolean(
                    project.onChainRegistered ||
                    project.txHash ||
                    isVerified
                );

                return {
                    ...project,
                    projectName: project.projectName || "Project",
                    projectType: project.projectType || "Project",
                    githubHash: project.githubHash || project.projectHash || "",
                    hash: project.githubHash || project.projectHash || "",
                    onChainRegistered,
                    isVerified,
                    verificationHistory: combinedHistory
                };
            });

            setProjects(enriched);
        } catch (err) {
            console.error("Project history fetch error:", err);
            setError(err?.message || "Failed to load project history.");
        } finally {
            setLoading(false);
        }
    };


    /* =====================================================
       COUNTS
    ===================================================== */

    const counts = useMemo(() => {
        const result = {
            ALL: projects.length,
            VERIFIED: 0,
            PENDING: 0,
            PROJECT: 0,
            REJECTED: 0
        };

        projects.forEach((project) => {
            const category = getProjectCategory(project);
            if (result[category] !== undefined) {
                result[category]++;
            } else {
                result.PROJECT++;
            }
        });

        return result;
    }, [projects]);


    /* =====================================================
       FILTER
    ===================================================== */

    const filteredProjects = useMemo(() => {

        if (selectedSection === "ALL") {

            return projects;

        }


        return projects.filter(
            (project) =>
                getProjectCategory(project) ===
                selectedSection
        );

    }, [
        projects,
        selectedSection
    ]);


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div
            className={`relative min-h-screen overflow-hidden px-6 py-10 transition-colors duration-500 ${darkMode
                    ? "bg-[#070B14] text-white"
                    : "bg-[#F6F8FC] text-slate-900"
                }`}
        >

            <MeshBackground
                darkMode={darkMode}
            />


            {/* Background glow */}

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
                                ? "border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shadow-sm"
                        }`}
                    >
                        <span>👤</span> Profile Dashboard
                    </Link>
                </div>

                {/* =================================================
                    HEADER
                ================================================= */}

                <div
                    className={`mb-6 rounded-3xl border p-7 backdrop-blur-xl ${darkMode
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200 bg-white/85 shadow-sm"
                        }`}
                >

                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

                        <div>

                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                                Student Dashboard
                            </p>

                            <h1
                                className={`mt-2 text-3xl font-bold tracking-tight ${darkMode
                                        ? "text-white"
                                        : "text-slate-900"
                                    }`}
                            >
                                Project History
                            </h1>

                            <p className="mt-2 text-sm text-slate-500">
                                Track the verification and showcase status of your projects.
                            </p>

                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border transition cursor-pointer ${
                                    darkMode
                                        ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-sm"
                                }`}
                            >
                                ← Back
                            </button>
                            <Link
                                to="/student/dashboard"
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/20"
                            >
                                <span>👤</span> Profile Dashboard
                            </Link>
                        </div>

                    </div>

                </div>


                {/* =================================================
                    USER INFO
                ================================================= */}

                <div
                    className={`mb-6 rounded-2xl border px-5 py-4 ${darkMode
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200 bg-white shadow-sm"
                        }`}
                >

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">

                        <div>

                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                Student
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                                {user?.name || "Student"}
                            </p>

                        </div>


                        <div>

                            <p className="text-[10px] uppercase tracking-wider text-slate-500">
                                Wallet
                            </p>

                            <p className="mt-1 font-mono text-xs text-slate-500">
                                {user?.walletAddress
                                    ? formatWallet(
                                        user.walletAddress
                                    )
                                    : "—"}
                            </p>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    STATUS TABS
                ================================================= */}

                <div
                    className={`mb-6 rounded-3xl border p-3 backdrop-blur-xl ${darkMode
                            ? "border-white/10 bg-white/[0.04]"
                            : "border-slate-200 bg-white/85 shadow-sm"
                        }`}
                >

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">

                        {Object.entries(statusConfig).map(
                            ([key, config]) => {

                                const active =
                                    selectedSection === key;

                                return (

                                    <button
                                        key={key}
                                        onClick={() =>
                                            setSelectedSection(
                                                key
                                            )
                                        }
                                        className={`rounded-2xl px-3 py-3 text-left transition-all duration-200 ${active
                                                ? darkMode
                                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                    : "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : darkMode
                                                    ? "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                    >

                                        <div className="flex items-center justify-between gap-2">

                                            <span className="text-sm font-semibold">
                                                {config.icon}{" "}
                                                {config.label}
                                            </span>

                                            <span
                                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active
                                                        ? "bg-white/20 text-white"
                                                        : darkMode
                                                            ? "bg-white/10 text-slate-400"
                                                            : "bg-slate-100 text-slate-500"
                                                    }`}
                                            >
                                                {counts[key]}
                                            </span>

                                        </div>

                                    </button>

                                );

                            }
                        )}

                    </div>

                </div>


                {/* =================================================
                    LOADING
                ================================================= */}

                {loading && (

                    <div
                        className={`rounded-3xl border p-12 text-center ${darkMode
                                ? "border-white/10 bg-white/[0.04]"
                                : "border-slate-200 bg-white shadow-sm"
                            }`}
                    >

                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />

                        <p className="mt-4 text-sm text-slate-500">
                            Loading project history...
                        </p>

                    </div>

                )}


                {/* =================================================
                    ERROR
                ================================================= */}

                {!loading && error && (

                    <div
                        className={`rounded-3xl border p-8 ${darkMode
                                ? "border-red-500/20 bg-red-500/[0.05]"
                                : "border-red-200 bg-red-50"
                            }`}
                    >

                        <p className="text-sm font-semibold text-red-500">
                            Failed to load project history
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                            {error}
                        </p>

                    </div>

                )}


                {/* =================================================
                    EMPTY
                ================================================= */}

                {!loading &&
                    !error &&
                    filteredProjects.length === 0 && (

                        <div
                            className={`rounded-3xl border p-12 text-center ${darkMode
                                    ? "border-white/10 bg-white/[0.04]"
                                    : "border-slate-200 bg-white shadow-sm"
                                }`}
                        >

                            <div className="text-4xl">
                                📂
                            </div>

                            <h2 className="mt-4 text-xl font-bold">
                                No Projects Found
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                There are no projects in the{" "}
                                <span className="font-semibold">
                                    {
                                        statusConfig[
                                            selectedSection
                                        ]?.label
                                    }
                                </span>{" "}
                                category.
                            </p>

                        </div>

                    )}


                {/* =================================================
                    PROJECT LIST
                ================================================= */}

                {!loading &&
                    !error &&
                    filteredProjects.length > 0 && (

                        <div className="space-y-5">

                            {/* Section heading */}

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-500">
                                        {
                                            statusConfig[
                                                selectedSection
                                            ]?.label
                                        }
                                    </p>

                                    <h2
                                        className={`mt-1 text-2xl font-bold ${darkMode
                                                ? "text-white"
                                                : "text-slate-900"
                                            }`}
                                    >
                                        {filteredProjects.length}{" "}
                                        {filteredProjects.length === 1
                                            ? "Project"
                                            : "Projects"}
                                    </h2>

                                </div>

                            </div>


                            {/* Cards */}

                            <div className="grid gap-5">

                                {filteredProjects.map(
                                    (project, index) => (

                                        <ProjectCard
                                            key={
                                                project.hash ||
                                                project._id ||
                                                index
                                            }
                                            project={project}
                                            darkMode={darkMode}
                                        />

                                    )
                                )}

                            </div>

                        </div>

                    )}

            </div>

        </div>
    );
};


export default ProjectHistory;