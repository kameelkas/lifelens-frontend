/**
 * PortalPickerPage.jsx
 *
 * Post-login landing page. Two large buttons let the user choose
 * between the EMS Portal (live monitoring) and the AHS Portal (image review).
 */

import { useNavigate } from "react-router-dom";

export default function PortalPickerPage() {
    const navigate = useNavigate();

    return (
        <main className="flex-1 max-w-4xl mx-auto px-8 py-24 pb-28">
            <h2 className="text-muted text-4xl sm:text-5xl font-semibold uppercase tracking-widest text-center mb-12">
                Select a Portal
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <button
                    onClick={() => navigate("/ems")}
                    className="group flex flex-col items-center gap-5 bg-white/80 border border-muted/20
                               rounded-2xl px-10 py-16 hover:bg-white hover:border-brand-gold/50
                               transition-all cursor-pointer shadow-sm hover:shadow"
                >
                    <span className="text-6xl">🚑</span>
                    <span className="text-ink text-2xl font-semibold group-hover:text-brand-gold transition-colors">
                        EMS Portal
                    </span>
                    <span className="text-muted text-base text-center leading-relaxed max-w-sm">
                        Live session monitoring, body map, and timeline
                    </span>
                </button>

                <button
                    onClick={() => navigate("/ahs")}
                    className="group flex flex-col items-center gap-5 bg-white/80 border border-muted/20
                               rounded-2xl px-10 py-16 hover:bg-white hover:border-brand-gold/50
                               transition-all cursor-pointer shadow-sm hover:shadow"
                >
                    <span className="text-6xl">🏥</span>
                    <span className="text-ink text-2xl font-semibold group-hover:text-brand-gold transition-colors">
                        AHS Portal
                    </span>
                    <span className="text-muted text-base text-center leading-relaxed max-w-sm">
                        Session image review and decryption
                    </span>
                </button>
            </div>
        </main>
    );
}
