import { normals } from "../util";

/** One day's new sign-ups. */
export interface DayValue {
  date: Date;
  value: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 0, 1);
const DAYS = 365;
/** Fieldnote 4 shipped on Tuesday 8 September (day 250 of the year). */
const LAUNCH = 250;
/** Weekend days sign up at about three quarters of a weekday. */
const WEEKEND = 0.74;

const build = (): DayValue[] => {
  const noise = normals(73, DAYS, 0, 1);
  return noise.map((z, i) => {
    const date = new Date(START + i * DAY_MS);
    const t = i / (DAYS - 1);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    // Steady growth, a spring lift, a summer lull, then the launch.
    const trend = 900 + 520 * t;
    const spring = 110 * Math.exp(-(((t - 0.27) / 0.07) ** 2));
    const lull = -170 * Math.exp(-(((t - 0.62) / 0.05) ** 2));
    const launch = i >= LAUNCH ? 1700 * Math.exp(-(i - LAUNCH) / 9) : 0;
    const day = (trend + spring + lull) * (weekend ? WEEKEND : 1);
    return { date, value: Math.round(day + launch + z * 35) };
  });
};

/** Fieldnote new sign-ups a day, 2026. */
export const activeDaysDemo: DayValue[] = build();
