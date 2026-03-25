/**
 * SessionPage.jsx
 *
 * Displays a single session — live or historical.
 * Owns all data state and passes it down to BodyMap and Timeline.
 *
 * On mount:
 *   - Fetches injuries, medications, interventions for this session
 *
 * While live (session is active):
 *   - SSE events trigger re-fetches of the relevant data type
 *   - A "Live" badge is shown in the header
 *   - session_end event clears the live state
 *
 * Layout:
 *   - BodyMap  gets ~35% width on large screens (lg:w-[35%])
 *   - Timeline gets the remaining width (flex-1)
 *   - On smaller screens they stack vertically (BodyMap above Timeline)
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchMedications, fetchInterventions, fetchVisual, fetchActiveSession } from "../api/client";
import useSSE from "../hooks/useSSE";
import BodyMap from "../components/BodyMap";
import Timeline from "../components/Timeline";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // device_id is embedded in session_id: session_{date}_{time}_{device_id}
  const deviceId = sessionId.split("_").slice(3).join("_");

  const [visual, setVisual] = useState({});
  const [medications, setMedications] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Initial data load + check if this is the active session
  useEffect(() => {
    async function load() {
      try {
        const [active, meds, intervents, injs] = await Promise.all([
          fetchActiveSession(),
          fetchMedications(sessionId).catch(() => []),
          fetchInterventions(sessionId).catch(() => []),
          fetchVisual(sessionId, deviceId).catch(() => ({})),
        ]);

        setIsLive(active.session_id === sessionId);
        setMedications(meds);
        setInterventions(intervents);
        setVisual(injs);
      } catch (err) {
        setError(err.message ?? "Failed to load session");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId]);

  // SSE — re-fetch only the data type that changed
  useSSE((event) => {
    if (event.session_id !== sessionId) return;

    if (event.data_type === "medx") {
      fetchMedications(sessionId).then(setMedications).catch(() => { });
    }
    if (event.data_type === "intervention") {
      fetchInterventions(sessionId).then(setInterventions).catch(() => { });
    }
    if (event.data_type === "visual") {
      fetchVisual(sessionId, deviceId).then(setVisual).catch(() => { });
    }
    if (event.data_type === "session_end") {
      setIsLive(false);
      alert("Session has ended.");
      navigate("/ems");
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg text-ink flex flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center pb-24">
          <p className="text-muted text-sm">Loading session…</p>
        </main>

        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-app-bg text-ink flex flex-col">
        <Navbar />

        <main className="flex-1 flex items-center justify-center pb-24">
          <p className="text-red-400 text-sm">{error}</p>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="h-[100%] bg-app-bg text-ink flex flex-col">
      <Navbar />

      <main className="flex-1 px-6 py-6 pb-24 overflow-hidden">
        <div className="flex items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              to="/ems"
              className="text-muted text-base hover:text-ink transition-all ease-in-out underline-offset-4 hover:underline whitespace-nowrap"
            >
              ← Sessions
            </Link>
            <span className="text-muted/80 text-sm truncate">{sessionId}</span>
          </div>

          {isLive && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold" />
              </span>
              <span className="text-brand-gold text-lg font-bold">Live</span>
            </div>
          )}
        </div>

        {/*
          Two-column layout:
            BodyMap  — lg:w-[35%], flex-shrink-0
            Timeline — flex-1, min-w-0 (prevents flex overflow)
          On screens smaller than lg (1024px) they stack: body map above, timeline below.
        */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

          {/* Body map — fixed proportion, centred when stacked */}
          <div className="w-full lg:w-[25%] flex-shrink-0 flex justify-center lg:justify-start">
            <BodyMap visual={visual} sessionId={sessionId} deviceId={deviceId} />
          </div>

          {/* Timeline — takes remaining width; min-w-0 + overflow-hidden contain scroll */}
          <div className="flex-1 min-w-0 w-full overflow-hidden">
            <Timeline
              medications={medications}
              interventions={interventions}
              visual={visual}
            />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}