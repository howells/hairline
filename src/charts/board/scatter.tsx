import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";
import type { PointerEvent } from "react";

import { fmtInt } from "../../lib/format";
import { crisp } from "../axes";
import { Chart, HGrid, VGrid } from "../core";
import { PlateLabel, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { Key } from "./key";
import { scaleWidth } from "./room";
import { CURSOR, OUTLINE, POINT, RULE_TARGET, TICK, VALUE } from "./styles";
import { TICK_CHAR } from "./thin-ticks";

/** Both groups share one grey; the second group's points are hollow rings. */
const POINT_TONE = "var(--l2)";

export interface ScatterPoint {
  x: number;
  y: number;
  /** Which of the two groups: filled dots, or hollow rings. */
  group: "filled" | "hollow";
  /** Named points carry a label until hovered. */
  name?: string;
}
/** Pointer snaps to the nearest point within this many pixels. */
const SNAP = 24;

type Format = (v: number) => string;

interface ScatterProps {
  points: ScatterPoint[];
  /** The key's names for the filled and the hollow group. */
  groups: { filled: string; hollow: string };
  /** Threshold on y: the zone over it is stippled, its slowest point red. */
  sla: number;
  height: number;
  label: string;
  /** Defaults to [0, 1000]. */
  xDomain?: [number, number];
  /** Defaults to [0, 500]. */
  yDomain?: [number, number];
  /** Defaults to every 200 from 0 to 1,000. */
  xTicks?: number[];
  /** Defaults to every 100 from 0 to 500. */
  yTicks?: number[];
  /** Defaults to "1,000". */
  xTickFormat?: Format;
  /** Defaults to "300 ms". */
  yTickFormat?: Format;
  /** Under the x axis, right-aligned. Defaults to "Requests/s". */
  xTitle?: string;
  /** Over the plot, right-aligned. Defaults to "P95". */
  yTitle?: string;
  /** Beside the threshold rule. Defaults to "SLA"; "" hides it. */
  thresholdLabel?: string;
  /** x in the hover readout. Defaults to "320/s". */
  xFormat?: Format;
  /** y in the hover readout. Defaults to "300 ms". */
  yFormat?: Format;
}

/** Axis settings with every default filled in. */
interface AxisConfig {
  xTicks: number[];
  yTicks: number[];
  xTickFormat: Format;
  yTickFormat: Format;
  xTitle: string;
  yTitle: string;
  thresholdLabel: string;
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

const fmtMsTick = (v: number) => `${v} ms`;

const axisConfig = (props: ScatterProps): AxisConfig => ({
  thresholdLabel: props.thresholdLabel ?? "SLA",
  xFormat: props.xFormat ?? ((v) => `${v}/s`),
  xTickFormat: props.xTickFormat ?? fmtInt,
  xTicks: props.xTicks ?? [0, 200, 400, 600, 800, 1000],
  xTitle: props.xTitle ?? "Requests/s",
  yFormat: props.yFormat ?? fmtMsTick,
  yTickFormat: props.yTickFormat ?? fmtMsTick,
  yTicks: props.yTicks ?? [0, 100, 200, 300, 400, 500],
  yTitle: props.yTitle ?? "P95",
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

/** The zone over the SLA, stippled on paper inside a rule, and the SLA line. */
const SlaRule = (props: { frame: Frame; zone: string; sla: number }) => {
  const { axis, m, width, y } = props.frame;
  const top = Math.round(m.top);
  const slaY = Math.round(y(props.sla));
  const left = Math.round(m.left);
  const zoneW = Math.round(width - m.right) - left;
  const zoneH = Math.max(0, slaY - top);
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
        y1={crisp(y(props.sla))}
        y2={crisp(y(props.sla))}
      />
      {axis.thresholdLabel !== "" && (
        <text
          className={`${TICK} t-halo`}
          x={width - m.right - 8}
          y={y(props.sla) + 16}
          textAnchor="end"
        >
          {axis.thresholdLabel}
        </text>
      )}
    </>
  );
};

/** The worst point: red. Hovered: ink. Otherwise the one grey. */
const pointTone = (worst: boolean, active: boolean) => {
  if (active) {
    return "var(--hero)";
  }
  return worst ? "var(--alert)" : POINT_TONE;
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
 * stippled zone over the SLA, on its halo everywhere else.
 */
const ZoneText = (props: {
  anchor: "end" | "middle" | "start";
  baseline: number;
  className: string;
  frame: Frame;
  sla: number;
  text: string;
  x: number;
}) => {
  const { frame } = props;
  const mid = props.baseline - MID;
  const inZone =
    mid - 7.5 < Math.round(frame.y(props.sla)) &&
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
  /** The single worst point over the SLA. */
  worst: boolean;
  active: boolean;
  sla: number;
}) => {
  const { active, point: p } = props;
  const { x, y } = props.frame;
  const tone = pointTone(props.worst, active);
  const hollow = p.group === "hollow";
  const px = x(p.x);
  return (
    <g className="fade" style={{ "--i": props.i * 0.4 }}>
      <circle
        cx={px}
        cy={y(p.y)}
        r={active ? 4.5 : 3}
        fill={hollow ? "var(--bg)" : tone}
        stroke={hollow ? tone : "none"}
        strokeWidth={1.5}
        className={POINT}
      />
      {hasName(p) && !active && (
        <g>
          <line
            className="shape-crisp"
            x1={crisp(px)}
            x2={crisp(px)}
            y1={Math.round(y(p.y) - 9)}
            y2={Math.round(y(p.y) - 17)}
            stroke="var(--l4)"
          />
          <ZoneText
            anchor={labelAnchor(p.name ?? "", px, props.frame)}
            baseline={y(p.y) - 22}
            className={TICK}
            frame={props.frame}
            sla={props.sla}
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
  sla: number;
}) => {
  const { point: hp } = props;
  const { axis, height: h, m, x, y } = props.frame;
  const readout = `${hasName(hp) ? `${hp.name ?? ""} ` : ""}${axis.yFormat(hp.y)} · ${axis.xFormat(hp.x)}`;
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
        sla={props.sla}
        text={readout}
        x={x(hp.x)}
      />
    </g>
  );
};

/** Index of the slowest point over the SLA: the one marked red. */
const worstIndex = (points: ScatterPoint[], sla: number) => {
  let worst = -1;
  for (const [i, p] of points.entries()) {
    if (p.y > sla && (worst < 0 || p.y > points[worst].y)) {
      worst = i;
    }
  }
  return worst;
};

/** Throughput vs latency; the slowest point over the SLA is the one red. */
export const Scatter = (props: ScatterProps) => {
  const [hover, setHover] = useState<number | null>(null);
  const tex = useTextureIds("sc");
  const axis = axisConfig(props);
  const worst = worstIndex(props.points, props.sla);

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
            .domain(props.xDomain ?? [0, 1000])
            .range([m.left, width - m.right]),
          y: scaleLinear()
            .domain(props.yDomain ?? [0, 500])
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
              <Stipple ground="fill-paper" id={tex("zone")} tone="fill-l4" />
            </defs>
            <VGrid xs={axis.xTicks.map(frame.x)} y0={m.top} y1={h - m.bottom} />
            <HGrid
              ys={axis.yTicks.map(frame.y)}
              x0={m.left}
              x1={width - m.right}
            />
            <Axes frame={frame} />
            <SlaRule frame={frame} zone={tex("zone")} sla={props.sla} />
            {props.points.map((p, i) => (
              <PointMark
                key={pointKey(p)}
                point={p}
                i={i}
                frame={frame}
                worst={i === worst}
                active={hover === i}
                sla={props.sla}
              />
            ))}
            {hp !== null && (
              <HoverReadout point={hp} frame={frame} sla={props.sla} />
            )}
          </svg>
        );
      }}
    </Chart>
  );
};
