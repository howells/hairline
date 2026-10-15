/**
 * O1 Summer of 1976: the daily maximum Central England temperature, June to
 * August 1976.
 * Source: Met Office Hadley Centre Central England Temperature (HadCET),
 * v2.1.1.0 + provisional, https://www.metoffice.gov.uk/hadobs/hadcet/data/download.html
 * Fetched 2026-10-15.
 * File: maxtemp_daily_totals.txt (date and value to 0.1 °C, -99.9 for a
 * missing day; none are missing in 1976). Transform: the 92 values from
 * 1976-06-01 to 1976-08-31, copied as they stand.
 */

/** One day's maximum temperature, in °C. */
export interface DayCount {
  date: Date;
  value: number;
}

const DAY_MS = 86_400_000;
const START = Date.UTC(1976, 5, 1);

/** Daily maximum CET in °C, 1 June to 31 August 1976. */
const MAX_1976: number[] = [
  15.9, 16.3, 16, 18.9, 19.8, 23.5, 24.6, 28.4, 26.9, 19, 19.8, 19.8, 22.7,
  21.6, 21.6, 15.4, 17.6, 20.1, 14.1, 18.1, 20.8, 24.1, 26.2, 25.8, 29, 29.3,
  29.8, 30.3, 30.1, 29.7, 30.4, 31.8, 33.1, 31.3, 31.3, 31.6, 30.4, 29.5, 23.5,
  23.4, 27.3, 26.3, 21.8, 21.9, 23.1, 21.7, 22.7, 24.4, 21.6, 18.4, 19.6, 20.5,
  19.7, 20, 21.3, 21.1, 23.4, 20.5, 22.8, 19.3, 17.2, 19, 19.3, 20.2, 20, 20.7,
  21.4, 21.8, 22.9, 23.2, 24.3, 25.2, 25.7, 25.2, 24, 25.3, 25.9, 26.4, 24,
  25.2, 27.2, 24.9, 26.6, 27.2, 28.9, 28.8, 26.7, 20.6, 19.4, 21.4, 17.7, 19,
];

/** Daily maximum Central England temperature, June to August 1976. */
export const dailyUsers: DayCount[] = MAX_1976.map((value, i) => ({
  date: new Date(START + i * DAY_MS),
  value,
}));
