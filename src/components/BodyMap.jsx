/**
 * BodyMap.jsx
 *
 * SVG human body diagram with three distinct states per region:
 *
 *   grey  (status: "none")    — no data detected yet; no hover interaction
 *   green (status: "healthy") — no_injury confirmed; hover shows tooltip + image
 *   red   (status: "injured") — one or more real injuries; hover shows all injuries + image
 *
 * Architecture:
 *   Region       — pure SVG shape, fires onHover / onHoverEnd up to parent
 *   BodyMap      — owns all hover state, image cache, and tooltip rendering
 *
 * The tooltip is a plain HTML div rendered below the SVG (not inside it via
 * foreignObject). This means:
 *   - No SVG clipping
 *   - No overlap with the Timeline or other body parts
 *   - No click-through to elements underneath
 *
 * Image cache: blob URLs are stored in a ref keyed by image_id so each image
 * is fetched at most once per session page mount. All URLs are revoked on unmount.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchDecryptedImage } from "../api/client";

const GREY_COLOR = "#6b7280";
const HEALTHY_COLOR = "#22c55e";
const INJURED_COLOR = "#ef4444";
const MIN_OPACITY = 0.3;

// ── State derivation ──────────────────────────────────────────────────────────

function getRegionState(regionKey, visual) {
  const part = visual?.[regionKey];

  if (!part?.injuries) {
    return { status: "none", fill: GREY_COLOR, opacity: 0.5, allInjuries: [], previewImageId: null };
  }

  const entries = Object.entries(part.injuries);

  if (entries.length === 0) {
    // Model ran but produced no classification — treat same as no data
    return { status: "none", fill: GREY_COLOR, opacity: 0.5, allInjuries: [], previewImageId: null };
  }

  const noInjuryEntry = entries.find(([type]) => type === "no_injury");
  const realInjuries = entries
    .filter(([type]) => type !== "no_injury")
    .map(([type, data]) => ({ type, ...data }));

  if (realInjuries.length === 0) {
    return {
      status: "healthy",
      fill: HEALTHY_COLOR,
      opacity: 1,
      allInjuries: [],
      previewImageId: noInjuryEntry?.[1]?.image_id ?? null,
    };
  }

  const best = realInjuries.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
  return {
    status: "injured",
    fill: INJURED_COLOR,
    opacity: Math.max(MIN_OPACITY, best.accuracy ?? MIN_OPACITY),
    allInjuries: realInjuries,
    previewImageId: best.image_id ?? null,
  };
}

// ── Region — pure SVG shape, no local state ───────────────────────────────────

function Region({ regionKey, visual, onHover, onHoverEnd, children }) {
  const state = getRegionState(regionKey, visual);
  const canHover = state.status !== "none";

  return (
    <g
      style={{ fill: state.fill, opacity: state.opacity, cursor: canHover ? "pointer" : "default" }}
      className="transition-all duration-500"
      onMouseEnter={() => canHover && onHover(regionKey, state)}
      onMouseLeave={onHoverEnd}
    >
      {children}
    </g>
  );
}

// ── Tooltip — plain HTML div, rendered below the SVG ─────────────────────────

function Tooltip({ label, state, imgSrc, imgLoading }) {
  return (
    <div className="w-full mt-2 rounded-lg border border-white/15 bg-brand-navy/95 p-4 shadow-2xl">
      <p className="text-white text-sm font-semibold capitalize mb-2">{label}</p>

      {state.status === "healthy" && (
        <p className="text-green-400 text-xs mb-3">No injuries detected</p>
      )}

      {state.status === "injured" && (
        <ul className="flex flex-col gap-1 mb-3">
          {[...state.allInjuries]
            .sort((a, b) => b.accuracy - a.accuracy)
            .map((inj) => (
              <li key={inj.type} className="flex items-center justify-between">
                <span className="text-red-400 text-xs">{inj.type}</span>
                <span className="text-white/40 text-xs">{(inj.accuracy * 100).toFixed(0)}%</span>
              </li>
            ))}
        </ul>
      )}

      {imgLoading && <p className="text-white/30 text-xs">Loading image…</p>}
      {imgSrc && (
        <img src={imgSrc} alt={label} className="w-full rounded object-contain max-h-48" />
      )}
    </div>
  );
}

// ── BodyMap ───────────────────────────────────────────────────────────────────

export default function BodyMap({ visual = {}, sessionId, deviceId }) {
  // Which region is currently hovered: { key, state } or null
  const [active, setActive] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  // Cache of imageId → blob URL so each image is fetched at most once.
  // Ref so cache updates don't trigger re-renders.
  const imgCache = useRef({});

  // Revoke all cached blob URLs on unmount
  useEffect(() => {
    const cache = imgCache.current;
    return () => Object.values(cache).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const handleHover = useCallback((key, state) => {
    setActive({ key, state });

    const imageId = state.previewImageId;
    if (!imageId) { setImgSrc(null); return; }

    // Serve from cache if available — no extra network request
    if (imgCache.current[imageId]) {
      setImgSrc(imgCache.current[imageId]);
      return;
    }

    setImgSrc(null);
    setImgLoading(true);
    fetchDecryptedImage(sessionId, imageId, deviceId)
      .then((src) => { imgCache.current[imageId] = src; setImgSrc(src); })
      .catch(() => setImgSrc(null))
      .finally(() => setImgLoading(false));
  }, [sessionId, deviceId]);

  const handleHoverEnd = useCallback(() => {
    setActive(null);
    setImgSrc(null);
    setImgLoading(false);
  }, []);

  const r = (key) => ({ regionKey: key, visual, onHover: handleHover, onHoverEnd: handleHoverEnd });

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <h2 className="text-white/60 text-sm uppercase tracking-widest">Body Map</h2>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-brand-gray flex-wrap justify-center mb-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: GREY_COLOR }} />
          No data
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
          Healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
          Injury
        </span>
      </div>

      <svg
        viewBox="0 0 200 285"
        className="w-full max-w-[280px]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="headMask">
            <rect width="100%" height="100%" fill="white" />
            <ellipse cx="100" cy="32" rx="18" ry="14" fill="black" />
          </mask>
        </defs>

        <Region {...r("head")}>
          <ellipse cx="100" cy="30" rx="28" ry="20" mask="url(#headMask)" />
        </Region>

        <Region {...r("face")}>
          <ellipse cx="100" cy="32" rx="18" ry="14" />
        </Region>
        <Region {...r("neck")}>
          <rect x="88" y="50" width="24" height="16" rx="4" />
        </Region>
        <Region {...r("torso")}>
          <rect x="68" y="66" width="64" height="90" rx="6" />
        </Region>
        <Region {...r("arm1")}>
          <rect x="36" y="66" width="28" height="80" rx="10" />
        </Region>
        <Region {...r("arm2")}>
          <rect x="136" y="66" width="28" height="80" rx="10" />
        </Region>
        <Region {...r("hand1")}>
          <ellipse cx="50" cy="158" rx="14" ry="10" />
        </Region>
        <Region {...r("hand2")}>
          <ellipse cx="150" cy="158" rx="14" ry="10" />
        </Region>
        <Region {...r("leg1")}>
          <rect x="70" y="160" width="26" height="100" rx="10" />
        </Region>
        <Region {...r("leg2")}>
          <rect x="104" y="160" width="26" height="100" rx="10" />
        </Region>
        <Region {...r("foot1")}>
          <ellipse cx="83" cy="268" rx="18" ry="10" />
        </Region>
        <Region {...r("foot2")}>
          <ellipse cx="117" cy="268" rx="18" ry="10" />
        </Region>

        <g fill="white" fontSize="7" textAnchor="middle" style={{ pointerEvents: "none" }}>
          <text x="100" y="22">head</text>
          <text x="100" y="34">face</text>
          <text x="100" y="61">neck</text>
          <text x="100" y="115">torso</text>
          <text x="50" y="108">arm R</text>
          <text x="150" y="108">arm L</text>
          <text x="50" y="160">hand R</text>
          <text x="150" y="160">hand L</text>
          <text x="83" y="213">leg R</text>
          <text x="117" y="213">leg L</text>
          <text x="83" y="270">foot R</text>
          <text x="117" y="270">foot L</text>
        </g>
      </svg>

      {/* Tooltip renders here — below the SVG, in normal document flow */}
      {active && (
        <Tooltip
          label={active.key}
          state={active.state}
          imgSrc={imgSrc}
          imgLoading={imgLoading}
        />
      )}
    </div>
  );
}