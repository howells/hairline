import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Chart } from "../core";
import { Dot, Ring } from "../markers";
import { nameWidth } from "./room";
import { relax } from "./spread";
import { GRID_V, LABEL, TICK, VALUE } from "./styles";

interface Row {
  name: string;
  from: number;
  to: number;
}

/** The two year columns: a rule and a heading each. */
const Columns = (props: {
  xs: [number, number];
  labels: [string, string];
  top: number;
  height: number;
}) =>
  props.xs.map((x, i) => (
    <g key={x}>
      <line
        className={GRID_V}
        x1={crisp(x)}
        x2={crisp(x)}
        y1={props.top}
        y2={props.height}
      />
      <text className={TICK} x={x} y={props.top - 14} textAnchor="middle">
        {props.labels[i]}
      </text>
    </g>
  ));

/** The labels carry semibold values, so less is shaved off their width. */
const LABEL_SHAVE = 0.95;

/** Below this width the narrow format is used, px. */
const NARROW = 520;

/** Gap between a column and its row labels, px. */
const LABEL_GAP = 14;

type Role = "lead" | "worst" | "rest";

/**
 * The biggest fall in the hero tone, the single biggest rise in red, every other
 * row grey. Values stay in text tones: ink for the two marked rows.
 */
const ROW_TONE: Record<
  Role,
  { dotClass: string; ringClass: string; stroke: string; value: string }
> = {
  lead: {
    dotClass: "fill-hero",
    ringClass: "stroke-hero",
    stroke: "var(--hero)",
    value: "fill-ink",
  },
  rest: {
    dotClass: "fill-l3",
    ringClass: "stroke-l3",
    stroke: "var(--l3)",
    value: "fill-muted",
  },
  worst: {
    dotClass: "fill-alert",
    ringClass: "stroke-alert",
    stroke: "var(--alert)",
    value: "fill-ink",
  },
};

/** One row's before/after segment with a label at each end. */
const SlopeRow = (props: {
  row: Row;
  i: number;
  xs: [number, number];
  labelYs: [number, number];
  y: ScaleLinear<number, number>;
  dim: boolean;
  /** The biggest fall, the biggest rise, or neither. */
  role: Role;
  format: (v: number) => string;
  onHover: (name: string) => void;
}) => {
  const { i, row, y } = props;
  const [xa, xb] = props.xs;
  const tone = ROW_TONE[props.role];
  const valueClass = `${VALUE} ${tone.value}`;
  const { name } = row;
  return (
    <g
      className={`fade transition-opacity ${props.dim ? "opacity-25" : "opacity-100"}`}
      style={{ "--i": i }}
      onPointerEnter={() => {
        props.onHover(row.name);
      }}
    >
      <line
        x1={xa}
        x2={xb}
        y1={y(row.from)}
        y2={y(row.to)}
        stroke="transparent"
        strokeWidth={14}
      />
      <line
        className="cap-round"
        x1={xa}
        x2={xb}
        y1={y(row.from)}
        y2={y(row.to)}
        stroke={tone.stroke}
        strokeWidth={1.5}
      />
      <Ring className={tone.ringClass} cx={xa} cy={y(row.from)} size="sm" />
      <Dot
        className={tone.dotClass}
        cx={xb}
        cy={y(row.to)}
        size={props.role === "rest" ? "sm" : "md"}
      />
      <text
        x={xa - LABEL_GAP}
        y={props.labelYs[0]}
        dy="0.34em"
        textAnchor="end"
        className={LABEL}
      >
        <tspan fill="var(--muted)">{name} </tspan>
        <tspan className={valueClass}>{props.format(row.from)}</tspan>
      </text>
      <text
        x={xb + LABEL_GAP}
        y={props.labelYs[1]}
        dy="0.34em"
        className={LABEL}
      >
        <tspan className={valueClass}>{props.format(row.to)}</tspan>
        <tspan fill="var(--muted)"> {name}</tspan>
      </text>
    </g>
  );
};

/** The row's role: the biggest fall, the biggest rise, or neither. */
const roleOf = (row: Row, rows: Row[]): Role => {
  const change = (r: Row) => r.to - r.from;
  const best = Math.min(...rows.map(change));
  const worst = Math.max(...rows.map(change));
  if (best < 0 && change(row) === best) {
    return "lead";
  }
  return worst > 0 && change(row) === worst ? "worst" : "rest";
};

/** Before/after slope chart; the biggest fall inked, the biggest rise red. */
export const Slope = (props: {
  rows: Row[];
  /** Values at the two ends of each row. */
  format: (v: number) => string;
  /** The same on a phone, where a unit would crowd the columns together. */
  narrowFormat?: (v: number) => string;
  height: number;
  labels: [string, string];
  domain: [number, number];
  label: string;
}) => {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <Chart>
      {(width) => {
        const format =
          width < NARROW && props.narrowFormat !== undefined
            ? props.narrowFormat
            : props.format;
        const top = 40;
        const bottom = 24;
        const h = props.height;
        // Each side's labels run out to the edge: the columns sit just inside.
        const xs: [number, number] = [
          LABEL_GAP +
            nameWidth(
              props.rows.map((r) => `${r.name} ${format(r.from)}`),
              LABEL_SHAVE
            ),
          width -
            LABEL_GAP -
            3 -
            nameWidth(
              props.rows.map((r) => `${format(r.to)} ${r.name}`),
              LABEL_SHAVE
            ),
        ];
        const y = scaleLinear()
          .domain(props.domain)
          .range([h - bottom, top + 16]);
        const lys = relax(
          props.rows.map((r) => y(r.from)),
          15,
          top + 8,
          h - 8
        );
        const rys = relax(
          props.rows.map((r) => y(r.to)),
          15,
          top + 8,
          h - 8
        );

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
            <Columns xs={xs} labels={props.labels} top={top} height={h} />
            {props.rows.map((r, i) => (
              <SlopeRow
                key={r.name}
                row={r}
                i={i}
                xs={xs}
                labelYs={[lys[i], rys[i]]}
                y={y}
                dim={hover !== null && hover !== r.name}
                role={roleOf(r, props.rows)}
                format={format}
                onHover={setHover}
              />
            ))}
          </svg>
        );
      }}
    </Chart>
  );
};
