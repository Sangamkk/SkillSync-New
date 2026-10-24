import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getStudentProjects } from "../../services/projectService";
import { getVerifiedOrganisations } from "../../services/organisationService";
import {
  createProjectVerificationRequest,
  getMyRequests,
  cancelRequest,
} from "../../services/verificationService";

const STATUS_BADGE = {
  PENDING: "bg-[#FEF7E0] text-[#B06000] border-[#B06000]/30",
  APPROVED: "bg-[#E6F4EA] text-[#137333] border-[#137333]/30",
  VERIFIED: "bg-[#E6F4EA] text-[#137333] border-[#137333]/30",
  REJECTED: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30",
  CANCELLED: "bg-[#F1F3F4] text-[#5F6368] border-[#5F6368]/30",
  EXPIRED: "bg-[#FCE8E6] text-[#C5221F] border-[#C5221F]/30",
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "—";

const truncateHash = (h) => (!h ? "—" : h.length > 20 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h);

const RequestVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get("projectId") || "");
  const [selectedOrgForProject, setSelectedOrgForProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const pId = searchParams.get("projectId");
    if (pId) setSelectedProjectId(pId);
  }, [searchParams]);

  const loadAll = async () => {
    setFetching(true);
    try {
      const [projRes, orgsRes, reqRes] = await Promise.allSettled([
        getStudentProjects(),
        getVerifiedOrganisations(),
        getMyRequests(),
      ]);

      const projRaw = projRes.status === "fulfilled" ? projRes.value?.projects ?? projRes.value ?? [] : [];
      setProjects(Array.isArray(projRaw) ? projRaw : []);

      const orgsRaw = orgsRes.status === "fulfilled" ? orgsRes.value ?? [] : [];
      setOrganisations(Array.isArray(orgsRaw) ? orgsRaw : []);

      const reqRaw = reqRes.status === "fulfilled" ? reqRes.value?.requests ?? reqRes.value ?? [] : [];
      const allRequests = Array.isArray(reqRaw) ? reqRaw : [];
      // Filter to project verification requests only
      setMyRequests(allRequests.filter((r) => r.requestType === "project" || r.project));
    } catch (err) {
      console.error("RequestVerification load error:", err);
    } finally {
      setFetching(false);
    }
  };

  const selectedProjectObj = projects.find((p) => String(p._id) === String(selectedProjectId));

  const handleProjectRequest = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedOrgForProject) {
      setStatusMsg({ type: "error", text: "Please select both a project and a verifying organisation." });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      await createProjectVerificationRequest({
        projectId: selectedProjectId,
        organisationId: selectedOrgForProject,
      });
      setStatusMsg({
        type: "success",
        text: "✓ Project verification request submitted successfully on-chain! Reviewing organisation will inspect your repository.",
      });
      setSelectedOrgForProject("");
      loadAll();
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Project verification request failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this verification request?")) return;
    setCancellingId(requestId);
    try {
      await cancelRequest(requestId);
      setStatusMsg({ type: "success", text: "Verification request cancelled." });
      loadAll();
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to cancel request.",
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D9E1E8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/student/dashboard" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#191919]">
                Skill<span className="text-[#0A66C2]">Sync</span>
              </span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#666666]">
              <span>/</span>
              <Link to="/student/dashboard?section=verify&tab=project-verify" className="hover:text-[#0A66C2] transition">
                Verifications
              </Link>
              <span>/</span>
              <span className="font-semibold text-[#191919]">Project Verification</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer shadow-xs"
            >
              ← Back
            </button>
            <Link
              to="/student/projects"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition shadow-xs"
            >
              📁 My Projects
            </Link>
            <Link
              to="/student/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs"
            >
              👤 Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EBF3FB] text-[#0A66C2] text-[11px] font-semibold mb-2">
            <span>🛡️</span> Blockchain Attestation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
            Request Project Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#666666] mt-1 max-w-2xl">
            Submit your project repository and commits to an approved partner organisation for on-chain cryptographic attestation.
          </p>
        </div>

        {/* Status Message */}
        {statusMsg.text && (
          <div
            className={`mb-6 p-4 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs ${
              statusMsg.type === "success"
                ? "bg-[#E6F4EA] border-[#137333]/30 text-[#137333]"
                : "bg-[#FCE8E6] border-[#C5221F]/30 text-[#C5221F]"
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              type="button"
              onClick={() => setStatusMsg({ type: "", text: "" })}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-1.5 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Verification Request Form Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#D9E1E8]">
            <div>
              <h2 className="text-base font-bold text-[#191919]">New Project Verification Request</h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Choose a project from your portfolio and select an approved reviewing organisation.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8]">
              Step 1 of 1
            </span>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center gap-2 py-12 text-[#666666] text-xs">
              <span className="w-5 h-5 border-2 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
              Loading your portfolio data…
            </div>
          ) : (
            <form onSubmit={handleProjectRequest} className="space-y-5">
              {/* Project Select */}
              <div>
                <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1.5">
                  Select Project *
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none transition shadow-2xs"
                >
                  <option value="">-- Choose a project from your portfolio --</option>
                  {projects.map((p) => {
                    const statusStr = (p.status || "PENDING").toUpperCase();
                    return (
                      <option key={p._id} value={p._id}>
                        {p.projectName} ({p.projectType || "Project"}) — [{statusStr}]
                      </option>
                    );
                  })}
                </select>

                {projects.length === 0 && (
                  <p className="text-xs text-[#B06000] mt-1.5">
                    No projects found in your portfolio.{" "}
                    <Link to="/student/project/add" className="font-semibold underline hover:text-[#0A66C2]">
                      Add a project first →
                    </Link>
                  </p>
                )}

                {/* Selected Project Preview Card */}
                {selectedProjectObj && (
                  <div className="mt-3 p-3.5 rounded-lg border border-[#D9E1E8] bg-[#F9FAFB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base">📁</span>
                        <strong className="text-sm font-bold text-[#191919] truncate">
                          {selectedProjectObj.projectName}
                        </strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-[#D9E1E8] text-[#666666]">
                          {selectedProjectObj.projectType || "Project"}
                        </span>
                      </div>
                      {selectedProjectObj.githubLink && (
                        <p className="text-xs text-[#666666] mt-1 flex items-center gap-1 truncate">
                          <span>🔗 GitHub:</span>
                          <a
                            href={selectedProjectObj.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0A66C2] hover:underline truncate"
                          >
                            {selectedProjectObj.githubLink}
                          </a>
                        </p>
                      )}
                      {selectedProjectObj.description && (
                        <p className="text-[11px] text-[#666666] line-clamp-1 mt-0.5 italic">
                          &quot;{selectedProjectObj.description}&quot;
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-1 rounded text-[11px] font-bold border ${
                        STATUS_BADGE[String(selectedProjectObj.status || "").toUpperCase()] || STATUS_BADGE.PENDING
                      }`}
                    >
                      {String(selectedProjectObj.status || "PENDING").toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Organisation Select */}
              <div>
                <label className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1.5">
                  Select Verifying Organisation *
                </label>
                <select
                  value={selectedOrgForProject}
                  onChange={(e) => setSelectedOrgForProject(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2.5 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none transition shadow-2xs"
                >
                  <option value="">-- Choose verified partner organisation --</option>
                  {organisations.map((org) => {
                    const name = org.organisationName || org.name || "Unnamed Organisation";
                    const type = org.organisationType || (org.website ? org.website.replace(/^https?:\/\//, "") : "Organisation");
                    return (
                      <option key={org._id || org.organisationId} value={org._id || org.organisationId}>
                        {name} ({type})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-[#666666] mt-1.5">
                  Only accredited partner organisations can sign verification requests onto the Ethereum blockchain.
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading || !selectedProjectId || !selectedOrgForProject}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-[#0A66C2] text-white hover:bg-[#004182] font-semibold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Request On-Chain…
                    </>
                  ) : (
                    <>
                      <span>🛡️</span> Submit Project Verification Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Verification Request History */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#D9E1E8]">
            <h2 className="text-sm font-bold text-[#191919] flex items-center gap-2">
              <span>📋</span> My Project Verification Requests ({myRequests.length})
            </h2>
            <button
              type="button"
              onClick={loadAll}
              className="text-xs text-[#0A66C2] hover:underline font-semibold cursor-pointer"
            >
              ↻ Refresh
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#D9E1E8] p-8 text-center text-xs text-[#666666]">
              <p className="font-medium text-[#191919] mb-1">No project verification requests yet</p>
              <p>Select an unverified project above and submit it to an approved organisation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => {
                const statusStr = String(req.status || "PENDING").toUpperCase();
                const badgeClass = STATUS_BADGE[statusStr] || STATUS_BADGE.PENDING;
                const orgName = req.organisation?.organisationName || req.organisation?.name || req.organisationName || "Organisation";
                const projName = req.project?.projectName || req.projectName || "Project Verification";
                const txHash = req.actionTxHash || req.createTxHash || req.transactionHash || req.txHash;

                return (
                  <div
                    key={req._id || req.id}
                    className="p-4 rounded-lg border border-[#D9E1E8] bg-white hover:border-[#0A66C2]/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-[#191919] truncate">{projName}</strong>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                          {statusStr}
                        </span>
                      </div>

                      <p className="text-[#666666]">
                        Reviewing Organisation: <strong className="text-[#191919]">{orgName}</strong>
                        {req.createdAt && ` · Requested: ${formatDate(req.createdAt)}`}
                      </p>

                      {txHash && (
                        <p className="text-[11px] font-mono text-[#666666] flex items-center gap-1 truncate">
                          <span>⛓️ Tx:</span>
                          <span className="bg-[#F3F6F8] px-1.5 py-0.5 rounded border border-[#D9E1E8] text-[#191919]">
                            {truncateHash(txHash)}
                          </span>
                        </p>
                      )}

                      {req.rejectionReason && (
                        <p className="text-xs text-[#C5221F] bg-[#FCE8E6] px-2 py-1 rounded border border-[#C5221F]/20">
                          Rejection Reason: {req.rejectionReason}
                        </p>
                      )}

                      {req.updatedAt && statusStr !== "PENDING" && (
                        <p className="text-[11px] text-[#888888]">
                          Processed: {formatDate(req.updatedAt)}
                        </p>
                      )}
                    </div>

                    {statusStr === "PENDING" && (
                      <button
                        type="button"
                        disabled={cancellingId === req._id}
                        onClick={() => handleCancel(req._id)}
                        className="self-start sm:self-auto px-3 py-1.5 rounded-md border border-[#D9E1E8] bg-white text-[#C5221F] hover:bg-[#FCE8E6] font-semibold text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === req._id ? "Cancelling…" : "Cancel Request"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default RequestVerification;
