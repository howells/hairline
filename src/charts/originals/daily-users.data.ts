import { mulberry32 } from "../../lib/random";

/** One day's count. */
export interface DayCount {
  date: Date;
  value: number;
}

const DAY_MS = 86_400_000;
const START = Date.UTC(2026, 6, 1);
const DAYS = 91;
/** Fieldnote 4 shipped on Tuesday 8 September. */
const LAUNCH = 69;

const noise = mulberry32(2607);

/** Weekdays run a little over the week's mean, weekends well under it. */
const weekday = (day: number) => {
  if (day === 0 || day === 6) {
    return 0.79;
  }
  return day === 1 || day === 2 ? 1.08 : 1.05;
};

/** The launch lifts the following fortnight, fading as it goes. */
const launchLift = (i: number) =>
  i < LAUNCH ? 0 : 0.16 * Math.exp(-(i - LAUNCH) / 6);

/** Fieldnote daily active users, July to September 2026. */
export const dailyUsers: DayCount[] = Array.from({ length: DAYS }, (_, i) => {
  const date = new Date(START + i * DAY_MS);
  const trend = 37_800 + 7400 * (i / (DAYS - 1));
  const summer = 3400 * Math.exp(-(((i - 45) / 10) ** 2));
  const jitter = 1 + (noise() - 0.5) * 0.05;
  const value =
    (trend - summer) * weekday(date.getUTCDay()) * (1 + launchLift(i)) * jitter;
  return { date, value: Math.round(value / 10) * 10 };
});
