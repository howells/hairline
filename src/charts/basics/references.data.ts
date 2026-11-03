import type { DailyDatum } from "../../schema/daily";
import type { Interval } from "../../schema/intervals";
import type { RangeDatum } from "../../schema/range-dots";

/*
 * Made-up figures, to show the reference marks and the intervals. They are
 * drawn from fixed formulas, so every build draws the same marks. None of it
 * is a measurement.
 */

const DAY = 86_400_000;

const round = (v: number) => Math.round(v * 100) / 100;

const dayAfter = (start: string, n: number) =>
  new Date(Date.parse(start) + n * DAY).toISOString().slice(0, 10);

/** A reservoir's level, in percent of capacity, each day for four weeks. */
export const levelDemo: DailyDatum[] = Array.from({ length: 28 }, (_, i) => ({
  date: dayAfter("2026-03-02", i),
  value: round(66 + 8 * Math.sin(i / 4.5) + Math.cos(i / 2) * 1.5 - i * 0.05),
}));

const OBSERVED = 120;
const AHEAD = 60;
const START = "2026-01-01";

const observed = (i: number) => 30 + 0.12 * i + 4 * Math.sin(i / 9);
const last = observed(OBSERVED - 1);

const centre = (j: number) => last + 0.1 * j;
const spread = (j: number) => 1.1 * Math.sqrt(j);

/** Orders a day, in thousands: four months seen, then two forecast. */
export const forecastDemo: DailyDatum[] = Array.from(
  { length: OBSERVED + AHEAD },
  (_, i) => ({
    date: dayAfter(START, i),
    value: round(i < OBSERVED ? observed(i) : centre(i - OBSERVED + 1)),
  })
);

const edge = (z: number): Interval["points"] =>
  Array.from({ length: AHEAD + 1 }, (_, j) => ({
    date: dayAfter(START, OBSERVED - 1 + j),
    high: round((j === 0 ? last : centre(j)) + z * spread(j)),
    low: round((j === 0 ? last : centre(j)) - z * spread(j)),
  }));

/** Half the outcomes, and nine in ten: the normal quantiles of the spread. */
export const forecastIntervals: Interval[] = [
  { coverage: 0.9, points: edge(1.645) },
  { coverage: 0.5, points: edge(0.674) },
];

/** The last observed day: the forecast starts after it. */
export const forecastFrom = dayAfter(START, OBSERVED - 1);

/** Shares of households that bought each kind of material, with 90% intervals. */
export const rangeDemo: RangeDatum[] = [
  { estimate: 42, high: 46, label: "Paint", low: 38 },
  { estimate: 35, high: 41, label: "Tile", low: 29 },
  { estimate: 31, high: 40, label: "Flooring", low: 22 },
  { estimate: 24, high: 27, label: "Textiles", low: 21 },
  { estimate: 19, high: 30, label: "Stone", low: 8 },
  { estimate: 14, high: 19, label: "Wood", low: 9 },
];
