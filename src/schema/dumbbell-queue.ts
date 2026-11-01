// React-free. DumbbellQueue (F12 Before and after): follows the contract set by
// ./rung-bars.ts (one zod schema, inferred types, formatter descriptors,
// emphasis by key, fixed size with `width` + `height`, registry entry).
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";

/** One row: a label, the value before and the value after. */
export const dumbbellDatumSchema = z.strictObject({
  after: z.number(),
  before: z.number(),
  /** Names the row, and is its key unless `id` is given. */
  id: z.string().min(1).optional(),
  label: z.string(),
});

/** The key a datum is addressed by: `id`, else `label`. */
export const dumbbellKeyOf = (datum: { id?: string; label: string }) =>
  datum.id ?? datum.label;

export const dumbbellQueueSchema = z
  .strictObject({
    /** Which direction of change is drawn in the alert colour. Defaults to a rise. */
    alert: z.enum(["fall", "rise"]).optional(),
    data: z.array(dumbbellDatumSchema).min(1).max(12),
    /** The row to draw in the hero colour, by key. Defaults to the biggest change. */
    emphasis: z.string().optional(),
    /** Axis end labels: [low end, high end]. */
    ends: z.tuple([z.string(), z.string()]).optional(),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** Fixed height in px. Without it the chart is 380 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    // The old name for `unitNote`; JSON Schema marks it deprecated.
    note: z.string().optional().meta({ deprecated: true }),
    /** Size of one rung in data units: the gap counts off in these. */
    unit: z.number().positive().optional(),
    /** The in-plot key under the axis. */
    unitNote: z.string().optional(),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
  })
  .refine(
    (props) =>
      props.emphasis === undefined ||
      props.data.some((d) => dumbbellKeyOf(d) === props.emphasis),
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
export type DumbbellQueueProps = Omit<
  z.input<typeof dumbbellQueueSchema>,
  "format" | "note"
> & {
  format?: FormatInput;
  /** @deprecated Use `unitNote`. */
  note?: string;
};
