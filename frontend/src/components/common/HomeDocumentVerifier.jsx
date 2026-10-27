import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyDocument, verifyCertificate } from "../../services/publicVerificationService";

const OUTCOMES = {
  VALID: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    title: "Certificate Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate registered on the Ethereum blockchain.",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50/30",
  },
  DOCUMENT_VERIFIED: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    title: "Certificate Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate registered on the Ethereum blockchain.",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50/30",
  },
  NOT_FOUND: {
    badge: "✕ NOT REGISTERED",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
    title: "Certificate Not Found in Registry",
    desc: "No matching record was found in the SkillSync registry or blockchain ledger for this document.",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50/30",
  },
  REVOKED: {
    badge: "⊘ REVOKED",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    title: "Certificate Has Been Revoked",
    desc: "A matching certificate exists, but it has been officially revoked by the issuing authority.",
    borderColor: "border-rose-300",
    bgColor: "bg-rose-50/30",
  },
  EXPIRED: {
    badge: "⏰ EXPIRED",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-200",
    title: "Certificate Has Expired",
    desc: "This certificate was verified on-chain but has passed its expiration date.",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50/30",
  },
  PENDING: {
    badge: "⏳ PENDING VERIFICATION",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-200",
    title: "Verification Pending",
    desc: "This certificate is currently undergoing review and blockchain anchoring.",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50/30",
  },
  INVALID: {
    badge: "✕ INVALID DOCUMENT",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
    title: "Verification Failed",
    desc: "The uploaded document does not match any valid verified certificate.",
    borderColor: "border-rose-300",
    bgColor: "bg-rose-50/30",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

const HomeDocumentVerifier = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("file"); // "file" | "hash"
  const [file, setFile] = useState(null);
  const [hashInput, setHashInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    const isImage = selectedFile.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(selectedFile.name);

    if (!isPdf && !isImage) {
      setError("Please select a valid certificate file (PDF, PNG, JPG, or WebP).");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setFile(selectedFile);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else {
      setPreviewUrl(null);
    }
    setError("");
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleVerifyFile = async (e) => {
    if (e) e.preventDefault();
    if (!file) {
      setError("Please select a certificate file to verify.");
      return;
    }
    setLoading(true);
    setLoadingStep("Computing SHA-256 cryptographic hash...");
    setError("");
    setResult(null);

    try {
      setTimeout(() => {
        setLoadingStep("Checking Ethereum Sepolia registry...");
      }, 500);

      const formData = new FormData();
      formData.append("file", file);
      const res = await verifyDocument(formData);
      setResult(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to verify document.";
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleVerifyHash = async (e) => {
    if (e) e.preventDefault();
    const query = hashInput.trim();
    if (!query) {
      setError("Please enter a certificate SHA-256 hash or ID.");
      return;
    }
    setLoading(true);
    setLoadingStep("Querying blockchain ledger & registry...");
    setError("");
    setResult(null);

    try {
      const res = await verifyCertificate(query);
      setResult(res);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch { /* ignore */ }
    }
    setPreviewUrl(null);
    setFile(null);
    setHashInput("");
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleCopyHash = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    });
  };

  const statusKey = result?.status || result?.outcome || (result?.valid ? "VALID" : "NOT_FOUND");
  const outcome = OUTCOMES[statusKey] || (result?.valid ? OUTCOMES.VALID : OUTCOMES.NOT_FOUND);
  const cert = result?.certificate;
  const targetId = cert?.certificateHash || cert?._id || hashInput.trim();

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-[#0F172A] transition-all">
      {/* =====================================================
          HEADER & TABS
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Verify a Certificate
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Check if a document is registered and authentic on the blockchain.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="inline-flex items-center self-start sm:self-auto rounded-full p-1 bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
              setResult(null);
              setError("");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "file"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upload Document
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("hash");
              setResult(null);
              setError("");
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "hash"
                ? "bg-[#2563EB] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Enter Hash / ID
          </button>
        </div>
      </div>

      {/* =====================================================
          INPUT FORM (Upload or Hash)
      ====================================================== */}
      {!result && (
        <div className="mt-6">
          {activeTab === "file" ? (
            <form onSubmit={handleVerifyFile} className="space-y-5">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragging
                    ? "border-[#2563EB] bg-blue-50/60"
                    : file
                    ? "border-emerald-400 bg-emerald-50/20"
                    : "border-slate-200 hover:border-blue-400/80 bg-slate-50/40 hover:bg-blue-50/20"
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {file ? (
                  <div className="flex flex-col items-center">
                    {previewUrl ? (
                      <div className="relative mb-3">
                        <img
                          src={previewUrl}
                          alt="Certificate Preview"
                          className="h-28 max-w-xs object-contain rounded-xl border border-slate-200 shadow-sm bg-white p-1"
                        />
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                          IMAGE
                        </span>
                      </div>
                    ) : (
                      <div className="h-14 w-14 rounded-2xl bg-blue-100 text-[#2563EB] flex items-center justify-center mb-3 shadow-xs">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-sm font-bold text-[#0F172A] max-w-md truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to verify on blockchain
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="mt-3 text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                    >
                      Choose another file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center shadow-xs">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm sm:text-base font-bold text-[#0F172A]">
                        Drag & drop certificate here, or browse
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Supports PDF, PNG, JPG, or WebP (max 10MB)
                      </p>
                    </div>
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold bg-white text-[#2563EB] border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 shadow-2xs">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="w-full sm:flex-1 py-3 px-6 rounded-full font-semibold text-sm bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>{loadingStep || "Verifying..."}</span>
                    </>
                  ) : (
                    <span>Verify Document</span>
                  )}
                </button>

                {file && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="w-full sm:w-auto py-3 px-5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyHash} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Certificate SHA-256 Hash or Certificate ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={hashInput}
                    onChange={(e) => {
                      setHashInput(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g. 0x7995e693cabe27de93cb50ac884dd19943c479029303b62affa37b07a4f969ba"
                    className="w-full rounded-xl px-4 py-3 font-mono text-xs sm:text-sm border border-slate-200 bg-slate-50/50 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                  />
                  {hashInput && (
                    <button
                      type="button"
                      onClick={() => setHashInput("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !hashInput.trim()}
                className="w-full py-3 px-6 rounded-full font-semibold text-sm bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{loadingStep || "Checking Blockchain..."}</span>
                  </>
                ) : (
                  <span>Verify Certificate Hash</span>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* =====================================================
          VERIFICATION RESULT DISPLAY (Neat, Clean, Clear)
      ====================================================== */}
      {result && (
        <div className={`mt-6 rounded-2xl border p-6 sm:p-7 transition-all duration-200 ${outcome.borderColor} ${outcome.bgColor}`}>
          {/* Top Status Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200/80">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide ${outcome.badgeClass}`}>
                {outcome.badge}
              </span>
              <span className="text-xs text-slate-500">
                Verified at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <button
              onClick={handleReset}
              className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] hover:underline cursor-pointer"
            >
              Verify Another Document
            </button>
          </div>

          {/* Title & Description */}
          <div className="mt-4">
            <h4 className="text-xl font-bold tracking-tight text-[#0F172A]">
              {outcome.title}
            </h4>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">
              {result.message || outcome.desc}
            </p>
          </div>

          {/* Computed Hash Box */}
          {(result.computedHash || cert?.certificateHash) && (
            <div className="mt-5 rounded-xl p-3.5 bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Document SHA-256 Digest
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyHash(result.computedHash || cert?.certificateHash)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-[#2563EB] border border-slate-200 transition cursor-pointer"
                >
                  {copiedHash ? "Copied ✓" : "Copy Hash"}
                </button>
              </div>
              <p className="font-mono text-xs text-[#0F172A] break-all bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                {result.computedHash || cert?.certificateHash}
              </p>
            </div>
          )}

          {/* Certificate Found Details Card */}
          {cert && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Certificate Name */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Certificate Title</p>
                  <p className="text-sm font-bold mt-1 text-[#0F172A]">
                    {cert.certificateName || "Certified Achievement"}
                  </p>
                  {cert.certificateType && (
                    <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-[#2563EB] font-medium border border-blue-100">
                      {cert.certificateType}
                    </span>
                  )}
                </div>

                {/* Recipient Student */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Issued To</p>
                  <p className="text-sm font-bold mt-1 text-[#0F172A]">
                    {cert.student?.name || "Verified Student"}
                  </p>
                  {(cert.student?.usn || cert.student?.college) && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {[cert.student?.usn, cert.student?.college].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>

                {/* Issuer */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Issuing Authority</p>
                  <p className="text-sm font-semibold mt-1 text-[#0F172A]">
                    {cert.issuer || "Authorized Organisation"}
                  </p>
                </div>

                {/* Dates */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                  <p className="text-[11px] text-slate-500 uppercase font-semibold">Issue Date</p>
                  <p className="text-sm font-semibold mt-1 text-[#0F172A]">
                    {formatDate(cert.issueDate)}
                  </p>
                  {cert.expiryDate && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      Expires: {formatDate(cert.expiryDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Blockchain Transaction Proof */}
              {cert.transactionHash && (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-slate-500">Blockchain Tx:</span>
                    <span className="font-mono text-xs text-[#2563EB] truncate max-w-[200px] sm:max-w-sm">
                      {cert.transactionHash}
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:text-[#1D4ED8] underline shrink-0 font-semibold"
                  >
                    Etherscan ↗
                  </a>
                </div>
              )}

              {/* Action Links */}
              <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-2.5">
                <Link
                  to={`/verify/${targetId}`}
                  className="flex-1 py-2.5 px-5 rounded-full font-semibold text-xs sm:text-sm text-center bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>View Full Certificate Record</span>
                  <span>→</span>
                </Link>

                <Link
                  to={`/verify/${targetId}?tab=qr`}
                  className="py-2.5 px-5 rounded-full font-semibold text-xs sm:text-sm text-center border border-blue-200 bg-white text-[#2563EB] hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
                >
                  <span>QR Code</span>
                </Link>

                {cert.certificateURL && (
                  <a
                    href={cert.certificateURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-5 rounded-full font-semibold text-xs text-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition flex items-center justify-center"
                  >
                    View Document File
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Not Registered / Not Found State actions */}
          {!cert && (
            <div className="mt-5 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleReset}
                className="py-2.5 px-5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-[#0F172A] hover:bg-slate-50 transition cursor-pointer"
              >
                Upload Different Document
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="py-2.5 px-5 rounded-full text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition cursor-pointer shadow-xs"
              >
                Register as Student or Organisation →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeDocumentVerifier;
