import { scaleSqrt } from "d3-scale";
import { useState } from "react";

import { fmtInt, yearTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotRing, DotScreen } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { clamp, dimClass, noteSpace, stagger } from "../util";
import {
  bubbleAlmanacDemo,
  bubbleAlmanacLabelled,
} from "./bubble-almanac.data";
import type {
  AlmanacCell,
  AlmanacEvent,
  AlmanacNote,
} from "./bubble-almanac.data";

interface BubbleAlmanacProps {
  data?: AlmanacCell[];
  /** Ignored: margin notes are no longer drawn. */
  notes?: AlmanacNote[];
  /** Ignored: the events footer is no longer drawn. */
  events?: AlmanacEvent[];
  /** Cells to print values on, as "Category-Year". */
  labelled?: string[];
  height?: number;
  format?: (v: number) => string;
  noun?: string;
  note?: string;
}

interface AlmanacLayout {
  categories: string[];
  colPitch: number;
  colX: (category: string) => number;
  core: (v: number) => number;
  gridW: number;
  /** Largest radius: half a cell less the gap. */
  maxR: number;
  radius: (v: number) => number;
  rowPitch: number;
  rowY: (year: number) => number;
  x0: number;
  years: number[];
}

/**
 * One tone at one opacity: the year's rule shows through every veil, and the
 * outline is the veil's own edge, one step lighter, so the grid reads as a
 * calm field and only the hero's ink outline stands out.
 */
const VEIL = 0.18;
/** Height a figure needs above a circle: its cap height plus air. */
const LABEL_ROOM = 11;

const cellId = (d: { category: string; year: number }) =>
  `${d.category}-${d.year}`;

/** Gap between a circle's top and its figure's baseline. */
const lift = (hero: boolean) => (hero ? 7 : 5);

/** Radius a cell draws at: betas are dotted rings of at least 6px. */
const drawnR = (layout: AlmanacLayout, d: AlmanacCell) =>
  d.beta === true
    ? Math.min(Math.max(layout.radius(d.value), 6), layout.maxR)
    : layout.radius(d.value);

/** Whether a cell's figure fits between its circle and the one above it. */
const fitsAbove = (
  layout: AlmanacLayout,
  d: AlmanacCell,
  above: AlmanacCell | undefined,
  hero: boolean
) =>
  layout.rowPitch -
    drawnR(layout, d) -
    (above === undefined ? 0 : drawnR(layout, above)) -
    lift(hero) >=
  LABEL_ROOM;

const almanacLayout = (
  width: number,
  height: number,
  data: AlmanacCell[],
  noteH: number
): AlmanacLayout => {
  const categories = [...new Set(data.map((d) => d.category))];
  const years = [...new Set(data.map((d) => d.year))].toSorted((a, b) => a - b);
  const left = width < 600 ? 40 : 56;
  const right = 8;
  const colPitch = clamp((width - left - right) / categories.length, 20, 84);
  const gridW = colPitch * categories.length;
  const x0 = left + Math.max(0, (width - left - right - gridW) / 2);
  const top = 72;
  const rowPitch = Math.max(20, (height - top - 8 - noteH) / years.length);
  // The largest bubble fits its cell with a clear gap to every neighbour,
  // counting the hero's 2px outline, so no two bubbles ever touch.
  const cell = Math.min(colPitch, rowPitch);
  const gap = Math.max(4, Math.round(cell * 0.12));
  const maxR = (cell - gap) / 2 - 1;
  const radius = scaleSqrt()
    .domain([0, Math.max(1, ...data.map((d) => d.value))])
    .range([0, maxR]);
  const core = scaleSqrt()
    .domain([0, Math.max(1, ...data.map((d) => d.escalations))])
    .range([0, maxR * 0.16]);
  return {
    categories,
    colPitch,
    colX: (category) => x0 + (categories.indexOf(category) + 0.5) * colPitch,
    core: (v) => (v > 0 ? Math.max(2, core(v)) : 0),
    gridW,
    maxR,
    radius: (v) => Math.max(3, radius(v)),
    rowPitch,
    rowY: (year) => top + (years.indexOf(year) + 0.5) * rowPitch,
    x0,
    years,
  };
};

/** Year rows on solid gridlines, and the slanted column heads. */
const Ledger = (props: { layout: AlmanacLayout }) => {
  const { categories, colPitch, colX, gridW, rowPitch, rowY, x0, years } =
    props.layout;
  const yearLabels = yearTickLabels(
    years.map((y) => new Date(Date.UTC(y, 0, 1)))
  );
  return (
    <g>
      {years.map((year, k) => (
        <g key={`row-${year}`}>
          <line
            className="grid-line"
            x1={x0}
            x2={x0 + gridW}
            y1={crisp(rowY(year))}
            y2={crisp(rowY(year))}
          />
          <text
            className="t-label fill-muted"
            dy="0.34em"
            textAnchor="end"
            x={x0 - 12}
            y={rowY(year)}
          >
            {yearLabels[k]}
          </text>
        </g>
      ))}
      {categories.map((category, k) => (
        <text
          className="fade t-label fill-muted"
          key={`col-${category}`}
          style={stagger(k, "mark")}
          transform={`translate(${colX(category) - colPitch * 0.2},${rowY(years[0]) - rowPitch * 0.5 - 14}) rotate(${colPitch < 50 ? -60 : -24})`}
        >
          {category}
        </text>
      ))}
    </g>
  );
};

interface BlobProps {
  cell: AlmanacCell;
  dim: boolean;
  format: (v: number) => string;
  /** The largest cell: the one mark in the hero colour. */
  hero: boolean;
  i: number;
  labelled: boolean;
  /** The figure fits above the circle, clear of the one in the row above. */
  labelAbove: boolean;
  layout: AlmanacLayout;
  onEnter: (x: number, y: number) => void;
  /** Id of the halftone screen that fills the hero. */
  screen: string;
}

const Blob = ({
  cell,
  dim,
  format,
  hero,
  i,
  labelled,
  labelAbove,
  layout,
  onEnter,
  screen,
}: BlobProps) => {
  const cx = layout.colX(cell.category);
  const cy = layout.rowY(cell.year);
  const r = layout.radius(cell.value);
  const coreR = layout.core(cell.escalations);
  const beta = cell.beta === true;
  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(cx, cy - r - 4);
      }}
    >
      <g className="pop" style={stagger(i, "dense")}>
        {beta ? (
          // Dotted at pitch 3 means beta: not yet generally available.
          <DotRing
            cx={cx}
            cy={cy}
            r={Math.min(Math.max(r, 6), layout.maxR)}
            step={TEXTURE_PITCH.dense}
            tone="fill-l4"
          />
        ) : (
          <circle
            className={hero ? "stroke-hero" : "fill-l4 stroke-l5"}
            cx={cx}
            cy={cy}
            fill={hero ? paint(screen) : undefined}
            // One tone at one opacity (VEIL): the year rule shows through.
            fillOpacity={hero ? 1 : VEIL}
            r={r}
            strokeWidth={hero ? 2 : 1}
          />
        )}
        {coreR > 0 ? (
          <circle
            className={hero ? "fill-hero" : "fill-l3"}
            cx={cx}
            cy={cy}
            r={coreR}
          />
        ) : null}
      </g>
      {labelled ? (
        <text
          className={`fade t-halo ${hero ? "t-value" : "t-axis"}`}
          textAnchor="middle"
          x={cx}
          // Above the circle (clear of the hero's 2px outline) when the row
          // above leaves room, else inside, over the core.
          y={labelAbove ? cy - r - lift(hero) : cy - coreR - 3}
        >
          {format(cell.value)}
        </text>
      ) : null}
    </g>
  );
};

/**
 * L9 Tickets by year. Category × year with an amount and a status, over a
 * long span: veiled circles (area = amount) that build up where years overlap, a
 * solid core for escalations and rings dotted at pitch 3 for betas. The largest cell is
 * the hero, filled with a fine halftone screen.
 */
export const BubbleAlmanac = (props: BubbleAlmanacProps) => {
  const data = props.data ?? bubbleAlmanacDemo;
  const height = props.height ?? 470;
  const format = props.format ?? fmtInt;
  const noun = props.noun ?? "tickets";
  const labelled = new Set(props.labelled ?? bubbleAlmanacLabelled);
  const [tip, setTip] = useState<{ id: string; x: number; y: number } | null>(
    null
  );
  const screen = useTextureIds("almanac")("screen");
  const byId = new Map(data.map((d) => [cellId(d), d]));
  const tipCell = tip === null ? undefined : byId.get(tip.id);

  return (
    <Plot
      overlay={
        tip === null || tipCell === undefined ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tipCell.category}</b> · {tipCell.year} · {format(tipCell.value)}{" "}
            {noun} · {format(tipCell.escalations)} escalations
            {tipCell.beta === true ? " · beta" : ""}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 18);
        const layout = almanacLayout(width, height, data, noteH);
        // Bigger blobs first so small ones stay visible on top.
        const order = data.toSorted((a, b) => b.value - a.value);
        const heroId = order.length > 0 ? cellId(order[0]) : "";
        return (
          <svg
            aria-label={`${noun} by area and year, ${layout.years[0]} to ${layout.years.at(-1) ?? ""}`}
            height={height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>Circles of {noun} per area per year</title>
            <defs>
              <DotScreen
                ground="fill-paper"
                id={screen}
                r={0.75}
                tone="fill-hero"
              />
            </defs>
            <Ledger layout={layout} />
            {order.map((d, i) => (
              <Blob
                cell={d}
                dim={tip !== null && tip.id !== cellId(d)}
                format={format}
                hero={cellId(d) === heroId}
                i={i}
                key={cellId(d)}
                labelled={labelled.has(cellId(d)) || cellId(d) === heroId}
                labelAbove={fitsAbove(
                  layout,
                  d,
                  byId.get(cellId({ ...d, year: d.year - 1 })),
                  cellId(d) === heroId
                )}
                layout={layout}
                screen={screen}
                onEnter={(x, y) => {
                  setTip({ id: cellId(d), x, y });
                }}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
