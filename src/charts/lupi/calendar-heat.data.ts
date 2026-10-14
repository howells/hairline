import { utcFormat } from "d3-time-format";

import { rnd } from "../../lib/random";

/** One calendar day (ISO date) and its count. */
export interface DayDatum {
  date: string;
  value: number;
}

const DAY = 86_400_000;
const iso = utcFormat("%Y-%m-%d");

const bump = (x: number, at: number, width: number, height: number) =>
  Math.exp(-((x - at) ** 2) / width) * height;

/**
 * A weekday's deploys, 6 to 20 on a normal day: a spring push, the long
 * build to the autumn release, and a quiet run into the holidays.
 */
const weekdayDeploys = (k: number) => {
  const yearFrac = k / 365;
  const season =
    bump(yearFrac, 0.3, 0.006, 5) +
    bump(yearFrac, 0.68, 0.01, 7) -
    bump(yearFrac, 0.98, 0.0015, 9);
  if (rnd(k + 50, 3) < 0.03) {
    return 0;
  }
  return Math.min(
    20,
    Math.max(
      0,
      Math.round(6 + season * (0.5 + rnd(k + 50, 4) * 0.7) + rnd(k + 50, 5) * 6)
    )
  );
};

/** Weekends are quiet: the odd hotfix. */
const weekendDeploys = (k: number) =>
  rnd(k + 50, 1) < 0.12 ? 1 + Math.floor(rnd(k + 50, 2) * 3) : 0;

/** The autumn release week, ending in the busiest single day of the year. */
const spike = new Map([
  ["2026-09-21", 19],
  ["2026-09-22", 21],
  ["2026-09-23", 23],
  ["2026-09-24", 17],
  ["2026-09-25", 14],
]);

/** Fieldnote's deploys, every day of 2026. */
export const calendarHeatDemo: DayDatum[] = Array.from(
  { length: 365 },
  (_, k) => {
    const t = Date.UTC(2026, 0, 1) + k * DAY;
    const date = iso(new Date(t));
    const dow = (new Date(t).getUTCDay() + 6) % 7;
    return {
      date,
      value:
        spike.get(date) ?? (dow >= 5 ? weekendDeploys(k) : weekdayDeploys(k)),
    };
  }
);
