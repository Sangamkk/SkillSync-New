import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

import {
    extractCertificate
} from "../../services/mlServices";


const ExtractCertificate = () => {
    const { certificateId } = useParams();
    const navigate = useNavigate();

    const handleExtraction = async () => {
        try {
            console.log("Extracting certificate:", certificateId);
            const result = await extractCertificate(certificateId);
            console.log("Extraction result:", result);
        } catch (error) {
            console.error("Extraction error:", error.response?.data || error.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                        ← Back
                    </button>
                    <Link
                        to="/organisation"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition"
                    >
                        🏢 Org Dashboard
                    </Link>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl shadow-xl">
                    <h1 className="text-3xl font-bold mb-6">
                        Certificate Extraction
                    </h1>
                    <button
                        onClick={handleExtraction}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition"
                    >
                        Extract Certificate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExtractCertificate;