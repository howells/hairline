import { scaleSqrt } from "d3-scale";
import { useState } from "react";

import { fmtInt } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { HitCircle, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { clamp, noteSpace, sansWidth, stagger } from "../util";
import { arcMatrixDemo } from "./arc-matrix.data";
import type { ArcMatrixData } from "./arc-matrix.data";

interface ArcMatrixProps {
  data?: ArcMatrixData;
  height?: number;
  format?: (v: number) => string;
  /** Words after the value in the tooltip, e.g. "of new woodland". */
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
  const labelW = Math.max(0, ...data.rows.map((r) => sansWidth(r, 11)));
  // At least 70 above the first row, more when the column names (slanted
  // at 50°) need it; the last row's ends and bubbles reach 0.2 of a row below
  // its slot, then a little air and any footnote.
  const n = data.rows.length;
  const pitchFor = (top: number) =>
    clamp((height - top - 8 - noteH) / (n + 0.2), 22, 40);
  const colW = data.cols.map((c) => sansWidth(c, 11));
  const longest = Math.max(0, ...colW);
  // Column pitch decides the tilt, the tilt the headroom and the headroom the
  // row pitch; the composition (row names, bubbles and the last slanted name)
  // is then centred in the width.
  const columnFit = (pitch: number) => {
    // Tight columns tilt steeper, so neighbouring names never touch.
    const tilt = pitch < 30 ? -64 : -50;
    const rise = Math.sin((-tilt * Math.PI) / 180);
    const run = Math.cos((-tilt * Math.PI) / 180);
    const head = Math.max(70, longest * rise + pitchFor(70) * 0.85 + 6);
    const rows = pitchFor(head);
    const rad = Math.min(pitch, rows) * 0.4;
    const left = labelW + 8 + rad;
    const right = Math.max(
      pitch * (nC - 1) + rad,
      ...colW.map((w, c) => c * pitch + 8 + w * run + 3 * rise)
    );
    return { head, left, right, rows, tilt };
  };
  let colPitch = 44;
  let fit = columnFit(colPitch);
  while (colPitch > 14 && fit.left + fit.right > width) {
    colPitch -= 0.25;
    fit = columnFit(colPitch);
  }
  const { head: top, left, right, rows: rowPitch, tilt: colTilt } = fit;
  const spanW = colPitch * (nC - 1);
  const x0 = left + Math.max(0, (width - left - right) / 2);
  const xMid = x0 + spanW / 2;
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
        <Label
          className={
            hover !== null && hover.c === ci ? "fill-text" : "fill-muted"
          }
          key={col}
          order={ci}
          tier="mark"
          transform={`translate(${colX(ci) + 2},${arcY(0, colX(ci)) - rowPitch * 1.15}) rotate(${colTilt})`}
          voice="label"
        >
          {col}
        </Label>
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
          <Label
            anchor="end"
            className={
              hover !== null && hover.r === ri ? "fill-text" : "fill-muted"
            }
            middle
            voice="name"
            x={rowLabelX}
            y={arcY(ri, x0)}
          >
            {row}
          </Label>
        </g>
      ))}
    </g>
  );
};

/**
 * L4 New woodland. Category × category with a magnitude. Each row bows like a
 * horizon; the bubble at each crossing has area proportional to the value.
 * The top few cells are labelled; only the largest is inked.
 */
export const ArcMatrix = (props: ArcMatrixProps) => {
  const data = props.data ?? arcMatrixDemo;
  const height = props.height ?? 440;
  const format = props.format ?? ((v: number) => `${fmtInt(v)} ha`);
  const noun = props.noun ?? "of new woodland";
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
            <TipText
              facts={[
                data.cols[hover.c],
                `${format(data.values[hover.r][hover.c])} ${noun}`,
              ]}
              lead={data.rows[hover.r]}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 20);
        const layout = arcLayout(width, height, data, max, noteH);
        const svgH = Math.min(height, Math.round(layout.bottom));
        return (
          <ChartSvg
            height={svgH}
            label={`Matrix of ${data.rows.length} by ${data.cols.length}. Largest: ${ranked.map((d) => `${data.rows[d.r]} in ${data.cols[d.c]} ${format(d.v)}`).join(", ")}`}
            leave={() => {
              setHover(null);
            }}
            title="Bubble matrix with bowed rows"
            width={width}
          >
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
                  <HitCircle
                    cx={x}
                    cy={y}
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
                    <Label
                      anchor="middle"
                      className="fade"
                      voice={d.id === heroId ? "value" : "axis"}
                      x={x}
                      y={y - rr - 6}
                    >
                      {format(d.v)}
                    </Label>
                  ) : null}
                </g>
              );
            })}
            <FootNote height={svgH} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
