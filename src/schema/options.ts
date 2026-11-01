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
    .optional()
    .describe(
      "Leads every SVG id, to separate charts rendered in separate React roots on one page."
    ),
  /** Glyph widths of a face other than Inter, so notes wrap and reserve room for it. */
  metrics: fontMetricsSchema
    .optional()
    .describe(
      "Glyph widths of a face other than Inter, so notes wrap and reserve room for it."
    ),
  /** Show the data table to sighted readers too. It is always there for screen readers. */
  table: z
    .boolean()
    .optional()
    .describe(
      "Show the data table to sighted readers too. It is always there for screen readers."
    ),
  /** The chart's accessible name. Each chart has a default that reads the data. */
  title: z
    .string()
    .min(1)
    .optional()
    .describe(
      "The chart's accessible name. Each chart has a default that reads the data."
    ),
};

/**
 * The in-plot note, as one shape: spread `noteShape` into the chart's
 * strictObject and add `NoteProps` to its props type. `note` is the old name
 * for `unitNote`, kept so existing callers still work.
 */
export const noteShape = {
  /** The old name for `unitNote`; JSON Schema marks it deprecated. */
  note: z.string().optional().meta({
    deprecated: true,
    description: "Deprecated: use `unitNote`.",
  }),
  /** The in-plot key under the axis. */
  unitNote: z.string().optional().describe("The in-plot key under the axis."),
};

/** The two names an in-plot note goes by, for code that reads them (a deprecation would flag the read). */
export interface NoteNames {
  note?: string;
  unitNote?: string;
}

/** A chart's props for the in-plot note: `unitNote`, and the `note` it replaces. */
export interface NoteProps extends Omit<NoteNames, "note"> {
  /** @deprecated Use `unitNote`. */
  note?: string;
}

/** What a chart's props add to its payload: functions cannot be JSON. */
export type SharedCallbacks = MotionCallbacks;
