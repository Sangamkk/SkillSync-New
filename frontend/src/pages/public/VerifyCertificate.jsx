import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { verifyCertificate } from "../../services/publicVerificationService";

const STATUS_CONFIG = {
  Verified: { label: "VERIFIED", color: "text-[#16805D]", bg: "bg-[#E6F4EA] border-[#16805D]/30", icon: "✓" },
  VERIFIED: { label: "VERIFIED", color: "text-[#16805D]", bg: "bg-[#E6F4EA] border-[#16805D]/30", icon: "✓" },
  VALID: { label: "VERIFIED", color: "text-[#16805D]", bg: "bg-[#E6F4EA] border-[#16805D]/30", icon: "✓" },
  Pending: { label: "PENDING", color: "text-[#B06000]", bg: "bg-[#FEF7E0] border-[#B06000]/30", icon: "⏳" },
  PENDING: { label: "PENDING", color: "text-[#B06000]", bg: "bg-[#FEF7E0] border-[#B06000]/30", icon: "⏳" },
  Rejected: { label: "REJECTED", color: "text-[#C5221F]", bg: "bg-[#FCE8E6] border-[#C5221F]/30", icon: "✗" },
  REJECTED: { label: "REJECTED", color: "text-[#C5221F]", bg: "bg-[#FCE8E6] border-[#C5221F]/30", icon: "✗" },
  Revoked: { label: "REVOKED", color: "text-[#C5221F]", bg: "bg-[#FCE8E6] border-[#C5221F]/30", icon: "⊘" },
  REVOKED: { label: "REVOKED", color: "text-[#C5221F]", bg: "bg-[#FCE8E6] border-[#C5221F]/30", icon: "⊘" },
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—";

const Row = ({ label, value, mono }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-[#D9E1E8] last:border-0 text-xs">
    <span className="font-semibold text-[#666666] uppercase tracking-wider">{label}</span>
    <span className={`text-sm text-[#191919] sm:text-right break-all ${mono ? "font-mono text-xs" : ""}`}>{value || "—"}</span>
  </div>
);

const VerifyCertificate = () => {
  const { certificateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab = searchParams.get("tab") === "qr" ? "qr" : "proof";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (!certificateId) return;
    setLoading(true);
    verifyCertificate(certificateId)
      .then((res) => setData(res))
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || "Certificate not found.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [certificateId]);

  const cert = data?.certificate;
  const onChainStatus = data?.blockchain?.verifiedOnChain
    ? (data.blockchain.onChainRevoked ? "REVOKED" : "VERIFIED")
    : null;
  const statusKey = onChainStatus || data?.status || cert?.verificationStatus || "PENDING";
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.PENDING;
  const isVerified = statusKey === "Verified" || statusKey === "VERIFIED" || statusKey === "VALID";
  const isRevoked = statusKey === "Revoked" || statusKey === "REVOKED";

  const targetHash = cert?.certificateHash || certificateId;
  const verifyUrl = `${window.location.origin}/verify/${targetHash}`;

  useEffect(() => {
    if (!targetHash) return;
    QRCode.toDataURL(verifyUrl, {
      width: 420,
      margin: 2,
      color: {
        dark: "#191919",
        light: "#ffffff",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error("QR Code Generation Error:", err));
  }, [targetHash, verifyUrl]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownloadQr = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeUrl;
    const safeName = (cert?.certificateName || "Certificate").replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `SkillSync-${safeName}-QR.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleTabChange = (tabName) => {
    if (tabName === "qr") {
      setSearchParams({ tab: "qr" });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-12">
      {/* Top Header */}
      <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
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
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/verify-document"
            className="text-xs font-semibold text-[#191919] bg-white border border-[#D9E1E8] px-3 py-1.5 rounded-md hover:bg-[#F3F6F8] transition"
          >
            Verify Document File →
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {loading && (
          <div className="text-center py-20 bg-white rounded-xl border border-[#D9E1E8] shadow-xs p-8">
            <div className="w-8 h-8 border-3 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-[#666666] text-xs font-medium">Fetching certificate record & verifying on blockchain…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-[#C5221F]/30 bg-white p-8 text-center shadow-xs">
            <p className="text-2xl mb-2">⚠️</p>
            <h1 className="text-base font-bold text-[#C5221F] mb-1">Certificate Record Not Found</h1>
            <p className="text-[#666666] text-xs max-w-md mx-auto">{error}</p>
            <Link to="/" className="mt-4 inline-block text-xs font-semibold text-[#0A66C2] hover:underline">
              ← Back to SkillSync Home
            </Link>
          </div>
        )}

        {!loading && cert && (
          <>
            {/* Status Banner */}
            <div className={`rounded-xl border p-5 sm:p-6 mb-5 bg-white shadow-xs ${statusCfg.bg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-[#D9E1E8] text-[#191919] mb-2">
                    Official Credential Status
                  </div>
                  <p className={`text-2xl sm:text-3xl font-extrabold ${statusCfg.color} tracking-tight`}>
                    {statusCfg.icon} {statusCfg.label}
                  </p>
                  <p className="text-[#666666] text-xs mt-1 max-w-xl">
                    {isVerified
                      ? "This certificate is cryptographically authenticated and anchored onto the Ethereum Sepolia blockchain ledger."
                      : isRevoked
                      ? "This certificate has been formally revoked by the issuing authority."
                      : "This certificate record is currently pending blockchain anchor verification."}
                  </p>
                </div>
                {isVerified && (
                  <span className="inline-flex items-center self-start sm:self-auto px-3 py-1.5 rounded-md text-xs font-bold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/30">
                    Immutable Record
                  </span>
                )}
              </div>
            </div>

            {/* Navigation Tabs: Credential Details vs Scannable QR Code */}
            <div className="flex items-center gap-2 mb-5 border-b border-[#D9E1E8] pb-1">
              <button
                type="button"
                onClick={() => handleTabChange("proof")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] ${
                  activeTab === "proof"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                📄 Credential Details & Blockchain Proof
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("qr")}
                className={`px-4 py-2 text-xs font-bold transition rounded-t-md cursor-pointer border-b-2 -mb-[5px] flex items-center gap-1.5 ${
                  activeTab === "qr"
                    ? "border-[#0A66C2] text-[#0A66C2] bg-white"
                    : "border-transparent text-[#666666] hover:text-[#191919]"
                }`}
              >
                <span>📱 Scannable QR Code</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#16805D]" />
              </button>
            </div>

            {/* TAB CONTENT: QR Code View */}
            {activeTab === "qr" && (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 mb-5 shadow-xs text-center">
                <div className="max-w-md mx-auto">
                  <div className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-3">
                    <span className="w-2 h-2 rounded-full bg-[#16805D]" />
                    <span>Instant Blockchain Verification QR</span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-[#191919] tracking-tight">
                    {cert.certificateName || "Verified Certificate"}
                  </h2>
                  <p className="text-xs text-[#666666] mt-1">
                    Issued to <strong className="text-[#191919]">{cert.student?.name || cert.studentName}</strong> by{" "}
                    <strong className="text-[#191919]">{cert.organisation?.organisationName || cert.issuer || "Accredited Organisation"}</strong>
                  </p>

                  {/* QR Box */}
                  <div className="mt-6 flex justify-center">
                    <div className="p-4 bg-white rounded-2xl border-2 border-[#D9E1E8] shadow-md inline-block">
                      {qrCodeUrl ? (
                        <img
                          src={qrCodeUrl}
                          alt="Verification QR Code"
                          className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-[#F3F6F8] rounded-xl text-xs text-[#666666]">
                          Rendering QR Code...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-[#666666] mt-4 leading-relaxed">
                    Scan with any mobile camera or QR scanner to instantly inspect the immutable cryptographic proof on Ethereum Sepolia.
                  </p>

                  {/* Action buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      disabled={!qrCodeUrl}
                      className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      ⬇ Download QR Code (PNG)
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer shadow-xs"
                    >
                      {copied ? "✓ Link Copied" : "Copy Verification URL"}
                    </button>
                  </div>

                  {/* Hash info */}
                  <div className="mt-6 p-3 rounded-lg bg-[#F3F6F8] border border-[#D9E1E8] text-left">
                    <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide">Target Verification URL</p>
                    <p className="text-xs font-mono text-[#0A66C2] break-all mt-0.5 select-all">{verifyUrl}</p>
                    <p className="text-[11px] font-semibold text-[#666666] uppercase tracking-wide mt-2">Certificate SHA-256 Hash</p>
                    <p className="text-xs font-mono text-[#191919] break-all mt-0.5">{cert.certificateHash || "—"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Details & Proof View */}
            {activeTab === "proof" && (
              <>
                {/* Certificate Details Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 mb-5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#191919]">
                      Credential Details
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleTabChange("qr")}
                      className="text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                    >
                      View QR Code →
                    </button>
                  </div>
                  <Row label="Certificate Title" value={cert.certificateName} />
                  <Row label="Certificate Type" value={cert.certificateType} />
                  <Row label="Recipient Name" value={cert.student?.name || cert.studentName} />
                  {cert.student?.usn && <Row label="Student USN" value={cert.student.usn} />}
                  {cert.student?.college && <Row label="College / Institution" value={cert.student.college} />}
                  <Row label="Issuing Authority" value={cert.organisation?.organisationName || cert.issuer || cert.issuingOrganisation} />
                  <Row label="Issue Date" value={formatDate(cert.issueDate)} />
                  <Row label="Expiry Date" value={cert.expiryDate ? formatDate(cert.expiryDate) : "No Expiry"} />
                </div>

                {/* Blockchain Details Card */}
                <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 mb-5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-[#D9E1E8]">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[#191919] flex items-center gap-2">
                      <span>Blockchain Verification Proof</span>
                      {data?.blockchain?.verifiedOnChain ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                          Live Sepolia Anchor
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20">
                          Registry Record
                        </span>
                      )}
                    </h2>
                    <span className="text-xs text-[#666666]">Ethereum Sepolia</span>
                  </div>

                  {/* Verified Hash */}
                  <Row label="Certificate Hash (SHA-256)" value={cert.certificateHash} mono />

                  {/* Verified By */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-[#D9E1E8] text-xs">
                    <span className="font-semibold text-[#666666] uppercase tracking-wider">Verified By (Organisation)</span>
                    <span className="text-sm font-semibold text-[#16805D] sm:text-right">
                      {data?.blockchain?.verifiedBy?.name || cert.organisation?.organisationName || cert.issuer || "Authorized Organisation"}
                    </span>
                  </div>

                  {/* Issued To */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-[#D9E1E8] text-xs">
                    <span className="font-semibold text-[#666666] uppercase tracking-wider">Issued To (Recipient)</span>
                    <span className="text-sm font-semibold text-[#191919] sm:text-right">
                      {data?.blockchain?.verifiedFor?.name || cert.student?.name || "Verified Student"}
                      {data?.blockchain?.verifiedFor?.usn ? ` (${data.blockchain.verifiedFor.usn})` : ""}
                    </span>
                  </div>

                  {/* Smart Contract */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-[#D9E1E8] text-xs">
                    <span className="font-semibold text-[#666666] uppercase tracking-wider">Smart Contract Address</span>
                    <a
                      href={`https://sepolia.etherscan.io/address/${data?.blockchain?.contractAddress || "0x6F63aBd698dA20Ec1ea4B70A8093253dD290fbC2"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#0A66C2] hover:underline font-mono sm:text-right break-all"
                    >
                      {data?.blockchain?.contractAddress || "0x6F63aBd698dA20Ec1ea4B70A8093253dD290fbC2"} ↗
                    </a>
                  </div>

                  {/* On-Chain Timestamps */}
                  {data?.blockchain?.onChainIssuedAt && (
                    <Row label="On-Chain Block Timestamp" value={formatDate(data.blockchain.onChainIssuedAt)} />
                  )}
                  {data?.blockchain?.onChainExpiresAt && (
                    <Row label="On-Chain Expiry" value={formatDate(data.blockchain.onChainExpiresAt)} />
                  )}

                  {/* Transaction Proof */}
                  {cert.transactionHash && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-3 border-b border-[#D9E1E8] last:border-0 text-xs">
                      <span className="font-semibold text-[#666666] uppercase tracking-wider">Transaction Proof</span>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#0A66C2] hover:underline font-mono sm:text-right break-all"
                      >
                        {cert.transactionHash} ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5 mb-6">
                  <button
                    type="button"
                    onClick={() => handleTabChange("qr")}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📱 View Scannable QR Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer shadow-xs"
                  >
                    {copied ? "✓ Link Copied" : "Copy Verification Link"}
                  </button>

                  {cert.certificateURL && (
                    <a
                      href={cert.certificateURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition"
                    >
                      View Document File
                    </a>
                  )}

                  {cert.transactionHash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${cert.transactionHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-md text-xs font-semibold border border-[#0A66C2] bg-white text-[#0A66C2] hover:bg-[#E8F3FF] transition"
                    >
                      View on Etherscan ↗
                    </a>
                  )}
                </div>
              </>
            )}

            {/* Authentic Registry Record note */}
            <div className="rounded-lg border border-[#D9E1E8] bg-white p-4 text-xs text-[#666666] shadow-xs">
              <p className="font-semibold text-[#191919] mb-1">Authentic Registry Record</p>
              <p>
                This official status page confirms cryptographic registration in the SkillSync ledger on Ethereum Sepolia.
                The document hash matches the immutable transaction history.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyCertificate;
