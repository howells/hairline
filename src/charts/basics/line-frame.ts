import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { valueFormat } from "../../lib/format";
import type { ValueAxis } from "../../schema/daily";
import { resolveFormat } from "../../schema/format";
import type { FormatInput } from "../../schema/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import { crisp } from "../axes";
import { labelBox } from "../label-box";
import { referenceValues } from "../reference-marks";
import { valueAt } from "./daily-readings";
import type { Reading } from "./daily-readings";
import { bandValues, pathBetween } from "./intervals";
import type { Band } from "./intervals";
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

/** How many ticks the value axis asks for. */
export const LINE_TICKS = 5;

/**
 * The value scale over a reach, before it is given a range: the domain if one
 * is given, else the reach with a quarter of its span below it, made nice.
 */
export const lineScale = (
  reach: [number, number],
  domain: [number, number] | undefined
) => {
  if (domain !== undefined) {
    return scaleLinear().domain(domain);
  }

  const [lo, hi] = reach;
  const span = hi - lo;

  return scaleLinear()
    .domain(span < FLAT_SPAN ? [lo - 1, hi + 1] : [lo - span * 0.25, hi])
    .nice(LINE_TICKS);
};

/** What the value axis must cover: the readings, the reference marks and the bands. */
export const reachOf = (
  values: number[],
  references: HairlineLineProps["references"],
  bands: Band[]
): [number, number] => {
  const reach = [
    ...values,
    ...referenceValues(references),
    ...bandValues(bands),
  ];

  return [Math.min(...reach), Math.max(...reach)];
};

/**
 * How values print: the given format, else whole numbers or the decimals the
 * value axis needs, so a label never reads more coarsely than its axis.
 */
export const lineFormat = (
  input: FormatInput | undefined,
  at: {
    bands: Band[];
    domain: [number, number] | undefined;
    references: HairlineLineProps["references"];
    values: number[];
  }
) => {
  if (input !== undefined) {
    return resolveFormat(input);
  }

  return valueFormat(
    at.values.length === 0
      ? []
      : lineScale(reachOf(at.values, at.references, at.bands), at.domain).ticks(
          LINE_TICKS
        )
  );
};

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
  const y = lineScale(at.reach, at.domain).range([at.floor, at.top]);

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
