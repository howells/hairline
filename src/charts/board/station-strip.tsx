import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useState } from "react";
import type { PointerEvent } from "react";

import { crisp } from "../axes";
import { Chart, VGrid } from "../core";
import { Dot } from "../markers";
import { MARK_WEIGHT, TICK as TICK_LEN } from "../marks";
import { nameWidth } from "./room";
import { LABEL, POINT, TICK, VALUE } from "./styles";
import { labelGap, thinTicks } from "./thin-ticks";

export interface StripStation {
  /** The row it sits in. */
  group: string;
  /** Its name; unique within the chart. */
  name: string;
  /** Where it falls on the scale. */
  value: number;
}

interface GroupRow {
  name: string;
  stations: StripStation[];
  median: number;
}

interface StationStripProps {
  stations: StripStation[];
  ticks: number[];
  /** Scale labels and the readouts. */
  format: (v: number) => string;
  /** Scale labels. Defaults to `format`. */
  tickFormat?: (v: number) => string;
  /** The heading over the median column. */
  medianTitle: string;
  height: number;
  label: string;
}

const median = (values: number[]) => {
  const v = values.toSorted((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 === 1 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
};

/** One row per group, highest median first. */
const groupRows = (stations: StripStation[]): GroupRow[] => {
  const names = [...new Set(stations.map((e) => e.group))];
  return names
    .map((name) => {
      const own = stations.filter((e) => e.group === name);
      return { median: median(own.map((e) => e.value)), name, stations: own };
    })
    .toSorted((a, b) => b.median - a.median);
};

/**
 * The station under the pointer: the row's band is the target, and within
 * it the dot nearest in x, so every row is a full-height hit area.
 */
const nearestIn = (rows: GroupRow[], frame: Frame, px: number, py: number) => {
  const row = rows.find((r) => {
    const top = frame.y(r.name) ?? 0;
    return py >= top && py < top + frame.y.bandwidth();
  });
  if (row === undefined) {
    return null;
  }
  const dist = (e: StripStation) => Math.abs(frame.x(e.value) - px);
  return row.stations.toSorted((a, b) => dist(a) - dist(b))[0].name;
};

/** Gap between a row's name and the plot, px. */
const NAME_GAP = 20;
/** Room at the right for each row's median, px. */
const MEDIAN_W = 60;
/** Room above the plot for the median column's name, px. */
const TOP = 22;
/** Half the height of a row's median tick, px. */
const TICK_H = TICK_LEN.md;

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

/** One station: a dot, with its name and value while hovered. */
const StationDot = (props: {
  station: StripStation;
  format: (v: number) => string;
  frame: Frame;
  cy: number;
  tone: Tone;
  active: boolean;
}) => {
  const { cy, station: e, frame } = props;
  // Whole pixels, as the range rule's ends are, so the outer dots cap it exactly.
  const cx = Math.round(frame.x(e.value));
  const named = props.active;
  // Near the right edge the label runs leftward from the dot.
  const anchor = cx > frame.width - frame.m.right - 60 ? "end" : "middle";
  return (
    <g>
      <Dot
        className={`${POINT} ${TONE[props.tone].dot}`}
        cx={cx}
        cy={cy}
        size={props.active ? "md" : "sm"}
      />
      {named && (
        <text
          className={`${props.active ? VALUE : TICK} t-halo`}
          x={anchor === "end" ? cx + 6 : cx}
          y={cy - 10}
          textAnchor={anchor}
        >
          {e.name} {props.format(e.value)}
        </text>
      )}
    </g>
  );
};

/** A group: its name, a rule spanning its stations, the dots, its median. */
const StripRow = (props: {
  row: GroupRow;
  i: number;
  format: (v: number) => string;
  frame: Frame;
  tone: Tone;
  active: string | null;
  dim: boolean;
}) => {
  const { frame, row } = props;
  const { m, width, x, y } = frame;
  // The range is a 1px rule on the half pixel; the dots and the median tick
  // centre on it.
  const cy = crisp((y(row.name) ?? 0) + y.bandwidth() / 2);
  const ps = row.stations.map((e) => e.value);
  const tone = TONE[props.tone];
  return (
    <g
      className={`fade transition-opacity ${props.dim ? "opacity-25" : "opacity-100"}`}
      style={{ "--i": props.i }}
    >
      <text
        className={LABEL}
        x={m.left - NAME_GAP}
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
        x={Math.round(x(row.median)) - MARK_WEIGHT / 2}
        y={Math.floor(cy) - TICK_H}
        width={MARK_WEIGHT}
        height={TICK_H * 2 + 1}
      />
      {row.stations.map((e) => (
        <StationDot
          key={e.name}
          station={e}
          format={props.format}
          frame={frame}
          cy={cy}
          tone={props.tone}
          active={e.name === props.active}
        />
      ))}
      <text
        className={`${VALUE} ${tone.value}`}
        x={width}
        y={cy}
        dy="0.34em"
        textAnchor="end"
      >
        {props.format(row.median)}
      </text>
    </g>
  );
};

/** The scale along the bottom and the median column's name. */
const StripAxes = (props: {
  frame: Frame;
  ticks: number[];
  tickFormat: (v: number) => string;
  medianTitle: string;
}) => {
  const { height: h, m, width, x } = props.frame;
  return (
    <>
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
          y={h - m.bottom + 12}
          dy="0.71em"
          textAnchor="middle"
        >
          {props.tickFormat(t)}
        </text>
      ))}
      <text className={TICK} x={width} y={m.top - 10} textAnchor="end">
        {props.medianTitle}
      </text>
    </>
  );
};

/**
 * Every station on one scale, one row per group, highest median first: each
 * group's stations as dots along a rule, its median ticked and printed.
 * The row with the highest median is inked.
 */
export const StationStrip = (props: StationStripProps) => {
  const [hover, setHover] = useState<string | null>(null);
  const rows = groupRows(props.stations);
  const hoverRow = props.stations.find((e) => e.name === hover)?.group ?? null;
  const tickFormat = props.tickFormat ?? props.format;

  return (
    <Chart>
      {(width) => {
        const m = {
          bottom: 28,
          left:
            NAME_GAP +
            nameWidth(
              rows.map((r) => r.name),
              0.97
            ),
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
              tickFormat={tickFormat}
              medianTitle={props.medianTitle}
            />
            {rows.map((row, i) => (
              <StripRow
                key={row.name}
                row={row}
                i={i}
                format={props.format}
                frame={frame}
                tone={i === 0 ? "hero" : "rest"}
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
