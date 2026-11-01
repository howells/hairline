// React-free. HairlineArea (F3 Daily area): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema, dayKeyOf } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";

export const hairlineAreaSchema = z
  .strictObject({
    /** Readings by date, in any order. A null value is a gap. */
    data: z.array(dailyDatumSchema).min(1).max(731),
    /** How dates print on the axis and in the tooltip. Defaults to day-month. */
    dateFormat: dateFormatSchema.optional(),
    /** The reading to draw in the hero colour, by key. Defaults to the peak. */
    emphasis: z.string().optional(),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** Fixed height in px. Without it an area chart is 440 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    /** Widest the plot gets, in px. Defaults to 640. */
    maxWidth: z.number().positive().optional(),
    // The old name for `unitNote`; JSON Schema marks it deprecated.
    note: z.string().optional().meta({ deprecated: true }),
    /** Value-axis ticks, ascending; the scale runs from 0 to the last. */
    ticks: z.array(z.number()).min(2).max(12).optional(),
    /** The in-plot key under the axis. */
    unitNote: z.string().optional(),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
  })
  .refine(
    (props) =>
      props.emphasis === undefined ||
      props.data.some((d) => dayKeyOf(d) === props.emphasis),
    {
      message: "emphasis names no reading: it must equal a datum's id or date",
      path: ["emphasis"],
    }
  );

/** The validated payload. */
export type HairlineAreaData = z.infer<typeof hairlineAreaSchema>;
/** What `<HairlineArea>` takes: the payload, with both formats also allowed as functions. */
export type HairlineAreaProps = Omit<
  z.input<typeof hairlineAreaSchema>,
  "dateFormat" | "format" | "note"
> & {
  dateFormat?: DateFormatInput;
  format?: FormatInput;
  /** @deprecated Use `unitNote`. */
  note?: string;
};
