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
import { fetchSessions, fetchActiveSession } from "../api/client";
import useSSE from "../hooks/useSSE";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { formatLocalDateLabel, formatLocalTimeHourMinute } from "../utils/time";

export default function HomePage({ portalName = "LifeLens", sessionBasePath = "/ems/session" }) {
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

  return (
    <div className="min-h-screen bg-app-bg text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-full px-8 py-10 pb-24">
        <button
          onClick={() => navigate("/")}
          className="text-muted text-base md:text-lg hover:text-ink transition-all ease-in-out underline-offset-4 hover:underline"
        >
          ← Portals
        </button>
        <h1 className="text-brand-gold text-2xl md:text-4xl text-center font-semibold">{portalName}</h1>

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

        <h2 className="text-muted text-lg uppercase tracking-widest mb-4">
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
          <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <li
                key={session.session_id}
                onClick={() => navigate(`${sessionBasePath}/${session.session_id}`)}
                className="group bg-white/80 border border-muted/20 rounded-xl p-5 cursor-pointer
                           hover:bg-white hover:border-brand-gold/40 transition-all shadow-sm hover:shadow
                           min-h-[140px] flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-muted text-sm uppercase tracking-widest">Date</p>
                    <p className="text-ink text-lg font-semibold mt-1">
                      {formatLocalDateLabel(session.created_at)}
                    </p>
                  </div>

                  <span className="text-muted text-sm group-hover:text-brand-gold transition-colors">
                    View →
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-muted text-sm uppercase tracking-widest">
                    Session Started:
                  </p>
                  <p className="text-ink text-base font-medium mt-1">
                    {formatLocalTimeHourMinute(session.created_at)}
                  </p>

                  <p className="text-muted text-xs mt-3 truncate">
                    ID: {session.session_id}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}

      </main>

      <Footer />
    </div>
  );
}
