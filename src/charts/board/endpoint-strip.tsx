import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useState } from "react";
import type { PointerEvent } from "react";

import { fmtMs } from "../../lib/format";
import { crisp } from "../axes";
import { Chart, VGrid } from "../core";
import { LABEL, POINT, RULE_TARGET, TICK, VALUE } from "./styles";
import { labelGap, labelRoom, thinTicks } from "./thin-ticks";

export interface StripEndpoint {
  service: string;
  /** Method and path, as routed. */
  route: string;
  /** P95 latency, ms. */
  p95: number;
}

interface ServiceRow {
  name: string;
  endpoints: StripEndpoint[];
  median: number;
}

interface EndpointStripProps {
  endpoints: StripEndpoint[];
  /** The latency target, ms: a dashed rule; the worst endpoint over it is red. */
  target: number;
  ticks: number[];
  height: number;
  label: string;
}

const median = (values: number[]) => {
  const v = values.toSorted((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};

/** One row per service, slowest median first. */
const serviceRows = (endpoints: StripEndpoint[]): ServiceRow[] => {
  const names = [...new Set(endpoints.map((e) => e.service))];
  return names
    .map((name) => {
      const own = endpoints.filter((e) => e.service === name);
      return { endpoints: own, median: median(own.map((e) => e.p95)), name };
    })
    .toSorted((a, b) => b.median - a.median);
};

/** The slowest endpoint over the target: the one red. */
const worstOver = (endpoints: StripEndpoint[], target: number) =>
  endpoints.filter((e) => e.p95 > target).toSorted((a, b) => b.p95 - a.p95)[0]
    ?.route;

/**
 * The endpoint under the pointer: the row's band is the target, and within
 * it the dot nearest in x, so every row is a full-height hit area.
 */
const nearestIn = (
  rows: ServiceRow[],
  frame: Frame,
  px: number,
  py: number
) => {
  const row = rows.find((r) => {
    const top = frame.y(r.name) ?? 0;
    return py >= top && py < top + frame.y.bandwidth();
  });
  if (row === undefined) {
    return null;
  }
  const dist = (e: StripEndpoint) => Math.abs(frame.x(e.p95) - px);
  return row.endpoints.toSorted((a, b) => dist(a) - dist(b))[0].route;
};

/** Room at the right for each row's median, px. */
const MEDIAN_W = 60;
/** Room above the plot for the target's and the median column's names, px. */
const TOP = 22;
/** Half the height of a row's median tick, px. */
const TICK_H = 6;

interface Frame {
  width: number;
  height: number;
  m: { bottom: number; left: number; right: number; top: number };
  x: ScaleLinear<number, number>;
  y: ScaleBand<string>;
}

type Tone = "hero" | "rest";

/** Ink for the hero row, one grey for the rest. */
const TONE: Record<Tone, { dot: string; tick: string; value: string }> = {
  hero: { dot: "fill-hero", tick: "fill-hero", value: "fill-ink" },
  rest: { dot: "fill-l3", tick: "fill-l2", value: "fill-muted" },
};

/** One endpoint: a dot, with its route and value while hovered or red. */
const EndpointDot = (props: {
  endpoint: StripEndpoint;
  frame: Frame;
  cy: number;
  tone: Tone;
  red: boolean;
  active: boolean;
}) => {
  const { cy, endpoint: e, frame } = props;
  // Whole pixels, as the range rule's ends are, so the outer dots cap it exactly.
  const cx = Math.round(frame.x(e.p95));
  const named = props.active || props.red;
  // Near the right edge the label runs leftward from the dot.
  const anchor = cx > frame.width - frame.m.right - 60 ? "end" : "middle";
  return (
    <g>
      <circle
        className={`${POINT} ${props.red ? "fill-alert" : TONE[props.tone].dot}`}
        cx={cx}
        cy={cy}
        r={props.active ? 4.5 : 3}
      />
      {named && (
        <text
          className={`${props.active ? VALUE : TICK} t-halo`}
          x={anchor === "end" ? cx + 6 : cx}
          y={cy - 10}
          textAnchor={anchor}
        >
          {e.route}
          {props.active ? ` ${fmtMs(e.p95)}` : ""}
        </text>
      )}
    </g>
  );
};

/** A service: its name, a rule spanning its endpoints, the dots, its median. */
const StripRow = (props: {
  row: ServiceRow;
  i: number;
  frame: Frame;
  tone: Tone;
  red: string | undefined;
  active: string | null;
  dim: boolean;
}) => {
  const { frame, row } = props;
  const { m, width, x, y } = frame;
  // The range is a 1px rule on the half pixel; the dots and the median tick
  // centre on it.
  const cy = crisp((y(row.name) ?? 0) + y.bandwidth() / 2);
  const ps = row.endpoints.map((e) => e.p95);
  const tone = TONE[props.tone];
  return (
    <g
      className={`fade transition-opacity ${props.dim ? "opacity-25" : "opacity-100"}`}
      style={{ "--i": props.i }}
    >
      <text
        className={LABEL}
        x={m.left - 20}
        y={cy}
        dy="0.34em"
        textAnchor="end"
        fill="var(--muted)"
      >
        {row.name}
      </text>
      <line
        className="rule"
        x1={Math.round(x(Math.min(...ps)))}
        x2={Math.round(x(Math.max(...ps)))}
        y1={cy}
        y2={cy}
      />
      <rect
        className={tone.tick}
        x={Math.round(x(row.median)) - 1}
        y={Math.floor(cy) - TICK_H}
        width={2}
        height={TICK_H * 2 + 1}
      />
      {row.endpoints.map((e) => (
        <EndpointDot
          key={e.route}
          endpoint={e}
          frame={frame}
          cy={cy}
          tone={props.tone}
          red={e.route === props.red}
          active={e.route === props.active}
        />
      ))}
      <text
        className={`${VALUE} ${tone.value}`}
        x={width}
        y={cy}
        dy="0.34em"
        textAnchor="end"
      >
        {fmtMs(row.median)}
      </text>
    </g>
  );
};

const msTick = (t: number) => (t === 0 ? "0" : `${t} ms`);

/** The ms scale along the bottom, the target rule and the column names. */
const StripAxes = (props: {
  frame: Frame;
  ticks: number[];
  target: number;
}) => {
  const { height: h, m, width, x } = props.frame;
  const tx = crisp(x(props.target));
  return (
    <>
      <VGrid xs={props.ticks.map(x)} y0={m.top} y1={h - m.bottom} />
      {thinTicks(props.ticks, x, labelGap(props.ticks.map(msTick))).map((t) => (
        <text
          key={t}
          className={TICK}
          x={x(t)}
          y={h - m.bottom + 12}
          dy="0.71em"
          textAnchor="middle"
        >
          {msTick(t)}
        </text>
      ))}
      <line
        className={`${RULE_TARGET} fade`}
        x1={tx}
        x2={tx}
        y1={m.top - 4}
        y2={h - m.bottom}
      />
      <text className={TICK} x={tx} y={m.top - 10} textAnchor="middle">
        Target
      </text>
      <text className={TICK} x={width} y={m.top - 10} textAnchor="end">
        Median
      </text>
    </>
  );
};

/**
 * Every endpoint's P95, one row per service, slowest service first: each
 * service's endpoints as dots along a rule, its median ticked and printed.
 * The slowest service is inked; the worst endpoint over target is red.
 */
export const EndpointStrip = (props: EndpointStripProps) => {
  const [hover, setHover] = useState<string | null>(null);
  const rows = serviceRows(props.endpoints);
  const red = worstOver(props.endpoints, props.target);
  const hoverRow =
    props.endpoints.find((e) => e.route === hover)?.service ?? null;

  return (
    <Chart>
      {(width) => {
        const m = {
          bottom: 28,
          left: labelRoom(rows),
          right: MEDIAN_W,
          top: TOP,
        };
        const h = props.height;
        const frame: Frame = {
          height: h,
          m,
          width,
          x: scaleLinear()
            .domain([0, props.ticks.at(-1) ?? 0])
            .range([m.left, width - m.right - 12]),
          y: scaleBand()
            .domain(rows.map((r) => r.name))
            .range([m.top, h - m.bottom]),
        };

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            onPointerMove={(e: PointerEvent<SVGSVGElement>) => {
              const r = e.currentTarget.getBoundingClientRect();
              setHover(
                nearestIn(rows, frame, e.clientX - r.left, e.clientY - r.top)
              );
            }}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <StripAxes
              frame={frame}
              ticks={props.ticks}
              target={props.target}
            />
            {rows.map((row, i) => (
              <StripRow
                key={row.name}
                row={row}
                i={i}
                frame={frame}
                tone={i === 0 ? "hero" : "rest"}
                red={red}
                active={hover}
                dim={hoverRow !== null && hoverRow !== row.name}
              />
            ))}
          </svg>
        );
      }}
    </Chart>
  );
};
