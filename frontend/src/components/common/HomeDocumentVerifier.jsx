import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyDocument, verifyCertificate } from "../../services/publicVerificationService";

const OUTCOMES = {
  VALID: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/30",
    title: "Document Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate registered on the blockchain.",
    cardBorder: "border-[#16805D]/40",
  },
  DOCUMENT_VERIFIED: {
    badge: "✓ VERIFIED ON-CHAIN",
    badgeClass: "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/30",
    title: "Document Authenticity Confirmed",
    desc: "The cryptographic SHA-256 hash matches a verified certificate registered on the blockchain.",
    cardBorder: "border-[#16805D]/40",
  },
  NOT_FOUND: {
    badge: "? NOT REGISTERED",
    badgeClass: "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/30",
    title: "Certificate Not Found in Registry",
    desc: "No matching record was found in the SkillSync database or blockchain ledger for this document.",
    cardBorder: "border-[#D9E1E8]",
  },
  REVOKED: {
    badge: "⊘ CERTIFICATE REVOKED",
    badgeClass: "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/30",
    title: "Certificate Has Been Revoked",
    desc: "A matching certificate exists, but it has been officially revoked by the issuing organisation.",
    cardBorder: "border-[#C5221F]/40",
  },
  EXPIRED: {
    badge: "⏰ CERTIFICATE EXPIRED",
    badgeClass: "bg-[#FFF0E0] text-[#D9381E] border border-[#D9381E]/30",
    title: "Certificate Has Expired",
    desc: "This certificate was verified but has passed its expiration date.",
    cardBorder: "border-[#D9381E]/40",
  },
  PENDING: {
    badge: "⏳ VERIFICATION PENDING",
    badgeClass: "bg-[#E8F3FF] text-[#0A66C2] border border-[#0A66C2]/30",
    title: "Certificate Verification Pending",
    desc: "This certificate has been submitted and is currently awaiting approval.",
    cardBorder: "border-[#0A66C2]/40",
  },
  INVALID: {
    badge: "✗ INVALID DOCUMENT",
    badgeClass: "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/30",
    title: "Document Verification Failed",
    desc: "The uploaded document does not match any valid certificate.",
    cardBorder: "border-[#C5221F]/40",
  },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
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
      setError("Please upload a certificate PDF or image to verify.");
      return;
    }
    setLoading(true);
    setLoadingStep("Computing SHA-256 Hash of document...");
    setError("");
    setResult(null);

    try {
      setTimeout(() => {
        setLoadingStep("Checking SkillSync Blockchain & Registry...");
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
      setError("Please enter a certificate hash or ID.");
      return;
    }
    setLoading(true);
    setLoadingStep("Querying Blockchain & Database...");
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
    <div className="w-full rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs text-[#191919]">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D9E1E8]">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#191919]">
            Verify a Certificate
          </h3>
          <p className="text-xs sm:text-sm text-[#666666] mt-0.5">
            Check if a document is registered and authentic on the blockchain.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center self-start sm:self-auto rounded-lg p-1 bg-[#F3F6F8] border border-[#D9E1E8]">
          <button
            type="button"
            onClick={() => {
              setActiveTab("file");
              setResult(null);
              setError("");
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "file"
                ? "bg-[#0A66C2] text-white shadow-xs"
                : "text-[#666666] hover:text-[#191919]"
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
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "hash"
                ? "bg-[#0A66C2] text-white shadow-xs"
                : "text-[#666666] hover:text-[#191919]"
            }`}
          >
            Enter Hash / ID
          </button>
        </div>
      </div>

      {/* Verification Inputs Form */}
      {!result && (
        <div className="mt-6">
          {activeTab === "file" ? (
            <form onSubmit={handleVerifyFile}>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors duration-150 ${
                  dragging
                    ? "border-[#0A66C2] bg-[#E8F3FF]"
                    : file
                    ? "border-[#16805D] bg-[#F3F6F8]"
                    : "border-[#D9E1E8] bg-[#F3F6F8]/60 hover:border-[#0A66C2] hover:bg-[#F3F6F8]"
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
                          className="h-24 max-w-xs object-contain rounded-md border border-[#D9E1E8] shadow-xs bg-white"
                        />
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#16805D] text-white">
                          Image
                        </span>
                      </div>
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-[#E8F3FF] text-[#0A66C2] flex items-center justify-center text-xl mb-3 border border-[#D9E1E8]">
                        📄
                      </div>
                    )}
                    <p className="text-sm font-semibold text-[#191919] max-w-md truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-[#666666] mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB • {previewUrl ? "Image" : "PDF"} Document Ready
                    </p>
                    <span className="mt-2 text-xs font-medium text-[#0A66C2] hover:underline">
                      Choose another file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-lg bg-[#E8F3FF] text-[#0A66C2] flex items-center justify-center text-xl mb-3">
                      📁
                    </div>
                    <p className="text-sm font-semibold text-[#191919]">
                      Drag & drop certificate here, or browse
                    </p>
                    <p className="text-xs text-[#666666] mt-0.5">
                      PDF, PNG, JPG, or WebP
                    </p>
                    <span className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-white text-[#0A66C2] border border-[#0A66C2] hover:bg-[#E8F3FF] transition">
                      Browse Files
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 px-3.5 py-2.5 rounded-md bg-[#FCE8E6] border border-[#C5221F]/30 text-[#C5221F] text-xs font-medium flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="flex-1 py-2.5 px-5 rounded-md font-semibold text-sm bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                    className="py-2.5 px-4 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#666666] hover:bg-[#F3F6F8] transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyHash}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#666666] uppercase tracking-wider mb-1.5">
                    Certificate Hash (SHA-256) or Certificate ID
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
                      className="w-full rounded-md px-3.5 py-2.5 font-mono text-xs sm:text-sm border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                    />
                    {hashInput && (
                      <button
                        type="button"
                        onClick={() => setHashInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#191919] text-xs px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="px-3.5 py-2.5 rounded-md bg-[#FCE8E6] border border-[#C5221F]/30 text-[#C5221F] text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !hashInput.trim()}
                  className="w-full py-2.5 px-5 rounded-md font-semibold text-sm bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{loadingStep || "Checking Blockchain..."}</span>
                    </>
                  ) : (
                    <span>Verify Certificate Hash</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Verification Result Display */}
      {result && (
        <div className={`mt-6 rounded-lg border p-5 sm:p-6 transition-all bg-[#F3F6F8]/60 ${outcome.cardBorder}`}>
          {/* Header Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D9E1E8]">
            <div className="flex items-center gap-2.5">
              <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide ${outcome.badgeClass}`}>
                {outcome.badge}
              </span>
              <span className="text-xs text-[#666666]">
                Checked at {new Date().toLocaleTimeString()}
              </span>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-[#0A66C2] hover:text-[#004182] font-semibold underline cursor-pointer"
            >
              Verify Another Document
            </button>
          </div>

          {/* Outcome Title & Description */}
          <div className="mt-4">
            <h4 className="text-lg sm:text-xl font-bold tracking-tight text-[#191919]">
              {outcome.title}
            </h4>
            <p className="text-xs sm:text-sm text-[#666666] mt-1">
              {result.message || outcome.desc}
            </p>
          </div>

          {/* Computed Hash Display */}
          {(result.computedHash || cert?.certificateHash) && (
            <div className="mt-4 rounded-md p-3 font-mono text-xs flex items-center justify-between gap-3 bg-white border border-[#D9E1E8]">
              <div className="min-w-0">
                <span className="text-[#666666] block text-[10px] uppercase font-sans font-semibold mb-0.5">
                  Document SHA-256 Hash
                </span>
                <span className="text-[#191919] break-all font-mono">
                  {result.computedHash || cert?.certificateHash}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyHash(result.computedHash || cert?.certificateHash)}
                className="shrink-0 px-2.5 py-1 rounded-md text-xs bg-[#F3F6F8] hover:bg-[#E8F3FF] text-[#0A66C2] font-medium border border-[#D9E1E8] transition cursor-pointer"
              >
                {copiedHash ? "Copied" : "Copy"}
              </button>
            </div>
          )}

          {/* Certificate Found Details Card */}
          {cert && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Certificate Name */}
                <div className="p-3.5 rounded-md border border-[#D9E1E8] bg-white">
                  <p className="text-[11px] text-[#666666] uppercase font-semibold">Certificate Title</p>
                  <p className="text-sm font-semibold mt-1 text-[#191919]">
                    {cert.certificateName || "Certified Achievement"}
                  </p>
                  {cert.certificateType && (
                    <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-[#E8F3FF] text-[#0A66C2] font-medium">
                      {cert.certificateType}
                    </span>
                  )}
                </div>

                {/* Recipient Student */}
                <div className="p-3.5 rounded-md border border-[#D9E1E8] bg-white">
                  <p className="text-[11px] text-[#666666] uppercase font-semibold">Issued To</p>
                  <p className="text-sm font-semibold mt-1 text-[#191919]">
                    {cert.student?.name || "Verified Student"}
                  </p>
                  {(cert.student?.usn || cert.student?.college) && (
                    <p className="text-xs text-[#666666] mt-0.5">
                      {[cert.student?.usn, cert.student?.college].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>

                {/* Issuer */}
                <div className="p-3.5 rounded-md border border-[#D9E1E8] bg-white">
                  <p className="text-[11px] text-[#666666] uppercase font-semibold">Issuing Authority</p>
                  <p className="text-sm font-medium mt-1 text-[#191919]">
                    {cert.issuer || "Authorized Organisation"}
                  </p>
                </div>

                {/* Dates */}
                <div className="p-3.5 rounded-md border border-[#D9E1E8] bg-white">
                  <p className="text-[11px] text-[#666666] uppercase font-semibold">Issue Date</p>
                  <p className="text-sm font-medium mt-1 text-[#191919]">
                    {formatDate(cert.issueDate)}
                  </p>
                  {cert.expiryDate && (
                    <p className="text-xs text-[#666666] mt-0.5">
                      Expires: {formatDate(cert.expiryDate)}
                    </p>
                  )}
                </div>
              </div>

              {/* Blockchain Transaction Proof */}
              {cert.transactionHash && (
                <div className="p-3 rounded-md border border-[#D9E1E8] bg-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#666666]">Blockchain Tx:</span>
                    <span className="font-mono text-xs text-[#0A66C2] truncate max-w-[220px] sm:max-w-sm">
                      {cert.transactionHash}
                    </span>
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#0A66C2] hover:text-[#004182] underline shrink-0 font-medium"
                  >
                    Etherscan ↗
                  </a>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="mt-5 pt-4 border-t border-[#D9E1E8] flex flex-col sm:flex-row gap-2.5">
                <Link
                  to={`/verify/${targetId}`}
                  className="flex-1 py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm text-center bg-[#0A66C2] text-white hover:bg-[#004182] transition flex items-center justify-center gap-1.5"
                >
                  <span>View Certificate Details</span>
                  <span>→</span>
                </Link>

                <Link
                  to={`/verify/${targetId}?tab=qr`}
                  className="py-2.5 px-4 rounded-md font-semibold text-xs sm:text-sm text-center border border-[#0A66C2] bg-white text-[#0A66C2] hover:bg-[#E8F3FF] transition flex items-center justify-center gap-1.5"
                >
                  <span>QR Code</span>
                </Link>

                {cert.certificateURL && (
                  <a
                    href={cert.certificateURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 rounded-md font-semibold text-xs text-center border border-[#D9E1E8] bg-white text-[#666666] hover:bg-[#F3F6F8] transition flex items-center justify-center"
                  >
                    View Document
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Not Registered / Not Found State actions */}
          {!cert && (
            <div className="mt-5 pt-4 border-t border-[#D9E1E8] flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="py-2 px-4 rounded-md text-xs font-semibold bg-white border border-[#D9E1E8] text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
              >
                Upload Different Document
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="py-2 px-4 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition cursor-pointer"
              >
                Create Account to Register Credentials →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeDocumentVerifier;
