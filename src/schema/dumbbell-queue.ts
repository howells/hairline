// React-free. DumbbellQueue (F12 Before and after): follows the contract set by
// ./rung-bars.ts (one zod schema, inferred types, formatter descriptors,
// emphasis by key, fixed size with `width` + `height`, registry entry).
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";
import { keyOf } from "./key";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";
import { referencesShape } from "./references";

/** One row: a label, the value before and the value after. */
export const dumbbellDatumSchema = z.strictObject({
  /** The later value. */
  after: z.number().describe("The later value."),
  /** The earlier value. */
  before: z.number().describe("The earlier value."),
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
});

export const dumbbellQueueSchema = z
  .strictObject({
    ...noteShape,
    ...referencesShape,
    ...sharedShape,
    /** Which direction of change is drawn in the alert colour. Defaults to a rise. */
    alert: z
      .enum(["fall", "rise"])
      .optional()
      .describe(
        "Which direction of change is drawn in the alert colour. Defaults to a rise."
      ),
    /** The rows, 1 to 12. */
    data: z
      .array(dumbbellDatumSchema)
      .min(1)
      .max(12)
      .describe("The rows, 1 to 12."),
    /** The row to draw in the hero colour, by key. Defaults to the biggest change. */
    emphasis: z
      .string()
      .optional()
      .describe(
        "The row to draw in the hero colour, by key. Defaults to the biggest change."
      ),
    /** Axis end labels: [low end, high end]. */
    ends: z
      .tuple([z.string(), z.string()])
      .optional()
      .describe("Axis end labels: [low end, high end]."),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How values print: a preset name or Intl number-format options."
      ),
    /** Fixed height in px. Without it the chart is 380 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it the chart is 380 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** Size of one rung in data units: the gap counts off in these. */
    unit: z
      .number()
      .positive()
      .optional()
      .describe("Size of one rung in data units: the gap counts off in these."),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed width in px. Giving it turns measuring off."),
  })
  .refine(
    (props) =>
      props.emphasis === undefined ||
      props.data.some((d) => keyOf(d) === props.emphasis),
    {
      message: "emphasis names no row: it must equal a datum's id or label",
      path: ["emphasis"],
    }
  );

/** One row. */
export type DumbbellDatum = z.infer<typeof dumbbellDatumSchema>;
/** The validated payload. */
export type DumbbellQueueData = z.infer<typeof dumbbellQueueSchema>;
/** What `<DumbbellQueue>` takes: the payload, with `format` also allowed as a function. */
export type DumbbellQueueProps = SharedCallbacks &
  Omit<z.input<typeof dumbbellQueueSchema>, "format" | "note"> & {
    format?: FormatInput;
  } & NoteProps;
