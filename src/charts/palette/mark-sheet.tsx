import type { ReactNode } from "react";

import { crisp } from "../axes";
import { Plot } from "../core";
import { Dot, Ring } from "../markers";
import {
  DOT,
  KEY,
  LABEL_TICK,
  MARK_WEIGHT,
  RING_STEP,
  STEM,
  TICK,
} from "../marks";
import type { DotSize, TickSize } from "../marks";
import { DotRing, DottedLine, KeySwatch } from "../texture";
import { stagger } from "../util";

/** Half the widest caption in the last column ("Ring guide"), in px. */
const LAST_HALF = 31;

interface Sheet {
  /** Left edge of the whole sheet: centred in a wide cell. */
  left: number;
  /** Centre of specimen column k. */
  col: (k: number) => number;
  /** Width of a specimen column. */
  colW: number;
  rowH: number;
  top: number;
}

/**
 * Four specimen columns after the row names, each at most 132px wide; on a
 * phone the names take a little more room so the last captions clear the
 * right edge by as much as the names clear the left.
 */
const sheetFor = (width: number): Sheet => {
  const narrow = width < 560;
  const labelW = narrow ? 96 : 136;
  const colW = Math.min(132, Math.floor((width - labelW) / 4));
  return {
    col: (k) => labelW + k * colW + colW / 2,
    colW,
    // Centred on its ink: the names' left edge to the widest last caption.
    left: Math.max(
      0,
      Math.round((width - (labelW + colW * 3.5 + LAST_HALF)) / 2)
    ),
    rowH: narrow ? 78 : 84,
    top: 8,
  };
};

const SIZES: DotSize[] = ["xs", "sm", "md", "lg"];
const TICKS: TickSize[] = ["sm", "md", "lg", "xl"];

/** One specimen: the mark centred in its column, its name and size under it. */
const Cell = (p: {
  children: ReactNode;
  detail?: number | string;
  label: string;
  order: number;
  x: number;
  y: number;
}) => (
  <g className="fade" style={stagger(p.order, "fine")}>
    {p.children}
    <text
      className="t-axis fill-muted"
      textAnchor="middle"
      x={Math.round(p.x)}
      y={Math.round(p.y) + 26}
    >
      <tspan>{p.label}</tspan>
      {p.detail === undefined ? null : (
        <tspan className="t-value" dy={14} x={Math.round(p.x)}>
          {p.detail}
        </tspan>
      )}
    </text>
  </g>
);

/** A row: its name on the left, four specimens across, centred on `y`. */
const Row = (p: {
  cells: SheetCell[];
  index: number;
  label: string;
  s: Sheet;
}) => {
  const y = Math.round(p.s.top + p.s.rowH * p.index + 18);
  return (
    <g>
      <text className="t-label fill-muted" dy="0.34em" x={0} y={y}>
        {p.label}
      </text>
      {p.cells.map((c, k) => (
        <Cell
          detail={c.detail}
          key={c.label}
          label={c.label}
          order={p.index * 4 + k}
          x={p.s.col(k)}
          y={y}
        >
          {c.mark(Math.round(p.s.col(k)), y)}
        </Cell>
      ))}
    </g>
  );
};

/** A tick standing on a short baseline, so its length reads against the floor. */
const TickSpecimen = (p: { size: TickSize; x: number; y: number }) => {
  const floor = p.y + 8;
  return (
    <g>
      <line
        className="hairline"
        x1={p.x - 10}
        x2={p.x + 10}
        y1={crisp(floor)}
        y2={crisp(floor)}
      />
      <line
        className="hairline"
        x1={crisp(p.x)}
        x2={crisp(p.x)}
        y1={floor - TICK[p.size]}
        y2={floor}
      />
    </g>
  );
};

interface SheetCell {
  /** The size in px, under the name. */
  detail?: number | string;
  label: string;
  mark: (x: number, y: number) => ReactNode;
}

interface SheetRow {
  cells: SheetCell[];
  label: string;
}

/** The rows, top to bottom: points, emphasis, ticks, 2px marks, rules, keys. */
const ROWS: SheetRow[] = [
  {
    cells: SIZES.map((size) => ({
      detail: DOT[size],
      label: size,
      mark: (x, y) => <Dot className="fill-l3" cx={x} cy={y} size={size} />,
    })),
    label: "Dots",
  },
  {
    cells: SIZES.map((size) => ({
      detail: DOT[size],
      label: size,
      mark: (x, y) => <Ring className="stroke-l3" cx={x} cy={y} size={size} />,
    })),
    label: "Rings",
  },
  {
    cells: [
      {
        detail: "md",
        label: "Hero",
        mark: (x, y) => <Dot className="fill-hero" cx={x} cy={y} size="md" />,
      },
      {
        detail: "sm",
        label: "Hover",
        mark: (x, y) => <Dot className="fill-l2" cx={x} cy={y} size="sm" />,
      },
      {
        detail: "md",
        label: "Cursor",
        mark: (x, y) => (
          <Ring
            className="stroke-ink"
            cx={x}
            cy={y}
            size="md"
            weight="cursor"
          />
        ),
      },
      {
        detail: RING_STEP.mark,
        label: "Peak ring",
        mark: (x, y) => (
          <g>
            <Dot className="fill-hero" cx={x} cy={y} size="md" />
            <DotRing
              cx={x}
              cy={y}
              r={DOT.md + 4}
              step={RING_STEP.mark}
              tone="fill-l2"
            />
          </g>
        ),
      },
    ],
    label: "Emphasis",
  },
  {
    cells: TICKS.map((size) => ({
      detail: TICK[size],
      label: size,
      mark: (x, y) => <TickSpecimen size={size} x={x} y={y} />,
    })),
    label: "Ticks",
  },
  {
    cells: [
      {
        detail: STEM.rest,
        label: "Stem",
        mark: (x, y) => (
          <rect
            className="fill-l4"
            height={18}
            width={STEM.rest}
            x={x}
            y={y - 9}
          />
        ),
      },
      {
        detail: STEM.hero,
        label: "Hero stem",
        mark: (x, y) => (
          <rect
            className="fill-hero"
            height={18}
            width={STEM.hero}
            x={x - 1}
            y={y - 9}
          />
        ),
      },
      {
        detail: `${LABEL_TICK.w}×${LABEL_TICK.h}`,
        label: "Label tick",
        mark: (x, y) => (
          <rect
            className="fill-l3"
            height={LABEL_TICK.h}
            width={LABEL_TICK.w}
            x={x - LABEL_TICK.w / 2}
            y={y - 1}
          />
        ),
      },
      {
        detail: MARK_WEIGHT,
        label: "Median",
        mark: (x, y) => (
          <rect
            className="fill-l2"
            height={MARK_WEIGHT}
            width={TICK.xl}
            x={x - TICK.xl / 2}
            y={y - 1}
          />
        ),
      },
    ],
    label: "Stems",
  },
  {
    cells: [
      {
        detail: 1,
        label: "Rule",
        mark: (x, y) => (
          <line
            className="hairline"
            x1={x - 22}
            x2={x + 22}
            y1={crisp(y)}
            y2={crisp(y)}
          />
        ),
      },
      {
        detail: 3,
        label: "Guide",
        mark: (x, y) => (
          <DottedLine tone="fill-l3" x0={x - 22} x1={x + 22} y0={y} y1={y} />
        ),
      },
      {
        detail: "4 3",
        label: "Target",
        mark: (x, y) => (
          <line
            className="stroke-l3 dash-rule"
            strokeWidth={1}
            x1={x - 22}
            x2={x + 22}
            y1={crisp(y)}
            y2={crisp(y)}
          />
        ),
      },
      {
        detail: RING_STEP.guide,
        label: "Ring guide",
        mark: (x, y) => (
          <DotRing cx={x} cy={y} r={12} step={RING_STEP.guide} tone="fill-l4" />
        ),
      },
    ],
    label: "Rules",
  },
  {
    cells: [
      {
        detail: KEY.swatch,
        label: "Swatch",
        mark: (x, y) => (
          <KeySwatch
            tone="fill-l3"
            x={x - KEY.swatch / 2}
            y={y - KEY.swatch / 2}
          />
        ),
      },
      {
        detail: KEY.gap,
        label: "Gap",
        mark: (x, y) => (
          <g>
            <KeySwatch tone="fill-l3" x={x - 20} y={y - KEY.swatch / 2} />
            <text
              className="t-label"
              dy="0.34em"
              x={x - 20 + KEY.swatch + KEY.gap}
              y={y}
            >
              Key
            </text>
          </g>
        ),
      },
    ],
    label: "Keys",
  },
];

/**
 * The marks sheet: every point marker, tick and small rule a chart may draw,
 * with its size. It is the agreed taxonomy (src/charts/marks.ts) drawn, as
 * the Fills sheet is for fills.
 */
export const MarkSheet = () => {
  const rows = ROWS;
  return (
    <Plot>
      {(width) => {
        const s = sheetFor(width);
        const height = s.top + s.rowH * rows.length;
        return (
          <svg
            aria-label="The marks every chart may use"
            height={height}
            width={width}
          >
            <title>Marks</title>
            <g transform={`translate(${s.left} 0)`}>
              {rows.map((row, i) => (
                <Row
                  cells={row.cells}
                  index={i}
                  key={row.label}
                  label={row.label}
                  s={s}
                />
              ))}
            </g>
          </svg>
        );
      }}
    </Plot>
  );
};
