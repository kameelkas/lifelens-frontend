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
import { createPortal } from "react-dom";
import { fetchDecryptedImage } from "../api/client";

const GREY_COLOR = "#6b7280";
const HEALTHY_COLOR = "#335A4C";
const INJURED_COLOR = "#8B322C";
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
      opacity: Math.max(MIN_OPACITY, noInjuryEntry?.[1]?.accuracy ?? MIN_OPACITY),
      allInjuries: [],
      confidence: noInjuryEntry?.[1]?.accuracy ?? null,
      previewImageId: noInjuryEntry?.[1]?.image_id ?? null,
    };
  }

  const best = realInjuries.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
  return {
    status: "injured",
    fill: INJURED_COLOR,
    opacity: Math.max(MIN_OPACITY, best.accuracy ?? MIN_OPACITY),
    allInjuries: realInjuries,
    confidence: best.accuracy ?? null,
    previewImageId: best.image_id ?? null,
  };
}

// ── Region — pure SVG shape, no local state ───────────────────────────────────

function Region({ regionKey, visual, onHover, onHoverEnd, children }) {
  const state = getRegionState(regionKey, visual);
  const canHover = state.status !== "none";

  const handleEnter = useCallback((e) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onHover(regionKey, state, rect);
  }, [canHover, regionKey, state, onHover]);

  return (
    <g
      style={{ fill: state.fill, opacity: state.opacity, cursor: canHover ? "pointer" : "default" }}
      className="transition-all duration-500"
      onMouseEnter={handleEnter}
      onMouseLeave={onHoverEnd}
    >
      {children}
    </g>
  );
}

// ── Portal Tooltip — rendered at document.body to avoid layout shift ─────────

function PortalTooltip({ anchorRect, label, state, imgSrc, imgLoading }) {
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!anchorRect || !tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const GAP = 12;

    let left = anchorRect.right + GAP;
    let top = anchorRect.top;

    if (left + tt.width > window.innerWidth - 8) {
      left = anchorRect.left - tt.width - GAP;
    }
    if (left < 8) left = 8;

    if (top + tt.height > window.innerHeight - 8) {
      top = window.innerHeight - tt.height - 8;
    }
    if (top < 8) top = 8;

    setPos({ top, left });
  }, [anchorRect, imgSrc, imgLoading]);

  return createPortal(
    <div
      ref={tooltipRef}
      className="fixed z-[9999] rounded-lg border border-muted/20 bg-white p-4 shadow-2xl
                 w-72 max-w-[90vw]"
      style={{
        pointerEvents: "none",
        top: pos ? `${pos.top}px` : "-9999px",
        left: pos ? `${pos.left}px` : "-9999px",
      }}
    >
      <p className="text-ink text-sm font-semibold capitalize mb-2">{label}</p>

      {state.status === "healthy" && (
        <p className="text-[#335A4C] text-sm mb-3">
          No injuries detected
          {typeof state.confidence === "number" && (
            <span className="text-muted text-sm ml-2">
              ({(state.confidence * 100).toFixed(0)}%)
            </span>
          )}
        </p>
      )}

      {state.status === "injured" && (
        <p className="text-muted text-sm mb-3">
          Injury Detected:{" "}
          <span className="capitalize text-[#8B322C]">
            {state.allInjuries?.[0]?.type ?? "Unknown"}
          </span>{" "}
          {typeof state.confidence === "number" && (
            <span className="text-muted text-sm">
              ({(state.confidence * 100).toFixed(0)}%)
            </span>
          )}
          {Array.isArray(state.allInjuries) && state.allInjuries.length > 1 && (
            <span className="text-muted text-sm ml-2">
              +{state.allInjuries.length - 1} more
            </span>
          )}
        </p>
      )}

      {imgLoading && <p className="text-muted/80 text-sm">Loading image...</p>}
      {imgSrc && (
        <img src={imgSrc} alt={label} className="w-full rounded object-contain max-h-48" />
      )}
    </div>,
    document.body,
  );
}

// ── BodyMap ───────────────────────────────────────────────────────────────────

export default function BodyMap({ visual = {}, sessionId, deviceId }) {
  const [active, setActive] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  const imgCache = useRef({});

  useEffect(() => {
    const cache = imgCache.current;
    return () => Object.values(cache).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const handleHover = useCallback((key, state, rect) => {
    setActive({ key, state, rect });

    const imageId = state.previewImageId;
    if (!imageId) { setImgSrc(null); return; }

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
      <h2 className="text-muted text-lg font-bold uppercase tracking-widest pb-4">Body Map</h2>

      {/* Legend */}
      <div className="flex items-center gap-3 text-sm text-muted flex-wrap justify-center mb-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: GREY_COLOR }} />
          No data
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#335A4C]" />
          Healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-[#8B322C]" />
          Injury
        </span>
      </div>

      {/* Confidence guide */}
      <div className="w-full max-w-[200px] flex flex-col items-center gap-1">
        <p className="text-muted text-xs uppercase tracking-widest">Confidence</p>
        <div className="w-full h-2 rounded-full border border-muted bg-gradient-to-r from-muted/5 via-muted/50 to-muted" />
        <div className="w-full flex items-center justify-between text-muted text-xs">
          <span>Lower</span>
          <span>Higher</span>
        </div>
      </div>

      <svg
        viewBox="0 0 200 285"
        className="w-full max-w-[360px] max-h-[70vh]"
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

        <g fill="#001B3A" fontSize="8" fontWeight="semibold" textAnchor="middle" style={{ pointerEvents: "none" }}>
          <text x="100" y="22">Head</text>
          <text x="100" y="34">Face</text>
          <text x="100" y="61">Neck</text>
          <text x="100" y="115">Torso</text>
          <text x="50" y="108">Arm 1</text>
          <text x="150" y="108">Arm 2</text>
          <text x="50" y="160">Hand 1</text>
          <text x="150" y="160">Hand 2</text>
          <text x="83" y="213">Leg 1</text>
          <text x="117" y="213">Leg 2</text>
          <text x="83" y="270">Foot 1</text>
          <text x="117" y="270">Foot 2</text>
        </g>
      </svg>

      {active && (
        <PortalTooltip
          anchorRect={active.rect}
          label={active.key}
          state={active.state}
          imgSrc={imgSrc}
          imgLoading={imgLoading}
        />
      )}
    </div>
  );
}