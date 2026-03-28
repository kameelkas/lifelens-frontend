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

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchMedications, fetchInterventions, fetchVisual, fetchActiveSession } from "../api/client";
import useSSE from "../hooks/useSSE";
import BodyMap from "../components/BodyMap";
import Timeline from "../components/Timeline";
import { formatSessionStartedAt } from "../utils/sessionDisplay";

/** Keep "Updating…" visible at least this long so fast local fetches don't flash sub-frame. */
const LIVE_SYNC_MIN_DISPLAY_MS = 280;

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // device_id is embedded in session_id: session_{date}_{time}_{device_id}
  const deviceId = sessionId.split("_").slice(3).join("_");

  const [visual, setVisual] = useState({});
  const [medications, setMedications] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [isLive, setIsLive] = useState(false);
  const [liveSyncing, setLiveSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const liveFetchCountRef = useRef(0);
  const liveSyncStartedAtRef = useRef(0);
  const liveSyncHideTimeoutRef = useRef(null);

  const trackLiveFetch = (promise) => {
    if (liveFetchCountRef.current === 0) {
      if (liveSyncHideTimeoutRef.current != null) {
        clearTimeout(liveSyncHideTimeoutRef.current);
        liveSyncHideTimeoutRef.current = null;
      }
      liveSyncStartedAtRef.current = Date.now();
      setLiveSyncing(true);
    }
    liveFetchCountRef.current += 1;

    promise.finally(() => {
      liveFetchCountRef.current -= 1;
      if (liveFetchCountRef.current > 0) return;
      liveFetchCountRef.current = 0;

      const elapsed = Date.now() - liveSyncStartedAtRef.current;
      const remaining = Math.max(0, LIVE_SYNC_MIN_DISPLAY_MS - elapsed);

      if (liveSyncHideTimeoutRef.current != null) {
        clearTimeout(liveSyncHideTimeoutRef.current);
      }
      liveSyncHideTimeoutRef.current = setTimeout(() => {
        liveSyncHideTimeoutRef.current = null;
        setLiveSyncing(false);
      }, remaining);
    });
  };

  useEffect(
    () => () => {
      if (liveSyncHideTimeoutRef.current != null) {
        clearTimeout(liveSyncHideTimeoutRef.current);
      }
    },
    [],
  );

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
      trackLiveFetch(
        fetchMedications(sessionId).then(setMedications).catch(() => { }),
      );
    }
    if (event.data_type === "intervention") {
      trackLiveFetch(
        fetchInterventions(sessionId).then(setInterventions).catch(() => { }),
      );
    }
    if (event.data_type === "visual") {
      trackLiveFetch(
        fetchVisual(sessionId, deviceId).then(setVisual).catch(() => { }),
      );
    }
    if (event.data_type === "session_end") {
      setIsLive(false);
      alert("Session has ended.");
      navigate("/ems");
    }
  });

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center pb-24">
        <p className="text-muted text-sm">Loading session…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center pb-24">
        <p className="text-red-400 text-sm">{error}</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 pb-24 overflow-hidden">
      {isLive && liveSyncing && (
        <div
          className="-mx-6 -mt-6 mb-6 h-0.5 overflow-hidden bg-muted/15"
          aria-hidden
        >
          <div className="h-full w-2/5 rounded-full bg-brand-gold/90 shadow-[0_0_10px_rgb(var(--color-brand-gold)/0.45)] animate-live-sync-bar" />
        </div>
      )}

      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="flex min-w-0 flex-col gap-1">
          <Link
            to="/ems"
            className="text-muted text-base hover:text-brand-gold transition-all ease-in-out underline-offset-4 hover:underline whitespace-nowrap w-fit"
          >
            ← Sessions
          </Link>
          <span className="text-muted/80 text-sm truncate">
            {formatSessionStartedAt(sessionId)}
          </span>
        </div>

        {isLive && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              {liveSyncing ? (
                <span
                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2 border-brand-gold border-t-transparent animate-spin"
                  aria-hidden
                />
              ) : (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-gold opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-gold" />
                </span>
              )}
              <span className="text-brand-gold text-lg font-bold">
                {liveSyncing ? "Updating…" : "Live"}
              </span>
            </div>
            {!liveSyncing && (
              <span className="text-muted text-xs font-medium animate-pulse">
                Listening for updates
              </span>
            )}
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
  );
}