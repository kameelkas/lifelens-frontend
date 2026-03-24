/**
 * BodyMap.jsx
 *
 * Renders a simple SVG human body diagram divided into named regions.
 * All regions start green. When visual data arrives, regions with a
 * detected injury turn red with opacity proportional to accuracy.
 *
 * Props:
 *   visual:    the parsed visual_output.json object, e.g.:
 *              { "hand2": { "injuries": { "Bruises": { accuracy: 0.36, image_id: "..." } } } }
 *   sessionId: used to build image URLs for hover preview
 *   deviceId:  used to build image URLs for hover preview
 *
 * Region color logic:
 *   - No data or empty injuries       → green at full opacity
 *   - Only "no_injury" entries        → green at full opacity
 *   - At least one real injury found  → red at opacity = highest accuracy (min 0.3)
 *
 * Body part naming:
 *   1 = right side, 2 = left side
 */

import { useState, useEffect } from "react";
import { fetchDecryptedImage } from "../api/client";

const HEALTHY_COLOR = "#22c55e";
const INJURED_COLOR = "#ef4444";
const MIN_OPACITY   = 0.3;

/**
 * Derive fill color, opacity, and the best injury entry for a region.
 * Returns the best matching injury (for image hover) or null if healthy.
 */
function getRegionState(regionKey, visual) {
  const part = visual?.[regionKey];
  if (!part?.injuries) return { fill: HEALTHY_COLOR, opacity: 1, best: null };

  const injuryEntries = Object.entries(part.injuries).filter(
    ([type]) => type !== "no_injury"
  );

  if (injuryEntries.length === 0) return { fill: HEALTHY_COLOR, opacity: 1, best: null };

  // Pick the injury with the highest accuracy score
  const [bestType, bestData] = injuryEntries.reduce((a, b) =>
    a[1].accuracy > b[1].accuracy ? a : b
  );

  return {
    fill:    INJURED_COLOR,
    opacity: Math.max(MIN_OPACITY, bestData.accuracy ?? MIN_OPACITY),
    best:    { type: bestType, ...bestData },
  };
}

/**
 * A single labeled SVG region with hover support.
 * On hover, fetches the decrypted image from the server and displays it.
 */
function Region({ label, visual, sessionId, deviceId, children }) {
  const [hovered,    setHovered]    = useState(false);
  const [imgSrc,     setImgSrc]     = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const state = getRegionState(label, visual);

  // Fetch decrypted image when the user first hovers over an injured region
  useEffect(() => {
  if (!hovered || !state.best?.image_id || imgSrc) return;

  let objectUrl = null;
  setImgLoading(true);
  fetchDecryptedImage(sessionId, state.best.image_id, deviceId)
    .then((src) => {
      objectUrl = src;
      setImgSrc(src);
    })
    .catch(() => setImgSrc(null))
    .finally(() => setImgLoading(false));

  return () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [hovered, state.best?.image_id, imgSrc, sessionId, deviceId]);

  return (
    <g
      style={{ fill: state.fill, opacity: state.opacity, cursor: state.best ? "pointer" : "default" }}
      className="transition-all duration-500"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}

      {/* Hover tooltip — shows injury type and decrypted image */}
      {hovered && state.best && (
        <foreignObject x="110" y="0" width="160" height="220" style={{ overflow: "visible" }}>
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="bg-brand-navy border border-white/20 rounded-lg p-2 shadow-lg"
            style={{ pointerEvents: "none" }}
          >
            <p className="text-white text-xs font-medium mb-1">{label} — {state.best.type}</p>
            <p className="text-brand-gray text-xs mb-2">
              Confidence: {(state.best.accuracy * 100).toFixed(0)}%
            </p>
            {imgLoading && (
              <p className="text-brand-gray text-xs">Loading...</p>
            )}
            {imgSrc && (
              <img
                src={imgSrc}
                alt={`${label} injury`}
                className="w-32 h-24 object-cover rounded"
              />
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export default function BodyMap({ visual = {}, sessionId, deviceId }) {
  const r = (key) => ({ label: key, visual, sessionId, deviceId });

  return (
    <div className="flex flex-col items-center gap-3">
      <h2 className="text-white/60 text-sm uppercase tracking-widest">Body Map</h2>

      <div className="flex items-center gap-6 text-xs text-brand-gray mb-2">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Healthy
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Injury detected
        </span>
      </div>

      <svg viewBox="0 0 200 480" className="w-48" xmlns="http://www.w3.org/2000/svg">
        <Region {...r("head")}>
          <ellipse cx="100" cy="30" rx="28" ry="20" />
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
          <text x="50"  y="108">arm R</text>
          <text x="150" y="108">arm L</text>
          <text x="50"  y="160">hand R</text>
          <text x="150" y="160">hand L</text>
          <text x="83"  y="213">leg R</text>
          <text x="117" y="213">leg L</text>
          <text x="83"  y="270">foot R</text>
          <text x="117" y="270">foot L</text>
        </g>
      </svg>
    </div>
  );
}