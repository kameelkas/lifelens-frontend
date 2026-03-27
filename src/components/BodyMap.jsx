/**
 * BodyMap.jsx
 *
 * PNG body diagram with coloured circle indicators on each region.
 *
 * Each body part gets a simple round overlay positioned at its centre.
 *   none    — no circle shown
 *   healthy — green circle, opacity ∝ confidence
 *   injured — red circle,  opacity ∝ confidence
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { fetchDecryptedImage } from "../api/client";

const HEALTHY_COLOR = "#22c55e";
const INJURED_COLOR = "#ef4444";
const MIN_OPACITY = 0.3;

// x / y = centre of the circle as % of the image.
// size  = diameter as % of container width.
const REGIONS = {
  head: { x: 51, y: 8, size: 12, label: "Head" },
  face: { x: 51, y: 13.5, size: 12, label: "Face" },
  neck: { x: 51, y: 21, size: 10, label: "Neck" },
  torso: { x: 50, y: 37, size: 20, label: "Torso" },
  arm1: { x: 28, y: 31, size: 12, label: "Arm 1" },
  arm2: { x: 74, y: 31, size: 12, label: "Arm 2" },
  hand1: { x: 12, y: 54, size: 11, label: "Hand 1" },
  hand2: { x: 90, y: 54, size: 11, label: "Hand 2" },
  leg1: { x: 40, y: 66, size: 13, label: "Leg 1" },
  leg2: { x: 62, y: 66, size: 13, label: "Leg 2" },
  foot1: { x: 36, y: 93, size: 10, label: "Foot 1" },
  foot2: { x: 66, y: 93, size: 10, label: "Foot 2" },
};

const REGION_KEYS = Object.keys(REGIONS);

// ── State derivation ─────────────────────────────────────────────────────────

function getRegionState(regionKey, visual) {
  const part = visual?.[regionKey];

  if (!part?.injuries) {
    return { status: "none", allInjuries: [], previewImageId: null };
  }

  const entries = Object.entries(part.injuries);
  if (entries.length === 0) {
    return { status: "none", allInjuries: [], previewImageId: null };
  }

  const noInjuryEntry = entries.find(([type]) => type === "no_injury");
  const realInjuries = entries
    .filter(([type]) => type !== "no_injury")
    .map(([type, data]) => ({ type, ...data }));

  if (realInjuries.length === 0) {
    return {
      status: "healthy",
      allInjuries: [],
      confidence: noInjuryEntry?.[1]?.accuracy ?? null,
      previewImageId: noInjuryEntry?.[1]?.image_id ?? null,
    };
  }

  const best = realInjuries.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
  return {
    status: "injured",
    allInjuries: realInjuries,
    confidence: best.accuracy ?? null,
    previewImageId: best.image_id ?? null,
  };
}

// ── Portal Tooltip ───────────────────────────────────────────────────────────

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
      className="fixed z-[9999] rounded-lg border border-muted/20 bg-white p-4 shadow-2xl w-72 max-w-[90vw]"
      style={{
        pointerEvents: "none",
        top: pos ? `${pos.top}px` : "-9999px",
        left: pos ? `${pos.left}px` : "-9999px",
      }}
    >
      <p className="text-ink text-sm font-semibold capitalize mb-2">{label}</p>

      {state.status === "healthy" && (
        <p className="text-[#22c55e] text-sm mb-3">
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
          <span className="capitalize text-[#ef4444]">
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

// ── BodyMap ──────────────────────────────────────────────────────────────────

export default function BodyMap({ visual = {}, sessionId, deviceId }) {
  const [active, setActive] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);

  const imgCache = useRef({});

  useEffect(() => {
    const cache = imgCache.current;
    return () => Object.values(cache).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const regionStates = useMemo(
    () => Object.fromEntries(REGION_KEYS.map((k) => [k, getRegionState(k, visual)])),
    [visual],
  );

  const handleHover = useCallback(
    (key, state, rect) => {
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
    },
    [sessionId, deviceId],
  );

  const handleHoverEnd = useCallback(() => {
    setActive(null);
    setImgSrc(null);
    setImgLoading(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <h2 className="text-muted text-lg font-bold uppercase tracking-widest pb-4">Body Map</h2>

      {/* Legend */}
      <div className="flex items-center gap-3 text-sm text-muted flex-wrap justify-center mb-1">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-500" />
          No data
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: HEALTHY_COLOR }} />
          Healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full" style={{ background: INJURED_COLOR }} />
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

      {/* Body map */}
      <div className="relative w-full max-w-[240px] select-none">
        <img
          src="/body-map.png"
          alt="Body map"
          className="w-full h-auto"
          draggable={false}
        />

        {/* One circle per region */}
        {REGION_KEYS.map((key) => {
          const region = REGIONS[key];
          const st = regionStates[key];
          const canHover = st.status !== "none";

          let bg = "transparent";
          let opacity = 0;
          if (st.status === "healthy") {
            bg = HEALTHY_COLOR;
            opacity = Math.max(MIN_OPACITY, st.confidence ?? MIN_OPACITY);
          } else if (st.status === "injured") {
            bg = INJURED_COLOR;
            opacity = Math.max(MIN_OPACITY, st.confidence ?? MIN_OPACITY);
          }

          if (active?.key === key) {
            opacity = Math.min(1, opacity + 0.15);
          }

          return (
            <div
              key={key}
              className="absolute rounded-full transition-all duration-500 flex items-center justify-center"
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.size}%`,
                aspectRatio: "1",
                transform: "translate(-50%, -50%)",
                backgroundColor: bg,
                opacity,
                cursor: canHover ? "pointer" : "default",
                pointerEvents: canHover ? "auto" : "none",
              }}
              onMouseEnter={(e) => {
                if (!canHover) return;
                handleHover(key, st, e.currentTarget.getBoundingClientRect());
              }}
              onMouseLeave={handleHoverEnd}
            >
              <span className="text-white text-[8px] font-bold leading-none text-center pointer-events-none drop-shadow-sm">
                {region.label}
              </span>
            </div>
          );
        })}
      </div>

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
