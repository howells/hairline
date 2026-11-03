// React-free. The registry: what each chart is for, in a form an agent reads.
// Wiredeck's MCP picks a chart by `job`, writes `data` to the `shape`, and
// checks it with `validate`. Add one entry per chart, in kind order.
import type { ZodType } from "zod";

import { dumbbellQueueSchema } from "./dumbbell-queue";
import { hairlineAreaSchema } from "./hairline-area";
import { hairlineLineSchema } from "./hairline-line";
import { plumbScatterSchema } from "./plumb-scatter";
import { rangeDotsSchema } from "./range-dots";
import { rungBarsSchema } from "./rung-bars";
import { slopeSchema } from "./slope";
import { validate } from "./validate";
import type { Payload, Validated } from "./validate";

/** The nine jobs of the FT Visual Vocabulary. */
export type Job =
  | "change-over-time"
  | "correlation"
  | "deviation"
  | "distribution"
  | "flow"
  | "magnitude"
  | "part-to-whole"
  | "ranking"
  | "spatial";

export interface ChartEntry<T = unknown> {
  /** The chart's name in the package, e.g. "RungBars". */
  component: string;
  /** Plain-words shape of `data`, for a prompt. */
  dataShape: string;
  /** How much data the chart takes well; the schema enforces the bounds. */
  limits: {
    categories?: { max: number; min: number };
    series: { max: number; min: number };
  };
  /** The stable id: what a payload's `kind` says. */
  kind: string;
  /** The Visual Vocabulary job the chart does best, then the next best. */
  jobs: readonly [Job, ...Job[]];
  schema: ZodType<T>;
  /** Check a payload against `schema`. */
  validate: (input: Payload) => Validated<T>;
  whenNotToUse: string;
  whenToUse: string;
}

const entry = <T>(details: Omit<ChartEntry<T>, "validate">): ChartEntry<T> => ({
  ...details,
  validate: (input) => validate(details.schema, input),
});

/** Every chart by kind, typed: `charts["rung-bars"].validate(x)` returns that chart's data. */
export const charts = {
  "dumbbell-queue": entry({
    component: "DumbbellQueue",
    dataShape:
      'data: { label: string; before: number; after: number; id?: string }[], one row each; optional emphasis (a row\'s id or label), alert ("rise" or "fall": the direction drawn in the alert colour), unit (change per rung), ends (two axis labels), format, note.',
    jobs: ["deviation", "change-over-time"],
    kind: "dumbbell-queue",
    limits: { categories: { max: 12, min: 1 }, series: { max: 2, min: 2 } },
    schema: dumbbellQueueSchema,
    whenNotToUse:
      "More than a dozen rows, more than two states per row, or changes so large that counting rungs is hopeless (raise `unit`).",
    whenToUse:
      "The same few things measured at two moments, or against a target: how far each moved, and which way.",
  }),
  "hairline-area": entry({
    component: "HairlineArea",
    dataShape:
      "data: { date: ISO string; value: number | null; id?: string }[], one reading a day; optional emphasis (a reading's id or date; null for none), format, dateFormat, domain ([low, high] value scale, shared across small multiples), valueAxis (right by default, left in a margin of its own, none to drop the numbers and their room), ticks (value-axis ticks from 0), maxWidth, note. A null value is a gap.",
    jobs: ["change-over-time", "magnitude"],
    kind: "hairline-area",
    limits: { categories: { max: 731, min: 1 }, series: { max: 1, min: 1 } },
    schema: hairlineAreaSchema,
    whenNotToUse:
      "Values that go negative (the area is drawn from zero), several series, readings that are not daily, or a chart where the exact path matters more than the volume under it.",
    whenToUse:
      "One quantity measured every day over weeks to a year, where the volume under the line is the story: daylight, sales, traffic.",
  }),
  "hairline-line": entry({
    component: "HairlineLine",
    dataShape:
      "data: { date: ISO string; value: number | null; id?: string }[], one reading a day; optional hero (readings' ids or dates, drawn in ink above the rest; defaults to the extreme, an empty list for none), context (grey or opacity: how the rest are drawn), extreme (peak or trough, when no hero), format, dateFormat, domain ([low, high] value scale, shared across small multiples), valueAxis (right by default, left in a margin of its own, none to drop the numbers and their room), note. A null value is a gap.",
    jobs: ["change-over-time", "ranking"],
    kind: "hairline-line",
    limits: { categories: { max: 731, min: 1 }, series: { max: 1, min: 1 } },
    schema: hairlineLineSchema,
    whenNotToUse:
      "More than one series, readings that are not daily, or hundreds of points where individual dots stop being readable (use the area).",
    whenToUse:
      "One quantity read every day for a few weeks, where each day is worth a dot and the peak or trough is the point: a price, a temperature.",
  }),
  "plumb-scatter": entry({
    component: "PlumbScatter",
    dataShape:
      "data: { label: string; x: number; y: number; id?: string }[], one point each; optional hero (points' ids or labels, drawn in ink above the rest; defaults to the highest), context (grey or opacity: how the rest are drawn), heroLabel (names the hero group on the chart), labelled (points' ids or labels), format and formatX, xDomain, yDomain, xLabels [low, high], yLabel, note.",
    jobs: ["correlation", "ranking"],
    kind: "plumb-scatter",
    limits: { categories: { max: 20, min: 1 }, series: { max: 1, min: 1 } },
    schema: plumbScatterSchema,
    whenNotToUse:
      "More than about twenty points, several series, or when the reader needs to read y off a scale rather than from a stem and a name: the stems carry x, the height carries y.",
    whenToUse:
      "A dozen or so named things measured on two quantities, to show whether they move together and which stand apart.",
  }),
  "range-dots": entry({
    component: "RangeDots",
    dataShape:
      "data: { label: string; estimate: number; low: number; high: number; id?: string }[], one row each, drawn in the order given; optional wide (an interval wider than this is too uncertain to rank: its dot is drawn open), coverage (0.9 for a 90% interval), domain ([low, high]), format and formatMargin, note.",
    jobs: ["distribution", "ranking"],
    kind: "range-dots",
    limits: { categories: { max: 12, min: 1 }, series: { max: 1, min: 1 } },
    schema: rangeDotsSchema,
    whenNotToUse:
      "Exact counts with no uncertainty (use bars), more than a dozen rows, or intervals that are not about the same quantity and cannot share one axis.",
    whenToUse:
      "Estimates from a sample or a model, such as survey shares or forecasts, where the reader must see how far each can be trusted and which are too uncertain to rank.",
  }),
  "rung-bars": entry({
    component: "RungBars",
    dataShape:
      "data: { label: string; value: number; id?: string }[], one bar each; optional emphasis (a bar's id or label), unit (value per rung), format, unitNote.",
    jobs: ["magnitude", "ranking"],
    kind: "rung-bars",
    limits: { categories: { max: 24, min: 1 }, series: { max: 1, min: 1 } },
    schema: rungBarsSchema,
    whenNotToUse:
      "Values in the thousands (one rung per unit becomes a solid block; raise `unit`), negative values, many categories, or more than one series.",
    whenToUse:
      "A handful of counts the reader can tally by eye: years against events, one number per category.",
  }),
  slope: entry({
    component: "Slope",
    dataShape:
      "rows: { name: string; from: number; to: number; id?: string }[], one line each; labels: [string, string] naming the two points; optional emphasis (a row's id or name), domain ([low, high]), format and narrowFormat, label (accessible name).",
    jobs: ["change-over-time", "ranking"],
    kind: "slope",
    limits: { categories: { max: 12, min: 1 }, series: { max: 1, min: 1 } },
    schema: slopeSchema,
    whenNotToUse:
      "More than two points in time (use a line), more than a dozen rows (the labels collide), or a single total with no rows to compare.",
    whenToUse:
      "The change between two points for a handful of rows: before and after, this year against last, where the reader should see which rose and which fell.",
  }),
};

export type ChartKind = keyof typeof charts;

/** The same entries as a list, for an agent to read and choose from. */
export const registry: readonly ChartEntry[] = Object.values(charts);

/** The entry for a known kind (typed), or for any string (maybe undefined). */
export function getChart<K extends ChartKind>(kind: K): (typeof charts)[K];
export function getChart(kind: string): ChartEntry | undefined;
export function getChart(kind: string): ChartEntry | undefined {
  return registry.find((chart) => chart.kind === kind);
}
