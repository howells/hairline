import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtInt } from "../../lib/format";
import type { ValueAxis } from "../../schema/daily";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import type { FontMetrics } from "../../schema/metrics";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { labelBox } from "../label-box";
import { Dot, Ring } from "../markers";
import type { DotSize } from "../marks";
import { NOTED_TOP } from "../note-layout";
import { FootNote } from "../plot-note";
import { clears, referenceRows, referenceValues } from "../reference-marks";
import type { Spot } from "../reference-marks";
import { ReferenceBands, ReferenceOverlay } from "../references";
import type { Plane } from "../references";
import { HRule, Stem, VRule } from "../rules";
import { scoped, chartTable, plotOptions, pointerX } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label, XLabels } from "../text";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { stagger, noteOf } from "../util";
import { DailyEmpty } from "./daily-empty";
import { DailyGrid, DailyLine } from "./daily-grid";
import { DailyNoteList, DailyNoteMarks } from "./daily-note-marks";
import { foundNotes, notesDesc, withNotes } from "./daily-notes";
import type { FoundNote } from "./daily-notes";
import {
  heroOf,
  seriesOf,
  reactKeyOf,
  readingRows,
  readingsOf,
  valueAt,
} from "./daily-readings";
import type { Reading, Series } from "./daily-readings";
import { ForecastRule, IntervalBands, IntervalNames } from "./interval-marks";
import {
  bandValues,
  bandsOf,
  forecastAt,
  intervalFacts,
  intervalTable,
  pathBetween,
} from "./intervals";
import type { Band } from "./intervals";
import { describeLine } from "./line-words";
import { axisRoom, dailyFloor, isWeekend } from "./util-a";

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

/** A dot's tone: by whether it clears a reference line when one asks, else the hero's ink or grey. */
const dotClass = (
  hollow: boolean,
  hero: boolean,
  clearing: boolean | undefined
) => {
  if (clearing !== undefined) {
    if (clearing) {
      return hollow ? "stroke-hero" : "fill-hero";
    }
    return hollow ? "stroke-l5" : "fill-l5";
  }
  if (hero) {
    return "fill-hero";
  }
  return hollow ? "stroke-l3" : "fill-l3";
};

interface DotsProps extends Series {
  /** Whether a reading clears the reference line that asks for ink; undefined when none does. */
  clearing: (i: number) => boolean | undefined;
  /** The first forecast reading: those after the last one carry no dot of their own. */
  forecast: number;
  format: (v: number) => string;
  frame: Frame;
  hero: number;
  hover: number | null;
}

/**
 * Day dots: hollow on weekends, the hero larger and in ink. The hero carries
 * its value; the latest day carries its value quietly. A gap has no dot.
 */
const Dots = ({
  clearing,
  forecast,
  format,
  frame,
  hero,
  hover,
  live,
  readings,
}: DotsProps) => {
  const last = live.at(-1) ?? 0;
  const size = (i: number): DotSize =>
    i === hero || hover === i ? "md" : "sm";
  const labels = hero === last || hero < 0 ? [last] : [hero, last];
  return (
    <g>
      {live.map((i) => {
        // A forecast is its dashed line and its last value, a hollow ring.
        if (i >= forecast && i !== hero && i !== last) {
          return null;
        }
        const hollow =
          i !== hero && (isWeekend(readings[i].date) || i >= forecast);
        const props = {
          className: `pop transition-radius ${dotClass(hollow, i === hero, clearing(i))}`,
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
  forecast: number;
  frame: Frame;
  hero: number;
}

/** Weekend days drop an evenly dotted stem to the floor; the hero a solid ink one. */
const Stems = ({
  floor,
  forecast,
  frame,
  hero,
  live,
  readings,
}: StemsProps) => (
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
      if (!isWeekend(readings[i].date) || i >= forecast) {
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
  axis: ValueAxis;
  bands: Band[];
  clear: () => void;
  forecast: { at: number; label: string };
  extreme: "peak" | "trough";
  domain: [number, number] | undefined;
  emphasis: string | null | undefined;
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  hover: number | null;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  readings: Reading[];
  references: HairlineLineProps["references"];
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

/**
 * The line through the live readings, broken at each gap: the observed one,
 * and the forecast one that picks up where it ends.
 */
const linePaths = (readings: Reading[], frame: Frame, forecast: number) => {
  const at = { x: (i: number) => crisp(frame.x(i)), y: frame.y };
  const last = readings.length - 1;
  const kept = Math.min(forecast, readings.length) - 1;
  return {
    forecast:
      forecast >= readings.length
        ? ""
        : pathBetween(readings, { from: Math.max(0, kept), to: last }, at),
    observed: pathBetween(readings, { from: 0, to: kept }, at),
  };
};

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

interface LayersProps {
  avoid: Spot[];
  axis: ValueAxis;
  bands: Band[];
  clearing: (i: number) => boolean | undefined;
  forecast: number;
  forecastLabel: string;
  forecasting: boolean;
  format: (v: number) => string;
  frame: Frame;
  height: number;
  hero: number;
  hover: number | null;
  last: number;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  paths: { forecast: string; observed: string };
  plane: Plane;
  readings: Reading[];
  references: HairlineLineProps["references"];
  series: Series;
  wholeNumbers: boolean;
  width: number;
  within: readonly [number, number];
}

/** Everything the plot draws, back to front. */
const LineLayers = (p: LayersProps) => {
  const { bands, forecast, frame, hero, hover, readings, references } = p;
  const { floor, x0, x1, y } = frame;
  return (
    <>
      <DailyGrid
        axis={p.axis}
        clear={valueLabelBoxes(
          readings,
          frame,
          p.format,
          hero === p.last || hero < 0 ? [p.last] : [hero, p.last]
        )}
        floor={floor}
        format={p.format}
        ticks={y.ticks(5)}
        wholeNumbers={p.wholeNumbers}
        x0={x0}
        x1={x1}
        y={y}
      />
      <ReferenceBands
        along="y"
        plane={p.plane}
        refs={references}
        scale={y}
        within={p.within}
      />
      <IntervalBands bands={bands} x={frame.x} y={y} />
      <HRule x0={x0} x1={x1} y={floor} />
      <Stems
        floor={floor}
        forecast={forecast}
        frame={frame}
        hero={hero}
        {...p.series}
      />
      {hover === null || hover === hero ? null : (
        <VRule
          kind="rule"
          x={frame.x(hover)}
          y0={frame.y(valueAt(readings, hover))}
          y1={crisp(floor)}
        />
      )}
      <DailyLine d={p.paths.observed} />
      {p.paths.forecast === "" ? null : (
        <path
          className="fade dash-rule stroke-l3 stroke-medium fill-none"
          d={p.paths.forecast}
        />
      )}
      {p.forecasting ? (
        <ForecastRule
          bottom={floor}
          label={p.forecastLabel}
          top={p.plane.y0}
          x={crisp(frame.x(forecast - 1))}
        />
      ) : null}
      <IntervalNames
        bands={bands}
        bounds={[p.plane.y0, floor]}
        x={frame.x}
        y={y}
      />
      <Dots
        clearing={p.clearing}
        forecast={forecast}
        format={p.format}
        frame={frame}
        hero={hero}
        hover={hover}
        {...p.series}
      />
      <ReferenceOverlay
        along="y"
        avoid={p.avoid}
        plane={p.plane}
        refs={references}
        scale={y}
        within={p.within}
      />
      {p.notes.length === 0 ? null : (
        <DailyNoteMarks
          floor={floor}
          frame={frame}
          live={p.series.live}
          notes={p.notes}
          readings={readings}
          width={p.width}
          x0={x0}
          x1={x1}
        />
      )}
      <DayAxis frame={frame} readings={readings} />
      <FootNote
        gutter={12}
        height={p.height}
        metrics={p.metrics}
        text={p.note}
        width={p.width}
      />
    </>
  );
};

/** A range narrower than this is flat: below it d3 cannot count ticks (the step underflows). */
const FLAT_SPAN = 1e-290;

/** Where the hero's and the latest day's value labels print, over their dots. */
const valueLabelBoxes = (
  readings: Reading[],
  frame: Frame,
  format: (v: number) => string,
  at: number[]
) =>
  at.map((i) =>
    labelBox(
      format(valueAt(readings, i)),
      frame.x(i),
      frame.y(valueAt(readings, i)) - 12,
      "middle"
    )
  );

/**
 * The frame: the value axis over the reach of the readings (and the marks
 * that need room), and the days across the plot, kept clear of the value
 * scale and of the bands' names at the right.
 */
const frameOf = (
  readings: Reading[],
  at: {
    axis: ValueAxis;
    domain: [number, number] | undefined;
    floor: number;
    reach: [number, number];
    top: number;
    width: number;
  }
) => {
  const room = axisRoom(at.axis);
  const frameW = Math.min(at.width - 16, 680 + room.left);
  const x0 = Math.round((at.width - frameW) / 2) + room.left;
  const x1 = x0 + frameW - room.left;
  const [lo, hi] = at.reach;
  const span = hi - lo;
  const y = scaleLinear()
    .domain(
      at.domain ??
        (span < FLAT_SPAN ? [lo - 1, hi + 1] : [lo - span * 0.25, hi])
    )
    .range([at.floor, at.top]);
  if (at.domain === undefined) {
    y.nice(5);
  }
  const start = readings[0].date.getTime();
  const dayAt = (i: number) =>
    Math.round((readings[i].date.getTime() - start) / DAY_MS);
  const xScale = scaleLinear()
    .domain([0, Math.max(1, dayAt(readings.length - 1))])
    .range([x0 + 8, x1 - room.right]);
  const frame: Frame = {
    floor: at.floor,
    x: (i) => xScale(dayAt(i)),
    x0,
    x1,
    y,
  };
  return { dayAt, frame, xScale };
};

const HairlineLineSvg = ({
  axis,
  bands,
  clear,
  domain,
  emphasis,
  extreme,
  fmtDate,
  forecast,
  format,
  height,
  hover,
  metrics,
  note,
  notes,
  readings,
  references,
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
  const peak = live[values.indexOf(Math.max(...values))];
  const trough = live[values.indexOf(Math.min(...values))];
  // The axis keeps room for the reference marks and the bands too.
  const reach = [
    ...values,
    ...referenceValues(references),
    ...bandValues(bands),
  ];
  const lo = Math.min(...reach);
  const hi = Math.max(...reach);
  const hiRead = Math.max(...values);
  const loRead = Math.min(...values);
  const last = live.at(-1) ?? 0;
  const [first] = live;
  const hero = heroOf(readings, live, emphasis, { peak, trough }[extreme]);
  const { dayAt, frame, xScale } = frameOf(readings, {
    axis,
    domain,
    floor,
    reach: [lo, hi],
    top: notes.length > 0 ? NOTED_TOP : 40,
    width,
  });
  const { x0, x1, y } = frame;
  const paths = linePaths(readings, frame, forecast.at);
  const forecasting = forecast.at > 0 && forecast.at < readings.length;
  const { desc, label } = describeLine({
    bands,
    ends: { first, last, peak, trough },
    fmtDate,
    forecast,
    forecasting,
    format,
    range: { hi: hiRead, lo: loRead },
    readings,
    references,
  });
  const plane = { x0, x1, y0: notes.length > 0 ? NOTED_TOP : 40, y1: floor };
  const within = [x0, x1 - axisRoom(axis).right] as const;
  const clearing = (i: number) => clears(references, valueAt(readings, i));
  const avoid = [
    ...live.map((i) => ({ x: frame.x(i), y: y(valueAt(readings, i)) })),
    ...[hero, last].flatMap((i) =>
      i < 0 ? [] : [{ x: frame.x(i), y: y(valueAt(readings, i)) - 12 }]
    ),
  ];

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = pointerX(e, width);
    const nearest = nearestDay(live, first, dayAt, xScale.invert(px));
    show(nearest, frame.x(nearest), frame.y(valueAt(readings, nearest)) - 16);
  };

  return (
    <ChartSvg
      className="touch-pan-y"
      height={height}
      desc={`${desc}${notesDesc(notes, readings, fmtDate)}`}
      label={title ?? label}
      leave={clear}
      onPointerMove={onMove}
      width={width}
    >
      <LineLayers
        avoid={avoid}
        axis={axis}
        bands={bands}
        clearing={clearing}
        forecast={forecast.at}
        forecastLabel={forecast.label}
        forecasting={forecasting}
        format={format}
        frame={frame}
        height={height}
        hero={hero}
        hover={hover}
        last={last}
        metrics={metrics}
        note={note}
        notes={notes}
        paths={paths}
        plane={plane}
        readings={readings}
        references={references}
        series={series}
        wholeNumbers={wholeNumbers}
        width={width}
        within={within}
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
  const bands = bandsOf(props.intervals, readings);
  const forecast = {
    at: forecastAt(readings, props.forecast),
    label: props.forecast?.label ?? "Forecast",
  };
  const extra = intervalTable(
    bands,
    { at: forecast.at, shown: props.forecast !== undefined },
    format
  );

  const notes = foundNotes(props.notes, readings);
  const table = withNotes(
    ["Date", "Value", ...extra.columns],
    readingRows(readings, fmtDate, format).map((row, i) => [
      ...row,
      ...extra.cells(i),
    ]),
    notes
  );

  return (
    <Plot
      initialWidth={props.initialWidth}
      width={props.width}
      {...plotOptions(props)}
      table={chartTable(props, props.title ?? "Daily values", table.columns, [
        ...table.rows,
        ...referenceRows(props.references, format, {
          columns: table.columns.length,
          values: [1],
        }),
      ])}
      overlay={
        at === null || tip === undefined ? null : (
          <Tooltip x={at.x} y={at.y}>
            <TipText
              facts={[
                format(tip.value ?? 0),
                ...(isWeekend(tip.date) ? ["weekend"] : []),
                ...(at.key >= forecast.at
                  ? [forecast.label.toLowerCase()]
                  : []),
                ...intervalFacts(bands, at.key, format),
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
            axis={props.valueAxis ?? "right"}
            domain={props.domain}
            bands={bands}
            clear={clear}
            forecast={forecast}
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
            references={props.references}
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
