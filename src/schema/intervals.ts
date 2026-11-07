// React-free. The uncertainty marks HairlineLine and HairlineArea share:
// nested coverage bands, and the day a forecast begins. Spread
// `intervalsShape` into the chart's strictObject and check the dates with
// `intervalIssues`, which needs the readings.
import { z } from "zod";

import { isoDateSchema } from "./daily";

/** One day's edges of a band. The date must be one of the readings'. */
export const intervalPointSchema = z.strictObject({
  /** The reading's date: the band is drawn over that day. */
  date: isoDateSchema.describe(
    "The reading's date: the band is drawn over that day."
  ),
  /** The upper edge on that day. */
  high: z.number().describe("The upper edge on that day."),
  /** The lower edge on that day. */
  low: z.number().describe("The lower edge on that day."),
});

/** A band that says how much of the outcomes it holds. */
export const intervalSchema = z.strictObject({
  /** The share of outcomes inside the band, above 0 and below 1: 0.5 is half. */
  coverage: z
    .number()
    .gt(0)
    .lt(1)
    .describe(
      "The share of outcomes inside the band, above 0 and below 1: 0.5 is half."
    ),
  /** The band's name at its end. Defaults to the coverage in words. */
  label: z
    .string()
    .min(1)
    .optional()
    .describe(
      'The band\'s name at its end. Defaults to the coverage in words: "Half", "9 in 10 outcomes".'
    ),
  /** The band's edges, a day each. */
  points: z
    .array(intervalPointSchema)
    .min(1)
    .describe("The band's edges, a day each."),
});

/** Where a forecast begins. */
export const forecastSchema = z.strictObject({
  /** The last observed day: the readings after it are the forecast. */
  from: isoDateSchema.describe(
    "The last observed day: the readings after it are the forecast."
  ),
  /** The rule's name. Defaults to "Forecast". */
  label: z
    .string()
    .min(1)
    .optional()
    .describe('The rule\'s name. Defaults to "Forecast".'),
});

export const intervalsShape = {
  /** Forecast: a dashed line after a rule, from the day given. */
  forecast: forecastSchema
    .optional()
    .describe(
      "Where a forecast begins: the line turns dashed after a rule on this day, which is the last observed one."
    ),
  /** One or two nested bands, widest first or last. */
  intervals: z
    .array(intervalSchema)
    .min(1)
    .max(2)
    .optional()
    .describe(
      "One or two nested uncertainty bands, each labelled with the share of outcomes it covers."
    ),
};

/** One band's edges. */
export type IntervalPoint = z.infer<typeof intervalPointSchema>;

/** One band. */
export type Interval = z.infer<typeof intervalSchema>;

/** Where a forecast begins. */
export type Forecast = z.infer<typeof forecastSchema>;

/** A band's name: its own label, else the coverage in words. */
export const intervalLabel = (band: Interval): string => {
  if (band.label !== undefined) {
    return band.label;
  }

  if (Math.abs(band.coverage - 0.5) < 1e-9) {
    return "Half";
  }

  const tenths = band.coverage * 10;

  return Math.abs(tenths - Math.round(tenths)) < 1e-9
    ? `${Math.round(tenths)} in 10 outcomes`
    : `${Math.round(band.coverage * 100)} in 100 outcomes`;
};

/**
 * What is wrong with the bands against the readings' dates, as zod issues:
 * a band day that is not a reading, or an edge that is upside down. The
 * chart itself skips a day it cannot place.
 */
export const intervalIssues = (
  dates: readonly string[],
  intervals: readonly Interval[] | undefined
): { message: string; path: (number | string)[] }[] => {
  const days = new Set(dates.map((d) => Date.parse(d)));

  return (intervals ?? []).flatMap((band, b) =>
    band.points.flatMap((point, p) => [
      ...(days.has(Date.parse(point.date))
        ? []
        : [
            {
              message: "the date is not one of the readings' dates",
              path: ["intervals", b, "points", p, "date"],
            },
          ]),
      ...(point.low <= point.high
        ? []
        : [
            {
              message: "low must not be above high",
              path: ["intervals", b, "points", p, "low"],
            },
          ]),
    ])
  );
};
