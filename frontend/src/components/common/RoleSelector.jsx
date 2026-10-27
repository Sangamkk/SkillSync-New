import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const RoleSelector = ({ type = "register", className = "", buttonClassName = "", label = null }) => {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const selectorRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                selectorRef.current &&
                !selectorRef.current.contains(event.target)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleRoleSelect = (role) => {
        setOpen(false);

        if (type === "register") {
            if (role === "applicant") {
                navigate("/register");
            } else if (role === "organisation") {
                navigate("/org/register");
            }
        }

        if (type === "login") {
            navigate("/login");
        }
    };

    const defaultButtonClass = "inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors duration-150 cursor-pointer shadow-xs";

    return (
        <div ref={selectorRef} className={`relative inline-block ${className}`}>
            {/* Main Button */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={buttonClassName || defaultButtonClass}
            >
                <span>{label || (type === "register" ? "Create Account" : "Login")}</span>
                <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                    {/* Applicant */}
                    <button
                        type="button"
                        onClick={() => handleRoleSelect("applicant")}
                        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50/60 cursor-pointer group"
                    >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                Student / Applicant
                            </p>
                            <p className="text-xs text-slate-500">
                                {type === "register"
                                    ? "Create your student portfolio"
                                    : "Sign in to applicant dashboard"}
                            </p>
                        </div>
                    </button>

                    {/* Organisation */}
                    <button
                        type="button"
                        onClick={() => handleRoleSelect("organisation")}
                        className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50 cursor-pointer group"
                    >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                Organisation
                            </p>
                            <p className="text-xs text-slate-500">
                                {type === "register"
                                    ? "Register university or company"
                                    : "Sign in as organisation"}
                            </p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoleSelector;