import { rnd } from "../../lib/random";

export interface PatchworkEvent {
  id: string;
  /** Start time as hours since midnight (0–24). */
  hour: number;
  /** Duration in minutes: sets the wedge's angular width. */
  minutes: number;
  /** Size, e.g. files touched: sets the wedge's reach. */
  size: number;
  /** Crosshatched in the hero colour when true, e.g. the deploy triggered an incident. */
  incident?: boolean;
}

/** The one deploy that triggered an incident: the chart's hero. */
const INCIDENT = 31;

/**
 * One working week of Fieldnote deploys (UTC). Europe ships through the
 * morning, Toronto and Austin through the afternoon, and one hotfix went out
 * near midnight.
 */
export const radialPatchworkDemo: PatchworkEvent[] = Array.from(
  { length: 64 },
  (_, k) => {
    const spread = (rnd(k + 40, 1) + rnd(k + 40, 2) + rnd(k + 40, 3)) / 3;
    const hour = k === 0 ? 23.2 : 7.2 + spread * 13.5;
    return {
      hour: Math.round(hour * 12) / 12,
      id: `deploy-${k + 1}`,
      incident: k === INCIDENT,
      minutes: 30 + Math.round(45 * rnd(k + 40, 4)),
      size: k === 0 ? 34 : Math.round(10 + 96 * rnd(k + 40, 5) ** 1.5),
    };
  }
);
