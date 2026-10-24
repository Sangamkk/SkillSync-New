import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { getStudentProjects } from "../../services/projectService";
import { getVerifiedOrganisations } from "../../services/organisationService";
import {
  createProjectVerificationRequest,
  getMyRequests,
} from "../../services/verificationService";
import MeshBackground from "../../components/common/MeshBackground";

const STATUS_COLORS = {
  PENDING: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  APPROVED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  VERIFIED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border-red-400/20",
  CANCELLED: "text-gray-400 bg-gray-400/10 border-gray-400/20",
  EXPIRED: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const truncateHash = (h) => (!h ? "—" : h.length > 20 ? `${h.slice(0, 10)}…${h.slice(-8)}` : h);

const RequestVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [fetching, setFetching] = useState(true);

  // Project request form
  const [selectedProjectId, setSelectedProjectId] = useState(searchParams.get("projectId") || "");
  const [selectedOrgForProject, setSelectedOrgForProject] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
  const [darkMode] = useState(() => localStorage.getItem("skillsync-theme") !== "light");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setFetching(true);
    try {
      const [projRes, orgsRes, reqRes] = await Promise.allSettled([
        getStudentProjects(),
        getVerifiedOrganisations(),
        getMyRequests(),
      ]);

      const projRaw = projRes.value?.projects ?? projRes.value ?? [];
      setProjects(Array.isArray(projRaw) ? projRaw : []);

      const orgsRaw = orgsRes.value ?? [];
      setOrganisations(Array.isArray(orgsRaw) ? orgsRaw : []);

      const reqRaw = reqRes.value?.requests ?? reqRes.value ?? [];
      const allRequests = Array.isArray(reqRaw) ? reqRaw : [];
      // Filter to project verification requests only
      setMyRequests(allRequests.filter((r) => r.requestType === "project" || r.project));
    } catch (err) {
      console.error("RequestVerification load error:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleProjectRequest = async (e) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedOrgForProject) {
      setStatusMsg({ type: "error", text: "Please select a project and an organisation." });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: "", text: "" });
    try {
      await createProjectVerificationRequest({ projectId: selectedProjectId, organisationId: selectedOrgForProject });
      setStatusMsg({ type: "success", text: "✓ Project verification request submitted successfully." });
      setSelectedProjectId("");
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

  const base = darkMode ? "min-h-screen bg-gray-950 text-white" : "min-h-screen bg-slate-50 text-gray-900";
  const card = darkMode ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white shadow-sm";
  const inputCls = darkMode
    ? "bg-white/5 border-white/10 text-white"
    : "bg-white border-slate-200 text-gray-900";

  return (
    <div className={`relative ${base}`}>
      <MeshBackground darkMode={darkMode} />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {/* Navigation Bar: Back & Profile Dashboard */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
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
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 mb-1">Verification</p>
          <h1 className={`text-3xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>Project Verification</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Submit your project repository to an approved organisation for on-chain attestation.
          </p>
        </div>

        {/* Status message */}
        {statusMsg.text && (
          <div className={`mb-5 px-4 py-3 rounded-xl border text-sm ${
            statusMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {statusMsg.text}
          </div>
        )}

        {/* Request form */}
        <div className={`rounded-2xl border backdrop-blur-xl p-6 mb-8 ${card}`}>
          {fetching ? (
            <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
              <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Loading your data…
            </div>
          ) : (
            <form onSubmit={handleProjectRequest} className="space-y-4">
              <h2 className={`text-base font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-900"}`}>
                Project Verification Request
              </h2>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${inputCls}`}
                >
                  <option value="">— Choose a project —</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.projectName} ({p.projectType || "Project"}) · {p.status || "PENDING"}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    No projects found.{" "}
                    <Link to="/student/project/add" className="text-violet-400 hover:underline">Add a project first.</Link>
                  </p>
                )}
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Select Organisation (Verifier)</label>
                <select
                  value={selectedOrgForProject}
                  onChange={(e) => setSelectedOrgForProject(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${inputCls}`}
                >
                  <option value="">— Choose an organisation —</option>
                  {organisations.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.organisationName} ({o.organisationType})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading || !selectedProjectId || !selectedOrgForProject}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md shadow-violet-500/20"
              >
                {loading ? "Submitting…" : "Submit Project Verification Request"}
              </button>
            </form>
          )}
        </div>

        {/* My Requests History */}
        <div>
          <h2 className={`text-base font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-900"}`}>
            My Project Verification Requests
          </h2>
          {myRequests.length === 0 ? (
            <div className={`rounded-2xl border p-8 text-center ${card}`}>
              <p className={`text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>No project verification requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.map((req) => (
                <div key={req._id || req.id} className={`rounded-2xl border p-4 ${card}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {req.project?.projectName || req.projectName || "Project Verification Request"}
                      </p>
                      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                        Org: {req.organisation?.organisationName || req.organisationName || "—"}
                      </p>
                      {(req.createTxHash || req.actionTxHash || req.transactionHash) && (
                        <p className="text-xs font-mono text-violet-400 mt-1">
                          tx: {truncateHash(req.actionTxHash || req.createTxHash || req.transactionHash)}
                        </p>
                      )}
                      {req.rejectionReason && (
                        <p className="text-xs text-red-400 mt-1">Reason: {req.rejectionReason}</p>
                      )}
                      <div className="flex gap-3 mt-1.5 text-xs text-gray-500">
                        <span>Submitted: {formatDate(req.createdAt)}</span>
                        {req.updatedAt && req.status !== "Pending" && (
                          <span>Processed: {formatDate(req.updatedAt)}</span>
                        )}
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[String(req.status || "").toUpperCase()] || STATUS_COLORS.PENDING}`}>
                      {req.status || "PENDING"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestVerification;
