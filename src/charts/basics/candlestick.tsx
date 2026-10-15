import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useState } from "react";

import {
  dayTickLabels,
  fmtDay,
  fmtMoney,
  fmtPrice as fmtPrice2,
} from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, stagger } from "../util";
import { ValueGrid } from "../value-grid";
import { candlestickDemo } from "./candlestick.data";
import type { CandleDatum } from "./candlestick.data";
import { VALUE_AXIS_ROOM } from "./util-a";
import { inkWidth, isActive } from "./util-b";
import type { Tip } from "./util-b";

interface CandlestickProps {
  data?: CandleDatum[];
  /** Formats prices on the value axis. Defaults to the house money format. */
  format?: (v: number) => string;
  /**
   * Formats an exact price: the labelled highest high and lowest low, the
   * tooltip and the description. Defaults to dollars and cents, which a
   * share price needs and the whole-dollar money format would round away.
   */
  formatPrice?: (v: number) => string;
  height?: number;
  note?: string;
}

interface Layout {
  axisY: number;
  body: number;
  /** The frame's edges: gridlines and baseline span them. */
  left: number;
  narrow: boolean;
  right: number;
  x: ScaleBand<string>;
  y: ScaleLinear<number, number>;
}

const keyOf = (d: CandleDatum) => d.date.toISOString();

/** Margin kept between the ink and the svg edge. */
const EDGE = 2;

/** The Mondays that carry a tick: all of them, or every other when narrow. */
const shownMondays = (data: CandleDatum[], narrow: boolean) => {
  const mondays = data.filter((d) => d.date.getUTCDay() === 1);
  return narrow ? mondays.filter((_, k) => k % 2 === 0) : mondays;
};

const buildLayout = (
  width: number,
  height: number,
  data: CandleDatum[],
  domain: [number, number],
  hasNote: boolean,
  /** The highest high and lowest low, with the price each is labelled by. */
  priced: { d: CandleDatum; text: string }[]
): Layout => {
  const bandsFor = (frameW: number) =>
    scaleBand()
      .domain(data.map(keyOf))
      .range([0, frameW - VALUE_AXIS_ROOM])
      .paddingInner(0.1)
      .paddingOuter(0.4);
  // How far the centred labels (dates, highest and lowest price) reach past
  // the frame's left edge, which the frame then makes room for.
  const overhang = (frameW: number) => {
    const x = bandsFor(frameW);
    const bw = x.bandwidth();
    const shown = shownMondays(data, bw < 12);
    const dates = dayTickLabels(shown.map((d) => d.date));
    const labels = [
      ...shown.map((d, k) => ({ d, text: dates[k] ?? "" })),
      ...priced,
    ];
    return Math.max(
      0,
      ...labels.map(
        (l) => Math.ceil(inkWidth(l.text)) / 2 - ((x(keyOf(l.d)) ?? 0) + bw / 2)
      )
    );
  };
  const cap = data.length * 26 + VALUE_AXIS_ROOM;
  let frameW = Math.min(width - EDGE * 2, cap);
  for (let k = 0; k < 3; k += 1) {
    frameW = Math.min(width - EDGE * 2 - overhang(frameW), cap);
  }
  const over = overhang(frameW);
  const left = Math.round((width - frameW - over) / 2 + over);
  const right = left + frameW;
  const axisY = Math.round(height - (hasNote ? 78 : 32));
  const x = bandsFor(frameW).range([left, right - VALUE_AXIS_ROOM]);
  const bw = x.bandwidth();
  return {
    axisY,
    body: Math.max(3, Math.min(14, bw * 0.62)),
    left,
    narrow: bw < 12,
    right,
    x,
    // Room under the lowest wick for its price label.
    y: scaleLinear()
      .domain(domain)
      .range([axisY - 28, 30]),
  };
};

const centre = (layout: Layout, d: CandleDatum): number =>
  (layout.x(keyOf(d)) ?? 0) + layout.x.bandwidth() / 2;

/** The baseline and a tick on each Monday (every other when narrow), dated broadsheet-style. */
const DayAxis = (props: { data: CandleDatum[]; layout: Layout }) => {
  const { layout } = props;
  const shown = shownMondays(props.data, layout.narrow);
  const labels = dayTickLabels(shown.map((d) => d.date));
  return (
    <g>
      <line
        className="hairline"
        x1={layout.left}
        x2={layout.right}
        y1={crisp(layout.axisY)}
        y2={crisp(layout.axisY)}
      />
      {shown.map((d, k) => (
        <g key={keyOf(d)}>
          <line
            className="hairline"
            x1={crisp(centre(layout, d))}
            x2={crisp(centre(layout, d))}
            y1={layout.axisY + 1}
            y2={layout.axisY + 6}
          />
          <text
            className="t-axis"
            textAnchor="middle"
            x={centre(layout, d)}
            y={layout.axisY + 20}
          >
            {labels[k]}
          </text>
        </g>
      ))}
    </g>
  );
};

interface CandleProps {
  datum: CandleDatum;
  /** Pattern id of the hatch inside falling bodies. */
  hatch: string;
  hero: boolean;
  hover: string | null;
  index: number;
  layout: Layout;
  onHover: (tip: Tip<CandleDatum>) => void;
}

/** Body outline: hairline, or the 2px emphasis width on the hero. */
const outline = (hero: boolean) => (hero ? 2 : 1);

const Candle = (props: CandleProps) => {
  const { datum, layout } = props;
  const { y } = layout;
  const cx = centre(layout, datum);
  const bw = layout.x.bandwidth();
  const up = datum.close >= datum.open;
  // An odd width keeps the body centred on the wick's pixel column.
  const w = 2 * Math.floor(layout.body / 2) + 1;
  const x0 = Math.round(cx) - Math.floor(w / 2);
  const y0 = Math.round(y(Math.max(datum.open, datum.close)));
  // A flat day still gets a visible sliver.
  const h = Math.max(3, Math.round(y(Math.min(datum.open, datum.close))) - y0);
  // Up: hollow. Down: hatch on paper inside a 1px l5 rule, or solid ink on the hero.
  const hatched = !up && !props.hero;
  const s = up ? outline(props.hero) : Number(hatched);
  const solid = props.hero ? "fill-hero" : "stroke-l5";
  const hollow = props.hero ? "fill-paper stroke-hero" : "fill-paper stroke-l3";
  return (
    <g
      className={dimClass(isActive(props.hover, keyOf(datum)) === false)}
      onPointerEnter={() => {
        props.onHover({ item: datum, x: cx, y: y(datum.high) - 8 });
      }}
    >
      <rect
        className="fill-transparent"
        height={y(datum.low) - y(datum.high) + 12}
        width={bw + 2}
        x={cx - bw / 2 - 1}
        y={y(datum.high) - 6}
      />
      <line
        className={`fade shape-crisp ${props.hero ? "stroke-hero" : "stroke-l3"}`}
        strokeWidth={1}
        style={stagger(props.index, "mark")}
        x1={crisp(cx)}
        x2={crisp(cx)}
        y1={Math.round(y(datum.high))}
        y2={Math.round(y(datum.low))}
      />
      <rect
        className={`grow-y ${up ? hollow : solid}`}
        fill={hatched ? paint(props.hatch) : undefined}
        height={h - s}
        rx={2 - s / 2}
        strokeWidth={s}
        style={stagger(props.index, "mark")}
        width={w - s}
        x={x0 + s / 2}
        y={y0 + s / 2}
      />
    </g>
  );
};

/**
 * F17 Daily price. Open-high-low-close per period: the body runs open to
 * close (hollow = closed up, hatched = closed down), the wick is the full
 * reach. Every candle is one grey; the latest is in ink. The highest high and
 * lowest low carry their price.
 */
export const Candlestick = (props: CandlestickProps) => {
  const data = props.data ?? candlestickDemo;
  const height = props.height ?? 420;
  const format = props.format ?? fmtMoney;
  const fmtPrice = props.formatPrice ?? fmtPrice2;
  const [tip, setTip] = useState<Tip<CandleDatum> | null>(null);
  const ids = useTextureIds("candle");
  const lo = Math.min(...data.map((d) => d.low));
  const hi = Math.max(...data.map((d) => d.high));
  const top = data.find((d) => d.high === hi);
  const bottom = data.find((d) => d.low === lo);
  // A price scale on whole, even steps that holds every wick.
  const scale = scaleLinear().domain([lo, hi]).nice(5);
  const [d0 = lo, d1 = hi] = scale.domain();
  const ticks = scale.ticks(5);
  const label = `Daily prices, ${data.length} days, from ${fmtPrice(data[0]?.open ?? 0)} to ${fmtPrice(data.at(-1)?.close ?? 0)}; high ${fmtPrice(hi)}, low ${fmtPrice(lo)}`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{fmtDay(tip.item.date)}</b> · O {fmtPrice(tip.item.open)} · H{" "}
            {fmtPrice(tip.item.high)} · L {fmtPrice(tip.item.low)} · C{" "}
            {fmtPrice(tip.item.close)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = buildLayout(
          width,
          height,
          data,
          [d0, d1],
          props.note !== undefined,
          [top, bottom].flatMap((d, k) =>
            d === undefined ? [] : [{ d, text: fmtPrice(k === 0 ? hi : lo) }]
          )
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
              <Hatch ground="fill-paper" id={ids("hatch")} tone="fill-l3" />
            </defs>
            <ValueGrid
              labelFloor
              side="right"
              floor={layout.axisY}
              format={format}
              ticks={ticks}
              x0={layout.left}
              x1={layout.right}
              y={layout.y}
            />
            <DayAxis data={data} layout={layout} />
            {data.map((d, i) => (
              <Candle
                hatch={ids("hatch")}
                datum={d}
                hero={i === data.length - 1}
                hover={tip === null ? null : keyOf(tip.item)}
                index={i}
                key={keyOf(d)}
                layout={layout}
                onHover={setTip}
              />
            ))}
            {top === undefined ? null : (
              <text
                className="fade t-axis"
                style={stagger(10)}
                textAnchor="middle"
                x={centre(layout, top)}
                y={layout.y(hi) - 10}
              >
                {fmtPrice(hi)}
              </text>
            )}
            {bottom === undefined ? null : (
              <text
                className="fade t-axis t-halo"
                style={stagger(10)}
                textAnchor="middle"
                x={centre(layout, bottom)}
                y={layout.y(lo) + 18}
              >
                {fmtPrice(lo)}
              </text>
            )}
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
