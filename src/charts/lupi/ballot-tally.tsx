import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { ballotTallyDemo } from "./ballot-tally.data";
import type { TallyDatum } from "./ballot-tally.data";
import { argMax } from "./util-b";

interface BallotTallyProps {
  data?: TallyDatum[];
  /** Ticks per row (the whole sample). */
  total?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the row drawn in the hero colour. Defaults to the largest. */
  highlight?: number;
}

/** One row's geometry, all in whole pixels. */
interface RulerLayout {
  /** Baseline: the ticks stand on this pixel row. */
  base: number;
  /** Whole-pixel step between ticks. */
  pitch: number;
  /** Height of a tick for someone who went. */
  tall: number;
  /** Left edge of the first tick. */
  x0: number;
}

interface RowProps {
  format: (v: number) => string;
  hero: boolean;
  index: number;
  layout: RulerLayout;
  /** Hover band, as tall as the row. */
  band: { h: number; w: number; x: number; y: number };
  row: TallyDatum;
  total: number;
}

/** Ruler tick heights in px: every tick, every fifth, every tenth. */
const RULER = { five: 6, one: 4, ten: 9 } as const;

/** Height of the k-th short tick: a ruler, longer every 5 and every 10. */
const rulerTick = (k: number) => {
  if ((k + 1) % 10 === 0) {
    return RULER.ten;
  }
  return (k + 1) % 5 === 0 ? RULER.five : RULER.one;
};

/** One answer: a 100-tick ruler with the share who went standing tall. */
const RulerRow = ({
  band,
  format,
  hero,
  index,
  layout,
  row,
  total,
}: RowProps) => {
  const { base, pitch, tall, x0 } = layout;
  const n = Math.round(row.value);
  const tone = hero ? "fill-hero" : "fill-l2";
  const end = x0 + pitch * (n - 1) + 1;
  return (
    <>
      <rect
        fill="transparent"
        height={band.h}
        width={band.w}
        x={band.x}
        y={band.y}
      />
      <text
        className={`fade t-label ${hero ? "" : "fill-muted"}`}
        style={stagger(index, "series")}
        x={x0}
        y={base - tall - 12}
      >
        {row.label}
      </text>
      <g className="fade fill-l5" style={stagger(index, "series")}>
        {Array.from({ length: total - n }, (_, j) => {
          const k = n + j;
          const h = rulerTick(k);
          return (
            <rect
              height={h}
              key={`rule-${row.label}-${k}`}
              width={1}
              x={x0 + pitch * k}
              y={base - h}
            />
          );
        })}
      </g>
      <g className={tone}>
        {Array.from({ length: n }, (_, k) => {
          // Tall ticks keep the ruler's cadence: the tens stand tallest.
          const h = tall - RULER.ten + rulerTick(k);
          return (
            <rect
              className="grow-y"
              height={h}
              key={`tall-${row.label}-${k}`}
              style={stagger(index * 12 + k, "dense")}
              width={1}
              x={x0 + pitch * k}
              y={base - h}
            />
          );
        })}
      </g>
      <text
        className="fade t-value"
        style={stagger(index + 3, "series")}
        x={end + 6}
        y={base - tall + 9}
      >
        {format(row.value)}
      </text>
    </>
  );
};

/**
 * L15 Days out. Multi-select answers as rulers of a hundred: every person
 * is one 1px tick at one whole-pixel pitch, faint and short (a ruler,
 * longer every ten), and those who went stand tall, so "44" reads as a
 * share of the whole. Rows are independent 0–100.
 */
export const BallotTally = (props: BallotTallyProps) => {
  const data = props.data ?? ballotTallyDemo;
  const total = props.total ?? 100;
  const format = props.format ?? String;
  const height = props.height ?? 460;
  const [hover, setHover] = useState<number | null>(null);
  const hero = props.highlight ?? argMax(data.map((d) => d.value));

  return (
    <Plot>
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 24);
        // Whole-pixel pitch, the widest that fits the ruler and the value
        // after its longest run; that block is centred.
        const valueW = data.map((d) => sansWidth(format(d.value), 11));
        const blockAt = (p: number) =>
          Math.max(
            p * (total - 1) + 1,
            ...data.map(
              (d, i) => p * (Math.round(d.value) - 1) + 7 + (valueW[i] ?? 0)
            )
          );
        let pitch = Math.max(2, Math.floor((width - 1) / (total - 1)));
        while (pitch > 2 && blockAt(pitch) > width) {
          pitch -= 1;
        }
        const x0 = Math.round((width - blockAt(pitch)) / 2);
        const rowH = (height - noteH - 8) / Math.max(1, data.length);
        const tall = Math.round(Math.min(44, rowH * 0.42));
        const layoutAt = (i: number): RulerLayout => ({
          base: Math.round(rowH * (i + 1) - rowH * 0.22),
          pitch,
          tall,
          x0,
        });
        const tip = hover === null ? undefined : data[hover];
        return (
          <div className="relative">
            <svg
              aria-label={data
                .map((d) => `${d.label}: ${format(d.value)} of ${total}`)
                .join(", ")}
              height={height}
              onPointerLeave={() => {
                setHover(null);
              }}
              width={width}
            >
              <title>Days out</title>
              {data.map((d, i) => (
                <g
                  className={dimClass(hover !== null && hover !== i)}
                  key={d.label}
                  onPointerEnter={() => {
                    setHover(i);
                  }}
                >
                  <RulerRow
                    band={{ h: rowH, w: width, x: 0, y: rowH * i }}
                    format={format}
                    hero={hero === i}
                    index={i}
                    layout={layoutAt(i)}
                    row={d}
                    total={total}
                  />
                </g>
              ))}
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={height - 6}
              />
            </svg>
            {tip !== undefined && hover !== null && (
              <Tooltip
                x={x0 + pitch * Math.round(tip.value) * 0.5}
                // Over the row's label, so the label stays readable.
                y={layoutAt(hover).base - tall - 24}
              >
                <b>{tip.label}</b> · {format(tip.value)} of {total} went
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
