import { rnd } from "../../lib/random";

/** A live feed: the reading for step n (n ≥ 0). Must be deterministic. */
export type StreamFeed = (step: number) => number;

/** Fieldnote users online right now (thousands): a slow swell plus a little noise. Pure in `step`. */
export const dynamicStreamDemo: StreamFeed = (step) =>
  21 +
  2.8 * Math.sin(step / 19) +
  1.4 * Math.sin(step / 6.7 + 1) +
  (rnd(step, 5) - 0.5) * 1.3;
