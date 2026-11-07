import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { plural } from "../../lib/format";
import type { DumbbellDatum } from "../../schema/dumbbell-queue";
import { keyOf } from "../../schema/key";
import type { FontMetrics } from "../../schema/metrics";
import { DOT } from "../marks";
import type { DotSize } from "../marks";
import { inkWidth, maxIndex } from "./util-b";

/*
 * What DumbbellQueue and ArrowPlot share: rows of a before and an after on
 * one axis, with the names to the left and the value labels fitted to the
 * edges.
 */

export interface Layout {
  dotR: number;
  dotSize: DotSize;
  labelW: number;
  pitch: number;
  top: number;
  x: ScaleLinear<number, number>;
}

/** The text a row sets beside its marks, on each side. Empty is none. */
export interface SideLabels {
  left: (d: DumbbellDatum) => string;
  right: (d: DumbbellDatum) => string;
}

/** Margin kept between the ink and the svg edge. */
const EDGE = 2;

/** Gap between a row's names and the first thing to their right. */
const NAME_GAP = 12;

/** Space under the rows, for the axis. */
const BOTTOM = 44;

const labelRoom = (
  text: string,
  dotR: number,
  metrics: FontMetrics | undefined
) => (text === "" ? 0 : dotR + 2 + inkWidth(text, metrics));

/** What fitting the labels to the edges reads. */
interface Fit {
  data: DumbbellDatum[];
  dotR: number;
  labelW: number;
  labels: SideLabels;
  lo: number;
  metrics: FontMetrics | undefined;
  span: number;
  width: number;
}

const fraction = (fit: Fit, v: number) => (v - fit.lo) / fit.span;

/** The right end of the track, pulled in until every right-hand label fits. */
const reachOf = (fit: Fit, x0: number) =>
  Math.min(
    fit.width - EDGE,
    ...fit.data.map((d) => {
      const t = fraction(fit, Math.max(d.before, d.after));
      const room = labelRoom(fit.labels.right(d), fit.dotR, fit.metrics);

      return t > 0 ? x0 + (fit.width - EDGE - room - x0) / t : Infinity;
    })
  );

/** How far the left end must move in for every left-hand label to clear the names. */
const pushOf = (fit: Fit, x0: number, x1: number) =>
  Math.max(
    0,
    ...fit.data.map((d) => {
      const room = labelRoom(fit.labels.left(d), fit.dotR, fit.metrics);
      const at = x0 + fraction(fit, Math.min(d.before, d.after)) * (x1 - x0);

      return room === 0 ? 0 : fit.labelW + 4 + room - at;
    })
  );

/**
 * The scale: the axis runs from zero, or below it when a value is negative.
 * The right end is pulled in until every right-hand label fits, and the left
 * end pushed in until every left-hand label clears the names, but never so
 * far that the track has no length.
 */
export const buildLayout = (
  width: number,
  height: number,
  data: DumbbellDatum[],
  hasNote: boolean,
  labels: SideLabels,
  top: number,
  metrics?: FontMetrics,
  marked: readonly number[] = []
): Layout => {
  const longest = Math.max(0, ...data.map((d) => inkWidth(d.label, metrics)));
  // The row names end at `labelW`, the longest starting at the edge margin.
  const labelW = EDGE + Math.min(width * 0.32, Math.ceil(longest));
  const bottom = hasNote ? BOTTOM + 30 : BOTTOM;
  const values = [...data.flatMap((d) => [d.before, d.after]), ...marked];

  // Round the ends outwards so the axis ends read as whole steps, not 9.204.
  const [lo, hi] = scaleLinear()
    .domain([Math.min(0, ...values) * 1.04, Math.max(0, ...values) * 1.04])
    .nice()
    .domain();

  const span = hi > lo ? hi - lo : 1;
  const dotSize: DotSize = width < 420 ? "md" : "lg";
  const dotR = DOT[dotSize];
  const fit: Fit = { data, dotR, labelW, labels, lo, metrics, span, width };
  let x0 = labelW + NAME_GAP;
  let x1 = Math.max(x0, reachOf(fit, x0));

  // Moving the left end changes the reach, so settle in a few passes.
  for (let pass = 0; pass < 4; pass += 1) {
    const push = pushOf(fit, x0, x1);

    if (push === 0) {
      break;
    }

    x0 += push;
    x1 = Math.max(x0, reachOf(fit, x0));
  }

  return {
    dotR,
    dotSize,
    labelW,
    pitch: (height - top - bottom) / Math.max(1, data.length - 1),
    top,
    x: scaleLinear()
      .domain([lo, lo + span])
      .range([x0, x1]),
  };
};

/** The change in words: "2.5 less" or "6 more". */
export const describe = (
  d: DumbbellDatum,
  format: (v: number) => string
): string =>
  d.after <= d.before
    ? `${format(d.before - d.after)} less`
    : `${format(d.after - d.before)} more`;

/** What the rows say, in words, from the data passed in. */
export const summary = (
  data: DumbbellDatum[],
  format: (v: number) => string
) => {
  if (data.length === 0) {
    return "No data.";
  }

  const big = data[maxIndex(data.map((d) => Math.abs(d.before - d.after)))];

  return `${plural(data.length, "row")}. Biggest change: ${big.label}, ${format(big.before)} to ${format(big.after)}. The data table lists every row.`;
};

/** React keys: each datum's key, numbered when the key repeats. */
export const reactKeys = (data: DumbbellDatum[]) => {
  const seen = new Map<string, number>();

  return data.map((d) => {
    const key = keyOf(d);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);

    return `${key}#${nth}`;
  });
};
