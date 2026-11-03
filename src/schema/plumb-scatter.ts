// React-free. PlumbScatter (F8 Stem scatter) follows the contract RungBars set
// (see ./rung-bars): one zod schema is the source of truth, types are
// inferred from it, formatters are descriptors, and points are addressed by
// key (`id`, else `label`), never by index. The registry lists it as a
// correlation chart.
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";
import { heroLabelShape, heroShape } from "./hero";
import { keyOf } from "./key";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";
import { referencesSchema, referencesShape } from "./references";

/** One point: a name, where it sits, and an optional key for when names repeat. */
export const plumbDatumSchema = z.strictObject({
  /** A unique key, for when two points share a label. */
  id: z
    .string()
    .min(1)
    .optional()
    .describe("A unique key, for when two points share a label."),
  /** Names the point, and is its key unless `id` is given. */
  label: z
    .string()
    .describe("Names the point, and is its key unless `id` is given."),
  /** Position along the x axis. */
  x: z.number().describe("Position along the x axis."),
  /** Position up the y axis. */
  y: z.number().describe("Position up the y axis."),
});

const domainSchema = z.tuple([z.number(), z.number()]);

export const plumbScatterSchema = z
  .strictObject({
    ...heroLabelShape,
    ...heroShape,
    ...noteShape,
    ...referencesShape,
    ...sharedShape,
    /** The points, 1 to 20. */
    data: z
      .array(plumbDatumSchema)
      .min(1)
      .max(20)
      .describe("The points, 1 to 20."),
    /** How y prints: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe("How y prints: a preset name or Intl number-format options."),
    /** How x prints. Defaults to a rounded integer. */
    formatX: formatSchema
      .optional()
      .describe("How x prints. Defaults to a rounded integer."),
    /** Fixed height in px. Without it a scatter is 440 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it a scatter is 440 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** Points to name beside their dot, by key. Defaults to the highest and lowest. */
    labelled: z
      .array(z.string())
      .optional()
      .describe(
        "Points to name beside their dot, by key. Defaults to the highest and lowest."
      ),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed width in px. Giving it turns measuring off."),
    /** The x axis range, [low, high]. */
    xDomain: domainSchema.optional().describe("The x axis range, [low, high]."),
    /** Names for the low and high ends of the x axis. */
    xLabels: z
      .tuple([z.string(), z.string()])
      .optional()
      .describe("Names for the low and high ends of the x axis."),
    /** Target lines and bands on the x axis. */
    xReferences: referencesSchema
      .optional()
      .describe(
        "Target lines ({ value, label?, at?, emphasis? }) and bands ({ from, to, label? }) on the x axis, up to 6."
      ),
    /** The y axis range, [low, high]. */
    yDomain: domainSchema.optional().describe("The y axis range, [low, high]."),
    /** Name for the y direction, drawn up the left side. */
    yLabel: z
      .string()
      .optional()
      .describe("Name for the y direction, drawn up the left side."),
  })
  .superRefine((props, ctx) => {
    const keys = new Set(props.data.map(keyOf));
    for (const [i, key] of (props.hero ?? []).entries()) {
      if (!keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message: "hero names no point: it must equal a datum's id or label",
          path: ["hero", i],
        });
      }
    }
    for (const [i, key] of (props.labelled ?? []).entries()) {
      if (!keys.has(key)) {
        ctx.addIssue({
          code: "custom",
          message:
            "labelled names no point: it must equal a datum's id or label",
          path: ["labelled", i],
        });
      }
    }
    for (const name of ["xDomain", "yDomain"] as const) {
      const domain = props[name];
      if (domain !== undefined && !(domain[0] < domain[1])) {
        ctx.addIssue({
          code: "custom",
          message: `${name} must run from low to high`,
          path: [name],
        });
      }
    }
  });

/** One point. */
export type PlumbDatum = z.infer<typeof plumbDatumSchema>;
/** The validated payload. */
export type PlumbScatterData = z.infer<typeof plumbScatterSchema>;
/** What `<PlumbScatter>` takes: the payload, with formats also allowed as functions. */
export type PlumbScatterProps = SharedCallbacks &
  Omit<z.input<typeof plumbScatterSchema>, "format" | "formatX" | "note"> & {
    format?: FormatInput;
    formatX?: FormatInput;
  } & NoteProps;
