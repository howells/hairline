import { dayAfter } from "./util-a";

/** One reading per day. */
export interface DailyDatum {
  date: Date;
  value: number;
}

// Weekends dip; the Assistant launch on Wednesday 16 September is the peak.
const signups = [
  2140, 2210, 2180, 1990, 1520, 1610, 2260, 2350, 2410, 2330, 2120, 1640, 1720,
  2480, 2870, 3460, 3010, 2560, 1890, 1830, 2540, 2490, 2450, 2390, 2210, 1700,
  1760, 2520, 2580, 2640,
];

/** Fieldnote's daily sign-ups, September 2026. */
export const hairlineLineDemo: DailyDatum[] = signups.map((value, i) => ({
  date: dayAfter("2026-09-01", i),
  value,
}));
