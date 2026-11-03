import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { line as d3line } from "d3-shape";
import type { PointerEvent } from "react";

import { axisFormat, plural, dayTickLabels, fmtInt } from "../../lib/format";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import type { FontMetrics } from "../../schema/metrics";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { Dot, Ring } from "../markers";
import type { DotSize } from "../marks";
import { NOTED_TOP } from "../note-layout";
import { FootNote } from "../plot-note";
import { HRule, Stem, VRule } from "../rules";
import { scoped, chartTable, plotOptions, pointerX } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label, XLabels } from "../text";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { stagger, noteOf } from "../util";
import { ValueGrid } from "../value-grid";
import { DailyEmpty } from "./daily-empty";
import { DailyNoteList, DailyNoteMarks } from "./daily-note-marks";
import { foundNotes, notesDesc, withNotes } from "./daily-notes";
import type { FoundNote } from "./daily-notes";
import {
  heroOf,
  isLive,
  seriesOf,
  reactKeyOf,
  readingRows,
  readingsOf,
  valueAt,
} from "./daily-readings";
import type { Reading, Series } from "./daily-readings";
import { VALUE_AXIS_ROOM, dailyFloor, isWeekend } from "./util-a";

interface Frame {
  floor: number;
  /** Where reading `i` stands: by its date, so a missing day leaves a gap. */
  x: (i: number) => number;
  /** The frame's left and right edges: gridlines and baseline span them. */
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

const DAY_MS = 86_400_000;

const dotClass = (hollow: boolean, hero: boolean) => {
  if (hero) {
    return "fill-hero";
  }
  return hollow ? "stroke-l3" : "fill-l3";
};

interface DotsProps extends Series {
  format: (v: number) => string;
  frame: Frame;
  hero: number;
  hover: number | null;
}

/**
 * Day dots: hollow on weekends, the hero larger and in ink. The hero carries
 * its value; the latest day carries its value quietly. A gap has no dot.
 */
const Dots = ({ format, frame, hero, hover, live, readings }: DotsProps) => {
  const last = live.at(-1) ?? 0;
  const size = (i: number): DotSize =>
    i === hero || hover === i ? "md" : "sm";
  const labels = hero === last || hero < 0 ? [last] : [hero, last];
  return (
    <g>
      {live.map((i) => {
        const hollow = i !== hero && isWeekend(readings[i].date);
        const props = {
          className: `pop transition-radius ${dotClass(hollow, i === hero)}`,
          cx: crisp(frame.x(i)),
          cy: frame.y(valueAt(readings, i)),
          size: size(i),
          style: stagger(i, "mark"),
        };
        const key = reactKeyOf(readings[i], i);
        return hollow ? (
          <Ring key={key} {...props} />
        ) : (
          <Dot key={key} {...props} />
        );
      })}
      {labels.map((i) => (
        <Label
          anchor="middle"
          key={reactKeyOf(readings[i], i)}
          order={last}
          tier="mark"
          voice={i === hero ? "value" : "axis"}
          x={frame.x(i)}
          y={frame.y(valueAt(readings, i)) - 12}
        >
          {format(valueAt(readings, i))}
        </Label>
      ))}
    </g>
  );
};

interface StemsProps extends Series {
  floor: number;
  frame: Frame;
  hero: number;
}

/** Weekend days drop an evenly dotted stem to the floor; the hero a solid ink one. */
const Stems = ({ floor, frame, hero, live, readings }: StemsProps) => (
  <g>
    {live.map((i) => {
      const px = frame.x(i);
      const key = reactKeyOf(readings[i], i);
      if (i === hero) {
        return (
          <Stem
            className="grow-y stroke-hero"
            hero
            key={key}
            style={stagger(i, "mark")}
            x={px}
            y0={Math.round(floor)}
            y1={frame.y(valueAt(readings, i))}
          />
        );
      }
      if (!isWeekend(readings[i].date)) {
        return null;
      }
      return (
        <g className="fade" key={key} style={stagger(i, "mark")}>
          <DottedLine
            pitch={TEXTURE_PITCH.dense}
            tone="fill-l4"
            x0={px}
            x1={px}
            y0={frame.y(valueAt(readings, i)) + 6}
            y1={floor - 2}
          />
        </g>
      );
    })}
  </g>
);

interface SvgProps {
  clear: () => void;
  extreme: "peak" | "trough";
  emphasis: string | undefined;
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  hover: number | null;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  readings: Reading[];
  show: (i: number, x: number, y: number) => void;
  title: string | undefined;
  /** The format is the default whole number, which the axis may refine. */
  wholeNumbers: boolean;
  width: number;
}

/** Monday ticks, the month printed on the first and where it changes. */
const DayAxis = ({
  frame,
  readings,
}: {
  frame: Frame;
  readings: Reading[];
}) => {
  const mondays = readings.flatMap((r, i) =>
    r.date.getUTCDay() === 1 ? [i] : []
  );
  const labels = dayTickLabels(mondays.map((i) => readings[i].date));
  return (
    <XLabels
      ticks={mondays.map((i, k) => ({ label: labels[k], x: frame.x(i) }))}
      y={frame.floor + 20}
    />
  );
};

/** The line through the live readings, broken at each gap. */
const linePath = (readings: Reading[], frame: Frame) =>
  d3line<Reading>()
    .defined(isLive)
    .x((_, i) => crisp(frame.x(i)))
    .y((r) => frame.y(r.value ?? 0))(readings) ?? "";

/** The live reading whose day is nearest `day`, searching from `first`. */
const nearestDay = (
  live: number[],
  first: number,
  dayAt: (i: number) => number,
  day: number
) => {
  let nearest = first;
  for (const k of live) {
    if (Math.abs(dayAt(k) - day) < Math.abs(dayAt(nearest) - day)) {
      nearest = k;
    }
  }
  return nearest;
};

/** A range narrower than this is flat: below it d3 cannot count ticks (the step underflows). */
const FLAT_SPAN = 1e-290;

/** The value scale: a quarter of the span below the low, up to the high. */
const valueScaleOf = (
  extent: { hi: number; lo: number },
  floor: number,
  top: number
) => {
  const span = extent.hi - extent.lo;
  return scaleLinear()
    .domain(
      span < FLAT_SPAN
        ? [extent.lo - 1, extent.hi + 1]
        : [extent.lo - span * 0.25, extent.hi]
    )
    .nice(5)
    .range([floor, top]);
};

/** Where a reading stands along the frame: by its date, so a gap leaves a gap. */
const dayScaleOf = (readings: Reading[], x0: number, x1: number) => {
  const start = readings[0].date.getTime();
  const dayAt = (i: number) =>
    Math.round((readings[i].date.getTime() - start) / DAY_MS);
  const xScale = scaleLinear()
    .domain([0, Math.max(1, dayAt(readings.length - 1))])
    .range([x0 + 8, x1 - VALUE_AXIS_ROOM]);
  return { dayAt, xScale };
};

const HairlineLineSvg = ({
  clear,
  emphasis,
  extreme,
  fmtDate,
  format,
  height,
  hover,
  metrics,
  note,
  notes,
  readings,
  show,
  title,
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
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const peak = live[values.indexOf(hi)];
  const trough = live[values.indexOf(lo)];
  const last = live.at(-1) ?? 0;
  const [first] = live;
  const hero = heroOf(readings, live, emphasis, { peak, trough }[extreme]);
  const frameW = Math.min(width - 16, 680);
  const x0 = Math.round((width - frameW) / 2);
  const x1 = x0 + frameW;
  const y = valueScaleOf({ hi, lo }, floor, notes.length > 0 ? NOTED_TOP : 40);
  const { dayAt, xScale } = dayScaleOf(readings, x0, x1);
  const frame: Frame = {
    floor,
    x: (i) => xScale(dayAt(i)),
    x0,
    x1,
    y,
  };
  const path = linePath(readings, frame);
  const label = `Daily values, ${fmtDate(readings[first].date)} to ${fmtDate(readings[last].date)}: high ${format(hi)} on ${fmtDate(readings[peak].date)}, low ${format(lo)} on ${fmtDate(readings[trough].date)}, latest ${format(valueAt(readings, last))}`;

  const desc = `${plural(live.length, "reading")}. High ${format(hi)} on ${fmtDate(readings[peak].date)}, low ${format(lo)} on ${fmtDate(readings[trough].date)}. The data table lists every reading.${notesDesc(notes, readings, fmtDate)}`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = pointerX(e, width);
    const nearest = nearestDay(live, first, dayAt, xScale.invert(px));
    show(nearest, frame.x(nearest), frame.y(valueAt(readings, nearest)) - 16);
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
      <ValueGrid
        labelFloor
        side="right"
        floor={floor}
        format={axisFormat(format, wholeNumbers, y.ticks(5))}
        ticks={y.ticks(5)}
        x0={x0}
        x1={x1}
        y={y}
      />
      <HRule x0={x0} x1={x1} y={floor} />
      <Stems floor={floor} frame={frame} hero={hero} {...series} />
      {hover === null || hover === hero ? null : (
        <VRule
          kind="rule"
          x={frame.x(hover)}
          y0={frame.y(valueAt(readings, hover))}
          y1={crisp(floor)}
        />
      )}
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={path}
        pathLength={1}
      />
      <Dots
        format={format}
        frame={frame}
        hero={hero}
        hover={hover}
        {...series}
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
      <DayAxis frame={frame} readings={readings} />
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

const HairlineLinePlot = (props: HairlineLineProps) => {
  const readings = readingsOf(props.data ?? []);
  const format =
    props.format === undefined ? fmtInt : resolveFormat(props.format);
  const fmtDate = resolveDateFormat(props.dateFormat);
  const { at, clear, key: hover, show } = useHover<number>();
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
              facts={[
                format(tip.value ?? 0),
                ...(isWeekend(tip.date) ? ["weekend"] : []),
              ]}
              lead={fmtDate(tip.date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <>
          <HairlineLineSvg
            clear={clear}
            emphasis={props.emphasis}
            extreme={props.extreme ?? "peak"}
            fmtDate={fmtDate}
            format={format}
            height={props.height ?? 440}
            hover={hover}
            metrics={props.metrics}
            note={noteOf(props)}
            notes={notes}
            readings={readings}
            show={show}
            title={props.title}
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
 * F2 Daily line. One dot per reading on a grey line, placed by its date so a
 * missing day leaves a gap. Weekend days are hollow rings on an evenly dotted
 * stem to the floor; the peak (or, with `extreme="trough"`, the lowest) is in
 * ink on a solid ink stem, with its value. The latest day carries its value
 * quietly.
 *
 * Props are the `hairlineLineSchema` payload (src/schema/hairline-line.ts);
 * `data` is required and never defaults to demo data; dates are ISO strings.
 * Give `width` and `height` for a fixed-size chart that is complete on the
 * first (server) render. Bad input is tolerated: readings are drawn in date
 * order; a reading whose value is null, NaN or infinite is a gap, with no dot
 * and a break in the line; one reading draws a lone dot; no readings (or only
 * gaps) draw a quiet empty axis; `emphasis` is a reading's `id` or date, and
 * one that names no live reading emphasises none.
 */
export const HairlineLine = (props: HairlineLineProps) =>
  scoped(props.idPrefix, <HairlineLinePlot {...props} />);
