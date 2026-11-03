import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area as d3area, line as d3line } from "d3-shape";

import type { ValueAxis } from "../../schema/daily";
import { labelBox } from "../label-box";
import { sansWidth } from "../util";
import { isLive, valueAt } from "./daily-readings";
import type { Reading } from "./daily-readings";
import { pathBetween } from "./intervals";
import { axisRoom } from "./util-a";

export interface Frame {
  floor: number;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

export const stemClass = (
  hero: boolean,
  hovered: boolean,
  clearing: boolean | undefined
) => {
  if (hero || clearing === true) {
    return "grow-y fill-hero";
  }
  if (hovered) {
    return "grow-y fill-l2";
  }
  return clearing === false ? "grow-y fill-l5" : "grow-y fill-l4";
};

/** Past this many days, stems stand monthly rather than weekly. */
export const WEEKLY_SPAN = 120;

const DAY_MS = 86_400_000;

/** Whether the readings span more than `WEEKLY_SPAN` days (not how many there are). */
export const isLongSpan = (readings: Reading[]) =>
  readings.length > 1 &&
  ((readings.at(-1)?.date.getTime() ?? 0) - readings[0].date.getTime()) /
    DAY_MS >
    WEEKLY_SPAN;

/** Whether reading `i` is the first of its month. */
export const startsMonth = (readings: Reading[], i: number) =>
  i === 0 ||
  readings[i - 1].date.getUTCMonth() !== readings[i].date.getUTCMonth();

/**
 * A stem stands on every Monday (on every first of the month over a long
 * span), on the hero and on the hovered day.
 */
export const hasStem = (
  readings: Reading[],
  i: number,
  marks: { hero: number; hover: number | null; monthly: boolean }
) =>
  (marks.monthly
    ? startsMonth(readings, i)
    : readings[i].date.getUTCDay() === 1) ||
  i === marks.hero ||
  i === marks.hover;

/**
 * The value scale: `domain` as given, else from zero (or the lowest value, if
 * below) up to the last of `ticks`, or to four nice steps over the peak.
 */
export const valueScale = (
  extent: { hi: number; lo: number },
  floor: number,
  top: number,
  scale: { domain?: [number, number]; ticks?: number[] }
) => {
  if (scale.domain !== undefined) {
    return scaleLinear().domain(scale.domain).range([floor, top]);
  }
  const { ticks } = scale;
  const last = ticks?.at(-1);
  if (last !== undefined && last > 0) {
    return scaleLinear().domain([0, last]).range([floor, top]);
  }
  const lo = Math.min(0, extent.lo);
  const hi = Math.max(lo + 1, extent.hi);
  return scaleLinear().domain([lo, hi]).nice(4).range([floor, top]);
};

/** The live index nearest a position along the index axis. */
export const nearestOf = (live: number[], at: number) => {
  let [nearest] = live;
  for (const k of live) {
    if (Math.abs(k - at) < Math.abs(nearest - at)) {
      nearest = k;
    }
  }
  return nearest;
};

/**
 * The area under the observed readings, and the line through them, each
 * broken where a reading is a gap; and the forecast line that picks up where
 * the observed one ends.
 */
export const shapesOf = (
  readings: Reading[],
  frame: Frame,
  forecast: number
) => {
  const observed = readings.slice(0, forecast);
  return {
    fill:
      d3area<Reading>()
        .defined(isLive)
        .x((_, i) => frame.x(i))
        .y0(Math.round(frame.floor))
        .y1((r) => frame.y(r.value ?? 0))(observed) ?? "",
    forecast:
      forecast >= readings.length
        ? ""
        : pathBetween(
            readings,
            { from: Math.max(0, forecast - 1), to: readings.length - 1 },
            { x: frame.x, y: frame.y }
          ),
    path:
      d3line<Reading>()
        .defined(isLive)
        .x((_, i) => frame.x(i))
        .y((r) => frame.y(r.value ?? 0))(observed) ?? "",
  };
};

/** The grid's left and right edges, centred in `width`; a left axis keeps its margin outside the grid. */
export const edgesOf = (width: number, maxWidth: number, axis: ValueAxis) => {
  const room = axisRoom(axis);
  const frameW = Math.min(width - 16, maxWidth + room.left + room.right);
  const x0 = Math.round((width - frameW) / 2);
  return [x0 + room.left, x0 + frameW] as const;
};

/** Where the first day sits: clear of the hero's label when it is the first. */
export const startOf = (
  readings: Reading[],
  hero: number,
  format: (v: number) => string
) => {
  const half =
    hero < 0
      ? 0
      : Math.ceil(sansWidth(format(valueAt(readings, hero)), 12) / 2) + 2;
  return hero === 0 ? Math.max(8, half) : 8;
};

/** Where the hero's value label prints, over its dot. */
export const heroLabelBox = (
  readings: Reading[],
  frame: Frame,
  format: (v: number) => string,
  hero: number
) =>
  labelBox(
    format(valueAt(readings, hero)),
    frame.x(hero),
    frame.y(valueAt(readings, hero)) - 13,
    "middle"
  );
