// React-free. Slope (D7 Cleaner regions): the change between two points, one
// line per row. Follows the pattern src/schema/rung-bars.ts sets out: one zod
// schema is the source of the props, types are inferred from it, formatters
// are descriptors, rows are addressed by key, fixed size is `width` + `height`.
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";
import { keyOf } from "./key";
import { sharedShape } from "./options";
import type { SharedCallbacks } from "./options";

/** One line: a name and its values at the two points. */
export const slopeRowSchema = z.strictObject({
  /** The value at the left point. */
  from: z.number().describe("The value at the left point."),
  /** A unique key, for when two rows share a name. */
  id: z
    .string()
    .min(1)
    .optional()
    .describe("A unique key, for when two rows share a name."),
  /** Names the row, and is its key unless `id` is given. */
  name: z
    .string()
    .describe("Names the row, and is its key unless `id` is given."),
  /** The value at the right point. */
  to: z.number().describe("The value at the right point."),
});

export const slopeSchema = z
  .strictObject({
    ...sharedShape,
    /** The y range as [lowest, highest]. Defaults to the extent of the rows. */
    domain: z
      .tuple([z.number(), z.number()])
      .refine(([low, high]) => low < high, {
        message: "domain must run from lower to higher",
      })
      .optional()
      .describe(
        "The y range as [lowest, highest]. Defaults to the extent of the rows."
      ),
    /** The row to draw in the hero colour, by key. Defaults to the biggest fall. */
    emphasis: z
      .string()
      .optional()
      .describe(
        "The row to draw in the hero colour, by key. Defaults to the biggest fall."
      ),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How values print: a preset name or Intl number-format options."
      ),
    /** Fixed height in px. Without it a slope chart is 420 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it a slope chart is 420 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** The accessible name. Defaults to a reading of the rows. */
    label: z
      .string()
      .optional()
      .describe("The accessible name. Defaults to a reading of the rows."),
    /** Names the two points, left then right, e.g. ["Jan 2023", "Dec 2024"]. */
    labels: z
      .tuple([z.string(), z.string()])
      .describe(
        'Names the two points, left then right, e.g. ["Jan 2023", "Dec 2024"].'
      ),
    /** The same on a phone (under 520px wide), where a unit would crowd the columns. */
    narrowFormat: formatSchema
      .optional()
      .describe(
        "The same on a phone (under 520px wide), where a unit would crowd the columns."
      ),
    /** The rows, 1 to 12. */
    rows: z.array(slopeRowSchema).min(1).max(12).describe("The rows, 1 to 12."),
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
      props.rows.some((r) => keyOf(r) === props.emphasis),
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
export type SlopeProps = SharedCallbacks &
  Omit<z.input<typeof slopeSchema>, "format" | "narrowFormat"> & {
    format?: FormatInput;
    narrowFormat?: FormatInput;
  };
