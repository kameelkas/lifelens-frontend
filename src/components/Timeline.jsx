/**
 * Timeline.jsx
 *
 * Renders a chronological list of interventions and medications.
 * Entries are merged and sorted by start_time.
 * Text fields are green with opacity proportional to confidence score.
 * Missing fields (dosage, route) are shown in gray.
 *
 * Props:
 *   medications:    array from GET /sessions/:id/medications
 *   interventions:  array from GET /sessions/:id/interventions
 */

const MIN_OPACITY = 0.4;

function confidenceOpacity(score) {
    if (score == null) return 1;
    return Math.max(MIN_OPACITY, score);
}

/**
 * A single medication entry.
 */
function MedicationEntry({ item }) {
    const medOpacity = confidenceOpacity(item.medication_confidence);
    const dosOpacity = confidenceOpacity(item.dosage_confidence);
    const rteOpacity = confidenceOpacity(item.route_confidence);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs text-brand-gray uppercase tracking-wider">Medication</span>
                <span className="text-xs text-brand-gray">{item.start_time}</span>
            </div>

            {/* Medication name */}
            <p
                className="text-sm font-medium"
                style={{ color: "#22c55e", opacity: medOpacity }}
            >
                {item.medication}
            </p>

            {/* Dosage and route on same line */}
            <div className="flex gap-3 text-sm">
                {item.dosage
                    ? <span style={{ color: "#22c55e", opacity: dosOpacity }}>{item.dosage}</span>
                    : <span className="text-brand-gray">No dosage</span>
                }
                {item.route
                    ? <span style={{ color: "#22c55e", opacity: rteOpacity }}>via {item.route}</span>
                    : <span className="text-brand-gray">No route</span>
                }
            </div>
        </div>
    );
}

/**
 * A single intervention entry.
 */
function InterventionEntry({ item }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-xs text-brand-gray uppercase tracking-wider">Intervention</span>
                <span className="text-xs text-brand-gray">{item.start_time}</span>
            </div>
            <p className="text-sm font-medium text-green-400">
                {item.event_category}
            </p>
            <p className="text-sm text-white/60">
                {item.full_text}
            </p>
        </div>
    );
}

export default function Timeline({ medications = [], interventions = [] }) {
    // Merge and sort all entries by start_time
    const entries = [
        ...medications.map((m) => ({ ...m, _type: "medication" })),
        ...interventions.map((i) => ({ ...i, _type: "intervention" })),
    ].sort((a, b) => a.start_time.localeCompare(b.start_time));

    return (
        <div className="flex flex-col gap-3">
            <h2 className="text-white/60 text-sm uppercase tracking-widest">Timeline</h2>

            {entries.length === 0 && (
                <p className="text-brand-gray text-sm">No entries yet.</p>
            )}

            <ul className="flex flex-col gap-3">
                {entries.map((entry) => (
                    <li
                        key={`${entry._type}-${entry.id}`}
                        className="bg-white/5 border border-white/10 rounded-lg px-5 py-4"
                    >
                        {entry._type === "medication"
                            ? <MedicationEntry item={entry} />
                            : <InterventionEntry item={entry} />
                        }
                    </li>
                ))}
            </ul>
        </div>
    );
}