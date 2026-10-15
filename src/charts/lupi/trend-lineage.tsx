import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";

import { yearTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { trendLineageDemo } from "./trend-lineage.data";
import type { LineageDatum } from "./trend-lineage.data";
import { byStep } from "./util-b";

interface TrendLineageProps {
  data?: LineageDatum[];
  /** First and last year on the axis; defaults to the data's span. */
  years?: [number, number];
  height?: number;
  note?: string;
  /** Feature drawn in the hero colour. Defaults to the oldest still alive. */
  highlight?: string;
}

interface Segment {
  id: string;
  a: number;
  b: number;
  dormant: boolean;
}

/** How far below the last year the floor (alive today) sits, in years. */
const FLOOR_PAD = 0.65;

const yearOf = (v: number) => Math.floor(v);

const describe = (d: LineageDatum) => {
  const parts = [`shipped ${yearOf(d.shipped)}`];
  const reworked = d.reworked ?? [];
  const dormant = d.dormant ?? [];
  if (reworked.length > 0) {
    parts.push(`reworked ${reworked.map(yearOf).join(", ")}`);
  }
  if (dormant.length > 0) {
    parts.push(
      `dormant ${dormant.map(([a, b]) => `${yearOf(a)}–${yearOf(b)}`).join(", ")}`
    );
  }
  parts.push(
    d.retired === undefined ? "alive today" : `retired ${yearOf(d.retired)}`
  );
  return parts.join(" · ");
};

/** The life line, cut into solid and dotted (dormant) spans. */
const segmentsOf = (d: LineageDatum, end: number): Segment[] => {
  const dormant = d.dormant ?? [];
  const cuts = [d.shipped, ...dormant.flat(), end].toSorted((a, b) => a - b);
  const out: Segment[] = [];
  for (const [k, a] of cuts.entries()) {
    const b = cuts[k + 1];
    if (b !== undefined && b > a) {
      const mid = (a + b) / 2;
      out.push({
        a,
        b,
        dormant: dormant.some(([s, e]) => mid > s && mid < e),
        id: `${d.name}-${a}`,
      });
    }
  }
  return out;
};

interface GridProps {
  years: number[];
  y: ScaleLinear<number, number>;
  x0: number;
  x1: number;
  every: number;
}

const YearGrid = ({ years, y, x0, x1, every }: GridProps) => {
  const ticked = years.filter((yr) => (yr - (years[0] ?? 0)) % every === 0);
  const labels = new Map(
    yearTickLabels(ticked.map((yr) => new Date(Date.UTC(yr, 0, 1)))).map(
      (label, k) => [ticked[k], label]
    )
  );
  return (
    <g>
      {years.map((yr) => (
        <g key={`year-${yr}`}>
          <line
            className="grid-line"
            x1={x0 - 8}
            x2={x1}
            y1={crisp(y(yr))}
            y2={crisp(y(yr))}
          />
          {labels.has(yr) && (
            <text
              className="t-axis"
              x={x0 - 16}
              y={y(yr)}
              dy="0.34em"
              textAnchor="end"
            >
              {labels.get(yr)}
            </text>
          )}
        </g>
      ))}
    </g>
  );
};

interface ColumnProps {
  feature: LineageDatum;
  index: number;
  x: number;
  colW: number;
  top: number;
  floor: number;
  floorYear: number;
  r: number;
  y: ScaleLinear<number, number>;
  hero: boolean;
}

const FeatureColumn = ({
  feature,
  index,
  x,
  colW,
  top,
  floor,
  floorYear,
  r,
  y,
  hero,
}: ColumnProps) => {
  const events = [feature.shipped, ...(feature.reworked ?? [])].toSorted(
    (a, b) => a - b
  );
  const end =
    feature.retired === undefined
      ? floorYear
      : (events.at(-1) ?? feature.shipped);
  const ly = floor + 14;
  // The hero's 2px line sits on whole pixels, a 1px one on the half pixel;
  // its marks centre on the same x, and on the half-pixel year rules.
  const stemX = hero ? Math.round(x) : crisp(x);
  let labelTone = "fill-muted";
  if (hero) {
    labelTone = "";
  } else if (feature.retired !== undefined) {
    labelTone = "fill-faint";
  }
  return (
    <>
      <rect
        x={x - colW / 2}
        y={top}
        width={colW}
        height={floor - top + 40}
        fill="transparent"
      />
      {segmentsOf(feature, end).map((s) =>
        s.dormant ? (
          // Dormant years: an evenly dotted 1px stem at pitch 3.
          <g className="fade" key={s.id} style={stagger(index, "series")}>
            <DottedLine
              pitch={TEXTURE_PITCH.dense}
              tone={hero ? "fill-hero" : "fill-l3"}
              x0={x}
              x1={x}
              y0={y(s.a)}
              y1={y(s.b)}
            />
          </g>
        ) : (
          <line
            key={s.id}
            className={`grow-y from-top shape-crisp ${hero ? "stroke-hero" : "stroke-l5"}`}
            style={stagger(index, "series")}
            x1={stemX}
            x2={stemX}
            y1={y(s.a)}
            y2={y(s.b)}
            strokeWidth={hero ? 2 : 1}
          />
        )
      )}
      {feature.retired === undefined ? null : (
        <circle
          className="pop fill-l5"
          style={stagger(index * 3 + 4, "mark")}
          cx={stemX}
          cy={crisp(y(feature.retired))}
          r={2}
        />
      )}
      {events.slice(1).map((e) => (
        <circle
          key={`rework-${e}`}
          className={`pop fill-paper ${hero ? "stroke-hero" : "stroke-l3"}`}
          style={stagger(index * 3 + 2, "mark")}
          cx={stemX}
          cy={crisp(y(e))}
          r={r}
          strokeWidth={1}
        />
      ))}
      <circle
        className={`pop ${hero ? "fill-hero" : "fill-l3"}`}
        style={stagger(index * 3, "mark")}
        cx={stemX}
        cy={crisp(y(feature.shipped))}
        r={r}
      />
      <text
        className={`fade t-name ${labelTone}`}
        style={stagger(index)}
        x={x + 3}
        y={ly}
        textAnchor="end"
        transform={`rotate(${colW < 44 ? -64 : -38} ${x + 3} ${ly})`}
      >
        {feature.name}
      </text>
    </>
  );
};

/**
 * L11 Feature lives. One column per feature, time running down the page.
 * Filled dot = shipped, hollow = reworked, dotted = dormant years; the line
 * runs on to the floor if the feature is still alive today, and stops at a
 * small dot where it was retired. The oldest living feature is the hero.
 */
export const TrendLineage = (props: TrendLineageProps) => {
  const data = props.data ?? trendLineageDemo;
  const height = props.height ?? 460;
  const [hover, setHover] = useState<number | null>(null);
  const allYears = data.flatMap((d) => [
    d.shipped,
    ...(d.reworked ?? []),
    ...(d.retired === undefined ? [] : [d.retired]),
  ]);
  const hero =
    props.highlight ??
    data
      .filter((d) => d.retired === undefined)
      .toSorted((a, b) => a.shipped - b.shipped)
      .at(0)?.name;
  const [y0, y1] = props.years ?? [
    Math.floor(Math.min(...allYears)),
    Math.ceil(Math.max(...allYears)),
  ];

  const yearW = Math.max(
    0,
    ...yearTickLabels(
      Array.from(
        { length: y1 - y0 + 1 },
        (_, k) => new Date(Date.UTC(y0 + k, 0, 1))
      )
      // Tabular figures: 0.66em each, wider than sansWidth takes a "1" for.
    ).map((l) => l.length * 7.3)
  );

  return (
    <Plot>
      {(width) => {
        const m = {
          bottom:
            (width < 480 ? 84 : 76) + noteSpace(props.note, width - 16, 24),
          // The year names, then the columns run to the right edge.
          left: 16 + yearW,
          right: 0,
          top: 14,
        };
        const colsW = Math.min(width - m.left - m.right, data.length * 64);
        const gx0 = m.left + (width - m.left - m.right - colsW) / 2;
        const colW = colsW / data.length;
        const cx = (i: number) => gx0 + colW * (i + 0.5);
        const y = scaleLinear()
          .domain([y0, y1 + FLOOR_PAD])
          .range([m.top + 8, height - m.bottom]);
        const yearStep = y(y0 + 1) - y(y0);
        const floor = y(y1 + FLOOR_PAD);
        const r = Math.min(yearStep * 0.32, colW * 0.2) >= 6 ? 6 : 4.5;
        const years = Array.from({ length: y1 - y0 + 1 }, (_, k) => y0 + k);
        const every = byStep(
          yearStep,
          [
            { min: 34, out: 1 },
            { min: 10, out: 2 },
          ],
          4
        );
        const tip = hover === null ? undefined : data[hover];
        return (
          <div className="relative">
            <svg
              width={width}
              height={height}
              aria-label={`Feature lineage ${y0}–${y1}: ${data.map((d) => `${d.name}, ${describe(d)}`).join("; ")}`}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>Feature lineage</title>
              <YearGrid
                years={years}
                y={y}
                x0={gx0}
                x1={gx0 + colsW}
                every={every}
              />
              {data.map((d, i) => (
                <g
                  key={d.name}
                  className={dimClass(hover !== null && hover !== i)}
                  onPointerEnter={() => {
                    setHover(i);
                  }}
                >
                  <FeatureColumn
                    feature={d}
                    index={i}
                    x={cx(i)}
                    colW={colW}
                    top={m.top}
                    floor={floor}
                    floorYear={y1 + FLOOR_PAD}
                    r={r}
                    y={y}
                    hero={hero === d.name}
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
              <Tooltip x={cx(hover)} y={y(tip.shipped) - r - 4}>
                <b>{tip.name}</b> · {describe(tip)}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
