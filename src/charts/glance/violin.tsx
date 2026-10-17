import { extent, median, quantile } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveBasis } from "d3-shape";
import { useMemo } from "react";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { MARK_WEIGHT } from "../marks";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, ranks, stagger } from "../util";
import { labelRoom } from "./util-a";
import { density, silverman } from "./util-b";
import { violinDemo } from "./violin.data";
import type { ViolinGroup } from "./violin.data";

interface ViolinProps {
  data?: ViolinGroup[];
  height?: number;
  format?: (v: number) => string;
  /** Unit noun for the tooltip, e.g. "towers". */
  unit?: string;
  /** Darkest = lowest median (true) or highest (false, e.g. the heaviest bells). */
  lowIsBest?: boolean;
  note?: string;
  /** Index of the group to draw in the hero colour. */
  highlight?: number;
}

interface GroupStats {
  at: number[];
  dens: number[];
  hi: number;
  lo: number;
  med: number;
  n: number;
  p90: number;
}

interface FigureProps {
  bw: number;
  cx: number;
  dimmed: boolean;
  left: number;
  onEnter: (x: number, y: number) => void;
  top: number;
  fill: string;
  /** Engraved pattern fill; omit for a solid silhouette. */
  pattern?: string;
  floor: number;
  group: ViolinGroup;
  hero: boolean;
  i: number;
  stats: GroupStats;
  valueText: string;
  half: number;
  y: ScaleLinear<number, number>;
}

const hundredweight = (v: number) => `${Math.round(v * 10) / 10}`;

/** The unit, printed once on the scale's top label and after each value in the tooltip. */
const UNIT = "cwt";

const statsOf = (g: ViolinGroup): GroupStats => {
  const sorted = g.values.toSorted((a, b) => a - b);
  const [lo = 0, hi = 0] = extent(sorted);
  const at = Array.from({ length: 48 }, (_, k) => lo + ((hi - lo) * k) / 47);
  return {
    at,
    dens: density(sorted, at, silverman(sorted) * 1.1),
    hi,
    lo,
    med: median(sorted) ?? 0,
    n: sorted.length,
    p90: quantile(sorted, 0.9) ?? 0,
  };
};

/** Half-width of a violin at its median, `half` being its widest half. */
const medianHalf = (s: GroupStats, half: number) => {
  const medK = Math.round(
    ((s.med - s.lo) / (s.hi - s.lo || 1)) * (s.at.length - 1)
  );
  return (s.dens[medK] / Math.max(...s.dens)) * half;
};

const bandsOf = (labels: string[], from: number, to: number) =>
  scaleBand()
    .domain(labels)
    .range([from, to])
    .paddingInner(0.1)
    .paddingOuter(0.05);

/** A violin's widest half, and where its centre line sits in its band. */
const halfOf = (bw: number, narrow: boolean) => bw * (narrow ? 0.26 : 0.36);
const centreOf = (bw: number, narrow: boolean) => bw * (narrow ? 0.38 : 0.4);

interface FitInput {
  format: (v: number) => string;
  labels: string[];
  narrow: boolean;
  stats: GroupStats[];
  /** Axis labels, which set the left margin. */
  ticks: string[];
  width: number;
}

/**
 * The plot's side margins. The left holds the axis labels. The median values
 * hang off the right of each violin, so the right margin is the smallest that
 * keeps the furthest of them inside the width.
 */
const fitViolins = (p: FitInput) => {
  const left = labelRoom(p.ticks, "t-axis") + 8;
  const overhang = (right: number) => {
    const band = bandsOf(p.labels, left, p.width - right);
    const bw = band.bandwidth();
    return Math.max(
      ...p.labels.map(
        (l, i) =>
          (band(l) ?? 0) +
          centreOf(bw, p.narrow) +
          medianHalf(p.stats[i], halfOf(bw, p.narrow)) +
          9 +
          labelRoom([p.format(p.stats[i].med)], "t-value") -
          p.width
      )
    );
  };
  if (overhang(0) <= 0) {
    return { left, right: 0 };
  }
  // Overhang only falls as the margin grows: bisect for the smallest that fits.
  let [lo, hi] = [0, p.width / 2];
  for (let k = 0; k < 20; k += 1) {
    const mid = (lo + hi) / 2;
    if (overhang(mid) > 0) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return { left, right: hi };
};

/** One violin: mirrored density, paper median tick, median value and group label. */
const Figure = (p: FigureProps) => {
  const s = p.stats;
  // Each violin is scaled to its own peak, so shapes compare at a glance.
  const peak = Math.max(...s.dens);
  const wd = (d: number) => (d / peak) * p.half;
  const silhouette = area<number>()
    .curve(curveBasis)
    .y((_, k) => p.y(s.at[k]))
    .x0((_, k) => p.cx - wd(s.dens[k]))
    .x1((_, k) => p.cx + wd(s.dens[k]));
  const medW = medianHalf(s, p.half);
  return (
    <DimGroup
      dim={p.dimmed}
      onPointerEnter={() => {
        p.onEnter(p.cx, p.y(s.hi) - 8);
      }}
    >
      <HitRect x={p.left} y={p.top} width={p.bw} height={p.floor - p.top} />
      <g className="grow-y" style={stagger(p.i, "series")}>
        <path
          d={silhouette(s.at) ?? ""}
          className={p.fill}
          fill={p.pattern}
          strokeWidth={p.pattern === undefined ? undefined : 1}
        />
        <line
          className="stroke-paper"
          x1={p.cx - medW - 2}
          x2={p.cx + medW + 2}
          y1={Math.round(p.y(s.med))}
          y2={Math.round(p.y(s.med))}
          strokeWidth={MARK_WEIGHT}
        />
      </g>
      <Label
        dy="0.36em"
        muted={!p.hero}
        order={p.i + 4}
        voice="value"
        x={p.cx + medW + 9}
        y={p.y(s.med)}
      >
        {p.valueText}
      </Label>
      <Label
        anchor="middle"
        muted={!p.hero}
        voice="label"
        x={p.cx}
        y={p.floor + 20}
      >
        {p.group.label}
      </Label>
    </DimGroup>
  );
};

/**
 * G19 Tenor weights. One filled density silhouette per group, mirrored around
 * its centre line; width = how many records sit at that value. A 2px
 * paper-coloured rung marks the median, printed beside it. The lowest-median group
 * (or the highlight, or the highest median when `lowIsBest` is false) is solid ink; the rest are hatched inside
 * a 1px outline.
 */
export const Violin = (props: ViolinProps) => {
  const data = props.data ?? violinDemo;
  const height = props.height ?? 420;
  const format = props.format ?? hundredweight;
  const unit = props.unit ?? "towers";
  const hover = useHover<number>();
  const stats = useMemo(() => data.map((g) => statsOf(g)), [data]);
  const order = ranks(
    stats.map((s) => s.med),
    props.lowIsBest ?? true
  );
  const maxV = Math.max(...stats.map((s) => s.hi));
  const heroIndex = props.highlight ?? order.indexOf(0);
  const tex = useTextureIds("violin");
  const label = `Violins: ${data.map((g, i) => `${g.label} median ${format(stats[i].med)} ${UNIT}`).join(", ")}`;

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `median ${format(stats[hover.at.key].med)} ${UNIT}`,
                `90% under ${format(stats[hover.at.key].p90)} ${UNIT}`,
                `${stats[hover.at.key].n} ${unit}`,
              ]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        const bottom = 32 + noteSpace(props.note, width - 16, 20);
        const y = scaleLinear()
          .domain([0, maxV])
          .nice()
          .range([height - bottom, 12]);
        const { left, right } = fitViolins({
          format,
          labels: data.map((g) => g.label),
          narrow,
          stats,
          ticks: y
            .ticks(4)
            .map((t, k, all) =>
              k === all.length - 1 ? `${format(t)} ${UNIT}` : format(t)
            ),
          width,
        });
        const m = { bottom, left, right, top: 12 };
        const x = bandsOf(
          data.map((g) => g.label),
          left,
          width - right
        );
        const bw = x.bandwidth();
        const floor = height - m.bottom;

        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={tex("hatch")} tone="fill-l4" />
            </defs>
            {y.ticks(4).map((t) => (
              <g key={t}>
                <HRule
                  kind={t === 0 ? "hairline" : "grid"}
                  x0={m.left}
                  x1={width - m.right}
                  y={y(t)}
                />
                <Label anchor="end" middle voice="axis" x={m.left - 8} y={y(t)}>
                  {t === y.ticks(4).at(-1) ? `${format(t)} ${UNIT}` : format(t)}
                </Label>
              </g>
            ))}
            {data.map((g, i) => (
              <Figure
                key={g.label}
                bw={bw}
                cx={(x(g.label) ?? 0) + centreOf(bw, narrow)}
                dimmed={hover.dim(i)}
                fill={heroIndex === i ? "fill-hero" : "stroke-l5"}
                pattern={heroIndex === i ? undefined : paint(tex("hatch"))}
                floor={floor}
                group={g}
                hero={heroIndex === i}
                i={i}
                left={x(g.label) ?? 0}
                onEnter={hover.showAt(i)}
                stats={stats[i]}
                top={m.top}
                valueText={format(stats[i].med)}
                half={halfOf(bw, narrow)}
                y={y}
              />
            ))}
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
