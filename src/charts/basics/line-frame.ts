import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import type { ValueAxis } from "../../schema/daily";
import { crisp } from "../axes";
import { labelBox } from "../label-box";
import { valueAt } from "./daily-readings";
import type { Reading } from "./daily-readings";
import { pathBetween } from "./intervals";
import { axisRoom } from "./util-a";

export interface Frame {
  floor: number;
  /** Where reading `i` stands: by its date, so a missing day leaves a gap. */
  x: (i: number) => number;
  /** The frame's left and right edges: gridlines and baseline span them. */
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

export const DAY_MS = 86_400_000;

/**
 * The line through the live readings, broken at each gap: the observed one,
 * and the forecast one that picks up where it ends.
 */
export const linePaths = (
  readings: Reading[],
  frame: Frame,
  forecast: number
) => {
  const at = { x: (i: number) => crisp(frame.x(i)), y: frame.y };
  const last = readings.length - 1;
  const kept = Math.min(forecast, readings.length) - 1;

  return {
    forecast:
      forecast >= readings.length
        ? ""
        : pathBetween(readings, { from: Math.max(0, kept), to: last }, at),
    observed: pathBetween(readings, { from: 0, to: kept }, at),
  };
};

/** A range narrower than this is flat: below it d3 cannot count ticks (the step underflows). */
export const FLAT_SPAN = 1e-290;

/** Where the hero's and the latest day's value labels print, over their dots. */
export const valueLabelBoxes = (
  readings: Reading[],
  frame: Frame,
  format: (v: number) => string,
  at: number[]
) =>
  at.map((i) =>
    labelBox(
      format(valueAt(readings, i)),
      frame.x(i),
      frame.y(valueAt(readings, i)) - 12,
      "middle"
    )
  );

/**
 * The frame: the value axis over the reach of the readings (and the marks
 * that need room), and the days across the plot, kept clear of the value
 * scale and of the bands' names at the right.
 */
export const frameOf = (
  readings: Reading[],
  at: {
    axis: ValueAxis;
    domain: [number, number] | undefined;
    floor: number;
    reach: [number, number];
    top: number;
    width: number;
  }
) => {
  const room = axisRoom(at.axis);
  const frameW = Math.min(at.width - 16, 680 + room.left);
  const x0 = Math.round((at.width - frameW) / 2) + room.left;
  const x1 = x0 + frameW - room.left;
  const [lo, hi] = at.reach;
  const span = hi - lo;

  const y = scaleLinear()
    .domain(
      at.domain ??
        (span < FLAT_SPAN ? [lo - 1, hi + 1] : [lo - span * 0.25, hi])
    )
    .range([at.floor, at.top]);

  if (at.domain === undefined) {
    y.nice(5);
  }

  const start = readings[0].date.getTime();

  const dayAt = (i: number) =>
    Math.round((readings[i].date.getTime() - start) / DAY_MS);

  const xScale = scaleLinear()
    .domain([0, Math.max(1, dayAt(readings.length - 1))])
    .range([x0 + 8, x1 - room.right]);

  const frame: Frame = {
    floor: at.floor,
    x: (i) => xScale(dayAt(i)),
    x0,
    x1,
    y,
  };

  return { dayAt, frame, xScale };
};
