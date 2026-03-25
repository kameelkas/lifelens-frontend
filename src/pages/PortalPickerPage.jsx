/**
 * PortalPickerPage.jsx
 *
 * Post-login landing page. Two large buttons let the user choose
 * between the EMS Portal (live monitoring) and the AHS Portal (image review).
 */

import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function PortalPickerPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-app-bg text-ink flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-2xl mx-auto px-8 py-20 pb-24">
                <h2 className="text-muted text-sm uppercase tracking-widest text-center mb-10">
                    Select a Portal
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <button
                        onClick={() => navigate("/ems")}
                        className="group flex flex-col items-center gap-4 bg-white/75 border border-muted/20
                                   rounded-xl px-8 py-12 hover:bg-white hover:border-brand-gold/50
                                   transition-all cursor-pointer"
                    >
                        <span className="text-4xl">🚑</span>
                        <span className="text-ink text-lg font-semibold group-hover:text-brand-gold transition-colors">
                            EMS Portal
                        </span>
                        <span className="text-muted text-sm text-center leading-relaxed">
                            Live session monitoring, body map, and timeline
                        </span>
                    </button>

                    <button
                        onClick={() => navigate("/ahs")}
                        className="group flex flex-col items-center gap-4 bg-white/75 border border-muted/20
                                   rounded-xl px-8 py-12 hover:bg-white hover:border-brand-gold/50
                                   transition-all cursor-pointer"
                    >
                        <span className="text-4xl">🏥</span>
                        <span className="text-ink text-lg font-semibold group-hover:text-brand-gold transition-colors">
                            AHS Portal
                        </span>
                        <span className="text-muted text-sm text-center leading-relaxed">
                            Session image review and decryption
                        </span>
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}
