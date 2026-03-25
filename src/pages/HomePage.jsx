/**
 * HomePage.jsx — Shared sessions list
 *
 * Used by both EMS and AHS portals. The `portalName` prop controls
 * the header title, and `sessionBasePath` controls where clicking
 * a session navigates (e.g. "/ems/session" or "/ahs").
 *
 * Props:
 *   portalName       — display name in the header (e.g. "EMS Portal")
 *   sessionBasePath  — path prefix for session links (e.g. "/ems/session")
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchSessions, fetchActiveSession } from "../api/client";
import useSSE from "../hooks/useSSE";

export default function HomePage({ portalName = "LifeLens", sessionBasePath = "/ems/session" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useSSE((event) => {
    if (event.data_type === "session_start") {
      setActiveSession({ session_id: event.session_id, device_id: event.device_id });
    }
    if (event.data_type === "session_end") {
      setActiveSession(null);
      fetchSessions().then(setSessions).catch(() => { });
    }
  });

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString();
  }

  return (
    <div className="min-h-screen bg-app-bg text-ink">

      <header className="flex items-center justify-between px-8 py-5 border-b border-muted/20">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-muted text-sm hover:text-ink transition-colors"
          >
            ← Portals
          </button>
          <h1 className="text-brand-gold text-xl font-semibold">{portalName}</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-muted text-sm">{user}</span>
          <button
            onClick={logout}
            className="text-muted text-sm hover:text-ink transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-10">

        {activeSession && (
          <div
            onClick={() => navigate(`${sessionBasePath}/${activeSession.session_id}`)}
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

        <h2 className="text-muted text-sm uppercase tracking-widest mb-4">
          Recent Sessions
        </h2>

        {loading && (
          <p className="text-muted text-sm">Loading...</p>
        )}

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="text-muted text-sm">No sessions recorded yet.</p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                onClick={() => navigate(`${sessionBasePath}/${session.session_id}`)}
                className="flex items-center justify-between bg-white/75 border border-muted/20
                           rounded-lg px-6 py-4 cursor-pointer hover:bg-white transition-colors"
              >
                <div>
                  <p className="text-ink text-sm font-medium">
                    {session.session_id}
                  </p>
                  <p className="text-muted text-xs mt-1">
                    {formatDate(session.created_at)}
                  </p>
                </div>
                <span className="text-muted text-sm">→</span>
              </li>
            ))}
          </ul>
        )}

      </main>
    </div>
  );
}
