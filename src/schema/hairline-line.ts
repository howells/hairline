// React-free. HairlineLine (F2 Daily line): follows the pattern set in
// ./rung-bars; the shared daily series is in ./daily.
import { z } from "zod";

import { dailyDatumSchema, valueAxisSchema } from "./daily";
import { dateFormatSchema, formatSchema } from "./format";
import type { DateFormatInput, FormatInput } from "./format";
import { intervalIssues, intervalsShape } from "./intervals";
import { heroShape } from "./hero";
import { keyOf } from "./key";
import { NOTES_NAME_DATA, dailyNotesSchema, notesNameData } from "./notes";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";
import { referencesShape } from "./references";

export const hairlineLineSchema = z
  .strictObject({
    ...heroShape,
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
    /** Which extreme the hero marks when `hero` is not given. */
    extreme: z
      .enum(["peak", "trough"])
      .optional()
      .describe("Which extreme the hero marks when `hero` is not given."),
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
  .superRefine((props, ctx) => {
    const keys = new Set(props.data.map(keyOf));
    for (const [i, key] of (props.hero ?? []).entries()) {
      if (!keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "hero names no reading: it must equal a datum's id or date",
          path: ["hero", i],
        });
      }
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
export type HairlineLineData = z.infer<typeof hairlineLineSchema>;
/** What `<HairlineLine>` takes: the payload, with both formats also allowed as functions. */
export type HairlineLineProps = SharedCallbacks &
  Omit<z.input<typeof hairlineLineSchema>, "dateFormat" | "format" | "note"> & {
    dateFormat?: DateFormatInput;
    format?: FormatInput;
  } & NoteProps;
