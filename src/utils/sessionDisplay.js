/**
 * Session IDs follow: session_{YYYYMMDD}_{HHMMSS}_{device_id...}
 * (device_id may contain underscores; see slice(3).join("_") in pages.)
 */

export function parseSessionStartDate(sessionId) {
  if (!sessionId || typeof sessionId !== "string") return null;
  const parts = sessionId.split("_");
  if (parts.length < 4 || parts[0] !== "session") return null;

  const ymd = parts[1];
  const hmss = parts[2];
  if (!/^\d{8}$/.test(ymd) || !/^\d{6}/.test(hmss ?? "")) return null;

  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(4, 6)) - 1;
  const day = Number(ymd.slice(6, 8));

  const h = Number(hmss.slice(0, 2));
  const m = Number(hmss.slice(2, 4));
  const s = Number(hmss.slice(4, 6));
  if ([year, month, day, h, m, s].some((n) => Number.isNaN(n))) return null;

  const d = new Date(year, month, day, h, m, s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human-readable session start; falls back to raw `sessionId` if parsing fails. */
export function formatSessionStartedAt(sessionId) {
  const d = parseSessionStartDate(sessionId);
  if (!d) return sessionId;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}
