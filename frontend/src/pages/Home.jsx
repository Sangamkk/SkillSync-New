<<<<<<< Updated upstream
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThreeDBackground from "../components/common/ThreeDBackground";
=======
import { useState } from "react";
import { useNavigate } from "react-router-dom";
>>>>>>> Stashed changes
import RoleSelector from "../components/common/RoleSelector";

const Home = () => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const scrollToSection = (id) => {
        setMobileMenuOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-white text-[#191919] font-sans">
            {/* =====================================================
                NAVIGATION BAR
            ====================================================== */}
            <header className="sticky top-0 z-50 bg-white border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                            className="flex items-center gap-1.5 text-left cursor-pointer focus:outline-none"
                        >
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-base shadow-xs">
                                S
                            </span>
                            <span className="text-xl font-bold tracking-tight text-[#191919]">
                                Skill<span className="text-[#0A66C2]">Sync</span>
                            </span>
                        </button>

                        {/* Navigation Links (Desktop) */}
                        <nav className="hidden md:flex items-center gap-6">
                            <button
                                onClick={() => scrollToSection("features")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection("how-it-works")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                How It Works
                            </button>
                            <button
<<<<<<< Updated upstream
                                onClick={() =>
                                    scrollToSection("technology")
                                }
                                className={`text-sm font-medium transition-colors ${darkMode
                                    ? "text-slate-300 hover:text-white"
                                    : "text-slate-600 hover:text-slate-950"
                                    }`}
                            >
                                Technology
                            </button>


=======
                                onClick={() => scrollToSection("verify-document-section")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                Verify Document
                            </button>
                            <button
                                onClick={() => scrollToSection("technology")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                Technology
                            </button>
>>>>>>> Stashed changes
                            <button
                                onClick={() => scrollToSection("contact")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                Contact
                            </button>
<<<<<<< Updated upstream

                        </div>


                        {/* Right Side */}

                        <div className="flex items-center gap-3">

                            {/* Theme */}

                            <button
                                onClick={() =>
                                    setDarkMode(!darkMode)
                                }
                                className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 hover:scale-105 ${darkMode
                                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                                    : "border-slate-200 bg-white hover:bg-slate-50"
                                    }`}
                                title={
                                    darkMode
                                        ? "Switch to Light Mode"
                                        : "Switch to Dark Mode"
                                }
                            >
                                {darkMode ? "☀️" : "🌙"}
                            </button>


                            {/* Login */}
                            <button className="px-5 py-2 rounded-md border border-blue-600 text-blue-600 font-medium text-sm transition duration-200 hover:bg-blue-600 hover:text-white" onClick={() => navigate("/login")}>Login</button>

                            {/* Get Started */}
                            <RoleSelector type="register" />

                        </div>

=======
                        </nav>
>>>>>>> Stashed changes
                    </div>

                    {/* Auth & CTAs (Desktop) */}
                    <div className="hidden sm:flex items-center gap-3">
                        <button
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 text-sm font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF] transition-colors duration-150 cursor-pointer"
                        >
                            Sign In
                        </button>
                        <RoleSelector type="register" />
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <div className="flex sm:hidden items-center gap-2">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-md text-[#666666] hover:text-[#191919] hover:bg-[#F3F6F8] focus:outline-none cursor-pointer"
                            aria-label="Toggle Navigation"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                {mobileMenuOpen && (
                    <div className="sm:hidden border-t border-[#D9E1E8] bg-white px-4 py-4 space-y-3 shadow-md">
                        <button
                            onClick={() => scrollToSection("features")}
                            className="block w-full text-left py-2 text-sm font-medium text-[#666666] hover:text-[#0A66C2]"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollToSection("how-it-works")}
                            className="block w-full text-left py-2 text-sm font-medium text-[#666666] hover:text-[#0A66C2]"
                        >
                            How It Works
                        </button>
                        <button
                            onClick={() => scrollToSection("verify-document-section")}
                            className="block w-full text-left py-2 text-sm font-medium text-[#666666] hover:text-[#0A66C2]"
                        >
                            Verify Document
                        </button>
                        <button
                            onClick={() => scrollToSection("technology")}
                            className="block w-full text-left py-2 text-sm font-medium text-[#666666] hover:text-[#0A66C2]"
                        >
                            Technology
                        </button>
                        <button
                            onClick={() => scrollToSection("contact")}
                            className="block w-full text-left py-2 text-sm font-medium text-[#666666] hover:text-[#0A66C2]"
                        >
                            Contact
                        </button>
                        <div className="pt-3 border-t border-[#D9E1E8] flex flex-col gap-2">
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate("/login");
                                }}
                                className="w-full py-2.5 text-center text-sm font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] rounded-md hover:bg-[#E8F3FF]"
                            >
                                Sign In
                            </button>
                            <RoleSelector type="register" className="w-full [&>button]:w-full" />
                        </div>
                    </div>
                )}
            </header>

            {/* =====================================================
                HERO SECTION
            ====================================================== */}
            <section className="bg-white py-12 sm:py-16 border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                        {/* Hero Left Column */}
                        <div className="lg:col-span-7">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E8F3FF] text-[#0A66C2] mb-5">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0A66C2]" />
                                Trusted Credential Verification
                            </div>

                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#191919] leading-[1.15]">
                                Your achievements. Verified and trusted.
                            </h1>

                            <p className="mt-4 text-base sm:text-lg text-[#666666] leading-relaxed max-w-xl">
                                Securely store and verify academic, professional, and skill credentials using blockchain technology.
                            </p>

                            <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition-colors duration-150 cursor-pointer shadow-xs text-center"
                                >
                                    Create Your Profile
                                </button>
                                <button
                                    onClick={() => scrollToSection("verify-document-section")}
                                    className="px-5 py-2.5 text-sm font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] hover:bg-[#E8F3FF] rounded-md transition-colors duration-150 cursor-pointer text-center"
                                >
                                    Verify a Document
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-8 pt-5 border-t border-[#D9E1E8] flex flex-wrap items-center gap-6 text-xs text-[#666666]">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-[#16805D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Blockchain Verified</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-[#16805D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Tamper Resistant</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-4 h-4 text-[#16805D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Publicly Auditable</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Right Column: Understated Credential Preview */}
                        <div className="lg:col-span-5">
                            <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 sm:p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-3.5 border-b border-[#D9E1E8]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-xs">
                                            SS
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-[#191919]">SkillSync Registry</p>
                                            <p className="text-[11px] text-[#666666]">Digital Credential</p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E6F4EA] text-[#16805D] border border-[#16805D]/20">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                        </svg>
                                        Verified On-Chain
                                    </span>
<<<<<<< Updated upstream

                                </h1>


                                <p
                                    className={`mt-7 max-w-xl text-lg leading-8 ${darkMode
                                        ? "text-slate-400"
                                        : "text-slate-600"
                                        }`}
                                >
                                    SkillSync securely stores and verifies
                                    academic, professional and skill
                                    credentials using blockchain technology.
                                </p>


                                {/* Buttons */}

                                <div className="mt-9 flex flex-col gap-4 sm:flex-row">

                                    <button
                                        onClick={() =>
                                            navigate("/register")
                                        }
                                        className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-7 py-3.5 font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30"
                                    >
                                        Create Your Profile
                                        <span className="ml-2">
                                            →
                                        </span>
                                    </button>


                                    <button
                                        onClick={() =>
                                            navigate("/login")
                                        }
                                        className={`rounded-xl border px-7 py-3.5 font-semibold transition-all duration-300 hover:-translate-y-1 ${darkMode
                                            ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                                            : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                                            }`}
                                    >
                                        🦊 Connect MetaMask
                                    </button>

                                </div>


                                {/* Trust Indicators */}

                                <div className="mt-10 flex flex-wrap items-center gap-6">

                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-500">
                                            ✓
                                        </span>

                                        <span className="text-sm text-slate-500">
                                            Tamper resistant
                                        </span>
                                    </div>


                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-500">
                                            ✓
                                        </span>

                                        <span className="text-sm text-slate-500">
                                            Blockchain verified
                                        </span>
                                    </div>


                                    <div className="flex items-center gap-2">
                                        <span className="text-emerald-500">
                                            ✓
                                        </span>

                                        <span className="text-sm text-slate-500">
                                            Wallet connected
                                        </span>
                                    </div>

                                </div>

                            </div>


                            {/* =====================================================
                                CERTIFICATE CARD
                            ====================================================== */}

                            <div className="relative hidden min-h-[500px] items-center justify-center lg:flex">

                                {/* Soft Rings */}

                                <div className="absolute h-80 w-80 rounded-full border border-blue-500/20" />

                                <div className="absolute h-96 w-96 rounded-full border border-violet-500/10" />

                                <div className="absolute h-[28rem] w-[28rem] rounded-full border border-cyan-500/10" />


                                {/* Certificate */}

                                <div
                                    className={`relative w-[360px] rounded-3xl border p-7 shadow-2xl backdrop-blur-xl ${darkMode
                                        ? "border-white/10 bg-white/[0.06]"
                                        : "border-slate-200 bg-white shadow-slate-200/60"
                                        }`}
                                >

                                    <div className="flex items-center justify-between">

                                        <div className="flex items-center gap-3">

                                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 text-xl text-white">
                                                ◈
                                            </div>

                                            <div>

                                                <p className="font-semibold">
                                                    Certificate
                                                </p>

                                                <p className="text-xs text-slate-500">
                                                    Blockchain Credential
                                                </p>

                                            </div>

                                        </div>


                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                                            VERIFIED
                                        </span>

                                    </div>


                                    <div className="my-7 h-px bg-slate-500/10" />


                                    <p className="text-sm text-slate-500">
                                        Certificate Hash
                                    </p>


                                    <div
                                        className={`mt-2 rounded-xl p-4 font-mono text-xs ${darkMode
                                            ? "bg-black/30 text-slate-300"
                                            : "bg-slate-50 text-slate-600"
                                            }`}
                                    >
                                        0x8f42...a91c...7bd2
                                    </div>


                                    <div className="mt-5 grid grid-cols-2 gap-4">

                                        <div>

                                            <p className="text-xs text-slate-500">
                                                Network
                                            </p>

                                            <p className="mt-1 font-semibold">
                                                Ethereum
                                            </p>

                                        </div>


                                        <div>

                                            <p className="text-xs text-slate-500">
                                                Status
                                            </p>

                                            <p className="mt-1 font-semibold text-emerald-500">
                                                Authentic
                                            </p>

                                        </div>

                                    </div>

                                </div>


                                {/* Verification Popup */}

                                <div
                                    className={`absolute -bottom-4 -left-2 rounded-2xl border p-4 shadow-xl backdrop-blur-xl ${darkMode
                                        ? "border-white/10 bg-[#111827]/90"
                                        : "border-slate-200 bg-white"
                                        }`}
                                >

                                    <div className="flex items-center gap-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                            ✓
                                        </div>

                                        <div>

                                            <p className="text-sm font-semibold">
                                                Verification Complete
                                            </p>

                                            <p className="text-xs text-slate-500">
                                                Secured on Ethereum
                                            </p>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    STATS
                ====================================================== */}

                <section
                    className={`border-y ${darkMode
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-slate-200 bg-white"
                        }`}
                >

                    <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200/10 md:grid-cols-4">

                        <div className="p-7 text-center">
                            <p className="text-3xl font-bold">
                                100%
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Tamper Resistant
                            </p>
                        </div>


                        <div className="p-7 text-center">
                            <p className="text-3xl font-bold">
                                24/7
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Verification
                            </p>
                        </div>


                        <div className="p-7 text-center">
                            <p className="text-3xl font-bold">
                                Web3
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Wallet Identity
                            </p>
                        </div>


                        <div className="p-7 text-center">
                            <p className="text-3xl font-bold">
                                Ethereum
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Blockchain
                            </p>
                        </div>

                    </div>

                </section>


                {/* =====================================================
                    FEATURES
                ====================================================== */}

                <section
                    id="features"
                    className="mx-auto max-w-7xl px-6 py-28 lg:px-8"
                >

                    <div className="max-w-2xl">

                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
                            Built for trust
                        </p>

                        <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                            Everything you need to prove your skills.
                        </h2>

                        <p className="mt-5 text-lg text-slate-500">
                            A single platform for managing, securing and
                            verifying professional credentials.
                        </p>

                    </div>


                    <div className="mt-14 grid gap-6 md:grid-cols-2">


                        {/* Certificates */}

                        <div
                            className={`group rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${darkMode
                                ? "border-white/10 bg-white/[0.04] hover:border-blue-500/30"
                                : "border-slate-200 bg-white shadow-sm hover:shadow-xl"
                                }`}
                        >

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                                📜
                            </div>

                            <h3 className="mt-6 text-2xl font-bold">
                                Certificates
                            </h3>

                            <p className="mt-3 leading-7 text-slate-500">
                                Upload and manage your academic and
                                professional certificates securely.
                            </p>

                            <button
                                onClick={loginRequired}
                                className="mt-6 font-semibold text-blue-500 transition group-hover:text-blue-400"
                            >
                                Upload Certificate →
                            </button>

                        </div>


                        {/* Skills */}

                        <div
                            className={`group rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${darkMode
                                ? "border-white/10 bg-white/[0.04] hover:border-violet-500/30"
                                : "border-slate-200 bg-white shadow-sm hover:shadow-xl"
                                }`}
                        >

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-2xl">
                                ⚡
                            </div>

                            <h3 className="mt-6 text-2xl font-bold">
                                Skills
                            </h3>

                            <p className="mt-3 leading-7 text-slate-500">
                                Showcase your technical and soft skills as
                                part of your professional identity.
                            </p>

                            <button
                                onClick={loginRequired}
                                className="mt-6 font-semibold text-violet-500 transition group-hover:text-violet-400"
                            >
                                Add Skills →
                            </button>

                        </div>


                        {/* Projects */}

                        <div
                            className={`group rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${darkMode
                                ? "border-white/10 bg-white/[0.04] hover:border-cyan-500/30"
                                : "border-slate-200 bg-white shadow-sm hover:shadow-xl"
                                }`}
                        >

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-2xl">
                                🚀
                            </div>

                            <h3 className="mt-6 text-2xl font-bold">
                                Projects
                            </h3>

                            <p className="mt-3 leading-7 text-slate-500">
                                Store project proofs and showcase real-world
                                achievements.
                            </p>

                            <button
                                onClick={loginRequired}
                                className="mt-6 font-semibold text-cyan-500 transition group-hover:text-cyan-400"
                            >
                                Add Project →
                            </button>

                        </div>


                        {/* Verification */}

                        <div
                            className={`group rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-2 ${darkMode
                                ? "border-white/10 bg-white/[0.04] hover:border-emerald-500/30"
                                : "border-slate-200 bg-white shadow-sm hover:shadow-xl"
                                }`}
                        >

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl">
                                ✓
                            </div>

                            <h3 className="mt-6 text-2xl font-bold">
                                Verification
                            </h3>

                            <p className="mt-3 leading-7 text-slate-500">
                                Organizations and companies can verify
                                credentials with blockchain-backed proof.
                            </p>

                            <button
                                onClick={loginRequired}
                                className="mt-6 font-semibold text-emerald-500 transition group-hover:text-emerald-400"
                            >
                                Request Verification →
                            </button>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    HOW IT WORKS
                ====================================================== */}

                <section
                    id="how-it-works"
                    className={`border-y ${darkMode
                        ? "border-white/10 bg-white/[0.02]"
                        : "border-slate-200 bg-slate-50"
                        }`}
                >

                    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">

                        <div className="text-center">

                            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
                                Simple process
                            </p>

                            <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                                How SkillSync works
                            </h2>

                            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
                                From blockchain identity to trusted
                                credential verification in a few simple
                                steps.
                            </p>

                        </div>


                        <div className="mt-16 grid gap-6 md:grid-cols-3">

                            {[
                                {
                                    number: "01",
                                    title: "Create your identity",
                                    text: "Register your account and connect your MetaMask wallet.",
                                },
                                {
                                    number: "02",
                                    title: "Build your profile",
                                    text: "Add certificates, skills and projects to your digital identity.",
                                },
                                {
                                    number: "03",
                                    title: "Verify credentials",
                                    text: "Organizations and companies can verify your achievements.",
                                },
                            ].map((step) => (

                                <div
                                    key={step.number}
                                    className={`relative rounded-3xl border p-8 ${darkMode
                                        ? "border-white/10 bg-white/[0.04]"
                                        : "border-slate-200 bg-white"
                                        }`}
                                >

                                    <span className="text-sm font-bold text-blue-500">
                                        {step.number}
                                    </span>

                                    <h3 className="mt-5 text-xl font-bold">
                                        {step.title}
=======
                                </div>

                                <div className="py-4 border-b border-[#D9E1E8]">
                                    <p className="text-[11px] text-[#666666]">Credential Title</p>
                                    <h3 className="text-sm font-bold text-[#191919] mt-0.5">
                                        Full-Stack Systems Engineering
>>>>>>> Stashed changes
                                    </h3>
                                    <div className="mt-3 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="text-[#666666] text-[11px]">Recipient</p>
                                            <p className="font-semibold text-[#191919]">Alex Morgan</p>
                                        </div>
                                        <div>
                                            <p className="text-[#666666] text-[11px]">USN / Student ID</p>
                                            <p className="font-mono text-[#191919]">1MS21CS042</p>
                                        </div>
                                    </div>
                                </div>

<<<<<<< Updated upstream
                            ))}

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    TECHNOLOGY
                ====================================================== */}

                <section
                    id="technology"
                    className="mx-auto max-w-7xl px-6 py-28 lg:px-8"
                >

                    <div className="text-center">

                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-500">
                            Powered by modern technology
                        </p>

                        <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                            Built for the Web3 era.
                        </h2>

                        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-500">
                            SkillSync combines blockchain, secure cloud
                            storage and modern web technologies.
                        </p>

                    </div>


                    <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">

                        {[
                            "Ethereum",
                            "Sepolia",
                            "MetaMask",
                            "MongoDB Atlas",
                            "Cloudinary",
                            "React",
                        ].map((technology) => (

                            <div
                                key={technology}
                                className={`flex min-h-28 items-center justify-center rounded-2xl border p-5 text-center font-semibold transition-all duration-300 hover:-translate-y-1 ${darkMode
                                    ? "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                                    : "border-slate-200 bg-white shadow-sm hover:shadow-lg"
                                    }`}
                            >
                                {technology}
                            </div>

                        ))}

                    </div>

                </section>


                {/* =====================================================
                    CTA
                ====================================================== */}

                <section className="px-6 pb-28 lg:px-8">

                    <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-600 via-violet-600 to-indigo-600 px-8 py-16 text-center text-white shadow-2xl sm:px-16">

                        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />

                        <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-cyan-300/20 blur-3xl" />


                        <div className="relative">

                            <h2 className="text-3xl font-bold sm:text-4xl">
                                Make your achievements verifiable.
                            </h2>

                            <p className="mx-auto mt-4 max-w-2xl text-blue-100">
                                Build a trusted digital identity backed by
                                blockchain technology.
                            </p>

                            <button
                                onClick={() =>
                                    navigate("/register")
                                }
                                className="mt-8 rounded-xl bg-white px-7 py-3.5 font-semibold text-blue-700 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                            >
                                Get Started →
                            </button>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    FOOTER
                ====================================================== */}

                <footer
                    id="contact"
                    className={`border-t ${darkMode
                        ? "border-white/10 bg-[#050810]"
                        : "border-slate-200 bg-slate-950"
                        }`}
                >

                    <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

                        <div className="grid gap-10 md:grid-cols-3">


                            {/* Brand */}

                            <div>

                                <span className="text-xl font-bold text-white">
                                    Skill
                                    <span className="text-blue-400">
                                        Sync
                                    </span>
                                </span>

                                <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                                    A blockchain-powered platform for secure
                                    academic and professional credential
                                    verification.
                                </p>

                            </div>


                            {/* Platform */}

                            <div>

                                <h3 className="font-semibold text-white">
                                    Platform
                                </h3>

                                <div className="mt-4 space-y-3 text-sm text-slate-400">
=======
                                <div className="py-3.5 space-y-2.5">
                                    <div>
                                        <span className="text-[#666666] text-[11px] block mb-1">SHA-256 Hash</span>
                                        <div className="rounded bg-[#F3F6F8] p-2 font-mono text-[11px] text-[#191919] break-all border border-[#D9E1E8]">
                                            0x8f42c199e27de93cb50ac884dd19943c479029303b62affa37b07a4f969ba
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2 rounded bg-[#F3F6F8] border border-[#D9E1E8]">
                                            <p className="text-[10px] text-[#666666]">Network</p>
                                            <p className="font-semibold text-[#191919]">Ethereum Sepolia</p>
                                        </div>
                                        <div className="p-2 rounded bg-[#F3F6F8] border border-[#D9E1E8]">
                                            <p className="text-[10px] text-[#666666]">Issuer</p>
                                            <p className="font-semibold text-[#191919]">Accredited Org</p>
                                        </div>
                                    </div>
                                </div>
>>>>>>> Stashed changes

                                <div className="pt-3 border-t border-[#D9E1E8] flex items-center justify-between text-xs text-[#666666]">
                                    <span>Immutable Record</span>
                                    <button
                                        onClick={() => scrollToSection("verify-document-section")}
                                        className="text-[#0A66C2] font-semibold hover:underline cursor-pointer"
                                    >
                                        Verify a Document ↓
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                HOW IT WORKS SECTION
            ====================================================== */}
            <section id="how-it-works" className="bg-[#F3F6F8] py-14 sm:py-16 border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            How It Works
                        </h2>
                        <p className="mt-1 text-sm text-[#666666]">
                            Three simple steps to issue and verify credentials.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Step 1 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] font-bold text-xs">
                                01
                            </div>
                            <h3 className="mt-4 text-base font-bold text-[#191919]">
                                Issue credential
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#666666] leading-relaxed">
                                Organisations issue digital certificates directly to students or recipients through SkillSync.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] font-bold text-xs">
                                02
                            </div>
                            <h3 className="mt-4 text-base font-bold text-[#191919]">
                                Anchor on-chain
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#666666] leading-relaxed">
                                The certificate's cryptographic hash is recorded on the Ethereum blockchain as an immutable proof.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2] font-bold text-xs">
                                03
                            </div>
                            <h3 className="mt-4 text-base font-bold text-[#191919]">
                                Verify instantly
                            </h3>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#666666] leading-relaxed">
                                Anyone can upload the certificate file or enter its hash to instantly confirm authenticity.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FEATURES SECTION
            ====================================================== */}
            <section id="features" className="bg-white py-14 sm:py-16 border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            Features
                        </h2>
                        <p className="mt-1 text-sm text-[#666666]">
                            Essential tools for credential issuance and verification.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* Feature 1 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2] transition-colors">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-[#191919]">Credential Issuance</h3>
                            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                                Issue academic diplomas and skill certificates with digital signatures.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2] transition-colors">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-[#191919]">Blockchain Verification</h3>
                            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                                Permanent cryptographic hashes on Ethereum ensure records cannot be altered.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2] transition-colors">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-[#191919]">Student Project Verification</h3>
                            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                                Review and endorse student code repositories and project milestones.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2] transition-colors">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-[#191919]">Organisation Management</h3>
                            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                                Manage verification requests and issue verified credentials in one place.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="rounded-xl border border-[#D9E1E8] bg-white p-5 shadow-xs hover:border-[#0A66C2] transition-colors lg:col-span-2">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#E8F3FF] text-[#0A66C2]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="mt-3.5 text-sm font-bold text-[#191919]">Secure Document Storage</h3>
                            <p className="mt-1 text-xs text-[#666666] leading-relaxed">
                                Encrypted cloud document storage paired with on-chain verification proofs.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                DOCUMENT VERIFICATION SECTION
            ====================================================== */}
            <section id="verify-document-section" className="bg-[#F3F6F8] py-14 sm:py-16 border-b border-[#D9E1E8]">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-xl mx-auto mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            Verify a Document
                        </h2>
                        <p className="mt-1 text-sm text-[#666666]">
                            Upload a certificate or search by hash to check on-chain registration.
                        </p>
                    </div>

                    <HomeDocumentVerifier />
                </div>
            </section>

            {/* =====================================================
                TECHNOLOGY SECTION
            ====================================================== */}
            <section id="technology" className="bg-white py-14 sm:py-16 border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            Technology
                        </h2>
                        <p className="mt-1 text-sm text-[#666666]">
                            Built with trusted web and blockchain standards.
                        </p>
                    </div>

                    <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                        {[
                            { name: "Ethereum", desc: "Smart contracts" },
                            { name: "Sepolia", desc: "Testnet ledger" },
                            { name: "Node.js", desc: "Backend API" },
                            { name: "MongoDB", desc: "Cloud database" },
                            { name: "Cloudinary", desc: "File storage" },
                            { name: "React", desc: "Frontend UI" },
                        ].map((tech) => (
                            <div
                                key={tech.name}
                                className="rounded-lg border border-[#D9E1E8] bg-white p-3.5 text-center hover:border-[#0A66C2] transition-colors shadow-xs"
                            >
                                <p className="font-semibold text-sm text-[#191919]">{tech.name}</p>
                                <p className="text-xs text-[#666666] mt-0.5">{tech.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* =====================================================
                CALL TO ACTION SECTION
            ====================================================== */}
            <section className="bg-[#F3F6F8] py-12 sm:py-14 border-b border-[#D9E1E8]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-[#D9E1E8] bg-white p-8 sm:p-10 text-center max-w-2xl mx-auto shadow-xs">
                        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191919]">
                            Ready to get started?
                        </h2>
                        <p className="mt-2 text-sm text-[#666666]">
                            Join students and organisations verifying credentials with SkillSync.
                        </p>
                        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
                            <button
                                onClick={() => navigate("/register")}
                                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] rounded-md transition-colors cursor-pointer shadow-xs"
                            >
                                Create Account
                            </button>
                            <button
                                onClick={() => scrollToSection("verify-document-section")}
                                className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-[#0A66C2] bg-white border border-[#0A66C2] hover:bg-[#E8F3FF] rounded-md transition-colors cursor-pointer"
                            >
                                Verify a Document
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ====================================================== */}
            <footer id="contact" className="bg-white py-10 text-[#666666]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#D9E1E8]">
                        {/* Brand Column */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-1.5">
                                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0A66C2] text-white font-bold text-sm">
                                    S
                                </span>
                                <span className="text-lg font-bold text-[#191919]">
                                    Skill<span className="text-[#0A66C2]">Sync</span>
                                </span>
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-[#666666]">
                                Tamper-resistant credential verification on the Ethereum blockchain.
                            </p>
                        </div>

                        {/* Platform Links */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#191919]">Platform</p>
                            <ul className="mt-2.5 space-y-1.5 text-xs">
                                <li>
                                    <button
                                        onClick={() => scrollToSection("features")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Features
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => scrollToSection("how-it-works")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        How It Works
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => scrollToSection("verify-document-section")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Verify Document
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => scrollToSection("technology")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Technology
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Access & Verification */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#191919]">Access</p>
                            <ul className="mt-2.5 space-y-1.5 text-xs">
                                <li>
                                    <button
                                        onClick={() => navigate("/login")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Sign In
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate("/register")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Student Register
                                    </button>
                                </li>
                                <li>
                                    <button
                                        onClick={() => navigate("/org/register")}
                                        className="hover:text-[#0A66C2] transition-colors cursor-pointer"
                                    >
                                        Organisation Register
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact Column */}
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-[#191919]">Contact</p>
                            <ul className="mt-2.5 space-y-1.5 text-xs">
                                <li>support@skillsync.com</li>
                                <li>+91 9552016076</li>
                                <li>Ethereum Sepolia</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#666666] gap-2">
                        <p>© {new Date().getFullYear()} SkillSync. All rights reserved.</p>
                        <p>Verifiable professional trust.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;