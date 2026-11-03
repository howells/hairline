// React-free. The box a line of 11px text takes up, so labels can be kept
// from printing over one another.

import { sansWidth } from "./util";

/** A rectangle in px. */
export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Above and below the baseline, px: cap height and descender of 11px text. */
const ASCENT = 11;
const DESCENT = 3;

/** The box of `text` set on `baseline`, centred on, ending at or starting at `x`. */
export const labelBox = (
  text: string,
  x: number,
  baseline: number,
  anchor: "end" | "middle" | "start"
): Box => {
  // Semibold values run a little wider than the measure: err wide.
  const w = Math.ceil(sansWidth(text, 12));
  const left = { end: x - w, middle: x - w / 2, start: x }[anchor];
  return {
    x0: left,
    x1: left + w,
    y0: baseline - ASCENT,
    y1: baseline + DESCENT,
  };
};

/** Whether two boxes come within `pad` px of one another. */
export const touches = (a: Box, b: Box, pad = 2) =>
  a.x0 < b.x1 + pad &&
  a.x1 > b.x0 - pad &&
  a.y0 < b.y1 + pad &&
  a.y1 > b.y0 - pad;
