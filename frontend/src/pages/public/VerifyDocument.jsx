import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { verifyDocument } from "../../services/publicVerificationService";

const OUTCOMES = {
  DOCUMENT_VERIFIED: {
    icon: "✓",
    color: "text-[#16805D]",
    badgeBg: "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/30",
    border: "border-[#16805D]/40",
    title: "Document Verified Authentically",
    desc: "The uploaded document's SHA-256 hash matches the blockchain record. This document is genuine.",
  },
  HASH_MISMATCH: {
    icon: "✗",
    color: "text-[#C5221F]",
    badgeBg: "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/30",
    border: "border-[#C5221F]/40",
    title: "Document Hash Mismatch",
    desc: "The hash of the uploaded document does not match any known certificate on the blockchain. The document may have been altered or modified.",
  },
  NOT_FOUND: {
    icon: "?",
    color: "text-[#B06000]",
    badgeBg: "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/30",
    border: "border-[#D9E1E8]",
    title: "Certificate Not Found",
    desc: "No matching certificate was found in the SkillSync database or on-chain ledger for this file.",
  },
  REVOKED: {
    icon: "⊘",
    color: "text-[#C5221F]",
    badgeBg: "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/30",
    border: "border-[#C5221F]/40",
    title: "Certificate Revoked",
    desc: "A matching certificate was found, but it has been officially revoked by the issuing organisation.",
  },
  EXPIRED: {
    icon: "⏰",
    color: "text-[#D9381E]",
    badgeBg: "bg-[#FFF0E0] text-[#D9381E] border border-[#D9381E]/30",
    border: "border-[#D9381E]/40",
    title: "Certificate Expired",
    desc: "A matching certificate was found, but its validity period has expired.",
  },
};

const VerifyDocument = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    const isImage = f.type.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(f.name);

    if (!isPdf && !isImage) {
      setError("Please upload a valid certificate file (PDF, PNG, JPG, or WebP).");
      return;
    }
    setFile(f);
    if (isImage) {
      setPreviewUrl(URL.createObjectURL(f));
    } else {
      setPreviewUrl(null);
    }
    setResult(null);
    setError("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a certificate file (PDF or Image) to verify.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await verifyDocument(formData);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Verification failed.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const outcome = result?.outcome || result?.status;
  const outcomeCfg = outcome ? OUTCOMES[outcome] : null;
  const cert = result?.certificate;

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-10 sm:py-14">
      {/* Top Header */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-semibold text-[#191919] bg-white border border-[#D9E1E8] px-3 py-1.5 rounded-md hover:bg-[#F3F6F8] transition cursor-pointer"
          >
            ← Back
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-xs shadow-xs">
              S
            </span>
            <span className="font-bold tracking-tight text-[#191919] text-sm">
              Skill<span className="text-[#0A66C2]">Sync</span>
            </span>
          </Link>
        </div>
        <p className="text-xs text-[#666666]">Public Document Verification</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Title area */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-2">
            Independent Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191919]">
            Document Hash Verification
          </h1>
          <p className="text-[#666666] text-sm mt-1">
            Upload a certificate PDF or image to verify its authenticity against the Ethereum blockchain registry. The document will be hashed client-safe and matched against on-chain records.
          </p>
        </div>

        {/* Upload form card */}
        <div className="bg-white rounded-xl border border-[#D9E1E8] p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`rounded-lg border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-colors duration-150 mb-6 ${
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
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex flex-col items-center">
                  {previewUrl ? (
                    <div className="relative mb-3">
                      <img
                        src={previewUrl}
                        alt="Certificate Preview"
                        className="h-28 max-w-xs object-contain rounded-md border border-[#D9E1E8] shadow-xs bg-white"
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
                  <p className="text-[#191919] font-semibold text-sm max-w-md truncate">{file.name}</p>
                  <p className="text-[#666666] text-xs mt-1">
                    {(file.size / 1024).toFixed(1)} KB • {previewUrl ? "Image" : "PDF"} Document Ready
                  </p>
                  <span className="text-[#0A66C2] text-xs font-medium mt-2 hover:underline">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="h-12 w-12 rounded-lg bg-[#E8F3FF] text-[#0A66C2] flex items-center justify-center text-xl mb-3">
                    ☁️
                  </div>
                  <p className="text-[#191919] font-semibold text-sm">Drop your PDF or Certificate Image here</p>
                  <p className="text-[#666666] text-xs mt-1">Supports PDF, PNG, JPG, JPEG, and WebP files</p>
                  <span className="mt-3 inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white text-[#0A66C2] border border-[#0A66C2] hover:bg-[#E8F3FF] transition">
                    Browse Files
                  </span>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-md bg-[#FCE8E6] border border-[#C5221F]/30 text-[#C5221F] text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-2.5 px-4 rounded-md bg-[#0A66C2] text-white font-semibold text-sm hover:bg-[#004182] disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying document on-chain…</span>
                </>
              ) : (
                "Verify Document Authenticity"
              )}
            </button>
          </form>

          {/* Outcome Result Card */}
          {outcomeCfg && (
            <div className={`mt-6 rounded-lg border p-5 ${outcomeCfg.border} bg-[#F3F6F8]/60`}>
              <div className="flex items-start gap-3 mb-4">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${outcomeCfg.badgeBg}`}>
                  {outcomeCfg.icon} {outcome}
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#191919]">{outcomeCfg.title}</h2>
                  <p className="text-[#666666] text-xs mt-0.5">{outcomeCfg.desc}</p>
                </div>
              </div>

              {cert && (
                <div className="mt-4 pt-4 border-t border-[#D9E1E8] space-y-2.5 text-xs">
                  {cert.certificateName && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#666666]">Certificate</span>
                      <span className="text-[#191919] font-semibold">{cert.certificateName}</span>
                    </div>
                  )}
                  {cert.student?.name && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#666666]">Issued To</span>
                      <span className="text-[#191919]">
                        {cert.student.name} {cert.student.usn ? `(${cert.student.usn})` : ""}
                      </span>
                    </div>
                  )}
                  {cert.issuer && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#666666]">Issuing Authority</span>
                      <span className="text-[#191919]">{cert.issuer}</span>
                    </div>
                  )}
                  {cert.certificateHash && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-[#666666]">SHA-256 Hash</span>
                      <span className="font-mono text-[#191919] text-[11px] break-all text-right max-w-xs">{cert.certificateHash}</span>
                    </div>
                  )}
                  {cert.transactionHash && (
                    <div className="flex justify-between py-0.5 items-center">
                      <span className="text-[#666666]">Transaction</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0A66C2] hover:underline font-mono text-xs"
                      >
                        {cert.transactionHash.slice(0, 16)}… ↗
                      </a>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-[#D9E1E8] flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/verify/${cert.certificateHash || cert._id}`}
                      className="flex-1 py-2 px-3 rounded-md text-center bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#004182] transition"
                    >
                      View Certificate Page →
                    </Link>
                    <Link
                      to={`/verify/${cert.certificateHash || cert._id}?tab=qr`}
                      className="py-2 px-3 rounded-md text-center border border-[#0A66C2] bg-white text-[#0A66C2] hover:bg-[#E8F3FF] text-xs font-semibold transition"
                    >
                      QR Code
                    </Link>
                    {cert.certificateURL && (
                      <a
                        href={cert.certificateURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-md text-center border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] text-xs font-semibold transition"
                      >
                        View File
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informational Card */}
        <div className="mt-6 rounded-lg border border-[#D9E1E8] bg-white p-5 text-xs text-[#666666] shadow-xs">
          <p className="font-semibold text-[#191919] mb-1.5">How SkillSync verification works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Upload the official certificate PDF or Image file.</li>
            <li>The system computes its cryptographic SHA-256 checksum.</li>
            <li>The checksum is compared against immutable Ethereum Sepolia ledger entries.</li>
            <li>Results display verified provenance without requiring login or third-party validation.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default VerifyDocument;
