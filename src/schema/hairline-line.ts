// React-free. HairlineLine (F2 Daily line): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";
import { keyOf } from "./key";
import { sharedShape } from "./options";
import type { SharedCallbacks } from "./options";

export const hairlineLineSchema = z
  .strictObject({
    ...sharedShape,
    /** Readings by date, in any order. A null value is a gap. */
    data: z.array(dailyDatumSchema).min(1).max(731),
    /** How dates print on the axis and in the tooltip. Defaults to day-month. */
    dateFormat: dateFormatSchema.optional(),
    /** The reading to draw in the hero colour, by key. Defaults to `extreme`. */
    emphasis: z.string().optional(),
    /** Which extreme the hero marks when `emphasis` is not given. */
    extreme: z.enum(["peak", "trough"]).optional(),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** Fixed height in px. Without it a line chart is 440 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    // The old name for `unitNote`; JSON Schema marks it deprecated.
    note: z.string().optional().meta({ deprecated: true }),
    /** The in-plot key under the axis. */
    unitNote: z.string().optional(),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
  })
  .refine(
    (props) =>
      props.emphasis === undefined ||
      props.data.some((d) => keyOf(d) === props.emphasis),
    {
      message: "emphasis names no reading: it must equal a datum's id or date",
      path: ["emphasis"],
    }
  );

/** The validated payload. */
export type HairlineLineData = z.infer<typeof hairlineLineSchema>;
/** What `<HairlineLine>` takes: the payload, with both formats also allowed as functions. */
export type HairlineLineProps = SharedCallbacks &
  Omit<z.input<typeof hairlineLineSchema>, "dateFormat" | "format" | "note"> & {
    dateFormat?: DateFormatInput;
    format?: FormatInput;
    /** @deprecated Use `unitNote`. */
    note?: string;
  };
