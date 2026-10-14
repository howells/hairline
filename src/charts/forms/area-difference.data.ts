import { mulberry32 } from "../../lib/random";

/** One week of new ARR booked against the plan, in $k. */
export interface PlanWeek {
  actual: number;
  plan: number;
  week: Date;
}

const WEEKS = 52;
const FIRST_MONDAY = Date.UTC(2026, 0, 5);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const build = (): PlanWeek[] => {
  const uniform = mulberry32(2026);
  // Slow drifts ahead of and behind plan, then a little weekly noise.
  const phase = uniform() * Math.PI * 2;
  return Array.from({ length: WEEKS }, (_, i) => {
    const t = i / (WEEKS - 1);
    // About $7.4m of new ARR over the year, $18.4m by December.
    const plan = 112 + 58 * t + 5 * Math.sin(t * Math.PI * 2);
    const drift =
      9 * Math.sin(t * Math.PI * 3.4 + phase) +
      4.5 * Math.sin(t * Math.PI * 9.1 + phase * 2) +
      4 * t;
    const noise = (uniform() - 0.5) * 4;
    return {
      actual: Math.round(plan + drift + noise),
      plan: Math.round(plan),
      week: new Date(FIRST_MONDAY + i * WEEK_MS),
    };
  });
};

/** Fieldnote new ARR booked a week against plan, 2026. */
export const planWeeksDemo: PlanWeek[] = build();
