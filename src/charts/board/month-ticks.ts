// Month ticks for the boards' time axes: every month, quarter or half-year
// by span, labelled in the broadsheet style.

import { monthTickLabels } from "../../lib/format";
import { thinTicks } from "./thin-ticks";

/** Months between two dates, counting whole calendar months. */
const monthSpan = (from: Date, to: Date) =>
  (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
  to.getUTCMonth() -
  from.getUTCMonth();

/** Every month for half a year of data, quarters for a year or so, else half-years. */
const stepFor = (from: Date, to: Date) => {
  const span = monthSpan(from, to);
  if (span <= 8) {
    return 1;
  }
  return span <= 15 ? 3 : 6;
};

/** Whether a month starts a tick period: January, then every `step` months. */
const isTickMonth = (d: Date, step: number) => d.getUTCMonth() % step === 0;

/** A month that starts this soon before weekly data begins still gets its tick. */
const LEAD_MS = 7 * 86_400_000;

/**
 * The first of each tick month within [from, to]. Weekly data that starts a
 * few days into a month ticks that month at its first point.
 */
export const monthTicks = (from: Date, to: Date) => {
  const step = stepFor(from, to);
  const ticks: Date[] = [];
  const first = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1)
  );
  for (
    let d = first;
    d <= to;
    d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
  ) {
    if (d.getTime() >= from.getTime() - LEAD_MS && isTickMonth(d, step)) {
      ticks.push(d < from ? from : d);
    }
  }
  return ticks;
};

/** Indices of the tick months in a list of month starts (one bar per month). */
export const monthTickIndices = (months: Date[]) => {
  const step = stepFor(months[0], months.at(-1) ?? months[0]);
  return months.flatMap((d, i) => (isTickMonth(d, step) ? [i] : []));
};

/**
 * Thin the ticks to fit, then label what is left: the year on the first
 * label and wherever it changes ("Jan 2023 · Jul · Jan 2024 · Jul").
 */
export const labelledTicks = <T>(
  ticks: T[],
  date: (tick: T) => Date,
  x: (tick: T) => number
) => {
  const kept = thinTicks(ticks, x);
  const labels = monthTickLabels(kept.map(date));
  return kept.map((tick, i) => ({ label: labels[i], tick, x: x(tick) }));
};
