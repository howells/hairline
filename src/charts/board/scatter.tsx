import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";
import type { PointerEvent } from "react";

import { crisp } from "../axes";
import { Chart } from "../core";
import { Dot, Ring } from "../markers";
import { CURSOR, OUTLINE, POINT, RULE_TARGET, TICK, VALUE } from "../roles";
import { HGrid, VGrid } from "../rules";
import { PlateLabel, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { Key } from "./key";
import { scaleWidth } from "./room";
import { TICK_CHAR } from "./thin-ticks";

/** Both groups share one grey; the second group's points are hollow rings. */
const POINT_TONE = { fill: "fill-l2", stroke: "stroke-l2" };

export interface ScatterPoint {
  x: number;
  y: number;
  /** Which of the two groups: filled dots, or hollow rings. */
  group: "filled" | "hollow";
  /** Named points carry a label until hovered. */
  name?: string;
  /** The point's name in the hover readout, when it has no standing label. */
  title?: string;
}
/** Pointer snaps to the nearest point within this many pixels. */
const SNAP = 24;

type Format = (v: number) => string;

interface ScatterProps {
  points: ScatterPoint[];
  /** The key's names for the filled and the hollow group. */
  groups: { filled: string; hollow: string };
  /**
   * A limit on y, if there is a real one: the zone over it is stippled and
   * its highest point is red. Without one the plot has neither.
   */
  limit?: number;
  height: number;
  label: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
  xTickFormat: Format;
  yTickFormat: Format;
  /** Under the x axis, right-aligned. */
  xTitle: string;
  /** Over the plot, right-aligned. */
  yTitle: string;
  /** Beside the limit's rule; "" or unset hides it. */
  limitLabel?: string;
  /** x in the hover readout. */
  xFormat: Format;
  /** y in the hover readout. */
  yFormat: Format;
}

/** Axis settings with every default filled in. */
interface AxisConfig {
  limitLabel: string;
  xTicks: number[];
  yTicks: number[];
  xTickFormat: Format;
  yTickFormat: Format;
  xTitle: string;
  yTitle: string;
  xFormat: Format;
  yFormat: Format;
}

interface Frame {
  axis: AxisConfig;
  width: number;
  height: number;
  m: { bottom: number; left: number; right: number; top: number };
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

/** Gap between the value labels and the plot, px. */
const TICK_GAP = 14;

const axisConfig = (props: ScatterProps): AxisConfig => ({
  limitLabel: props.limitLabel ?? "",
  xFormat: props.xFormat,
  xTickFormat: props.xTickFormat,
  xTicks: props.xTicks,
  xTitle: props.xTitle,
  yFormat: props.yFormat,
  yTickFormat: props.yTickFormat,
  yTicks: props.yTicks,
  yTitle: props.yTitle,
});

const hasName = (p: ScatterPoint) => p.name !== undefined && p.name !== "";
const pointKey = (p: ScatterPoint) => `${p.group}-${p.x}-${p.y}`;

/** Index of the point nearest (px, py), or null if none is within SNAP. */
const nearest = (
  points: ScatterPoint[],
  frame: Frame,
  px: number,
  py: number
) => {
  let best: number | null = null;
  let bestD = SNAP * SNAP;
  for (const [i, p] of points.entries()) {
    const d = (frame.x(p.x) - px) ** 2 + (frame.y(p.y) - py) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
};

const Axes = (props: { frame: Frame }) => {
  const { axis, height: h, m, width, x, y } = props.frame;
  const lastX = axis.xTicks.at(-1);
  return (
    <>
      <text
        className={TICK}
        x={width - m.right}
        y={m.top - 12}
        textAnchor="end"
      >
        {axis.yTitle}
      </text>
      {axis.yTicks.map((t) => (
        <text
          key={t}
          className={TICK}
          x={m.left - TICK_GAP}
          y={y(t)}
          dy="0.34em"
          textAnchor="end"
        >
          {axis.yTickFormat(t)}
        </text>
      ))}
      {axis.xTicks.map((t) => (
        <text
          key={t}
          className={TICK}
          x={x(t)}
          y={h - m.bottom + 14}
          dy="0.71em"
          textAnchor={t === lastX ? "end" : "middle"}
        >
          {axis.xTickFormat(t)}
        </text>
      ))}
      <text
        className={TICK}
        x={width - m.right}
        y={h - m.bottom + 30}
        dy="0.71em"
        textAnchor="end"
      >
        {axis.xTitle}
      </text>
    </>
  );
};

/** The zone over the limit, stippled on paper inside a rule, and the limit's line. */
const LimitRule = (props: { frame: Frame; zone: string; limit: number }) => {
  const { axis, m, width, y } = props.frame;
  const top = Math.round(m.top);
  const limitY = Math.round(y(props.limit));
  const left = Math.round(m.left);
  const zoneW = Math.round(width - m.right) - left;
  const zoneH = Math.max(0, limitY - top);
  return (
    <>
      <rect
        className="fade"
        x={left}
        y={top}
        width={zoneW}
        height={zoneH}
        fill={paint(props.zone)}
      />
      <rect
        className={`${OUTLINE} fade`}
        x={left + 0.5}
        y={top + 0.5}
        width={zoneW - 1}
        height={zoneH - 1}
      />
      <line
        className={`${RULE_TARGET} fade`}
        x1={m.left}
        x2={width - m.right}
        y1={crisp(y(props.limit))}
        y2={crisp(y(props.limit))}
      />
      {axis.limitLabel !== "" && (
        <text
          className={`${TICK} t-halo`}
          x={width - m.right - 8}
          y={y(props.limit) + 16}
          textAnchor="end"
        >
          {axis.limitLabel}
        </text>
      )}
    </>
  );
};

/** The point over the limit by most: red. Hovered: ink. Otherwise the one grey. */
const pointTone = (worst: boolean, active: boolean) => {
  if (active) {
    return { fill: "fill-hero", stroke: "stroke-hero" };
  }
  return worst ? { fill: "fill-alert", stroke: "stroke-alert" } : POINT_TONE;
};

/** Centred over its point, unless that would run past the plot's edge. */
const labelAnchor = (text: string, px: number, frame: Frame) => {
  const half = (text.length * TICK_CHAR) / 2;
  if (px - half < frame.m.left) {
    return "start";
  }
  return px + half > frame.width - frame.m.right ? "end" : "middle";
};

/** Baseline to the middle of an 11px line. */
const MID = 4;

/**
 * A label set on its baseline: on a plate where it falls inside the
 * stippled zone over the limit, on its halo everywhere else.
 */
const ZoneText = (props: {
  anchor: "end" | "middle" | "start";
  baseline: number;
  className: string;
  frame: Frame;
  limit: number | undefined;
  text: string;
  x: number;
}) => {
  const { frame } = props;
  const mid = props.baseline - MID;
  const inZone =
    props.limit !== undefined &&
    mid - 7.5 < Math.round(frame.y(props.limit)) &&
    mid + 7.5 > Math.round(frame.m.top);
  return inZone ? (
    <PlateLabel
      anchor={props.anchor}
      className={props.className}
      text={props.text}
      x={props.x}
      y={mid}
    />
  ) : (
    <text
      className={`${props.className} t-halo`}
      x={props.x}
      y={props.baseline}
      textAnchor={props.anchor}
    >
      {props.text}
    </text>
  );
};

/** A dot or ring; named points carry a leader and label until hovered. */
const PointMark = (props: {
  point: ScatterPoint;
  i: number;
  frame: Frame;
  /** The single highest point over the limit. */
  worst: boolean;
  active: boolean;
  limit: number | undefined;
}) => {
  const { active, point: p } = props;
  const { x, y } = props.frame;
  const tone = pointTone(props.worst, active);
  const hollow = p.group === "hollow";
  // Whole pixels on the half, as the gridlines are: a point on a gridline sits on it.
  const px = crisp(x(p.x));
  const py = crisp(y(p.y));
  return (
    <g className="fade" style={{ "--i": props.i * 0.4 }}>
      {hollow ? (
        <Ring
          className={`${POINT} ${tone.stroke}`}
          cx={px}
          cy={py}
          size={active ? "md" : "sm"}
          weight={active ? "cursor" : "rest"}
        />
      ) : (
        <Dot
          className={`${POINT} ${tone.fill}`}
          cx={px}
          cy={py}
          size={active ? "md" : "sm"}
        />
      )}
      {hasName(p) && !active && (
        <g>
          <line
            className="shape-crisp"
            x1={crisp(px)}
            x2={crisp(px)}
            y1={Math.round(py - 9)}
            y2={Math.round(py - 17)}
            stroke="var(--l4)"
          />
          <ZoneText
            anchor={labelAnchor(p.name ?? "", px, props.frame)}
            baseline={py - 22}
            className={TICK}
            frame={props.frame}
            limit={props.limit}
            text={p.name ?? ""}
            x={px}
          />
        </g>
      )}
    </g>
  );
};

/** Drop line and value label for the hovered point. */
const HoverReadout = (props: {
  point: ScatterPoint;
  frame: Frame;
  limit: number | undefined;
}) => {
  const { point: hp } = props;
  const { axis, height: h, m, x, y } = props.frame;
  const name = hp.name ?? hp.title ?? "";
  const readout = `${name === "" ? "" : `${name} `}${axis.yFormat(hp.y)} · ${axis.xFormat(hp.x)}`;
  return (
    <g pointerEvents="none">
      <line
        className={CURSOR}
        x1={crisp(x(hp.x))}
        x2={crisp(x(hp.x))}
        y1={Math.round(y(hp.y) + 8)}
        y2={h - m.bottom}
      />
      <ZoneText
        anchor={labelAnchor(readout, x(hp.x), props.frame)}
        baseline={y(hp.y) - 14}
        className={VALUE}
        frame={props.frame}
        limit={props.limit}
        text={readout}
        x={x(hp.x)}
      />
    </g>
  );
};

/** Index of the highest point over the limit: the one marked red. */
const worstIndex = (points: ScatterPoint[], limit: number | undefined) => {
  let worst = -1;
  if (limit === undefined) {
    return worst;
  }
  for (const [i, p] of points.entries()) {
    if (p.y > limit && (worst < 0 || p.y > points[worst].y)) {
      worst = i;
    }
  }
  return worst;
};

/** One measure against another; the highest point over the limit, if any, is the one red. */
export const Scatter = (props: ScatterProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const tex = useTextureIds("sc");
  const axis = axisConfig(props);
  const worst = worstIndex(props.points, props.limit);

  return (
    <Chart
      bottom={
        <Key
          className="mt-3"
          items={[
            { label: props.groups.filled, tone: "fill-l2" },
            { label: props.groups.hollow, tone: "fill-paper" },
          ]}
        />
      }
    >
      {(width) => {
        const m = {
          bottom: 44,
          left:
            scaleWidth({ format: axis.yTickFormat, ticks: axis.yTicks }) +
            TICK_GAP,
          right: 5,
          top: 20,
        };
        const h = props.height;
        const frame: Frame = {
          axis,
          height: h,
          m,
          width,
          x: scaleLinear()
            .domain(props.xDomain)
            .range([m.left, width - m.right]),
          y: scaleLinear()
            .domain(props.yDomain)
            .range([h - m.bottom, m.top]),
        };
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          setHover(
            nearest(props.points, frame, e.clientX - r.left, e.clientY - r.top)
          );
        };
        const hp = hover === null ? null : props.points[hover];

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            onPointerMove={onMove}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <defs>
              <Stipple id={tex("zone")} tone="fill-l4" />
            </defs>
            <VGrid xs={axis.xTicks.map(frame.x)} y0={m.top} y1={h - m.bottom} />
            <HGrid
              ys={axis.yTicks.map(frame.y)}
              x0={m.left}
              x1={width - m.right}
            />
            <Axes frame={frame} />
            {props.limit !== undefined && (
              <LimitRule frame={frame} zone={tex("zone")} limit={props.limit} />
            )}
            {props.points.map((p, i) => (
              <PointMark
                key={pointKey(p)}
                point={p}
                i={i}
                frame={frame}
                worst={i === worst}
                active={hover === i}
                limit={props.limit}
              />
            ))}
            {hp !== null && (
              <HoverReadout point={hp} frame={frame} limit={props.limit} />
            )}
          </svg>
        );
      }}
    </Chart>
  );
};
