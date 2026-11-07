// React-free. The reference marks every typed chart shares: target lines and
// bands on a value axis. Spread `referencesShape` into a chart's strictObject;
// the chart draws them (src/charts/references.tsx) and lists them in its data
// table and description.
import { z } from "zod";

/** A target: one value on the axis, drawn as the chart's one dashed line. */
export const referenceLineSchema = z.strictObject({
  /** Which end of the line its label sits at. Defaults to the end. */
  at: z
    .enum(["end", "start"])
    .optional()
    .describe("Which end of the line its label sits at. Defaults to the end."),
  /** Mark the readings that clear the line in ink and let the rest step back. */
  emphasis: z
    .enum(["above", "below"])
    .optional()
    .describe(
      "Mark the readings that clear the line in ink and let the rest step back: those at or above it, or at or below it."
    ),
  /** The line's name, set on the line. */
  label: z
    .string()
    .min(1)
    .optional()
    .describe("The line's name, set on the line."),
  /** Where the line stands on the axis. */
  value: z.number().describe("Where the line stands on the axis."),
});

/** A range: two values on the axis, drawn as a quiet band behind the marks. */
export const referenceBandSchema = z
  .strictObject({
    /** Where the band starts on the axis. */
    from: z.number().describe("Where the band starts on the axis."),
    /** The band's name, set inside it. */
    label: z
      .string()
      .min(1)
      .optional()
      .describe("The band's name, set inside it."),
    /** Where the band ends on the axis. */
    to: z.number().describe("Where the band ends on the axis."),
  })
  .refine((band) => band.from < band.to, {
    message: "a band must run from its lower value to its higher",
    path: ["to"],
  });

export const referencesSchema = z
  .array(z.union([referenceLineSchema, referenceBandSchema]))
  .max(6)
  .describe(
    "Target lines ({ value, label?, at?, emphasis? }) and bands ({ from, to, label? }) on the value axis, up to 6."
  );

/** The prop a chart spreads into its schema. */
export const referencesShape = {
  /** Target lines and bands on the value axis. */
  references: referencesSchema
    .optional()
    .describe(
      "Target lines ({ value, label?, at?, emphasis? }) and bands ({ from, to, label? }) on the value axis, up to 6."
    ),
};

/** One target line. */
export type ReferenceLine = z.infer<typeof referenceLineSchema>;

/** One band. */
export type ReferenceBand = z.infer<typeof referenceBandSchema>;

/** A line or a band. */
export type Reference = ReferenceBand | ReferenceLine;

/** Whether a reference is a band. */
export const isBand = (ref: Reference): ref is ReferenceBand => "from" in ref;
