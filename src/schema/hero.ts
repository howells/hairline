// React-free. The props every point and line chart shares for one hero group
// against the rest: spread `heroShape` into the chart's strictObject.
import { z } from "zod";

/** How the records that are not the hero are drawn. */
export const contextSchema = z.enum(["grey", "opacity"]);

export const heroShape = {
  /**
   * `grey` draws the context in a pale solid tone; `opacity` draws it in ink
   * at low opacity, so where context marks overlap they build darker and the
   * density reads.
   */
  context: contextSchema
    .optional()
    .describe(
      "How the records that are not the hero are drawn: `grey` is a pale solid tone, `opacity` is the ink at low opacity so dense overlaps build darker. Defaults to `grey`."
    ),
  /** The records to draw in the hero colour above the context, by key. */
  hero: z
    .array(z.string())
    .optional()
    .describe(
      "The records to draw in the hero colour, above the context, by key. Defaults to the chart's own pick; an empty list draws no hero."
    ),
};

/** The hero group's own name, drawn on the chart with a thin leader and a count. */
export const heroLabelShape = {
  /** Names the hero group on the chart, with a count under it. */
  heroLabel: z
    .string()
    .min(1)
    .optional()
    .describe(
      "Names the hero group on the chart, on a halo with a thin leader and a count under it."
    ),
};

/** Which tone the context takes. */
export type HeroContext = z.infer<typeof contextSchema>;
