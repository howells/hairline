/*
 * The pointer model's arithmetic, apart from React: which stop a pointer
 * snaps to, where a key steps, and where the tip stands. Pure, so each rule
 * is tested on numbers.
 */

/** Which way a chart's stops are found: across (x), down (y) or on the plane. */
export type Axis = "x" | "xy" | "y";

export interface Spot {
  x: number;
  y: number;
}

/** Gap between a tip and the edge of its chart, px. */
export const TIP_INSET = 4;
/** Gap between a tip and the mark it speaks for, px. */
export const TIP_GAP = 12;

const distance = (axis: Axis, a: Spot, b: Spot) => {
  if (axis === "x") {
    return Math.abs(a.x - b.x);
  }
  return axis === "y" ? Math.abs(a.y - b.y) : Math.hypot(a.x - b.x, a.y - b.y);
};

/**
 * The stop nearest the pointer, or null when none is within `reach`. An "x"
 * chart ignores height, so a pointer anywhere in a column finds its stop;
 * "xy" is the plain distance across the plane. Ties go to the earlier stop.
 */
export const nearest = <S extends Spot>(
  stops: readonly S[],
  axis: Axis,
  at: Spot,
  reach: number
): S | null => {
  let best: S | null = null;
  let bestDistance = Infinity;
  for (const stop of stops) {
    const d = distance(axis, stop, at);
    if (d < bestDistance) {
      best = stop;
      bestDistance = d;
    }
  }
  return bestDistance <= reach ? best : null;
};

const BACK = new Set(["ArrowLeft", "ArrowUp"]);
const FORWARD = new Set(["ArrowDown", "ArrowRight"]);
export const STEP_KEYS = new Set([...BACK, ...FORWARD, "End", "Home"]);

/**
 * The index a key moves to among `count` stops, from `from` (-1 when none is
 * showing). Arrows step and stop at the ends; Home and End jump. With none
 * showing, a forward key or Home lands on the first, a back key or End on
 * the last.
 */
export const stepTo = (count: number, from: number, key: string) => {
  const last = count - 1;
  if (key === "Home") {
    return 0;
  }
  if (key === "End") {
    return last;
  }
  if (from < 0) {
    return FORWARD.has(key) ? 0 : last;
  }
  const next = from + (BACK.has(key) ? -1 : 1);
  return Math.max(0, Math.min(last, next));
};

interface Size {
  h: number;
  w: number;
}

export interface Placement {
  left: number;
  side: "left" | "right";
  top: number;
}

/** A y-range. */
export type Range = readonly [number, number];

/** The y-ranges to keep off under an x-extent: the line, its labels, the notes, or the row. */
export type Avoid = (x0: number, x1: number) => readonly Range[];

/** A box the chart prints, in the tip's pixels. */
export interface Box {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

/** What to avoid made from printed boxes: the y-range of each box under the tip's x-extent. */
export const avoidBoxes =
  (boxes: readonly Box[]): Avoid =>
  (x0, x1) => {
    const ranges: Range[] = [];
    for (const b of boxes) {
      if (b.right >= x0 && b.left <= x1) {
        ranges.push([b.top, b.bottom]);
      }
    }
    return ranges;
  };

export interface PlaceOptions {
  /**
   * Stand above the mark, centred on it, this far over its anchor (a column
   * with its label on top). With no room above, the tip stands beside it.
   */
  above?: number;
  /** The mark's anchor. */
  at: Spot;
  /**
   * Stand below the mark, centred on it, this far under its anchor (a mark
   * near the chart's top edge). Tried before `above`; with room for neither,
   * the tip stands beside it.
   */
  below?: number;
  /**
   * What the tip keeps off where it can, asked for under the tip's own
   * x-extent once its side is chosen: the hero's line, or the row.
   */
  avoid?: Avoid;
  bounds: Size;
  /** Horizontal room the mark itself takes either side of `at.x`. */
  clear?: number;
  /** The side tried first. */
  side?: "left" | "right";
  tip: Size;
}

interface Edge {
  fits: boolean;
  left: number;
  side: "left" | "right";
}

const edgeOf = (o: PlaceOptions, side: "left" | "right"): Edge => {
  const reach = (o.clear ?? 0) + TIP_GAP;
  const raw = side === "right" ? o.at.x + reach : o.at.x - reach - o.tip.w;
  const max = Math.max(TIP_INSET, o.bounds.w - o.tip.w - TIP_INSET);
  return {
    fits: raw >= TIP_INSET && raw <= max,
    left: Math.min(Math.max(raw, TIP_INSET), max),
    side,
  };
};

/** The value with the lowest score; the first wins a tie. */
const lowest = <T>(values: readonly T[], score: (v: T) => number) => {
  let [best] = values;
  for (const v of values) {
    if (score(v) < score(best)) {
      best = v;
    }
  }
  return best;
};

/** How much of `top`..`top + h` lies on the ranges. */
const covered = (top: number, h: number, ranges: readonly Range[]) => {
  let total = 0;
  for (const [lo, hi] of ranges) {
    total += Math.max(0, Math.min(top + h, hi) - Math.max(top, lo));
  }
  return total;
};

/** Where the tip stands up and down beside `left`, and how much it covers there. */
const vertical = (o: PlaceOptions, left: number) => {
  const { h } = o.tip;
  const min = TIP_INSET;
  const max = Math.max(min, o.bounds.h - h - TIP_INSET);
  const clamp = (y: number) => Math.min(Math.max(y, min), max);
  const centred = clamp(o.at.y - h / 2);
  if (o.avoid === undefined) {
    return { overlap: 0, top: centred };
  }
  const ranges = o.avoid(left, left + o.tip.w);
  const candidates = [centred, min, max];
  for (const [lo, hi] of ranges) {
    candidates.push(clamp(lo - h - TIP_GAP / 2), clamp(hi + TIP_GAP / 2));
  }
  const from = (top: number) => Math.abs(top + h / 2 - o.at.y);
  // Least covered first; of those equally clear, the nearest the mark.
  const top = lowest(candidates, (t) => covered(t, h, ranges) * 1000 + from(t));
  return { overlap: covered(top, h, ranges), top };
};

/** Centred over or under the mark at `top`, or null when that clips. */
const centred = (o: PlaceOptions, top: number): Placement | null => {
  if (top < TIP_INSET || top + o.tip.h > o.bounds.h - TIP_INSET) {
    return null;
  }
  const max = Math.max(TIP_INSET, o.bounds.w - o.tip.w - TIP_INSET);
  const left = Math.min(Math.max(o.at.x - o.tip.w / 2, TIP_INSET), max);
  return { left, side: o.side ?? "right", top };
};

const overhead = (o: PlaceOptions) =>
  o.above === undefined ? null : centred(o, o.at.y - o.above - o.tip.h);

const underneath = (o: PlaceOptions) =>
  o.below === undefined ? null : centred(o, o.at.y + o.below);

/**
 * Where a tip stands: under or above the mark when it asked and there is
 * room (under first); otherwise beside the mark on its preferred side,
 * flipped only when that side would clip or would cover what the chart asked
 * it to keep off while the other would not; never past the chart's bounds.
 */
export const placeTip = (o: PlaceOptions): Placement => {
  const stacked = underneath(o) ?? overhead(o);
  if (stacked !== null) {
    return stacked;
  }
  const wanted = o.side ?? "right";
  const sides = [wanted, wanted === "right" ? "left" : "right"] as const;
  const edges = sides.map((side) => edgeOf(o, side));
  const fitting = edges.filter((e) => e.fits);
  const roomier = lowest(edges, (e) => Math.abs(e.left - o.at.x));
  const pool = fitting.length > 0 ? fitting : [roomier];
  const options = pool.map((edge) => ({ edge, ...vertical(o, edge.left) }));
  const best = lowest(options, (v) => v.overlap);
  return { left: best.edge.left, side: best.edge.side, top: best.top };
};

/** The words a screen reader gets for a stop: its title, then each row. */
export const spoken = (
  stop: { lead: string; rows: readonly { name?: string; value: string }[] },
  pinned: boolean
) => {
  const rows = stop.rows
    .map((r) => (r.name === undefined ? r.value : `${r.name} ${r.value}`))
    .join(", ");
  return `${stop.lead}${rows === "" ? "" : `: ${rows}`}${pinned ? ". Pinned" : ""}`;
};
