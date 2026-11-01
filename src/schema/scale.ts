// React-free. The slide-scale options every chart's schema spreads in.
import { z } from "zod";

export const scaleShape = {
  /**
   * Fit the container instead: the svg fills its width at the chart's aspect
   * ratio. Wins over `scale`.
   */
  fit: z.boolean().optional(),
  /**
   * Slides: draw at the logical `width`, then show the whole composition
   * `scale` times larger through the viewBox, so type, spacing and marks grow
   * together (11 px labels at `scale` 2.5 read 27.5 px). Textures scale too.
   */
  scale: z.number().positive().optional(),
  /**
   * "proportional" (default) lets strokes scale with the composition;
   * "device" keeps every stroke at one device pixel however large it is shown.
   */
  strokes: z.enum(["proportional", "device"]).optional(),
};

/** How a scaled chart is shown. */
export interface ScaleOptions {
  fit?: boolean;
  scale?: number;
  strokes?: "device" | "proportional";
}
