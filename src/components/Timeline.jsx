/**
 * Timeline.jsx
 *
 * Three-lane swimlane timeline sharing a single time-aligned x-axis.
 *
 *   Medications  │  ●              ●         ●
 *   Interventions│     ●     ●          ●
 *   Injuries     │        ●        ●              ●
 *                └──10:55────11:00────11:05────11:10──▶
 *
 * Props:
 *   medications:    array from GET /sessions/:id/medications
 *   interventions:  array from GET /sessions/:id/interventions
 *   visual:         parsed visual_output.json — injuries are extracted from this
 *
 * Time parsing:
 *   - medications / interventions use `start_time` ("HH:MM:SS" or "YYYY-MM-DD HH:MM:SS")
 *   - injuries use `pred_time` from each injury entry in visual_output.json
 *     (same "YYYY-MM-DD HH:MM:SS" format — only the time part is used)
 *
 * Multiple injuries per body part:
 *   Each injury becomes a separate dot on the Injuries lane. Injuries on the same
 *   body part captured in the same frame share a pred_time and will overlap on the
 *   x-axis; the tooltip differentiates them by injury type and confidence.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";

// ── Constants ────────────────────────────────────────────────────────────────

/** Left/right padding expressed as a % of the chart width, so edge dots aren't clipped */
const EDGE_PAD_PCT = 6;

/** Number of tick labels on the x-axis */
const TICK_COUNT = 5;

/** Pixels per minute of session time — keeps a constant x-axis scale */
const PX_PER_MINUTE = 12;

/** Absolute floor width (px) so short sessions still have a usable chart */
const MIN_CHART_PX = 600;

// ── Time utilities ────────────────────────────────────────────────────────────

/**
 * Parse a time string to seconds since midnight.
 * Accepts "HH:MM:SS" (from CSV/SQLite) and "YYYY-MM-DD HH:MM:SS" (from pred_time).
 * Returns null if the string is missing or malformed.
 */
function parseTime(timeStr) {
    if (!timeStr) return null;
    const timePart = timeStr.includes(" ") ? timeStr.split(" ")[1] : timeStr;
    const [h, m, s = 0] = timePart.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 3600 + m * 60 + s;
}

/** Format seconds-since-midnight as "HH:MM:SS". */
function formatTime(seconds) {
    if (seconds == null) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/**
 * Map a time value to an x-axis percentage, respecting edge padding.
 * When minTime === maxTime (single event), centres the dot.
 */
function timeToPct(time, minTime, maxTime) {
    if (minTime === maxTime) return 50;
    return EDGE_PAD_PCT + ((time - minTime) / (maxTime - minTime)) * (100 - 2 * EDGE_PAD_PCT);
}

// ── Data preparation ──────────────────────────────────────────────────────────

/**
 * Flatten visual_output.json into individual injury events for the timeline.
 * no_injury entries are excluded — this lane only shows real detections.
 * Events with an unparseable pred_time are silently dropped.
 */
function flattenInjuries(visual) {
    const events = [];
    Object.entries(visual || {}).forEach(([bodyPart, partData]) => {
        Object.entries(partData?.injuries ?? {}).forEach(([injuryType, data]) => {
            if (injuryType === "no_injury") return;
            const time = parseTime(data.pred_time);
            if (time === null) return;
            events.push({
                id: `${bodyPart}-${injuryType}-${data.pred_time}`,
                time,
                bodyPart,
                injuryType,
                accuracy: data.accuracy,
                image_id: data.image_id,
                pred_time: data.pred_time,
            });
        });
    });
    return events;
}

function prepareMedications(meds) {
    return meds
        .map((m) => ({ ...m, time: parseTime(m.start_time) }))
        .filter((e) => e.time !== null);
}

function prepareInterventions(interventions) {
    return interventions
        .map((i) => ({ ...i, time: parseTime(i.start_time) }))
        .filter((e) => e.time !== null);
}

// ── EKG graph-paper background ─────────────────────────────────────────────
// Use a simple repeating background so it always fills the full chart width
// (no "cutoff" at the right edge), and keep it subtle but readable.
function EkgBackground({ id }) {
    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <pattern id={`minor-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,27,58,0.12)" strokeWidth="0.75"/>
                </pattern>
                <pattern id={`major-${id}`} width="50" height="50" patternUnits="userSpaceOnUse">
                    <rect width="50" height="50" fill={`url(#minor-${id})`}/>
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0,27,58,0.25)" strokeWidth="1"/>
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#major-${id})`}/>
        </svg>
    );
}

// ── Tooltips ──────────────────────────────────────────────────────────────────

function MedicationTooltip({ event }) {
    return (
        <>
            <p className="text-ink text-sm font-semibold">{event.medication || "—"}</p>
            <p className="text-muted text-sm mb-1">{event.start_time}</p>
            {event.dosage && (
                <p className="text-green-400 text-sm">Dose: {event.dosage}</p>
            )}
            {event.route && (
                <p className="text-green-400 text-sm">Route: {event.route}</p>
            )}
            {event.medication_confidence != null && (
                <p className="text-muted/80 text-sm mt-1">
                    Conf: {(event.medication_confidence * 100).toFixed(0)}%
                </p>
            )}
        </>
    );
}

function InterventionTooltip({ event }) {
    return (
        <>
            <p className="text-ink text-sm font-semibold">{event.event_category || "—"}</p>
            <p className="text-muted text-sm mb-1">{event.start_time}</p>
            {event.full_text && (
                <p className="text-muted text-sm leading-snug">
                    {event.full_text}
                </p>
            )}
        </>
    );
}

function InjuryTooltip({ event }) {
    return (
        <>
            <p className="text-ink text-sm font-semibold capitalize">{event.bodyPart}</p>
            <p className="text-red-400 text-sm">{event.injuryType}</p>
            <p className="text-muted text-sm mb-1">
                {/* Show only HH:MM:SS from pred_time */}
                {event.pred_time?.split(" ")[1] ?? ""}
            </p>
            {event.accuracy != null && (
                <p className="text-muted/80 text-sm">
                    Conf: {(event.accuracy * 100).toFixed(0)}%
                </p>
            )}
        </>
    );
}

// ── Portal Tooltip ────────────────────────────────────────────────────────────

/**
 * Tooltip rendered via createPortal at document.body so it is never clipped
 * by any ancestor overflow container.  Positioned in viewport coordinates
 * based on the dot's bounding rect.
 */
function PortalTooltip({ dotRect, laneType, event }) {
    const tooltipRef = useRef(null);
    const [pos, setPos] = useState(null);

    useEffect(() => {
        if (!dotRect || !tooltipRef.current) return;
        const tt = tooltipRef.current.getBoundingClientRect();
        const GAP = 10;

        let top = dotRect.top - tt.height - GAP;
        let left = dotRect.left + dotRect.width / 2 - tt.width / 2;

        if (top < 4) top = dotRect.bottom + GAP;
        if (left < 4) left = 4;
        if (left + tt.width > window.innerWidth - 4) left = window.innerWidth - tt.width - 4;

        setPos({ top, left });
    }, [dotRect]);

    return createPortal(
        <div
            ref={tooltipRef}
            className="fixed z-[9999] bg-white border border-muted/20 rounded-lg p-3 shadow-2xl w-72 max-w-[90vw]"
            style={{
                pointerEvents: "none",
                top: pos ? `${pos.top}px` : "-9999px",
                left: pos ? `${pos.left}px` : "-9999px",
            }}
        >
            {laneType === "medication" && <MedicationTooltip event={event} />}
            {laneType === "intervention" && <InterventionTooltip event={event} />}
            {laneType === "injury" && <InjuryTooltip event={event} />}
        </div>,
        document.body,
    );
}

// ── Dot ───────────────────────────────────────────────────────────────────────

/**
 * A single event marker dot.
 * On hover, a portal-based tooltip is rendered at document.body level so it
 * escapes any overflow clipping from the scrollable chart container.
 */
function Dot({ event, pct, topPct = 50, laneType }) {
    const [hovered, setHovered] = useState(false);
    const dotRef = useRef(null);
    const [dotRect, setDotRect] = useState(null);

    const handleEnter = useCallback(() => {
        setHovered(true);
        if (dotRef.current) setDotRect(dotRef.current.getBoundingClientRect());
    }, []);

    const handleLeave = useCallback(() => {
        setHovered(false);
        setDotRect(null);
    }, []);

    return (
        <div
            className="absolute -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${pct}%`, top: `${topPct}%` }}
        >
            <div
                ref={dotRef}
                className="w-4 h-4 rounded-full bg-green-600 border-2 border-green-200 shadow-md
                   cursor-pointer hover:scale-150 transition-transform duration-150 z-10 relative"
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
            />

            {hovered && dotRect && (
                <PortalTooltip dotRect={dotRect} laneType={laneType} event={event} />
            )}
        </div>
    );
}

// ── LaneRow ───────────────────────────────────────────────────────────────────

/** Top/bottom padding (%) inside the lane so dots don't touch the edges */
const LANE_PAD_PCT = 10;

/**
 * X-axis proximity threshold (% of chart width). Dots closer than this
 * on the x-axis are considered overlapping and will be fanned out vertically.
 * 3% catches dots a few seconds apart on a typical session.
 */
const DOT_PROXIMITY_PCT = 3;

/**
 * Group events whose x-positions are within DOT_PROXIMITY_PCT of each other
 * and compute a vertical offset (topPct) for each so they fan out within the
 * lane instead of stacking invisibly.
 *
 * Uses a sweep-line approach on the sorted pct values: consecutive events
 * within the threshold are merged into the same group (chaining — if A
 * overlaps B and B overlaps C, all three form one group).
 *
 * Single events sit at 50%. Groups of N are evenly distributed between
 * LANE_PAD_PCT and (100 - LANE_PAD_PCT).
 */
function assignVerticalOffsets(events, minTime, maxTime) {
    if (events.length === 0) return [];

    const items = events
        .map((event) => ({ event, pct: timeToPct(event.time, minTime, maxTime) }))
        .sort((a, b) => a.pct - b.pct);

    const groups = [[items[0]]];

    for (let i = 1; i < items.length; i++) {
        const current = groups[groups.length - 1];
        const groupMaxPct = current[current.length - 1].pct;
        if (items[i].pct - groupMaxPct < DOT_PROXIMITY_PCT) {
            current.push(items[i]);
        } else {
            groups.push([items[i]]);
        }
    }

    const result = [];
    for (const group of groups) {
        if (group.length === 1) {
            result.push({ event: group[0].event, topPct: 50 });
        } else {
            const usable = 100 - 2 * LANE_PAD_PCT;
            group.forEach((item, i) => {
                const topPct = LANE_PAD_PCT + (i / (group.length - 1)) * usable;
                result.push({ event: item.event, topPct });
            });
        }
    }
    return result;
}

/**
 * One horizontal lane row in the chart area (no label — labels are in a
 * separate fixed column so they stay aligned during x-axis interaction).
 */
function LaneRow({ events, laneType, minTime, maxTime }) {
    const positioned = useMemo(
        () => assignVerticalOffsets(events, minTime, maxTime),
        [events, minTime, maxTime],
    );

    return (
        <div className="relative border-b border-muted/20 overflow-visible" style={{ height: "200px" }}>
            <EkgBackground id={laneType} />

            {/* Centre guide line */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-ink/25 pointer-events-none z-10" />

            {/* Event dots */}
            {positioned.map(({ event, topPct }) => (
                <Dot
                    key={event.id}
                    event={event}
                    pct={timeToPct(event.time, minTime, maxTime)}
                    topPct={topPct}
                    laneType={laneType}
                />
            ))}

            {events.length === 0 && (
                <span className="flex h-full -translate-y-1/4 items-center justify-center
                         text-muted text-sm select-none pointer-events-none">
                    No data
                </span>
            )}
        </div>
    );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

const LANES = [
    { key: "medication", label: "Medications" },
    { key: "intervention", label: "Interventions" },
    { key: "injury", label: "Injuries" },
];

export default function Timeline({ medications = [], interventions = [], visual = {} }) {
    const chartRef = useRef(null);
    const [cursorPct, setCursorPct] = useState(null);
    const [cursorTime, setCursorTime] = useState(null);

    // Prepare per-lane event arrays
    const eventsByLane = useMemo(() => ({
        medication: prepareMedications(medications),
        intervention: prepareInterventions(interventions),
        injury: flattenInjuries(visual),
    }), [medications, interventions, visual]);

    // Derive shared x-axis bounds across all lanes
    const { minTime, maxTime, hasData } = useMemo(() => {
        const allTimes = Object.values(eventsByLane)
            .flat()
            .map((e) => e.time)
            .filter((t) => t != null);

        if (allTimes.length === 0) return { minTime: 0, maxTime: 0, hasData: false };
        return {
            minTime: Math.min(...allTimes),
            maxTime: Math.max(...allTimes),
            hasData: true,
        };
    }, [eventsByLane]);

    // Minimum chart width so the x-axis never compresses as data grows.
    // The chart scrolls horizontally when this exceeds the container width.
    const chartMinWidth = useMemo(() => {
        if (!hasData) return 0;
        const rangeMinutes = (maxTime - minTime) / 60;
        return Math.max(MIN_CHART_PX, Math.ceil(rangeMinutes * PX_PER_MINUTE));
    }, [hasData, minTime, maxTime]);

    // X-axis tick labels (evenly spaced)
    const ticks = useMemo(() => {
        if (!hasData) return [];
        return Array.from({ length: TICK_COUNT }, (_, i) => {
            const t = minTime === maxTime
                ? minTime
                : minTime + (i / (TICK_COUNT - 1)) * (maxTime - minTime);
            return { time: t, pct: timeToPct(t, minTime, maxTime) };
        });
    }, [hasData, minTime, maxTime]);

    // Track mouse for the vertical cursor line
    const handleMouseMove = useCallback((e) => {
        if (!chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const rawPct = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1)) * 100;
        setCursorPct(rawPct);

        // Map cursor % back to a wall-clock time value (clamped to data range)
        const t = minTime + ((rawPct - EDGE_PAD_PCT) / (100 - 2 * EDGE_PAD_PCT)) * (maxTime - minTime);
        setCursorTime(Math.max(minTime, Math.min(maxTime, t)));
    }, [minTime, maxTime]);

    const handleMouseLeave = useCallback(() => {
        setCursorPct(null);
        setCursorTime(null);
    }, []);

    return (
        <div className="flex flex-col gap-1 w-full overflow-hidden">
            <h2 className="text-muted text-center text-sm uppercase tracking-widest mb-3">Timeline</h2>

            {!hasData && (
                <p className="text-muted text-center text-sm">No timeline data yet.</p>
            )}

            <div className="flex w-full">

                {/* ── Fixed label column ─────────────────────────────────────────── */}
                <div className="flex-shrink-0 w-28 flex flex-col">
                    {LANES.map(({ key, label }) => (
                        <div
                            key={key}
                            className="flex items-center border-b border-muted/40 pr-3" style={{ height: "200px" }}
                        >
                            <span className="text-muted/90 text-sm uppercase tracking-wider leading-snug">
                                {label}
                            </span>
                        </div>
                    ))}
                    {/* Spacer matching x-axis height */}
                    <div className="h-8" />
                </div>

                {/* ── Chart area — scrolls horizontally when content exceeds container ── */}
                <div className="flex-1 min-w-0">
                    <div className="overflow-x-auto timeline-scroll">
                        <div className="flex flex-col" style={chartMinWidth ? { minWidth: `${chartMinWidth}px` } : undefined}>

                        {/* Lane rows + cursor overlay */}
                        <div
                            ref={chartRef}
                            className="relative flex flex-col border-l border-r border-muted/20"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            {/* Cursor line — spans full height of all lanes */}
                            {cursorPct !== null && (
                                <div
                                    className="absolute top-0 bottom-0 w-px bg-blue-400/35 pointer-events-none z-20"
                                    style={{ left: `${cursorPct}%` }}
                                />
                            )}

                            {/* Lane rows */}
                            {LANES.map(({ key }) => (
                                <LaneRow
                                    key={key}
                                    events={eventsByLane[key]}
                                    laneType={key}
                                    minTime={minTime}
                                    maxTime={maxTime}
                                />
                            ))}
                        </div>

                        {/* ── X-axis tick labels ──────────────────────────────────────── */}
                        {hasData && (
                            <div className="relative h-7 mt-1">
                                {ticks.map((tick, i) => (
                                    <span
                                        key={i}
                                        className="absolute -translate-x-1/2 text-sm text-muted/80 tabular-nums"
                                        style={{ left: `${tick.pct}%` }}
                                    >
                                        {formatTime(tick.time)}
                                    </span>
                                ))}

                                {/* Cursor time label — follows the cursor line */}
                                {cursorPct !== null && (
                                    <span
                                        className="absolute -translate-x-1/2 text-sm text-ink tabular-nums
                                 bg-white px-1 rounded border border-blue-400/40 pointer-events-none z-20"
                                        style={{ left: `${cursorPct}%` }}
                                    >
                                        {formatTime(cursorTime)}
                                    </span>
                                )}
                            </div>
                        )}
                        </div>
                    </div>

                    {/* "Time" axis label (kept outside the scroller so it doesn't move) */}
                    {hasData && (
                        <p className="text-center text-sm text-muted/80 uppercase tracking-widest mt-0.5">
                            Time
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}