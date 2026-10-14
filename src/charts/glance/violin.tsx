import { extent, median, quantile } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveBasis } from "d3-shape";
import { useMemo, useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, ranks, stagger } from "../util";
import { density, silverman } from "./util-b";
import { violinDemo } from "./violin.data";
import type { ViolinGroup } from "./violin.data";

interface ViolinProps {
  data?: ViolinGroup[];
  height?: number;
  format?: (v: number) => string;
  /** Unit noun for the tooltip, e.g. "tickets". */
  unit?: string;
  /** Darkest = lowest median (true, e.g. wait times) or highest (false). */
  lowIsBest?: boolean;
  note?: string;
  /** Index of the group to draw in the hero colour. */
  highlight?: number;
}

interface Hit {
  i: number;
  x: number;
  y: number;
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
  onEnter: (hit: Hit) => void;
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

const hours = (v: number) => `${Math.round(v * 10) / 10}h`;

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
  const medK = Math.round(
    ((s.med - s.lo) / (s.hi - s.lo || 1)) * (s.at.length - 1)
  );
  const medW = wd(s.dens[medK]);
  return (
    <g
      className={dimClass(p.dimmed)}
      onPointerEnter={() => {
        p.onEnter({ i: p.i, x: p.cx, y: p.y(s.hi) - 8 });
      }}
    >
      <rect
        className="fill-transparent"
        x={p.left}
        y={p.top}
        width={p.bw}
        height={p.floor - p.top}
      />
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
          strokeWidth={2}
        />
      </g>
      <text
        className={`fade t-value ${p.hero ? "" : "fill-muted"}`}
        style={{ "--i": p.i + 4 }}
        x={p.cx + medW + 9}
        y={p.y(s.med)}
        dy="0.36em"
      >
        {p.valueText}
      </text>
      <text
        className={`t-label ${p.hero ? "" : "fill-muted"}`}
        x={p.cx}
        y={p.floor + 20}
        textAnchor="middle"
      >
        {p.group.label}
      </text>
    </g>
  );
};

/**
 * G19 Reply times. One filled density silhouette per group, mirrored around
 * its centre line; width = how many records sit at that value. A 2px
 * paper-coloured rung marks the median, printed beside it. The fastest group
 * (lowest median, or the highlight) is solid ink; the rest are hatched inside
 * a 1px outline.
 */
export const Violin = (props: ViolinProps) => {
  const data = props.data ?? violinDemo;
  const height = props.height ?? 420;
  const format = props.format ?? hours;
  const unit = props.unit ?? "tickets";
  const [hover, setHover] = useState<Hit | null>(null);
  const stats = useMemo(() => data.map((g) => statsOf(g)), [data]);
  const order = ranks(
    stats.map((s) => s.med),
    props.lowIsBest ?? true
  );
  const maxV = Math.max(...stats.map((s) => s.hi));
  const heroIndex = props.highlight ?? order.indexOf(0);
  const tex = useTextureIds("violin");
  const label = `Violins: ${data.map((g, i) => `${g.label} median ${format(stats[i].med)}`).join(", ")}`;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data[hover.i].label}</b> · median {format(stats[hover.i].med)} ·
            90% within {format(stats[hover.i].p90)} · {stats[hover.i].n} {unit}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        const m = {
          bottom: 32 + noteSpace(props.note, width - 16, 20),
          left: narrow ? 30 : 40,
          right: narrow ? 8 : 20,
          top: 12,
        };
        const y = scaleLinear()
          .domain([0, maxV])
          .nice()
          .range([height - m.bottom, m.top]);
        const x = scaleBand()
          .domain(data.map((g) => g.label))
          .range([m.left, width - m.right])
          .paddingInner(0.1)
          .paddingOuter(0.05);
        const bw = x.bandwidth();
        const floor = height - m.bottom;

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l4" />
            </defs>
            {y.ticks(4).map((t) => (
              <g key={t}>
                <line
                  className={t === 0 ? "hairline" : "grid-line"}
                  x1={m.left}
                  x2={width - m.right}
                  y1={crisp(y(t))}
                  y2={crisp(y(t))}
                />
                <text
                  className="t-axis"
                  x={m.left - 8}
                  y={y(t)}
                  dy="0.34em"
                  textAnchor="end"
                >
                  {format(t)}
                </text>
              </g>
            ))}
            {data.map((g, i) => (
              <Figure
                key={g.label}
                bw={bw}
                cx={(x(g.label) ?? 0) + bw * (narrow ? 0.38 : 0.4)}
                dimmed={hover !== null && hover.i !== i}
                fill={heroIndex === i ? "fill-hero" : "stroke-l5"}
                pattern={heroIndex === i ? undefined : paint(tex("hatch"))}
                floor={floor}
                group={g}
                hero={heroIndex === i}
                i={i}
                left={x(g.label) ?? 0}
                onEnter={setHover}
                stats={stats[i]}
                top={m.top}
                valueText={format(stats[i].med)}
                half={bw * (narrow ? 0.26 : 0.36)}
                y={y}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
