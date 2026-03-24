/**
 * AHSLandingPage.jsx — AHS Portal Session Picker
 *
 * Standalone entry point for AHS users.
 * Lists available sessions and navigates to /ahs/:sessionId on selection.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSessions } from "../api/client";

export default function AHSLandingPage() {
    const navigate = useNavigate();

    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchSessions()
            .then(setSessions)
            .catch((err) => setError(err.message ?? "Failed to load sessions"))
            .finally(() => setLoading(false));
    }, []);

    function formatDate(dateStr) {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleString();
    }

    return (
        <div className="min-h-screen bg-brand-navy text-white">

            <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
                <h1 className="text-brand-gold text-xl font-semibold">AHS Portal</h1>
            </header>

            <main className="max-w-3xl mx-auto px-8 py-10">
                <h2 className="text-white/60 text-sm uppercase tracking-widest mb-4">
                    Select a Session
                </h2>

                {loading && <p className="text-brand-gray text-sm">Loading...</p>}
                {error && <p className="text-red-400 text-sm">{error}</p>}

                {!loading && !error && sessions.length === 0 && (
                    <p className="text-brand-gray text-sm">No sessions found.</p>
                )}

                {!loading && !error && sessions.length > 0 && (
                    <ul className="flex flex-col gap-2">
                        {sessions.map((session) => (
                            <li
                                key={session.session_id}
                                onClick={() => navigate(`/ahs/${session.session_id}`)}
                                className="flex items-center justify-between bg-white/5 border border-white/10
                           rounded-lg px-6 py-4 cursor-pointer hover:bg-white/10 transition-colors"
                            >
                                <div>
                                    <p className="text-white text-sm font-medium">{session.session_id}</p>
                                    <p className="text-brand-gray text-xs mt-1">{formatDate(session.created_at)}</p>
                                </div>
                                <span className="text-brand-gray text-sm">→</span>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    );
}