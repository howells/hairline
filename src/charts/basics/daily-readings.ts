import type { DailyDatum } from "../../schema/daily";
import type { HeroContext } from "../../schema/hero";
import { keyOf } from "../../schema/key";
import { contextClass } from "../hero";
import type { Box } from "../label-box";
import type { Stop } from "../pointer";
import type { Range } from "../pointer-model";

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

interface StopOptions {
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  /** The context's tone, for the readings that are not heroes. */
  context?: HeroContext;
  /** The readings with the hero's ink dot. */
  heroes: ReadonlySet<number>;
  /** Quiet words under a reading's value (a weekend, a forecast, a range). */
  facts?: (i: number, reading: Reading) => string[];
  /** Printed value labels: the tip keeps off them. */
  labels?: readonly Box[];
  /** Everything else the tip keeps off: notes, reference names, interval names. Neither is painted over by the column's band. */
  keepOff?: readonly Box[];
  x: (i: number) => number;
  y: (value: number) => number;
}

/** How far a tip keeps off the line, px. */
const LINE_ROOM = 10;

/**
 * The y-range the line covers between two x's (the readings inside them and
 * the one beyond each edge, where the line comes in), and the reading itself.
 */
const lineBetween = (
  live: number[],
  readings: Reading[],
  x0: number,
  x1: number,
  o: StopOptions,
  own: number
): readonly Range[] => {
  const xs = live.map((i) => o.x(i));
  const first = xs.findIndex((x) => x >= x0);
  const last = xs.findLastIndex((x) => x <= x1);
  const from = Math.max(0, (first === -1 ? live.length : first) - 1);
  const to = Math.min(live.length - 1, last + 1);
  const ys = [
    ...live.slice(from, to + 1).map((i) => o.y(valueAt(readings, i))),
    own,
  ];
  const boxes: Range[] = [];
  for (const b of [...(o.labels ?? []), ...(o.keepOff ?? [])]) {
    if (b.x1 >= x0 && b.x0 <= x1) {
      boxes.push([b.y0 - 2, b.y1 + 2]);
    }
  }
  return [[Math.min(...ys) - LINE_ROOM, Math.max(...ys) + LINE_ROOM], ...boxes];
};

/**
 * Where the pointer lands on each live reading, and what its tip says: the
 * date, the value and any note. The tip keeps off the line at that reading.
 */
export const readingStops = (
  { live, readings }: Series,
  o: StopOptions
): Stop<number>[] =>
  live.map((i) => {
    const printed = [...(o.labels ?? []), ...(o.keepOff ?? [])];
    const reading = readings[i];
    const py = o.y(valueAt(readings, i));
    const facts = o.facts?.(i, reading) ?? [];
    return {
      avoid: (x0, x1) => lineBetween(live, readings, x0, x1, o, py),
      bare: printed.some((b) => b.x1 >= o.x(i) - 8 && b.x0 <= o.x(i) + 8),
      dots: [
        {
          className: o.heroes.has(i)
            ? "fill-hero"
            : contextClass(o.context, "fill"),
          y: py,
        },
      ],
      key: i,
      lead: o.fmtDate(reading.date),
      rows: [
        { value: o.format(valueAt(readings, i)) },
        ...facts.map((value) => ({ muted: true, value })),
      ],
      x: o.x(i),
      y: py,
    };
  });
