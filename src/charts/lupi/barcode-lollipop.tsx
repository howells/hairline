import { format as d3format } from "d3-format";
import { scaleLinear } from "d3-scale";
import { useState } from "react";
import type { PointerEvent } from "react";

import { monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { clamp, dimClass, noteSpace, sansWidth, stagger } from "../util";
import { barcodeLollipopDemo } from "./barcode-lollipop.data";
import type { BarcodeDatum } from "./barcode-lollipop.data";
import { argMax } from "./util-b";

interface BarcodeLollipopProps {
  data?: BarcodeDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Ignored: the margin paragraph is no longer drawn. */
  aside?: string;
  /** How many top days to label. Default 3. */
  top?: number;
}

interface DayTip {
  i: number;
  x: number;
  y: number;
}

const twoDp = d3format(".2f");
const metres = (v: number) => `${twoDp(v)} m`;
const dayFmt = (d: Date) =>
  d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });

interface TopLabel {
  i: number;
  w: number;
  x: number;
  y: number;
}

/**
 * Centre x of each top-day label, pushed apart sideways where two would
 * overlap (adjacent peaks at similar heights), then kept inside [lo, hi].
 */
const spreadLabels = (labels: TopLabel[], lo: number, hi: number) => {
  const placed = labels.map((l) => ({ ...l })).toSorted((a, b) => a.x - b.x);
  const clash = (a: TopLabel, b: TopLabel) => Math.abs(a.y - b.y) < 14;
  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false;
    for (const [k, b] of placed.entries()) {
      const a = placed[k - 1];
      const overlap = a === undefined ? 0 : a.x + a.w / 2 + 6 - (b.x - b.w / 2);
      if (a !== undefined && overlap > 0.5 && clash(a, b)) {
        a.x -= overlap / 2;
        b.x += overlap / 2;
        moved = true;
      }
    }
    for (const l of placed) {
      l.x = clamp(l.x, lo + l.w / 2, hi - l.w / 2);
    }
    if (!moved) {
      break;
    }
  }
  return new Map(placed.map((l) => [l.i, l.x]));
};

/** A top day's value label, centred over its dot, before any spreading. */
const topLabel = (
  i: number,
  datum: BarcodeDatum,
  format: (v: number) => string,
  x: (i: number) => number,
  y: (v: number) => number
): TopLabel => ({
  i,
  w: sansWidth(format(datum.value), 12),
  x: x(i),
  y: y(datum.value),
});

interface DayMarkProps {
  datum: BarcodeDatum;
  dim: boolean;
  dotR: number;
  format: (v: number) => string;
  /** The highest day: the one mark in ink. */
  hero: boolean;
  i: number;
  isTop: boolean;
  /** Centre of the value label, when it had to move off the dot. */
  labelX: number | undefined;
  low: number;
  x: number;
  y: (v: number) => number;
}

const DayMark = ({
  datum,
  dim,
  dotR,
  format,
  hero,
  i,
  isTop,
  labelX,
  low,
  x,
  y,
}: DayMarkProps) => {
  const cy = y(datum.value);
  const r = hero ? 4.5 : dotR;
  // A 2px stem sits on whole pixels, a 1px one on the half pixel.
  const stemX = hero ? Math.round(x) : crisp(x);
  return (
    <g className={dimClass(dim)}>
      <line
        className={`grow-y from-top shape-crisp ${hero ? "stroke-hero" : "stroke-l4"}`}
        strokeWidth={hero ? 2 : 1}
        style={stagger(i, "dense")}
        x1={stemX}
        x2={stemX}
        y1={cy}
        y2={y(low)}
      />
      <circle
        className={`pop ${hero ? "fill-hero" : "fill-l2"}`}
        cx={stemX}
        cy={cy}
        r={r}
        style={stagger(i, "dense")}
      />
      {isTop ? (
        <text
          className={`fade t-halo ${hero ? "t-value" : "t-axis"}`}
          textAnchor="middle"
          x={labelX ?? x}
          y={cy - r - 8}
        >
          {format(datum.value)}
        </text>
      ) : null}
    </g>
  );
};

/** A label under the first day and each month's first day, broadsheet style. */
const MonthTicks = (props: {
  data: BarcodeDatum[];
  floor: number;
  x: (i: number) => number;
}) => {
  const starts = props.data.flatMap((d, i) =>
    i === 0 || d.date.getUTCDate() === 1 ? [i] : []
  );
  const labels = monthTickLabels(starts.map((i) => props.data[i].date));
  return (
    <g>
      {starts.map((i, k) => (
        <text
          className="t-axis"
          key={`month-${props.data[i].date.toISOString()}`}
          x={props.x(i)}
          y={props.floor + 22}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

/** The barcode: one hairline per calendar day, plus month labels. */
const Barcode = (props: {
  data: BarcodeDatum[];
  floor: number;
  hover: number | null;
  top: number;
  x: (i: number) => number;
}) => (
  <g>
    {props.data.map((d, i) => (
      <line
        className={`grow-y ${props.hover === i ? "stroke-l5 shape-crisp" : "grid-line"}`}
        key={`bar-${d.date.toISOString()}`}
        style={stagger(i, "dense")}
        x1={crisp(props.x(i))}
        x2={crisp(props.x(i))}
        y1={props.top}
        y2={props.floor}
      />
    ))}
    <MonthTicks data={props.data} floor={props.floor} x={props.x} />
  </g>
);

/**
 * L3 Autumn tides. A vertical hairline for every day (the barcode), a
 * lollipop dot at each day's high water with a stem down to its low water, so
 * the stem is the day's range and the fortnightly spring and neap swell shows
 * in the stem lengths. The highest high waters are labelled.
 */
export const BarcodeLollipop = (props: BarcodeLollipopProps) => {
  const data = props.data ?? barcodeLollipopDemo;
  const height = props.height ?? 440;
  const format = props.format ?? metres;
  const topN = props.top ?? 3;
  const [tip, setTip] = useState<DayTip | null>(null);
  const lows = data.map((d) => d.low ?? d.value * 0.9);
  const top = new Set(
    data
      .map((d, i) => ({ i, v: d.value }))
      .toSorted((a, b) => b.v - a.v)
      .slice(0, topN)
      .map((d) => d.i)
  );

  const peak = argMax(data.map((d) => d.value));

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{dayFmt(data[tip.i].date)}</b> · high {format(data[tip.i].value)}{" "}
            · low {format(lows[tip.i])}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const m = {
          bottom: 30 + noteSpace(props.note, width - 12, 20),
          left: 4,
          right: 8,
          top: 10,
        };
        const floor = height - m.bottom;
        const step = (width - m.left - m.right) / Math.max(1, data.length - 1);
        const x = (i: number) => m.left + i * step;
        const y = scaleLinear()
          .domain([Math.min(...lows), Math.max(...data.map((d) => d.value))])
          .range([floor - 6, m.top + 22]);
        const dotR = step >= 8 ? 3 : 2;
        const labelX = spreadLabels(
          [...top].map((i) => topLabel(i, data[i], format, x, y)),
          m.left - step / 2,
          width - 2
        );
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
          if (px < m.left - step || px > width - m.right + step) {
            setTip(null);
            return;
          }
          const i = clamp(Math.round((px - m.left) / step), 0, data.length - 1);
          setTip({ i, x: x(i), y: y(data[i].value) - dotR - 6 });
        };

        return (
          <svg
            aria-label={`Daily high and low water over ${data.length} days. Highest high water: ${[...top].map((i) => `${dayFmt(data[i].date)} ${format(data[i].value)}`).join(", ")}`}
            height={height}
            onPointerLeave={() => {
              setTip(null);
            }}
            onPointerMove={onMove}
            width={width}
          >
            <title>
              One hairline per day, a lollipop at each day&apos;s high water
            </title>
            <Barcode
              data={data}
              floor={floor}
              hover={tip === null ? null : tip.i}
              top={m.top}
              x={x}
            />
            {data.map((d, i) => (
              <DayMark
                datum={d}
                dim={tip !== null && tip.i !== i}
                dotR={dotR}
                format={format}
                i={i}
                hero={i === peak}
                isTop={top.has(i)}
                labelX={labelX.get(i)}
                key={`day-${d.date.toISOString()}`}
                low={lows[i]}
                x={x(i)}
                y={y}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - m.left - m.right}
              x={(m.left + width - m.right) / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
