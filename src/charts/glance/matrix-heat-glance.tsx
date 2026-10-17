import { scaleQuantize } from "d3-scale";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { KEY } from "../marks";
import { PlotNote } from "../plot-note";
import { DotScreen, KeySwatch, PlateLabel } from "../texture";
import { HALFTONE_R, paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { matrixHeatGlanceDemo } from "./matrix-heat-glance.data";
import type { MatrixGlanceData } from "./matrix-heat-glance.data";
import { labelRoom, textWidth } from "./util-a";

interface MatrixHeatGlanceProps {
  data?: MatrixGlanceData;
  /** Overrides the natural height (which follows the cell size). */
  height?: number;
  /** Value domain for the five screens; defaults to 0 – 100. */
  domain?: [number, number];
  format?: (v: number) => string;
  /** Suffix for the tooltip value, e.g. "% of households". */
  unit?: string;
  note?: string;
  /** [row, column] of the hero cell; defaults to the highest value. */
  highlight?: [number, number];
}

interface Hit {
  c: number;
  r: number;
  x: number;
  y: number;
}

/** Tile corner (the radius scale's small step). */
const TILE_RADIUS = 2;
/** Dot radius of each bin's screen, lowest bin first: the shared halftone ladder at pitch 4. */
const DOT_RADII = HALFTONE_R;
/** Key swatch size, the gap after it, and the space between key entries. */
const SWATCH = KEY.swatch;
const SWATCH_GAP = KEY.gap;
const KEY_SPACE = KEY.entryGap;

/**
 * A tile side that holds whole screen tiles with equal margins: 4k + 5, so
 * the dots sit symmetrically inside the 1px outline.
 */
const snapTile = (v: number) => Math.max(9, Math.floor((v - 5) / 4) * 4 + 5);

const round = (v: number) => `${Math.round(v)}`;

interface CellProps {
  dimmed: boolean;
  /** Pattern fill of the tile's screen. */
  fill: string;
  h: number;
  hero: boolean;
  onEnter: () => void;
  stagger: number;
  text: string;
  w: number;
  x: number;
  y: number;
}

/**
 * One tile: its screen on paper inside a 1px rule (the hero: solid ink), the
 * number centred on a plate. The tile is
 * translated to its own whole-pixel corner so every screen starts the same
 * way against its outline.
 */
const Cell = (p: CellProps) => (
  <g
    className={`pop ${dimClass(p.dimmed)}`}
    style={stagger(p.stagger, "mark")}
    transform={`translate(${p.x} ${p.y})`}
    onPointerEnter={() => {
      p.onEnter();
    }}
  >
    <rect
      x={0.5}
      y={0.5}
      width={p.w - 1}
      height={p.h - 1}
      rx={TILE_RADIUS}
      className={`shape-crisp ${p.hero ? "fill-hero stroke-hero" : "stroke-l5"}`}
      fill={p.hero ? undefined : p.fill}
      strokeWidth={1}
    />
    <PlateLabel hero={p.hero} text={p.text} x={p.w / 2} y={p.h / 2} />
  </g>
);

interface KeyProps {
  labels: string[];
  /** Pattern fill of each bin's screen. */
  screens: string[];
  /** Right edge the key is set flush against. */
  right: number;
  y: number;
}

/** The five screens as key swatches, each with its range, flush right. */
const Key = (p: KeyProps) => {
  const widths = p.labels.map((l) => Math.ceil(textWidth(l, "t-note")));
  const entryW = (k: number) => SWATCH + SWATCH_GAP + widths[k];
  const total =
    widths.reduce((a, _, k) => a + entryW(k), 0) +
    KEY_SPACE * (widths.length - 1);
  const left = Math.max(0, Math.round(p.right - total));
  const entries = p.labels.map((l, k) => ({
    at:
      left +
      widths.slice(0, k).reduce((a, _, j) => a + entryW(j) + KEY_SPACE, 0),
    l,
    screen: p.screens[k],
  }));
  return (
    <g className="fade">
      {entries.map((e) => (
        <g key={e.l}>
          <KeySwatch fill={e.screen} x={e.at} y={p.y} />
          <text
            className="t-note"
            x={e.at + SWATCH + SWATCH_GAP}
            y={p.y + SWATCH / 2}
            dy="0.35em"
          >
            {e.l}
          </text>
        </g>
      ))}
    </g>
  );
};

interface TileRowsProps {
  cell: number;
  data: MatrixGlanceData;
  /** Pattern fill for the tile at row i, column j. */
  fillOf: (i: number, j: number) => string;
  format: (v: number) => string;
  gap: number;
  hero: [number, number];
  hover: Hit | null;
  /** Space between a row's name and its first tile. */
  labelGap: number;
  onHover: (hit: Hit) => void;
  pitch: number;
  top: number;
  x0: number;
}

/** Each row: its name, flush right, then one tile per column. */
const TileRows = (p: TileRowsProps) => (
  <g>
    {p.data.rows.map((row, i) => {
      const cy = p.top + i * (p.pitch + p.gap);
      return (
        <g key={row}>
          <text
            className="t-label fill-muted"
            x={p.x0 - p.labelGap}
            y={cy + p.pitch / 2}
            dy="0.36em"
            textAnchor="end"
          >
            {row}
          </text>
          {p.data.columns.map((col, j) => {
            const cx = p.x0 + j * (p.cell + p.gap);
            return (
              <Cell
                key={col}
                dimmed={
                  p.hover !== null && (p.hover.r !== i || p.hover.c !== j)
                }
                fill={p.fillOf(i, j)}
                h={p.pitch}
                hero={i === p.hero[0] && j === p.hero[1]}
                onEnter={() => {
                  p.onHover({ c: j, r: i, x: cx + p.cell / 2, y: cy - 4 });
                }}
                stagger={i + j}
                text={p.format(p.data.values[i][j])}
                w={p.cell}
                x={cx}
                y={cy}
              />
            );
          })}
        </g>
      );
    })}
  </g>
);

/** The five bins over the value domain. */
const binScale = (domain: [number, number]) =>
  scaleQuantize().domain(domain).range([0, 1, 2, 3, 4]);

/** Each bin's range for the key, the unit once on the last. */
const binLabels = (domain: [number, number], format: (v: number) => string) =>
  DOT_RADII.map((_, k) => {
    const [lo, hi] = binScale(domain).invertExtent(k);
    return `${format(lo)}–${format(hi)}${k === DOT_RADII.length - 1 ? "%" : ""}`;
  });

/** [row, column] of the highest value. */
const peakOf = (values: number[][]): [number, number] => {
  let best: [number, number] = [0, 0];
  for (const [i, row] of values.entries()) {
    for (const [j, v] of row.entries()) {
      if (v > values[best[0]][best[1]]) {
        best = [i, j];
      }
    }
  }
  return best;
};

/**
 * G20 Kit by income. One tile per row and column, each a halftone screen
 * on paper whose dot grows a step per bin (five bins, pitch 4), the number
 * centred on a paper plate. The one hero tile (the highest value) is solid
 * ink, its number in paper.
 */
export const MatrixHeatGlance = (props: MatrixHeatGlanceProps) => {
  const data = props.data ?? matrixHeatGlanceDemo;
  const format = props.format ?? round;
  const unit = props.unit ?? "% of households";
  const nR = data.rows.length;
  const nC = data.columns.length;
  const domain = props.domain ?? [0, 100];
  const shade = binScale(domain);
  const [hr, hc] = props.highlight ?? peakOf(data.values);
  const [hover, setHover] = useState<Hit | null>(null);
  const tex = useTextureIds("heat");
  const screens = DOT_RADII.map((_, k) => paint(tex(`s${k}`)));
  const keyLabels = binLabels(domain, format);
  const label = `Matrix of ${nR} by ${nC}: ${data.rows.map((r, i) => `${r}: ${data.values[i].map((v, j) => `${data.columns[j]} ${format(v)}`).join(", ")}`).join("; ")}`;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>
              {data.rows[hover.r]} · {data.columns[hover.c]}
            </b>{" "}
            · {format(data.values[hover.r][hover.c])}
            {unit}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        const gap = narrow ? 5 : 10;
        const labelGap = narrow ? 8 : 16;
        // The row names and the grid are one block, centred in the width.
        const names = labelRoom(data.rows);
        const cell = snapTile(
          Math.min(80, (width - names - labelGap - gap * (nC - 1)) / nC)
        );
        const gridW = cell * nC + gap * (nC - 1);
        const x0 = Math.round(
          (width - names - labelGap - gridW) / 2 + names + labelGap
        );
        // Names wider than a tile alternate between two heights.
        const crowded =
          Math.max(...data.columns.map((c) => textWidth(c, "t-label"))) > cell;
        const top = crowded ? 40 : 26;
        const pitch = snapTile(Math.min(cell * 0.86, 76));
        const keyY = top + nR * pitch + gap * (nR - 1) + 18;
        const height =
          props.height ??
          keyY + SWATCH + 6 + noteSpace(props.note, width - 16, 30);

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{label}</title>
            <defs>
              {DOT_RADII.map((r, k) => (
                <DotScreen key={r} id={tex(`s${k}`)} r={r} tone="fill-l3" />
              ))}
            </defs>
            {data.columns.map((c, j) => (
              <text
                key={c}
                className="t-label fill-muted"
                x={x0 + j * (cell + gap) + cell / 2}
                y={top - 12 - (crowded && j % 2 === 0 ? 14 : 0)}
                textAnchor="middle"
              >
                {c}
              </text>
            ))}
            <TileRows
              cell={cell}
              data={data}
              fillOf={(i, j) =>
                i === hr && j === hc ? "" : screens[shade(data.values[i][j])]
              }
              format={format}
              gap={gap}
              hero={[hr, hc]}
              hover={hover}
              labelGap={labelGap}
              onHover={setHover}
              pitch={pitch}
              top={top}
              x0={x0}
            />
            <Key
              labels={keyLabels}
              right={x0 + gridW}
              screens={screens}
              y={keyY}
            />
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
