import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { TEXTURE_PITCH, paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { rankStripDemo } from "./rank-strip.data";
import type { RankSeries, RankStripData } from "./rank-strip.data";
import { ladderStep } from "./util-b";

interface RankStripProps {
  data?: RankStripData;
  /** Overrides the natural height (which follows the cell size). */
  height?: number;
  /** Label of the hero entity; defaults to the biggest climber. */
  highlight?: string;
  note?: string;
}

interface Hit {
  c: number;
  r: number;
  x: number;
  y: number;
}

interface Geometry {
  cell: number;
  /** Space between columns. */
  gap: number;
  gridW: number;
  /** The hero outline's offset from its tiles: half the row gap. */
  ring: number;
  x0: number;
}

/** Tile corner (the radius scale's large step) and the rank's inset. */
const TILE_RADIUS = 4;
const INSET = 8;

/**
 * The rank screens, top rank first: one rising hatch that opens from the
 * dense pitch to the wide one and lightens a step at each end. More ink per
 * tile = a higher rank.
 */
const SCREENS = [
  { name: "r1", pitch: TEXTURE_PITCH.dense, tone: "fill-l1" },
  { name: "r2", pitch: TEXTURE_PITCH.dense, tone: "fill-l3" },
  { name: "r3", pitch: TEXTURE_PITCH.hatch, tone: "fill-l3" },
  { name: "r4", pitch: TEXTURE_PITCH.cross, tone: "fill-l3" },
  { name: "r5", pitch: TEXTURE_PITCH.cross, tone: "fill-l5" },
] as const;

/** The pattern defs for every rank screen. */
const ScreenDefs = (p: { tex: (name: string) => string }) => (
  <defs>
    {SCREENS.map((sc) => (
      <Hatch
        key={sc.name}
        ground="fill-paper"
        id={p.tex(sc.name)}
        pitch={sc.pitch}
        tone={sc.tone}
      />
    ))}
  </defs>
);

interface RowProps {
  dimmed: boolean;
  geo: Geometry;
  hero: boolean;
  i: number;
  onEnter: (hit: Hit) => void;
  periods: string[];
  series: RankSeries;
  /** Pattern id of the screen for a rank. */
  screen: (rank: number) => string;
  y: number;
}

const climb = (s: RankSeries) => (s.ranks[0] ?? 0) - (s.ranks.at(-1) ?? 0);

/** The net move as a signed numeral with a true minus: +5, −1, ±0. */
const deltaText = (delta: number) => {
  if (delta > 0) {
    return `+${delta}`;
  }
  return delta < 0 ? `−${-delta}` : "±0";
};

/** One entity: name, a cell per period carrying its rank, and the net move. */
const Row = (p: RowProps) => {
  const { cell, gap, gridW, ring, x0 } = p.geo;
  const delta = climb(p.series);
  return (
    <g className={dimClass(p.dimmed)}>
      {p.hero ? (
        <rect
          className="fade stroke-hero fill-none"
          style={{ "--i": p.periods.length + 2 }}
          x={x0 - ring}
          y={p.y - ring}
          width={gridW + ring * 2}
          height={cell + ring * 2}
          rx={TILE_RADIUS + ring}
          strokeWidth={2}
        />
      ) : null}
      <text
        className={`t-name ${p.hero ? "fill-ink" : "fill-muted"}`}
        x={x0 - (p.hero ? 18 : 14)}
        y={p.y + cell / 2}
        dy="0.36em"
        textAnchor="end"
      >
        {p.series.label}
      </text>
      {p.series.ranks.map((r, j) => {
        const cx = x0 + j * (cell + gap);
        const period = p.periods[j];
        return (
          <g
            key={period}
            className="pop"
            style={stagger(j * 2 + p.i * 0.5, "mark")}
            onPointerEnter={() => {
              p.onEnter({ c: j, r: p.i, x: cx + cell / 2, y: p.y - 4 });
            }}
          >
            <rect
              x={crisp(cx)}
              y={crisp(p.y)}
              width={Math.round(cell) - 1}
              height={Math.round(cell) - 1}
              rx={TILE_RADIUS}
              className="stroke-l5 shape-crisp"
              fill={paint(p.screen(r))}
              strokeWidth={1}
            />
            <text
              className="t-value t-halo"
              x={cx + INSET}
              y={p.y + cell - INSET}
            >
              {r}
            </text>
          </g>
        );
      })}
      <text
        className={`fade t-value ${p.hero ? "" : "fill-muted"}`}
        style={{ "--i": p.periods.length + 3 }}
        x={x0 + gridW + (p.hero ? 22 : 16)}
        y={p.y + cell / 2}
        dy="0.36em"
      >
        {deltaText(delta)}
      </text>
    </g>
  );
};

/**
 * A two-line header in the broadsheet style: "Q3 2025" splits into its
 * quarter, under every column, and its year, printed once above the first
 * column of each year, both centred on the column. Labels without a year keep one line.
 */
const headerOf = (periods: string[]) =>
  periods.map((period, j) => {
    const [part, year] = period.split(" ");
    const prev = periods[j - 1]?.split(" ")[1];
    return { part, year: year === prev ? undefined : year };
  });

/**
 * G21 Rank by quarter. One row per entity, one tile per period, the tile
 * carrying the rank small in its lower-left corner. Each tile is engraved:
 * the higher the rank, the denser and darker its hatch, so a
 * climb reads as a row darkening left to right. The hero entity's row has
 * a 2px concentric outline and the net move is printed at the end of every
 * row.
 */
export const RankStrip = (props: RankStripProps) => {
  const data = props.data ?? rankStripDemo;
  const nP = data.periods.length;
  const nS = data.series.length;
  const maxRank = Math.max(...data.series.flatMap((s) => s.ranks));
  // Rows in final-period order, so the strip reads as the latest table.
  const rows = data.series.toSorted(
    (a, b) => (a.ranks.at(-1) ?? 0) - (b.ranks.at(-1) ?? 0)
  );
  const heroLabel =
    props.highlight ??
    data.series.toSorted((a, b) => climb(b) - climb(a))[0]?.label;
  const [hover, setHover] = useState<Hit | null>(null);
  const tex = useTextureIds("rank");
  const screen = (rank: number) =>
    tex(SCREENS[ladderStep(rank - 1, maxRank, SCREENS.length - 1)].name);
  const header = headerOf(data.periods);
  const hasYears = header.some((h) => h.year !== undefined);
  const label = `Rank per period: ${rows.map((s) => `${s.label} ${s.ranks.join(", ")}`).join("; ")}`;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{rows[hover.r].label}</b> · {data.periods[hover.c]} · #
            {rows[hover.r].ranks[hover.c]} of {nS}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 480;
        // Room for the longest name, set flush right against the tiles.
        const labelW =
          Math.ceil(
            Math.max(...data.series.map((s) => sansWidth(s.label, 12)))
          ) + (narrow ? 16 : 24);
        const deltaW = narrow ? 34 : 56;
        const gap = narrow ? 5 : 10;
        // Rows sit further apart than columns, so the hero's outline has
        // its own clear channel above and below.
        const rowGap = narrow ? 12 : 16;
        const cell = Math.min(
          72,
          (width - labelW - deltaW - gap * (nP - 1)) / nP
        );
        const gridW = cell * nP + gap * (nP - 1);
        const geo: Geometry = {
          cell,
          gap,
          gridW,
          ring: rowGap / 2,
          x0: labelW + Math.max(0, (width - labelW - deltaW - gridW) / 2),
        };
        const top = hasYears ? 46 : 28;
        const height =
          props.height ??
          top +
            nS * cell +
            rowGap * (nS - 1) +
            10 +
            noteSpace(props.note, width - 16, 34);

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
            <ScreenDefs tex={tex} />
            {header.map((h, j) => (
              <g key={data.periods[j]}>
                {h.year === undefined ? null : (
                  <text
                    className="t-axis"
                    x={geo.x0 + j * (cell + gap) + cell / 2}
                    y={top - 30}
                    textAnchor="middle"
                  >
                    {h.year}
                  </text>
                )}
                <text
                  className="t-label fill-muted"
                  x={geo.x0 + j * (cell + gap) + cell / 2}
                  y={top - 12}
                  textAnchor="middle"
                >
                  {h.part}
                </text>
              </g>
            ))}
            {rows.map((s, i) => (
              <Row
                key={s.label}
                dimmed={hover !== null && hover.r !== i}
                geo={geo}
                hero={s.label === heroLabel}
                i={i}
                onEnter={setHover}
                periods={data.periods}
                screen={screen}
                series={s}
                y={top + i * (cell + rowGap)}
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
