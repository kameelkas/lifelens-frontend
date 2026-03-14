/**
 * BodyMap.jsx
 *
 * Renders a simple SVG human body diagram divided into named regions.
 * All regions start green. When injury data arrives, the relevant region
 * turns red with opacity proportional to the confidence score (accuracy).
 *
 * Props:
 *   injuries: array of injury objects from GET /sessions/:id/injuries
 *     [{ body_part, injury_pred, accuracy }, ...]
 *
 * Body part naming convention:
 *   1 = right side, 2 = left side
 *   e.g. arm1 = right arm, arm2 = left arm
 *
 * Region color logic:
 *   - No injury data for region  → green  at full opacity
 *   - injury_pred === "no_injury" → green  at full opacity
 *   - injury detected            → red    at opacity = accuracy (min 0.3 so it's always visible)
 */

const HEALTHY_COLOR = "#22c55e";   // tailwind green-500
const INJURED_COLOR = "#ef4444";   // tailwind red-500
const MIN_OPACITY = 0.3;

/**
 * Derive the fill color and opacity for a region from the injuries array.
 * If multiple detections exist for the same body part, use the highest accuracy.
 */
function getRegionStyle(regionKey, injuries) {
    const matches = injuries.filter(
        (i) => i.body_part === regionKey && i.injury_pred !== "no_injury"
    );

    if (matches.length === 0) {
        return { fill: HEALTHY_COLOR, opacity: 1 };
    }

    const best = matches.reduce((a, b) => (a.accuracy > b.accuracy ? a : b));
    const opacity = Math.max(MIN_OPACITY, best.accuracy ?? MIN_OPACITY);

    return { fill: INJURED_COLOR, opacity };
}

/**
 * A single labeled SVG region.
 * Renders a shape with the computed color + opacity, and a small text label.
 */
function Region({ label, injuries, children }) {
    const style = getRegionStyle(label, injuries);
    return (
        <g style={{ fill: style.fill, opacity: style.opacity }} className="transition-all duration-500">
            {children}
        </g>
    );
}

export default function BodyMap({ injuries = [] }) {
    const r = (key) => ({ label: key, injuries });

    return (
        <div className="flex flex-col items-center gap-3">
            <h2 className="text-white/60 text-sm uppercase tracking-widest">Body Map</h2>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-brand-gray mb-2">
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Healthy
                </span>
                <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Injury detected
                </span>
            </div>

            {/*
        SVG coordinate space: 200 wide x 480 tall
        All shapes are simple primitives — easy to adjust.
        viewBox is set so it scales responsively inside its container.

        Layout (top to bottom):
          head, face, neck, torso
          arm1 (right) + arm2 (left) beside torso
          hand1 (right) + hand2 (left)
          leg1 (right) + leg2 (left)
          foot1 (right) + foot2 (left)
      */}
            <svg
                viewBox="0 0 200 480"
                className="w-48"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* HEAD */}
                <Region {...r("head")}>
                    <ellipse cx="100" cy="30" rx="28" ry="20" />
                </Region>

                {/* FACE — smaller ellipse overlaid on head */}
                <Region {...r("face")}>
                    <ellipse cx="100" cy="32" rx="18" ry="14" />
                </Region>

                {/* NECK */}
                <Region {...r("neck")}>
                    <rect x="88" y="50" width="24" height="16" rx="4" />
                </Region>

                {/* TORSO */}
                <Region {...r("torso")}>
                    <rect x="68" y="66" width="64" height="90" rx="6" />
                </Region>

                {/* ARM1 — right arm (viewer's left) */}
                <Region {...r("arm1")}>
                    <rect x="36" y="66" width="28" height="80" rx="10" />
                </Region>

                {/* ARM2 — left arm (viewer's right) */}
                <Region {...r("arm2")}>
                    <rect x="136" y="66" width="28" height="80" rx="10" />
                </Region>

                {/* HAND1 — right hand */}
                <Region {...r("hand1")}>
                    <ellipse cx="50" cy="158" rx="14" ry="10" />
                </Region>

                {/* HAND2 — left hand */}
                <Region {...r("hand2")}>
                    <ellipse cx="150" cy="158" rx="14" ry="10" />
                </Region>

                {/* LEG1 — right leg */}
                <Region {...r("leg1")}>
                    <rect x="70" y="160" width="26" height="100" rx="10" />
                </Region>

                {/* LEG2 — left leg */}
                <Region {...r("leg2")}>
                    <rect x="104" y="160" width="26" height="100" rx="10" />
                </Region>

                {/* FOOT1 — right foot */}
                <Region {...r("foot1")}>
                    <ellipse cx="83" cy="268" rx="18" ry="10" />
                </Region>

                {/* FOOT2 — left foot */}
                <Region {...r("foot2")}>
                    <ellipse cx="117" cy="268" rx="18" ry="10" />
                </Region>

                {/* Region labels — always white, small, centered on each region */}
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
        </div>
    );
}