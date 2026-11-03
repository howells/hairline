/**
 * Point on a circle. `deg` is a clock angle: 0 = up (12 o'clock), increasing
 * clockwise, so 90 = right.
 */
export const clock = (
  cx: number,
  cy: number,
  r: number,
  deg: number
): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

/** Annular sector between two clock angles (degrees) and two radii. */
export const sectorPath = (
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number
) => {
  const large = a1 - a0 > 180 ? 1 : 0;
  const [x0, y0] = clock(cx, cy, r1, a0);
  const [x1, y1] = clock(cx, cy, r1, a1);
  const [x2, y2] = clock(cx, cy, r0, a1);
  const [x3, y3] = clock(cx, cy, r0, a0);
  return `M${x0},${y0}A${r1},${r1} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r0},${r0} 0 ${large} 0 ${x3},${y3}Z`;
};

/** Open arc between two clock angles. */
export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number
) => {
  const [x0, y0] = clock(cx, cy, r, a0);
  const [x1, y1] = clock(cx, cy, r, a1);
  return `M${x0},${y0}A${r},${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1},${y1}`;
};

/** The dial: its centre, hub radius and rim radius. */
export interface Dial {
  cx: number;
  cy: number;
  r0: number;
  R: number;
}

/** Hours since midnight as 14:20. */
export const hhmm = (hour: number) => {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${String(h % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** A wedge's clock angles (degrees) and reach. */
export interface Span {
  a0: number;
  a1: number;
  reach: number;
}

/** The wedge an event draws: its start, its end by duration, and its reach by size. */
export const spanOf = (
  dial: Dial,
  event: { hour: number; minutes: number; size: number },
  maxSize: number
): Span => {
  const a0 = event.hour * 15;
  return {
    a0,
    a1: a0 + Math.max(4, event.minutes / 4),
    reach: dial.r0 + ((dial.R - dial.r0) * event.size) / maxSize,
  };
};
