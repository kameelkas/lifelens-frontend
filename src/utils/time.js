/**
 * Shared date/time helpers for API strings (ISO datetimes, "HH:MM:SS", "YYYY-MM-DD HH:MM:SS").
 */

/**
 * Parse a wall-clock time to seconds since midnight.
 * Accepts "HH:MM:SS" (CSV/SQLite) and "YYYY-MM-DD HH:MM:SS" (pred_time, etc.).
 * Returns null if missing, malformed, or out of range (hour 0–23, minute/second 0–59; seconds may be fractional in [0, 60)).
 */
export function parseWallClockTime(timeStr) {
  if (!timeStr) return null;
  const timePart = timeStr.includes(" ") ? timeStr.split(" ")[1] : timeStr;
  const parts = timePart.split(":");
  if (parts.length < 2 || parts.length > 3) return null;
  if (parts.some((p) => p === "")) return null;

  const h = Number(parts[0]);
  const m = Number(parts[1]);
  const s = parts.length === 3 ? Number(parts[2]) : 0;

  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) return null;
  if (!Number.isInteger(h) || h < 0 || h > 23) return null;
  if (!Number.isInteger(m) || m < 0 || m > 59) return null;
  if (s < 0 || s >= 60) return null;

  return h * 3600 + m * 60 + s;
}

/**
 * Format seconds since midnight as 12-hour clock with seconds, e.g. "2:05:30 PM" (tooltips).
 */
function formatSecondsAs12h(seconds) {
  if (seconds == null) return "";
  const sec = Math.floor(Number(seconds));
  const h24 = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} ${ampm}`;
}

/**
 * Same as {@link formatSecondsAs12h} but hour:minute only — shorter for timeline x-axis / cursor label.
 */
export function formatSecondsAs12hHm(seconds) {
  if (seconds == null) return "";
  const sec = Math.floor(Number(seconds));
  const h24 = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? "AM" : "PM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/**
 * Parseable wall-clock string → 12-hour display; falls back to original if unparseable.
 */
export function formatWallClockTimeForDisplay12h(timeStr) {
  if (!timeStr) return "";
  const sec = parseWallClockTime(timeStr);
  if (sec === null) return timeStr;
  return formatSecondsAs12h(sec);
}

/** ISO / parseable instant → local calendar date (session list cards). */
export function formatLocalDateLabel(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString();
}

/** ISO / parseable instant → local time, hours and minutes (session list cards). */
export function formatLocalTimeHourMinute(isoString) {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Valid Date → medium date + short time (session headers, etc.). */
export function formatDateMediumTimeShort(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
