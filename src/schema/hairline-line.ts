// React-free. HairlineLine (F2 Daily line): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema, dayKeyOf } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";

export const hairlineLineSchema = z
  .strictObject({
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
    /** Footnote under the axis, e.g. "one dot = one day · hollow = weekend". */
    note: z.string().optional(),
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
export type HairlineLineData = z.infer<typeof hairlineLineSchema>;
/** What `<HairlineLine>` takes: the payload, with both formats also allowed as functions. */
export type HairlineLineProps = Omit<
  z.input<typeof hairlineLineSchema>,
  "dateFormat" | "format"
> & {
  dateFormat?: DateFormatInput;
  format?: FormatInput;
};
