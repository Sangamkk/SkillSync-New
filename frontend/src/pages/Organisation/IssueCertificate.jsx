import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { issueCertificate } from "../../services/certificateService";
import { lookupStudent } from "../../services/studentService";
import NotificationBell from "../../components/common/NotificationBell";
import SettingsModal from "../../components/common/SettingsModal";
import { FaCog } from "react-icons/fa";

const CERT_TYPES = [
  "Course",
  "Internship",
  "Workshop",
  "Hackathon",
  "Competition",
  "Professional",
  "ResearchPaper",
  "Patent",
  "Other",
];

const IssueCertificate = () => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [form, setForm] = useState({
    studentIdentifier: "",
    certificateName: "",
    certificateType: "Course",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    description: "",
    grade: "",
    score: "",
    duration: "",
  });

  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "", data: null });

  const update = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  // Auto-verify student when identifier is entered
  const handleStudentLookup = async (identifierToLookup) => {
    const ident = (identifierToLookup !== undefined ? identifierToLookup : form.studentIdentifier).trim();
    if (!ident) {
      setVerifiedStudent(null);
      setLookupError("");
      return;
    }

    setLookingUp(true);
    setLookupError("");
    try {
      const student = await lookupStudent(ident);
      if (student) {
        setVerifiedStudent(student);
        setLookupError("");
      } else {
        setVerifiedStudent(null);
        setLookupError("No student found with this ID or Email.");
      }
    } catch (err) {
      setVerifiedStudent(null);
      setLookupError(err.response?.data?.message || "Student not found with provided ID or Email.");
    } finally {
      setLookingUp(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
        setStatusMsg({ type: "error", text: "Please upload a valid PDF document.", data: null });
        return;
      }
      setFile(selected);
      setStatusMsg({ type: "", text: "", data: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatusMsg({ type: "error", text: "Please upload the certificate PDF document.", data: null });
      return;
    }

    const studentIdToUse = verifiedStudent?._id || form.studentIdentifier.trim();
    if (!studentIdToUse) {
      setStatusMsg({ type: "error", text: "Student ID or Email is required.", data: null });
      return;
    }

    if (!form.certificateName.trim()) {
      setStatusMsg({ type: "error", text: "Certificate name is required.", data: null });
      return;
    }

    if (!form.issueDate) {
      setStatusMsg({ type: "error", text: "Issue date is required.", data: null });
      return;
    }

    if (verifiedStudent && !verifiedStudent.applicantId) {
      setStatusMsg({
        type: "error",
        text: `Student "${verifiedStudent.name}" has not completed on-chain registration yet (missing blockchain Applicant ID). They must register on-chain before certificates can be issued.`,
        data: null,
      });
      return;
    }

    if (form.expiryDate) {
      const expDate = new Date(form.expiryDate).getTime();
      if (expDate <= Date.now()) {
        setStatusMsg({
          type: "error",
          text: "Expiry date must be in the future. Leave it blank if the certificate does not expire.",
          data: null,
        });
        return;
      }
    }

    setLoading(true);
    setStatusMsg({ type: "", text: "", data: null });

    try {
      const formData = new FormData();
      formData.append("certificate", file);

      formData.append("studentId", studentIdToUse);
      if (verifiedStudent?.email) {
        formData.append("studentEmail", verifiedStudent.email);
      }
      formData.append("certificateName", form.certificateName.trim());
      formData.append("certificateType", form.certificateType);
      formData.append("issueDate", form.issueDate);
      if (form.expiryDate) formData.append("expiryDate", form.expiryDate);
      if (form.description) formData.append("description", form.description.trim());
      if (form.grade) formData.append("grade", form.grade.trim());
      if (form.score) formData.append("score", form.score.trim());
      if (form.duration) formData.append("duration", form.duration.trim());

      const result = await issueCertificate(formData);

      setStatusMsg({
        type: "success",
        text: result.message || "Certificate issued and recorded on the blockchain successfully!",
        data: {
          txHash: result.blockchain?.transactionHash || result.certificate?.txHash,
          blockNumber: result.blockchain?.blockNumber || result.certificate?.blockchainBlockNumber,
          certHash: result.blockchain?.certificateHash || result.certificate?.certificateHash,
          certId: result.certificate?._id,
        },
      });

      // Reset form on success
      setForm({
        studentIdentifier: "",
        certificateName: "",
        certificateType: "Course",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: "",
        description: "",
        grade: "",
        score: "",
        duration: "",
      });
      setVerifiedStudent(null);
      setFile(null);
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to issue certificate.",
        data: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-3xl">
        {/* Top Breadcrumb & Navigation */}
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
            <span>Credential Issuance</span>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition cursor-pointer"
              title="Settings & Preferences"
            >
              <FaCog className="w-5 h-5" />
            </button>
            <Link
              to="/organisation"
              className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
            >
              Dashboard
            </Link>
            <Link
              to="/organisation/pending-verifications"
              className="rounded-md border border-[#D9E1E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition"
            >
              Pending Verifications
            </Link>
          </div>
        </div>

        {/* Page Title Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-2">
            Blockchain Credential Issuance
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
            Issue Verified Certificate
          </h1>
          <p className="mt-1 text-xs text-[#666666]">
            Directly issue a tamper-proof credential to a student. SkillSync computes the document hash,
            anchors it immutably onto Ethereum Sepolia under the student&apos;s verified applicant record, and issues verifiable on-chain proof.
          </p>
        </div>

        {/* Status Alert Banner */}
        {statusMsg.text && (
          <div
            className={`mb-6 rounded-xl border p-5 shadow-xs ${
              statusMsg.type === "success"
                ? "border-[#16805D]/30 bg-[#E6F4EA] text-[#16805D]"
                : "border-[#C5221F]/30 bg-[#FCE8E6] text-[#C5221F]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{statusMsg.type === "success" ? "✓" : "⚠️"}</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{statusMsg.text}</p>
                {statusMsg.data && (
                  <div className="mt-3 pt-3 border-t border-[#16805D]/20 space-y-1.5 text-xs font-mono text-[#191919]">
                    {statusMsg.data.txHash && (
                      <p>
                        <span className="font-sans font-semibold text-[#666666]">Transaction Proof:</span>{" "}
                        <a
                          href={`https://sepolia.etherscan.io/tx/${statusMsg.data.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A66C2] hover:underline break-all"
                        >
                          {statusMsg.data.txHash} ↗
                        </a>
                      </p>
                    )}
                    {statusMsg.data.blockNumber && (
                      <p>
                        <span className="font-sans font-semibold text-[#666666]">Block Number:</span> #{statusMsg.data.blockNumber}
                      </p>
                    )}
                    {statusMsg.data.certHash && (
                      <p>
                        <span className="font-sans font-semibold text-[#666666]">SHA-256 Hash:</span> {statusMsg.data.certHash}
                      </p>
                    )}
                    {statusMsg.data.certId && (
                      <div className="pt-2 font-sans">
                        <Link
                          to={`/verify/${statusMsg.data.certId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-[#0A66C2] hover:underline"
                        >
                          <span>Inspect Live Credential & QR Page</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Issuance Form Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Student Lookup */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] mb-3">
                1. Recipient Information
              </h2>

              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                  Student Email, USN, or Applicant ID <span className="text-[#C5221F]">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. student@university.edu, 1MS21CS001, or 0x..."
                    value={form.studentIdentifier}
                    onChange={(e) => {
                      update("studentIdentifier", e.target.value);
                      if (verifiedStudent) setVerifiedStudent(null);
                    }}
                    onBlur={() => handleStudentLookup()}
                    className="flex-1 rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleStudentLookup()}
                    disabled={lookingUp || !form.studentIdentifier.trim()}
                    className="px-4 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition disabled:opacity-50 cursor-pointer"
                  >
                    {lookingUp ? "Searching…" : "Verify Student"}
                  </button>
                </div>

                {lookupError && (
                  <p className="mt-1.5 text-xs text-[#C5221F]">{lookupError}</p>
                )}

                {/* Verified Student Preview Card */}
                {verifiedStudent && (
                  <div className="mt-3 p-3.5 rounded-lg border border-[#16805D]/30 bg-[#E6F4EA] text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#16805D]">✓ Recipient Confirmed:</span>
                        <span className="font-semibold text-[#191919]">{verifiedStudent.name}</span>
                        {verifiedStudent.usn && <span className="text-[#666666]">({verifiedStudent.usn})</span>}
                      </div>
                      {verifiedStudent.applicantId ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#16805D]/30 text-[#16805D]">
                          On-Chain ID: #{verifiedStudent.applicantId}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FEF7E0] text-[#B06000]">
                          Pending On-Chain Reg
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-[#666666] flex flex-wrap gap-x-4">
                      <span>Email: {verifiedStudent.email}</span>
                      {verifiedStudent.college && <span>College: {verifiedStudent.college}</span>}
                      {verifiedStudent.walletAddress && (
                        <span className="font-mono">Wallet: {verifiedStudent.walletAddress.slice(0, 10)}…</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Credential Details */}
            <div className="pt-4 border-t border-[#D9E1E8]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] mb-3">
                2. Certificate Information
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Certificate Title <span className="text-[#C5221F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Machine Learning Specialization"
                    value={form.certificateName}
                    onChange={(e) => update("certificateName", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Certificate Category <span className="text-[#C5221F]">*</span>
                  </label>
                  <select
                    value={form.certificateType}
                    onChange={(e) => update("certificateType", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  >
                    {CERT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Issue Date <span className="text-[#C5221F]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.issueDate}
                    onChange={(e) => update("issueDate", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Expiry Date <span className="text-[#666666] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => update("expiryDate", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Course / Program Duration <span className="text-[#666666] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 12 Weeks, 3 Months, 40 Hours"
                    value={form.duration}
                    onChange={(e) => update("duration", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Grade <span className="text-[#666666] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A+, Distinction"
                    value={form.grade}
                    onChange={(e) => update("grade", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Score / Percentage <span className="text-[#666666] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 96%, 3.9/4.0"
                    value={form.score}
                    onChange={(e) => update("score", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#191919] mb-1.5">
                    Description / Syllabus Covered <span className="text-[#666666] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe key learning milestones or competencies evaluated..."
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    className="w-full rounded-md border border-[#D9E1E8] bg-[#F3F6F8] px-3.5 py-2 text-xs text-[#191919] focus:bg-white focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Document Upload */}
            <div className="pt-4 border-t border-[#D9E1E8]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A66C2] mb-3">
                3. Certificate Document Asset (PDF)
              </h2>

              <div className="rounded-lg border-2 border-dashed border-[#D9E1E8] p-6 text-center hover:border-[#0A66C2] transition bg-[#F3F6F8]">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F3FF] text-[#0A66C2] mb-2 text-lg">
                  📄
                </div>

                {file ? (
                  <div>
                    <p className="text-xs font-bold text-[#191919]">{file.name}</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB · PDF Document Ready
                    </p>
                    <label className="mt-2.5 inline-block text-xs font-semibold text-[#0A66C2] hover:underline cursor-pointer">
                      Replace Document
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-medium text-[#191919]">
                      Click to upload or drag and drop official certificate PDF
                    </p>
                    <p className="text-[11px] text-[#666666] mt-1">
                      PDF files up to 10MB are supported. Cryptographic SHA-256 hash is generated automatically.
                    </p>
                    <label className="mt-3 inline-block px-3.5 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer shadow-xs">
                      Choose PDF File
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#D9E1E8] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/organisation")}
                className="px-4 py-2 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#666666] hover:bg-[#F3F6F8] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? "Issuing on Ethereum Sepolia…" : "Issue & Anchor Certificate on Blockchain →"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default IssueCertificate;
