import { sansWidth } from "../util";

/** Hover state shared by the basics-b charts: an item plus where to anchor its tooltip. */
export interface Tip<T> {
  item: T;
  x: number;
  y: number;
}

/** Is item `key` the hovered one? null when nothing is hovered. */
export const isActive = <T>(hover: T | null, key: T): boolean | null =>
  hover === null ? null : hover === key;

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
