// React-free. The motion fields every chart's schema shares: spread
// `motionShape` into the chart's strictObject, and add `onReady` to its props
// type (a function cannot be part of a JSON payload).
import { z } from "zod";

export const motionShape = {
  /**
   * When the entry draws in. "scroll": when the chart scrolls into view.
   * "mount": at once, without scrolling. "off": never; the chart is drawn, and
   * ready, in the first HTML. The default is "off" for a fixed-size chart
   * (`width` and `height` given) and "scroll" for a responsive one. Under
   * reduced motion the chart is drawn in the first paint whatever this says.
   */
  animate: z
    .enum(["scroll", "mount", "off"])
    .optional()
    .describe(
      'When the entry draws in: "scroll" as the chart scrolls into view, "mount" at once, "off" never (drawn, and ready, in the first HTML). The default is "off" for a fixed-size chart and "scroll" for a responsive one. Under reduced motion the chart is drawn in the first paint.'
    ),
  /** Change it to replay the entry without remounting the chart. */
  replayKey: z
    .union([z.string(), z.number()])
    .optional()
    .describe("Change it to replay the entry without remounting the chart."),
};

/** What a chart's props add to its payload for motion. */
export interface MotionCallbacks {
  /** Called when the chart has settled: the same moment `data-hl-ready` turns "true". */
  onReady?: () => void;
}
