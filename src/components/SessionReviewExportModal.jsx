/**
 * Review and finalize session data (medications, interventions, injuries) with no
 * confidence scores. Edits are local-only. CSV download.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { formatWallClockTimeForDisplay12h } from "../utils/time";
import { formatSessionStartedAt } from "../utils/sessionDisplay";
import {
  buildReviewDrafts,
  buildSessionReviewCsv,
  downloadTextFile,
  labelBodyPart,
} from "../utils/sessionReviewDraft";

function fieldClass() {
  return "w-full rounded-md border border-muted/30 bg-surface px-2.5 py-1.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand-gold/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/35";
}

export default function SessionReviewExportModal({
  open,
  onClose,
  sessionId,
  medications,
  interventions,
  visual,
}) {
  const titleId = useId();
  const wasOpenRef = useRef(false);
  const [medicationRows, setMedicationRows] = useState([]);
  const [interventionRows, setInterventionRows] = useState([]);
  const [injuryRows, setInjuryRows] = useState([]);

  const sessionTitle = formatSessionStartedAt(sessionId);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const d = buildReviewDrafts({ medications, interventions, visual });
      setMedicationRows(d.medicationRows);
      setInterventionRows(d.interventionRows);
      setInjuryRows(d.injuryRows);
    }
    wasOpenRef.current = open;
  }, [open, medications, interventions, visual]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const patchMed = useCallback((key, field, value) => {
    setMedicationRows((rows) =>
      rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }, []);

  const patchInt = useCallback((key, value) => {
    setInterventionRows((rows) => rows.map((r) => (r.key === key ? { ...r, interventionText: value } : r)));
  }, []);

  const patchInj = useCallback((key, field, value) => {
    setInjuryRows((rows) => rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  }, []);

  const handleCsv = useCallback(() => {
    const csv = buildSessionReviewCsv({
      sessionTitle,
      medicationRows,
      interventionRows,
      injuryRows,
    });
    const safe = sessionId.replace(/[^\w.-]+/g, "_").slice(0, 80);
    downloadTextFile(`lifelens-session-review_${safe}.csv`, csv);
  }, [sessionId, sessionTitle, medicationRows, interventionRows, injuryRows]);

  const fc = fieldClass();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/45 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col rounded-t-2xl border border-muted/25 bg-surface shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-start justify-between gap-4 border-b border-muted/20 px-5 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-bold text-ink">
                Review & export
              </h2>
              <p className="text-muted text-sm mt-0.5">{sessionTitle}</p>
              <p className="text-muted/80 text-xs mt-1 max-w-xl">
                Edit text below to fix spelling or wording. Nothing is sent to the server. Confidence scores are not
                shown here or in exports.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg px-2 py-1 text-muted text-sm hover:bg-muted/10 hover:text-ink"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-8">
            <section>
              <h3 className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Interventions</h3>
              {interventionRows.length === 0 ? (
                <p className="text-muted text-sm">No interventions for this session.</p>
              ) : (
                <ul className="space-y-3">
                  {interventionRows.map((row) => (
                    <li key={row.key} className="rounded-lg border border-muted/20 bg-surface-alt/40 p-3">
                      <p className="text-muted text-xs mb-1.5">
                        Time:{" "}
                        <span className="text-ink font-medium tabular-nums">
                          {formatWallClockTimeForDisplay12h(row.start_time) || row.start_time || "—"}
                        </span>
                      </p>
                      <label className="block text-xs text-muted mb-1">Intervention</label>
                      <textarea
                        value={row.interventionText}
                        onChange={(e) => patchInt(row.key, e.target.value)}
                        rows={2}
                        className={`${fc} resize-y min-h-[2.5rem]`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Medications</h3>
              {medicationRows.length === 0 ? (
                <p className="text-muted text-sm">No medications for this session.</p>
              ) : (
                <ul className="space-y-3">
                  {medicationRows.map((row) => (
                    <li key={row.key} className="rounded-lg border border-muted/20 bg-surface-alt/40 p-3 space-y-2">
                      <p className="text-muted text-xs">
                        Time:{" "}
                        <span className="text-ink font-medium tabular-nums">
                          {formatWallClockTimeForDisplay12h(row.start_time) || row.start_time || "—"}
                        </span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="sm:col-span-1">
                          <label className="block text-xs text-muted mb-1">Medication</label>
                          <input
                            type="text"
                            value={row.medication}
                            onChange={(e) => patchMed(row.key, "medication", e.target.value)}
                            className={fc}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Dosage</label>
                          <input
                            type="text"
                            value={row.dosage}
                            onChange={(e) => patchMed(row.key, "dosage", e.target.value)}
                            className={fc}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Route</label>
                          <input
                            type="text"
                            value={row.route}
                            onChange={(e) => patchMed(row.key, "route", e.target.value)}
                            className={fc}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h3 className="text-muted text-xs font-bold uppercase tracking-widest mb-3">Injuries</h3>
              {injuryRows.length === 0 ? (
                <p className="text-muted text-sm">No injury detections for this session.</p>
              ) : (
                <ul className="space-y-3">
                  {injuryRows.map((row) => (
                    <li key={row.key} className="rounded-lg border border-muted/20 bg-surface-alt/40 p-3 space-y-2">
                      <p className="text-muted text-xs">
                        <span className="text-ink font-medium">{labelBodyPart(row.bodyPart)}</span>
                        <span className="mx-1.5">·</span>
                        <span className="tabular-nums">
                          {formatWallClockTimeForDisplay12h(row.pred_time) || row.pred_time || "—"}
                        </span>
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs text-muted mb-1">Injury type</label>
                          <input
                            type="text"
                            value={row.injuryType}
                            onChange={(e) => patchInj(row.key, "injuryType", e.target.value)}
                            className={fc}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-muted mb-1">Injury</label>
                          <input
                            type="text"
                            value={row.injuryDescription}
                            onChange={(e) => patchInj(row.key, "injuryDescription", e.target.value)}
                            className={fc}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-muted/20 px-5 py-4">
            <button
              type="button"
              onClick={handleCsv}
              className="rounded-lg bg-brand-gold/90 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-gold transition-colors"
            >
              Download CSV
            </button>
          </div>
        </div>
      </div>
  );
}
