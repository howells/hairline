import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area as d3area, line as d3line } from "d3-shape";
import type { PointerEvent } from "react";

import { fmtInt, monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger } from "../util";
import { ValueGrid } from "../value-grid";
import { hairlineAreaDemo } from "./hairline-area.data";
import type { DailyDatum } from "./hairline-line.data";
import {
  VALUE_AXIS_ROOM,
  dailyFloor,
  fmtMonthDay,
  useHoverTip,
} from "./util-a";

interface HairlineAreaProps {
  data?: DailyDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index drawn in the hero colour. Defaults to the peak. */
  highlight?: number;
  formatDate?: (d: Date) => string;
  /** Value-axis ticks; the scale runs to the last. Defaults to four nice steps. */
  ticks?: number[];
  /**
   * Widest the plot gets, in px. Defaults to 640, which suits a gallery
   * card; pass `Infinity` to fill a full-width row.
   */
  maxWidth?: number;
}

interface Frame {
  floor: number;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

const dayKey = (d: DailyDatum) => d.date.toISOString();

const stemClass = (hero: boolean, hovered: boolean) => {
  if (hero) {
    return "grow-y fill-hero";
  }
  if (hovered) {
    return "grow-y fill-l2";
  }
  return "grow-y fill-l4";
};

/** Past this many days, stems stand monthly rather than weekly. */
const WEEKLY_SPAN = 120;

/**
 * A stem stands on every Monday (on every first of the month over a long
 * span), on the hero and on the hovered day.
 */
const hasStem = (
  d: DailyDatum,
  i: number,
  marks: { hero: number; hover: number | null; monthly: boolean }
) =>
  (marks.monthly ? d.date.getUTCDate() === 1 : d.date.getUTCDay() === 1) ||
  i === marks.hero ||
  i === marks.hover;

/** Weekly (or monthly) 2px stems, floor to value, on whole pixels. */
const DayStems = ({
  data,
  frame,
  hero,
  hover,
}: {
  data: DailyDatum[];
  frame: Frame;
  hero: number;
  hover: number | null;
}) => (
  <g>
    {data.map((d, i) => {
      if (!hasStem(d, i, { hero, hover, monthly: data.length > WEEKLY_SPAN })) {
        return null;
      }
      const top = Math.round(frame.y(d.value));
      const base = Math.round(frame.floor);
      return (
        <rect
          className={`transition-colors ${stemClass(i === hero, i === hover)}`}
          height={Math.max(0, base - top)}
          key={dayKey(d)}
          style={stagger(i, "fine")}
          width={2}
          x={Math.round(frame.x(i)) - 1}
          y={top}
        />
      );
    })}
  </g>
);

/**
 * A label at each first of the month (each quarter over a long span); the
 * year on the first and where it changes.
 */
const MonthAxis = ({ data, frame }: { data: DailyDatum[]; frame: Frame }) => {
  const every = data.length > WEEKLY_SPAN ? 3 : 1;
  const months = data.flatMap((d, i) =>
    d.date.getUTCDate() === 1 && d.date.getUTCMonth() % every === 0 ? [i] : []
  );
  const axis = months.includes(0) ? months : [0, ...months];
  const labels = monthTickLabels(axis.map((i) => data[i].date));
  return (
    <g>
      {axis.map((i, k) => (
        <text
          className="t-axis"
          dx={k === 0 ? -6 : 0}
          key={dayKey(data[i])}
          textAnchor={k === 0 ? "start" : "middle"}
          x={frame.x(i)}
          y={frame.floor + 20}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

/** The value scale: up to the last of `ticks`, or to four nice steps over the peak. */
const valueScale = (max: number, floor: number, ticks?: number[]) =>
  ticks === undefined
    ? scaleLinear().domain([0, max]).nice(4).range([floor, 40])
    : scaleLinear()
        .domain([0, ticks.at(-1) ?? max])
        .range([floor, 40]);

interface SvgProps {
  clear: () => void;
  /** Pattern id of the stipple under the line. */
  stipple: string;
  data: DailyDatum[];
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  highlight: number | undefined;
  hover: number | null;
  maxWidth: number;
  note: string | undefined;
  show: (i: number, x: number, y: number) => void;
  ticks: number[] | undefined;
  width: number;
}

const HairlineAreaSvg = ({
  clear,
  stipple,
  data,
  fmtDate,
  format,
  height,
  highlight,
  hover,
  maxWidth,
  note,
  show,
  ticks,
  width,
}: SvgProps) => {
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const peak = values.indexOf(max);
  const hero = highlight ?? peak;
  const last = data.length - 1;
  const frameW = Math.min(width - 16, maxWidth + VALUE_AXIS_ROOM);
  const half = Math.ceil(sansWidth(format(values[hero]), 12) / 2) + 2;
  const start = hero === 0 ? Math.max(8, half) : 8;
  const x0 = Math.round((width - frameW) / 2);
  const x1 = x0 + frameW;
  const floor = dailyFloor(height, note, width);
  const frame: Frame = {
    floor,
    x: scaleLinear()
      .domain([0, last])
      .range([x0 + start, x1 - VALUE_AXIS_ROOM]),
    y: valueScale(max, floor, ticks),
  };
  const path =
    d3line<DailyDatum>()
      .x((_, i) => frame.x(i))
      .y((d) => frame.y(d.value))(data) ?? "";
  const fill =
    d3area<DailyDatum>()
      .x((_, i) => frame.x(i))
      .y0(Math.round(floor))
      .y1((d) => frame.y(d.value))(data) ?? "";
  const label = `Daily values, ${fmtDate(data[0].date)} to ${fmtDate(data[last].date)}: peak ${format(max)} on ${fmtDate(data[peak].date)}`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = Math.max(0, Math.min(last, Math.round(frame.x.invert(px))));
    show(i, frame.x(i), frame.y(data[i].value) - (i === hero ? 16 : 10));
  };

  return (
    <svg
      aria-label={label}
      className="touch-pan-y"
      height={height}
      onPointerLeave={clear}
      onPointerMove={onMove}
      width={width}
    >
      <title>{label}</title>
      <defs>
        <Stipple ground="fill-paper" id={stipple} tone="fill-l3" />
      </defs>
      <ValueGrid
        labelFloor
        side="right"
        floor={floor}
        format={format}
        ticks={ticks ?? frame.y.ticks(4)}
        x0={x0}
        x1={x1}
        y={frame.y}
      />
      <path
        className="fade"
        d={fill}
        fill={paint(stipple)}
        style={stagger(2, "series")}
      />
      <DayStems data={data} frame={frame} hero={hero} hover={hover} />
      <line
        className="hairline"
        x1={x0}
        x2={x1}
        y1={crisp(floor)}
        y2={crisp(floor)}
      />
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={path}
        pathLength={1}
        style={stagger(4, "series")}
      />
      {hover === null || hover === hero ? null : (
        <circle
          className="fill-l2"
          cx={frame.x(hover)}
          cy={frame.y(values[hover])}
          r={3}
        />
      )}
      <circle
        className="pop fill-hero"
        cx={frame.x(hero)}
        cy={frame.y(values[hero])}
        r={4.5}
        style={stagger(40, "fine")}
      />
      <text
        className="fade t-value"
        style={stagger(10)}
        textAnchor="middle"
        x={frame.x(hero)}
        y={frame.y(values[hero]) - 13}
      >
        {format(values[hero])}
      </text>
      <MonthAxis data={data} frame={frame} />
      <PlotNote text={note} width={width - 24} x={width / 2} y={height - 6} />
    </svg>
  );
};

/**
 * F3 Daily area. The area under the line is an engraved stipple, one 1px dot
 * per 4px cell, with a 2px stem every seventh day (every month over a year). The peak stands in ink,
 * labelled, with its label kept inside the frame when it is the first day;
 * hovering a day raises its stem.
 */
export const HairlineArea = (props: HairlineAreaProps) => {
  const data = props.data ?? hairlineAreaDemo;
  const format = props.format ?? fmtInt;
  const fmtDate = props.formatDate ?? fmtMonthDay;
  const { clear, hover, show, tip } = useHoverTip();
  const stipple = useTextureIds("daily")("stipple");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{fmtDate(data[tip.i].date)}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => (
        <HairlineAreaSvg
          clear={clear}
          stipple={stipple}
          data={data}
          fmtDate={fmtDate}
          format={format}
          height={props.height ?? 440}
          highlight={props.highlight}
          hover={hover}
          maxWidth={props.maxWidth ?? 640}
          note={props.note}
          show={show}
          ticks={props.ticks}
          width={width}
        />
      )}
    </Plot>
  );
};
