import { rnd } from "../../lib/random";

export interface RainfallDatum {
  /** First day of the period. */
  date: Date;
  /** Hangs from the top (e.g. spend). */
  input: number;
  /** Rises from the floor (e.g. sign-ups). */
  output: number;
}

/** Months with the campaigns paused: August and December 2025, August 2026. */
const DARK_MONTHS = new Set([7, 11, 19]);

const spendIn = (i: number) =>
  DARK_MONTHS.has(i) ? 0 : Math.round(48 + i * 3.5 + rnd(i, 7) * 64);

/**
 * Fieldnote, January 2025 to December 2026: podcast and newsletter spend a
 * month ($K, hanging) against sign-ups a month (thousands, rising), which
 * lean on the previous month's spend.
 */
export const rainfallDemo: RainfallDatum[] = Array.from(
  { length: 24 },
  (_, i) => {
    const echo = i === 0 ? 0 : spendIn(i - 1) * 0.07;
    return {
      date: new Date(Date.UTC(2025, i, 1)),
      input: spendIn(i),
      output: Math.round(38 + i * 2.1 + echo + rnd(i, 13) * 4),
    };
  }
);
