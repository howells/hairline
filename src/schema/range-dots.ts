// React-free. RangeDots (error bars): follows the contract set by ./rung-bars.ts
// (one zod schema, inferred types, formatter descriptors, fixed size with
// `width` + `height`, registry entry).
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";

/** One row: a name, an estimate and the interval round it. */
export const rangeDatumSchema = z.strictObject({
  /** The estimate: where the dot stands. */
  estimate: z.number().describe("The estimate: where the dot stands."),
  /** The upper end of the interval. */
  high: z.number().describe("The upper end of the interval."),
  /** A unique key, for when two rows share a label. */
  id: z
    .string()
    .min(1)
    .optional()
    .describe("A unique key, for when two rows share a label."),
  /** Names the row, and is its key unless `id` is given. */
  label: z
    .string()
    .describe("Names the row, and is its key unless `id` is given."),
  /** The lower end of the interval. */
  low: z.number().describe("The lower end of the interval."),
});

export const rangeDotsSchema = z
  .strictObject({
    ...noteShape,
    ...sharedShape,
    /** The share of outcomes each interval covers, such as 0.9; named in the description and table. */
    coverage: z
      .number()
      .gt(0)
      .lt(1)
      .optional()
      .describe(
        "The share of outcomes each interval covers, such as 0.9; named in the description and table."
      ),
    /** The rows, 1 to 12, in the order they are drawn. */
    data: z
      .array(rangeDatumSchema)
      .min(1)
      .max(12)
      .describe("The rows, 1 to 12, in the order they are drawn."),
    /** The value axis range, [low, high]. Defaults to zero (or the lowest end) up to the highest end. */
    domain: z
      .tuple([z.number(), z.number()])
      .optional()
      .describe(
        "The value axis range, [low, high]. Defaults to zero (or the lowest end) up to the highest end."
      ),
    /** How estimates and interval ends print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How estimates and interval ends print: a preset name or Intl number-format options."
      ),
    /** How the margin after the ± prints. Defaults to `format`. */
    formatMargin: formatSchema
      .optional()
      .describe("How the margin after the ± prints. Defaults to `format`."),
    /** Fixed height in px. Without it the chart is as tall as its rows need. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Fixed height in px. Without it the chart is as tall as its rows need."
      ),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** An interval wider than this, high less low, is too uncertain to rank: its dot is drawn open. */
    wide: z
      .number()
      .positive()
      .optional()
      .describe(
        "An interval wider than this, high less low, is too uncertain to rank: its dot is drawn open."
      ),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed width in px. Giving it turns measuring off."),
  })
  .superRefine((props, ctx) => {
    for (const [i, d] of props.data.entries()) {
      if (!(d.low <= d.estimate && d.estimate <= d.high)) {
        ctx.addIssue({
          code: "custom",
          message: "the estimate must lie between low and high",
          path: ["data", i, "estimate"],
        });
      }
    }

    if (props.domain !== undefined && !(props.domain[0] < props.domain[1])) {
      ctx.addIssue({
        code: "custom",
        message: "domain must run from low to high",
        path: ["domain"],
      });
    }
  });

/** One row. */
export type RangeDatum = z.infer<typeof rangeDatumSchema>;

/** The validated payload. */
export type RangeDotsData = z.infer<typeof rangeDotsSchema>;

/** What `<RangeDots>` takes: the payload, with formats also allowed as functions. */
export type RangeDotsProps = SharedCallbacks &
  Omit<z.input<typeof rangeDotsSchema>, "format" | "formatMargin" | "note"> & {
    format?: FormatInput;
    formatMargin?: FormatInput;
  } & NoteProps;
