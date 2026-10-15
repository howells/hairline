import { scaleLinear, scaleUtc } from "d3-scale";
import { line } from "d3-shape";
import type { ReactNode } from "react";

import type { Point } from "../../lib/data";
import { fmtDay } from "../../lib/format";
import { crisp } from "../axes";
import type { Margin } from "../axes";
import { Chart, HGrid, SplitClips } from "../core";
import { useScrub } from "../hooks";
import { DottedPath } from "../texture";
import { useTextureIds } from "../texture-ids";
import { ValueGrid } from "../value-grid";
import { inRun, worstRun } from "./breach";
import type { Threshold } from "./breach";
import { CursorTags, FigureReadout, ValueReadout } from "./cursor-readouts";
import { Key } from "./key";
import { keyItem } from "./key-item";
import { MonthAxis } from "./month-axis";
import { labelledTicks, monthTicks } from "./month-ticks";
import {
  CAPTION,
  CURSOR,
  DOT,
  LINE,
  RULE_TARGET,
  RULE_ZERO,
  TICK,
  TICK_STRONG,
} from "./styles";
import { Patterns, SeasonBands, ShadeLayer } from "./time-fills";
import {
  DOT_TONE,
  LINE_TONE,
  curveOf,
  gridEnd,
  isRightAxis,
  seriesKey,
  sideMargins,
} from "./time-frame";
import type { Frame, LineSeries, Readout, TimeLinesProps } from "./time-frame";

export type { LineSeries } from "./time-frame";

/** Room above the plot for whatever sits there. */
const topRoom = (props: TimeLinesProps, readout: Readout) => {
  if (readout === "figure") {
    return 72;
  }
  if (readout === "value" || props.bands !== undefined) {
    return 28;
  }
  // A right-hand scale's top label sits above its gridline.
  return isRightAxis(props.y) ? 18 : 8;
};

const plotMargin = (props: TimeLinesProps, readout: Readout): Margin => {
  if (props.compact !== undefined) {
    return { bottom: 4, left: 2, right: 2, top: 4, ...props.margin };
  }
  return {
    bottom: 30,
    ...sideMargins(props.y, 8, 2),
    top: topRoom(props, readout),
    ...props.margin,
  };
};

const chartTop = (
  props: TimeLinesProps,
  readout: Readout,
  index: number
): ReactNode => {
  if (props.compact !== undefined) {
    return <div className={`${CAPTION} pb-2.5`}>{props.compact.title}</div>;
  }
  if (readout === "legend") {
    return (
      <Key
        className="mb-3"
        items={props.series.map((s) => ({
          fill: LINE_TONE[s.tone].past,
          label: s.name,
          value: s.format(s.data[index].value),
        }))}
      />
    );
  }
  return null;
};

/** Clip for the alert overlay: the side of the threshold that breaks it. */
const AlertClip = (props: { frame: Frame; threshold: Threshold }) => {
  const { height, id, width, y } = props.frame;
  const th = props.threshold;
  const thY = y(th.value);
  return (
    <defs>
      <clipPath id={`${id}-alert`}>
        {th.alert === "below" ? (
          <rect x={0} y={thY} width={width} height={height - thY + 20} />
        ) : (
          <rect x={0} y={-20} width={width} height={thY + 20} />
        )}
      </clipPath>
    </defs>
  );
};

/**
 * A series' vertices from index `from`, in px; a stepped series gains the
 * corner of each step, so its dots follow the staircase the solid line draws.
 */
const verticesFrom = (
  frame: Frame,
  data: Point[],
  from: number,
  step: boolean
) =>
  data.slice(from).flatMap((p, k, rest) => {
    const at = { x: frame.x(p.date), y: frame.y(p.value) };
    const prev = rest[k - 1];
    if (!step || prev === undefined) {
      return [at];
    }
    return [{ x: at.x, y: frame.y(prev.value) }, at];
  });

/** One series: solid up to the cursor, then evenly dotted, or solid throughout. */
const SeriesLine = (props: {
  frame: Frame;
  series: LineSeries;
  d: string;
  cursor: number;
  step: boolean;
}) => {
  const { cursor, d, frame, series: s } = props;
  const tone = LINE_TONE[s.tone];
  const vertices = (from: number) =>
    verticesFrom(frame, s.data, from, props.step);
  if (s.dashed === true) {
    return <DottedPath points={vertices(0)} tone={DOT_TONE[s.tone]} />;
  }
  if (frame.future === "none") {
    return <path className={LINE} d={d} stroke={tone.past} />;
  }
  return (
    <g>
      <path
        className={LINE}
        d={d}
        stroke={tone.past}
        clipPath={`url(#${frame.id}-past)`}
      />
      <DottedPath points={vertices(cursor)} tone={DOT_TONE[s.tone]} />
    </g>
  );
};

/** Shade, lines and the worst breach in red. */
const SeriesLayer = (props: {
  chart: TimeLinesProps;
  frame: Frame;
  cursor: number;
  run: [number, number] | null;
}) => {
  const { chart, frame, run } = props;
  const { id, x, y } = frame;
  const linePath = (data: Point[]) =>
    line<Point>()
      .x((d) => x(d.date))
      .y((d) => y(d.value))
      .curve(curveOf(chart))(data) ?? "";
  const [primary] = chart.series;
  return (
    <g clipPath={`url(#${id}-sweep)`}>
      <ShadeLayer chart={chart} frame={frame} />
      {chart.series.map((s) => (
        <SeriesLine
          key={seriesKey(s)}
          frame={frame}
          series={s}
          d={linePath(s.data)}
          cursor={props.cursor}
          step={chart.step === true}
        />
      ))}
      {run !== null && (
        <path
          className={`${LINE} stroke-alert`}
          d={linePath(primary.data.slice(Math.max(0, run[0] - 1), run[1] + 2))}
          clipPath={`url(#${id}-alert)`}
        />
      )}
    </g>
  );
};

const ThresholdRule = (props: { frame: Frame; threshold: Threshold }) => {
  const { m, width, y } = props.frame;
  const th = props.threshold;
  const thY = y(th.value);
  return (
    <g className="fade">
      <line
        className={RULE_TARGET}
        x1={m.left}
        x2={width - m.right}
        y1={crisp(thY)}
        y2={crisp(thY)}
      />
      {/* The label sits on the side the line keeps clear of. */}
      {th.label !== undefined && th.label !== "" && (
        <text
          className={`${TICK} t-halo`}
          x={width - m.right}
          y={th.alert === "below" ? thY + 14 : thY - 6}
          textAnchor="end"
        >
          {th.label}
        </text>
      )}
    </g>
  );
};

/** Clear space kept around the date under the cursor, px. */
const DATE_CLEAR = 64;

/** The months under the plot; those near the cursor's date give way. */
const MonthTicks = (props: {
  frame: Frame;
  ticks: Date[];
  /** The cursor's x when a date sits under it. */
  dateX: number | null;
}) => {
  const { dateX, frame } = props;
  const months = labelledTicks(
    props.ticks,
    (d) => d,
    (d) => frame.x(d)
  ).filter((t) => dateX === null || Math.abs(t.x - dateX) > DATE_CLEAR);
  return (
    <MonthAxis ticks={months} y={frame.plotBottom + 14} width={frame.width} />
  );
};

const ScrubCursor = (props: {
  chart: TimeLinesProps;
  frame: Frame;
  readout: Readout;
  cx: number;
  index: number;
  run: [number, number] | null;
}) => {
  const { chart, cx, frame, index, readout } = props;
  const { m, plotBottom, y } = frame;
  const compact = chart.compact !== undefined;
  const lift = readout === "value" ? 6 : 0;
  const red = inRun(props.run, index);
  return (
    <g>
      <line
        className={CURSOR}
        x1={crisp(cx)}
        x2={crisp(cx)}
        y1={compact ? m.top : m.top - lift}
        y2={plotBottom}
      />
      {chart.series.map((s, i) => (
        <circle
          key={seriesKey(s)}
          className={`${DOT} ${red && i === 0 ? "stroke-alert" : ""}`}
          cx={cx}
          cy={y(s.data[index].value)}
          r={compact ? 3 : 4.5}
          fill="var(--bg)"
          stroke={red && i === 0 ? undefined : LINE_TONE[s.tone].past}
          strokeWidth={1.5}
        />
      ))}
      {readout === "value" && (
        <ValueReadout
          x={cx}
          y={m.top - 14}
          text={chart.series[0].format(chart.series[0].data[index].value)}
        />
      )}
      {readout === "tags" && (
        <CursorTags
          cx={cx}
          right={frame.width - m.right}
          min={m.top + 6}
          max={plotBottom - 8}
          plate={chart.fill !== undefined}
          tags={chart.series.map((s) => ({
            id: seriesKey(s),
            name: s.name,
            value: s.format(s.data[index].value),
            y: y(s.data[index].value),
          }))}
        />
      )}
      {chart.dateReadout === true && (
        <text
          className={TICK_STRONG}
          x={cx}
          y={plotBottom + 14}
          dy="0.71em"
          textAnchor="middle"
        >
          {fmtDay(chart.series[0].data[index].date)}
        </text>
      )}
    </g>
  );
};

/**
 * The value grid with its scale (or, for a sparkline, one baseline), the
 * baseline under the plot, and the zero rule where zero sits above it.
 */
const Grid = (props: { chart: TimeLinesProps; frame: Frame }) => {
  const { chart, frame } = props;
  const { m, plotBottom, width } = frame;
  if (chart.compact !== undefined) {
    const ys = chart.zero === true ? [frame.y(0)] : [plotBottom];
    return (
      <HGrid ys={ys} x0={m.left} x1={width - m.right} className={RULE_ZERO} />
    );
  }
  const x1 = gridEnd(chart.y, width, m.right);
  const rules =
    chart.zero === true && frame.y(0) < plotBottom - 1
      ? [plotBottom, frame.y(0)]
      : [plotBottom];
  return (
    <>
      <ValueGrid
        floor={plotBottom}
        format={chart.y.format ?? String}
        labelFloor
        side={chart.y.side}
        ticks={chart.y.ticks ?? []}
        x0={m.left}
        x1={x1}
        y={frame.y}
      />
      <HGrid ys={rules} x0={m.left} x1={x1} className={RULE_ZERO} />
    </>
  );
};

type Scrub = ReturnType<typeof useScrub>;

const makeFrame = (
  chart: TimeLinesProps,
  readout: Readout,
  tex: (name: string) => string,
  width: number
): Frame => {
  const dates = chart.series[0].data.map((d) => d.date);
  const m = plotMargin(chart, readout);
  const h = chart.height;
  return {
    future: chart.future ?? "dotted",
    height: h,
    id: tex("clip"),
    m,
    plotBottom: h - m.bottom,
    tex,
    width,
    x: scaleUtc()
      .domain([dates[0], dates.at(-1) ?? dates[0]])
      .range([m.left, width - m.right]),
    y: scaleLinear()
      .domain(chart.y.domain)
      .range([h - m.bottom, m.top]),
  };
};

const TimeLinesPlot = (props: {
  chart: TimeLinesProps;
  tex: (name: string) => string;
  readout: Readout;
  scrub: Scrub;
  width: number;
}) => {
  const { chart, readout, scrub, width } = props;
  const frame = makeFrame(chart, readout, props.tex, width);
  const dates = chart.series[0].data.map((d) => d.date);
  const positions = dates.map((d) => frame.x(d));
  const cx = positions[scrub.index];
  const ticks = monthTicks(dates[0], dates.at(-1) ?? dates[0]);
  const compact = chart.compact !== undefined;
  const showCursor = scrub.isHovering || (chart.cursorAtRest ?? true);
  const dateX = chart.dateReadout === true && showCursor ? cx : null;
  const run = worstRun(chart.threshold, chart.series[0].data);
  // The split stays at rest when the cursor is hidden.
  const cursor = scrub.index;

  return (
    <svg
      width={width}
      height={chart.height}
      aria-label={chart.label}
      {...scrub.bind(positions)}
    >
      <title>{chart.label}</title>
      <SplitClips id={frame.id} x={cx} width={width} height={chart.height} />
      <Patterns chart={chart} frame={frame} />
      {chart.threshold !== undefined && (
        <AlertClip frame={frame} threshold={chart.threshold} />
      )}
      {chart.bands !== undefined && (
        <SeasonBands bands={chart.bands} frame={frame} />
      )}
      <Grid chart={chart} frame={frame} />
      <SeriesLayer chart={chart} frame={frame} cursor={cursor} run={run} />
      {chart.threshold !== undefined && (
        <ThresholdRule frame={frame} threshold={chart.threshold} />
      )}
      {!compact && <MonthTicks frame={frame} ticks={ticks} dateX={dateX} />}
      {readout === "figure" && (
        <FigureReadout
          x={frame.m.left}
          value={chart.series[0].format(
            chart.series[0].data[scrub.index].value
          )}
          date={fmtDay(chart.series[0].data[scrub.index].date)}
        />
      )}
      {showCursor && (
        <ScrubCursor
          chart={chart}
          frame={frame}
          readout={readout}
          cx={cx}
          index={scrub.index}
          run={run}
        />
      )}
    </svg>
  );
};

/** Weekly lines with a scrub cursor: solid before it, evenly dotted after. */
export const TimeLines = (props: TimeLinesProps) => {
  const tex = useTextureIds("tl");
  const dates = props.series[0].data.map((d) => d.date);
  const scrub = useScrub(props.rest, dates, props.sync);
  const readout =
    props.readout ?? (props.compact === undefined ? "legend" : "none");

  return (
    <Chart
      top={chartTop(props, readout, scrub.index)}
      bottom={
        props.bottomLegend === undefined ? undefined : (
          <Key items={props.bottomLegend.map(keyItem)} className="mt-3" />
        )
      }
    >
      {(width) => (
        <TimeLinesPlot
          chart={props}
          tex={tex}
          readout={readout}
          scrub={scrub}
          width={width}
        />
      )}
    </Chart>
  );
};
