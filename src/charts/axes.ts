export interface Margin {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface TickMark {
  label: string;
  x: number;
}

/** Where a mark sits relative to the scrub cursor. */
export const phase = (i: number, cursor: number) => {
  if (i < cursor) {
    return "past";
  }
  return i === cursor ? "active" : "future";
};

/** Snap a coordinate to the pixel grid for crisp 1px lines. */
export const crisp = (v: number) => Math.round(v) + 0.5;
