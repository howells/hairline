// Types and shared pieces of the time-line chart.

import type { ScaleLinear, ScaleTime } from "d3-scale";
import { curveLinear, curveStepAfter } from "d3-shape";

import type { Point } from "../../lib/data";
import type { Margin } from "../axes";
import type { LegendItem } from "../core";
import type { Sync } from "../hooks";
import type { EndSeries } from "../line-ends";
import type { Threshold } from "./breach";
import { scaleWidth } from "./room";

export interface LineSeries {
  data: Point[];
  /** 1 = primary (ink), 2 = secondary (grey). */
  tone: 1 | 2;
  /** Provisional for its whole length: drawn as an evenly dotted line. */
  dashed?: boolean;
  format: (v: number) => string;
  /** The series' name, for the key and the cursor tags. */
  name?: string;
}

export interface YAxis {
  domain: [number, number];
  ticks?: number[];
  format?: (v: number) => string;
  /**
   * "right" sets the scale in a gutter at the right, each label sitting on
   * its gridline, beside the latest data. For single-series charts.
   */
  side?: "left" | "right";
}

/** Width of the right-hand scale's gutter, px. */
export const RIGHT_GUTTER = 48;

export const isRightAxis = (y: YAxis) => y.side === "right";

/**
 * Left and right margins for the scale's side. A left-hand scale gets room
 * for its widest label plus `gap`, so the labels start at the plot's edge.
 */
export const sideMargins = (axis: YAxis, gap: number, right: number) =>
  isRightAxis(axis)
    ? { left: 4, right: RIGHT_GUTTER }
    : { left: scaleWidth(axis) + gap, right };

/** Where gridlines end: through the gutter when the scale sits at the right. */
export const gridEnd = (axis: YAxis, width: number, marginRight: number) =>
  isRightAxis(axis) ? width : width - marginRight;

export interface Band {
  from: Date;
  to: Date;
  label: string;
}

/** The engraving of the shaded region. */
export type Shade = "hatch" | "stipple" | "rules" | "screen";

/**
 * Values at the cursor: a key above the plot, a lone number over the cursor,
 * one big figure at the top left, or a name-and-value tag beside each dot.
 */
export type Readout = "legend" | "value" | "figure" | "tags" | "none";

/**
 * Past the cursor, lines turn evenly dotted (the one "beyond the cursor"
 * encoding), or carry on solid.
 */
export type Future = "dotted" | "none";

export interface TimeLinesProps {
  series: LineSeries[];
  height: number;
  rest: number;
  y: YAxis;
  margin?: Partial<Margin>;
  /**
   * "area" shades under the first series, "band" between the first two,
   * "gap" between the first two in a grammar for whichever one leads.
   */
  fill?: "area" | "band" | "gap";
  /** The shade's engraving. Defaults to a hatch. */
  texture?: Shade;
  future?: Future;
  /**
   * Name the lines where they end instead of in a key: the primary line
   * first, then the highest and lowest, the rest folded into one label,
   * "7 other regions" for `others: "regions"`. Every series needs a `name`;
   * not with a right-hand scale or a legend.
   */
  endLabels?: { named?: number; others: string };
  step?: boolean;
  bands?: Band[];
  zero?: boolean;
  threshold?: Threshold;
  readout?: Readout;
  /** Date label under the cursor, dimming the x axis. */
  dateReadout?: boolean;
  cursorAtRest?: boolean;
  bottomLegend?: LegendItem[];
  /** Sparkline mode: no axes, one baseline; the caller prints the title. */
  compact?: boolean;
  sync?: Sync;
  label: string;
}

/** Plot geometry shared by every layer of one render. */
export interface Frame {
  /** Clip-path id prefix. */
  id: string;
  /** Pattern id for a named texture. */
  tex: (name: string) => string;
  width: number;
  height: number;
  m: Margin;
  plotBottom: number;
  x: ScaleTime<number, number>;
  y: ScaleLinear<number, number>;
  future: Future;
}

export const LINE_TONE = {
  1: { past: "var(--hl-line1)" },
  2: { past: "var(--hl-line2)" },
} as const;

export const DOT_TONE = { 1: "fill-hero", 2: "fill-l3" } as const;

/** A series is identified within its chart by its tone, dash and name. */
export const seriesKey = (s: LineSeries) =>
  `line-${s.tone}-${s.dashed === true ? "dashed" : "solid"}-${s.name ?? ""}`;

export const curveOf = (props: TimeLinesProps) =>
  props.step === true ? curveStepAfter : curveLinear;

/**
 * The series as end labels see them: the primary line (tone 1) is the hero,
 * and carries its last value. `y` places a value on the plot, px.
 */
export const endSeriesOf = (
  props: TimeLinesProps,
  y: (v: number) => number
): EndSeries[] =>
  props.series.map((s) => {
    const last = s.data.at(-1)?.value ?? 0;

    return {
      display: s.format(last),
      hero: s.tone === 1,
      name: s.name ?? "",
      value: last,
      y: y(last),
    };
  });

/** Fails loudly where end labels cannot work. */
export const checkEndLabels = (props: TimeLinesProps) => {
  if (props.endLabels === undefined) {
    return;
  }

  if (props.series.some((s) => s.name === undefined || s.name === "")) {
    throw new Error("TimeLines endLabels: every series needs a name");
  }

  if (isRightAxis(props.y)) {
    throw new Error(
      "TimeLines endLabels: the right margin is the labels', so the scale cannot sit there"
    );
  }

  if (props.readout === "legend") {
    throw new Error("TimeLines endLabels replace the legend readout");
  }
};
