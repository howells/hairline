import { format as d3format } from "d3-format";
import { scaleSqrt } from "d3-scale";
import type { ScalePower } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, ranks, sansWidth, stagger } from "../util";
import { singleAxisDemo } from "./single-axis.data";
import type { SingleAxisRow } from "./single-axis.data";

interface SingleAxisProps {
  data?: SingleAxisRow[];
  height?: number;
  /** Labels for the columns; defaults to hours 00:00–23:00. */
  columns?: string[];
  /** Column indices that get an axis label. */
  ticks?: number[];
  format?: (v: number) => string;
  /** Unit shown in the tooltip, e.g. "m". */
  unit?: string;
  note?: string;
  /** Clock the hours are read on, shown after the axis and in the tooltip. */
  zone?: string;
  /** Index of the row to draw in the hero colour. */
  highlight?: number;
}

interface Cell {
  c: number;
  r: number;
  x: number;
  y: number;
}

interface Grid {
  cx: (c: number) => number;
  cy: (i: number) => number;
  pitch: number;
  rad: ScalePower<number, number>;
  step: number;
}

interface RowProps {
  fill: string;
  /** Engraved pattern fill; omit for solid circles. */
  pattern?: string;
  grid: Grid;
  i: number;
  labelClass: string;
  row: SingleAxisRow;
  dimmed: boolean;
  x0: number;
  x1: number;
}

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;
const oneDp = d3format(".1f");

/** One station: its own axis line, label and a circle per non-empty hour. */
const Row = (p: RowProps) => {
  const y = crisp(p.grid.cy(p.i));
  return (
    <g className={dimClass(p.dimmed)}>
      <line className="rule" x1={p.x0} x2={p.x1} y1={y} y2={y} />
      <text className={`t-label ${p.labelClass}`} x={0} y={y} dy="0.35em">
        {p.row.label}
      </text>
      {p.row.values.map((v, c) =>
        v > 0 ? (
          <circle
            key={`${p.row.label}-${hourLabel(c)}`}
            className={`pop ${p.fill}`}
            fill={p.pattern}
            style={stagger(c + p.i * 2, "fine")}
            cx={p.grid.cx(c)}
            cy={y}
            r={Math.max(2, p.grid.rad(v))}
            strokeWidth={1}
          />
        ) : null
      )}
    </g>
  );
};

/** Hit targets: one per cell, including empty hours. */
const HitCells = (p: {
  columns: string[];
  data: SingleAxisRow[];
  grid: Grid;
  onEnter: (cell: Cell) => void;
}) => (
  <g className="fill-transparent">
    {p.data.map((d, i) =>
      p.columns.map((col, c) => (
        <rect
          key={`${d.label}-${col}`}
          x={p.grid.cx(c) - p.grid.step / 2}
          y={p.grid.cy(i) - p.grid.pitch / 2}
          width={p.grid.step}
          height={p.grid.pitch}
          onPointerEnter={() => {
            p.onEnter({
              c,
              r: i,
              x: p.grid.cx(c),
              y: p.grid.cy(i) - Math.max(4, p.grid.rad(d.values[c])) - 4,
            });
          }}
        />
      ))
    )}
  </g>
);

/** Screen-reader summary: each station's highest hour. */
const describe = (
  data: SingleAxisRow[],
  columns: string[],
  format: (v: number) => string,
  unit: string,
  zone: string
) =>
  `Predicted tide height by hour at ${data.length} stations: ${data
    .map((d) => {
      const high = Math.max(...d.values);
      return `${d.label} highest ${format(high)} ${unit} at ${columns[d.values.indexOf(high)]} ${zone}`;
    })
    .join(", ")}`;

/**
 * G14 Up the Hudson (punch card). One row per station, each on its own
 * hairline hour axis (local standard time); circle area = predicted tide
 * height, rows in order up a river. The row with
 * the highest tides (or the highlight) is solid ink; every other station's
 * circles are hatched over a paper ground inside a 1px outline, so neighbours
 * overlap cleanly.
 */
export const SingleAxis = (props: SingleAxisProps) => {
  const data = props.data ?? singleAxisDemo;
  const height = props.height ?? 400;
  const n = data[0]?.values.length ?? 24;
  const columns =
    props.columns ?? Array.from({ length: n }, (_, h) => hourLabel(h));
  const ticks = props.ticks ?? [0, 6, 12, 18];
  const format = props.format ?? oneDp;
  const unit = props.unit ?? "m";
  const zone = props.zone ?? "EST";
  const [hover, setHover] = useState<Cell | null>(null);
  const totals = data.map((d) => d.values.reduce((s, v) => s + v, 0));
  const rank = ranks(totals);
  const heroIndex = props.highlight ?? rank.indexOf(0);
  const tex = useTextureIds("punch");
  const max = Math.max(...data.flatMap((d) => d.values));
  const label = describe(data, columns, format, unit, zone);

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>
              {data[hover.r].label} {columns[hover.c]} {zone}
            </b>{" "}
            · {format(data[hover.r].values[hover.c])} {unit}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const m = {
          bottom: 28 + noteSpace(props.note, width - 16, 18),
          // Room for the longest station name.
          left:
            Math.ceil(Math.max(...data.map((d) => sansWidth(d.label, 12)))) +
            12,
          right: 0,
          top: 14,
        };
        // A circle may reach 0.95 of a step, so the last hour's overhangs its
        // column by 0.45 of a step; the axis stops short to keep it inside.
        const step = (width - m.left - m.right) / (n + 0.45);
        // Rows close up when the hours are narrow and the circles small.
        const pitch = Math.min(
          (height - m.top - m.bottom) / data.length,
          Math.max(28, step * 3.2)
        );
        const svgH = Math.round(m.top + pitch * data.length + m.bottom);
        const grid: Grid = {
          cx: (c) => m.left + step * (c + 0.5),
          cy: (i) => m.top + pitch * (i + 0.5),
          pitch,
          rad: scaleSqrt()
            .domain([0, max])
            .range([0, Math.min(pitch * 0.46, step * 0.95)]),
          step,
        };
        const floor = svgH - m.bottom;

        return (
          <svg
            width={width}
            height={svgH}
            aria-label={label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l4" />
            </defs>
            {data.map((d, i) => (
              <Row
                key={d.label}
                dimmed={hover !== null && hover.r !== i}
                fill={heroIndex === i ? "fill-hero stroke-paper" : "stroke-l5"}
                pattern={heroIndex === i ? undefined : paint(tex("hatch"))}
                grid={grid}
                i={i}
                labelClass={heroIndex === i ? "fill-text" : "fill-muted"}
                row={d}
                x0={m.left}
                x1={width - m.right}
              />
            ))}
            <HitCells
              columns={columns}
              data={data}
              grid={grid}
              onEnter={setHover}
            />
            {ticks.map((c) => (
              <text
                key={columns[c]}
                className="t-axis"
                x={grid.cx(c)}
                y={floor + 16}
                textAnchor="middle"
              >
                {columns[c]}
              </text>
            ))}
            <text
              className="t-axis"
              x={width - m.right}
              y={floor + 16}
              textAnchor="end"
            >
              {zone}
            </text>
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={svgH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
