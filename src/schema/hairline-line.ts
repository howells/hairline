// React-free. HairlineLine (F2 Daily line): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema, valueAxisSchema } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";
import { keyOf } from "./key";
import { NOTES_NAME_DATA, dailyNotesSchema, notesNameData } from "./notes";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";

export const hairlineLineSchema = z
  .strictObject({
    ...noteShape,
    ...sharedShape,
    /** Readings by date, in any order. A null value is a gap. */
    data: z
      .array(dailyDatumSchema)
      .min(1)
      .max(731)
      .describe("Readings by date, in any order. A null value is a gap."),
    /** How dates print on the axis and in the tooltip. Defaults to day-month. */
    dateFormat: dateFormatSchema
      .optional()
      .describe(
        "How dates print on the axis and in the tooltip. Defaults to day-month."
      ),
    /**
     * The value scale's ends, lowest then highest. Give small multiples the
     * same one and they share a scale. Without it the scale fits the data.
     */
    domain: z
      .tuple([z.number(), z.number()])
      .refine(([lo, hi]) => lo < hi, "domain must run from lower to higher")
      .optional()
      .describe(
        "The value scale's ends, lowest then highest. Give small multiples the same one and they share a scale. Without it the scale fits the data."
      ),
    /** The reading to draw in the hero colour, by key. Defaults to `extreme`. */
    emphasis: z
      .string()
      .nullable()
      .optional()
      .describe(
        "The reading to draw in the hero colour, by key; null for none. Defaults to `extreme`."
      ),
    /** Which extreme the hero marks when `emphasis` is not given. */
    extreme: z
      .enum(["peak", "trough"])
      .optional()
      .describe("Which extreme the hero marks when `emphasis` is not given."),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How values print: a preset name or Intl number-format options."
      ),
    /** Fixed height in px. Without it a line chart is 440 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it a line chart is 440 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** Notes tied to readings: beside their points, or numbered on a narrow chart. */
    notes: dailyNotesSchema.optional(),
    /** Where the value axis prints its numbers. Defaults to the right. */
    valueAxis: valueAxisSchema.optional(),
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
      props.emphasis === null ||
      props.data.some((d) => keyOf(d) === props.emphasis),
    {
      message: "emphasis names no reading: it must equal a datum's id or date",
      path: ["emphasis"],
    }
  )
  .refine(notesNameData, NOTES_NAME_DATA);

/** The validated payload. */
export type HairlineLineData = z.infer<typeof hairlineLineSchema>;
/** What `<HairlineLine>` takes: the payload, with both formats also allowed as functions. */
export type HairlineLineProps = SharedCallbacks &
  Omit<z.input<typeof hairlineLineSchema>, "dateFormat" | "format" | "note"> & {
    dateFormat?: DateFormatInput;
    format?: FormatInput;
  } & NoteProps;
