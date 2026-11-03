import { scaleLinear } from "d3-scale";

import { fmtInt } from "../../lib/format";
import type { ValueAxis } from "../../schema/daily";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineAreaProps } from "../../schema/hairline-area";
import type { FontMetrics } from "../../schema/metrics";
import { Plot } from "../core";
import { Dot } from "../markers";
import { NOTED_TOP } from "../note-layout";
import { FootNote } from "../plot-note";
import { Pointer } from "../pointer";
import { clears, referenceRows, referenceValues } from "../reference-marks";
import type { Spot } from "../reference-marks";
import type { Plane } from "../reference-plates";
import { ReferenceBands, ReferenceOverlay } from "../references";
import { HRule } from "../rules";
import { scoped, chartTable, plotOptions } from "../shared-options";
import { ChartSvg } from "../svg";
import { Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { stagger, noteOf } from "../util";
import { DayStems, HeroMark, MonthAxis } from "./area-marks";
import {
  edgesOf,
  heroLabelBox,
  shapesOf,
  startOf,
  valueScale,
} from "./area-shapes";
import type { Frame } from "./area-shapes";
import { describeArea } from "./area-words";
import { DailyEmpty } from "./daily-empty";
import { DailyGrid, DailyLine } from "./daily-grid";
import { dailyFacts, dailyKeepOff } from "./daily-keep-off";
import { DailyNoteList, DailyNoteMarks } from "./daily-note-marks";
import { foundNotes, notesDesc, withNotes } from "./daily-notes";
import type { FoundNote } from "./daily-notes";
import {
  heroOf,
  seriesOf,
  readingRows,
  readingStops,
  readingsOf,
  valueAt,
} from "./daily-readings";
import type { Reading, Series } from "./daily-readings";
import { ForecastRule, IntervalBands, IntervalNames } from "./interval-marks";
import { bandValues, bandsOf, forecastAt, intervalTable } from "./intervals";
import type { Band } from "./intervals";
import { axisRoom, dailyFloor } from "./util-a";

interface LayersProps {
  avoid: Spot[];
  axis: ValueAxis;
  axisTicks: number[];
  bands: Band[];
  clearing: (i: number) => boolean | undefined;
  fill: string;
  forecast: { at: number; label: string };
  forecastPath: string;
  forecasting: boolean;
  format: (v: number) => string;
  frame: Frame;
  height: number;
  hero: number;
  hover: number | null;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  path: string;
  plane: Plane;
  readings: Reading[];
  references: HairlineAreaProps["references"];
  series: Series;
  stipple: string;
  wholeNumbers: boolean;
  width: number;
  within: readonly [number, number];
}

/** Everything the plot draws, back to front. */
const AreaLayers = (p: LayersProps) => {
  const { bands, frame, hero, hover, readings, references } = p;
  const { floor } = frame;
  const { x0, x1 } = p.plane;
  return (
    <>
      <defs>
        <Stipple id={p.stipple} tone="fill-l3" />
      </defs>
      <DailyGrid
        axis={p.axis}
        clear={hero < 0 ? [] : [heroLabelBox(readings, frame, p.format, hero)]}
        floor={floor}
        format={p.format}
        ticks={p.axisTicks}
        wholeNumbers={p.wholeNumbers}
        x0={x0}
        x1={x1}
        y={frame.y}
      />
      <ReferenceBands
        along="y"
        plane={p.plane}
        refs={references}
        scale={frame.y}
        within={p.within}
      />
      <IntervalBands bands={bands} x={frame.x} y={frame.y} />
      <path
        className="fade"
        d={p.fill}
        fill={paint(p.stipple)}
        style={stagger(2, "series")}
      />
      <DayStems
        clearing={p.clearing}
        forecast={p.forecast.at}
        frame={frame}
        hero={hero}
        hover={hover}
        {...p.series}
      />
      <HRule x0={x0} x1={x1} y={floor} />
      <DailyLine d={p.path} style={stagger(4, "series")} />
      {p.forecastPath === "" ? null : (
        <path
          className="fade dash-rule stroke-l3 stroke-medium fill-none"
          d={p.forecastPath}
        />
      )}
      {p.forecasting ? (
        <ForecastRule
          bottom={floor}
          label={p.forecast.label}
          top={p.plane.y0}
          x={Math.round(frame.x(p.forecast.at - 1))}
        />
      ) : null}
      <IntervalNames
        bands={bands}
        bounds={[p.plane.y0, floor]}
        x={frame.x}
        y={frame.y}
      />
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
          format={p.format}
          frame={frame}
          value={valueAt(readings, hero)}
          x={frame.x(hero)}
        />
      )}
      <ReferenceOverlay
        along="y"
        avoid={p.avoid}
        plane={p.plane}
        refs={references}
        scale={frame.y}
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
      <MonthAxis frame={frame} readings={readings} />
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

interface PointerProps extends Omit<LayersProps, "hover"> {
  desc: string;
  fmtDate: (d: Date) => string;
  label: string;
}

/** The plot with its one pointer: the stops, the tip and the crosshair. */
const AreaPointer = (p: PointerProps) => {
  const { forecast, frame, hero, plane, readings, series } = p;
  const labels =
    hero < 0 ? [] : [heroLabelBox(readings, frame, p.format, hero)];
  const stops = readingStops(series, {
    facts: dailyFacts({ bands: p.bands, forecast }, p.format),
    fmtDate: p.fmtDate,
    format: p.format,
    heroes: new Set(hero < 0 ? [] : [hero]),
    keepOff: dailyKeepOff({
      bands: p.bands,
      forecast,
      forecasting: p.forecasting,
      notes: {
        floor: frame.floor,
        frame,
        live: series.live,
        notes: p.notes,
        readings,
        width: p.width,
        x0: plane.x0,
        x1: plane.x1,
      },
      references: {
        avoid: p.avoid,
        plane,
        refs: p.references,
        scale: frame.y,
        within: p.within,
      },
    }),
    labels,
    x: frame.x,
    y: frame.y,
  });
  return (
    <Pointer
      axis="x"
      crosshair={{ bottom: Math.round(frame.floor), top: plane.y0 }}
      height={p.height}
      stops={stops}
      width={p.width}
    >
      {(pointer) => (
        <ChartSvg
          desc={p.desc}
          height={p.height}
          label={p.label}
          width={p.width}
          {...pointer.svg}
        >
          <AreaLayers {...p} hover={pointer.key} />
          {pointer.marks}
        </ChartSvg>
      )}
    </Pointer>
  );
};

interface SvgProps {
  axis: ValueAxis;
  bands: Band[];
  forecast: { at: number; label: string };
  /** Pattern id of the stipple under the line. */
  stipple: string;
  domain: [number, number] | undefined;
  emphasis: string | null | undefined;
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  maxWidth: number;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  notes: FoundNote[];
  readings: Reading[];
  references: HairlineAreaProps["references"];
  title: string | undefined;
  ticks: number[] | undefined;
  /** The format is the default whole number, which the axis may refine. */
  wholeNumbers: boolean;
  width: number;
}

/** The value axis over the reach, and the readings across the plot. */
const frameOf = (
  readings: Reading[],
  at: {
    floor: number;
    reach: { hi: number; lo: number };
    domain: [number, number] | undefined;
    span: [number, number];
    ticks: number[] | undefined;
    top: number;
  }
): Frame => ({
  floor: at.floor,
  x: scaleLinear()
    .domain([0, Math.max(1, readings.length - 1)])
    .range(at.span),
  y: valueScale(at.reach, at.floor, at.top, {
    domain: at.domain,
    ticks: at.ticks,
  }),
});

/** Where the marks sit, for labels to keep clear of. */
const avoidOf = (
  readings: Reading[],
  live: number[],
  frame: Frame,
  hero: number
) => [
  ...live.map((i) => ({ x: frame.x(i), y: frame.y(valueAt(readings, i)) })),
  ...(hero < 0
    ? []
    : [{ x: frame.x(hero), y: frame.y(valueAt(readings, hero)) - 13 }]),
];

const HairlineAreaSvg = ({
  axis,
  bands,
  domain,
  stipple,
  emphasis,
  fmtDate,
  forecast,
  format,
  height,
  maxWidth,
  metrics,
  note,
  notes,
  readings,
  references,
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
  const reach = [...referenceValues(references), ...bandValues(bands)];
  const peak = live[values.indexOf(max)];
  const hero = heroOf(readings, live, emphasis, peak);
  const top = notes.length > 0 ? NOTED_TOP : 40;
  const [x0, x1] = edgesOf(width, maxWidth, axis);
  const start = startOf(readings, hero, format);
  const frame = frameOf(readings, {
    domain,
    floor,
    reach: { hi: Math.max(max, ...reach), lo: Math.min(...values, ...reach) },
    span: [x0 + start, x1 - axisRoom(axis).right],
    ticks,
    top,
  });
  const {
    fill,
    forecast: forecastPath,
    path,
  } = shapesOf(readings, frame, forecast.at);
  const forecasting = forecast.at > 0 && forecast.at < readings.length;
  const plane = { x0, x1, y0: top, y1: floor };
  const within = [x0, x1 - axisRoom(axis).right] as const;
  const clearing = (i: number) => clears(references, valueAt(readings, i));
  const avoid = avoidOf(readings, live, frame, hero);
  const axisTicks = ticks ?? frame.y.ticks(4);
  const { desc, label } = describeArea({
    bands,
    fmtDate,
    forecast,
    forecasting,
    format,
    max,
    peak,
    readings,
    references,
  });

  return (
    <AreaPointer
      avoid={avoid}
      axis={axis}
      axisTicks={axisTicks}
      bands={bands}
      clearing={clearing}
      desc={`${desc}${notesDesc(notes, readings, fmtDate)}`}
      fill={fill}
      fmtDate={fmtDate}
      forecast={forecast}
      forecastPath={forecastPath}
      forecasting={forecasting}
      format={format}
      frame={frame}
      height={height}
      hero={hero}
      label={title ?? label}
      metrics={metrics}
      note={note}
      notes={notes}
      path={path}
      plane={plane}
      readings={readings}
      references={references}
      series={series}
      stipple={stipple}
      wholeNumbers={wholeNumbers}
      width={width}
      within={within}
    />
  );
};

const HairlineAreaPlot = (props: HairlineAreaProps) => {
  const readings = readingsOf(props.data ?? []);
  const format =
    props.format === undefined ? fmtInt : resolveFormat(props.format);
  const fmtDate = resolveDateFormat(props.dateFormat);
  const stipple = useTextureIds("daily")("stipple");
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
    >
      {(width) => (
        <>
          <HairlineAreaSvg
            axis={props.valueAxis ?? "right"}
            domain={props.domain}
            bands={bands}
            forecast={forecast}
            emphasis={props.emphasis}
            stipple={stipple}
            fmtDate={fmtDate}
            format={format}
            height={props.height ?? 440}
            maxWidth={props.maxWidth ?? 640}
            metrics={props.metrics}
            note={noteOf(props)}
            notes={notes}
            readings={readings}
            references={props.references}
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
