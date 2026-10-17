import { sansWidth } from "../util";

/** Point on a circle, angle in radians measured clockwise from 12 o'clock. */
export const polar = (cx: number, cy: number, r: number, a: number) => ({
  x: cx + r * Math.sin(a),
  y: cy - r * Math.cos(a),
});

/** Index of the largest value (first one wins ties). */
export const maxIndex = (values: readonly number[]): number => {
  let best = 0;
  for (const [i, v] of values.entries()) {
    if (v > (values[best] ?? Number.NEGATIVE_INFINITY)) {
      best = i;
    }
  }
  return best;
};

/**
 * Ink width of a string in the 11px sans roles, for centring a composition:
 * digits are tabular (0.65em), the rest is `sansWidth` less its safety margin.
 */
export const inkWidth = (text: string) => {
  const digits = (text.match(/\d/gu) ?? []).length;
  return digits * 0.65 * 11 + sansWidth(text.replaceAll(/\d/gu, ""), 11) * 0.93;
};
