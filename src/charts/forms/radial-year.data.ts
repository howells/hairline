import { activeDaysDemo } from "./brushed-overview.data";

/**
 * O7 A year by month: the mean of O8's daily maxima for each month of 2022.
 * Source: Met Office Hadley Centre Central England Temperature (HadCET),
 * v2.1.1.0 + provisional, https://www.metoffice.gov.uk/hadobs/hadcet/data/download.html
 * Fetched 2026-10-15.
 * File: maxtemp_daily_totals.txt, as reduced in brushed-overview.data.ts.
 * Transform: each month's mean of its daily maximum values (31 days, or 30,
 * or 28), rounded to 0.1 °C.
 */

/** One month's mean daily maximum temperature, in °C. */
export interface MonthValue {
  /** The month's first day. */
  date: Date;
  value: number;
}

/** Central England mean daily maximum by month, 2022 (°C). */
export const signupMonthsDemo: MonthValue[] = Array.from(
  { length: 12 },
  (_, m) => {
    let total = 0;
    let days = 0;
    for (const d of activeDaysDemo) {
      if (d.date.getUTCMonth() === m) {
        total += d.value;
        days += 1;
      }
    }
    return {
      date: new Date(Date.UTC(2022, m, 1)),
      value: Math.round((total / days) * 10) / 10,
    };
  }
);
