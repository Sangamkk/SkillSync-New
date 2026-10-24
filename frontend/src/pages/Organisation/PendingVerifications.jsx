import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getPendingRequests,
  approveRequest,
  rejectRequest,
} from "../../services/verificationService";
import { getCertificateDocument } from "../../services/certificateService";

const ITEMS_PER_PAGE = 6;

const PendingVerifications = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [msg, setMsg] = useState({ id: null, text: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getPendingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load pending verifications error:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req) => {
    const id = req._id || req.id;
    setProcessing(id);
    setMsg({ id, text: "Processing on-chain approval…", type: "info" });
    try {
      const result = await approveRequest(id);
      const txHash = result?.transactionHash || result?.txHash;
      setMsg({
        id,
        text: txHash ? `✓ Approved on-chain · Tx: ${txHash.slice(0, 14)}…` : "✓ Verification approved successfully.",
        type: "success",
      });
      setTimeout(() => {
        load();
        setMsg({ id: null, text: "", type: "" });
      }, 1800);
    } catch (err) {
      setMsg({ id, text: `❌ ${err.response?.data?.message || err.message}`, type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt("Reason for rejection:", "Does not meet verification criteria.");
    if (reason === null || String(reason).trim() === "") return;
    const id = req._id || req.id;
    setProcessing(id);
    setMsg({ id, text: "Processing rejection…", type: "info" });
    try {
      await rejectRequest(id, reason);
      setMsg({ id, text: "✓ Request rejected.", type: "success" });
      setTimeout(() => {
        load();
        setMsg({ id: null, text: "", type: "" });
      }, 1800);
    } catch (err) {
      setMsg({ id, text: `❌ ${err.response?.data?.message || err.message}`, type: "error" });
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDoc = async (hash) => {
    if (!hash) return;
    const w = window.open("about:blank", "_blank");
    if (!w) {
      alert("Popup blocked by browser. Please allow popups for this site.");
      return;
    }
    w.opener = null;
    try {
      const url = await getCertificateDocument(hash);
      w.location.href = url;
    } catch {
      w.close();
      alert("Unable to load document asset.");
    }
  };

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();
    return requests.filter((r) => {
      const name = (r.certificateName || r.certificate?.certificateName || "").toLowerCase();
      const student = (r.studentName || r.student?.name || "").toLowerCase();
      const hash = (r.certificateHash || r.credentialHash || "").toLowerCase();
      const type = (r.requestType || "").toLowerCase();
      return name.includes(q) || student.includes(q) || hash.includes(q) || type.includes(q);
    });
  }, [requests, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
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
            <span>Certificate Verifications</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/organisation"
              className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
            >
              Dashboard
            </Link>
            <Link
              to="/organisation/pending-projects"
              className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
            >
              Pending Projects
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
                Pending Certificate Verifications
              </h1>
              <p className="mt-1 text-xs text-[#666666]">
                Review student certificate submissions, inspect uploaded credentials, and anchor official verifications on the Ethereum blockchain.
              </p>
            </div>

            <div className="text-right sm:border-l sm:border-[#D9E1E8] sm:pl-6">
              <p className="text-3xl font-extrabold text-[#0A66C2]">{requests.length}</p>
              <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wider">Awaiting Review</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-5 pt-4 border-t border-[#D9E1E8]">
            <div className="relative w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#666666]">🔍</span>
              <input
                type="text"
                placeholder="Search by certificate name, student name, or credential hash..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] pl-9 pr-3 py-2 text-xs text-[#191919] placeholder-[#888888] focus:bg-white focus:border-[#0A66C2] focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-3 border-[#0A66C2] border-t-transparent" />
            <p className="text-xs text-[#666666]">Loading pending certificate requests…</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6F4EA] text-[#16805D] text-2xl mb-3">
              ✓
            </div>
            <h2 className="text-base font-bold text-[#191919]">No Pending Certificate Verifications</h2>
            <p className="mt-1 text-xs text-[#666666] max-w-sm mx-auto">
              All certificate verification requests directed to your organisation have been reviewed and attested.
            </p>
          </div>
        )}

        {/* Filter Empty State */}
        {!loading && requests.length > 0 && filteredRequests.length === 0 && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-10 text-center shadow-xs">
            <p className="text-xs text-[#666666]">No requests match your search criteria.</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-2 text-xs font-semibold text-[#0A66C2] hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Requests List */}
        {!loading && paginatedRequests.length > 0 && (
          <div className="space-y-4">
            {paginatedRequests.map((req) => {
              const id = req._id || req.id;
              const isProcessing = processing === id;
              const reqMsg = msg.id === id ? msg : null;
              const certHash = req.certificateHash || req.credentialHash || req.certificate?.certificateHash;
              const studentName = req.studentName || req.student?.name || "Student";

              return (
                <div
                  key={id}
                  className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2]/40 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F3FF] text-[#0A66C2] text-lg font-bold">
                        📜
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-bold text-[#191919]">
                            {req.certificateName || req.certificate?.certificateName || "Certificate Request"}
                          </h2>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20">
                            Pending Verification
                          </span>
                        </div>

                        <p className="text-xs text-[#666666] mt-1">
                          Submitted by <strong className="text-[#191919]">{studentName}</strong>
                          {req.student?.usn && <span> ({req.student.usn})</span>}
                          {req.student?.college && <span> · {req.student.college}</span>}
                        </p>

                        {certHash && (
                          <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[#666666]">
                            <span className="font-sans font-semibold text-[#191919]">Hash:</span>
                            <span className="select-all break-all">{certHash}</span>
                          </div>
                        )}

                        {req.createdAt && (
                          <p className="text-[11px] text-[#888888] mt-1">
                            Requested: {new Date(req.createdAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col gap-2 shrink-0 self-start sm:self-auto">
                      {certHash && (
                        <button
                          type="button"
                          onClick={() => handleViewDoc(certHash)}
                          className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
                        >
                          👁️ View Document
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(req)}
                        className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#16805D] text-white hover:bg-[#137352] transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {isProcessing ? "Attesting…" : "✓ Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleReject(req)}
                        className="px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#C5221F]/40 bg-white text-[#C5221F] hover:bg-[#FCE8E6] transition cursor-pointer disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {reqMsg && (
                    <div
                      className={`mt-3 p-2.5 rounded-md text-xs font-medium ${
                        reqMsg.type === "success"
                          ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                          : reqMsg.type === "error"
                          ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                          : "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/20"
                      }`}
                    >
                      {reqMsg.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && filteredRequests.length > ITEMS_PER_PAGE && (
          <div className="mt-6 flex items-center justify-between border-t border-[#D9E1E8] pt-4 text-xs text-[#666666]">
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)} of {filteredRequests.length} requests
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

export default PendingVerifications;
