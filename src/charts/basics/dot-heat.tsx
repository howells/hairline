import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect } from "../hover";
import { RING_STEP } from "../marks";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DotRing } from "../texture";
import { stagger } from "../util";
import { dotHeatDemo } from "./dot-heat.data";
import type { DotHeatData } from "./dot-heat.data";
import { inkWidth } from "./util-b";

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

/**
 * The values the dots stretch across: the smallest non-zero value to the
 * largest, so the grid's whole range of sizes and tones is put to use.
 */
interface Span {
  hi: number;
  lo: number;
}

/** Where a value sits in the span, 0 at the smallest to 1 at the largest. */
const spanShare = (v: number, span: Span) =>
  span.hi > span.lo ? (v - span.lo) / (span.hi - span.lo) : 1;

/** Tone steps up the ramp in thirds of the span; empty cells are faintest; the hero is ink. */
const dotClass = (v: number, span: Span, hero: boolean): string => {
  if (hero) {
    return "fill-hero";
  }
  if (v <= 0) {
    return "fill-l5";
  }
  const share = spanShare(v, span);
  if (share >= 2 / 3) {
    return "fill-l2";
  }
  return share >= 1 / 3 ? "fill-l3" : "fill-l4";
};

/** Gap between the row names and the first column. */
const NAME_GAP = 14;
/** Margin kept between the grid's ink and the svg edge. */
const EDGE = 2;

/** The smallest dot's radius; an empty cell keeps a 1px pinpoint. */
const R_MIN = 2;

/**
 * The dot ramp: area grows evenly across the span, from R_MIN at the
 * smallest value to `rMax` at the largest.
 */
const dotRadius = (v: number, span: Span, rMax: number) =>
  v <= 0
    ? 1
    : Math.sqrt(R_MIN ** 2 + spanShare(v, span) * (rMax ** 2 - R_MIN ** 2));

/** Radius of the biggest dot a cell of `cell` px holds, leaving room for the peak's ring. */
const maxRadius = (cell: number) =>
  Math.min(cell * 0.44, (cell - RING_CLEAR * 2 - RING_DOT * 2) / 2);

const buildGrid = (
  width: number,
  height: number,
  data: DotHeatData,
  span: Span,
  hasNote: boolean,
  every: number
): Grid => {
  // Room above the grid for the tooltip, so it never covers a dot.
  const top = 40;
  const bottom = hasNote ? 62 : 34;
  const n = data.columns.length;
  const last = data.values.map((row) => row[n - 1] ?? 0);
  const lastLabel = inkWidth(data.columns[n - 1] ?? "") / 2;
  // The row names, in full while the columns have room and cut to two letters
  // once they don't; the grid is sized to the names it really carries.
  const sizeFor = (narrow: boolean) => {
    const labelW =
      NAME_GAP +
      Math.max(
        ...data.rows.map((row) => inkWidth(narrow ? row.slice(0, 2) : row))
      );
    // The last column's ink reaches past its centre by its biggest dot, or by
    // half its axis label when that column is labelled.
    const reach = (colW: number) =>
      Math.max(
        dotRadius(Math.max(...last), span, maxRadius(colW)),
        (n - 1) % (narrow ? every * 2 : every) === 0 ? lastLabel : 0
      );
    let colRoom = (width - labelW - EDGE * 2) / n;
    for (let k = 0; k < 4; k += 1) {
      colRoom = (width - labelW - EDGE * 2 - reach(colRoom)) / (n - 0.5);
    }
    return { colRoom, labelW, reach };
  };
  let narrow = false;
  let size = sizeFor(false);
  if (Math.min(size.colRoom, 58) < 34) {
    narrow = true;
    size = sizeFor(true);
  }
  const { colRoom, labelW } = size;
  // Rows never stretch far past the columns: a narrow grid gives height back.
  const rowH = Math.min(
    (height - top - bottom) / data.rows.length,
    colRoom * 1.15
  );
  const gridH = rowH * data.rows.length;
  const colW = Math.min(colRoom, rowH * 1.05, 58);
  // Centre the names and the grid's ink together.
  const x0 =
    (width - labelW - (n - 0.5) * colW - size.reach(colW)) / 2 + labelW;
  const cell = Math.min(colW, rowH);
  // Room for the peak's ring between two full-size neighbours: the ring keeps
  // RING_CLEAR from its own dot and from every neighbour.
  const rMax = maxRadius(cell);
  return {
    cell,
    colW,
    cx: (c) => x0 + (c + 0.5) * colW,
    cy: (r) => top + (r + 0.5) * rowH,
    gridBottom: top + gridH,
    height: Math.round(top + gridH + bottom),
    narrow,
    radius: (v) => dotRadius(v, span, rMax),
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
        <Label
          anchor="end"
          key={row}
          middle
          muted
          voice="label"
          x={grid.x0 - NAME_GAP}
          y={grid.cy(r)}
        >
          {grid.narrow ? row.slice(0, 2) : row}
        </Label>
      ))}
      {props.data.columns.map((col, c) =>
        c % step === 0 ? (
          <Label
            anchor="middle"
            key={col}
            voice="axis"
            x={grid.cx(c)}
            y={grid.gridBottom + 18}
          >
            {col}
          </Label>
        ) : null
      )}
    </g>
  );
};

interface DotsProps {
  cells: Cell[];
  grid: Grid;
  dim: (k: number) => boolean;
  hero: string;
  span: Span;
  onHover: (k: number, x: number, y: number) => void;
}

const Dots = (props: DotsProps) => {
  const { grid } = props;
  return (
    <g>
      {props.cells.map((cell, k) => (
        <DimGroup
          dim={props.dim(k)}
          key={cell.id}
          onPointerEnter={() => {
            props.onHover(k, grid.cx(cell.c), grid.top - 2);
          }}
        >
          <circle
            className={`pop ${dotClass(cell.v, props.span, cell.id === props.hero)}`}
            cx={grid.cx(cell.c)}
            cy={grid.cy(cell.r)}
            r={grid.radius(cell.v)}
            style={stagger(cell.r + cell.c, "mark")}
          />
          <HitRect
            height={grid.rowH}
            width={grid.colW}
            x={grid.cx(cell.c) - grid.colW / 2}
            y={grid.cy(cell.r) - grid.rowH / 2}
          />
        </DimGroup>
      ))}
    </g>
  );
};

/**
 * F10 Hour of birth. One dot per cell, its area and tone stretched across
 * the span from the smallest value to the largest (tone in thirds); the peak is the one dot in ink, inside an evenly dotted ring.
 * Empty cells keep a pinpoint so silence stays visible. The tooltip sits
 * above the grid, over the hovered column, clear of every dot.
 */
export const DotHeat = (props: DotHeatProps) => {
  const data = props.data ?? dotHeatDemo;
  const height = props.height ?? 460;
  const format = props.format ?? String;
  const hover = useHover<number>();

  const cells: Cell[] = data.values.flatMap((row, r) =>
    row.map((v, c) => ({ c, id: `${data.rows[r]}-${data.columns[c]}`, r, v }))
  );
  const filled = cells.flatMap((d) => (d.v > 0 ? [d.v] : []));
  const span: Span =
    filled.length === 0
      ? { hi: 1, lo: 1 }
      : { hi: Math.max(...filled), lo: Math.min(...filled) };
  const [peakR, peakC] = props.highlight ?? peakOf(cells);
  const peakV = data.values[peakR]?.[peakC] ?? 0;
  const peakId = `${data.rows[peakR]}-${data.columns[peakC]}`;
  const label = `Values by ${data.rows.length} rows by ${data.columns.length} columns; peak ${format(peakV)} at ${data.rows[peakR]} ${data.columns[peakC]}`;

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <b>
              {data.rows[cells[hover.at.key].r]}{" "}
              {data.columns[cells[hover.at.key].c]}
            </b>{" "}
            · {format(cells[hover.at.key].v)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const grid = buildGrid(
          width,
          height,
          data,
          span,
          props.note !== undefined,
          props.labelEvery ?? 2
        );
        return (
          <ChartSvg
            height={grid.height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <Axes data={data} every={props.labelEvery ?? 2} grid={grid} />
            <Dots
              cells={cells}
              grid={grid}
              dim={hover.dim}
              hero={peakId}
              span={span}
              onHover={(k, x, y) => {
                hover.show(k, x, y);
              }}
            />
            <DotRing
              className="fade pointer-events-none"
              tone="fill-l2"
              cx={grid.cx(peakC)}
              cy={grid.cy(peakR)}
              r={ringRadius(grid, data.values, peakR, peakC)}
              step={RING_STEP.mark}
            />
            <FootNote height={grid.height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
