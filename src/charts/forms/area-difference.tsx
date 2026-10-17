import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { utcFormat } from "d3-time-format";
import { useState } from "react";
import type { PointerEvent } from "react";

import { fmtDegC, monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Dot } from "../markers";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, sansWidth } from "../util";
import { ValueGrid } from "../value-grid";
import { planWeeksDemo } from "./area-difference.data";
import type { PlanWeek } from "./area-difference.data";

/** Value rules, as many as d3 finds for. */
const TICKS = 5;

const fmtWeek = utcFormat("%-d %b");
/** The two lines' names, set at their right-hand ends. */
const ACTUAL_NAME = "2022";
const NORMAL_NAME = "Normal";

/** Temperatures read in degrees, to a tenth ("12.3 °C"). */
const degrees = fmtDegC;
/** Value rules fall on whole degrees ("10 °C"). */
const ruleDegrees = (v: number) => fmtDegC(v).replace(".0 °C", " °C");

interface Frame {
  bottom: number;
  top: number;
  x: (i: number) => number;
  x0: number;
  x1: number;
  y: ScaleLinear<number, number>;
}

const makeFrame = (data: PlanWeek[], width: number, height: number) => {
  const values = data.flatMap((d) => [d.actual, d.plan]);
  const bottom = height - 30;
  const top = 12;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // A little air under the lowest week, so the floor never meets the line.
  const y = scaleLinear()
    .domain([lo - (hi - lo) * 0.06, hi])
    .range([bottom, top]);
  // Room for the widest value label and its gap, and for the end names.
  const x0 =
    Math.ceil(
      Math.max(
        ...y
          .ticks(TICKS)
          .map((t) => sansWidth(ruleDegrees(t).replaceAll("1", "0"), 11))
      )
    ) + 8;
  const x1 =
    width -
    8 -
    Math.ceil(Math.max(sansWidth(ACTUAL_NAME, 11), sansWidth(NORMAL_NAME, 11)));
  const x = scaleLinear()
    .domain([0, data.length - 1])
    .range([x0, x1]);
  return { bottom, top, x: (i: number) => x(i), x0, x1, y } satisfies Frame;
};

/** Ends of the two lines, labelled in place; nudged apart when they meet. */
const EndLabels = (props: { data: PlanWeek[]; frame: Frame }) => {
  const last = props.data.at(-1);
  if (last === undefined) {
    return null;
  }
  const ya = props.frame.y(last.actual);
  const yp = props.frame.y(last.plan);
  const mid = (ya + yp) / 2;
  const half = Math.max(Math.abs(ya - yp), 14) / 2;
  const actualUp = ya <= yp;
  return (
    <g className="fade">
      <text
        className="t-label"
        dy="0.34em"
        x={props.frame.x1 + 8}
        y={actualUp ? mid - half : mid + half}
      >
        {ACTUAL_NAME}
      </text>
      <text
        className="t-axis"
        dy="0.34em"
        x={props.frame.x1 + 8}
        y={actualUp ? mid + half : mid - half}
      >
        {NORMAL_NAME}
      </text>
    </g>
  );
};

/** Month initials under the plot and three quiet value rules behind it. */
const Axes = (props: { data: PlanWeek[]; frame: Frame; width: number }) => {
  const { frame } = props;
  const step = props.width < 520 ? 3 : 2;
  const firsts = props.data.flatMap((d, i) => {
    const prev = props.data[i - 1];
    const fresh =
      prev === undefined || prev.week.getUTCMonth() !== d.week.getUTCMonth();
    return fresh && d.week.getUTCMonth() % step === 0 ? [i] : [];
  });
  const labels = monthTickLabels(firsts.map((i) => props.data[i].week));
  return (
    <g>
      <ValueGrid
        floor={frame.bottom - 8}
        ticks={frame.y.ticks(TICKS)}
        format={ruleDegrees}
        x0={frame.x0}
        x1={frame.x1}
        y={frame.y}
      />
      {firsts.map((i, k) => (
        <text
          className="t-axis"
          key={props.data[i].week.toISOString()}
          textAnchor="middle"
          x={frame.x(i)}
          y={frame.bottom + 22}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

/** The week under the pointer: a rule across the gap and a dot on each line. */
const GapReading = (props: { d: PlanWeek; frame: Frame; i: number }) => {
  const x = props.frame.x(props.i);
  const ya = props.frame.y(props.d.actual);
  const yp = props.frame.y(props.d.plan);
  return (
    <g className="pointer-events-none">
      <line
        className="stroke-ink shape-crisp"
        strokeWidth={1}
        x1={crisp(x)}
        x2={crisp(x)}
        y1={Math.min(ya, yp)}
        y2={Math.max(ya, yp)}
      />
      <Dot className="fill-l4" cx={x} cy={yp} size="sm" />
      <Dot className="fill-hero" cx={x} cy={ya} size="md" />
    </g>
  );
};

/** The hovered week and where its tooltip sits. */
interface Hover {
  i: number;
  x: number;
  y: number;
}

interface SvgProps {
  data: PlanWeek[];
  height: number;
  hover: number | null;
  setHover: (h: Hover | null) => void;
  width: number;
}

const AreaDifferenceSvg = (props: SvgProps) => {
  const tex = useTextureIds("plan-gap");
  const { data } = props;
  const frame = makeFrame(data, props.width, props.height);
  const x = (_: PlanWeek, i: number) => frame.x(i);
  const between = area<PlanWeek>()
    .curve(curveMonotoneX)
    .x(x)
    .y0((d) => frame.y(d.plan))
    .y1((d) => frame.y(d.actual))(data);
  const above = area<PlanWeek>()
    .curve(curveMonotoneX)
    .x(x)
    .y0(frame.top - 8)
    .y1((d) => frame.y(d.plan))(data);
  const below = area<PlanWeek>()
    .curve(curveMonotoneX)
    .x(x)
    .y0(frame.bottom + 8)
    .y1((d) => frame.y(d.plan))(data);
  const trace = (key: "actual" | "plan") =>
    line<PlanWeek>()
      .curve(curveMonotoneX)
      .x(x)
      .y((d) => frame.y(d[key]))(data) ?? "";
  const ahead = data.filter((d) => d.actual >= d.plan).length;
  const label = `Weekly mean temperature in Central England, 2022, against the 1991 to 2020 normal: above normal in ${ahead} of ${data.length} weeks`;

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const t = (px - frame.x0) / (frame.x1 - frame.x0);
    const i = clamp(Math.round(t * (data.length - 1)), 0, data.length - 1);
    const d = data[i];
    props.setHover({
      i,
      x: frame.x(i),
      y: frame.y(Math.max(d.actual, d.plan)) - 8,
    });
  };

  return (
    <svg
      aria-label={label}
      className="touch-pan-y"
      height={props.height}
      onPointerLeave={() => {
        props.setHover(null);
      }}
      onPointerMove={onMove}
      width={props.width}
    >
      <title>{label}</title>
      <defs>
        <CrossHatch id={tex("lead")} tone="fill-hero" />
        <Hatch angle="rising" id={tex("hatch")} tone="fill-l4" />
        <clipPath id={tex("above")}>
          <path d={above ?? ""} />
        </clipPath>
        <clipPath id={tex("below")}>
          <path d={below ?? ""} />
        </clipPath>
      </defs>
      <Axes data={data} frame={frame} width={props.width} />
      <g className="fade">
        <path
          clipPath={paint(tex("above"))}
          d={between ?? ""}
          fill={paint(tex("lead"))}
        />
        <path
          clipPath={paint(tex("below"))}
          d={between ?? ""}
          fill={paint(tex("hatch"))}
        />
      </g>
      <line
        className="hairline"
        x1={frame.x0}
        x2={frame.x1}
        y1={crisp(frame.bottom)}
        y2={crisp(frame.bottom)}
      />
      <path
        className="draw stroke-l3 stroke-medium cap-round fill-none"
        d={trace("plan")}
        pathLength={1}
      />
      <path
        className="draw stroke-ink stroke-medium cap-round fill-none"
        d={trace("actual")}
        pathLength={1}
      />
      <EndLabels data={data} frame={frame} />
      {props.hover === null ? null : (
        <GapReading d={data[props.hover]} frame={frame} i={props.hover} />
      )}
    </svg>
  );
};

const gapText = (d: PlanWeek) => {
  const gap = d.actual - d.plan;
  if (gap === 0) {
    return "at normal";
  }
  return gap > 0
    ? `${degrees(gap)} above normal`
    : `${degrees(-gap)} below normal`;
};

/**
 * O5 Against normal. Two weekly lines; the gap between them is an ink
 * crosshatch where 2022 runs above the normal and a single grey hatch where
 * it runs below.
 */
export const AreaDifference = (props: { data?: PlanWeek[] }) => {
  const data = props.data ?? planWeeksDemo;
  const [hover, setHover] = useState<Hover | null>(null);
  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>Week of {fmtWeek(data[hover.i].week)}</b> ·{" "}
            {degrees(data[hover.i].actual)} · {gapText(data[hover.i])}
          </Tooltip>
        )
      }
    >
      {(width) => (
        <AreaDifferenceSvg
          data={data}
          height={460}
          hover={hover?.i ?? null}
          setHover={setHover}
          width={width}
        />
      )}
    </Plot>
  );
};
