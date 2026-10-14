import { scaleLinear, scaleUtc } from "d3-scale";
import type { ScaleLinear, ScaleTime } from "d3-scale";
import { area, line } from "d3-shape";

import { fmtDay } from "../../lib/format";
import { crisp } from "../axes";
import { Chart } from "../core";
import { useScrub } from "../hooks";
import { Hatch, Rules, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { ValueGrid } from "../value-grid";
import { MonthAxis } from "./month-axis";
import { labelledTicks, monthTicks } from "./month-ticks";
import { relax } from "./spread";
import { CURSOR, LABEL, LINE, RULE_ZERO, TICK_STRONG, VALUE } from "./styles";

/** A layer's engraving, on paper: rules lie level, or stand upright. */
type Engraving = "hatch" | "stipple" | "rules" | "upright";

export interface Layer {
  label: string;
  values: number[];
  /** The layer's solid fill, used when it has no texture. */
  fill: string;
  /** Engrave the layer instead: paper underneath, then this texture. */
  texture?: Engraving;
  stroke: string;
  text: string;
}

interface StackedAreaProps {
  layers: Layer[];
  /** One per value; months along the bottom are labelled from these. */
  dates: Date[];
  height: number;
  y: {
    domain: [number, number];
    ticks: number[];
    format?: (v: number) => string;
  };
  /** A layer's value beside its name while scrubbing. */
  format: (v: number) => string;
  label: string;
}

/** Plot geometry shared by every layer of one render. */
interface Frame {
  width: number;
  height: number;
  m: { bottom: number; left: number; right: number; top: number };
  x: ScaleTime<number, number>;
  dates: Date[];
  y: ScaleLinear<number, number>;
  /** Index of each point, 0…n-1. */
  idx: number[];
  /** Cumulative top of each layer, bottom layer first. */
  tops: number[][];
}

const cumulativeTops = (layers: Layer[]) => {
  const tops: number[][] = [];
  for (const [li, layer] of layers.entries()) {
    tops.push(layer.values.map((v, i) => v + (li > 0 ? tops[li - 1][i] : 0)));
  }
  return tops;
};

/** One pattern per engraving, each on paper. */
const LayerPatterns = (props: { tex: (name: string) => string }) => (
  <defs>
    <Hatch ground="fill-paper" id={props.tex("hatch")} tone="fill-l3" />
    <Stipple ground="fill-paper" id={props.tex("stipple")} tone="fill-l3" />
    <Rules ground="fill-paper" id={props.tex("rules")} tone="fill-l5" />
    <Rules
      angle="upright"
      ground="fill-paper"
      id={props.tex("upright")}
      tone="fill-l5"
    />
  </defs>
);

/** Filled bands (top layer painted first) and their edge lines. */
const AreaLayers = (props: {
  layers: Layer[];
  frame: Frame;
  tex: (name: string) => string;
}) => {
  const { dates, idx, tops, y } = props.frame;
  const x = (i: number) => props.frame.x(dates[i]);
  const stacked = props.layers.map((layer, li) => ({ layer, top: tops[li] }));
  return (
    <g clipPath={`url(#${props.tex("clip")}-sweep)`}>
      {stacked.toReversed().map(({ layer, top }) => {
        const d =
          area<number>()
            .x((i) => x(i))
            .y0(y(0))
            .y1((i) => y(top[i]))(idx) ?? "";
        const fill =
          layer.texture === undefined
            ? layer.fill
            : paint(props.tex(layer.texture));
        return <path key={layer.label} d={d} fill={fill} />;
      })}
      {stacked.map(({ layer, top }) => (
        <path
          key={layer.label}
          className={LINE}
          d={
            line<number>()
              .x((i) => x(i))
              .y((i) => y(top[i]))(idx) ?? ""
          }
          stroke={layer.stroke}
        />
      ))}
    </g>
  );
};

/** Gap kept between neighbouring edge labels, px. */
const LABEL_GAP = 15;

/**
 * Layer names at the right edge, each centred on its band at the last week
 * and nudged apart where bands are thin; the cursor's value while scrubbing.
 */
const EdgeLabels = (props: {
  layers: Layer[];
  frame: Frame;
  format: (v: number) => string;
  index: number | null;
}) => {
  const { height: h, m, tops, width, y } = props.frame;
  const last = props.frame.idx.length - 1;
  const ys = relax(
    tops.map((top, li) => y(((tops[li - 1]?.[last] ?? 0) + top[last]) / 2)),
    LABEL_GAP,
    m.top + 6,
    h - m.bottom - 6
  );
  return props.layers.map((layer, li) => (
    <text
      key={layer.label}
      className={`${LABEL} fade`}
      x={width - m.right + 12}
      y={ys[li]}
      dy="0.34em"
      style={{ fill: layer.text }}
    >
      {layer.label}
      {props.index !== null && (
        <tspan className={VALUE}>
          {" "}
          {props.format(layer.values[props.index])}
        </tspan>
      )}
    </text>
  ));
};

const ScrubCursor = (props: {
  chart: StackedAreaProps;
  frame: Frame;
  cx: number;
  index: number;
}) => {
  const { cx, index } = props;
  const { height: h, m, tops, y } = props.frame;
  return (
    <g>
      <line
        className={CURSOR}
        x1={crisp(cx)}
        x2={crisp(cx)}
        y1={m.top}
        y2={h - m.bottom}
      />
      {props.chart.layers.map((layer, li) => (
        <circle
          key={layer.label}
          cx={cx}
          cy={y(tops[li][index])}
          r={4.5}
          fill="var(--bg)"
          stroke={layer.stroke}
          strokeWidth={1.5}
        />
      ))}
      <text
        className={TICK_STRONG}
        x={cx}
        y={h - m.bottom + 14}
        dy="0.71em"
        textAnchor="middle"
      >
        {fmtDay(props.frame.dates[index])}
      </text>
    </g>
  );
};

/** The value grid with its scale at the left: no rules at the top or sides. */
const Gridlines = (props: { chart: StackedAreaProps; frame: Frame }) => {
  const { height: h, m, width, y } = props.frame;
  return (
    <ValueGrid
      floor={h - m.bottom}
      format={props.chart.y.format ?? String}
      labelFloor
      ticks={props.chart.y.ticks}
      x0={m.left}
      x1={width - m.right}
      y={y}
    />
  );
};

/** The ink baseline, drawn over the layers' foot. */
const Baseline = (props: { frame: Frame }) => {
  const { height: h, m, width } = props.frame;
  const baseY = crisp(h - m.bottom);
  return (
    <line
      className={RULE_ZERO}
      x1={m.left}
      x2={width - m.right}
      y1={baseY}
      y2={baseY}
    />
  );
};

/** Clear space kept around the date under the cursor, px. */
const DATE_CLEAR = 64;

/** The months along the bottom, giving way to the cursor's date. */
const Axes = (props: { frame: Frame; cursorX: number | null }) => {
  const { dates, height: h, m, x } = props.frame;
  const months = labelledTicks(
    monthTicks(dates[0], dates.at(-1) ?? dates[0]),
    (d) => d,
    (d) => x(d)
  ).filter(
    (t) => props.cursorX === null || Math.abs(t.x - props.cursorX) > DATE_CLEAR
  );
  return (
    <MonthAxis ticks={months} y={h - m.bottom + 14} width={props.frame.width} />
  );
};

/** Stacked areas over a short index axis, labelled at the right edge. */
export const StackedArea = (props: StackedAreaProps) => {
  const tex = useTextureIds("sa");
  const n = props.dates.length;
  const scrub = useScrub(n - 1, props.dates);

  return (
    <Chart>
      {(width) => {
        const m = { bottom: 30, left: 48, right: 84, top: 8 };
        const h = props.height;
        const frame: Frame = {
          dates: props.dates,
          height: h,
          idx: Array.from({ length: n }, (_, i) => i),
          m,
          tops: cumulativeTops(props.layers),
          width,
          x: scaleUtc()
            .domain([props.dates[0], props.dates.at(-1) ?? props.dates[0]])
            .range([m.left, width - m.right]),
          y: scaleLinear()
            .domain(props.y.domain)
            .range([h - m.bottom, m.top]),
        };
        const positions = props.dates.map((d) => frame.x(d));
        const cx = positions[scrub.index];

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            {...scrub.bind(positions)}
          >
            <title>{props.label}</title>
            <LayerPatterns tex={tex} />
            <defs>
              <clipPath id={`${tex("clip")}-sweep`}>
                <rect
                  className="sweep"
                  x={0}
                  y={-20}
                  width={width}
                  height={h + 40}
                />
              </clipPath>
            </defs>
            <Gridlines chart={props} frame={frame} />
            <AreaLayers layers={props.layers} frame={frame} tex={tex} />
            <Baseline frame={frame} />
            <Axes frame={frame} cursorX={scrub.isHovering ? cx : null} />
            <EdgeLabels
              layers={props.layers}
              frame={frame}
              format={props.format}
              index={scrub.isHovering ? scrub.index : null}
            />
            {scrub.isHovering && (
              <ScrubCursor
                chart={props}
                frame={frame}
                cx={cx}
                index={scrub.index}
              />
            )}
          </svg>
        );
      }}
    </Chart>
  );
};
