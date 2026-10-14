import { scaleSqrt } from "d3-scale";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { clamp, noteSpace, sansWidth, stagger } from "../util";
import { arcMatrixDemo } from "./arc-matrix.data";
import type { ArcMatrixData } from "./arc-matrix.data";

interface ArcMatrixProps {
  data?: ArcMatrixData;
  height?: number;
  format?: (v: number) => string;
  /** Noun for the tooltip, e.g. "paying accounts". */
  noun?: string;
  note?: string;
  /** How many top cells to label; the largest is inked. Default 3. */
  top?: number;
}

interface CellHover {
  c: number;
  r: number;
  x: number;
  y: number;
}

interface MatrixCell {
  c: number;
  id: string;
  r: number;
  v: number;
}

interface ArcLayout {
  arcY: (r: number, x: number) => number;
  /** Height the plot needs: marks, air and any footnote. */
  bottom: number;
  colPitch: number;
  /** Slant of the column names, in degrees (negative is up). */
  colTilt: number;
  colX: (c: number) => number;
  curve: (r: number) => string;
  radius: (v: number) => number;
  /** Right edge of the row names. */
  rowLabelX: number;
  rowPitch: number;
  x0: number;
}

const arcLayout = (
  width: number,
  height: number,
  data: ArcMatrixData,
  max: number,
  noteH: number
): ArcLayout => {
  const nC = data.cols.length;
  // Row names, then the largest bubble's radius plus air before the first column.
  const labelW = Math.max(0, ...data.rows.map((r) => sansWidth(r, 12)));
  const reach = 22;
  const colPitch = clamp((width - labelW - reach - 24) / nC, 22, 44);
  const spanW = colPitch * (nC - 1);
  const x0 = Math.max(
    labelW + reach,
    labelW + reach + (width - labelW - reach - spanW - colPitch) / 2
  );
  const xMid = x0 + spanW / 2;
  // At least 70 above the first row, more when the column names (slanted
  // at 50°) need it; the last row's ends and bubbles reach 0.2 of a row below
  // its slot, then a little air and any footnote.
  const n = data.rows.length;
  const pitchFor = (top: number) =>
    clamp((height - top - 8 - noteH) / (n + 0.2), 22, 40);
  const longest = Math.max(0, ...data.cols.map((c) => sansWidth(c, 12)));
  // Tight columns tilt steeper, so neighbouring names never touch.
  const colTilt = colPitch < 30 ? -64 : -50;
  const rise = Math.sin((-colTilt * Math.PI) / 180);
  const top = Math.max(70, longest * rise + pitchFor(70) * 0.85 + 6);
  const rowPitch = pitchFor(top);
  const bow = rowPitch * 0.5;
  const arcY = (r: number, x: number) => {
    const u = (x - xMid) / (spanW / 2 || 1);
    return top + bow + r * rowPitch + rowPitch * 0.3 - bow * (1 - u * u);
  };
  const radius = scaleSqrt()
    .domain([0, max])
    .range([0, Math.min(colPitch, rowPitch) * 0.4]);
  const steps = Array.from({ length: 41 }, (_, k) => x0 + (spanW * k) / 40);
  return {
    arcY,
    bottom: top + (n + 0.2) * rowPitch + 8 + noteH,
    colPitch,
    colTilt,
    colX: (c) => x0 + c * colPitch,
    curve: (r) =>
      steps
        .map(
          (x, k) =>
            `${k === 0 ? "M" : "L"}${x.toFixed(1)},${arcY(r, x).toFixed(1)}`
        )
        .join(""),
    radius: (v) => Math.max(2, radius(v)),
    rowLabelX: x0 - Math.min(colPitch, rowPitch) * 0.4 - 8,
    rowPitch,
    x0,
  };
};

/** Row curves with their names, and the rotated column labels riding the top arc. */
const Frame = (props: {
  data: ArcMatrixData;
  hover: CellHover | null;
  layout: ArcLayout;
}) => {
  const { arcY, colTilt, colX, curve, rowLabelX, rowPitch, x0 } = props.layout;
  const { hover } = props;
  return (
    <g>
      {props.data.cols.map((col, ci) => (
        <text
          className={`fade t-label ${hover !== null && hover.c === ci ? "fill-text" : "fill-muted"}`}
          key={col}
          style={stagger(ci, "mark")}
          transform={`translate(${colX(ci) + 2},${arcY(0, colX(ci)) - rowPitch * 1.15}) rotate(${colTilt})`}
        >
          {col}
        </text>
      ))}
      {props.data.rows.map((row, ri) => (
        <g key={row}>
          <path
            className="draw stroke-rule"
            d={curve(ri)}
            fill="none"
            pathLength={1}
            strokeWidth={1}
            style={stagger(ri, "series")}
          />
          <text
            className={`t-name ${hover !== null && hover.r === ri ? "fill-text" : "fill-muted"}`}
            dy="0.34em"
            textAnchor="end"
            x={rowLabelX}
            y={arcY(ri, x0)}
          >
            {row}
          </text>
        </g>
      ))}
    </g>
  );
};

/**
 * L4 Features by city. Category × category with a magnitude. Each row bows like a
 * horizon; the bubble at each crossing has area proportional to the value.
 * The top few cells are labelled; only the largest is inked.
 */
export const ArcMatrix = (props: ArcMatrixProps) => {
  const data = props.data ?? arcMatrixDemo;
  const height = props.height ?? 440;
  const format = props.format ?? ((v: number) => `${v}k`);
  const noun = props.noun ?? "weekly users";
  const [hover, setHover] = useState<CellHover | null>(null);
  const cells: MatrixCell[] = data.values.flatMap((row, r) =>
    row.map((v, c) => ({ c, id: `${data.rows[r]}-${data.cols[c]}`, r, v }))
  );
  const max = Math.max(1, ...cells.map((d) => d.v));
  const ranked = cells.toSorted((a, b) => b.v - a.v).slice(0, props.top ?? 3);
  const topIds = new Set(ranked.map((d) => d.id));
  const heroId = ranked.at(0)?.id;
  const inCross = (d: MatrixCell) =>
    hover === null || hover.r === d.r || hover.c === d.c;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data.rows[hover.r]}</b> · {data.cols[hover.c]} ·{" "}
            {format(data.values[hover.r][hover.c])} {noun}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 20);
        const layout = arcLayout(width, height, data, max, noteH);
        const svgH = Math.min(height, Math.round(layout.bottom));
        return (
          <svg
            aria-label={`Matrix of ${data.rows.length} by ${data.cols.length}. Largest: ${ranked.map((d) => `${data.rows[d.r]} in ${data.cols[d.c]} ${format(d.v)}`).join(", ")}`}
            height={svgH}
            onPointerLeave={() => {
              setHover(null);
            }}
            width={width}
          >
            <title>Bubble matrix with bowed rows</title>
            <Frame data={data} hover={hover} layout={layout} />
            {cells.map((d) => {
              const x = layout.colX(d.c);
              const y = layout.arcY(d.r, x);
              const rr = layout.radius(d.v);
              const isTop = topIds.has(d.id);
              return (
                <g
                  className={`transition-opacity ${inCross(d) ? "" : "opacity-30"}`}
                  key={d.id}
                  onPointerEnter={() => {
                    setHover({ c: d.c, r: d.r, x, y: y - rr - 4 });
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    fill="transparent"
                    r={Math.max(rr, layout.colPitch / 2.2)}
                  />
                  <circle
                    className={`pop ${d.id === heroId ? "fill-hero" : "fill-l4"}`}
                    cx={x}
                    cy={y}
                    r={rr}
                    style={stagger(d.r * 3 + d.c, "dense")}
                  />
                  {isTop ? (
                    <text
                      className={`fade ${d.id === heroId ? "t-value" : "t-axis"}`}
                      textAnchor="middle"
                      x={x}
                      y={y - rr - 6}
                    >
                      {format(d.v)}
                    </text>
                  ) : null}
                </g>
              );
            })}
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
