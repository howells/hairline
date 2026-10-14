import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import { dimClass, stagger } from "../util";
import { dotHeatDemo } from "./dot-heat.data";
import type { DotHeatData } from "./dot-heat.data";
import type { Tip } from "./util-b";

interface DotHeatProps {
  data?: DotHeatData;
  format?: (v: number) => string;
  height?: number;
  /** [row, column] of the cell to ring; defaults to the largest. */
  highlight?: readonly [number, number];
  /** Label every nth column on the axis. */
  labelEvery?: number;
  note?: string;
}

interface Cell {
  c: number;
  id: string;
  r: number;
  v: number;
}

interface Grid {
  cell: number;
  colW: number;
  cx: (c: number) => number;
  cy: (r: number) => number;
  gridBottom: number;
  /** The svg height: the given height, less what a width-bound grid can't use. */
  height: number;
  narrow: boolean;
  radius: (v: number) => number;
  rowH: number;
  /** Top of the grid; the room above it holds the tooltip. */
  top: number;
  x0: number;
}

/** Area carries the count; tone steps up the ramp in thirds; the hero is ink. */
/** The ring's least clearance from any dot, and its dots' radius. */
const RING_CLEAR = 2.5;
const RING_DOT = 0.75;
/** How far out the ring would like to sit from the peak dot. */
const RING_GAP = 4;

/**
 * The peak's ring radius: RING_GAP outside its dot, pulled in so it never
 * comes within RING_CLEAR of a neighbouring dot (diagonals included).
 */
const ringRadius = (
  grid: { colW: number; radius: (v: number) => number; rowH: number },
  values: readonly (readonly number[])[],
  peakR: number,
  peakC: number
) => {
  const own = grid.radius(values[peakR]?.[peakC] ?? 0);
  let r = own + RING_GAP;
  for (const dr of [-1, 0, 1]) {
    for (const dc of [-1, 0, 1]) {
      const v = values[peakR + dr]?.[peakC + dc];
      if ((dr !== 0 || dc !== 0) && v !== undefined && v > 0) {
        const dist = Math.hypot(dr * grid.rowH, dc * grid.colW);
        r = Math.min(r, dist - grid.radius(v) - RING_CLEAR - RING_DOT);
      }
    }
  }
  return Math.max(own + RING_CLEAR + RING_DOT, r);
};

const dotClass = (share: number, hero: boolean): string => {
  if (hero) {
    return "fill-hero";
  }
  if (share <= 0) {
    return "fill-l5";
  }
  if (share >= 2 / 3) {
    return "fill-l2";
  }
  return share >= 1 / 3 ? "fill-l3" : "fill-l4";
};

const buildGrid = (
  width: number,
  height: number,
  data: DotHeatData,
  max: number,
  hasNote: boolean
): Grid => {
  const labelW = width < 420 ? 34 : 52;
  // Room above the grid for the tooltip, so it never covers a dot.
  const top = 40;
  const bottom = hasNote ? 62 : 34;
  const colRoom = (width - labelW - 12) / data.columns.length;
  // Rows never stretch far past the columns: a narrow grid gives height back.
  const rowH = Math.min(
    (height - top - bottom) / data.rows.length,
    colRoom * 1.15
  );
  const gridH = rowH * data.rows.length;
  const colW = Math.min(colRoom, rowH * 1.05, 58);
  // Centre the labels and the grid together.
  const x0 = (width - labelW - colW * data.columns.length) / 2 + labelW;
  const cell = Math.min(colW, rowH);
  // Room for the peak's ring between two full-size neighbours: the ring keeps
  // RING_CLEAR from its own dot and from every neighbour.
  const rMax = Math.min(
    cell * 0.44,
    (cell - RING_CLEAR * 2 - RING_DOT * 2) / 2
  );
  return {
    cell,
    colW,
    cx: (c) => x0 + (c + 0.5) * colW,
    cy: (r) => top + (r + 0.5) * rowH,
    gridBottom: top + gridH,
    height: Math.round(top + gridH + bottom),
    narrow: colW < 34,
    radius: (v) => (v <= 0 ? 1 : Math.max(2, Math.sqrt(v / max) * rMax)),
    rowH,
    top,
    x0,
  };
};

const peakOf = (cells: Cell[]): readonly [number, number] => {
  let [best] = cells;
  for (const cell of cells) {
    if (best === undefined || cell.v > best.v) {
      best = cell;
    }
  }
  return best === undefined ? [0, 0] : [best.r, best.c];
};

const Axes = (props: { data: DotHeatData; every: number; grid: Grid }) => {
  const { grid } = props;
  const step = grid.narrow ? props.every * 2 : props.every;
  return (
    <g>
      {props.data.rows.map((row, r) => (
        <text
          className="t-label fill-muted"
          dy="0.34em"
          key={row}
          textAnchor="end"
          x={grid.x0 - 14}
          y={grid.cy(r)}
        >
          {grid.narrow ? row.slice(0, 2) : row}
        </text>
      ))}
      {props.data.columns.map((col, c) =>
        c % step === 0 ? (
          <text
            className="t-axis"
            key={col}
            textAnchor="middle"
            x={grid.cx(c)}
            y={grid.gridBottom + 18}
          >
            {col}
          </text>
        ) : null
      )}
    </g>
  );
};

interface DotsProps {
  cells: Cell[];
  grid: Grid;
  hero: string;
  hover: string | null;
  max: number;
  onHover: (tip: Tip<Cell>) => void;
}

const Dots = (props: DotsProps) => {
  const { grid } = props;
  return (
    <g>
      {props.cells.map((cell) => (
        <g
          className={dimClass(props.hover !== null && props.hover !== cell.id)}
          key={cell.id}
          onPointerEnter={() => {
            props.onHover({
              item: cell,
              x: grid.cx(cell.c),
              y: grid.top - 2,
            });
          }}
        >
          <circle
            className={`pop ${dotClass(cell.v / props.max, cell.id === props.hero)}`}
            cx={grid.cx(cell.c)}
            cy={grid.cy(cell.r)}
            r={grid.radius(cell.v)}
            style={stagger(cell.r + cell.c, "mark")}
          />
          <rect
            className="fill-transparent"
            height={grid.rowH}
            width={grid.colW}
            x={grid.cx(cell.c) - grid.colW / 2}
            y={grid.cy(cell.r) - grid.rowH / 2}
          />
        </g>
      ))}
    </g>
  );
};

/**
 * F10 Busy hours. One dot per cell, area = count, tone stepping up the ramp
 * in thirds; the peak is the one dot in ink, inside an evenly dotted ring.
 * Empty cells keep a pinpoint so silence stays visible. The tooltip sits
 * above the grid, over the hovered column, clear of every dot.
 */
export const DotHeat = (props: DotHeatProps) => {
  const data = props.data ?? dotHeatDemo;
  const height = props.height ?? 460;
  const format = props.format ?? String;
  const [tip, setTip] = useState<Tip<Cell> | null>(null);

  const cells: Cell[] = data.values.flatMap((row, r) =>
    row.map((v, c) => ({ c, id: `${data.rows[r]}-${data.columns[c]}`, r, v }))
  );
  const max = Math.max(1, ...cells.map((d) => d.v));
  const [peakR, peakC] = props.highlight ?? peakOf(cells);
  const peakV = data.values[peakR]?.[peakC] ?? 0;
  const peakId = `${data.rows[peakR]}-${data.columns[peakC]}`;
  const label = `Counts by ${data.rows.length} rows by ${data.columns.length} columns; peak ${format(peakV)} at ${data.rows[peakR]} ${data.columns[peakC]}`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>
              {data.rows[tip.item.r]} {data.columns[tip.item.c]}
            </b>{" "}
            · {format(tip.item.v)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const grid = buildGrid(
          width,
          height,
          data,
          max,
          props.note !== undefined
        );
        return (
          <svg
            aria-label={label}
            height={grid.height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <Axes data={data} every={props.labelEvery ?? 2} grid={grid} />
            <Dots
              cells={cells}
              grid={grid}
              hero={peakId}
              hover={tip?.item.id ?? null}
              max={max}
              onHover={setTip}
            />
            <DotRing
              className="fade pointer-events-none"
              tone="fill-l2"
              cx={grid.cx(peakC)}
              cy={grid.cy(peakR)}
              r={ringRadius(grid, data.values, peakR, peakC)}
              step={3}
            />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={grid.height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
