import { line as d3line } from "d3-shape";

import { intervalLabel } from "../../schema/intervals";
import type { Forecast, Interval } from "../../schema/intervals";
import { isLive, valueAt } from "./daily-readings";
import type { Reading } from "./daily-readings";

/*
 * What HairlineLine and HairlineArea share for uncertainty: nested coverage
 * bands, each in a solid ramp tone and named at its end in words, and a
 * forecast, which is a dashed line after a dotted rule. The bands and the
 * forecast are placed by the readings' own days, so both charts, one spaced
 * by date and one evenly, draw them the same way.
 */

/** A band as drawn: its name, and its edges at reading indexes, left to right. */
export interface Band {
  coverage: number;
  label: string;
  points: { high: number; i: number; low: number }[];
}

/**
 * The bands widest first, so the narrower one draws over it. A day that is
 * not one of the readings is skipped.
 */
export const bandsOf = (
  intervals: readonly Interval[] | undefined,
  readings: Reading[]
): Band[] =>
  (intervals ?? [])
    .flatMap((band) => {
      const points = band.points
        .flatMap((p) => {
          const i = readings.findIndex(
            (r) => r.date.getTime() === Date.parse(p.date)
          );
          return i === -1 ? [] : [{ high: p.high, i, low: p.low }];
        })
        .toSorted((a, b) => a.i - b.i);
      return points.length === 0
        ? []
        : [{ coverage: band.coverage, label: intervalLabel(band), points }];
    })
    .toSorted((a, b) => b.coverage - a.coverage);

/** Every value the bands reach, so the axis keeps room for them. */
export const bandValues = (bands: readonly Band[]) =>
  bands.flatMap((band) => band.points.flatMap((p) => [p.low, p.high]));

/** The index of the first forecast reading: the first after the day given, or the end. */
export const forecastAt = (
  readings: Reading[],
  forecast: Forecast | undefined
) => {
  if (forecast === undefined) {
    return readings.length;
  }
  const last = Date.parse(forecast.from);
  const first = readings.findIndex((r) => r.date.getTime() > last);
  return first === -1 ? readings.length : first;
};

/** The line through readings `from` to `to` (inclusive), broken at each gap. */
export const pathBetween = (
  readings: Reading[],
  span: { from: number; to: number },
  at: { x: (i: number) => number; y: (v: number) => number }
) =>
  d3line<number>()
    .defined((i) => isLive(readings[i]))
    .x((i) => at.x(i))
    .y((i) => at.y(valueAt(readings, i)))(
    Array.from(
      { length: Math.max(0, span.to - span.from + 1) },
      (_, k) => span.from + k
    )
  ) ?? "";

/** The extra columns a data table gains for the bands and the forecast. */
export const intervalTable = (
  bands: readonly Band[],
  forecast: { at: number; shown: boolean },
  format: (v: number) => string
) => ({
  cells: (i: number) => [
    ...bands.flatMap((band) => {
      const p = band.points.find((q) => q.i === i);
      return p === undefined ? ["", ""] : [format(p.low), format(p.high)];
    }),
    ...(forecast.shown ? [i >= forecast.at ? "Forecast" : "Observed"] : []),
  ],
  columns: [
    ...bands.flatMap((band) => [`${band.label}, low`, `${band.label}, high`]),
    ...(forecast.shown ? ["Basis"] : []),
  ],
});

/** A band's range on one day, for the tooltip. */
export const intervalFacts = (
  bands: readonly Band[],
  i: number,
  format: (v: number) => string
) =>
  bands.flatMap((band) => {
    const p = band.points.find((q) => q.i === i);
    return p === undefined
      ? []
      : [`${band.label}: ${format(p.low)} to ${format(p.high)}`];
  });

/** The bands and the forecast in words, for the description. */
export const intervalDesc = (
  bands: readonly Band[],
  forecast: { label: string; shown: boolean }
) => {
  const parts = [
    ...bands.map((band) => `Band: ${band.label}`),
    ...(forecast.shown
      ? [`${forecast.label}: the line is dashed after the rule`]
      : []),
  ];
  return parts.length === 0 ? "" : `${parts.join(". ")}.`;
};
