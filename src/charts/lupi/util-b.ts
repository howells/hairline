/** Smooth vertical S-curve between two points (tangents vertical at both ends). */
export const vCurve = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bend = 0.5
): string => {
  const dy = (y2 - y1) * bend;
  return `M${x1},${y1}C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
};

/** One threshold step for `byStep`. */
export interface Step<T> {
  min: number;
  out: T;
}

/** Pick a value by threshold without nested ternaries: the first step whose `min` is met wins. */
export const byStep = <T>(
  value: number,
  steps: readonly Step<T>[],
  fallback: T
): T => steps.find((s) => value >= s.min)?.out ?? fallback;

/** Index of the largest value (the first, on a tie); 0 when empty. */
export const argMax = (values: readonly number[]): number => {
  let best = 0;
  for (const [i, v] of values.entries()) {
    if (v > (values[best] ?? Number.NEGATIVE_INFINITY)) {
      best = i;
    }
  }
  return best;
};
