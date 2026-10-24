import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginApi } from "../services/authService";

const ROLES = ["STUDENT", "ORGANISATION"];

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

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cfg = roleConfig[selectedRole];
  const from = location.state?.from?.pathname || cfg.redirectTo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await loginApi({ email, password, role: selectedRole });
      const { token, user } = data;
      if (!token) throw new Error("No token received from server.");
      login(token, user);
      navigate(roleConfig[user.role]?.redirectTo || from, { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Login failed. Check your credentials and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
            </button>
          </form>

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

export default Login;