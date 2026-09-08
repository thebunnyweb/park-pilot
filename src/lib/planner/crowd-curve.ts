/**
 * queue-times.com exposes only the current wait. To reason about the rest of the
 * day we use a coarse, well-known shape of theme-park demand: lowest at open,
 * climbing to a midday peak, a small dinner dip, then falling toward close.
 *
 * multiplierAt(hour) ~ (liveWait now) * multiplierAt(targetHour) / multiplierAt(nowHour)
 * gives a rough projected wait. It is explicitly an estimate and labelled as such
 * in the UI.
 */

// Indexed by hour of day (local), 6:00 .. 23:00.
const CURVE: Record<number, number> = {
  6: 0.25,
  7: 0.3,
  8: 0.4,
  9: 0.55,
  10: 0.8,
  11: 1.0,
  12: 1.15,
  13: 1.25,
  14: 1.3,
  15: 1.25,
  16: 1.1,
  17: 0.95,
  18: 0.85,
  19: 0.8,
  20: 0.75,
  21: 0.6,
  22: 0.45,
  23: 0.35,
};

function curveAt(hour: number): number {
  if (hour <= 6) return CURVE[6];
  if (hour >= 23) return CURVE[23];
  const lo = Math.floor(hour);
  const hi = Math.ceil(hour);
  if (lo === hi) return CURVE[lo] ?? 1;
  const f = hour - lo;
  return (CURVE[lo] ?? 1) * (1 - f) + (CURVE[hi] ?? 1) * f;
}

export function hoursFromHHmm(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h + (m || 0) / 60;
}

/** Project a wait seen now (at nowHHmm) forward to targetHHmm. */
export function projectWait(
  liveWait: number,
  nowHHmm: string,
  targetHHmm: string,
): number {
  const now = curveAt(hoursFromHHmm(nowHHmm));
  const target = curveAt(hoursFromHHmm(targetHHmm));
  if (now <= 0) return liveWait;
  return Math.max(0, Math.round((liveWait * target) / now));
}

/** Relative demand at a given time (1.0 = midday baseline). */
export function relativeDemand(hhmm: string): number {
  return curveAt(hoursFromHHmm(hhmm));
}

export const CROWD_CURVE_NOTE =
  "Projected waits are estimates derived from the current live wait and a typical time-of-day demand curve. queue-times.com does not publish historical data.";
