import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area as d3area, line as d3line } from "d3-shape";
import type { PointerEvent } from "react";

import { axisFormat, plural, fmtInt, monthTickLabels } from "../../lib/format";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineAreaProps } from "../../schema/hairline-area";
import type { FontMetrics } from "../../schema/metrics";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { Dot } from "../markers";
import { MARK_WEIGHT } from "../marks";
import { NOTED_TOP } from "../note-layout";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { scoped, chartTable, plotOptions, pointerX } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger, noteOf } from "../util";
import { ValueGrid } from "../value-grid";
import { DailyEmpty } from "./daily-empty";
import { DailyNoteList, DailyNoteMarks } from "./daily-note-marks";
import { foundNotes, notesDesc, withNotes } from "./daily-notes";
import type { FoundNote } from "./daily-notes";
import {
  isLive,
  heroOf,
  seriesOf,
  readingRows,
  reactKeyOf,
  readingsOf,
  valueAt,
} from "./daily-readings";
import type { Reading, Series } from "./daily-readings";
import { VALUE_AXIS_ROOM, dailyFloor } from "./util-a";

interface Frame {
  floor: number;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

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
  d: Reading,
  i: number,
  marks: { hero: number; hover: number | null; monthly: boolean }
) =>
  (marks.monthly ? d.date.getUTCDate() === 1 : d.date.getUTCDay() === 1) ||
  i === marks.hero ||
  i === marks.hover;

/** Weekly (or monthly) 2px stems, floor to value, on whole pixels. */
interface DayStemsProps extends Series {
  frame: Frame;
  hero: number;
  hover: number | null;
}

const DayStems = ({ frame, hero, hover, live, readings }: DayStemsProps) => (
  <g>
    {live.map((i) => {
      const monthly = readings.length > WEEKLY_SPAN;
      if (!hasStem(readings[i], i, { hero, hover, monthly })) {
        return null;
      }
      const top = Math.round(frame.y(valueAt(readings, i)));
      const base = Math.round(frame.floor);
      return (
        <rect
          className={`transition-tone ${stemClass(i === hero, i === hover)}`}
          height={Math.max(0, base - top)}
          key={reactKeyOf(readings[i], i)}
          style={stagger(i, "fine")}
          width={MARK_WEIGHT}
          x={Math.round(frame.x(i)) - MARK_WEIGHT / 2}
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
const MonthAxis = ({
  frame,
  readings,
}: {
  frame: Frame;
  readings: Reading[];
}) => {
  const every = readings.length > WEEKLY_SPAN ? 3 : 1;
  const months = readings.flatMap((r, i) =>
    r.date.getUTCDate() === 1 && r.date.getUTCMonth() % every === 0 ? [i] : []
  );
  const axis = months.includes(0) ? months : [0, ...months];
  const labels = monthTickLabels(axis.map((i) => readings[i].date));
  return (
    <g>
      {axis.map((i, k) => (
        <Label
          anchor={k === 0 ? "start" : "middle"}
          dx={k === 0 ? -6 : 0}
          key={reactKeyOf(readings[i], i)}
          voice="axis"
          x={frame.x(i)}
          y={frame.floor + 20}
        >
          {labels[k]}
        </Label>
      ))}
    </g>
  );
};

/**
 * The value scale: from zero (or the lowest value, if below) up to the last
 * of `ticks`, or to four nice steps over the peak.
 */
const valueScale = (
  extent: { hi: number; lo: number },
  floor: number,
  top: number,
  ticks?: number[]
) => {
  const last = ticks?.at(-1);
  if (last !== undefined && last > 0) {
    return scaleLinear().domain([0, last]).range([floor, top]);
  }
  const lo = Math.min(0, extent.lo);
  const hi = Math.max(lo + 1, extent.hi);
  return scaleLinear().domain([lo, hi]).nice(4).range([floor, top]);
};

/** The live index nearest a position along the index axis. */
const nearestOf = (live: number[], at: number) => {
  let [nearest] = live;
  for (const k of live) {
    if (Math.abs(k - at) < Math.abs(nearest - at)) {
      nearest = k;
    }
  }
  return nearest;
};

/** The hero: an ink dot on the line with its value above. */
const HeroMark = ({
  format,
  frame,
  value,
  x,
}: {
  format: (v: number) => string;
  frame: Frame;
  value: number;
  x: number;
}) => (
  <>
    <Dot
      className="pop fill-hero"
      cx={x}
      cy={frame.y(value)}
      size="md"
      style={stagger(40, "fine")}
    />
    <Label
      anchor="middle"
      order={10}
      voice="value"
      x={x}
      y={frame.y(value) - 13}
    >
      {format(value)}
    </Label>
  </>
);

/** The hovered day's dot, and the hero's dot with its value. */
const Accents = (props: {
  format: (v: number) => string;
  frame: Frame;
  hero: number;
  hover: number | null;
  readings: Reading[];
}) => {
  const { frame, hero, hover, readings } = props;
  return (
    <>
      {hover === null || hover === hero ? null : (
        <Dot
          className="fill-l2"
          cx={frame.x(hover)}
          cy={frame.y(valueAt(readings, hover))}
          size="sm"
        />
      )}
      {hero < 0 ? null : (
        <HeroMark
          format={props.format}
          frame={frame}
          value={valueAt(readings, hero)}
          x={frame.x(hero)}
        />
      )}
    </>
  );
};

/** The line and the area under it, each broken where a reading is a gap. */
const shapesOf = (readings: Reading[], frame: Frame) => ({
  fill:
    d3area<Reading>()
      .defined(isLive)
      .x((_, i) => frame.x(i))
      .y0(Math.round(frame.floor))
      .y1((r) => frame.y(r.value ?? 0))(readings) ?? "",
  path:
    d3line<Reading>()
      .defined(isLive)
      .x((_, i) => frame.x(i))
      .y((r) => frame.y(r.value ?? 0))(readings) ?? "",
});

/** The plot's left and right edges, centred in `width`. */
const edgesOf = (width: number, maxWidth: number) => {
  const frameW = Math.min(width - 16, maxWidth + VALUE_AXIS_ROOM);
  const x0 = Math.round((width - frameW) / 2);
  return [x0, x0 + frameW] as const;
};

/** Where the first day sits: clear of the hero's label when it is the first. */
const startOf = (
  readings: Reading[],
  hero: number,
  format: (v: number) => string
) => {
  const half =
    hero < 0
      ? 0
      : Math.ceil(sansWidth(format(valueAt(readings, hero)), 12) / 2) + 2;
  return hero === 0 ? Math.max(8, half) : 8;
};

interface FrameArgs {
  floor: number;
  format: (v: number) => string;
  hero: number;
  maxWidth: number;
  notes: number;
  readings: Reading[];
  ticks: number[] | undefined;
  values: number[];
  width: number;
}

/** The frame's edges and scales; a chart with notes leaves room over its peak. */
const frameOf = (a: FrameArgs) => {
  const [x0, x1] = edgesOf(a.width, a.maxWidth);
  const start = startOf(a.readings, a.hero, a.format);
  const frame: Frame = {
    floor: a.floor,
    x: scaleLinear()
      .domain([0, Math.max(1, a.readings.length - 1)])
      .range([x0 + start, x1 - VALUE_AXIS_ROOM]),
    y: valueScale(
      { hi: Math.max(...a.values), lo: Math.min(...a.values) },
      a.floor,
      a.notes > 0 ? NOTED_TOP : 40,
      a.ticks
    ),
  };
  return { frame, x0, x1 };
};

interface SvgProps {
  clear: () => void;
  /** Pattern id of the stipple under the line. */
  stipple: string;
  emphasis: string | undefined;
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  hover: number | null;
  maxWidth: number;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  readings: Reading[];
  show: (i: number, x: number, y: number) => void;
  title: string | undefined;
  ticks: number[] | undefined;
  /** The format is the default whole number, which the axis may refine. */
  wholeNumbers: boolean;
  width: number;
}

const HairlineAreaSvg = ({
  clear,
  stipple,
  emphasis,
  fmtDate,
  format,
  height,
  hover,
  maxWidth,
  metrics,
  note,
  notes,
  readings,
  show,
  title,
  ticks,
  wholeNumbers,
  width,
}: SvgProps) => {
  const series = seriesOf(readings);
  const { live } = series;
  const floor = dailyFloor(height, note, width, metrics);
  if (live.length === 0) {
    return (
      <DailyEmpty floor={floor} height={height} name={title} width={width} />
    );
  }
  const values = live.map((i) => valueAt(readings, i));
  const max = Math.max(...values);
  const peak = live[values.indexOf(max)];
  const hero = heroOf(readings, live, emphasis, peak);
  const { frame, x0, x1 } = frameOf({
    floor,
    format,
    hero,
    maxWidth,
    notes: notes.length,
    readings,
    ticks,
    values,
    width,
  });
  const { fill, path } = shapesOf(readings, frame);
  const peakAt = fmtDate(readings[peak].date);
  const label = `Daily values, ${fmtDate(readings[live[0]].date)} to ${fmtDate(readings[live.at(-1) ?? 0].date)}: peak ${format(max)} on ${peakAt}`;
  const desc = `${plural(live.length, "reading")}. Peak ${format(max)} on ${peakAt}. The data table lists every reading.${notesDesc(notes, readings, fmtDate)}`;
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = pointerX(e, width);
    const at = frame.x.invert(px);
    const near = nearestOf(live, at);
    const lift = near === hero ? 16 : 10;
    show(near, frame.x(near), frame.y(valueAt(readings, near)) - lift);
  };

  return (
    <ChartSvg
      className="touch-pan-y"
      height={height}
      desc={desc}
      label={title ?? label}
      leave={clear}
      onPointerMove={onMove}
      width={width}
    >
      <defs>
        <Stipple id={stipple} tone="fill-l3" />
      </defs>
      <ValueGrid
        labelFloor
        side="right"
        floor={floor}
        format={axisFormat(format, wholeNumbers, ticks ?? frame.y.ticks(4))}
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
      <DayStems frame={frame} hero={hero} hover={hover} {...series} />
      <HRule x0={x0} x1={x1} y={floor} />
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={path}
        pathLength={1}
        style={stagger(4, "series")}
      />
      <Accents
        format={format}
        frame={frame}
        hero={hero}
        hover={hover}
        readings={readings}
      />
      {notes.length === 0 ? null : (
        <DailyNoteMarks
          floor={floor}
          frame={frame}
          live={live}
          notes={notes}
          readings={readings}
          width={width}
          x0={x0}
          x1={x1}
        />
      )}
      <MonthAxis frame={frame} readings={readings} />
      <FootNote
        gutter={12}
        height={height}
        metrics={metrics}
        text={note}
        width={width}
      />
    </ChartSvg>
  );
};

const HairlineAreaPlot = (props: HairlineAreaProps) => {
  const readings = readingsOf(props.data ?? []);
  const format =
    props.format === undefined ? fmtInt : resolveFormat(props.format);
  const fmtDate = resolveDateFormat(props.dateFormat);
  const { at, clear, key: hover, show } = useHover<number>();
  const stipple = useTextureIds("daily")("stipple");
  const tip = at === null ? undefined : readings[at.key];
  const notes = foundNotes(props.notes, readings);
  const table = withNotes(
    ["Date", "Value"],
    readingRows(readings, fmtDate, format),
    notes
  );

  return (
    <Plot
      initialWidth={props.initialWidth}
      width={props.width}
      {...plotOptions(props)}
      table={chartTable(
        props,
        props.title ?? "Daily values",
        table.columns,
        table.rows
      )}
      overlay={
        at === null || tip === undefined ? null : (
          <Tooltip x={at.x} y={at.y}>
            <TipText
              facts={[format(tip.value ?? 0)]}
              lead={fmtDate(tip.date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <>
          <HairlineAreaSvg
            clear={clear}
            emphasis={props.emphasis}
            stipple={stipple}
            fmtDate={fmtDate}
            format={format}
            height={props.height ?? 440}
            hover={hover}
            maxWidth={props.maxWidth ?? 640}
            metrics={props.metrics}
            note={noteOf(props)}
            notes={notes}
            readings={readings}
            show={show}
            title={props.title}
            ticks={props.ticks}
            wholeNumbers={props.format === undefined}
            width={width}
          />
          <DailyNoteList notes={notes} width={width} />
        </>
      )}
    </Plot>
  );
};

/**
 * F3 Daily area. The area under the line is an engraved stipple, one 1px dot
 * per 4px cell, with a 2px stem every seventh day (every month over a year). The peak stands in ink,
 * labelled, with its label kept inside the frame when it is the first day;
 * hovering a day raises its stem.
 *
 * Props are the `hairlineAreaSchema` payload (src/schema/hairline-area.ts);
 * `data` is required and never defaults to demo data; dates are ISO strings.
 * Give `width` and `height` for a fixed-size chart that is complete on the
 * first (server) render. Bad input is tolerated: readings are drawn in date
 * order, spaced evenly; a reading whose value is null, NaN or infinite is a
 * gap, with the area and line broken there; one reading draws a lone dot;
 * negatives are drawn below the zero line; no readings (or only gaps) draw a
 * quiet empty axis; `emphasis` is a reading's `id` or date, and one that names
 * no live reading emphasises none.
 */
export const HairlineArea = (props: HairlineAreaProps) =>
  scoped(props.idPrefix, <HairlineAreaPlot {...props} />);
