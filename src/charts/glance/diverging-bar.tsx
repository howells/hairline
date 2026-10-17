import { scaleBand, scaleLinear } from "d3-scale";

import { fmtInt } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { VGrid, VRule } from "../rules";
import { barPath } from "../shapes";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger } from "../util";
import { divergingBarDemo } from "./diverging-bar.data";
import type { DivergingDatum } from "./diverging-bar.data";
import { labelRoom } from "./util-a";

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

/** Tick step that gives roughly four gridlines a side. */
const tickStep = (ext: number) => {
  const [, next] = scaleLinear().domain([0, ext]).ticks(4);
  return next ?? 1;
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
    <DimGroup dim={p.dim} onPointerEnter={onPointerEnter}>
      <HitRect x={0} y={p.cy - p.band / 2} width={p.width} height={p.band} />
      <Label
        anchor="end"
        dy="0.35em"
        muted={!p.hero}
        voice="name"
        x={p.labelW}
        y={p.cy}
      >
        {p.d.label}
      </Label>
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
      <Label
        anchor={gain ? "start" : "end"}
        dy="0.35em"
        muted={!p.hero}
        order={p.i + 3}
        tier="series"
        voice="value"
        x={gain ? p.x1 + 8 : p.x1 - 8}
        y={p.cy}
      >
        {p.text}
      </Label>
    </DimGroup>
  );
};

/** A signed count with a true minus sign: +2,227, −3,787. */
const defaultFormat = (v: number) =>
  v === 0 ? "0" : `${v > 0 ? "+" : "−"}${fmtInt(Math.abs(v))}`;

interface ScaleSpec {
  hi: number;
  lo: number;
  m: { left: number; right: number };
  step: number;
  /** Width of the widest value label. */
  valueW: number;
  width: number;
}

/**
 * The value scale: zero-centred with room for losses, stretched so the longest
 * gain's value label ends at the plot's right edge.
 */
const valueScale = (s: ScaleSpec) => {
  const domain = [
    Math.floor(s.lo / s.step) * s.step - (s.lo < 0 ? s.step * 0.5 : 0),
    Math.ceil(s.hi / s.step) * s.step,
  ];
  const r0 = s.m.left + (s.lo < 0 ? 28 : 0);
  const edge = s.width - 4 - 8 - s.valueW;
  const r1 =
    s.hi > 0
      ? Math.min(
          s.width - 4,
          r0 + ((edge - r0) * (domain[1] - domain[0])) / (s.hi - domain[0])
        )
      : s.width - s.m.right;
  return scaleLinear().domain(domain).range([r0, r1]);
};

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

/**
 * G10 Names rising, falling. Signed values either side of a solid ink zero rule. The
 * biggest gain (or the highlight) is solid ink; other gains are hatched and
 * losses stippled, each inside a crisp 1px outline (or solid alert). Bar
 * ends are squared with a 2px corner.
 */
export const DivergingBar = (props: DivergingBarProps) => {
  const data = props.data ?? divergingBarDemo;
  const height = props.height ?? 340;
  const format = props.format ?? defaultFormat;
  const hover = useHover<number>();
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
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[format(data[hover.at.key].value)]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        // Names flush left of the plot; the longest gain's value ends flush right.
        const labelW =
          labelRoom(
            data.map((d) => d.label),
            "t-name"
          ) + 4;
        const valueW = labelRoom(
          data.map((d) => format(d.value)),
          "t-value"
        );
        const m = {
          bottom: 4 + noteSpace(props.note, width - 16, 24),
          left: labelW + 16,
          right: 40,
          top: 4,
        };
        const x = valueScale({ hi, lo, m, step, valueW, width });
        const y = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.top, height - m.bottom])
          .paddingInner(0.64)
          .paddingOuter(0.32);
        const zero = crisp(x(0));
        const ticks = gridTicks(x.domain(), step * (narrow ? 2 : 1));

        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={tex("hatch")} tone="fill-l3" />
              <Stipple id={tex("dots")} tone="fill-l3" />
            </defs>
            <VGrid
              xs={ticks.map((t) => x(t))}
              y0={m.top}
              y1={height - m.bottom}
            />
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
                  dim={hover.dim(i)}
                  text={format(d.value)}
                  onPointerEnter={() => {
                    hover.show(i, x(d.value), cy - bh / 2 - 2);
                  }}
                />
              );
            })}
            <VRule x={x(0)} y0={m.top} y1={height - m.bottom} />
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
