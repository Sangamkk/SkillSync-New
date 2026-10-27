import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerStudent, sendVerificationCode, verifyCode } from "../services/authService";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Account", "Academic", "Review"];

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  usn: "",
  college: "",
  organizationName: "",
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email Verification States
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [otpCode, setOtpCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState({ type: "", text: "" });

  // Countdown timer for resending code
  useEffect(() => {
    let timer;
    if (codeCooldown > 0) {
      timer = setTimeout(() => setCodeCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  const update = (field, val) => {
    setForm((f) => ({ ...f, [field]: val }));
    // If email is changed after verification, invalidate verification
    if (field === "email" && isVerified && val.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
      setIsVerified(false);
      setVerifiedEmail("");
      setIsCodeSent(false);
      setOtpCode("");
      setOtpMessage({ type: "info", text: "Email changed. Please verify your new email address." });
    }
  };

  const handleSendCode = async () => {
    setError("");
    setOtpMessage({ type: "", text: "" });

    const email = form.email.trim();
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSendingCode(true);
    try {
      const res = await sendVerificationCode(email);
      setIsCodeSent(true);
      setCodeCooldown(60);
      setOtpMessage({
        type: "success",
        text: res.message || "Verification code sent to your email! Please check your inbox.",
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to send verification code. Please try again.";
      setOtpMessage({ type: "error", text: msg });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setOtpMessage({ type: "", text: "" });

    const email = form.email.trim();
    const code = otpCode.trim();

    if (!code) {
      setOtpMessage({ type: "error", text: "Please enter the 6-digit verification code." });
      return;
    }

    setVerifyingCode(true);
    try {
      const res = await verifyCode(email, code);
      setIsVerified(true);
      setVerifiedEmail(email);
      setOtpMessage({
        type: "success",
        text: res.message || "✓ Email verified successfully!",
      });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Invalid or expired verification code.";
      setOtpMessage({ type: "error", text: msg });
    } finally {
      setVerifyingCode(false);
    }
  };

  const validateStep = () => {
    setError("");
    if (step === 0) {
      if (!form.name.trim()) return setError("Name is required."), false;
      if (!form.email.trim()) return setError("Email is required."), false;
      if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email."), false;
      
      // Enforce email verification
      if (!isVerified || form.email.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
        setError("Please verify your email address with the verification code before continuing.");
        return false;
      }

      if (form.password.length < 8) return setError("Password must be at least 8 characters."), false;
      if (form.password !== form.confirmPassword) return setError("Passwords do not match."), false;
    }
    if (step === 1) {
      if (!form.usn.trim()) return setError("USN / Roll Number is required."), false;
      if (!form.college.trim()) return setError("College / University name is required."), false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleBack = () => {
    setError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const { name, email, password, usn, college, organizationName } = form;
      const data = await registerStudent({ name, email, password, usn, college, organizationName });
      if (data.token && data.user) {
        login(data.token, data.user);
        navigate("/student/dashboard", { replace: true });
      } else {
        navigate("/login", { state: { registered: true } });
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Registration failed. Please try again.";
      setError(msg);
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Top Back Nav */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:underline"
          >
            ← Back to Home
          </Link>
          <Link
            to="/login"
            className="text-xs font-semibold text-[#0A66C2] hover:underline"
          >
            Sign in instead →
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 justify-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
              S
            </span>
            <span className="text-2xl font-bold tracking-tight text-[#191919]">
              Skill<span className="text-[#0A66C2]">Sync</span>
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight text-[#191919]">
            Create your student profile
          </h2>
          <p className="mt-1 text-xs text-[#666666]">
            Join the verified academic & skill credential registry
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((label, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-all ${
                  i < step
                    ? "bg-[#16805D] border-[#16805D] text-white"
                    : i === step
                    ? "border-[#0A66C2] bg-[#E8F3FF] text-[#0A66C2] font-bold"
                    : "border-[#D9E1E8] bg-white text-[#666666]"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] ${i === step ? "text-[#0A66C2] font-semibold" : "text-[#666666]"}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-xl border border-[#D9E1E8] shadow-xs">
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-[#FCE8E6] border border-[#C5221F]/30 text-[#C5221F] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Step 0 — Account Information */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#191919] uppercase tracking-wider">Account Information</h3>
              
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>

              {/* Email Address with Verification Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#191919]">Email Address</label>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#16805D] bg-[#E6F4EA] px-2 py-0.5 rounded-full border border-[#16805D]/20">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <div className="relative flex items-center">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    disabled={isVerified}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className={`w-full px-3.5 py-2 text-sm rounded-md border ${
                      isVerified
                        ? "border-[#16805D]/40 bg-[#F7FAF8] text-[#191919]"
                        : "border-[#D9E1E8] bg-white text-[#191919]"
                    } placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] pr-24`}
                  />

                  {!isVerified ? (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendingCode || codeCooldown > 0 || !form.email.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 text-xs font-semibold rounded bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 transition cursor-pointer"
                    >
                      {sendingCode ? (
                        "Sending…"
                      ) : codeCooldown > 0 ? (
                        `${codeCooldown}s`
                      ) : isCodeSent ? (
                        "Resend"
                      ) : (
                        "Send Code"
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsVerified(false);
                        setVerifiedEmail("");
                        setIsCodeSent(false);
                        setOtpCode("");
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-[#666666] hover:text-[#0A66C2] hover:underline"
                    >
                      Change
                    </button>
                  )}
                </div>

                {/* OTP Verification Input Box */}
                {isCodeSent && !isVerified && (
                  <div className="mt-3 p-3.5 rounded-lg border border-[#D9E1E8] bg-[#F8FAFC] space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#191919]">
                        Enter 6-Digit Verification Code
                      </span>
                      {codeCooldown > 0 ? (
                        <span className="text-[11px] text-[#666666]">
                          Resend in {codeCooldown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={sendingCode}
                          className="text-[11px] font-semibold text-[#0A66C2] hover:underline cursor-pointer"
                        >
                          Resend Code
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="••••••"
                        className="flex-1 px-3 py-2 text-center text-sm font-mono tracking-widest rounded-md border border-[#D9E1E8] bg-white text-[#191919] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingCode || otpCode.length < 4}
                        className="px-4 py-2 text-xs font-semibold rounded-md bg-[#16805D] text-white hover:bg-[#116347] disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center justify-center min-w-[70px]"
                      >
                        {verifyingCode ? "Verifying…" : "Verify"}
                      </button>
                    </div>

                    {otpMessage.text && (
                      <p
                        className={`text-[11px] font-medium leading-relaxed ${
                          otpMessage.type === "success"
                            ? "text-[#16805D]"
                            : otpMessage.type === "error"
                            ? "text-[#C5221F]"
                            : "text-[#0A66C2]"
                        }`}
                      >
                        {otpMessage.text}
                      </p>
                    )}
                  </div>
                )}

                {isVerified && (
                  <p className="mt-1 text-[11px] text-[#16805D] flex items-center gap-1 font-medium">
                    ✓ Email verified successfully. You can proceed with registration.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    className="w-full px-3.5 py-2 pr-12 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#0A66C2] hover:underline cursor-pointer"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>
            </div>
          )}

          {/* Step 1 — Academic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#191919] uppercase tracking-wider">Academic Details</h3>
              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">USN / Roll Number</label>
                <input
                  type="text"
                  value={form.usn}
                  onChange={(e) => update("usn", e.target.value)}
                  placeholder="e.g. 1MS21CS042"
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">College / University Name</label>
                <input
                  type="text"
                  value={form.college}
                  onChange={(e) => update("college", e.target.value)}
                  placeholder="e.g. National Institute of Technology"
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#191919] mb-1">Associated Organisation (Optional)</label>
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => update("organizationName", e.target.value)}
                  placeholder="Employer or department if applicable"
                  className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Review & Confirmation */}
          {step === 2 && (
            <div>
              <h3 className="text-sm font-bold text-[#191919] uppercase tracking-wider mb-3">Review Details</h3>
              <div className="rounded-md border border-[#D9E1E8] bg-[#F3F6F8] p-4 space-y-2.5 text-xs">
                {[
                  ["Name", form.name],
                  ["Email", `${form.email} (✓ Verified)`],
                  ["USN / ID", form.usn],
                  ["Institution", form.college],
                  form.organizationName && ["Organisation", form.organizationName],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 py-0.5">
                    <span className="text-[#666666]">{k}</span>
                    <span className="font-semibold text-[#191919] truncate">{v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-[#666666] leading-relaxed">
                Your blockchain identity will be securely generated and anchored by SkillSync upon registration. No wallet configuration required.
              </p>
            </div>
          )}

          {/* Stepper Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-2 px-4 rounded-md border border-[#D9E1E8] bg-white text-xs font-semibold text-[#191919] hover:bg-[#F3F6F8] transition cursor-pointer"
              >
                Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-2 px-4 rounded-md bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#004182] transition cursor-pointer shadow-xs"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-2 px-4 rounded-md bg-[#0A66C2] text-white text-xs font-semibold hover:bg-[#004182] disabled:opacity-50 transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating account…</span>
                  </>
                ) : (
                  "Complete Profile"
                )}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-[#666666] mt-5">
            Already registered?{" "}
            <Link to="/login" className="text-[#0A66C2] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
