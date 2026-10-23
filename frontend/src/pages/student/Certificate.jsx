import { useState, useEffect } from "react";
<<<<<<< Updated upstream
import { uploadCertificate } from "../../services/certificateService";
import { createVerificationRequest } from "../../services/requestService";
import { getVerifiedOrganisations } from "../../services/adminService";
import { CredentialType, RequestType } from "../../utils/enums";
import MeshBackground from "../../components/common/MeshBackground";

const UploadCertificate = () => {
=======
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  uploadCertificate,
  getCertificates,
  getCertificateDocument,
} from "../../services/certificateService";
import {
  createVerificationRequest,
  getMyRequests,
} from "../../services/verificationService";
import { getVerifiedOrganisations } from "../../services/organisationService";

const Certificate = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  // Active view tab: "my-certs" | "upload" | "requests"
  const initialTab = searchParams.get("tab") || "my-certs";
  const [activeTab, setActiveTab] = useState(initialTab);
>>>>>>> Stashed changes

  // Data states
  const [certificates, setCertificates] = useState([]);
  const [requests, setRequests] = useState([]);
  const [organisations, setOrganisations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingUpload, setSubmittingUpload] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

  // Upload Form State
  const [formData, setFormData] = useState({
    certificateName: "",
    certificateType: "Course",
    issuer: "",
    issueDate: "",
    hasExpiry: "no",
    expiryDate: "",
    description: "",
  });
  const [file, setFile] = useState(null);

  // Request Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedCertForVerify, setSelectedCertForVerify] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [modalError, setModalError] = useState("");

  // Viewing certificate document loader
  const [viewingCertId, setViewingCertId] = useState(null);

  // Load all data on mount
  useEffect(() => {
    loadAllData();
  }, [currentUser]);

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "my-certs" || tab === "upload" || tab === "requests")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [certsRes, orgsRes, reqsRes] = await Promise.allSettled([
        getCertificates(),
        getVerifiedOrganisations(),
        getMyRequests(),
      ]);

      const certs =
        certsRes.status === "fulfilled" && certsRes.value
          ? Array.isArray(certsRes.value.certificates)
            ? certsRes.value.certificates
            : Array.isArray(certsRes.value)
            ? certsRes.value
            : []
          : [];

      const orgs =
        orgsRes.status === "fulfilled" && Array.isArray(orgsRes.value)
          ? orgsRes.value
          : [];

      const rawReqs =
        reqsRes.status === "fulfilled" && reqsRes.value
          ? Array.isArray(reqsRes.value.requests)
            ? reqsRes.value.requests
            : Array.isArray(reqsRes.value)
            ? reqsRes.value
            : []
          : [];

      // Filter requests to certificate verification requests
      const certRequests = rawReqs.filter(
        (r) => r.requestType === "certificate" || r.certificate || !r.project
      );

      setCertificates(certs);
      setOrganisations(orgs);
      setRequests(certRequests);
    } catch (err) {
      console.error("Failed to load certificate workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setStatusMessage({ type: "", text: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ─── 1. UPLOAD CERTIFICATE WORKFLOW (Upload First) ───────────────────────────
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: "", text: "" });

    if (!file) {
      setStatusMessage({ type: "error", text: "Please select a certificate document file (PDF, PNG, JPG)." });
      return;
    }

    if (!formData.certificateName || !formData.issuer || !formData.issueDate) {
      setStatusMessage({ type: "error", text: "Please provide Certificate Name, Issuer, and Issue Date." });
      return;
    }

    setSubmittingUpload(true);
    try {
      const user = currentUser || JSON.parse(localStorage.getItem("user") || "{}");
      const uploadPayload = new FormData();
      uploadPayload.append("student", user._id || user.id);
      uploadPayload.append("certificateName", formData.certificateName);
      uploadPayload.append("issuer", formData.issuer);
      uploadPayload.append("certificateType", formData.certificateType);
      uploadPayload.append("issueDate", formData.issueDate);
      if (formData.hasExpiry === "yes" && formData.expiryDate) {
        uploadPayload.append("expiryDate", formData.expiryDate);
      }
      uploadPayload.append("description", formData.description);
      uploadPayload.append("certificate", file);

      const res = await uploadCertificate(uploadPayload);
      const newCert = res.certificate;

      setStatusMessage({
        type: "success",
        text: `✓ "${formData.certificateName}" uploaded successfully! You can now request verification below whenever you're ready.`,
      });

      // Reset form
      setFormData({
        certificateName: "",
        certificateType: "Course",
        issuer: "",
        issueDate: "",
        hasExpiry: "no",
        expiryDate: "",
        description: "",
<<<<<<< Updated upstream
        hasExpiry: "",
    });

    const [organisations, setOrganisations] = useState([]);
    const [selectedIssuerWallet, setSelectedIssuerWallet] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: "", text: "" });

    const [darkMode] = useState(() => {
        return localStorage.getItem("skillsync-theme") !== "light";
    });

    useEffect(() => {
        const loadOrganisations = async () => {
            try {
                const data = await getVerifiedOrganisations();
                setOrganisations(data || []);
            } catch (error) {
                console.error("Failed to load organisations:", error);
            }
        };

        loadOrganisations();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleIssuerChange = (e) => {
        const wallet = e.target.value;
        setSelectedIssuerWallet(wallet);

        const organisation = organisations.find(
            (org) => org.walletAddress === wallet
        );

        setFormData({
            ...formData,
            issuer: organisation?.organisationName || "",
        });
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: "", text: "" });

        let expiry = 0;
        if (formData.hasExpiry === "yes" && formData.expiryDate) {
            expiry = Math.floor(new Date(formData.expiryDate).getTime() / 1000);
        }

        if (!file) {
            setStatusMessage({ type: "error", text: "Please select a certificate file." });
            return;
        }

        if (!selectedIssuerWallet) {
            setStatusMessage({ type: "error", text: "Please select an issuing organisation." });
            return;
        }

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem("user") || "{}");

            const data = new FormData();
            data.append("student", user._id);
            data.append("certificateName", formData.certificateName);
            data.append("issuer", formData.issuer);
            data.append("certificateType", formData.certificateType);
            data.append("issueDate", formData.issueDate);
            data.append("expiryDate", formData.expiryDate || "");
            data.append("description", formData.description);
            data.append("certificate", file);
            data.append("hasExpiry", formData.hasExpiry === "yes");

            setStatusMessage({ type: "info", text: "Uploading certificate to Cloudinary and generating SHA-256 hash..." });
            const response = await uploadCertificate(data);
            console.log("Certificate uploaded:", response.certificate);

            try {
                const hash = response.hashBytes32;
                setStatusMessage({ type: "info", text: "Prompting MetaMask to create on-chain verification request..." });

                const txHash = await createVerificationRequest(
                    hash,
                    CredentialType.Certificate,
                    RequestType.AddCertificate,
                    selectedIssuerWallet,
                    expiry
                );

                console.log("Verification request tx:", txHash);
                setStatusMessage({
                    type: "success",
                    text: `✓ Certificate uploaded and verification request created on-chain! Tx: ${txHash.slice(0, 16)}...`
                });

                // Reset form
                setFormData({
                    certificateName: "",
                    issuer: "",
                    certificateType: "",
                    issueDate: "",
                    expiryDate: "",
                    description: "",
                    hasExpiry: "",
                });
                setSelectedIssuerWallet("");
                setFile(null);

            } catch (blockchainError) {
                console.error("Blockchain error:", blockchainError);
                const errMsg = blockchainError.shortMessage || blockchainError.reason || blockchainError.message || "Blockchain transaction failed";
                setStatusMessage({
                    type: "error",
                    text: `Certificate uploaded off-chain, but on-chain request failed: ${errMsg}`
                });
            }
        } catch (error) {
            console.error("Upload error:", error);
            setStatusMessage({
                type: "error",
                text: error.response?.data?.message || error.message || "Upload Failed"
            });
        } finally {
            setLoading(false);
        }
    };

    return (

        <div
            className={`relative min-h-screen overflow-hidden px-6 py-10 transition-colors duration-500 ${darkMode
                ? "bg-[#070B14] text-white"
                : "bg-[#F6F8FC] text-slate-900"
                }`}
        >

            {/* ================= MESH ================= */}

            <MeshBackground darkMode={darkMode} />


            {/* ================= BACKGROUND GLOW ================= */}

            <div
                className={`pointer-events-none fixed -left-40 -top-40 h-96 w-96 rounded-full blur-[130px] ${darkMode
                    ? "bg-blue-600/15"
                    : "bg-blue-500/10"
                    }`}
            />

            <div
                className={`pointer-events-none fixed -bottom-40 -right-40 h-96 w-96 rounded-full blur-[130px] ${darkMode
                    ? "bg-violet-600/15"
                    : "bg-violet-500/10"
                    }`}
            />


            {/* ================= MAIN ================= */}

            <div className="relative z-10 mx-auto max-w-4xl">


                {/* ================= HEADER ================= */}

                <div className="mb-8">

                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-500">
                        Credentials
                    </p>

                    <h1
                        className={`mt-2 text-3xl font-bold tracking-tight sm:text-4xl ${darkMode
                            ? "text-white"
                            : "text-slate-900"
                            }`}
                    >
                        Upload Certificate
                    </h1>

                    <p
                        className={`mt-3 max-w-2xl text-sm leading-6 ${darkMode
                            ? "text-slate-400"
                            : "text-slate-500"
                            }`}
                    >
                        Add a credential to your SkillSync identity
                        and send it to a verified organisation for
                        verification.
                    </p>

                </div>


                {/* ================= CARD ================= */}

                <div
                    className={`rounded-3xl border p-7 shadow-2xl backdrop-blur-xl sm:p-9 ${darkMode
                        ? "border-white/10 bg-white/[0.045] shadow-black/30"
                        : "border-slate-200 bg-white/90 shadow-slate-200/70"
                        }`}
                >


                    {/* ================= SECTION HEADER ================= */}

                    <div
                        className={`mb-8 flex items-center gap-4 border-b pb-6 ${darkMode
                            ? "border-white/10"
                            : "border-slate-200"
                            }`}
                    >

                        <div
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-blue-50 text-blue-600"
                                }`}
                        >
                            ◈
                        </div>

                        <div>

                            <h2 className="text-lg font-semibold">
                                Credential Details
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Enter the information exactly as it
                                appears on your credential.
                            </p>

                        </div>

                    </div>


                    {/* ================= FORM ================= */}

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-7"
                    >


                        {/* ================= CERTIFICATE NAME ================= */}

                        <div>

                            <label
                                className={`mb-2 block text-sm font-semibold ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                    }`}
                            >
                                Certificate Name
                            </label>

                            <input
                                type="text"
                                name="certificateName"
                                value={
                                    formData.certificateName
                                }
                                onChange={handleChange}
                                className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                    ? "border-white/10 bg-white/[0.04] text-white placeholder-slate-600 focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    }`}
                                placeholder="AWS Cloud Practitioner"
                                required
                            />

                        </div>


                        {/* ================= TYPE ================= */}

                        <div>

                            <label
                                className={`mb-2 block text-sm font-semibold ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                    }`}
                            >
                                Credential Type
                            </label>

                            <select
                                name="certificateType"
                                value={
                                    formData.certificateType
                                }
                                onChange={handleChange}
                                className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                    ? "border-white/10 bg-[#111722] text-white focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    }`}
                                required
                            >

                                <option value="">
                                    Select Credential Type
                                </option>

                                <option value="Course">
                                    Course
                                </option>

                                <option value="Internship">
                                    Internship
                                </option>

                                <option value="Workshop">
                                    Workshop
                                </option>

                                <option value="Hackathon">
                                    Hackathon
                                </option>

                                <option value="Competition">
                                    Competition
                                </option>

                                <option value="Professional">
                                    Professional
                                </option>

                            </select>

                        </div>


                        {/* ================= DATES ================= */}

                        <div className="grid gap-6 sm:grid-cols-2">

                            <div>

                                <label
                                    className={`mb-2 block text-sm font-semibold ${darkMode
                                        ? "text-slate-300"
                                        : "text-slate-700"
                                        }`}
                                >
                                    Issue Date
                                </label>

                                <input
                                    type="date"
                                    name="issueDate"
                                    value={
                                        formData.issueDate
                                    }
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                        ? "border-white/10 bg-white/[0.04] text-white focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                                        : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        }`}
                                    required
                                />

                            </div>


                            <div>

                                <label
                                    className={`mb-2 block text-sm font-semibold ${darkMode
                                        ? "text-slate-300"
                                        : "text-slate-700"
                                        }`}
                                >
                                    Does this credential expire?
                                </label>

                                <select
                                    name="hasExpiry"
                                    value={
                                        formData.hasExpiry
                                    }
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                        ? "border-white/10 bg-[#111722] text-white focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                                        : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        }`}
                                >

                                    <option value="yes">
                                        Yes
                                    </option>

                                    <option value="no">
                                        No
                                    </option>

                                </select>


                                {formData.hasExpiry === "yes" && (

                                    <div className="mt-5">

                                        <label
                                            className={`mb-2 block text-sm font-semibold ${darkMode
                                                ? "text-slate-300"
                                                : "text-slate-700"
                                                }`}
                                        >
                                            Expiry Date
                                        </label>

                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={
                                                formData.expiryDate
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                                ? "border-white/10 bg-white/[0.04] text-white focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10"
                                                : "border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                                }`}
                                            required
                                        />

                                    </div>

                                )}

                            </div>

                        </div>


                        {/* ================= ISSUER ================= */}

                        <div>

                            <label
                                className={`mb-2 block text-sm font-semibold ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                    }`}
                            >
                                Select Issuer
                            </label>

                            <select
                                value={
                                    selectedIssuerWallet
                                }
                                onChange={
                                    handleIssuerChange
                                }
                                className={`w-full rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                    ? "border-white/10 bg-[#111722] text-white focus:border-violet-500/60 focus:ring-4 focus:ring-violet-500/10"
                                    : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                    }`}
                                required
                            >

                                <option value="">
                                    Select Issuer
                                </option>

                                {organisations.map((org) => (

                                    <option
                                        key={org._id}
                                        value={org.walletAddress}
                                    >
                                        {org.organisationName}
                                    </option>

                                ))}

                            </select>


                            {formData.issuer && (

                                <div
                                    className={`mt-3 flex items-center gap-2 rounded-xl px-4 py-3 text-xs ${darkMode
                                        ? "bg-emerald-500/5 text-emerald-400"
                                        : "bg-emerald-50 text-emerald-600"
                                        }`}
                                >

                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                                    Issuer selected: {formData.issuer}

                                </div>

                            )}

                        </div>


                        {/* ================= DESCRIPTION ================= */}

                        <div>

                            <label
                                className={`mb-2 block text-sm font-semibold ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                    }`}
                            >
                                Description
                            </label>

                            <textarea
                                rows="4"
                                name="description"
                                value={
                                    formData.description
                                }
                                onChange={handleChange}
                                className={`w-full resize-none rounded-xl border px-4 py-3.5 outline-none transition ${darkMode
                                    ? "border-white/10 bg-white/[0.04] text-white placeholder-slate-600 focus:border-blue-500/60 focus:bg-white/[0.07] focus:ring-4 focus:ring-blue-500/10"
                                    : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                    }`}
                                placeholder="Additional details..."
                            />

                        </div>


                        {/* ================= FILE ================= */}

                        <div>

                            <label
                                className={`mb-2 block text-sm font-semibold ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                    }`}
                            >
                                Certificate File
                            </label>

                            <div
                                className={`rounded-2xl border border-dashed p-6 ${darkMode
                                    ? "border-white/15 bg-white/[0.025]"
                                    : "border-slate-300 bg-slate-50"
                                    }`}
                            >

                                <div className="text-center">

                                    <div
                                        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl ${darkMode
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "bg-blue-50 text-blue-600"
                                            }`}
                                    >
                                        ↑
                                    </div>

                                    <p className="mt-3 text-sm font-semibold">
                                        Upload your credential
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        PDF, JPG, JPEG or PNG
                                    </p>

                                </div>


                                <input
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileChange}
                                    className={`mt-5 w-full rounded-xl border px-4 py-3 text-sm ${darkMode
                                        ? "border-white/10 bg-white/[0.04] text-slate-300"
                                        : "border-slate-200 bg-white text-slate-600"
                                        }`}
                                    required
                                />


                                {file && (

                                    <div
                                        className={`mt-3 rounded-xl px-4 py-3 text-xs ${darkMode
                                            ? "bg-emerald-500/5 text-emerald-400"
                                            : "bg-emerald-50 text-emerald-600"
                                            }`}
                                    >
                                        ✓ {file.name}
                                    </div>

                                )}

                            </div>

                        </div>


                        {/* ================= STATUS BANNER ================= */}
                        {statusMessage.text && (
                            <div
                                className={`rounded-2xl p-4 text-sm font-medium ${
                                    statusMessage.type === "success"
                                        ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                        : statusMessage.type === "error"
                                        ? "border border-red-500/30 bg-red-500/10 text-red-400"
                                        : "border border-blue-500/30 bg-blue-500/10 text-blue-400"
                                }`}
                            >
                                {statusMessage.text}
                            </div>
                        )}

                        {/* ================= SUBMIT ================= */}

                        <div
                            className={`border-t pt-7 ${darkMode
                                ? "border-white/10"
                                : "border-slate-200"
                                }`}
                        >

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 ${
                                    loading ? "cursor-not-allowed opacity-60" : ""
                                }`}
                            >
                                {loading ? "Uploading & Creating On-Chain Request..." : "Upload Certificate & Request Verification →"}
                            </button>

                            <p className="mt-3 text-center text-xs text-slate-500">
                                Your credential will be submitted for
                                on-chain organisation verification.
                            </p>

                        </div>

                    </form>

                </div>

=======
      });
      setFile(null);

      // Refresh data and switch to My Certificates view
      await loadAllData();
      handleTabChange("my-certs");
    } catch (err) {
      console.error("Upload error:", err);
      setStatusMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to upload certificate.",
      });
    } finally {
      setSubmittingUpload(false);
    }
  };

  // ─── 2. REQUEST VERIFICATION WORKFLOW ───────────────────────────────────────
  const openVerifyModal = (cert = null) => {
    setSelectedCertForVerify(cert || (unverifiedCertificates[0] || null));
    setSelectedOrgId("");
    setVerifyNotes("");
    setModalError("");
    setIsVerifyModalOpen(true);
  };

  const closeVerifyModal = () => {
    setIsVerifyModalOpen(false);
    setSelectedCertForVerify(null);
    setSelectedOrgId("");
    setVerifyNotes("");
    setModalError("");
  };

  const handleSubmitVerificationRequest = async (e) => {
    e.preventDefault();
    if (!selectedCertForVerify) {
      setModalError("Please select a certificate to verify.");
      return;
    }
    if (!selectedOrgId) {
      setModalError("Please select an approved organisation to review your credential.");
      return;
    }

    setSubmittingRequest(true);
    setModalError("");
    try {
      const certId = selectedCertForVerify._id || selectedCertForVerify.certificateHash;
      await createVerificationRequest({
        certificateId: certId,
        organisationId: selectedOrgId,
        notes: verifyNotes,
      });

      closeVerifyModal();
      setStatusMessage({
        type: "success",
        text: `✓ Verification request submitted for "${selectedCertForVerify.certificateName}". Waiting for organisation review.`,
      });

      await loadAllData();
      handleTabChange("requests");
    } catch (err) {
      console.error("Verification request error:", err);
      setModalError(
        err.response?.data?.message || err.message || "Failed to submit verification request."
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  // ─── 3. VIEW CERTIFICATE DOCUMENT ───────────────────────────────────────────
  const handleViewCertificate = async (certificate) => {
    const certId = certificate._id || certificate.certificateHash;
    const directUrl = certificate.certificateURL;
    const hashOrId = certificate.certificateHash || certificate._id;

    if (!directUrl && !hashOrId) {
      alert("No certificate document or hash available for this certificate.");
      return;
    }

    setViewingCertId(certId);
    const docWindow = window.open("about:blank", "_blank");
    if (!docWindow) {
      setViewingCertId(null);
      alert("Popup blocked by browser. Please allow popups for this site.");
      return;
    }

    docWindow.opener = null;

    try {
      docWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Certificate - ${certificate.certificateName || "SkillSync"}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                margin: 0;
                background-color: #F3F6F8;
                color: #191919;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                font-family: system-ui, -apple-system, sans-serif;
              }
              .loader-card {
                text-align: center;
                background: #FFFFFF;
                border: 1px solid #D9E1E8;
                border-radius: 12px;
                padding: 32px 40px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
              }
              .spinner {
                width: 32px;
                height: 32px;
                border: 3px solid #E8F3FF;
                border-top-color: #0A66C2;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
                margin: 0 auto 16px;
              }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="loader-card">
              <div class="spinner"></div>
              <h3 style="margin: 0 0 8px; font-size: 16px;">Loading Certificate</h3>
              <p style="margin: 0; font-size: 13px; color: #666666;">Fetching verified document...</p>
>>>>>>> Stashed changes
            </div>
          </body>
        </html>
      `);

      if (hashOrId) {
        try {
          const docBlobUrl = await getCertificateDocument(hashOrId);
          docWindow.location.href = docBlobUrl;
          return;
        } catch (streamErr) {
          console.warn("Backend stream failed, attempting direct URL:", streamErr);
        }
      }

      if (directUrl) {
        docWindow.location.href = directUrl;
        return;
      }

      throw new Error("Certificate document file not available.");
    } catch (err) {
      console.error("View certificate error:", err);
      docWindow.close();
      alert("Failed to load certificate document: " + (err.response?.data?.message || err.message));
    } finally {
      setViewingCertId(null);
    }
  };

  // Helper check for verification status
  const isCertificateVerified = (cert) => {
    const status = String(cert.verificationStatus || "").toUpperCase();
    return (
      cert.verifiedOnChain === true ||
      status === "VERIFIED" ||
      status === "ACCEPTED" ||
      status === "APPROVED"
    );
  };

  // Helper check if certificate has active request
  const getCertificateActiveRequest = (cert) => {
    const certId = String(cert._id || "");
    const certHash = String(cert.certificateHash || "").toLowerCase();

    return requests.find((r) => {
      const reqCertId = String(r.certificate?._id || r.certificate || "");
      const reqHash = String(r.credentialHash || "").toLowerCase();
      return (
        (certId && reqCertId === certId) ||
        (certHash && reqHash === certHash)
      );
    });
  };

  const verifiedCertificates = certificates.filter(isCertificateVerified);
  const unverifiedCertificates = certificates.filter((c) => !isCertificateVerified(c));

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] font-sans">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D9E1E8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-1.5 focus:outline-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                S
              </span>
              <span className="text-xl font-bold tracking-tight text-[#191919]">
                Skill<span className="text-[#0A66C2]">Sync</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#666666]">
              <Link to="/student/dashboard" className="hover:text-[#0A66C2] transition-colors">
                Dashboard
              </Link>
              <Link to="/student/profile" className="hover:text-[#0A66C2] transition-colors">
                Profile
              </Link>
              <Link to="/student/certificates" className="text-[#0A66C2] font-semibold">
                Certificates
              </Link>
              <Link to="/student/projects" className="hover:text-[#0A66C2] transition-colors">
                Projects
              </Link>
              <Link to="/student/jobs" className="hover:text-[#0A66C2] transition-colors">
                Jobs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTabChange("upload")}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs cursor-pointer"
            >
              + Upload Certificate
            </button>
            <Link
              to="/student/profile"
              className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition"
            >
              View Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb / Back Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#191919] transition cursor-pointer"
          >
            ← Back
          </button>
          <div className="text-xs text-[#666666]">
            Total Certificates: <strong className="text-[#191919]">{certificates.length}</strong> (
            <span className="text-[#16805D] font-semibold">{verifiedCertificates.length} Verified</span>)
          </div>
        </div>

        {/* Page Title Card */}
        <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] text-sm">
                  📜
                </span>
                <h1 className="text-2xl font-bold tracking-tight text-[#191919]">
                  Certificate Management & Verification
                </h1>
              </div>
              <p className="mt-1 text-xs text-[#666666]">
                Upload your credential documents first, then submit verification requests to approved organisations for on-chain attestation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openVerifyModal()}
                disabled={unverifiedCertificates.length === 0}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#0A66C2] bg-[#E8F3FF] border border-[#0A66C2]/30 rounded-md hover:bg-[#D0E6FF] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Request Verification
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("upload")}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs cursor-pointer"
              >
                + Upload New
              </button>
            </div>
          </div>

          {/* Tab Navigation Bar */}
          <div className="mt-6 flex items-center gap-2 border-b border-[#D9E1E8] pt-2 text-sm font-semibold">
            <button
              onClick={() => handleTabChange("my-certs")}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === "my-certs"
                  ? "border-[#0A66C2] text-[#0A66C2]"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              My Certificates ({certificates.length})
            </button>
            <button
              onClick={() => handleTabChange("requests")}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === "requests"
                  ? "border-[#0A66C2] text-[#0A66C2]"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              Verification Requests ({requests.length})
            </button>
            <button
              onClick={() => handleTabChange("upload")}
              className={`pb-3 px-3 transition-colors border-b-2 cursor-pointer ${
                activeTab === "upload"
                  ? "border-[#0A66C2] text-[#0A66C2]"
                  : "border-transparent text-[#666666] hover:text-[#191919]"
              }`}
            >
              + Upload Certificate
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMessage.text && (
          <div
            className={`rounded-md border p-3.5 text-xs font-medium ${
              statusMessage.type === "success"
                ? "border-[#16805D]/30 bg-[#E6F4EA] text-[#16805D]"
                : statusMessage.type === "error"
                ? "border-[#C5221F]/30 bg-[#FCE8E6] text-[#C5221F]"
                : "border-[#0A66C2]/30 bg-[#E8F3FF] text-[#0A66C2]"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 1: MY CERTIFICATES LIST
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "my-certs" && (
          <div className="space-y-4">
            {loading ? (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center text-xs text-[#666666]">
                Loading certificates…
              </div>
            ) : certificates.length === 0 ? (
              <div className="rounded-xl border border-[#D9E1E8] bg-white p-12 text-center space-y-3 shadow-xs">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#E8F3FF] text-xl text-[#0A66C2]">
                  📜
                </div>
                <h3 className="text-base font-bold text-[#191919]">No certificates uploaded yet</h3>
                <p className="text-xs text-[#666666] max-w-sm mx-auto">
                  First, upload your diploma or training certificate document to your secure locker. Afterwards, you can submit a verification request to an accredited organisation.
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("upload")}
                  className="inline-block rounded-md bg-[#0A66C2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#004182] transition shadow-xs cursor-pointer"
                >
                  Upload Your First Certificate
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {certificates.map((cert) => {
                  const certId = cert._id || cert.certificateHash;
                  const isVerified = isCertificateVerified(cert);
                  const activeReq = getCertificateActiveRequest(cert);
                  const isViewingThis = viewingCertId === certId;

                  return (
                    <div
                      key={certId}
                      className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs hover:border-[#0A66C2] transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-[#191919]">
                              {cert.certificateName || "Academic Credential"}
                            </h3>

                            {/* Status Badge */}
                            {isVerified ? (
                              <span className="rounded-md bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20 px-2 py-0.5 text-[11px] font-semibold">
                                ✓ Verified On-Chain
                              </span>
                            ) : activeReq && String(activeReq.status).toUpperCase() === "PENDING" ? (
                              <span className="rounded-md bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20 px-2 py-0.5 text-[11px] font-semibold">
                                ⏳ Pending Organisation Review
                              </span>
                            ) : activeReq && String(activeReq.status).toUpperCase() === "REJECTED" ? (
                              <span className="rounded-md bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20 px-2 py-0.5 text-[11px] font-semibold">
                                ✕ Rejected
                              </span>
                            ) : (
                              <span className="rounded-md bg-[#F3F6F8] text-[#666666] border border-[#D9E1E8] px-2 py-0.5 text-[11px] font-semibold">
                                Unverified Credential
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-[#666666]">
                            Issuer: <strong className="text-[#191919]">{cert.issuer || "Accredited Organisation"}</strong>
                            {cert.certificateType && ` · ${cert.certificateType}`}
                            {cert.issueDate && ` · Issued: ${new Date(cert.issueDate).toLocaleDateString()}`}
                          </p>

                          {cert.description && (
                            <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">
                              {cert.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                          <button
                            type="button"
                            onClick={() => handleViewCertificate(cert)}
                            disabled={isViewingThis}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D9E1E8] bg-white text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
                          >
                            {isViewingThis ? "Loading…" : "View Document"}
                          </button>

                          {!isVerified && (
                            <button
                              type="button"
                              onClick={() => openVerifyModal(cert)}
                              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs cursor-pointer"
                            >
                              Request Verification
                            </button>
                          )}

                          {isVerified && (cert.certificateHash || cert._id) && (
                            <Link
                              to={`/verify/${cert.certificateHash || cert._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#0A66C2] text-white hover:bg-[#004182] transition shadow-xs flex items-center gap-1"
                            >
                              <span>Verify Credential & QR</span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Technical Footnote (Cryptographic Hash) */}
                      <div className="mt-4 pt-3 border-t border-[#D9E1E8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#666666]">
                        <div className="flex items-center gap-2">
                          <span>SHA-256 Hash:</span>
                          <span className="font-mono text-[11px] text-[#191919] bg-[#F3F6F8] px-2 py-0.5 rounded border border-[#D9E1E8]">
                            {cert.certificateHash
                              ? `${cert.certificateHash.slice(0, 10)}…${cert.certificateHash.slice(-8)}`
                              : "Stored securely"}
                          </span>
                        </div>

                        {activeReq && (
                          <div className="text-[11px] text-[#666666]">
                            Reviewer: <strong className="text-[#191919]">{activeReq.organisation?.organisationName || "Organisation"}</strong>
                            {activeReq.rejectionReason && (
                              <span className="text-[#C5221F] ml-1">· Reason: {activeReq.rejectionReason}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 2: UPLOAD CERTIFICATE FORM (Step 1)
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "upload" && (
          <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 sm:p-8 shadow-xs max-w-2xl mx-auto">
            <div className="border-b border-[#D9E1E8] pb-4 mb-6">
              <h2 className="text-lg font-bold text-[#191919]">Step 1: Upload Certificate Document</h2>
              <p className="text-xs text-[#666666] mt-0.5">
                Upload your credential to your SkillSync locker. You can request on-chain verification from an accredited organisation at any time after uploading.
              </p>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Certificate Name *
                </label>
                <input
                  type="text"
                  name="certificateName"
                  value={formData.certificateName}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. AWS Certified Solutions Architect, B.E. Computer Science"
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Credential Type *
                  </label>
                  <select
                    name="certificateType"
                    value={formData.certificateType}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="Course">Course Certificate</option>
                    <option value="Internship">Internship Completion</option>
                    <option value="Degree">Academic Degree / Diploma</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon Award</option>
                    <option value="Competition">Competition</option>
                    <option value="Professional">Professional Certification</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Issuer / Institution Name *
                  </label>
                  <input
                    type="text"
                    name="issuer"
                    value={formData.issuer}
                    onChange={handleFormChange}
                    required
                    placeholder="e.g. Stanford University, Coursera, IBM"
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    name="issueDate"
                    value={formData.issueDate}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Does this credential expire?
                  </label>
                  <select
                    name="hasExpiry"
                    value={formData.hasExpiry}
                    onChange={handleFormChange}
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                  >
                    <option value="no">No Expiry</option>
                    <option value="yes">Yes, Expiration Date</option>
                  </select>
                </div>
              </div>

              {formData.hasExpiry === "yes" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleFormChange}
                    required={formData.hasExpiry === "yes"}
                    className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Description / Acquired Skills
                </label>
                <textarea
                  rows="2"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Summary of course content, score, or skills covered..."
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Certificate Document File (PDF, PNG, JPG) *
                </label>
                <div className="rounded-lg border-2 border-dashed border-[#D9E1E8] bg-[#F3F6F8] p-5 text-center">
                  <input
                    type="file"
                    id="cert-file-input"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={handleFileChange}
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="cert-file-input"
                    className="cursor-pointer inline-flex flex-col items-center justify-center space-y-1.5"
                  >
                    <span className="text-2xl">📄</span>
                    <span className="text-xs font-semibold text-[#0A66C2] hover:underline">
                      {file ? file.name : "Click to select certificate document"}
                    </span>
                    <span className="text-[11px] text-[#666666]">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, PNG, or JPEG up to 10MB"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#D9E1E8]">
                <button
                  type="button"
                  onClick={() => handleTabChange("my-certs")}
                  className="px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#191919] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpload}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingUpload ? "Uploading Document…" : "Upload Certificate to Locker"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            TAB 3: VERIFICATION REQUESTS HISTORY
        ═════════════════════════════════════════════════════════════════════ */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#D9E1E8]">
                <div>
                  <h2 className="text-base font-bold text-[#191919]">Submitted Verification Requests</h2>
                  <p className="text-xs text-[#666666]">
                    Track the attestation status of certificate requests assigned to accredited organisations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openVerifyModal()}
                  disabled={unverifiedCertificates.length === 0}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  + New Verification Request
                </button>
              </div>

              {requests.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F3FF] text-lg text-[#0A66C2]">
                    ⏳
                  </div>
                  <h3 className="text-sm font-semibold text-[#191919]">No verification requests submitted</h3>
                  <p className="text-xs text-[#666666] max-w-sm mx-auto">
                    Once you upload a certificate, click "Request Verification" to send it to an accredited organisation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {requests.map((req, idx) => {
                    const status = String(req.status || "PENDING").toUpperCase();
                    const reqId = req.blockchainRequestId || req._id || idx + 1;
                    const orgName = req.organisation?.organisationName || req.organisation?.email || "Organisation";
                    const certTitle = req.certificate?.certificateName || "Certificate Credential";

                    return (
                      <div
                        key={req._id || idx}
                        className="p-4 rounded-lg border border-[#D9E1E8] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#191919]">Request #{reqId}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                status === "APPROVED" || status === "VERIFIED"
                                  ? "bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20"
                                  : status === "REJECTED"
                                  ? "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/20"
                                  : "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/20"
                              }`}
                            >
                              {status === "APPROVED" || status === "VERIFIED"
                                ? "✓ Verified & Approved"
                                : status === "REJECTED"
                                ? "✕ Rejected"
                                : "⏳ Pending Review"}
                            </span>
                          </div>

                          <p className="text-xs text-[#191919]">
                            Credential: <strong className="font-semibold">{certTitle}</strong>
                          </p>
                          <p className="text-xs text-[#666666]">
                            Assigned Organisation: <strong className="text-[#191919]">{orgName}</strong>
                            {req.createdAt && ` · Submitted: ${new Date(req.createdAt).toLocaleDateString()}`}
                          </p>
                          {req.rejectionReason && (
                            <p className="text-xs text-[#C5221F] font-medium">
                              Rejection Reason: {req.rejectionReason}
                            </p>
                          )}
                        </div>

                        {req.txHash && (
                          <div className="text-[11px] font-mono text-[#666666] self-start sm:self-auto bg-[#F3F6F8] px-2 py-1 rounded border border-[#D9E1E8]">
                            Tx: {req.txHash.slice(0, 10)}…{req.txHash.slice(-8)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ═════════════════════════════════════════════════════════════════════
          MODAL: REQUEST VERIFICATION (Step 2 Workflow)
      ═════════════════════════════════════════════════════════════════════ */}
      {isVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-[#D9E1E8] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9E1E8] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#191919]">Request Certificate Verification</h3>
                <p className="text-xs text-[#666666]">
                  Select an accredited organisation to review and sign your credential on-chain.
                </p>
              </div>
              <button
                type="button"
                onClick={closeVerifyModal}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="rounded-md border border-[#C5221F]/30 bg-[#FCE8E6] p-3 text-xs text-[#C5221F] font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitVerificationRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Select Certificate *
                </label>
                <select
                  value={selectedCertForVerify?._id || ""}
                  onChange={(e) => {
                    const c = certificates.find((item) => item._id === e.target.value);
                    setSelectedCertForVerify(c || null);
                  }}
                  required
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                >
                  {unverifiedCertificates.length === 0 ? (
                    <option value="">No unverified certificates available</option>
                  ) : (
                    unverifiedCertificates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.certificateName} ({c.issuer})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Select Approved Organisation *
                </label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  required
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] focus:border-[#0A66C2] focus:outline-none"
                >
                  <option value="">-- Choose Organisation --</option>
                  {organisations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.organisationName} {org.walletAddress ? `(${org.walletAddress.slice(0, 6)}…${org.walletAddress.slice(-4)})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-[#666666]">
                  The organisation will receive your certificate document and verify its authenticity on the blockchain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#666666] mb-1.5">
                  Notes / Reference ID (Optional)
                </label>
                <textarea
                  rows="2"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Student ID, Roll number, Course batch or instructor name..."
                  className="w-full rounded-md border border-[#D9E1E8] bg-white px-3 py-2 text-sm text-[#191919] placeholder-[#999999] focus:border-[#0A66C2] focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#D9E1E8]">
                <button
                  type="button"
                  onClick={closeVerifyModal}
                  className="px-4 py-2 text-xs font-semibold text-[#666666] hover:text-[#191919] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRequest || !selectedCertForVerify || !selectedOrgId}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submittingRequest ? "Submitting Request…" : "Submit Verification Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificate;