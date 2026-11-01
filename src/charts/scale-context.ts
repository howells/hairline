import { createContext } from "react";

import type { ScaleOptions } from "../schema/scale";

/** The slide-scale options of the nearest Plot, read by ChartSvg. */
export const ScaleContext = createContext<ScaleOptions>({});
