import { rnd } from "../../lib/random";

/** A rolling line: the value for step n (n ≥ 0). Must be deterministic. */
export type StreamFeed = (step: number) => number;

/**
 * A slow swell with a quicker ripple and a little noise. Pure in `step`; not
 * measured data.
 */
export const dynamicStreamDemo: StreamFeed = (step) =>
  21 +
  2.8 * Math.sin(step / 19) +
  1.4 * Math.sin(step / 6.7 + 1) +
  (rnd(step, 5) - 0.5) * 1.3;
