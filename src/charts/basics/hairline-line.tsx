import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { line as d3line } from "d3-shape";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtInt } from "../../lib/format";
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
import { stagger } from "../util";
import { ValueGrid } from "../value-grid";
import { hairlineLineDemo } from "./hairline-line.data";
import type { DailyDatum } from "./hairline-line.data";
import { VALUE_AXIS_ROOM, dailyFloor, fmtMonthDay, isWeekend } from "./util-a";

interface HairlineLineProps {
  data?: DailyDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Footnote under the axis, e.g. "one dot = one day · hollow = weekend". */
  note?: string;
  /** Index drawn in the hero colour. Defaults to the emphasised extreme. */
  highlight?: number;
  /** Which extreme the hero marks when `highlight` is not given. Defaults to the peak. */
  emphasis?: "peak" | "trough";
  /** Date label for axis and tooltip. */
  formatDate?: (d: Date) => string;
}

interface Frame {
  floor: number;
  /** Where record `i` stands: by its date, so a missing day leaves a gap. */
  x: (i: number) => number;
  /** The frame's left and right edges: gridlines and baseline span them. */
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

const dayKey = (d: DailyDatum) => d.date.toISOString();

const DAY_MS = 86_400_000;

const dotClass = (hollow: boolean, hero: boolean) => {
  if (hero) {
    return "fill-hero";
  }
  return hollow ? "stroke-l3" : "fill-l3";
};

interface DotsProps {
  data: DailyDatum[];
  format: (v: number) => string;
  frame: Frame;
  hero: number;
  hover: number | null;
}

/**
 * Day dots: hollow on weekends, the hero larger and in ink. The hero carries
 * its value; the latest day carries its value quietly.
 */
const Dots = ({ data, format, frame, hero, hover }: DotsProps) => {
  const last = data.length - 1;
  const size = (i: number): DotSize =>
    i === hero || hover === i ? "md" : "sm";
  const labels = hero === last ? [hero] : [hero, last];
  return (
    <g>
      {data.map((d, i) => {
        const hollow = i !== hero && isWeekend(d.date);
        const props = {
          className: `pop transition-radius ${dotClass(hollow, i === hero)}`,
          cx: crisp(frame.x(i)),
          cy: frame.y(d.value),
          size: size(i),
          style: stagger(i, "mark"),
        };
        return hollow ? (
          <Ring key={dayKey(d)} {...props} />
        ) : (
          <Dot key={dayKey(d)} {...props} />
        );
      })}
      {labels.map((i) => (
        <Label
          anchor="middle"
          key={dayKey(data[i])}
          order={last}
          tier="mark"
          voice={i === hero ? "value" : "axis"}
          x={frame.x(i)}
          y={frame.y(data[i].value) - 12}
        >
          {format(data[i].value)}
        </Label>
      ))}
    </g>
  );
};

interface StemsProps {
  data: DailyDatum[];
  floor: number;
  frame: Frame;
  hero: number;
}

/** Weekend days drop an evenly dotted stem to the floor; the hero a solid ink one. */
const Stems = ({ data, floor, frame, hero }: StemsProps) => (
  <g>
    {data.map((d, i) => {
      const px = frame.x(i);
      if (i === hero) {
        return (
          <Stem
            className="grow-y stroke-hero"
            hero
            key={dayKey(d)}
            style={stagger(i, "mark")}
            x={px}
            y0={Math.round(floor)}
            y1={frame.y(d.value)}
          />
        );
      }
      if (!isWeekend(d.date)) {
        return null;
      }
      return (
        <g className="fade" key={dayKey(d)} style={stagger(i, "mark")}>
          <DottedLine
            pitch={TEXTURE_PITCH.dense}
            tone="fill-l4"
            x0={px}
            x1={px}
            y0={frame.y(d.value) + 6}
            y1={floor - 2}
          />
        </g>
      );
    })}
  </g>
);

interface SvgProps {
  clear: () => void;
  data: DailyDatum[];
  emphasis: "peak" | "trough";
  fmtDate: (d: Date) => string;
  format: (v: number) => string;
  height: number;
  highlight: number | undefined;
  hover: number | null;
  note: string | undefined;
  show: (i: number, x: number, y: number) => void;
  width: number;
}

/** Monday ticks, the month printed on the first and where it changes. */
const DayAxis = ({ data, frame }: { data: DailyDatum[]; frame: Frame }) => {
  const mondays = data.flatMap((d, i) => (d.date.getUTCDay() === 1 ? [i] : []));
  const labels = dayTickLabels(mondays.map((i) => data[i].date));
  return (
    <XLabels
      ticks={mondays.map((i, k) => ({ label: labels[k], x: frame.x(i) }))}
      y={frame.floor + 20}
    />
  );
};

const HairlineLineSvg = ({
  clear,
  data,
  emphasis,
  fmtDate,
  format,
  height,
  highlight,
  hover,
  note,
  show,
  width,
}: SvgProps) => {
  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const peak = values.indexOf(hi);
  const trough = values.indexOf(lo);
  const last = data.length - 1;
  const hero = highlight ?? (emphasis === "trough" ? trough : peak);
  const frameW = Math.min(width - 16, 680);
  const x0 = Math.round((width - frameW) / 2);
  const x1 = x0 + frameW;
  const floor = dailyFloor(height, note, width);
  const y = scaleLinear()
    .domain([lo - (hi - lo) * 0.25, hi])
    .nice(5)
    .range([floor, 40]);
  const first = data[0].date.getTime();
  const dayAt = (i: number) =>
    Math.round((data[i].date.getTime() - first) / DAY_MS);
  const xScale = scaleLinear()
    .domain([0, Math.max(1, dayAt(last))])
    .range([x0 + 8, x1 - VALUE_AXIS_ROOM]);
  const frame: Frame = {
    floor,
    x: (i) => xScale(dayAt(i)),
    x0,
    x1,
    y,
  };
  const path =
    d3line<DailyDatum>()
      .x((_, i) => crisp(frame.x(i)))
      .y((d) => frame.y(d.value))(data) ?? "";
  const label = `Daily values, ${fmtDate(data[0].date)} to ${fmtDate(data[last].date)}: high ${format(hi)} on ${fmtDate(data[peak].date)}, low ${format(lo)} on ${fmtDate(data[trough].date)}, latest ${format(values[last])}`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const day = xScale.invert(px);
    let i = 0;
    for (let k = 1; k < data.length; k += 1) {
      if (Math.abs(dayAt(k) - day) < Math.abs(dayAt(i) - day)) {
        i = k;
      }
    }
    show(i, frame.x(i), frame.y(data[i].value) - 16);
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
      <Stems data={data} floor={floor} frame={frame} hero={hero} />
      {hover === null || hover === hero ? null : (
        <VRule
          kind="rule"
          x={frame.x(hover)}
          y0={frame.y(data[hover].value)}
          y1={crisp(floor)}
        />
      )}
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={path}
        pathLength={1}
      />
      <Dots
        data={data}
        format={format}
        frame={frame}
        hero={hero}
        hover={hover}
      />
      <DayAxis data={data} frame={frame} />
      <FootNote gutter={12} height={height} text={note} width={width} />
    </ChartSvg>
  );
};

/**
 * F2 Daily line. One dot per reading on a grey line, placed by its date so a
 * missing day leaves a gap. Weekend days are hollow rings on an evenly dotted
 * stem to the floor; the peak (or, with `emphasis="trough"`, the lowest) is in
 * ink on a solid ink stem, with its value. The latest day carries its value
 * quietly.
 */
export const HairlineLine = (props: HairlineLineProps) => {
  const data = props.data ?? hairlineLineDemo;
  const format = props.format ?? fmtInt;
  const fmtDate = props.formatDate ?? fmtMonthDay;
  const { at, clear, key: hover, show } = useHover<number>();

  return (
    <Plot
      overlay={
        at === null ? null : (
          <Tooltip x={at.x} y={at.y}>
            <TipText
              facts={[
                format(data[at.key].value),
                ...(isWeekend(data[at.key].date) ? ["weekend"] : []),
              ]}
              lead={fmtDate(data[at.key].date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <HairlineLineSvg
          clear={clear}
          data={data}
          emphasis={props.emphasis ?? "peak"}
          fmtDate={fmtDate}
          format={format}
          height={props.height ?? 440}
          highlight={props.highlight}
          hover={hover}
          note={props.note}
          show={show}
          width={width}
        />
      )}
    </Plot>
  );
};
