import { useState } from "react";

import { Plot, Tooltip } from "../core";
import {
  CrossHatch,
  DotScreen,
  Hatch,
  KeySwatch,
  PlateLabel,
} from "../texture";
import {
  HALFTONE_R,
  paint,
  TEXTURE_PITCH,
  useTextureIds,
} from "../texture-ids";
import { sansWidth, stagger, sum } from "../util";
import { matrixHeatDemo } from "./matrix-heat.data";
import type { MatrixData } from "./matrix-heat.data";
import { byStep } from "./util-b";

interface MatrixHeatProps {
  data?: MatrixData;
  /** Four lower bounds splitting values into five shades. */
  thresholds?: [number, number, number, number];
  /** Unit suffix for legend and tooltip, e.g. "%". */
  unit?: string;
  /** Cell to frame as the key cell: [row, col]. Defaults to the largest value. */
  highlight?: [number, number];
  height?: number;
  format?: (v: number) => string;
}

interface Geometry {
  x0: number;
  top: number;
  cell: number;
  /** Tile side in whole px. */
  size: number;
}

/** Halftone dot radius per bin, at the screen pitch: more is darker. */

/** Corner radius of every tile and key swatch. */
const TILE_RX = 2;

/** Pattern ids: one screen per bin, the hero's crosshatch, the empty hatch. */
interface MatrixFills {
  empty: string;
  hero: string;
  screens: string[];
}

/** True when the matrix mirrors across its diagonal (pairs, not directions). */
const isSymmetric = (values: (number | null)[][]) => {
  for (const [i, row] of values.entries()) {
    if (row.length !== values.length) {
      return false;
    }
    for (const [j, v] of row.entries()) {
      if (values[j]?.[i] !== v) {
        return false;
      }
    }
  }
  return true;
};

/** A cell in the lower triangle: (row, col) with row below col. */
const lower = ([r, c]: [number, number]): [number, number] =>
  r < c ? [c, r] : [r, c];

const largestCell = (values: (number | null)[][]): [number, number] => {
  let best: [number, number] = [0, 0];
  let max = -Infinity;
  for (const [r, row] of values.entries()) {
    for (const [c, v] of row.entries()) {
      if (v !== null && v > max) {
        max = v;
        best = [r, c];
      }
    }
  }
  return best;
};

interface HeadersProps {
  rows: string[];
  cols: string[];
  g: Geometry;
  hover: [number, number] | null;
  /** Lower triangle only: the first row and last column have no cells. */
  triangle: boolean;
}

const Headers = ({ rows, cols, g, hover, triangle }: HeadersProps) => (
  <g>
    {cols.map((c, j) => {
      if (triangle && j === cols.length - 1) {
        return null;
      }
      const x = g.x0 + g.cell * j + g.size / 2 + 3;
      // In a triangle each column is named just above its first cell.
      const y = g.top + (triangle ? g.cell * j : 0) - 12;
      return (
        <text
          key={`col-${c}`}
          className={`fade t-label ${hover?.[1] === j ? "fill-ink" : "fill-muted"}`}
          style={stagger(j, "mark")}
          x={x}
          y={y}
          transform={`rotate(-55 ${x} ${y})`}
        >
          {c}
        </text>
      );
    })}
    {rows.map((r, i) =>
      triangle && i === 0 ? null : (
        <text
          key={`row-${r}`}
          className={`fade t-label ${hover?.[0] === i ? "fill-ink" : "fill-muted"}`}
          style={stagger(i, "mark")}
          x={g.x0 - 14}
          y={g.top + g.cell * (triangle ? i - 1 : i) + g.size / 2}
          dy="0.34em"
          textAnchor="end"
        >
          {r}
        </text>
      )
    )}
  </g>
);

interface TileProps {
  className?: string;
  fill: string;
  size: number;
  x: number;
  y: number;
}

/**
 * One tile: a texture on paper inside a crisp 1px rule, translated to its own
 * whole-pixel corner so every tile's texture starts the same way.
 */
const Tile = ({ className, fill, size, x, y }: TileProps) => (
  <g transform={`translate(${Math.round(x)} ${Math.round(y)})`}>
    <rect
      className={`shape-crisp ${className ?? "stroke-l5"}`}
      fill={fill}
      height={size - 1}
      rx={TILE_RX}
      strokeWidth={1}
      width={size - 1}
      x={0.5}
      y={0.5}
    />
  </g>
);

interface LegendProps {
  labels: string[];
  screens: string[];
  x: number;
  y: number;
  span: number;
  wide: boolean;
}

/** The five screens and their ranges: one row when wide, rows of three when narrow. */
const ShadeLegend = ({ labels, screens, x, y, span, wide }: LegendProps) => {
  // Swatch, gap, label, then air before the next entry.
  const widths = labels.map((l) => 18 + sansWidth(l, 11) + 20);
  const perRow = wide ? screens.length : 3;
  const column = Math.min(span / perRow, Math.max(...widths));
  const offsets = widths.map((_, k) =>
    wide ? sum(widths.slice(0, k)) : column * (k % perRow)
  );
  return (
    <g className="fade" style={stagger(10)}>
      {screens.map((screen, k) => (
        <g key={screen}>
          <KeySwatch
            fill={paint(screen)}
            x={x + (offsets[k] ?? 0)}
            y={y - 6 + Math.floor(k / perRow) * 20}
          />
          <text
            className="t-axis"
            x={x + (offsets[k] ?? 0) + 18}
            y={y + Math.floor(k / perRow) * 20}
            dy="0.34em"
          >
            {labels[k]}
          </text>
        </g>
      ))}
    </g>
  );
};

interface CellsProps {
  fills: MatrixFills;
  data: MatrixData;
  rows: string[];
  cols: string[];
  g: Geometry;
  hover: [number, number] | null;
  keyCell: [number, number];
  bin: (v: number) => number;
  format: (v: number) => string;
  onHover: (cell: [number, number]) => void;
  triangle: boolean;
}

interface CellProps {
  /** The row the tile is drawn in (a triangle drops the empty first row). */
  at: number;
  bin: (v: number) => number;
  fills: MatrixFills;
  format: (v: number) => string;
  g: Geometry;
  hero: boolean;
  i: number;
  j: number;
  lit: boolean;
  onHover: (cell: [number, number]) => void;
  v: number | null;
}

/** One tile: a halftone step of its value, or the hero's crosshatch, or a hatch for no value. */
const Cell = ({
  at,
  bin,
  fills,
  format,
  g,
  hero,
  i,
  j,
  lit,
  onHover,
  v,
}: CellProps) => {
  const x = Math.round(g.x0 + g.cell * j);
  const y = Math.round(g.top + g.cell * at);
  if (v === null) {
    return (
      <g className="fade">
        <Tile fill={paint(fills.empty)} size={g.size} x={x} y={y} />
      </g>
    );
  }
  return (
    <g
      className={`transition-opacity ${lit ? "" : "opacity-30"}`}
      onPointerEnter={() => {
        onHover([i, j]);
      }}
    >
      <g className="pop" style={stagger(i + j, "mark")}>
        <Tile
          className={hero ? "stroke-hero" : "stroke-l5"}
          fill={paint(
            hero ? fills.hero : (fills.screens[bin(v)] ?? fills.empty)
          )}
          size={g.size}
          x={x}
          y={y}
        />
      </g>
      {g.size >= 24 || hero ? (
        <g className="fade" style={stagger(hero ? 8 : i + j, "mark")}>
          <PlateLabel
            hero={hero}
            text={format(v)}
            x={x + g.size / 2}
            y={y + g.size / 2}
          />
        </g>
      ) : null}
    </g>
  );
};

const Cells = ({
  fills,
  data,
  rows,
  cols,
  g,
  hover,
  keyCell,
  bin,
  format,
  onHover,
  triangle,
}: CellsProps) => (
  <g>
    {data.values.map((row, i) =>
      row.map((v, j) =>
        triangle && j >= i ? null : (
          <Cell
            at={triangle ? i - 1 : i}
            key={`${rows[i] ?? "row"}-${cols[j] ?? "col"}`}
            bin={bin}
            fills={fills}
            format={format}
            g={g}
            hero={keyCell[0] === i && keyCell[1] === j}
            i={i}
            j={j}
            lit={hover === null || hover[0] === i || hover[1] === j}
            onHover={onHover}
            v={v}
          />
        )
      )
    )}
  </g>
);

/** The matrix's patterns: the empty hatch, the hero's crosshatch, one halftone per step. */
const MatrixDefs = ({ fills }: { fills: MatrixFills }) => (
  <defs>
    <Hatch ground="fill-paper" id={fills.empty} tone="fill-l5" />
    <CrossHatch ground="fill-paper" id={fills.hero} tone="fill-hero" />
    {HALFTONE_R.map((r, k) => (
      <DotScreen
        ground="fill-paper"
        id={fills.screens[k] ?? ""}
        key={r}
        pitch={TEXTURE_PITCH.screen}
        r={r}
        tone="fill-l3"
      />
    ))}
  </defs>
);

/** Slant of the column names, in degrees. */
const HEAD_TILT = 55;

/**
 * Cell size and grid origin for a width. The row names, the tiles and the
 * last slanted column name (which runs past the tiles) are centred as one
 * block, with the largest cell that fits it. `left` is the block's room left
 * of the grid and `right` its reach beyond the grid's origin.
 */
const geometryFor = (
  width: number,
  rows: string[],
  cols: string[],
  triangle: boolean,
  legendW: number | null
) => {
  // A triangle names no first row and no last column.
  const rowNames = triangle ? rows.slice(1) : rows;
  const colNames = triangle ? cols.slice(0, -1) : cols;
  const left = Math.max(0, ...rowNames.map((r) => sansWidth(r, 11))) + 14;
  const tilt = (HEAD_TILT * Math.PI) / 180;
  const reachAt = (cell: number) => {
    const size = Math.round(cell - cell * 0.16);
    return Math.max(
      cell * (colNames.length - 1) + size,
      legendW ?? 0,
      ...colNames.map(
        (c, j) =>
          cell * j +
          size / 2 +
          3 +
          sansWidth(c, 11) * Math.cos(tilt) +
          3 * Math.sin(tilt)
      )
    );
  };
  let cell = 56;
  while (cell > 18 && left + reachAt(cell) > width) {
    cell -= 0.25;
  }
  const right = reachAt(cell);
  const g: Geometry = {
    cell,
    size: Math.round(cell - cell * 0.16),
    top: legendW === null ? 58 : 76,
    x0: left + Math.max(0, (width - left - right) / 2),
  };
  return { g, left, right };
};

/**
 * L16 Used together. Two discrete dimensions, one tile per pair: a halftone
 * screen on paper whose dot grows in five steps with the value, the number
 * set on it. The strongest pair is the one ink crosshatch, its number
 * knocked out in paper; cells with no value (the diagonal) are a 4px hatch.
 */
export const MatrixHeat = (props: MatrixHeatProps) => {
  const data = props.data ?? matrixHeatDemo;
  const { rows } = data;
  const cols = data.cols ?? data.rows;
  const t = props.thresholds ?? [10, 20, 30, 45];
  const unit = props.unit ?? "%";
  const format = props.format ?? String;
  const [hover, setHover] = useState<[number, number] | null>(null);
  const tex = useTextureIds("matrix");
  const fills: MatrixFills = {
    empty: tex("empty"),
    hero: tex("hero"),
    screens: HALFTONE_R.map((_, k) => tex(`screen-${k}`)),
  };
  const bin = (v: number) =>
    byStep(
      v,
      [
        { min: t[3], out: 4 },
        { min: t[2], out: 3 },
        { min: t[1], out: 2 },
        { min: t[0], out: 1 },
      ],
      0
    );
  const triangle = isSymmetric(data.values);
  const drawnRow = (i: number) => (triangle ? i - 1 : i);
  const rawKey = props.highlight ?? largestCell(data.values);
  const key = triangle ? lower(rawKey) : rawKey;
  const legend = [
    `<${t[0]}${unit}`,
    `${t[0]}–${t[1] - 1}${unit}`,
    `${t[1]}–${t[2] - 1}${unit}`,
    `${t[2]}–${t[3] - 1}${unit}`,
    `${t[3]}${unit}+`,
  ];

  return (
    <Plot>
      {(width) => {
        const narrow = width < 460;
        // Wide, the legend runs in one row under the grid and counts in its width.
        const legendW = narrow
          ? null
          : sum(legend.map((l) => 18 + sansWidth(l, 11) + 20)) - 20;
        const { g, left, right } = geometryFor(
          width,
          rows,
          cols,
          triangle,
          legendW
        );
        const { cell, size, x0 } = g;
        const legendY = g.top + cell * (drawnRow(rows.length - 1) + 1) + 34;
        const height = props.height ?? legendY + (narrow ? 32 : 14);
        const tipV =
          hover === null ? null : (data.values[hover[0]]?.[hover[1]] ?? null);
        const keyV = data.values[key[0]]?.[key[1]] ?? 0;
        return (
          <div className="relative">
            <svg
              width={width}
              height={height}
              aria-label={`${rows.length} by ${cols.length} matrix; strongest ${rows[key[0]] ?? ""} and ${cols[key[1]] ?? ""} at ${format(keyV)}${unit}`}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>Used together</title>
              <Headers
                rows={rows}
                cols={cols}
                g={g}
                hover={hover}
                triangle={triangle}
              />
              <MatrixDefs fills={fills} />
              <Cells
                fills={fills}
                data={data}
                rows={rows}
                cols={cols}
                g={g}
                hover={hover}
                keyCell={key}
                triangle={triangle}
                bin={bin}
                format={format}
                onHover={setHover}
              />
              <ShadeLegend
                labels={legend}
                screens={fills.screens}
                x={narrow ? x0 - left : x0}
                y={legendY}
                span={narrow ? left + right : cell * cols.length}
                wide={!narrow}
              />
            </svg>
            {hover !== null && tipV !== null && (
              <Tooltip
                x={x0 + cell * hover[1] + size / 2}
                y={g.top + cell * drawnRow(hover[0]) - 4}
              >
                <b>
                  {rows[hover[0]]} × {cols[hover[1]]}
                </b>{" "}
                · {format(tipV)}
                {unit}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
