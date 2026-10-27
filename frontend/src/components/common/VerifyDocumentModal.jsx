import { useState, useEffect, useRef, useCallback } from "react";
import { verifyDocument } from "../../services/publicVerificationService";

const DOCUMENT_TYPES = [
  { value: "certificate", label: "Certificate / Credential" },
  { value: "academic", label: "Academic Degree / Transcript" },
  { value: "experience", label: "Experience / Internship Letter" },
  { value: "project", label: "Project Verification Record" },
  { value: "other", label: "Other Document" },
];

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const VerifyDocumentModal = ({ isOpen, onClose }) => {
  const [documentType, setDocumentType] = useState("certificate");
  const [documentDetails, setDocumentDetails] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [apiError, setApiError] = useState("");

  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  const resetForm = useCallback(() => {
    setDocumentType("certificate");
    setDocumentDetails("");
    setIssuingOrg("");
    setVerificationNotes("");
    setFile(null);
    setFileError("");
    setFormErrors({});
    setIsSubmitting(false);
    setSubmitStep("");
    setVerificationResult(null);
    setApiError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Close on Escape key press & prevent background scroll
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

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setFileError("Please select a document file to verify.");
      return false;
    }

    const validExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
    const fileName = selectedFile.name.toLowerCase();
    const isValidType = validExtensions.some((ext) => fileName.endsWith(ext)) ||
      selectedFile.type === "application/pdf" ||
      selectedFile.type.startsWith("image/");

    if (!isValidType) {
      setFileError("Supported formats are PDF, JPG, and PNG.");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds 10MB limit. Please upload a smaller file.");
      return false;
    }

    setFileError("");
    return true;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      } else {
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (validateFile(dropped)) {
        setFile(dropped);
      } else {
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    if (!documentType) errors.documentType = "Please select a document type.";
    if (!documentDetails.trim()) errors.documentDetails = "Please enter document title or reference number.";
    if (!issuingOrg.trim()) errors.issuingOrg = "Please enter issuing organization name.";
    if (!file) {
      setFileError("Please upload a document file to verify.");
      errors.file = true;
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    setApiError("");
    setVerificationResult(null);
    setSubmitStep("Computing SHA-256 cryptographic digest of document...");

    try {
      // Step timer for authentic user feedback
      setTimeout(() => {
        setSubmitStep("Querying Ethereum Sepolia ledger & SkillSync registry...");
      }, 700);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("documentDetails", documentDetails.trim());
      formData.append("issuingOrg", issuingOrg.trim());
      if (verificationNotes.trim()) {
        formData.append("notes", verificationNotes.trim());
      }

      const res = await verifyDocument(formData);
      setVerificationResult(res);
    } catch (err) {
      console.error("Verification submission error:", err);
      const msg = err.response?.data?.message || err.message || "Failed to reach verification service. Please try again.";
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* =====================================================
            MODAL HEADER
        ====================================================== */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/80 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">
                Verify a Document
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submit document details to inspect cryptographic blockchain proof
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* =====================================================
            MODAL BODY (Scrollable content)
        ====================================================== */}
        <div className="overflow-y-auto px-6 py-6 space-y-6 flex-1 text-slate-800">
          {/* Active Result View */}
          {verificationResult && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {verificationResult.valid ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-[#0F172A]">
                      {verificationResult.valid
                        ? "Document Verified On-Chain"
                        : "Document Not Found in Registry"}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {verificationResult.valid
                        ? "Matches an authenticated certificate anchored to Ethereum Sepolia."
                        : "No matching registered credential exists for this document hash."}
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${
                  verificationResult.valid
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}>
                  {verificationResult.valid ? "Verified Valid" : "Unverified / Not Found"}
                </span>
              </div>

              {/* Hash Display */}
              {verificationResult.computedHash && (
                <div className="bg-white rounded-lg p-3 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Computed SHA-256 Digest
                  </span>
                  <p className="font-mono text-xs text-[#0F172A] break-all bg-slate-50 p-2 rounded border border-slate-200">
                    {verificationResult.computedHash}
                  </p>
                </div>
              )}

              {/* Certificate Details if valid */}
              {verificationResult.certificate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 block">Title</span>
                    <span className="font-semibold text-slate-900">{verificationResult.certificate.certificateName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Issuer</span>
                    <span className="font-semibold text-slate-900">{verificationResult.certificate.issuer || "N/A"}</span>
                  </div>
                  {verificationResult.certificate.student && (
                    <div>
                      <span className="text-slate-400 block">Recipient</span>
                      <span className="font-semibold text-slate-900">{verificationResult.certificate.student.name} ({verificationResult.certificate.student.usn})</span>
                    </div>
                  )}
                  {verificationResult.blockchain?.network && (
                    <div>
                      <span className="text-slate-400 block">Blockchain Ledger</span>
                      <span className="font-semibold text-[#2563EB]">{verificationResult.blockchain.network}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setVerificationResult(null);
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 rounded-full transition-colors cursor-pointer"
                >
                  Verify Another Document
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form id="verify-document-form" onSubmit={handleSubmit} className="space-y-5">
            {/* API Error Notification */}
            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* Section 1: Classification & Details */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>1. Document Classification</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Document Type */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-doc-type" className="block text-xs font-semibold text-[#0F172A]">
                    Document Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="modal-doc-type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.documentType && (
                    <p className="text-[11px] text-rose-500">{formErrors.documentType}</p>
                  )}
                </div>

                {/* Issuing Organization */}
                <div className="space-y-1.5">
                  <label htmlFor="modal-doc-org" className="block text-xs font-semibold text-[#0F172A]">
                    Issuing Organization <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="modal-doc-org"
                    type="text"
                    value={issuingOrg}
                    onChange={(e) => setIssuingOrg(e.target.value)}
                    placeholder="e.g. Stanford, Meta, AWS, SkillSync"
                    className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                  />
                  {formErrors.issuingOrg && (
                    <p className="text-[11px] text-rose-500">{formErrors.issuingOrg}</p>
                  )}
                </div>
              </div>

              {/* Document Details / Title */}
              <div className="space-y-1.5">
                <label htmlFor="modal-doc-details" className="block text-xs font-semibold text-[#0F172A]">
                  Document Details / Reference ID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-doc-details"
                  type="text"
                  value={documentDetails}
                  onChange={(e) => setDocumentDetails(e.target.value)}
                  placeholder="e.g. Full-Stack Web Development Certificate or Ref #SS-2024-890"
                  className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors"
                />
                {formErrors.documentDetails && (
                  <p className="text-[11px] text-rose-500">{formErrors.documentDetails}</p>
                )}
              </div>
            </div>

            {/* Section 2: Upload Document */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2563EB]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>2. Upload Document File</span>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? "border-[#2563EB] bg-blue-50/60"
                    : file
                    ? "border-emerald-300 bg-emerald-50/30"
                    : "border-slate-300 hover:border-[#2563EB]/60 bg-white hover:bg-slate-50/70"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {file ? (
                  <div className="flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-[#0F172A] truncate max-w-xs sm:max-w-md">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for SHA-256 analysis
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline px-2 py-1"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2563EB]">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                        Click to upload or drag and drop document
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supports PDF, PNG, or JPG (max 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {fileError && (
                <p className="text-[11px] text-rose-500">{fileError}</p>
              )}
            </div>

            {/* Section 3: Verification Notes (Optional) */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>3. Verification Notes (Optional)</span>
              </div>

              <textarea
                rows={3}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Optional notes or details (e.g. Student USN, blockchain tx hash, or course identifier)..."
                className="w-full text-xs sm:text-sm bg-white border border-slate-200 rounded-lg p-3 text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors resize-none"
              />
            </div>
          </form>
        </div>

        {/* =====================================================
            MODAL FOOTER
        ====================================================== */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 hidden sm:block">
            {isSubmitting ? submitStep : "Secure cryptographic verification on Sepolia ledger"}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-full transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="verify-document-form"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] rounded-full shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Submit for Verification</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyDocumentModal;
