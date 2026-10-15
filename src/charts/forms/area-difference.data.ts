/**
 * O5 Against normal: weekly Central England temperature in 2022 against the
 * 1991 to 2020 normal.
 * Source: Met Office Hadley Centre Central England Temperature (HadCET),
 * v2.1.1.0 + provisional, https://www.metoffice.gov.uk/hadobs/hadcet/data/download.html
 * Fetched 2026-10-15.
 * File: meantemp_daily_totals.txt (daily mean CET, date and value to 0.1 °C,
 * -99.9 for a missing day; none are missing in the years used).
 * Transform: 52 consecutive blocks of 7 days from 1 January 2022 (the last
 * ends on 30 December; 31 December is left out). `actual` is the mean of the
 * block's seven 2022 daily values. `plan` is the normal: for each calendar
 * date in the block, the mean of that date's daily value over the 30 years
 * 1991 to 2020, then the mean of those seven dates. Both are rounded to
 * 0.1 °C once, at the end.
 */

/** One week of Central England mean temperature against its normal, in °C. */
export interface PlanWeek {
  /** The week's mean temperature in 2022. */
  actual: number;
  /** The 1991 to 2020 normal for the same seven dates. */
  plan: number;
  /** The week's first day. */
  week: Date;
}

const FIRST_DAY = Date.UTC(2022, 0, 1);
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** [2022 mean, 1991 to 2020 normal] in °C, one pair a week. */
const WEEKS: [number, number][] = [
  [6, 4.6],
  [4.5, 5.3],
  [2.8, 4.8],
  [4.9, 4.3],
  [7.1, 4.5],
  [6.4, 4.6],
  [7.4, 5],
  [6.6, 5.4],
  [6.5, 5.2],
  [7.1, 6.5],
  [8.5, 7.2],
  [9.5, 7.1],
  [7.4, 7.7],
  [7.3, 8.2],
  [9.9, 8.5],
  [11.4, 9.3],
  [9.3, 10.3],
  [11.4, 10.6],
  [13.2, 11.4],
  [14.9, 11.7],
  [13.3, 13],
  [11.7, 13.6],
  [14.2, 13.9],
  [16.1, 14.4],
  [15.5, 15.1],
  [14.8, 16],
  [15.8, 16.3],
  [18.5, 16.4],
  [20.9, 17],
  [17.7, 17.4],
  [18.7, 17.4],
  [19.2, 17.2],
  [20.2, 16.6],
  [17.9, 16.4],
  [17.3, 15.3],
  [17.6, 15.1],
  [15, 14.3],
  [13.2, 13.8],
  [10.9, 13.2],
  [13.6, 12],
  [10.7, 11.7],
  [12.4, 10.2],
  [14.4, 10],
  [11.7, 9.3],
  [11, 8.2],
  [10.2, 7.4],
  [7.3, 6.2],
  [6.2, 6.1],
  [2.4, 5.5],
  [-2.2, 4.9],
  [5.8, 4.8],
  [6.9, 4.3],
];

/** Central England weekly mean temperature against the 1991 to 2020 normal, 2022. */
export const planWeeksDemo: PlanWeek[] = WEEKS.map(([actual, plan], i) => ({
  actual,
  plan,
  week: new Date(FIRST_DAY + i * WEEK_MS),
}));
