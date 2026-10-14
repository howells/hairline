import { rnd } from "../../lib/random";

export interface DrawInDatum {
  date: Date;
  /** Running total up to and including this date. */
  value: number;
}

const START = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;
const DAYS = 365;
/** New ARR booked across 2026, $. */
const TOTAL = 8_920_000;

/** August is quiet; the year-end push lifts December. */
const monthPace = [0.9, 0.95, 1.1, 1, 1, 1.05, 0.85, 0.6, 1.05, 1.1, 1.15, 1.3];

const dailyBookings = Array.from({ length: DAYS }, (_, i) => {
  const date = new Date(START + i * DAY);
  const dow = date.getUTCDay();
  const weekend = dow === 0 || dow === 6 ? 0.3 : 1;
  const growth = 1 + (i / DAYS) * 0.5;
  return (
    weekend * growth * monthPace[date.getUTCMonth()] * (0.7 + rnd(i, 29) * 0.6)
  );
});
const bookingsTotal = dailyBookings.reduce((s, v) => s + v, 0);

/** Fieldnote's new ARR booked through 2026, one running total a day, ending at $8.92M. */
export const drawInDemo: DrawInDatum[] = dailyBookings.map((_, i) => ({
  date: new Date(START + i * DAY),
  value:
    (dailyBookings.slice(0, i + 1).reduce((s, v) => s + v, 0) / bookingsTotal) *
    TOTAL,
}));
