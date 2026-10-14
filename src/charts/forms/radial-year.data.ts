import { activeDaysDemo } from "./brushed-overview.data";

/** One month's new sign-ups, in thousands. */
export interface MonthValue {
  /** The month's first day. */
  date: Date;
  value: number;
}

/**
 * Fieldnote new sign-ups by month, 2026 (thousands): the daily sign-ups of
 * O8 summed by month, so the two charts tell the same year.
 */
export const signupMonthsDemo: MonthValue[] = Array.from(
  { length: 12 },
  (_, m) => {
    let total = 0;
    for (const d of activeDaysDemo) {
      if (d.date.getUTCMonth() === m) {
        total += d.value;
      }
    }
    return {
      date: new Date(Date.UTC(2026, m, 1)),
      value: Math.round(total / 100) / 10,
    };
  }
);
