import { useState, useEffect, useRef, useCallback } from "react";
import { verifyDocument, verifyCertificate } from "../../services/publicVerificationService";

const OUTCOMES = {
  VALID: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-300",
    title: "Certificate Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate anchored on the Ethereum blockchain.",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50/40",
  },
  DOCUMENT_VERIFIED: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-300",
    title: "Certificate Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate anchored on the Ethereum blockchain.",
    borderColor: "border-emerald-300",
    bgColor: "bg-emerald-50/40",
  },
  NOT_FOUND: {
    badge: "✕ NOT REGISTERED",
    badgeClass: "bg-amber-50 text-amber-700 border border-amber-300",
    title: "Certificate Not Found in Registry",
    desc: "No matching record was found in the SkillSync registry or blockchain ledger for this document.",
    borderColor: "border-amber-300",
    bgColor: "bg-amber-50/40",
  },
  REVOKED: {
    badge: "⊘ REVOKED",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-300",
    title: "Certificate Has Been Revoked",
    desc: "A matching certificate exists, but it has been officially revoked by the issuing authority.",
    borderColor: "border-rose-300",
    bgColor: "bg-rose-50/40",
  },
  EXPIRED: {
    badge: "⏰ EXPIRED",
    badgeClass: "bg-orange-50 text-orange-700 border border-orange-300",
    title: "Certificate Has Expired",
    desc: "This certificate was verified on-chain but has passed its validity date.",
    borderColor: "border-orange-300",
    bgColor: "bg-orange-50/40",
  },
  PENDING: {
    badge: "⏳ PENDING VERIFICATION",
    badgeClass: "bg-blue-50 text-blue-700 border border-blue-300",
    title: "Verification Pending",
    desc: "This certificate is currently undergoing review and blockchain anchoring.",
    borderColor: "border-blue-300",
    bgColor: "bg-blue-50/40",
  },
  INVALID: {
    badge: "✕ INVALID DOCUMENT",
    badgeClass: "bg-rose-50 text-rose-700 border border-rose-300",
    title: "Verification Failed",
    desc: "The uploaded file could not be validated or does not match any certificate format.",
    borderColor: "border-rose-300",
    bgColor: "bg-rose-50/40",
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

const VerifyCertificateModal = ({ isOpen, onClose, initialQuery = null }) => {
  const [file, setFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [hashInput, setHashInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [copiedHash, setCopiedHash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const resetForm = useCallback(() => {
    setFile(null);
    setDocTitle("");
    setHashInput("");
    setDragging(false);
    setLoading(false);
    setLoadingStep("");
    setResult(null);
    setError("");
    setCopiedHash(false);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {
        /* ignore */
      }
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [previewUrl]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle initial query if provided
  useEffect(() => {
    if (!isOpen) return;
    if (initialQuery && typeof initialQuery === "string" && initialQuery.trim()) {
      setHashInput(initialQuery.trim());
      setLoading(true);
      setLoadingStep("Querying blockchain ledger...");
      verifyCertificate(initialQuery.trim())
        .then((res) => setResult(res))
        .catch((err) => {
          const msg = err.response?.data?.message || err.message || "Certificate verification failed.";
          setError(msg);
        })
        .finally(() => {
          setLoading(false);
          setLoadingStep("");
        });
    }
  }, [isOpen, initialQuery]);

  // Handle Escape key & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleClose]);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.toLowerCase().endsWith(".pdf");
    const isImage = selectedFile.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(selectedFile.name);

    if (!isPdf && !isImage) {
      setError("Please select a valid certificate file (PDF, PNG, JPG, or WebP).");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller document.");
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

  const handleVerify = async (e) => {
    if (e) e.preventDefault();

    const trimmedHash = hashInput.trim();

    // Check if either file or hash is provided
    if (!file && !trimmedHash) {
      setError("Please upload a certificate file or enter a SHA-256 hash / certificate ID.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    // If file is provided, prioritize document upload verification
    if (file) {
      setLoadingStep("Computing SHA-256 cryptographic digest...");
      try {
        setTimeout(() => {
          setLoadingStep("Cross-referencing Ethereum Sepolia smart contract...");
        }, 400);

        const formData = new FormData();
        formData.append("file", file);
        if (docTitle.trim()) {
          formData.append("title", docTitle.trim());
        }
        const res = await verifyDocument(formData);
        setResult(res);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Failed to verify certificate file.";
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    } else {
      // Verify via Hash / ID
      setLoadingStep("Querying blockchain ledger & decentralized registry...");
      try {
        const res = await verifyCertificate(trimmedHash);
        setResult(res);
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Certificate not found or verification failed.";
        setError(msg);
      } finally {
        setLoading(false);
        setLoadingStep("");
      }
    }
  };

  const handleCopyHash = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    });
  };

  if (!isOpen) return null;

  const statusKey = result?.status || result?.outcome || (result?.valid ? "VALID" : "NOT_FOUND");
  const outcome = OUTCOMES[statusKey] || (result?.valid ? OUTCOMES.VALID : OUTCOMES.NOT_FOUND);
  const cert = result?.certificate;
  const isVerified = statusKey === "VALID" || statusKey === "DOCUMENT_VERIFIED" || result?.valid === true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* =====================================================
            MODAL HEADER
        ====================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                Verify a Certificate
              </h3>
              <p className="text-xs text-slate-500">
                Independent blockchain audit • Check document authenticity and integrity
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* =====================================================
            MODAL BODY (Scrollable Section Cards)
        ====================================================== */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1 text-[#0F172A] bg-slate-50/50">
          {!result ? (
            <form id="verify-cert-form" onSubmit={handleVerify} className="space-y-4">
              {/* SECTION 1: Certificate File Upload (Boxed card like reference screenshot) */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                    1
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Certificate Document File
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center">
                  {/* File Input Left */}
                  <div className="md:col-span-7">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Upload Certificate (PDF / PNG / JPG)
                    </label>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      className={`relative flex items-center justify-between rounded-lg border border-slate-300 bg-white p-2 sm:p-2.5 transition-all ${
                        dragging ? "border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/20" : ""
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf,image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      />

                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shrink-0 cursor-pointer"
                        >
                          Choose file
                        </button>
                        <span className="text-xs text-slate-600 truncate">
                          {file ? file.name : "No file chosen"}
                        </span>
                      </div>

                      {file && (
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 ml-2"
                          title="Remove file"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1">
                      {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to compute SHA-256 hash` : "Supported formats: PDF, PNG, JPG, WebP (max 10MB)"}
                    </p>
                  </div>

                  {/* Optional Reference or Title Right */}
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Document Title / Ref (Optional)
                    </label>
                    <input
                      type="text"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder="e.g. Full Stack Certificate"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Image Preview Thumbnail if selected */}
                {previewUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
                    <img
                      src={previewUrl}
                      alt="Certificate Preview"
                      className="h-16 w-24 object-cover rounded border border-slate-200 bg-slate-50"
                    />
                    <div className="text-xs text-slate-500">
                      <p className="font-semibold text-slate-700">Preview Attached</p>
                      <p className="text-[11px]">Cryptographic SHA-256 fingerprint will be verified on-chain.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: Cryptographic Hash / ID (Boxed card like reference screenshot) */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                      2
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Or Verify by SHA-256 Hash / Certificate ID
                    </h4>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                    Alternative lookup
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cryptographic Hash or ID
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 pr-9"
                    />
                    {hashInput && (
                      <button
                        type="button"
                        onClick={() => setHashInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs p-1"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter the 64-character SHA-256 digest or the unique certificate UUID.
                  </p>
                </div>
              </div>

              {/* SECTION 3: Ledger Verification Context (Boxed card like reference screenshot) */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                    3
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Blockchain Audit Ledger
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Network</p>
                    <p className="font-semibold text-slate-700 mt-0.5 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ethereum Sepolia Testnet</span>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Smart Contract</p>
                    <p className="font-semibold text-slate-700 mt-0.5 font-mono text-[11px] truncate">
                      ApplicantManager.sol (Immutable)
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
            </form>
          ) : (
            /* =====================================================
               VERIFICATION RESULT DISPLAY (In-modal, No separate page)
            ====================================================== */
            <div className={`rounded-xl border p-5 sm:p-6 transition-all duration-200 bg-white shadow-sm ${outcome.borderColor}`}>
              {/* Header Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide ${outcome.badgeClass}`}>
                    {outcome.badge}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Audited {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    setHashInput("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                >
                  Verify Another Certificate
                </button>
              </div>

              {/* Title & Desc */}
              <div className="mt-4">
                <h4 className="text-lg font-bold tracking-tight text-[#0F172A]">
                  {outcome.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {result.message || outcome.desc}
                </p>
              </div>

              {/* SHA-256 Digest Box */}
              {(result.computedHash || cert?.certificateHash || hashInput) && (
                <div className="mt-4 rounded-xl p-3 bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Cryptographic SHA-256 Digest
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(result.computedHash || cert?.certificateHash || hashInput)}
                      className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                    >
                      {copiedHash ? "Copied ✓" : "Copy Hash"}
                    </button>
                  </div>
                  <p className="font-mono text-xs text-slate-800 break-all">
                    {result.computedHash || cert?.certificateHash || hashInput}
                  </p>
                </div>
              )}

              {/* Verified Certificate Metadata */}
              {cert && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Certificate Title</p>
                      <p className="text-xs sm:text-sm font-bold mt-0.5 text-[#0F172A]">
                        {cert.certificateName || "Certified Achievement"}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Issued To</p>
                      <p className="text-xs sm:text-sm font-bold mt-0.5 text-[#0F172A]">
                        {cert.student?.name || "Verified Student"}
                      </p>
                      {cert.student?.usn && (
                        <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{cert.student.usn}</p>
                      )}
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Issuing Authority</p>
                      <p className="text-xs sm:text-sm font-semibold mt-0.5 text-[#0F172A]">
                        {cert.issuer || "Accredited Organisation"}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Issue Date</p>
                      <p className="text-xs sm:text-sm font-semibold mt-0.5 text-[#0F172A]">
                        {formatDate(cert.issueDate)}
                      </p>
                    </div>
                  </div>

                  {cert.transactionHash && (
                    <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">Blockchain Transaction</span>
                        <span className="font-mono text-[11px] text-emerald-900 truncate block">
                          {cert.transactionHash}
                        </span>
                      </div>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-white text-emerald-700 hover:text-emerald-900 font-semibold text-xs border border-emerald-200 shrink-0 hover:bg-emerald-50 transition"
                      >
                        Sepolia Etherscan ↗
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* =====================================================
            MODAL ACTION FOOTER (Matching reference screenshot)
        ====================================================== */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Cryptographic On-Chain Verification</span>
          </div>

          <div className="flex items-center justify-end gap-3 ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {result ? "Close" : "Cancel"}
            </button>

            {!result ? (
              <button
                type="submit"
                form="verify-cert-form"
                disabled={loading || (!file && !hashInput.trim())}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#16805D] hover:bg-[#126b4d] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{loadingStep || "Verifying..."}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Verify Certificate</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setFile(null);
                  setHashInput("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#16805D] hover:bg-[#126b4d] rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer"
              >
                Verify Another
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificateModal;
