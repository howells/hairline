// React-free. The options every chart shares, as one shape: spread
// `sharedShape` into the chart's strictObject, and add `SharedCallbacks` to
// its props type. A chart that spreads it accepts, and honours, the same
// slide-scale, label-measuring, id, accessibility and motion options as every
// other, so a deck can swap one for another.
import { z } from "zod";

import { fontMetricsSchema } from "./metrics";
import { motionShape } from "./motion";
import type { MotionCallbacks } from "./motion";
import { scaleShape } from "./scale";

export const sharedShape = {
  ...motionShape,
  ...scaleShape,
  /** Leads every SVG id, to separate charts rendered in separate React roots on one page. */
  idPrefix: z
    .string()
    .regex(/^[A-Za-z][\w-]*$/u)
    .optional(),
  /** Glyph widths of a face other than Inter, so notes wrap and reserve room for it. */
  metrics: fontMetricsSchema.optional(),
  /** Show the data table to sighted readers too. It is always there for screen readers. */
  table: z.boolean().optional(),
  /** The chart's accessible name. Each chart has a default that reads the data. */
  title: z.string().min(1).optional(),
};

/** What a chart's props add to its payload: functions cannot be JSON. */
export type SharedCallbacks = MotionCallbacks;
