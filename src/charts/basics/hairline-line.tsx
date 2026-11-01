import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { line as d3line } from "d3-shape";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtInt } from "../../lib/format";
import { resolveDateFormat, resolveFormat } from "../../schema/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { Dot, Ring } from "../markers";
import type { DotSize } from "../marks";
import { FootNote } from "../plot-note";
import { HRule, Stem, VRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label, XLabels } from "../text";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { stagger, noteOf } from "../util";
import { ValueGrid } from "../value-grid";
import { DailyEmpty } from "./daily-empty";
import {
  isLive,
  liveOf,
  reactKeyOf,
  readingsOf,
  valueAt,
} from "./daily-readings";
import type { Reading } from "./daily-readings";
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

interface DotsProps {
  format: (v: number) => string;
  frame: Frame;
  hero: number;
  hover: number | null;
  live: number[];
  readings: Reading[];
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

interface StemsProps {
  floor: number;
  frame: Frame;
  hero: number;
  live: number[];
  readings: Reading[];
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
  note: string | undefined;
  readings: Reading[];
  show: (i: number, x: number, y: number) => void;
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

const HairlineLineSvg = ({
  clear,
  emphasis,
  extreme,
  fmtDate,
  format,
  height,
  hover,
  note,
  readings,
  show,
  width,
}: SvgProps) => {
  const live = liveOf(readings);
  const floor = dailyFloor(height, note, width);
  if (live.length === 0) {
    return <DailyEmpty floor={floor} height={height} width={width} />;
  }
  const values = live.map((i) => valueAt(readings, i));
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const peak = live[values.indexOf(hi)];
  const trough = live[values.indexOf(lo)];
  const last = live.at(-1) ?? 0;
  const [first] = live;
  // Emphasis is by key (id, else date) so reordering never moves it; a key
  // that names a gap or no reading emphasises none.
  const hero =
    emphasis === undefined
      ? { peak, trough }[extreme]
      : (live.find((i) => readings[i].key === emphasis) ?? -1);
  const frameW = Math.min(width - 16, 680);
  const x0 = Math.round((width - frameW) / 2);
  const x1 = x0 + frameW;
  const span = hi - lo;
  const y = scaleLinear()
    .domain(span === 0 ? [lo - 1, hi + 1] : [lo - span * 0.25, hi])
    .nice(5)
    .range([floor, 40]);
  const start = readings[0].date.getTime();
  const dayAt = (i: number) =>
    Math.round((readings[i].date.getTime() - start) / DAY_MS);
  const xScale = scaleLinear()
    .domain([0, Math.max(1, dayAt(readings.length - 1))])
    .range([x0 + 8, x1 - VALUE_AXIS_ROOM]);
  const frame: Frame = {
    floor,
    x: (i) => xScale(dayAt(i)),
    x0,
    x1,
    y,
  };
  const path =
    d3line<Reading>()
      .defined(isLive)
      .x((_, i) => crisp(frame.x(i)))
      .y((r) => frame.y(r.value ?? 0))(readings) ?? "";
  const label = `Daily values, ${fmtDate(readings[first].date)} to ${fmtDate(readings[last].date)}: high ${format(hi)} on ${fmtDate(readings[peak].date)}, low ${format(lo)} on ${fmtDate(readings[trough].date)}, latest ${format(valueAt(readings, last))}`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const day = xScale.invert(px);
    let nearest = first;
    for (const k of live) {
      if (Math.abs(dayAt(k) - day) < Math.abs(dayAt(nearest) - day)) {
        nearest = k;
      }
    }
    show(nearest, frame.x(nearest), frame.y(valueAt(readings, nearest)) - 16);
  };

  return (
    <ChartSvg
      className="touch-pan-y"
      height={height}
      label={label}
      leave={clear}
      onPointerMove={onMove}
      width={width}
    >
      <ValueGrid
        labelFloor
        side="right"
        floor={floor}
        format={format}
        ticks={y.ticks(5)}
        x0={x0}
        x1={x1}
        y={y}
      />
      <HRule x0={x0} x1={x1} y={floor} />
      <Stems
        floor={floor}
        frame={frame}
        hero={hero}
        live={live}
        readings={readings}
      />
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
        live={live}
        readings={readings}
      />
      <DayAxis frame={frame} readings={readings} />
      <FootNote gutter={12} height={height} text={note} width={width} />
    </ChartSvg>
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
export const HairlineLine = (props: HairlineLineProps) => {
  const readings = readingsOf(props.data ?? []);
  const format =
    props.format === undefined ? fmtInt : resolveFormat(props.format);
  const fmtDate = resolveDateFormat(props.dateFormat);
  const { at, clear, key: hover, show } = useHover<number>();
  const tip = at === null ? undefined : readings[at.key];

  return (
    <Plot
      initialWidth={props.initialWidth}
      width={props.width}
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
        <HairlineLineSvg
          clear={clear}
          emphasis={props.emphasis}
          extreme={props.extreme ?? "peak"}
          fmtDate={fmtDate}
          format={format}
          height={props.height ?? 440}
          hover={hover}
          note={noteOf(props)}
          readings={readings}
          show={show}
          width={width}
        />
      )}
    </Plot>
  );
};
