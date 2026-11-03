import type { PointerEvent } from "react";

import { dayTickLabels, fmtInt } from "../../lib/format";
import type { ValueAxis } from "../../schema/daily";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import type { HeroContext } from "../../schema/hero";
import type { FontMetrics } from "../../schema/metrics";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { contextClass, heroLast } from "../hero";
import { HeroDot } from "../hero-marks";
import { useHover } from "../hooks";
import { TipText } from "../hover";
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
  heroesOf,
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
} from "./intervals";
import type { Band } from "./intervals";
import { frameOf, linePaths, nearestDay, valueLabelBoxes } from "./line-frame";
import type { Frame } from "./line-frame";
import { describeLine } from "./line-words";
import { axisRoom, dailyFloor, isWeekend } from "./util-a";

/** A dot's tone: by whether it clears a reference line when one asks, else the context's. */
const dotClass = (
  hollow: boolean,
  clearing: boolean | undefined,
  context: HeroContext | undefined
) => {
  if (clearing !== undefined) {
    if (clearing) {
      return hollow ? "stroke-hero" : "fill-hero";
    }
    return hollow ? "stroke-l5" : "fill-l5";
  }
  return contextClass(context, hollow ? "stroke" : "fill");
};

interface DotsProps extends Series {
  /** Whether a reading clears the reference line that asks for ink; undefined when none does. */
  clearing: (i: number) => boolean | undefined;
  context: HeroContext | undefined;
  /** The first forecast reading: those after the last one carry no dot of their own. */
  forecast: number;
  format: (v: number) => string;
  frame: Frame;
  heroes: ReadonlySet<number>;
  hover: number | null;
}

/**
 * Day dots: hollow on weekends; the heroes larger, in ink on a paper ring and
 * drawn above the rest. Each hero carries its value; the latest day carries
 * its value quietly. A gap has no dot.
 */
const Dots = ({
  clearing,
  context,
  forecast,
  format,
  frame,
  heroes,
  hover,
  live,
  readings,
}: DotsProps) => {
  const last = live.at(-1) ?? 0;
  const labels = [...new Set([...heroes, last])];
  return (
    <g>
      {heroLast(live, (i) => heroes.has(i)).map((i) => {
        // A forecast is its dashed line and its last value, a hollow ring.
        if (i >= forecast && !heroes.has(i) && i !== last) {
          return null;
        }
        const hero = heroes.has(i);
        const hollow = !hero && (isWeekend(readings[i].date) || i >= forecast);
        const props = {
          className: "pop transition-radius",
          cx: crisp(frame.x(i)),
          cy: frame.y(valueAt(readings, i)),
          style: stagger(i, "mark"),
        };
        const key = reactKeyOf(readings[i], i);
        const tone = clearing(i);
        if (hero && tone === undefined) {
          return <HeroDot key={key} {...props} />;
        }
        const size: DotSize = hero || hover === i ? "md" : "sm";
        const dot = {
          ...props,
          className: `${props.className} ${dotClass(hollow, tone, context)}`,
          size,
        };
        return hollow ? (
          <Ring key={key} {...dot} />
        ) : (
          <Dot key={key} {...dot} />
        );
      })}
      {labels.map((i) => (
        <Label
          anchor="middle"
          key={reactKeyOf(readings[i], i)}
          order={last}
          tier="mark"
          voice={heroes.has(i) ? "value" : "axis"}
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
  context: HeroContext | undefined;
  floor: number;
  forecast: number;
  frame: Frame;
  heroes: ReadonlySet<number>;
}

/** Weekend days drop an evenly dotted stem to the floor; each hero a solid ink one. */
const Stems = ({
  context,
  floor,
  forecast,
  frame,
  heroes,
  live,
  readings,
}: StemsProps) => (
  <g>
    {live.map((i) => {
      const px = frame.x(i);
      const key = reactKeyOf(readings[i], i);
      if (heroes.has(i)) {
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
            tone={contextClass(context, "fill")}
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
  context: HeroContext | undefined;
  forecast: { at: number; label: string };
  extreme: "peak" | "trough";
  domain: [number, number] | undefined;
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  hero: readonly string[] | undefined;
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

interface LayersProps {
  avoid: Spot[];
  axis: ValueAxis;
  bands: Band[];
  clearing: (i: number) => boolean | undefined;
  context: HeroContext | undefined;
  forecast: number;
  forecastLabel: string;
  forecasting: boolean;
  format: (v: number) => string;
  frame: Frame;
  height: number;
  heroes: ReadonlySet<number>;
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
  const { bands, forecast, frame, heroes, hover, readings, references } = p;
  const { floor, x0, x1, y } = frame;
  return (
    <>
      <DailyGrid
        axis={p.axis}
        clear={valueLabelBoxes(readings, frame, p.format, [
          ...new Set([...heroes, p.last]),
        ])}
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
        context={p.context}
        floor={floor}
        forecast={forecast}
        frame={frame}
        heroes={heroes}
        {...p.series}
      />
      {hover === null || heroes.has(hover) ? null : (
        <VRule
          kind="rule"
          x={frame.x(hover)}
          y0={frame.y(valueAt(readings, hover))}
          y1={crisp(floor)}
        />
      )}
      <DailyLine
        d={p.paths.observed}
        tone={contextClass(p.context, "stroke")}
      />
      {p.paths.forecast === "" ? null : (
        <path
          className={`fade dash-rule ${contextClass(p.context, "stroke")} stroke-medium fill-none`}
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
        context={p.context}
        forecast={forecast}
        format={p.format}
        frame={frame}
        heroes={heroes}
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

/** Spots reference labels keep clear of: every dot, and the value printed over each hero and the latest. */
const labelSpots = (
  readings: Reading[],
  frame: Frame,
  [dots, named]: [number[], number[]]
) => {
  const spot = (i: number, dy: number) => ({
    x: frame.x(i),
    y: frame.y(valueAt(readings, i)) + dy,
  });
  return [...dots.map((i) => spot(i, 0)), ...named.map((i) => spot(i, -12))];
};

const HairlineLineSvg = ({
  axis,
  bands,
  clear,
  context,
  domain,
  extreme,
  fmtDate,
  forecast,
  format,
  hero,
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
  const heroes = heroesOf(readings, live, hero, { peak, trough }[extreme]);
  const { dayAt, frame, xScale } = frameOf(readings, {
    axis,
    domain,
    floor,
    reach: [lo, hi],
    top: notes.length > 0 ? NOTED_TOP : 40,
    width,
  });
  const { x0, x1 } = frame;
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
  const avoid = labelSpots(readings, frame, [live, [...heroes, last]]);
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
        context={context}
        forecast={forecast.at}
        forecastLabel={forecast.label}
        forecasting={forecasting}
        format={format}
        frame={frame}
        height={height}
        heroes={heroes}
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
            context={props.context}
            forecast={forecast}
            extreme={props.extreme ?? "peak"}
            fmtDate={fmtDate}
            format={format}
            hero={props.hero}
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
 * gaps) draw a quiet empty axis; `hero` lists readings' `id`s or dates (an
 * empty list for none), and one that names no live reading draws none.
 * `context` sets how the rest are drawn.
 */
export const HairlineLine = (props: HairlineLineProps) =>
  scoped(props.idPrefix, <HairlineLinePlot {...props} />);
