/*
 * The motion tokens from tokens.css, for the charts animated from script
 * (bar race, scatter morph, draw-in). Keep the two in step. Playback pace
 * (race speed, morph hold, draw-in length) belongs to each chart, not here.
 */

/** --ease-travel, cubic-bezier(0.77, 0, 0.175, 1): ease-in-out-quart. */
export const easeTravel = (t: number) =>
  t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;

/** The --duration-* tokens, in ms. */
export const DURATION = {
  change: 400,
  enter: 600,
  grow: 800,
  hover: 150,
  long: 1200,
} as const;

/** The --stagger-* tiers: dense (hundreds), fine (dozens), mark (a handful), series (a few). */
export type StaggerTier = "dense" | "fine" | "mark" | "series";
