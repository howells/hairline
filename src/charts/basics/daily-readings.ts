import type { DailyDatum } from "../../schema/daily";
import { keyOf } from "../../schema/key";

/**
 * One reading as the daily charts draw it: the date parsed, the key it is
 * addressed by, and a value that is null for a gap (null, NaN or infinite).
 */
export interface Reading {
  date: Date;
  key: string;
  value: number | null;
}

/**
 * The payload as readings in date order (the sort is stable, so readings on
 * one day keep their order). A date that does not parse is dropped; a value
 * that is not a finite number becomes a gap.
 */
export const readingsOf = (data: DailyDatum[]): Reading[] =>
  data
    .flatMap((d) => {
      const date = new Date(d.date);
      return Number.isNaN(date.getTime())
        ? []
        : [
            {
              date,
              key: keyOf(d),
              value:
                d.value !== null && Number.isFinite(d.value) ? d.value : null,
            },
          ];
    })
    .toSorted((a, b) => a.date.getTime() - b.date.getTime());

/** Every reading as table rows: its date and value, a gap saying so. */
export const readingRows = (
  readings: Reading[],
  fmtDate: (d: Date) => string,
  format: (v: number) => string
) =>
  readings.map((r) => [
    fmtDate(r.date),
    r.value === null ? "No reading" : format(r.value),
  ]);

/** The indexes of the readings that have a value. */
export const liveOf = (readings: Reading[]) =>
  readings.flatMap((r, i) => (r.value === null ? [] : [i]));

/** The readings, with the indexes of those that have a value: they travel together. */
export interface Series {
  live: number[];
  readings: Reading[];
}

/** The readings as a `Series`. */
export const seriesOf = (readings: Reading[]): Series => ({
  live: liveOf(readings),
  readings,
});

/** React keys: each reading's key, numbered by position so repeats stay unique. */
export const reactKeyOf = (reading: Reading, index: number) =>
  `${reading.key}#${index}`;

/** The value at `index`, which the caller knows is live. */
export const valueAt = (readings: Reading[], index: number) =>
  readings[index].value ?? 0;

/**
 * The reading to draw in ink: the live one whose key is `emphasis`, else
 * `fallback`. A key that names a gap or no reading emphasises none (-1).
 */
export const heroOf = (
  readings: Reading[],
  live: number[],
  emphasis: string | null | undefined,
  fallback: number
) => {
  if (emphasis === undefined) {
    return fallback;
  }
  return emphasis === null
    ? -1
    : (live.find((i) => readings[i].key === emphasis) ?? -1);
};

/**
 * The readings to draw in ink: the live ones whose keys are in `hero`, else
 * the live reading `fallback`. A key that names a gap or no reading draws none.
 */
export const heroesOf = (
  readings: Reading[],
  live: number[],
  hero: readonly string[] | undefined,
  fallback: number
): ReadonlySet<number> => {
  if (hero === undefined) {
    return new Set([fallback]);
  }
  const wanted = new Set(hero);
  return new Set(live.filter((i) => wanted.has(readings[i].key)));
};

/** A reading that has a value: the line and area break where it is false. */
export const isLive = (reading: Reading) => reading.value !== null;
