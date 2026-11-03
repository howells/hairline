/*
 * Where a ring's selection caption sits: in clear space inside the ring, away
 * from every node and as far from the links as the ring allows. The caption is
 * a box centred on the spot.
 */

export interface Point {
  x: number;
  y: number;
}

/** A cubic curve: start, two control points, end. */
export type Cubic = readonly [Point, Point, Point, Point];

export interface Disc extends Point {
  r: number;
}

interface Frame {
  cx: number;
  cy: number;
  /** The ring's radius: nothing of the caption goes outside 0.9 of it. */
  R: number;
}

interface Spot {
  /** Links that pass through the box, sampled along their length. */
  crossings: number;
  x: number;
  y: number;
}

const SAMPLES = 24;
/** Clear space kept round the box, in px. */
const MARGIN = 4;
const STEP = 6;
const INSIDE = 0.9;

const at = (c: Cubic, t: number): Point => {
  const u = 1 - t;
  const [a, b, d, e] = c;
  return {
    x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * d.x + t ** 3 * e.x,
    y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * d.y + t ** 3 * e.y,
  };
};

/** Whether a disc comes within `MARGIN` of the box centred on `p`. */
export const touchesDisc = (p: Point, w: number, h: number, d: Disc) => {
  const dx = Math.max(Math.abs(d.x - p.x) - w / 2, 0);
  const dy = Math.max(Math.abs(d.y - p.y) - h / 2, 0);
  return Math.hypot(dx, dy) < d.r + MARGIN;
};

const inside = (p: Point, w: number, h: number, f: Frame) =>
  Math.hypot(Math.abs(p.x - f.cx) + w / 2, Math.abs(p.y - f.cy) + h / 2) <=
  f.R * INSIDE;

const crossings = (
  p: Point,
  w: number,
  h: number,
  curves: readonly Cubic[]
) => {
  let n = 0;
  for (const c of curves) {
    for (let k = 0; k <= SAMPLES; k += 1) {
      const s = at(c, k / SAMPLES);
      if (
        Math.abs(s.x - p.x) <= w / 2 + MARGIN &&
        Math.abs(s.y - p.y) <= h / 2 + MARGIN
      ) {
        n += 1;
      }
    }
  }
  return n;
};

/**
 * The spot for a `w` by `h` caption: of the places inside the ring that touch
 * no node, the one the fewest links pass through, nearest the centre on a tie.
 * A ring too small to hold the box with room round it has no such place: the
 * caption then sits at its centre, on its halo, over the links.
 */
export const captionSpot = (
  frame: Frame,
  size: { h: number; w: number },
  discs: readonly Disc[],
  curves: readonly Cubic[]
): Point => {
  const { w, h } = size;
  let best: Spot | null = null;
  for (let y = frame.cy - frame.R; y <= frame.cy + frame.R; y += STEP) {
    for (let x = frame.cx - frame.R; x <= frame.cx + frame.R; x += STEP) {
      const p = { x, y };
      if (
        inside(p, w, h, frame) &&
        !discs.some((d) => touchesDisc(p, w, h, d))
      ) {
        const spot = { crossings: crossings(p, w, h, curves), x, y };
        const dist = (s: Spot) => Math.hypot(s.x - frame.cx, s.y - frame.cy);
        if (
          best === null ||
          spot.crossings < best.crossings ||
          (spot.crossings === best.crossings && dist(spot) < dist(best))
        ) {
          best = spot;
        }
      }
    }
  }
  return best ?? { x: frame.cx, y: frame.cy };
};
