/**
 * HomePage.jsx
 *
 * Displays:
 *   - A live session banner if a session is currently active
 *   - A list of the 20 most recent past sessions
 *
 * Clicking a session navigates to /session/:id
 * The live banner also navigates to /session/:id for the active session
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchSessions, fetchActiveSession } from "../api/client";
import useSSE from "../hooks/useSSE";

export default function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load sessions and check for active session on mount
  useEffect(() => {
    async function load() {
      try {
        const [sessionList, active] = await Promise.all([
          fetchSessions(),
          fetchActiveSession(),
        ]);
        setSessions(sessionList);
        setActiveSession(active.session_id ? active : null);
      } catch (err) {
        setError(err.message ?? "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Listen for session_start / session_end events via SSE
  useSSE((event) => {
    if (event.data_type === "session_start") {
      setActiveSession({ session_id: event.session_id, device_id: event.device_id });
    }
    if (event.data_type === "session_end") {
      setActiveSession(null);
      // Refresh session list so the ended session appears
      fetchSessions().then(setSessions).catch(() => { });
    }
  });

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-brand-navy text-white">

      {/* Header */}
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

      <main className="max-w-3xl mx-auto px-8 py-10">

        {/* Live session banner */}
        {activeSession && (
          <div
            onClick={() => navigate(`/session/${activeSession.session_id}`)}
            className="mb-8 flex items-center justify-between bg-brand-gold/10 border
                       border-brand-gold/40 rounded-lg px-6 py-4 cursor-pointer
                       hover:bg-brand-gold/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full
                                 rounded-full bg-brand-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-gold" />
              </span>
              <span className="text-brand-gold font-semibold">Live Session Active</span>
            </div>
            <span className="text-brand-gold text-sm">View →</span>
          </div>
        )}

        {/* Past sessions */}
        <h2 className="text-white/60 text-sm uppercase tracking-widest mb-4">
          Recent Sessions
        </h2>

        {loading && (
          <p className="text-brand-gray text-sm">Loading...</p>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="text-brand-gray text-sm">No sessions recorded yet.</p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                onClick={() => navigate(`/session/${session.session_id}`)}
                className="flex items-center justify-between bg-white/5 border border-white/10
                           rounded-lg px-6 py-4 cursor-pointer hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="text-white text-sm font-medium">
                    {session.session_id}
                  </p>
                  <p className="text-brand-gray text-xs mt-1">
                    {formatDate(session.created_at)}
                  </p>
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