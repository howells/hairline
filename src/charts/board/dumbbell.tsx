import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useState } from "react";

import { Chart, VGrid } from "../core";
import { sansWidth } from "../util";
import { Key } from "./key";
import { nameWidth } from "./room";
import { LABEL, TICK, VALUE } from "./styles";
import { labelGap, thinTicks } from "./thin-ticks";

/** Gap between a row's name and the plot's labels, px. */
const NAME_GAP = 20;
/** Gap between a row's far dot and its change, px. */
const VALUE_GAP = 14;

/** How the scale's labels and each row's change are set. */
interface Formats {
  tick: (v: number) => string;
  delta: (v: number) => string;
}

/**
 * How far the scale can run from `from`: far enough that the last tick's label
 * and every row's change, set past its far dot, end at the svg's edge.
 */
const scaleReach = (
  rows: Row[],
  ticks: number[],
  width: number,
  from: number,
  fmt: Formats
) => {
  const [first = 0] = ticks;
  const span = (ticks.at(-1) ?? first) - first;
  const lastLabel = sansWidth(fmt.tick(ticks.at(-1) ?? first));
  return Math.min(
    width - Math.ceil(lastLabel / 2) - from,
    ...rows.map(
      (r) =>
        ((width - VALUE_GAP - sansWidth(fmt.delta(r.after - r.before)) - from) *
          span) /
        Math.max(1, Math.max(r.before, r.after) - first)
    )
  );
};

interface Row {
  name: string;
  before: number;
  after: number;
}

/** One row: label, then a solid 2px rung from before (grey) to after (ink). */
const DumbbellRow = (props: {
  row: Row;
  /** The biggest rise, the one red. */
  worst: boolean;
  i: number;
  x: ScaleLinear<number, number>;
  y: ScaleBand<string>;
  width: number;
  labelX: number;
  dim: boolean;
  delta: (v: number) => string;
  onHover: (name: string) => void;
}) => {
  const { i, row: r, x, y } = props;
  const bh = y.bandwidth();
  const cy = Math.round((y(r.name) ?? 0) + bh / 2);
  const ink = props.worst ? "var(--alert)" : "var(--hero)";
  return (
    <g
      onPointerEnter={() => {
        props.onHover(r.name);
      }}
      className={`transition-opacity ${props.dim ? "opacity-25" : "opacity-100"}`}
    >
      <rect
        x={0}
        y={y(r.name)}
        width={props.width}
        height={bh}
        fill="transparent"
      />
      <text
        className={LABEL}
        x={props.labelX}
        y={cy}
        dy="0.34em"
        textAnchor="end"
        fill="var(--muted)"
      >
        {r.name}
      </text>
      <g className="fade" style={{ "--i": i }}>
        <line
          x1={Math.round(x(r.before))}
          x2={Math.round(x(r.after))}
          y1={cy}
          y2={cy}
          stroke="var(--l5)"
          strokeWidth={2}
        />
        <circle cx={Math.round(x(r.before))} cy={cy} r={3} fill="var(--l4)" />
        <circle cx={Math.round(x(r.after))} cy={cy} r={4.5} fill={ink} />
        <text
          x={x(Math.max(r.before, r.after)) + VALUE_GAP}
          y={cy}
          dy="0.34em"
          className={VALUE}
        >
          {props.delta(r.after - r.before)}
        </text>
      </g>
    </g>
  );
};

/** The row whose value rose the most, if any rose. */
const worstRow = (rows: Row[]) => {
  const rise = Math.max(...rows.map((r) => r.after - r.before));
  return rows.find((r) => rise > 0 && r.after - r.before === rise)?.name;
};

/** Before (grey) → after (ink) per row; the biggest rise turns red. */
export const Dumbbell = (props: {
  rows: Row[];
  height: number;
  ticks: number[];
  /** Scale labels. */
  tickFormat: (v: number) => string;
  /** The change printed past each row's far dot. */
  deltaFormat: (v: number) => string;
  /** Names of the two ends, for the key: earlier, then later. */
  ends: [string, string];
  label: string;
}) => {
  const [hover, setHover] = useState<string | null>(null);
  const worst = worstRow(props.rows);

  return (
    <Chart
      bottom={
        <Key
          className="mt-3"
          items={[
            { label: props.ends[0], tone: "fill-l4" },
            { label: props.ends[1], tone: "fill-hero" },
          ]}
        />
      }
    >
      {(width) => {
        const m = {
          bottom: 28,
          left: NAME_GAP + nameWidth(props.rows.map((r) => r.name)),
          top: 8,
        };
        const h = props.height;
        const from = m.left + 16;
        const x = scaleLinear()
          .domain([props.ticks[0], props.ticks.at(-1) ?? props.ticks[0]])
          .range([
            from,
            from +
              scaleReach(props.rows, props.ticks, width, from, {
                delta: props.deltaFormat,
                tick: props.tickFormat,
              }),
          ]);
        const y = scaleBand()
          .domain(props.rows.map((r) => r.name))
          .range([m.top, h - m.bottom]);

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <VGrid xs={props.ticks.map(x)} y0={m.top} y1={h - m.bottom} />
            {thinTicks(
              props.ticks,
              x,
              labelGap(props.ticks.map(props.tickFormat))
            ).map((t) => (
              <text
                key={t}
                className={TICK}
                x={x(t)}
                y={h - m.bottom + 14}
                dy="0.71em"
                textAnchor="middle"
              >
                {props.tickFormat(t)}
              </text>
            ))}
            {props.rows.map((r, i) => (
              <DumbbellRow
                key={r.name}
                row={r}
                worst={r.name === worst}
                i={i}
                x={x}
                y={y}
                width={width}
                labelX={m.left - NAME_GAP}
                dim={hover !== null && hover !== r.name}
                delta={props.deltaFormat}
                onHover={setHover}
              />
            ))}
          </svg>
        );
      }}
    </Chart>
  );
};
