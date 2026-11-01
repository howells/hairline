// React-free. The motion fields every chart's schema shares: spread
// `motionShape` into the chart's strictObject, and add `onReady` to its props
// type (a function cannot be part of a JSON payload).
import { z } from "zod";

export const motionShape = {
  /**
   * When the entry draws in. "scroll" (default): when the chart scrolls into
   * view. "mount": at once, without scrolling. "off": never; the chart is
   * drawn, and ready, in the first HTML.
   */
  animate: z.enum(["scroll", "mount", "off"]).optional(),
  /** Change it to replay the entry without remounting the chart. */
  replayKey: z.union([z.string(), z.number()]).optional(),
};

/** What a chart's props add to its payload for motion. */
export interface MotionCallbacks {
  /** Called when the chart has settled: the same moment `data-hl-ready` turns "true". */
  onReady?: () => void;
}
