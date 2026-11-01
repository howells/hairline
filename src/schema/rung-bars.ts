// React-free. RungBars (F1 Counted bars): the pattern every chart's schema
// module follows.
//
//   1. One zod schema is the single source of truth for the chart's props.
//   2. The exported types are inferred from it, never written twice.
//   3. Dates are ISO strings, formatters are descriptors (see ./format), and
//      a datum is addressed by its key (`id`, else `label`), never by index.
//   4. Fixed size is `width` + `height`; responsive mode omits `width` and
//      may give `initialWidth` for the first render.
//   5. The registry (./registry) lists the schema with its job and guidance;
//      scripts/library-schema.ts emits its JSON Schema at build.
import { z } from "zod";

import { formatSchema } from "./format";
import type { FormatInput } from "./format";
import { keyOf } from "./key";
import { noteShape, sharedShape } from "./options";
import type { NoteProps, SharedCallbacks } from "./options";

/** The bars: a label, a value, and an optional key for when labels repeat. */
export const rungDatumSchema = z.strictObject({
  /** A unique key, for when two bars share a label. */
  id: z
    .string()
    .min(1)
    .optional()
    .describe("A unique key, for when two bars share a label."),
  /** Names the bar, and is its key unless `id` is given. */
  label: z
    .string()
    .describe("Names the bar, and is its key unless `id` is given."),
  /** The bar's value, counted off in rungs of `unit`. */
  value: z
    .number()
    .describe("The bar's value, counted off in rungs of `unit`."),
});

export const rungBarsSchema = z
  .strictObject({
    ...noteShape,
    ...sharedShape,
    /** The bars, 1 to 24. */
    data: z
      .array(rungDatumSchema)
      .min(1)
      .max(24)
      .describe("The bars, 1 to 24."),
    /** The bar to draw in the hero colour, by key. Defaults to the largest. */
    emphasis: z
      .string()
      .optional()
      .describe(
        "The bar to draw in the hero colour, by key. Defaults to the largest."
      ),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema
      .optional()
      .describe(
        "How values print: a preset name or Intl number-format options."
      ),
    /** Fixed height in px. Without it a bar chart is 460 tall. */
    height: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Fixed height in px. Without it a bar chart is 460 tall."),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z
      .number()
      .int()
      .positive()
      .optional()
      .describe(
        "Responsive mode only: the width of the first render, before measuring."
      ),
    /** Units per rung. */
    unit: z.number().positive().optional().describe("Units per rung."),
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
      props.data.some((d) => keyOf(d) === props.emphasis),
    {
      message: "emphasis names no bar: it must equal a datum's id or label",
      path: ["emphasis"],
    }
  );

/** One bar. */
export type RungDatum = z.infer<typeof rungDatumSchema>;
/** The validated payload. */
export type RungBarsData = z.infer<typeof rungBarsSchema>;
/** What `<RungBars>` takes: the payload, with `format` also allowed as a function. */
export type RungBarsProps = SharedCallbacks &
  Omit<z.input<typeof rungBarsSchema>, "format" | "note"> & {
    format?: FormatInput;
  } & NoteProps;
