import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveBasis, line } from "d3-shape";
import { useState } from "react";

import { fmtDegC } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { ridgelineDemo } from "./ridgeline.data";
import type { RidgeSeries } from "./ridgeline.data";

interface RidgelineProps {
  data?: RidgeSeries[];
  /** Value range of the shared x axis. */
  domain?: [number, number];
  /** Kernel bandwidth in data units; defaults to 1/26 of the domain. */
  bandwidth?: number;
  /** Number of axis intervals (ticks = intervals + 1). */
  ticks?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Ridge drawn in the hero colour. Defaults to the first. */
  highlight?: string;
}

interface Ridge {
  label: string;
  n: number;
  median: number;
  peak: number;
  /**
   * Height of the drawn crest at the peak. The B-spline passes through
   * (d[k-1] + 4d[k] + d[k+1]) / 6 at sample k, not d[k], so the peak dot
   * takes this to sit exactly on the outline.
   */
  top: number;
  density: [number, number][];
}

const SAMPLES = 120;

/** Daily temperatures in °C: whole degrees need no decimal, zero no unit. */
const fmtTemperature = (v: number) =>
  v === 0 ? "0" : fmtDegC(v).replace(".0 °C", " °C");

/** Gaussian kernel density on an even grid, plus the peak and median. */
const toRidge = (s: RidgeSeries, d0: number, d1: number, bw: number): Ridge => {
  const step = (d1 - d0) / SAMPLES;
  const density = Array.from(
    { length: SAMPLES + 1 },
    (_, k): [number, number] => {
      const x = d0 + step * k;
      let sum = 0;
      for (const v of s.values) {
        const z = (x - v) / bw;
        sum += Math.exp(-0.5 * z * z);
      }
      return [x, sum / (s.values.length * bw * Math.sqrt(2 * Math.PI))];
    }
  );
  let k = 0;
  for (const [i, p] of density.entries()) {
    if (p[1] > density[k][1]) {
      k = i;
    }
  }
  const crest =
    k === 0 || k === SAMPLES
      ? density[k][1]
      : (density[k - 1][1] + 4 * density[k][1] + density[k + 1][1]) / 6;
  const sorted = s.values.toSorted((a, b) => a - b);
  return {
    density,
    label: s.label,
    median: sorted[Math.floor(sorted.length / 2)] ?? 0,
    n: s.values.length,
    peak: density[k][0],
    top: crest,
  };
};

interface RidgeLayerProps {
  ridge: Ridge;
  index: number;
  base: number;
  ridgeH: number;
  maxD: number;
  x: ScaleLinear<number, number>;
  hero: boolean;
  label: string;
  /** Pattern ids: every ridge's hatch, and the hero's crosshatch. */
  fills: RidgeFills;
}

interface RidgeFills {
  hatch: string;
  hero: string;
}

/**
 * One crest: a paper fill hides the rows behind, then an engraved hatch
 * (crosshatch for the hero), a baseline and the outline.
 */
const RidgeLayer = ({
  ridge,
  index,
  base,
  ridgeH,
  maxD,
  x,
  hero,
  label,
  fills,
}: RidgeLayerProps) => {
  const y = (d: number) => base - (d / maxD) * ridgeH;
  const crest = area()
    .x((p) => x(p[0]))
    .y0(base)
    .y1((p) => y(p[1]))
    .curve(curveBasis)(ridge.density);
  const outline = line()
    .x((p) => x(p[0]))
    .y((p) => y(p[1]))
    .curve(curveBasis)(ridge.density);
  return (
    <>
      <path d={crest ?? ""} className="fill-paper" />
      <g className="fade" style={stagger(index, "series")}>
        <path d={crest ?? ""} fill={paint(hero ? fills.hero : fills.hatch)} />
      </g>
      <line
        className="hairline"
        x1={x.range()[0]}
        x2={x.range()[1]}
        y1={crisp(base)}
        y2={crisp(base)}
      />
      <path
        d={outline ?? ""}
        className={`draw cap-round fill-none ${hero ? "stroke-hero" : "stroke-l3"}`}
        pathLength={1}
        style={stagger(index, "series")}
        strokeWidth={hero ? 2 : 1.5}
      />
      <text
        className={`fade t-label ${hero ? "" : "fill-muted"}`}
        style={stagger(index, "series")}
        x={x.range()[0] - 18}
        y={base - 4}
        textAnchor="end"
      >
        {label}
      </text>
    </>
  );
};

interface PeaksProps {
  ridges: Ridge[];
  baseOf: (i: number) => number;
  ridgeH: number;
  maxD: number;
  x: ScaleLinear<number, number>;
  heroOf: (r: Ridge) => boolean;
  hover: number | null;
  format: (v: number) => string;
}

/**
 * Every ridge's peak, drawn after all the ridges so no crest covers one: a
 * dot on the crest, and the peak's value set at the right-hand end of the
 * ridge's own baseline, in line with its name on the left.
 */
const Peaks = ({
  ridges,
  baseOf,
  ridgeH,
  maxD,
  x,
  heroOf,
  hover,
  format,
}: PeaksProps) => (
  <g>
    {ridges.map((r, i) => {
      const hero = heroOf(r);
      const base = baseOf(i);
      return (
        <g
          className={dimClass(hover !== null && hover !== i)}
          key={`peak-${r.label}`}
        >
          <circle
            className={`pop ${hero ? "fill-hero" : "fill-l3"}`}
            cx={x(r.peak)}
            cy={base - (r.top / maxD) * ridgeH}
            r={3}
            style={stagger(i * 6 + 30, "fine")}
          />
          <text
            className={`fade t-value ${hero ? "" : "fill-muted"}`}
            style={stagger(i + 6, "series")}
            x={x.range()[1] + 8}
            y={base - 4}
          >
            {format(r.peak)}
          </text>
        </g>
      );
    })}
  </g>
);

interface AxisProps {
  x: ScaleLinear<number, number>;
  y: number;
  ticks: number;
  format: (v: number) => string;
}

const Axis = ({ x, y, ticks, format }: AxisProps) => {
  const [d0, d1] = x.domain();
  const values = Array.from(
    { length: ticks + 1 },
    (_, k) => d0 + ((d1 - d0) * k) / ticks
  );
  return (
    <g className="fade">
      {values.map((v) => (
        <g key={`tick-${v}`}>
          <line
            className="hairline"
            x1={crisp(x(v))}
            x2={crisp(x(v))}
            y1={Math.round(y)}
            y2={Math.round(y) + 6}
          />
          <text className="t-axis" x={x(v)} y={y + 20} textAnchor="middle">
            {format(v)}
          </text>
        </g>
      ))}
    </g>
  );
};

/**
 * L19 January by decade. Three to eight distributions stacked with overlap.
 * Each crest is a density outline over paper and a 4px diagonal hatch, so
 * the rows overlap like terrain; the hero is crosshatched. A dot marks each
 * peak, and its value sits at the right-hand end of the ridge's baseline.
 */
export const Ridgeline = (props: RidgelineProps) => {
  const data = props.data ?? ridgelineDemo;
  const [d0, d1] = props.domain ?? [-12, 12];
  const bw = props.bandwidth ?? (d1 - d0) / 26;
  const format = props.format ?? fmtTemperature;
  const height = props.height ?? 440;
  const ticks = props.ticks ?? 4;
  const [hover, setHover] = useState<number | null>(null);
  const id = useTextureIds("ridge");
  const hatchId = id("hatch");
  const heroId = id("hero");
  const ridges = data.map((s) => toRidge(s, d0, d1, bw));
  const maxD = Math.max(...ridges.map((r) => r.top));
  const heroLabel = props.highlight ?? ridges[0]?.label;
  const heroOf = (r: Ridge) => r.label === heroLabel;

  return (
    <Plot>
      {(width) => {
        // Room left of the plot for the ridge names, then the gap to the plot
        // (names sized a little under the real 11: sansWidth rounds glyphs up).
        const labelW = Math.ceil(
          18 + Math.max(...ridges.map((r) => sansWidth(r.label, 10.4)))
        );
        // Room right of the plot for the peak values.
        const valueW = Math.ceil(
          8 + Math.max(...ridges.map((r) => sansWidth(format(r.peak), 11)))
        );
        const plotW = Math.min(width - labelW - valueW, 520);
        const x0 = Math.round(labelW + (width - labelW - valueW - plotW) / 2);
        const x = scaleLinear()
          .domain([d0, d1])
          .range([x0, x0 + plotW]);
        const noteW = width - 16 - Math.abs(2 * x0 + plotW - width);
        const bottom = 34 + noteSpace(props.note, noteW, 24);
        const rowGap = (height - bottom - 30) / (ridges.length + 0.9);
        const ridgeH = rowGap * 1.9;
        const baseOf = (i: number) =>
          height - bottom - rowGap * (ridges.length - 1 - i);
        const tip = hover === null ? undefined : ridges[hover];
        return (
          <div className="relative">
            <svg
              width={width}
              height={height}
              aria-label={`Ridgeline of ${ridges.length} distributions; peaks: ${ridges.map((r) => `${r.label} ${format(r.peak)}`).join(", ")}`}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>January daily mean temperature by decade</title>
              <defs>
                <Hatch ground="fill-paper" id={hatchId} tone="fill-l5" />
                <CrossHatch ground="fill-paper" id={heroId} tone="fill-hero" />
              </defs>
              {ridges.map((r, i) => (
                <g
                  key={r.label}
                  className={dimClass(hover !== null && hover !== i)}
                  onPointerEnter={() => {
                    setHover(i);
                  }}
                >
                  <rect
                    x={0}
                    y={baseOf(i) - rowGap}
                    width={width}
                    height={rowGap}
                    fill="transparent"
                  />
                  <RidgeLayer
                    ridge={r}
                    index={i}
                    base={baseOf(i)}
                    ridgeH={ridgeH}
                    maxD={maxD}
                    x={x}
                    hero={heroOf(r)}
                    label={r.label}
                    fills={{ hatch: hatchId, hero: heroId }}
                  />
                </g>
              ))}
              <Peaks
                ridges={ridges}
                baseOf={baseOf}
                ridgeH={ridgeH}
                maxD={maxD}
                x={x}
                heroOf={heroOf}
                hover={hover}
                format={format}
              />
              <Axis
                x={x}
                y={baseOf(ridges.length - 1) + 8}
                ticks={ticks}
                format={format}
              />
              <PlotNote
                text={props.note}
                width={noteW}
                x={x0 + plotW / 2}
                y={height - 6}
              />
            </svg>
            {tip !== undefined && hover !== null && (
              <Tooltip x={x(tip.peak)} y={baseOf(hover) - ridgeH * 0.5}>
                <b>{tip.label}</b> · peak {format(tip.peak)} · median{" "}
                {format(tip.median)} · n = {tip.n}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
