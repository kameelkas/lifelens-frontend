/**
 * PortalPickerPage.jsx
 *
 * Post-login landing page. Two large buttons let the user choose
 * between the EMS Portal (live monitoring) and the AHS Portal (image review).
 */

import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function PortalPickerPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-brand-navy text-white">

            <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
                <h1 className="text-brand-gold text-xl font-semibold">LifeLens</h1>
                <div className="flex items-center gap-4">
                    <span className="text-brand-gray text-sm">{user}</span>
                    <button
                        onClick={logout}
                        className="text-brand-gray text-sm hover:text-white transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-8 py-20">
                <h2 className="text-white/60 text-sm uppercase tracking-widest text-center mb-10">
                    Select a Portal
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                        onClick={() => navigate("/ems")}
                        className="group flex flex-col items-center gap-4 bg-white/5 border border-white/10
                                   rounded-xl px-8 py-12 hover:bg-white/10 hover:border-brand-gold/40
                                   transition-all cursor-pointer"
                    >
                        <span className="text-4xl">🚑</span>
                        <span className="text-white text-lg font-semibold group-hover:text-brand-gold transition-colors">
                            EMS Portal
                        </span>
                        <span className="text-brand-gray text-xs text-center leading-relaxed">
                            Live session monitoring, body map, and timeline
                        </span>
                    </button>

                    <button
                        onClick={() => navigate("/ahs")}
                        className="group flex flex-col items-center gap-4 bg-white/5 border border-white/10
                                   rounded-xl px-8 py-12 hover:bg-white/10 hover:border-brand-gold/40
                                   transition-all cursor-pointer"
                    >
                        <span className="text-4xl">🏥</span>
                        <span className="text-white text-lg font-semibold group-hover:text-brand-gold transition-colors">
                            AHS Portal
                        </span>
                        <span className="text-brand-gray text-xs text-center leading-relaxed">
                            Session image review and decryption
                        </span>
                    </button>
                </div>
            </main>
        </div>
    );
}
