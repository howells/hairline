import { format as d3Format } from "d3-format";
import { scaleSqrt } from "d3-scale";

import { yearTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { RING_STEP } from "../marks";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DotRing, DotScreen } from "../texture";
import { HALFTONE_R, paint, useTextureIds } from "../texture-ids";
import { noteSpace, sansWidth, stagger } from "../util";
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

const twoDecimals = d3Format(".2f");

const cellId = (d: { category: string; year: number }) =>
  `${d.category}-${d.year}`;

/** Slant of the column names, in degrees: steeper when columns are tight. */
const headTilt = (colPitch: number) => (colPitch < 50 ? -60 : -24);

/** Gap between a circle's top and its figure's baseline. */
const lift = (hero: boolean) => (hero ? 7 : 5);

/** Air between a flagged circle and the dotted ring around it. */
const RING_GAP = 3;

/** Radius a cell draws at, counting the dotted ring of a flagged one. */
const drawnR = (layout: AlmanacLayout, d: AlmanacCell) =>
  layout.radius(d.value) + (d.flag === true ? RING_GAP : 0);

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
  // Room left of the grid for the year names; right of it for the last
  // slanted column name, which runs past the grid. The pitch is the widest
  // that fits both, and the whole composition is centred.
  const yearW = Math.max(
    0,
    ...yearTickLabels(years.map((y) => new Date(Date.UTC(y, 0, 1)))).map((l) =>
      sansWidth(l, 11)
    )
  );
  const left = 12 + yearW;
  // Sized a little under the real 11: sansWidth rounds each glyph up.
  const nameW = categories.map((c) => sansWidth(c, 10.4));
  const rightFor = (pitch: number) => {
    const tilt = (headTilt(pitch) * Math.PI) / 180;
    return Math.max(
      pitch * categories.length,
      ...nameW.map(
        (w, k) =>
          (k + 0.3) * pitch + w * Math.cos(tilt) + 3 * Math.sin(-tilt) + 1
      )
    );
  };
  let colPitch = 84;
  while (colPitch > 20 && left + rightFor(colPitch) > width) {
    colPitch -= 0.25;
  }
  const gridW = colPitch * categories.length;
  const x0 = left + Math.max(0, (width - left - rightFor(colPitch)) / 2);
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
    .domain([0, Math.max(1, ...data.map((d) => d.core))])
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
          <HRule kind="grid" x0={x0} x1={x0 + gridW} y={rowY(year)} />
          <Label
            anchor="end"
            middle
            muted
            voice="label"
            x={x0 - 12}
            y={rowY(year)}
          >
            {yearLabels[k]}
          </Label>
        </g>
      ))}
      {categories.map((category, k) => (
        <Label
          key={`col-${category}`}
          muted
          order={k}
          tier="mark"
          transform={`translate(${colX(category) - colPitch * 0.2},${rowY(years[0]) - rowPitch * 0.5 - 14}) rotate(${headTilt(colPitch)})`}
          voice="label"
        >
          {category}
        </Label>
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
  // On the year rule, which sits on the half pixel.
  const cy = crisp(layout.rowY(cell.year));
  const r = layout.radius(cell.value);
  const coreR = layout.core(cell.core);
  const flag = cell.flag === true;
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(cx, cy - drawnR(layout, cell) - 4);
      }}
    >
      <g className="pop" style={stagger(i, "dense")}>
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
        {flag ? (
          // Dotted at pitch 3 means the crop fell on the year before.
          <DotRing
            cx={cx}
            cy={cy}
            r={r + RING_GAP}
            step={RING_STEP.mark}
            tone="fill-l4"
          />
        ) : null}
        {coreR > 0 ? (
          <circle
            className={hero ? "fill-hero" : "fill-l3"}
            cx={cx}
            cy={cy}
            r={coreR}
          />
        ) : null}
      </g>
      {labelled && labelAbove ? (
        <Label
          anchor="middle"
          className="fade"
          halo
          voice={hero ? "value" : "axis"}
          x={cx}
          // Above the circle, clear of the hero's 2px outline; with no room
          // above, no figure is drawn (it hid in the halftone).
          y={cy - drawnR(layout, cell) - lift(hero)}
        >
          {format(cell.value)}
        </Label>
      ) : null}
    </DimGroup>
  );
};

/**
 * L9 Coffee growers. Category × year with an amount and a status: veiled
 * circles (area = amount) that build up where years overlap, a solid core
 * sized by the yield and a ring dotted at pitch 3 round the
 * flagged. The largest cell is the hero, filled with a fine halftone screen.
 */
export const BubbleAlmanac = (props: BubbleAlmanacProps) => {
  const data = props.data ?? bubbleAlmanacDemo;
  const height = props.height ?? 470;
  const format = props.format ?? twoDecimals;
  const noun = props.noun ?? "Mt of green coffee";
  const labelled = new Set(props.labelled ?? bubbleAlmanacLabelled);
  const hover = useHover<string>();
  const screen = useTextureIds("almanac")("screen");
  const byId = new Map(data.map((d) => [cellId(d), d]));
  const tipCell = hover.key === null ? undefined : byId.get(hover.key);

  return (
    <Plot
      overlay={
        hover.at === null || tipCell === undefined ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                String(tipCell.year),
                `${format(tipCell.value)} ${noun}`,
                `yield ${format(tipCell.core)} t/ha`,
                ...(tipCell.flag === true ? ["down on the year before"] : []),
              ]}
              lead={tipCell.category}
            />
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
          <ChartSvg
            height={height}
            label={`${noun} by country and year, ${layout.years[0]} to ${layout.years.at(-1) ?? ""}`}
            leave={hover.clear}
            title={`Circles of ${noun} by country and year`}
            width={width}
          >
            <defs>
              <DotScreen id={screen} r={HALFTONE_R[1]} tone="fill-l3" />
            </defs>
            <Ledger layout={layout} />
            {order.map((d, i) => (
              <Blob
                cell={d}
                dim={hover.dim(cellId(d))}
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
                onEnter={hover.showAt(cellId(d))}
              />
            ))}
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
