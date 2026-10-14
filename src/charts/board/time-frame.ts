// Types and shared pieces of the time-line chart.

import type { ScaleLinear, ScaleTime } from "d3-scale";
import { curveLinear, curveStepAfter } from "d3-shape";

import type { Point } from "../../lib/data";
import type { Margin } from "../axes";
import type { LegendItem } from "../core";
import type { Sync } from "../hooks";
import type { Threshold } from "./breach";

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

/** Left and right margins for the scale's side. */
export const sideMargins = (axis: YAxis, left: number, right: number) =>
  isRightAxis(axis) ? { left: 4, right: RIGHT_GUTTER } : { left, right };

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
  step?: boolean;
  bands?: Band[];
  zero?: boolean;
  threshold?: Threshold;
  readout?: Readout;
  /** Date label under the cursor, dimming the x axis. */
  dateReadout?: boolean;
  cursorAtRest?: boolean;
  bottomLegend?: LegendItem[];
  /** Sparkline mode: no axes, one baseline, a title. */
  compact?: { title: string };
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
  1: { past: "var(--line1)" },
  2: { past: "var(--line2)" },
} as const;
export const DOT_TONE = { 1: "fill-l0", 2: "fill-l3" } as const;

/** A series is identified within its chart by its tone and dash. */
export const seriesKey = (s: LineSeries) =>
  `line-${s.tone}-${s.dashed === true ? "dashed" : "solid"}`;

export const curveOf = (props: TimeLinesProps) =>
  props.step === true ? curveStepAfter : curveLinear;
