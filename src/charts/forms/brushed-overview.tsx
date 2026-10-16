import { scaleLinear, scaleUtc } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { curveMonotoneX, line } from "d3-shape";
import { utcFormat } from "d3-time-format";
import { useState } from "react";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtDegC, monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Dot } from "../markers";
import { STEM } from "../marks";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, weeklyMean } from "../util";
import { ValueGrid } from "../value-grid";
import type { Span } from "./brush-math";
import { BrushStrip } from "./brush-strip";
import { activeDaysDemo } from "./brushed-overview.data";
import type { DayValue } from "./brushed-overview.data";

const fmtDay = utcFormat("%a %-d %b");
/** A difference in degrees, always signed ("+15.6 °C", "−2.1 °C"). */
const fmtSigned = (v: number) => {
  const t = Math.abs(v).toFixed(1);
  return `${v < 0 && t !== "0.0" ? "−" : "+"}${t} °C`;
};
/** Value rules at whole degrees need no decimal ("30 °C"). */
const fmtTick = (v: number) => fmtDegC(v).replace(".0 °C", " °C");
/** Days either side of the window's centre when it opens. */
const OPEN_HALF = 31;

/**
 * Left end of the detail and the strip: flush with the column. The start
 * grip's invisible 44px hit area hangs out past it.
 */
const X0 = 0;
/** The right-hand value column, which the end grip's 22px also fits in. */
const AXIS = 40;
const DETAIL_H = 360;

/** Month ticks when the window spans whole months, else days ("5 Oct · 12"). */
const tickLabels = (dates: Date[]) =>
  dates.every((d) => d.getUTCDate() === 1)
    ? monthTickLabels(dates)
    : dayTickLabels(dates);

interface Hover {
  i: number;
  x: number;
  y: number;
}

interface DetailProps {
  data: DayValue[];
  hover: number | null;
  mean: number[];
  setHover: (h: Hover | null) => void;
  span: Span;
  width: number;
}

/** Date ticks along the floor, sized to the room. */
const DateTicks = (props: {
  floor: number;
  span: Span;
  data: DayValue[];
  x0: number;
  x1: number;
}) => {
  const t = scaleUtc()
    .domain([props.data[props.span.a].date, props.data[props.span.b].date])
    .range([props.x0, props.x1]);
  // Keep every date whole inside the plot's ends.
  const ticks = t
    .ticks(Math.max(2, Math.floor((props.x1 - props.x0) / 90)))
    .filter((d) => t(d) > props.x0 + 18 && t(d) < props.x1 - 18);
  const labels = tickLabels(ticks);
  return (
    <g>
      {ticks.map((d, k) => (
        <text
          className="t-axis"
          key={d.toISOString()}
          textAnchor="middle"
          x={t(d)}
          y={props.floor + 22}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

const stemClass = (peak: boolean, hover: boolean) => {
  if (peak) {
    return "stroke-ink";
  }
  return hover ? "stroke-l1" : "stroke-l4";
};

interface StemsProps {
  data: DayValue[];
  hover: number | null;
  mean: number[];
  peak: number;
  span: Span;
  x: (i: number) => number;
  y: ScaleLinear<number, number>;
}

/** One 1px stem a day, from its 7-day average out to the day's maximum. */
const Stems = (props: StemsProps) => (
  <g className="fade">
    {props.data.slice(props.span.a, props.span.b + 1).map((d, k) => {
      const i = props.span.a + k;
      const peak = i === props.peak;
      const at = peak ? Math.round(props.x(i)) : crisp(props.x(i));
      return (
        <line
          className={`transition-tone shape-crisp ${stemClass(peak, props.hover === i)}`}
          key={d.date.toISOString()}
          strokeWidth={peak ? STEM.hero : STEM.rest}
          x1={at}
          x2={at}
          y1={props.y(props.mean[i])}
          y2={props.y(d.value)}
        />
      );
    })}
  </g>
);

/** The window, redrawn: the calm weekly mean, each day a stem off it. */
const Detail = (props: DetailProps) => {
  const tex = useTextureIds("detail");
  const { a, b } = props.span;
  const values = props.data.slice(a, b + 1).map((d) => d.value);
  const means = props.mean.slice(a, b + 1);
  const peak = a + values.indexOf(Math.max(...values));
  const x1 = props.width - AXIS;
  const floor = DETAIL_H - 34;
  const x = scaleLinear().domain([a, b]).range([X0, x1]);
  const y = scaleLinear()
    .domain([Math.min(...values, ...means), Math.max(...values, ...means)])
    .nice(4)
    .range([floor - 8, 28]);
  const path =
    line<number>()
      .x((_, k) => x(a + k))
      .y((m) => y(m))
      .curve(curveMonotoneX)(means) ?? "";
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = clamp(Math.round(x.invert(px)), a, b);
    const top = Math.min(y(props.data[i].value), y(props.mean[i]));
    props.setHover({ i, x: x(i), y: top - 6 });
  };
  const label = `Daily maximum temperature, ${fmtDay(props.data[a].date)} to ${fmtDay(props.data[b].date)}, with the 7-day average: hottest ${fmtDegC(props.data[peak].value)} on ${fmtDay(props.data[peak].date)}`;
  return (
    <svg
      aria-label={label}
      className="touch-pan-y"
      height={DETAIL_H}
      onPointerLeave={() => {
        props.setHover(null);
      }}
      onPointerMove={onMove}
      width={props.width}
    >
      <title>{label}</title>
      <defs>
        <clipPath id={tex("plot")}>
          <rect height={DETAIL_H} width={x1 - X0 + 8} x={X0 - 4} y={0} />
        </clipPath>
      </defs>
      <ValueGrid
        floor={floor}
        ticks={y.ticks(4)}
        format={fmtTick}
        side="right"
        x0={X0}
        x1={props.width}
        y={y}
      />
      <line
        className="hairline"
        x1={X0}
        x2={props.width}
        y1={crisp(floor)}
        y2={crisp(floor)}
      />
      <DateTicks
        data={props.data}
        floor={floor}
        span={props.span}
        x0={X0}
        x1={x1}
      />
      <Stems
        data={props.data}
        hover={props.hover}
        mean={props.mean}
        peak={peak}
        span={props.span}
        x={x}
        y={y}
      />
      <path
        className="draw stroke-l2 stroke-medium cap-round fill-none"
        clipPath={paint(tex("plot"))}
        d={path}
        pathLength={1}
      />
      {props.hover === null || props.hover === peak ? null : (
        <Dot
          className="fill-l2"
          cx={crisp(x(props.hover))}
          cy={y(props.data[props.hover].value)}
          size="sm"
        />
      )}
      <Dot
        className="pop fill-hero"
        cx={Math.round(x(peak))}
        cy={y(props.data[peak].value)}
        size="md"
      />
      <text
        className="fade t-value t-halo"
        textAnchor="middle"
        x={clamp(x(peak), X0 + 16, x1 - 16)}
        y={y(props.data[peak].value) - 10}
      >
        {fmtDegC(props.data[peak].value)}
      </text>
    </svg>
  );
};

/**
 * O8 Overview and detail. A year of daily maximum temperatures as a thin
 * strip, drawn as its 7-day average so the year reads as one smooth
 * silhouette; the outlined window on it chooses the days the detail above
 * draws: the average as a calm line, each day a stem off it, the window's
 * hottest day in ink, read off a right-hand scale. Opens on a two-month
 * window centred on the year's hottest day.
 */
export const BrushedOverview = (props: { data?: DayValue[] }) => {
  const data = props.data ?? activeDaysDemo;
  const mean = weeklyMean(
    data.map((d) => d.value),
    "trailing"
  );
  const last = data.length - 1;
  const top = Math.max(...data.map((d) => d.value));
  const hottest = data.findIndex((d) => d.value === top);
  const [span, setSpan] = useState<Span>({
    a: clamp(hottest - OPEN_HALF, 0, last),
    b: clamp(hottest + OPEN_HALF, 0, last),
  });
  const [hover, setHover] = useState<Hover | null>(null);
  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{fmtDay(data[hover.i].date)}</b> · {fmtDegC(data[hover.i].value)}{" "}
            · {fmtSigned(data[hover.i].value - mean[hover.i])} vs 7-day average
          </Tooltip>
        )
      }
    >
      {(width) => (
        <div className="flex flex-col gap-4">
          <Detail
            data={data}
            hover={hover?.i ?? null}
            mean={mean}
            setHover={setHover}
            span={span}
            width={width}
          />
          <BrushStrip
            data={data}
            mean={mean}
            onChange={setSpan}
            span={span}
            width={width}
            x0={X0}
            x1={width - AXIS}
          />
        </div>
      )}
    </Plot>
  );
};
