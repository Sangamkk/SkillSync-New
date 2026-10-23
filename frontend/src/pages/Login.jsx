import { useState } from "react";
<<<<<<< Updated upstream
import { useWallet } from "../context/WalletContext";
import { Link, useNavigate } from "react-router-dom";
import MeshBackground from "../components/common/MeshBackground";
import { applicantExists } from "../services/blockchainServices/blockchainService";
import { applicantLogin, organisationLogin } from "../services/backendAuthentication/loginService";
=======
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../services/authService";
>>>>>>> Stashed changes

function Login() {
    const { connectWallet } = useWallet();
    const navigate = useNavigate();

<<<<<<< Updated upstream
    // ================= THEME =================
=======
const roleConfig = {
  STUDENT: {
    label: "Student",
    desc: "Access your portfolio, certificates & job opportunities",
    redirectTo: "/student/dashboard",
  },
  ORGANISATION: {
    label: "Organisation",
    desc: "Manage verifications, issue certificates & recruit talent",
    redirectTo: "/organisation",
  },
  ADMIN: {
    label: "Admin",
    desc: "System administration & governance",
    redirectTo: "/admin",
  },
};
>>>>>>> Stashed changes

    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("skillsync-theme") !== "light";
    });
    const [role, setRole] = useState("STUDENT");
    const [formData, setFormData] = useState({ email: "", password: "" });

<<<<<<< Updated upstream
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
=======
  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
>>>>>>> Stashed changes

    // ================= HANDLE LOGIN =================

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // ==========================================
            // 1. CONNECT METAMASK
            // ==========================================

<<<<<<< Updated upstream
            const walletAddress = await connectWallet();

            console.log("Connected wallet:", walletAddress);

            if (!walletAddress) {
                return;
            }

            // ==========================================
            // 2. APPLICANT BLOCKCHAIN CHECK
            // ==========================================

            if (role === "STUDENT") {
                const exists = await applicantExists(walletAddress);

                if (!exists) {
                    alert(
                        "This wallet is not registered as an applicant."
                    );
                    return;
                }
            }

            // ==========================================
            // 3. PREPARE LOGIN DATA
            // ==========================================

            const loginData = {
                walletAddress,
                role,
            };

            console.log("Login data:", loginData);

            // ==========================================
            // 4. LOGIN THROUGH BACKEND
            // ==========================================

            let response;

            if (role === "STUDENT") {
                response = await applicantLogin(loginData);
            } else if (role === "ORGANISATION") {
                response = await organisationLogin(loginData);
            }
            console.log("Login response:", response);

            // ==========================================
            // 5. STORE AUTHENTICATION DATA
            // ==========================================

            localStorage.setItem("token", response.token);

            localStorage.setItem(
                "user",
                JSON.stringify(response.user)
            );

            // ==========================================
            // 6. VERIFY ROLE
            // ==========================================

            if (response.user.role !== role) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");

                alert(
                    "The selected account type does not match your account."
                );

                return;
            }

            // ==========================================
            // 7. SUCCESS
            // ==========================================

            alert(response.message || "Login successful");

            // ==========================================
            // 8. ROLE-BASED NAVIGATION
            // ==========================================

            if (response.user.role === "STUDENT") {
                navigate("/student/dashboard");
                return;
            }

            if (response.user.role === "ORGANISATION") {
                navigate("/organisation");
                return;
            }

        } catch (error) {
            console.error("Login Error:", error);

            alert(
                error.response?.data?.message ||
                error.message ||
                "Login Failed"
            );
        }
    };

    // ================= UI =================

    return (
        <div
            className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 transition-colors duration-500 ${darkMode
                    ? "bg-[#070B14] text-white"
                    : "bg-[#F8FAFC] text-slate-900"
                }`}
        >

            {/* ================= MESH BACKGROUND ================= */}

            <MeshBackground darkMode={darkMode} />

            {/* ================= THEME TOGGLE ================= */}

            <button
                type="button"
                onClick={() => {
                    const newMode = !darkMode;

                    setDarkMode(newMode);

                    localStorage.setItem(
                        "skillsync-theme",
                        newMode ? "dark" : "light"
                    );
                }}
                className={`absolute right-6 top-6 z-50 flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-300 hover:scale-105 ${darkMode
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    }`}
                title={
                    darkMode
                        ? "Switch to Light Mode"
                        : "Switch to Dark Mode"
                }
            >
                {darkMode ? "☀️" : "🌙"}
=======
  return (
    <div className="min-h-screen bg-[#F3F6F8] text-[#191919] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] hover:underline"
          >
            ← Back to SkillSync Home
          </Link>
        </div>

        {/* Logo and title */}
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
            Sign in to your account
          </h2>
          <p className="mt-1 text-xs text-[#666666]">
            Secure blockchain credential verification platform
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-xl border border-[#D9E1E8] shadow-xs">
          {/* Role selector tabs */}
          <div className="flex rounded-md p-1 bg-[#F3F6F8] border border-[#D9E1E8] mb-5">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setSelectedRole(r);
                  setError("");
                }}
                className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold transition cursor-pointer ${
                  selectedRole === r
                    ? "bg-[#0A66C2] text-white shadow-xs"
                    : "text-[#666666] hover:text-[#191919]"
                }`}
              >
                {roleConfig[r].label}
              </button>
            ))}
          </div>

          <p className="text-xs text-[#666666] mb-5">
            {cfg.desc}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-md bg-[#FCE8E6] border border-[#C5221F]/30 text-[#C5221F] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full px-3.5 py-2 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#191919] mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2 pr-12 text-sm rounded-md border border-[#D9E1E8] bg-white text-[#191919] placeholder-[#999999] focus:outline-none focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#0A66C2] hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md font-semibold text-sm bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                `Sign In as ${cfg.label}`
              )}
>>>>>>> Stashed changes
            </button>

<<<<<<< Updated upstream
            {/* ================= LOGIN CONTENT ================= */}

            <div className="relative z-10 w-full max-w-md">

                {/* ================= BRAND ================= */}

                <div className="mb-8 text-center">

                    <h1
                        className={`text-3xl font-bold tracking-tight ${darkMode
                                ? "text-white"
                                : "text-slate-900"
                            }`}
                    >
                        Skill<span className="text-blue-500">Sync</span>
                    </h1>

                    <p
                        className={`mt-2 text-sm ${darkMode
                                ? "text-slate-400"
                                : "text-slate-500"
                            }`}
                    >
                        Blockchain-powered credential verification
                    </p>

                </div>

                {/* ================= LOGIN CARD ================= */}

                <div
                    className={`rounded-3xl border p-8 shadow-2xl backdrop-blur-2xl transition-colors duration-500 sm:p-10 ${darkMode
                            ? "border-white/10 bg-white/[0.06] shadow-black/30"
                            : "border-slate-200 bg-white/90 shadow-slate-200/70"
                        }`}
                >

                    {/* ================= HEADING ================= */}

                    <div className="text-center">

                        <h2
                            className={`text-3xl font-bold tracking-tight ${darkMode
                                    ? "text-white"
                                    : "text-slate-900"
                                }`}
                        >
                            Welcome Back
                        </h2>

                        <p
                            className={`mt-2 text-sm ${darkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                        >
                            Login to your SkillSync account
                        </p>

                    </div>

                    {/* ================= ROLE SELECTOR ================= */}

                    <div className="mt-7">

                        <p
                            className={`mb-3 text-sm font-medium ${darkMode
                                    ? "text-slate-300"
                                    : "text-slate-700"
                                }`}
                        >
                            Login as
                        </p>

                        <div className="grid grid-cols-2 gap-3">

                            {/* ================= APPLICANT ================= */}

                            <button
                                type="button"
                                onClick={() => setRole("STUDENT")}
                                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-300 ${role === "STUDENT"
                                        ? darkMode
                                            ? "border-blue-500 bg-blue-500/10 text-blue-400"
                                            : "border-blue-500 bg-blue-50 text-blue-600"
                                        : darkMode
                                            ? "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                            >

                                {/* Radio */}
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${role === "STUDENT"
                                            ? "border-blue-500"
                                            : darkMode
                                                ? "border-slate-600"
                                                : "border-slate-300"
                                        }`}
                                >
                                    {role === "STUDENT" && (
                                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </span>

                                <span className="font-semibold">
                                    Applicant
                                </span>

                            </button>

                            {/* ================= ORGANISATION ================= */}

                            <button
                                type="button"
                                onClick={() =>
                                    setRole("ORGANISATION")
                                }
                                className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-all duration-300 ${role === "ORGANISATION"
                                        ? darkMode
                                            ? "border-violet-500 bg-violet-500/10 text-violet-400"
                                            : "border-violet-500 bg-violet-50 text-violet-600"
                                        : darkMode
                                            ? "border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06]"
                                            : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    }`}
                            >

                                {/* Radio */}
                                <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${role === "ORGANISATION"
                                            ? "border-violet-500"
                                            : darkMode
                                                ? "border-slate-600"
                                                : "border-slate-300"
                                        }`}
                                >
                                    {role === "ORGANISATION" && (
                                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                                    )}
                                </span>

                                <span className="font-semibold">
                                    Organisation
                                </span>

                            </button>

                        </div>

                    </div>

                    {/* ================= FORM ================= */}

                    <form
                        onSubmit={handleSubmit}
                        className="mt-6 space-y-5"
                    >

                        {/* ================= LOGIN BUTTON ================= */}

                        <button
                            type="submit"
                            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30"
                        >
                            <span className="relative z-10">
                                🦊 Connect MetaMask & Login
                            </span>
                        </button>

                        {/* ================= DIVIDER ================= */}

                        <div className="flex items-center gap-3 py-1">

                            <div
                                className={`h-px flex-1 ${darkMode
                                        ? "bg-white/10"
                                        : "bg-slate-200"
                                    }`}
                            />

                            <span
                                className={`text-xs ${darkMode
                                        ? "text-slate-600"
                                        : "text-slate-400"
                                    }`}
                            >
                                SECURE WEB3 LOGIN
                            </span>

                            <div
                                className={`h-px flex-1 ${darkMode
                                        ? "bg-white/10"
                                        : "bg-slate-200"
                                    }`}
                            />

                        </div>

                        {/* ================= REGISTER ================= */}

                        <p
                            className={`text-center text-sm ${darkMode
                                    ? "text-slate-400"
                                    : "text-slate-500"
                                }`}
                        >
                            Don't have an account?{" "}

                            <Link
                                to="/register"
                                className="font-semibold text-blue-500 transition hover:text-blue-400 hover:underline"
                            >
                                Register
                            </Link>
                        </p>

                    </form>

                </div>

                {/* ================= SECURITY INDICATORS ================= */}

                <div
                    className={`mt-6 flex items-center justify-center gap-6 text-xs ${darkMode
                            ? "text-slate-600"
                            : "text-slate-500"
                        }`}
                >

                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Wallet secured
                    </span>

                    <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Blockchain verified
                    </span>

                </div>

            </div>

        </div>
    );
}
=======
          {/* Registration Links */}
          <div className="mt-6 pt-5 border-t border-[#D9E1E8] space-y-2 text-center text-xs text-[#666666]">
            <p>
              New student?{" "}
              <Link to="/register" className="text-[#0A66C2] font-semibold hover:underline">
                Create a student profile
              </Link>
            </p>
            <p>
              New organisation?{" "}
              <Link to="/org/register" className="text-[#0A66C2] font-semibold hover:underline">
                Register your institution
              </Link>
            </p>
          </div>
        </div>

        {/* Admin Switcher */}
        <div className="text-center mt-4 text-xs text-[#666666]">
          Administrator?{" "}
          <button
            type="button"
            onClick={() => setSelectedRole("ADMIN")}
            className="text-[#0A66C2] font-semibold hover:underline cursor-pointer"
          >
            Switch to Admin sign-in
          </button>
        </div>
      </div>
    </div>
  );
};
>>>>>>> Stashed changes

export default Login;