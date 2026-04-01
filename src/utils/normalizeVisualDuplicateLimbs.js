/**
 * TEMPORARY Jetson workaround (remove after device-side fix):
 * When the same real injury is mirrored on both arms or both hands, keep only
 * the single highest-accuracy detection on arm1 / hand1 and clear the opposite limb.
 */

function realInjuryEntries(injuries) {
  if (!injuries || typeof injuries !== "object") return [];
  return Object.entries(injuries)
    .filter(([type]) => type !== "no_injury")
    .map(([type, data]) => ({ type, ...data }));
}

function score(entry) {
  const a = entry.accuracy;
  return typeof a === "number" && !Number.isNaN(a) ? a : 0;
}

function pickBest(entries) {
  return entries.reduce((best, cur) => (score(cur) >= score(best) ? cur : best));
}

/**
 * @param {Record<string, { injuries?: Record<string, object> }>} visual
 * @returns {typeof visual} shallow-cloned visual with arms/hands normalized
 */
export function normalizeVisualDuplicateLimbs(visual) {
  if (!visual || typeof visual !== "object") return visual ?? {};

  const out = { ...visual };

  function consolidatePair(primaryKey, secondaryKey) {
    const primary = visual[primaryKey];
    const secondary = visual[secondaryKey];
    const a = realInjuryEntries(primary?.injuries);
    const b = realInjuryEntries(secondary?.injuries);
    if (a.length === 0 || b.length === 0) return;

    const best = pickBest([...a, ...b]);
    const { type, ...data } = best;
    out[primaryKey] = { ...primary, injuries: { [type]: data } };
    out[secondaryKey] = { ...secondary, injuries: {} };
  }

  consolidatePair("arm1", "arm2");
  consolidatePair("hand1", "hand2");

  return out;
}
