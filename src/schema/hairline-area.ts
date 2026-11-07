// React-free. HairlineArea (F3 Daily area): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema, valueAxisSchema } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";
import { intervalIssues, intervalsShape } from "./intervals";
import { keyOf } from "./key";
import { NOTES_NAME_DATA, dailyNotesSchema, notesNameData } from "./notes";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";
import { referencesShape } from "./references";

export const hairlineAreaSchema = z
  .strictObject({
    ...noteShape,
    ...intervalsShape,
    ...referencesShape,
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
    /** The reading to draw in the hero colour, by key. Defaults to the peak. */
    emphasis: z
      .string()
      .nullable()
      .optional()
      .describe(
        "The reading to draw in the hero colour, by key; null for none. Defaults to the peak."
      ),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How values print: a preset name or Intl number-format options."
      ),
    /** Fixed height in px. Without it an area chart is 440 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it an area chart is 440 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** Widest the plot gets, in px. Defaults to 640. */
    maxWidth: z
      .number()
      .positive()
      .optional()
      .describe("Widest the plot gets, in px. Defaults to 640."),
    /** Notes tied to readings: beside their points, or numbered on a narrow chart. */
    notes: dailyNotesSchema.optional(),
    /** Value-axis ticks, ascending; the scale runs from 0 to the last. */
    ticks: z
      .array(z.number())
      .min(2)
      .max(12)
      .optional()
      .describe(
        "Value-axis ticks, ascending; the scale runs from 0 to the last."
      ),
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
  .superRefine((props, ctx) => {
    if (
      props.emphasis !== undefined &&
      props.emphasis !== null &&
      !props.data.some((d) => keyOf(d) === props.emphasis)
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "emphasis names no reading: it must equal a datum's id or date",
        path: ["emphasis"],
      });
    }

    for (const issue of intervalIssues(
      props.data.map((d) => d.date),
      props.intervals
    )) {
      ctx.addIssue({ code: "custom", ...issue });
    }
  })
  .refine(notesNameData, NOTES_NAME_DATA);

/** The validated payload. */
export type HairlineAreaData = z.infer<typeof hairlineAreaSchema>;

/** What `<HairlineArea>` takes: the payload, with both formats also allowed as functions. */
export type HairlineAreaProps = SharedCallbacks &
  Omit<z.input<typeof hairlineAreaSchema>, "dateFormat" | "format" | "note"> & {
    dateFormat?: DateFormatInput;
    format?: FormatInput;
  } & NoteProps;
