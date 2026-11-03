import { createContext } from "react";

import type { ScaleOptions } from "../schema/scale";

/** The slide-scale options of the nearest Plot, read by ChartSvg. */
export const ScaleContext = createContext<ScaleOptions>({});

/**
 * How much larger than its drawing the svg is shown: `scale`, unless `fit`
 * (which draws at the container's width, so nothing is magnified).
 */
export const magnification = ({ fit, scale }: ScaleOptions) =>
  fit === true ? 1 : (scale ?? 1);
