import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Ring } from "../markers";
import { MARK_WEIGHT } from "../marks";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, stagger } from "../util";
import { tickBoxDemo } from "./tick-box.data";
import type { BoxDatum } from "./tick-box.data";
import { inkWidth, isActive } from "./util-b";
import type { Tip } from "./util-b";

interface TickBoxProps {
  data?: BoxDatum[];
  /** "low" (default) puts the lowest median in ink; "high" the highest. */
  darkest?: "high" | "low";
  format?: (v: number) => string;
  height?: number;
  note?: string;
  /** Axis ticks; defaults to five even steps. */
  ticks?: number[];
}

interface Layout {
  boxW: number;
  cap: number;
  floor: number;
  narrow: boolean;
  plotW: number;
  px0: number;
  ticks: number[];
  top: number;
  x: ScaleBand<string>;
  y: ScaleLinear<number, number>;
}

/** Pattern kinds: diagonal hatch for the boxes, crosshatch for the hero. */
const TEXTURES = ["cross", "hatch"] as const;

/** Margin kept between the ink and the svg edge. */
const EDGE = 2;

const buildLayout = (
  width: number,
  height: number,
  data: BoxDatum[],
  hasNote: boolean,
  format: (v: number) => string,
  customTicks: number[] | undefined
): Layout => {
  const top = 14;
  const hi = Math.max(...data.flatMap((d) => [d.max, ...(d.outliers ?? [])]));
  const scale = scaleLinear().domain([0, hi]).nice(4);
  const ticks = customTicks ?? scale.ticks(4);
  // The tick values end 16px left of the plot.
  const tickW =
    16 + Math.max(0, ...ticks.map((t) => Math.ceil(inkWidth(format(t)))));
  const bandsFor = (plotW: number) =>
    scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, plotW])
      .paddingInner(0.3)
      .paddingOuter(0.25);
  // How far the ink reaches past the plot's left and right edges: the tick
  // values, the end labels, and (when there's room beside each box) the median.
  const reach = (plotW: number) => {
    const band = bandsFor(plotW);
    const boxW = Math.min(50, band.bandwidth() * 0.55);
    const wide = plotW / data.length >= 110;
    let l = tickW;
    let r = 0;
    for (const d of data) {
      const cx = (band(d.label) ?? 0) + band.bandwidth() / 2;
      const half = Math.ceil(inkWidth(d.label)) / 2;
      l = Math.max(l, half - cx);
      r = Math.max(
        r,
        cx + half - plotW,
        wide ? cx + boxW / 2 + 10 + inkWidth(format(d.median)) - plotW : 0
      );
    }
    return { l, r };
  };
  const cap = data.length * 160;
  let plotW = Math.min(width - EDGE * 2 - tickW, cap);
  for (let k = 0; k < 3; k += 1) {
    const { l, r } = reach(plotW);
    plotW = Math.min(width - EDGE * 2 - l - r, cap);
  }
  const { l, r } = reach(plotW);
  // Narrow: no room beside each box, so the median moves under its label.
  const narrow = plotW / data.length < 110;
  const bottom = (hasNote ? 70 : 34) + (narrow ? 16 : 0);
  const y = scale.copy().range([height - bottom, top]);
  const px0 = (width - l - plotW - r) / 2 + l;
  const x = bandsFor(plotW).range([px0, px0 + plotW]);
  const boxW = Math.min(50, x.bandwidth() * 0.55);
  return {
    boxW,
    cap: Math.min(14, boxW * 0.45),
    floor: y.range()[0] ?? height,
    narrow,
    plotW,
    px0,
    ticks,
    top,
    x,
    y,
  };
};

const Grid = (props: {
  format: (v: number) => string;
  layout: Layout;
  ticks: number[];
}) => {
  const { layout } = props;
  return (
    <g>
      {props.ticks.map((t) => (
        <g key={t}>
          <line
            className={t === 0 ? "hairline" : "grid-line"}
            x1={Math.round(layout.px0 - 8)}
            x2={Math.round(layout.px0 + layout.plotW)}
            y1={crisp(layout.y(t))}
            y2={crisp(layout.y(t))}
          />
          <text
            className="t-axis"
            dy="0.34em"
            textAnchor="end"
            x={layout.px0 - 16}
            y={layout.y(t)}
          >
            {props.format(t)}
          </text>
        </g>
      ))}
    </g>
  );
};

/** Whisker lines and their cap ticks. */
const Whiskers = (props: {
  cx: number;
  datum: BoxDatum;
  index: number;
  layout: Layout;
}) => {
  const { cx, datum, layout } = props;
  const { cap, y } = layout;
  const x = crisp(cx);
  const capL = Math.round(cx - cap);
  const capR = Math.round(cx + cap) + 1;
  return (
    <g
      className="fade stroke-l3 shape-crisp"
      strokeWidth={1}
      style={stagger(props.index + 2, "series")}
    >
      <line x1={x} x2={x} y1={crisp(y(datum.max))} y2={y(datum.q3)} />
      <line x1={x} x2={x} y1={y(datum.q1)} y2={crisp(y(datum.min))} />
      <line
        x1={capL}
        x2={capR}
        y1={crisp(y(datum.max))}
        y2={crisp(y(datum.max))}
      />
      <line
        x1={capL}
        x2={capR}
        y1={crisp(y(datum.min))}
        y2={crisp(y(datum.min))}
      />
    </g>
  );
};

interface GroupProps {
  datum: BoxDatum;
  hero: boolean;
  /** Pattern ids: diagonal hatch for the boxes, crosshatch for the hero. */
  textures: (name: (typeof TEXTURES)[number]) => string;
  format: (v: number) => string;
  hover: string | null;
  index: number;
  layout: Layout;
  onHover: (tip: Tip<BoxDatum>) => void;
}

const Group = (props: GroupProps) => {
  const { datum, layout, index } = props;
  const { boxW, y } = layout;
  const bw = layout.x.bandwidth();
  const cx = (layout.x(datum.label) ?? 0) + bw / 2;
  const yq3 = Math.round(y(datum.q3));
  const boxH = Math.max(2, Math.round(y(datum.q1)) - yq3);
  const boxX = Math.round(cx - boxW / 2);
  const boxR = Math.round(boxW);
  return (
    <g
      className={dimClass(isActive(props.hover, datum.label) === false)}
      onPointerEnter={() => {
        props.onHover({ item: datum, x: cx, y: y(datum.max) - 10 });
      }}
    >
      <rect
        className="fill-transparent"
        height={layout.floor - layout.top + 24}
        width={bw}
        x={cx - bw / 2}
        y={layout.top}
      />
      <Whiskers cx={cx} datum={datum} index={index} layout={layout} />
      <rect
        className={`grow-y shape-crisp ${props.hero ? "stroke-hero" : "stroke-l5"}`}
        fill={paint(
          props.hero ? props.textures("cross") : props.textures("hatch")
        )}
        height={boxH - 1}
        rx={Math.min(boxH, boxR) < 24 ? 1.5 : 3.5}
        strokeWidth={1}
        style={stagger(index, "series")}
        width={boxR - 1}
        x={boxX + 0.5}
        y={yq3 + 0.5}
      />
      {props.hero ? (
        // A paper gutter cut through the crosshatch, so the ink median reads.
        <rect
          className="grow-x fill-paper"
          height={6}
          style={stagger(index + 3, "series")}
          width={boxR - 2}
          x={boxX + 1}
          y={Math.round(y(datum.median)) - 3}
        />
      ) : null}
      <rect
        className={`grow-x ${props.hero ? "fill-hero" : "fill-l2"}`}
        height={MARK_WEIGHT}
        style={stagger(index + 3, "series")}
        width={Math.max(MARK_WEIGHT, boxR - 12)}
        x={boxX + 6}
        y={Math.round(y(datum.median)) - MARK_WEIGHT / 2}
      />
      {(datum.outliers ?? []).map((o, j) => (
        <Ring
          className="pop stroke-l3"
          cx={crisp(cx)}
          cy={y(o)}
          key={o}
          size="sm"
          style={stagger(index * 3 + j + 6, "mark")}
        />
      ))}
      <text
        className="fade t-value"
        dy="0.34em"
        style={stagger(index + 3, "series")}
        textAnchor={layout.narrow ? "middle" : "start"}
        x={layout.narrow ? cx : cx + boxW / 2 + 10}
        y={layout.narrow ? layout.floor + 38 : y(datum.median)}
      >
        {props.format(datum.median)}
      </text>
      <text
        className="t-label fill-muted"
        textAnchor="middle"
        x={cx}
        y={layout.floor + 22}
      >
        {datum.label}
      </text>
    </g>
  );
};

const describe = (d: BoxDatum, format: (v: number) => string): string => {
  const n = d.outliers?.length ?? 0;
  const tail = n > 0 ? ` · ${n} outlier${n > 1 ? "s" : ""}` : "";
  return `median ${format(d.median)} · middle half ${format(d.q1)}–${format(d.q3)}${tail}`;
};

/**
 * F15 Box plot. The box is the middle half, diagonal hatch on paper inside a
 * 1px rule; a 2px rung marks the median, whiskers and caps are
 * hairlines, outliers are hollow. The lowest median (or highest, with
 * `darkest`) is crosshatched in ink, its median an ink rung in a paper gutter.
 */
export const TickBox = (props: TickBoxProps) => {
  const data = props.data ?? tickBoxDemo;
  const height = props.height ?? 400;
  const format = props.format ?? String;
  const [tip, setTip] = useState<Tip<BoxDatum> | null>(null);
  const textures = useTextureIds("box");
  const [hero] = data.toSorted((a, b) =>
    props.darkest === "high" ? b.median - a.median : a.median - b.median
  );
  const label = data
    .map((d) => `${d.label}: ${describe(d, format)}`)
    .join("; ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tip.item.label}</b> · {describe(tip.item, format)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = buildLayout(
          width,
          height,
          data,
          props.note !== undefined,
          format,
          props.ticks
        );
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <defs>
              <Hatch id={textures("hatch")} tone="fill-l4" />
              <CrossHatch id={textures("cross")} tone="fill-hero" />
            </defs>
            <Grid format={format} layout={layout} ticks={layout.ticks} />
            {data.map((d, i) => (
              <Group
                datum={d}
                hero={d === hero}
                textures={textures}
                format={format}
                hover={tip?.item.label ?? null}
                index={i}
                key={d.label}
                layout={layout}
                onHover={setTip}
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
