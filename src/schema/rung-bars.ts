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
  /** Names the bar, and is its key unless `id` is given. */
  id: z.string().min(1).optional(),
  label: z.string(),
  value: z.number(),
});

export const rungBarsSchema = z
  .strictObject({
    ...noteShape,
    ...sharedShape,
    data: z.array(rungDatumSchema).min(1).max(24),
    /** The bar to draw in the hero colour, by key. Defaults to the largest. */
    emphasis: z.string().optional(),
    /** How values print: a preset name or Intl number-format options. */
    format: formatSchema.optional(),
    /** Fixed height in px. Without it a bar chart is 460 tall. */
    height: z.number().int().positive().optional(),
    /** Responsive mode only: the width of the first render, before measuring. */
    initialWidth: z.number().int().positive().optional(),
    /** Units per rung. */
    unit: z.number().positive().optional(),
    /** Fixed width in px. Giving it turns measuring off. */
    width: z.number().int().positive().optional(),
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
