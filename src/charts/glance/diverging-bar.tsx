import { scaleBand, scaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { divergingBarDemo } from "./diverging-bar.data";
import type { DivergingDatum } from "./diverging-bar.data";
import { barPath, fmtSigned } from "./util-a";

interface DivergingBarProps {
  data?: DivergingDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Draw losses in the alert colour instead of a light ladder tone. */
  alertLosses?: boolean;
  note?: string;
  /** Index of the bar to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

/** Tick step that gives roughly four gridlines a side. */
const tickStep = (ext: number) => {
  if (ext > 60) {
    return 25;
  }
  return ext > 30 ? 10 : 5;
};

interface BarProps {
  d: DivergingDatum;
  i: number;
  cy: number;
  zero: number;
  x1: number;
  bh: number;
  fill: BarFill;
  labelW: number;
  width: number;
  band: number;
  dim: boolean;
  hero: boolean;
  text: string;
  onPointerEnter: () => void;
}

const DivergingRow = (p: BarProps) => {
  const gain = p.d.value >= 0;
  const { onPointerEnter } = p;
  return (
    <g className={dimClass(p.dim)} onPointerEnter={onPointerEnter}>
      <rect
        x={0}
        y={p.cy - p.band / 2}
        width={p.width}
        height={p.band}
        fill="transparent"
      />
      <text
        className={`t-name ${p.hero ? "" : "fill-muted"}`}
        x={p.labelW}
        y={p.cy}
        dy="0.35em"
        textAnchor="end"
      >
        {p.d.label}
      </text>
      <path
        className={`grow-x ${gain ? "" : "from-right"} ${p.fill.className}`}
        style={stagger(p.i, "series")}
        d={
          p.fill.pattern === undefined
            ? barPath(
                Math.min(p.zero, p.x1),
                p.cy - p.bh / 2,
                Math.abs(p.x1 - p.zero),
                p.bh,
                gain ? "right" : "left"
              )
            : barPath(
                crisp(Math.min(p.zero, p.x1)),
                crisp(p.cy - p.bh / 2),
                Math.round(Math.abs(p.x1 - p.zero)),
                Math.round(p.bh) - 1,
                gain ? "right" : "left"
              )
        }
        fill={p.fill.pattern}
        strokeWidth={1}
      />
      <text
        className={`fade t-value ${p.hero ? "" : "fill-muted"}`}
        style={stagger(p.i + 3, "series")}
        x={gain ? p.x1 + 8 : p.x1 - 8}
        y={p.cy}
        dy="0.35em"
        textAnchor={gain ? "start" : "end"}
      >
        {p.text}
      </text>
    </g>
  );
};

const defaultFormat = (v: number) => (v === 0 ? "0" : `${fmtSigned(v)}k`);

/** Gridlines every `every` units across the domain, both sides of zero. */
const gridTicks = ([d0, d1]: number[], every: number) => {
  const first = Math.ceil(d0 / every) * every;
  return Array.from(
    { length: Math.floor((d1 - first) / every) + 1 },
    (_, k) => first + k * every
  ).filter((t) => t !== 0);
};

interface BarFill {
  className: string;
  /** Engraved pattern fill, drawn inside a crisp 1px outline. */
  pattern?: string;
}

/** The hero in solid ink; gains hatched, losses stippled (or solid alert). */
const fillOf = (
  gain: boolean,
  hero: boolean,
  alert: boolean,
  tex: (name: string) => string
): BarFill => {
  if (hero) {
    return { className: "fill-hero" };
  }
  if (gain) {
    return { className: "stroke-l5 shape-crisp", pattern: paint(tex("hatch")) };
  }
  return alert
    ? { className: "fill-alert" }
    : { className: "stroke-l5 shape-crisp", pattern: paint(tex("dots")) };
};

/** Vertical gridlines at each tick, snapped to the pixel grid. */
const GridRules = (p: {
  ticks: number[];
  x: (v: number) => number;
  y0: number;
  y1: number;
}) => (
  <g>
    {p.ticks.map((t) => (
      <line
        key={t}
        className="grid-line"
        x1={crisp(p.x(t))}
        x2={crisp(p.x(t))}
        y1={p.y0}
        y2={p.y1}
      />
    ))}
  </g>
);

/**
 * G10 Net change. Signed values either side of a solid ink zero rule. The
 * biggest gain (or the highlight) is solid ink; other gains are hatched and
 * losses stippled, each inside a crisp 1px outline (or solid alert). Bar
 * ends are squared with a 2px corner.
 */
export const DivergingBar = (props: DivergingBarProps) => {
  const data = props.data ?? divergingBarDemo;
  const height = props.height ?? 340;
  const format = props.format ?? defaultFormat;
  const [tip, setTip] = useState<Tip | null>(null);
  const label = data.map((d) => `${d.label} ${format(d.value)}`).join(", ");
  const lo = Math.min(0, ...data.map((d) => d.value));
  const hi = Math.max(0, ...data.map((d) => d.value));
  const step = tickStep(Math.max(-lo, hi));
  const tex = useTextureIds("net");
  const heroIndex =
    props.highlight ?? data.findIndex((d) => d.value === hi && hi > 0);

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        const labelW = narrow ? 82 : 112;
        const m = {
          bottom: 4 + noteSpace(props.note, width - 16, 24),
          left: labelW + 16,
          right: 40,
          top: 4,
        };
        const x = scaleLinear()
          .domain([
            Math.floor(lo / step) * step - (lo < 0 ? step * 0.5 : 0),
            Math.ceil(hi / step) * step,
          ])
          .range([m.left + (lo < 0 ? 28 : 0), width - m.right]);
        const y = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.top, height - m.bottom])
          .paddingInner(0.64)
          .paddingOuter(0.32);
        const zero = crisp(x(0));
        const ticks = gridTicks(x.domain(), step * (narrow ? 2 : 1));

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l3" />
              <Stipple ground="fill-paper" id={tex("dots")} tone="fill-l3" />
            </defs>
            <GridRules ticks={ticks} x={x} y0={m.top} y1={height - m.bottom} />
            {data.map((d, i) => {
              const cy = (y(i) ?? 0) + y.bandwidth() / 2;
              const bh = Math.min(y.bandwidth(), 22);
              return (
                <DivergingRow
                  key={d.label}
                  d={d}
                  i={i}
                  cy={cy}
                  zero={zero}
                  x1={x(d.value)}
                  bh={bh}
                  fill={fillOf(
                    d.value >= 0,
                    heroIndex === i,
                    props.alertLosses === true,
                    tex
                  )}
                  hero={heroIndex === i}
                  labelW={labelW}
                  width={width}
                  band={y.step()}
                  dim={tip !== null && tip.i !== i}
                  text={format(d.value)}
                  onPointerEnter={() => {
                    setTip({ i, x: x(d.value), y: cy - bh / 2 - 2 });
                  }}
                />
              );
            })}
            <line
              className="hairline"
              x1={zero}
              x2={zero}
              y1={m.top}
              y2={height - m.bottom}
            />
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
