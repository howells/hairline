import { rnd } from "../../lib/random";

export interface ConvergenceItem {
  id: string;
  theme: string;
}

/**
 * Fieldnote feature requests from the last quarter, each claimed by the
 * feature it asks for. Themes in clockwise order, with their request counts.
 */
const blocks: [string, number][] = [
  ["Assistant", 16],
  ["Search", 13],
  ["Sync", 10],
  ["Canvas", 8],
  ["Export", 5],
];

const order = blocks.flatMap(([theme, n]) =>
  Array.from({ length: n }, () => theme)
);
/** Rotate so the first theme straddles 12 o'clock. */
const offset = 8;

/** Tracker numbers climb around the rim, with gaps where others were closed. */
const ids: number[] = [];
for (const k of order.keys()) {
  ids.push((ids.at(-1) ?? 1180) + 3 + Math.floor(rnd(k, 4) * 9));
}

export const radialConvergenceDemo: ConvergenceItem[] = order.map((_, k) => ({
  id: `#${ids[k]}`,
  theme: order[(k + offset) % order.length],
}));
