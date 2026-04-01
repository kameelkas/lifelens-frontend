/**
 * Build editable review rows from session API shapes (frontend-only drafts).
 * Confidence / accuracy fields are intentionally omitted from drafts and exports.
 */

import { parseWallClockTime, formatWallClockTimeForDisplay12h } from "./time";

const BODY_PART_LABELS = {
  head: "Head",
  face: "Face",
  neck: "Neck",
  torso: "Torso",
  arm1: "Arm 1",
  arm2: "Arm 2",
  hand1: "Hand 1",
  hand2: "Hand 2",
  leg1: "Leg 1",
  leg2: "Leg 2",
  foot1: "Foot 1",
  foot2: "Foot 2",
};

export function labelBodyPart(key) {
  if (!key) return "";
  return (
    BODY_PART_LABELS[key] ??
    String(key)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function interventionDisplayText(row) {
  const t = (row.full_text ?? "").trim();
  if (t) return t;
  return (row.event_category ?? "").trim();
}

/**
 * @param {object[]} medications
 * @param {object[]} interventions
 * @param {Record<string, { injuries?: Record<string, object> }>} visual
 */
export function buildReviewDrafts({ medications = [], interventions = [], visual = {} }) {
  const medicationRows = medications.map((m, idx) => ({
    key: `med-${idx}-${m.start_time ?? idx}`,
    start_time: m.start_time ?? "",
    medication: m.medication ?? "",
    dosage: m.dosage ?? "",
    route: m.route ?? "",
  }));

  const interventionRows = interventions.map((row, idx) => ({
    key: `int-${idx}-${row.start_time ?? idx}`,
    start_time: row.start_time ?? "",
    interventionText: interventionDisplayText(row),
  }));

  const injuryRows = [];
  Object.entries(visual || {}).forEach(([bodyPart, partData]) => {
    Object.entries(partData?.injuries ?? {}).forEach(([injuryType, data]) => {
      if (injuryType === "no_injury") return;
      const time = parseWallClockTime(data?.pred_time);
      if (time === null) return;
      injuryRows.push({
        key: `${bodyPart}:${injuryType}:${data.pred_time}`,
        bodyPart,
        pred_time: data.pred_time ?? "",
        injuryType,
        injuryDescription: injuryType.replace(/_/g, " "),
      });
    });
  });

  injuryRows.sort((a, b) => {
    const ta = parseWallClockTime(a.pred_time) ?? 0;
    const tb = parseWallClockTime(b.pred_time) ?? 0;
    if (ta !== tb) return ta - tb;
    return `${a.bodyPart}`.localeCompare(`${b.bodyPart}`);
  });

  return { medicationRows, interventionRows, injuryRows };
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Build a UTF-8 CSV (with BOM) from review row state. */
export function buildSessionReviewCsv({ sessionTitle, medicationRows, interventionRows, injuryRows }) {
  const lines = [];
  const now = new Date().toLocaleString();

  lines.push("LifeLens session report (reviewed)");
  lines.push(`Session,${csvEscape(sessionTitle)}`);
  lines.push(`Exported,${csvEscape(now)}`);
  lines.push("");

  lines.push("Interventions");
  lines.push(["Time", "Intervention"].map(csvEscape).join(","));
  for (const row of interventionRows) {
    const t = formatWallClockTimeForDisplay12h(row.start_time) || row.start_time || "";
    lines.push([t, row.interventionText].map(csvEscape).join(","));
  }
  lines.push("");

  lines.push("Medications");
  lines.push(["Time", "Medication", "Dosage", "Route"].map(csvEscape).join(","));
  for (const row of medicationRows) {
    const t = formatWallClockTimeForDisplay12h(row.start_time) || row.start_time || "";
    lines.push([t, row.medication, row.dosage, row.route].map(csvEscape).join(","));
  }
  lines.push("");

  lines.push("Injuries");
  lines.push(["Body part", "Time", "Injury type", "Injury"].map(csvEscape).join(","));
  for (const row of injuryRows) {
    const t = formatWallClockTimeForDisplay12h(row.pred_time) || row.pred_time || "";
    lines.push(
      [labelBodyPart(row.bodyPart), t, row.injuryType, row.injuryDescription]
        .map(csvEscape)
        .join(","),
    );
  }

  return "\uFEFF" + lines.join("\r\n");
}

export function downloadTextFile(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
