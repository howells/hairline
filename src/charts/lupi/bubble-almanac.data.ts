import { rnd } from "../../lib/random";

export interface AlmanacCell {
  category: string;
  year: number;
  value: number;
  /** Escalations: drawn as the dark core. */
  escalations: number;
  /** Still in beta that year: drawn as a dotted ring. */
  beta?: boolean;
}

export interface AlmanacNote {
  category: string;
  year: number;
  text: string;
  /** Offset of the note text from the bubble centre, in px. */
  dx: number;
  dy: number;
}

export interface AlmanacEvent {
  label: string;
  text: string;
}

/**
 * Fieldnote support tickets per feature per year, 2018 to 2026.
 * [category, first year, years in beta, size at maturity]
 */
const areas: [string, number, number, number][] = [
  ["Notes", 2018, 0, 2300],
  ["Search", 2018, 0, 2700],
  ["Clips", 2019, 0, 1900],
  ["Canvas", 2020, 1, 2100],
  ["Tags", 2019, 0, 1200],
  ["Sync", 2018, 0, 2900],
  ["Share", 2020, 0, 1500],
  ["Comments", 2021, 1, 1300],
  ["Templates", 2022, 0, 900],
  ["Calendar", 2023, 2, 1100],
  ["Export", 2022, 0, 1000],
  ["Assistant", 2024, 2, 2600],
];

const pinned = new Map([
  ["Sync-2024", 2140],
  ["Search-2025", 2460],
  ["Assistant-2026", 3380],
]);

const FIRST = 2018;
const years = Array.from({ length: 9 }, (_, k) => FIRST + k);

export const bubbleAlmanacDemo: AlmanacCell[] = areas.flatMap(
  ([category, first, betaYears, mature], c) =>
    years.flatMap((year) => {
      if (year < first) {
        return [];
      }
      const age = year - first;
      const beta = age < betaYears;
      const grown =
        // Volume follows the calendar (adoption), damped in a feature's first year.
        mature *
        (0.06 + 0.94 * ((year - FIRST) / 8) ** 2.2) *
        Math.min(1, (age + 1) / 2) *
        (0.75 + 0.45 * rnd(c + 13, year));
      const value =
        pinned.get(`${category}-${year}`) ??
        Math.round(beta ? 60 + 120 * rnd(year, c + 13) : grown);
      const escalations = beta
        ? 0
        : Math.round(value * (0.02 + 0.06 * rnd(c + 19, year)));
      return [{ beta, category, escalations, value, year }];
    })
);

export const bubbleAlmanacLabelled = ["Sync-2024", "Search-2025"];
