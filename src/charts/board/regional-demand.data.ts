// Made-up demo data: weekly demand index for eleven regions through 2024
// (the same weeks as the grid data), each a drift from `from` to `to` with a
// slow wave. Nothing here was measured.

import type { Point } from "../../lib/data";
import { WEEKS } from "../../lib/data";

interface Region {
  /** The wave's height, in index points. */
  amplitude: number;
  from: number;
  name: string;
  /** Where in its cycle the wave starts, in turns. */
  phase: number;
  to: number;
}

/** The first region is the hero: the one that climbs. */
const REGIONS: Region[] = [
  { amplitude: 2, from: 38, name: "North", phase: 0.1, to: 97 },
  { amplitude: 3, from: 49, name: "West", phase: 0.4, to: 82 },
  { amplitude: 4, from: 45, name: "South", phase: 0.7, to: 68 },
  { amplitude: 5, from: 55, name: "East", phase: 0.2, to: 34 },
  { amplitude: 4, from: 58, name: "Midlands", phase: 0.55, to: 66 },
  { amplitude: 6, from: 42, name: "Coast", phase: 0.9, to: 52 },
  { amplitude: 7, from: 56, name: "Highlands", phase: 0.3, to: 41 },
  { amplitude: 4, from: 36, name: "Islands", phase: 0.65, to: 31 },
  { amplitude: 3, from: 44, name: "Valley", phase: 0.05, to: 40 },
  { amplitude: 5, from: 32, name: "Border", phase: 0.8, to: 42 },
  { amplitude: 3, from: 30, name: "Capital", phase: 0.45, to: 29 },
];

const YEAR = WEEKS.slice(52);

/** Eased from 0 to 1 across the year. */
const ease = (t: number) => t * t * (3 - 2 * t);

const seriesOf = (r: Region): Point[] =>
  YEAR.map((date, k) => {
    const t = k / (YEAR.length - 1);

    return {
      date,
      value:
        r.from +
        (r.to - r.from) * ease(t) +
        r.amplitude * Math.sin(2 * Math.PI * (1.5 * t + r.phase)),
    };
  });

/** Each region's weekly index, the climbing one first. */
export const regionalDemand = REGIONS.map((r) => ({
  data: seriesOf(r),
  name: r.name,
}));
