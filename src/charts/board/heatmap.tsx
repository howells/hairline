import { scaleBand, scaleThreshold } from "d3-scale";
import type { ScaleBand } from "d3-scale";
import { useState } from "react";

import { Chart } from "../core";
import { CrossHatch, DotScreen } from "../texture";
import {
  HALFTONE_R,
  TEXTURE_PITCH,
  paint,
  useTextureIds,
} from "../texture-ids";
import { Key } from "./key";
import { CAPTION, TICK } from "./styles";

/**
 * The screens, low to high: the shared halftone ladder at pitch 4, one dot
 * size per bin. The last bin is the threshold and over.
 */
const BINS = HALFTONE_R.map((r, k) => ({ name: `bin-${k}`, r }));
/** Paper left between neighbouring cells, px. */
const GAP = 2;
/** Least paper between a cell's rule and its screen, px (clears the corners). */
const PAD = 2;
/** The day in two halves, stacked: midnight to noon, then noon to midnight. */
const HALF = 12;
const HALVES = [0, HALF];
/** Hour labels under each half. */
const HOUR_TICKS = [0, 6];
/** Room under each half for its hour labels, px. */
const TICK_ROOM = 22;
/** Paper between the two halves, px. */
const HALF_GAP = 10;
/** Width of the row labels, px. */
const LABEL_W = 60;

interface HeatmapProps {
  rows: string[];
  values: number[][];
  /** The rate from which a cell takes the densest screen. */
  threshold: number;
  domain: [number, number];
  label: string;
}

/** Where the single highest cell sits: the one red. */
const hottest = (values: number[][]) => {
  let best: [number, number] = [0, 0];
  for (const [r, row] of values.entries()) {
    for (const [c, v] of row.entries()) {
      if (v > values[best[0]][best[1]]) {
        best = [r, c];
      }
    }
  }
  return best;
};

const hour = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** Below the threshold, four even steps from the domain's floor; then the top bin. */
const binOf = (props: HeatmapProps) => {
  const [lo] = props.domain;
  const step = (props.threshold - lo) / (BINS.length - 1);
  return scaleThreshold()
    .domain(BINS.slice(1).map((_, k) => lo + step * (k + 1)))
    .range(BINS.map((_, k) => k));
};

/** One engraved tile: paper in a 1px rule, the screen in whole tiles inside. */
const ScreenCell = (props: {
  active: boolean;
  fill: string;
  h: number;
  w: number;
}) => {
  const pitch = TEXTURE_PITCH.screen;
  const cols = Math.floor((props.w - PAD * 2) / pitch);
  const rows = Math.floor((props.h - PAD * 2) / pitch);
  const ox = Math.floor((props.w - cols * pitch) / 2);
  const oy = Math.floor((props.h - rows * pitch) / 2);
  return (
    <>
      <rect
        className={`fill-paper shape-crisp ${props.active ? "stroke-ink" : "stroke-l5"}`}
        height={props.h - 1}
        rx={2}
        strokeWidth={1}
        width={props.w - 1}
        x={0.5}
        y={0.5}
      />
      <g transform={`translate(${ox} ${oy})`}>
        <rect fill={props.fill} height={rows * pitch} width={cols * pitch} />
      </g>
    </>
  );
};

/** The hottest cell: a red crosshatch on paper inside a red rule. */
const HeroCell = (props: {
  active: boolean;
  fill: string;
  h: number;
  w: number;
}) => (
  <rect
    className={`shape-crisp ${props.active ? "stroke-ink" : "stroke-alert"}`}
    fill={props.fill}
    height={props.h - 1}
    rx={2}
    strokeWidth={1}
    width={props.w - 1}
    x={0.5}
    y={0.5}
  />
);

/** One half of the day: twelve columns of cells under their hour labels. */
const HalfDay = (props: {
  chart: HeatmapProps;
  from: number;
  top: number;
  x: ScaleBand<number>;
  rowH: number;
  tex: (name: string) => string;
  worst: [number, number];
  active: [number, number] | null;
  onHover: (cell: [number, number]) => void;
}) => {
  const { chart, from, rowH, top, x } = props;
  const cols = Array.from({ length: HALF }, (_, k) => from + k);
  const w = Math.round(x.bandwidth()) - GAP;
  const h = rowH - GAP;
  const bin = binOf(chart);
  return (
    <g>
      {chart.rows.map((row, r) => (
        <text
          key={row}
          className={TICK}
          x={LABEL_W - 10}
          y={top + r * rowH + rowH / 2}
          dy="0.34em"
          textAnchor="end"
        >
          {row}
        </text>
      ))}
      {chart.values.map((rowValues, r) =>
        cols.map((c) => {
          const cx = Math.round(x(c - from) ?? 0);
          const cy = Math.round(top + r * rowH);
          const active = props.active?.[0] === r && props.active[1] === c;
          const hero = props.worst[0] === r && props.worst[1] === c;
          return (
            <g
              key={`${chart.rows[r]}-${hour(c)}`}
              className="fade"
              style={{ "--i": (c - from) * 0.25 + r * 0.5 }}
              transform={`translate(${cx} ${cy})`}
              onPointerEnter={() => {
                props.onHover([r, c]);
              }}
            >
              {hero ? (
                <HeroCell
                  active={active}
                  fill={paint(props.tex("hero"))}
                  h={h}
                  w={w}
                />
              ) : (
                <ScreenCell
                  active={active}
                  fill={paint(props.tex(BINS[bin(rowValues[c])].name))}
                  h={h}
                  w={w}
                />
              )}
            </g>
          );
        })
      )}
      {HOUR_TICKS.map((t) => (
        <text
          key={t}
          className={TICK}
          x={Math.round(x(t) ?? 0)}
          y={top + chart.rows.length * rowH + 8}
          dy="0.71em"
        >
          {hour(from + t)}
        </text>
      ))}
    </g>
  );
};

/** Height of one row of cells at this width: a little shorter than square. */
const rowHeight = (width: number) =>
  Math.round(Math.min(32, Math.max(18, (width - LABEL_W) / HALF) * 0.75));

/** The screens, one per bin, and the hero's red crosshatch, all on paper. */
const CellPatterns = (props: { tex: (name: string) => string }) => (
  <defs>
    {BINS.map((b) => (
      <DotScreen
        key={b.name}
        ground="fill-paper"
        id={props.tex(b.name)}
        r={b.r}
        tone="fill-l3"
      />
    ))}
    <CrossHatch ground="fill-paper" id={props.tex("hero")} tone="fill-alert" />
  </defs>
);

/** Row × hour grid in two half-days; the hottest cell is the one red. */
export const Heatmap = (props: HeatmapProps) => {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const tex = useTextureIds("hm");
  const worst = hottest(props.values);

  const readout =
    hover === null
      ? null
      : `${props.rows[hover[0]]} · ${hour(hover[1])} · ${props.values[hover[0]][hover[1]].toFixed(2)}%`;

  return (
    <Chart
      bottom={
        <div
          className={`${CAPTION} mt-3 flex min-h-3 items-center justify-center gap-2.5 leading-none tabular-nums`}
        >
          {readout === null ? (
            <>
              <span>{props.domain[0]}%</span>
              <Key
                scale
                items={[
                  ...BINS.map((b) => ({ fill: paint(tex(b.name)) })),
                  { fill: paint(tex("hero")) },
                ]}
              />
              <span>{props.domain[1]}%</span>
            </>
          ) : (
            <span className="text-text">{readout}</span>
          )}
        </div>
      }
    >
      {(width) => {
        const rowH = rowHeight(width);
        const blockH = props.rows.length * rowH + TICK_ROOM;
        const h = blockH * 2 + HALF_GAP;
        const x = scaleBand<number>()
          .domain(Array.from({ length: HALF }, (_, i) => i))
          .range([LABEL_W, width]);

        return (
          <svg
            width={width}
            height={h}
            aria-label={props.label}
            onPointerLeave={() => {
              setHover(null);
            }}
          >
            <title>{props.label}</title>
            <CellPatterns tex={tex} />
            {HALVES.map((from, k) => (
              <HalfDay
                key={from}
                chart={props}
                from={from}
                top={k * (blockH + HALF_GAP)}
                x={x}
                rowH={rowH}
                tex={tex}
                worst={worst}
                active={hover}
                onHover={setHover}
              />
            ))}
          </svg>
        );
      }}
    </Chart>
  );
};
