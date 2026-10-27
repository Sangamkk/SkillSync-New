import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import RoleSelector from "../components/common/RoleSelector";
import VerifyCertificateModal from "../components/common/VerifyCertificateModal";
import heroIllustration from "../assets/hero_illustration.jpg";

const Home = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeNav, setActiveNav] = useState("home");
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 15);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (searchParams.get("verify") === "true" || searchParams.get("verify") === "1") {
            setIsVerifyModalOpen(true);
        }
    }, [searchParams]);

    const handleCloseModal = () => {
        setIsVerifyModalOpen(false);
        if (searchParams.has("verify")) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("verify");
            setSearchParams(nextParams, { replace: true });
        }
    };

    const scrollToSection = (id) => {
        setActiveNav(id);
        setMobileMenuOpen(false);
        if (id === "home") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans relative selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
            {/* =====================================================
                VERIFY CERTIFICATE MODAL OVERLAY
            ====================================================== */}
            <VerifyCertificateModal 
                isOpen={isVerifyModalOpen} 
                onClose={handleCloseModal} 
            />

            {/* =====================================================
                GLOBAL SOFT BACKGROUND SHAPES
            ====================================================== */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div 
                    className="absolute -top-[15%] -right-[10%] w-[70vw] h-[75vh] rounded-full blur-3xl opacity-60"
                    style={{
                        background: "radial-gradient(ellipse at center, rgba(219, 234, 254, 0.75) 0%, rgba(238, 246, 255, 0.45) 50%, transparent 75%)"
                    }}
                />
                <div 
                    className="absolute top-[40%] -left-[15%] w-[55vw] h-[60vh] rounded-full blur-3xl opacity-40"
                    style={{
                        background: "radial-gradient(circle, rgba(224, 242, 254, 0.6) 0%, transparent 70%)"
                    }}
                />
            </div>

            {/* =====================================================
                NAVBAR
            ====================================================== */}
            <header className={`sticky top-0 z-40 transition-all duration-300 relative ${
                scrolled 
                    ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm shadow-blue-900/5 py-0" 
                    : "bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-2xs py-0.5"
            }`}>
                {/* Top Subtle Tech Accent Line */}
                <div className="absolute top-0 inset-x-0 h-[2.5px] bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#60A5FA]" />

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-20 flex items-center justify-between">
                    {/* Brand Logo with micro-interaction */}
                    <div className="flex items-center gap-10">
                        <button
                            onClick={() => scrollToSection("home")}
                            className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
                            aria-label="SkillSync Home"
                        >
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-200/80 text-[#2563EB] group-hover:scale-105 group-hover:-rotate-3 group-hover:bg-[#2563EB] group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-2xs group-hover:shadow-sm group-hover:shadow-blue-500/20">
                                <svg 
                                    className="w-5 h-5" 
                                    viewBox="0 0 32 32" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                >
                                    <path d="M10 8L3 16L10 24" />
                                    <path d="M22 8L29 16L22 24" />
                                    <line x1="18" y1="6" x2="14" y2="26" stroke="#60A5FA" strokeWidth="2.5" />
                                </svg>
                            </div>
                            <span className="text-2xl font-black tracking-tight text-[#0F172A] group-hover:text-[#2563EB] transition-colors duration-200">
                                Skill<span className="text-[#2563EB]">Sync</span>
                            </span>
                        </button>

                        {/* Desktop Navigation Links (Single clean set without duplicated verify) */}
                        <nav className="hidden lg:flex items-center gap-2 text-[14.5px] font-medium text-slate-600 bg-slate-100/60 p-1 rounded-full border border-slate-200/60">
                            <button
                                onClick={() => scrollToSection("home")}
                                className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                    activeNav === "home"
                                        ? "bg-white text-[#2563EB] font-semibold shadow-xs"
                                        : "text-slate-600 hover:text-[#2563EB] hover:bg-white/60"
                                }`}
                            >
                                Home
                            </button>

                            <button
                                onClick={() => scrollToSection("features")}
                                className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                    activeNav === "features"
                                        ? "bg-white text-[#2563EB] font-semibold shadow-xs"
                                        : "text-slate-600 hover:text-[#2563EB] hover:bg-white/60"
                                }`}
                            >
                                Features
                            </button>

                            <button
                                onClick={() => scrollToSection("how-it-works")}
                                className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                    activeNav === "how-it-works"
                                        ? "bg-white text-[#2563EB] font-semibold shadow-xs"
                                        : "text-slate-600 hover:text-[#2563EB] hover:bg-white/60"
                                }`}
                            >
                                How It Works
                            </button>

                            <button
                                onClick={() => scrollToSection("about")}
                                className={`px-4 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                    activeNav === "about"
                                        ? "bg-white text-[#2563EB] font-semibold shadow-xs"
                                        : "text-slate-600 hover:text-[#2563EB] hover:bg-white/60"
                                }`}
                            >
                                About
                            </button>
                        </nav>
                    </div>

                    {/* Desktop Right CTAs */}
                    <div className="hidden sm:flex items-center gap-3">
                        {/* Only ONE Verify a Certificate button, positioned as an action */}
                        <button
                            onClick={() => setIsVerifyModalOpen(true)}
                            className="group inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#2563EB] bg-blue-50/80 hover:bg-blue-100/90 hover:text-[#1D4ED8] active:scale-[0.97] rounded-full border border-blue-200/90 hover:border-blue-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 text-[#2563EB] group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>Verify a Certificate</span>
                        </button>

                        <button
                            onClick={() => navigate("/login")}
                            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#2563EB] hover:bg-slate-100/80 active:scale-[0.97] rounded-full transition-all duration-200 cursor-pointer"
                        >
                            Sign In
                        </button>

                        <RoleSelector 
                            type="register" 
                            label="Get Started"
                            buttonClassName="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] text-white active:scale-[0.97] shadow-sm shadow-blue-500/25 hover:shadow-md hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        />
                    </div>

                    {/* Mobile Hamburger Button */}
                    <div className="flex lg:hidden items-center gap-2">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2.5 rounded-xl text-slate-700 hover:text-[#2563EB] hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
                            aria-label="Toggle navigation"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl px-6 py-5 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
                        <nav className="flex flex-col space-y-2 text-[15px] font-medium text-slate-700">
                            <button
                                onClick={() => scrollToSection("home")}
                                className="text-left px-3 py-2 rounded-lg hover:text-[#2563EB] hover:bg-blue-50/60 transition-colors"
                            >
                                Home
                            </button>
                            <button
                                onClick={() => scrollToSection("features")}
                                className="text-left px-3 py-2 rounded-lg hover:text-[#2563EB] hover:bg-blue-50/60 transition-colors"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => scrollToSection("how-it-works")}
                                className="text-left px-3 py-2 rounded-lg hover:text-[#2563EB] hover:bg-blue-50/60 transition-colors"
                            >
                                How It Works
                            </button>
                            <button
                                onClick={() => scrollToSection("about")}
                                className="text-left px-3 py-2 rounded-lg hover:text-[#2563EB] hover:bg-blue-50/60 transition-colors"
                            >
                                About
                            </button>
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    setIsVerifyModalOpen(true);
                                }}
                                className="text-left px-3 py-2 rounded-lg font-semibold text-[#2563EB] bg-blue-50/70 hover:bg-blue-100/70 transition-colors flex items-center justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    <span>Verify a Certificate</span>
                                </span>
                                <span className="text-[10px] bg-blue-200/80 text-[#1D4ED8] px-2 py-0.5 rounded-full font-bold">Audit</span>
                            </button>
                        </nav>

                        <div className="pt-4 border-t border-slate-200 flex flex-col gap-2.5">
                            <button
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    navigate("/login");
                                }}
                                className="w-full py-2.5 text-center text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                            >
                                Sign In
                            </button>
                            <RoleSelector 
                                type="register" 
                                label="Get Started"
                                className="w-full"
                                buttonClassName="w-full py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] rounded-full shadow-sm transition-colors cursor-pointer justify-center"
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* =====================================================
                HERO SECTION
            ====================================================== */}
            <section id="home" className="relative pt-12 pb-20 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32">
                <div className="absolute -bottom-8 left-0 pointer-events-none -z-5 opacity-40 hidden md:block">
                    <svg width="240" height="280" viewBox="0 0 240 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path 
                            d="M-20 280C20 220 80 180 140 180C110 220 50 260 -20 280Z" 
                            stroke="#BFDBFE" 
                            strokeWidth="1.75" 
                            strokeLinecap="round" 
                            fill="rgba(239, 246, 255, 0.4)" 
                        />
                        <path 
                            d="M20 280C50 200 120 150 200 140C160 190 90 250 20 280Z" 
                            stroke="#93C5FD" 
                            strokeWidth="1.75" 
                            strokeLinecap="round" 
                            fill="rgba(219, 234, 254, 0.3)" 
                        />
                        <path 
                            d="M-10 280C0 170 60 110 130 90C110 150 50 220 -10 280Z" 
                            stroke="#BFDBFE" 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                        />
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
                        {/* Hero Left Column */}
                        <div className="lg:col-span-6 z-10">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold text-[#2563EB] bg-blue-50/90 border border-blue-200/70 uppercase tracking-widest mb-4">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                                <span>Welcome To SkillSync</span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-bold text-slate-900 tracking-[-0.03em] leading-[1.12]">
                                Your Skills. <br className="hidden sm:inline" />
                                Your Work. <br className="hidden sm:inline" />
                                <span className="text-[#2563EB]">Your Proof.</span>
                            </h1>

                            <p className="mt-5 text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal tracking-[-0.01em]">
                                Connect your projects, showcase your skills, and build a portfolio backed by real work.
                            </p>

                            {/* CTA Action Buttons */}
                            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-8 py-3.5 text-base font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] rounded-full transition-all duration-200 cursor-pointer shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2"
                                >
                                    Get Started
                                </button>
                                <button
                                    onClick={() => scrollToSection("features")}
                                    className="px-7 py-3.5 text-base font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-white hover:bg-blue-50/50 active:scale-[0.98] border border-blue-200 hover:border-blue-400 rounded-full transition-all duration-200 cursor-pointer shadow-xs hover:shadow text-center flex items-center justify-center gap-2 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <span>Explore Features</span>
                                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-10 pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-6 text-xs sm:text-sm font-medium text-slate-500">
                                <div className="flex items-center gap-2 hover:text-[#2563EB] transition-colors duration-200 cursor-default">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB]">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span>Ethereum Verified</span>
                                </div>
                                <div className="flex items-center gap-2 hover:text-[#2563EB] transition-colors duration-200 cursor-default">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB]">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span>Tamper-Resistant</span>
                                </div>
                                <div className="flex items-center gap-2 hover:text-[#2563EB] transition-colors duration-200 cursor-default">
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[#2563EB]">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span>GitHub Synced</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Right Column */}
                        <div className="lg:col-span-6 relative">
                            <div 
                                className="absolute -inset-4 sm:-inset-6 lg:-inset-8 rounded-[2.5rem] bg-gradient-to-tr from-blue-100/60 via-blue-50/40 to-transparent -z-10 transform -rotate-1"
                            />

                            <div className="relative rounded-2xl overflow-hidden bg-white/70 border border-slate-200/70 p-3 sm:p-4 shadow-xl shadow-blue-900/5 card-hover-effect group">
                                <img 
                                    src={heroIllustration} 
                                    alt="SkillSync Team collaborating on verified developer skills and code proof" 
                                    className="w-full h-auto rounded-xl object-cover transform group-hover:scale-[1.01] transition-transform duration-500 ease-out"
                                />

                                <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-blue-200/80 shadow-md text-xs font-semibold text-[#0F172A] hover:border-blue-400 transition-colors">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Sepolia Ledger Verified</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                PROOF METRICS / TRUST BAR
            ====================================================== */}
            <section className="border-y border-slate-200/70 bg-white/60 py-10">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
                        <div className="p-4 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 border border-transparent hover:border-slate-200/80 cursor-default">
                            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">100%</p>
                            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">Cryptographic On-Chain Proof</p>
                        </div>
                        <div className="p-4 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 border border-transparent hover:border-slate-200/80 cursor-default">
                            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">SHA-256</p>
                            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">Tamper-Proof Document Hashes</p>
                        </div>
                        <div className="p-4 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 border border-transparent hover:border-slate-200/80 cursor-default">
                            <p className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Direct</p>
                            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">GitHub Repo & Milestone Sync</p>
                        </div>
                        <div className="p-4 rounded-xl transition-all duration-200 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 border border-transparent hover:border-slate-200/80 cursor-default">
                            <p className="text-3xl sm:text-4xl font-bold text-[#2563EB] tracking-tight">Instant</p>
                            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">Public Recruiter Audits</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FEATURES SECTION
            ====================================================== */}
            <section id="features" className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="max-w-2xl mx-auto text-center mb-16">
                        <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest mb-2.5">
                            Platform Features
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                            Built for Real Work, Not Just Resumes
                        </h2>
                        <p className="mt-3 text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                            Replace unverifiable self-reported claims with cryptographic proof anchored directly to the Ethereum blockchain.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Feature 1 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Project Code Verification
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Connect student GitHub repositories and code commits directly to verifiable project milestones.
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                On-Chain Cryptographic Proof
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Digital certificate fingerprints are anchored permanently on Ethereum Sepolia, preventing fraud and alteration.
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Institutional Endorsements
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Universities, companies, and accredited training organizations issue signed credentials with one click.
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Instant Recruiter Audits
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Recruiters and employers can audit certificate authenticity on-chain in seconds via the top navigation bar.
                            </p>
                        </div>

                        {/* Feature 5 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Verified Job Opportunities
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Get discovered by leading companies hiring developers based on actual verified skills rather than exaggerated CVs.
                            </p>
                        </div>

                        {/* Feature 6 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs group">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-300">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Permanent Self-Sovereign Record
                            </h3>
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed font-normal">
                                Your achievements remain yours forever. No expired accounts or proprietary lock-ins—publicly auditable on the blockchain.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                HOW IT WORKS SECTION
            ====================================================== */}
            <section id="how-it-works" className="py-20 md:py-28 bg-white/70 border-y border-slate-200/70">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="max-w-2xl mx-auto text-center mb-16">
                        <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest mb-2.5">
                            How It Works
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                            From Project Work to Immutable Proof
                        </h2>
                        <p className="mt-3 text-slate-600 text-base sm:text-lg leading-relaxed font-normal">
                            Three simple, secure steps to turn your real engineering milestones into trusted career assets.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Step 1 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-8 shadow-xs relative group">
                            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-blue-100 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200 mb-6">
                                STEP 01
                            </span>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Connect & Build
                            </h3>
                            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
                                Add your projects, connect your GitHub code repository, and submit verification requests or receive credentials directly from partner organisations.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-8 shadow-xs relative group">
                            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-blue-100 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200 mb-6">
                                STEP 02
                            </span>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Anchor on Blockchain
                            </h3>
                            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
                                SkillSync computes a SHA-256 cryptographic digest of your credential and records it directly on Ethereum Sepolia smart contracts.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="card-hover-effect rounded-2xl border border-slate-200/80 bg-[#F8FAFC] p-8 shadow-xs relative group">
                            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wider bg-blue-100 text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors duration-200 mb-6">
                                STEP 03
                            </span>
                            <h3 className="text-lg sm:text-xl font-semibold text-slate-900 group-hover:text-[#2563EB] transition-colors duration-200 tracking-tight">
                                Share & Verify
                            </h3>
                            <p className="mt-2.5 text-sm text-slate-600 leading-relaxed font-normal">
                                Share your verified portfolio link or QR code with hiring managers, who can audit authenticity with zero friction.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                ABOUT / PROOF VS RESUMES COMPARISON SECTION
            ====================================================== */}
            <section id="about" className="py-20 md:py-28 bg-white/70 border-t border-slate-200/70">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-5">
                            <p className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest mb-2.5">
                                The SkillSync Standard
                            </p>
                            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
                                Proof Over Promises. <br />
                                Transparent By Design.
                            </h2>
                            <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                                In today's tech market, anyone can write anything on a resume. SkillSync establishes a trust layer between builders and companies by tying credentials directly to cryptographic proof.
                            </p>
                            
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <button
                                    onClick={() => navigate("/register")}
                                    className="px-7 py-3.5 text-sm font-semibold rounded-full bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                                >
                                    Build Your Verified Profile →
                                </button>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Traditional Resume Box */}
                                <div className="card-hover-effect rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6 shadow-xs group">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Traditional Resumes</span>
                                    <h4 className="text-base font-semibold text-slate-900 mt-2 mb-4 group-hover:text-rose-600 transition-colors">
                                        Unverified Claims
                                    </h4>
                                    <ul className="space-y-3 text-xs sm:text-sm text-slate-500 font-normal">
                                        <li className="flex items-start gap-2">
                                            <span className="text-rose-500 font-bold">✕</span>
                                            <span>Easy to exaggerate skills and timeline</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-rose-500 font-bold">✕</span>
                                            <span>PDF certificates can be forged or edited</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-rose-500 font-bold">✕</span>
                                            <span>Slow background verification processes</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* SkillSync Verified Box */}
                                <div className="card-hover-effect rounded-2xl border-2 border-blue-200 bg-blue-50/40 p-6 shadow-sm group">
                                    <span className="text-xs font-semibold text-[#2563EB] uppercase tracking-widest">SkillSync Standard</span>
                                    <h4 className="text-base font-semibold text-slate-900 mt-2 mb-4 group-hover:text-[#2563EB] transition-colors">
                                        Cryptographic Proof
                                    </h4>
                                    <ul className="space-y-3 text-xs sm:text-sm text-slate-700 font-normal">
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span>Linked directly to real GitHub repository commits</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span>SHA-256 hash anchored to Ethereum ledger</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 font-bold">✓</span>
                                            <span>Instant, friction-free verification for employers</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                PRIMARY CALL TO ACTION BANNER
            ====================================================== */}
            <section className="py-16 md:py-24">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-[#1D4ED8] p-10 sm:p-14 text-white text-center shadow-xl shadow-blue-600/20 relative overflow-hidden card-hover-effect">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
                        
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                                Ready to prove your skills with real work?
                            </h2>
                            <p className="mt-4 text-blue-100 text-base sm:text-lg leading-relaxed font-normal">
                                Join students and organisations verifying credentials with tamper-proof blockchain records.
                            </p>
                            
                            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                                <button
                                    onClick={() => navigate("/register")}
                                    className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-900 bg-white hover:bg-slate-50 active:scale-[0.98] rounded-full transition-all duration-200 cursor-pointer shadow-md text-center"
                                >
                                    Get Started Free
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="w-full sm:w-auto px-7 py-3.5 text-base font-semibold text-white bg-blue-700/60 hover:bg-blue-700 active:scale-[0.98] border border-white/20 rounded-full transition-all duration-200 cursor-pointer text-center"
                                >
                                    Sign In to Portal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =====================================================
                FOOTER
            ====================================================== */}
            <footer id="contact" className="border-t border-slate-200 bg-white py-12 text-slate-500 text-sm">
                <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
                        {/* Brand Column */}
                        <div className="md:col-span-1 space-y-3">
                            <div className="flex items-center gap-2.5">
                                <div className="text-[#2563EB]">
                                    <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M10 8L3 16L10 24" />
                                        <path d="M22 8L29 16L22 24" />
                                        <line x1="18" y1="6" x2="14" y2="26" stroke="#3B82F6" strokeWidth="2.5" />
                                    </svg>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-slate-900">
                                    Skill<span className="text-[#2563EB]">Sync</span>
                                </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-500 font-normal">
                                Tamper-resistant credential and skill verification on the Ethereum blockchain.
                            </p>
                        </div>

                        {/* Navigation Links */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-3">Navigation</p>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <button onClick={() => scrollToSection("home")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Home
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection("features")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Features
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection("how-it-works")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        How It Works
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setIsVerifyModalOpen(true)} className="hover:text-[#2563EB] font-medium transition-colors cursor-pointer text-[#2563EB]">
                                        Verify a Certificate
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => scrollToSection("about")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        About
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Portals & Access */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-3">Portals</p>
                            <ul className="space-y-2 text-xs font-medium">
                                <li>
                                    <button onClick={() => navigate("/login")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Sign In
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate("/register")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Student Registration
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => navigate("/org/register")} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Organisation Registration
                                    </button>
                                </li>
                                <li>
                                    <button onClick={() => setIsVerifyModalOpen(true)} className="hover:text-[#2563EB] transition-colors cursor-pointer">
                                        Verify a Certificate
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact & Network */}
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-900 mb-3">Network</p>
                            <ul className="space-y-2 text-xs font-normal text-slate-500">
                                <li>Network: Ethereum Sepolia</li>
                                <li>Smart Contract: Audited SHA-256 Registry</li>
                                <li>Support: support@skillsync.com</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3 font-normal">
                        <p>© {new Date().getFullYear()} SkillSync. All rights reserved.</p>
                        <p>Your Skills. Your Work. Your Proof.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;