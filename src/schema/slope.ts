// React-free. Slope (D7 Cleaner regions): the change between two points, one
// line per row. Follows the pattern src/schema/rung-bars.ts sets out: one zod
// schema is the source of the props, types are inferred from it, formatters
// are descriptors, rows are addressed by key, fixed size is `width` + `height`.
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";

/** One line: a name and its values at the two points. */
export const slopeRowSchema = z.strictObject({
  from: z.number(),
  /** Names the row, and is its key unless `id` is given. */
  id: z.string().min(1).optional(),
  name: z.string(),
  to: z.number(),
});

/** The key a row is addressed by: `id`, else `name`. */
export const slopeRowKey = (row: { id?: string; name: string }) =>
  row.id ?? row.name;

export const slopeSchema = z
  .strictObject({
    /** The y range as [lowest, highest]. Defaults to the extent of the rows. */
    domain: z
      .tuple([z.number(), z.number()])
      .refine(([low, high]) => low < high, {
        message: "domain must run from lower to higher",
      })
      .optional(),
    /** The row to draw in the hero colour, by key. Defaults to the biggest fall. */
    emphasis: z.string().optional(),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** Fixed height in px. Without it a slope chart is 420 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    /** The accessible name. Defaults to a reading of the rows. */
    label: z.string().optional(),
    /** Names the two points, left then right, e.g. ["Jan 2023", "Dec 2024"]. */
    labels: z.tuple([z.string(), z.string()]),
    /** The same on a phone (under 520px wide), where a unit would crowd the columns. */
    narrowFormat: formatSchema.optional(),
    rows: z.array(slopeRowSchema).min(1).max(12),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
  })
  .refine(
    (props) =>
      props.emphasis === undefined ||
      props.rows.some((r) => slopeRowKey(r) === props.emphasis),
    {
      message: "emphasis names no row: it must equal a row's id or name",
      path: ["emphasis"],
    }
  );

/** One line. */
export type SlopeRow = z.infer<typeof slopeRowSchema>;
/** The validated payload. */
export type SlopeData = z.infer<typeof slopeSchema>;
/** What `<Slope>` takes: the payload, with formats also allowed as functions. */
export type SlopeProps = Omit<
  z.input<typeof slopeSchema>,
  "format" | "narrowFormat"
> & {
  format?: FormatInput;
  narrowFormat?: FormatInput;
};
