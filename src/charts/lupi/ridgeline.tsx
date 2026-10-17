import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveBasis, line } from "d3-shape";

import { fmtDegC } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot } from "../markers";
import { PlotNote } from "../plot-note";
import { HRule, Tick } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, sansWidth, stagger } from "../util";
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
  /** Faded while another ridge is hovered; the paper stays opaque. */
  dim: boolean;
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
 * (crosshatch for the hero), a baseline and the outline. Dimming fades the
 * ink only, so the paper keeps hiding the rows behind.
 */
const RidgeLayer = ({
  ridge,
  index,
  base,
  ridgeH,
  maxD,
  x,
  hero,
  dim,
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
      <DimGroup dim={dim}>
        <g className="fade" style={stagger(index, "series")}>
          <path d={crest ?? ""} fill={paint(hero ? fills.hero : fills.hatch)} />
        </g>
        <HRule x0={x.range()[0]} x1={x.range()[1]} y={base} />
        <path
          d={outline ?? ""}
          className={`draw cap-round fill-none ${hero ? "stroke-hero" : "stroke-l3"}`}
          pathLength={1}
          style={stagger(index, "series")}
          strokeWidth={hero ? 2 : 1.5}
        />
        <Label
          anchor="end"
          muted={!hero}
          order={index}
          tier="series"
          voice="label"
          x={x.range()[0] - 18}
          y={base - 4}
        >
          {label}
        </Label>
      </DimGroup>
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
        <DimGroup dim={hover !== null && hover !== i} key={`peak-${r.label}`}>
          <Dot
            className={`pop ${hero ? "fill-hero" : "fill-l3"}`}
            cx={x(r.peak)}
            cy={base - (r.top / maxD) * ridgeH}
            size={hero ? "md" : "sm"}
            style={stagger(i * 6 + 30, "fine")}
          />
          <Label
            muted={!hero}
            order={i + 6}
            tier="series"
            voice="value"
            x={x.range()[1] + 8}
            y={base - 4}
          >
            {format(r.peak)}
          </Label>
        </DimGroup>
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
          <Tick x={x(v)} y={Math.round(y)} />
          <Label anchor="middle" voice="axis" x={x(v)} y={y + 20}>
            {format(v)}
          </Label>
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
  const hover = useHover<number>();
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
        const tip = hover.key === null ? undefined : ridges[hover.key];
        return (
          <div className="relative">
            <ChartSvg
              height={height}
              label={`Ridgeline of ${ridges.length} distributions; peaks: ${ridges.map((r) => `${r.label} ${format(r.peak)}`).join(", ")}`}
              leave={hover.clear}
              title="January daily mean temperature by decade"
              width={width}
            >
              <defs>
                <Hatch id={hatchId} tone="fill-l5" />
                <CrossHatch id={heroId} tone="fill-hero" />
              </defs>
              {ridges.map((r, i) => (
                <g key={r.label} onPointerEnter={hover.enter(i)}>
                  <HitRect
                    x={0}
                    y={baseOf(i) - rowGap}
                    width={width}
                    height={rowGap}
                  />
                  <RidgeLayer
                    ridge={r}
                    index={i}
                    base={baseOf(i)}
                    ridgeH={ridgeH}
                    maxD={maxD}
                    x={x}
                    hero={heroOf(r)}
                    dim={hover.dim(i)}
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
                hover={hover.key}
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
            </ChartSvg>
            {tip !== undefined && hover.key !== null && (
              <Tooltip x={x(tip.peak)} y={baseOf(hover.key) - ridgeH * 0.5}>
                <TipText
                  facts={[
                    `peak ${format(tip.peak)}`,
                    `median ${format(tip.median)}`,
                    `n = ${tip.n}`,
                  ]}
                  lead={tip.label}
                />
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
