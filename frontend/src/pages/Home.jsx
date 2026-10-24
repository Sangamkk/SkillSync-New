import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleSelector from "../components/common/RoleSelector";
import HomeDocumentVerifier from "../components/common/HomeDocumentVerifier";

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
                            <button
                                onClick={() => scrollToSection("contact")}
                                className="text-sm font-medium text-[#666666] hover:text-[#0A66C2] transition-colors cursor-pointer"
                            >
                                Contact
                            </button>
                        </nav>
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
                                </div>

                                <div className="py-4 border-b border-[#D9E1E8]">
                                    <p className="text-[11px] text-[#666666]">Credential Title</p>
                                    <h3 className="text-sm font-bold text-[#191919] mt-0.5">
                                        Full-Stack Systems Engineering
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