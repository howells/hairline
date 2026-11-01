// React-free. The slide-scale options every chart's schema spreads in.
import { z } from "zod";

export const scaleShape = {
  /**
   * Fit the container instead: the svg fills its width at the chart's aspect
   * ratio. Wins over `scale`.
   */
  fit: z
    .boolean()
    .optional()
    .describe(
      "Fill the container's width at the chart's aspect ratio. Wins over `scale`."
    ),
  /**
   * Slides: draw at the logical `width`, then show the whole composition
   * `scale` times larger through the viewBox, so type, spacing and marks grow
   * together (11 px labels at `scale` 2.5 read 27.5 px). Textures scale too.
   */
  scale: z
    .number()
    .positive()
    .optional()
    .describe(
      "Slides: draw at the logical width, then show the composition this many times larger, type and textures with it."
    ),
  /**
   * "device" keeps every stroke at one device pixel however large it is shown;
   * it is the default once the chart is scaled (`scale` or `fit`).
   * "proportional" lets strokes scale with the composition, and is what an
   * unscaled chart draws.
   * The policy acts on stroked geometry only: rules, grid lines, lines and
   * paths, rings and outlines. Filled marks (the bars of RungBars and the
   * stems of HairlineArea are rects, the textures are fills) scale with the
   * composition either way, so in RungBars "device" changes just its baseline
   * rule; in the other five charts it also holds their lines and rings
   * to one device pixel.
   */
  strokes: z
    .enum(["proportional", "device"])
    .optional()
    .describe(
      '"device" keeps every stroke at one device pixel, and is the default when the chart is scaled (`scale` or `fit`); "proportional" scales strokes with the composition. It acts on stroked geometry only (rules, lines, rings, outlines): filled marks, such as the bars of RungBars, scale either way.'
    ),
};

/** How a scaled chart is shown. */
export interface ScaleOptions {
  fit?: boolean;
  scale?: number;
  strokes?: "device" | "proportional";
}
