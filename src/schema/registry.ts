// React-free. The registry: what each chart is for, in a form an agent reads.
// Wiredeck's MCP picks a chart by `job`, writes `data` to the `shape`, and
// checks it with `validate`. Add one entry per chart, in kind order.
import type { ZodType } from "zod";

import { rungBarsSchema } from "./rung-bars";
import { validate } from "./validate";
import type { Validated } from "./validate";

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
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- the I/O boundary: an agent's raw payload, parsed by `schema` here
  validate: (input: unknown) => Validated<T>;
  whenNotToUse: string;
  whenToUse: string;
}

const entry = <T>(details: Omit<ChartEntry<T>, "validate">): ChartEntry<T> => ({
  ...details,
  validate: (input) => validate(details.schema, input),
});

/** Every chart by kind, typed: `charts["rung-bars"].validate(x)` returns that chart's data. */
export const charts = {
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
