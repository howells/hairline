import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { yearTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { DOT } from "../marks";
import type { DotSize } from "../marks";
import { FootNote } from "../plot-note";
import { HRule, Stem } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import { noteSpace, stagger } from "../util";
import { trendLineageDemo } from "./trend-lineage.data";
import type { LineageDatum } from "./trend-lineage.data";
import { byStep } from "./util-b";

interface TrendLineageProps {
  data?: LineageDatum[];
  /** First and last year on the axis; defaults to the data's span. */
  years?: [number, number];
  height?: number;
  note?: string;
  /** Area drawn in the hero colour. Defaults to the oldest still in use. */
  highlight?: string;
}

interface Segment {
  id: string;
  a: number;
  b: number;
  dormant: boolean;
}

/** How far below the last year the floor (in use today) sits, in years. */
const FLOOR_PAD = 0.65;

const yearOf = (v: number) => Math.floor(v);

const describe = (d: LineageDatum) => {
  const parts = [`added ${yearOf(d.shipped)}`];
  const reworked = d.reworked ?? [];
  const dormant = d.dormant ?? [];
  if (reworked.length > 0) {
    parts.push(`changed ${reworked.map(yearOf).join(", ")}`);
  }
  if (dormant.length > 0) {
    parts.push(
      `suspended ${dormant.map(([a, b]) => `${yearOf(a)}–${yearOf(b)}`).join(", ")}`
    );
  }
  parts.push(
    d.retired === undefined ? "in use today" : `dropped ${yearOf(d.retired)}`
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
  // Labels fall on whole multiples of `every`; once years are under 10px
  // apart only those years carry a rule, so the grid stays a few fine lines.
  const ticked = years.filter((yr) => yr % every === 0);
  const labels = new Map(
    yearTickLabels(ticked.map((yr) => new Date(Date.UTC(yr, 0, 1)))).map(
      (label, k) => [ticked[k], label]
    )
  );
  return (
    <g>
      {(every >= 5 ? ticked : years).map((yr) => (
        <g key={`year-${yr}`}>
          <HRule kind="grid" x0={x0 - 8} x1={x1} y={y(yr)} />
          {labels.has(yr) && (
            <Label anchor="end" middle voice="axis" x={x0 - 16} y={y(yr)}>
              {labels.get(yr)}
            </Label>
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
  size: DotSize;
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
  size,
  y,
  hero,
}: ColumnProps) => {
  const events = [feature.shipped, ...(feature.reworked ?? [])].toSorted(
    (a, b) => a - b
  );
  const end = feature.retired ?? floorYear;
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
      <HitRect
        x={x - colW / 2}
        y={top}
        width={colW}
        height={floor - top + 40}
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
          <Stem
            key={s.id}
            className={`grow-y from-top ${hero ? "stroke-hero" : "stroke-l5"}`}
            hero={hero}
            style={stagger(index, "series")}
            x={x}
            y0={crisp(y(s.a))}
            y1={crisp(y(s.b))}
          />
        )
      )}
      {feature.retired === undefined ? null : (
        <Dot
          className="pop fill-l5"
          style={stagger(index * 3 + 4, "mark")}
          cx={stemX}
          cy={crisp(y(feature.retired))}
          size="xs"
        />
      )}
      {events.slice(1).map((e) => (
        <Ring
          key={`rework-${e}`}
          className={`pop ${hero ? "stroke-hero" : "stroke-l3"}`}
          style={stagger(index * 3 + 2, "mark")}
          cx={stemX}
          cy={crisp(y(e))}
          size={size}
        />
      ))}
      <Dot
        className={`pop ${hero ? "fill-hero" : "fill-l3"}`}
        style={stagger(index * 3, "mark")}
        cx={stemX}
        cy={crisp(y(feature.shipped))}
        size={size}
      />
      <Label
        anchor="end"
        className={labelTone}
        order={index}
        transform={`rotate(${colW < 44 ? -64 : -38} ${x + 3} ${ly})`}
        voice="name"
        x={x + 3}
        y={ly}
      >
        {feature.name}
      </Label>
    </>
  );
};

/**
 * L11 Sea areas. One column per sea area, time running down the page.
 * Filled dot = added, hollow = renamed or redrawn, dotted = suspended years;
 * the line runs on to the floor if the area is still in use today, and stops
 * at a small dot where it was dropped. The oldest area in use is the hero.
 */
export const TrendLineage = (props: TrendLineageProps) => {
  const data = props.data ?? trendLineageDemo;
  const height = props.height ?? 460;
  const hover = useHover<number>();
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
        const size: DotSize =
          Math.min(yearStep * 0.32, colW * 0.2) >= DOT.lg ? "lg" : "md";
        const years = Array.from({ length: y1 - y0 + 1 }, (_, k) => y0 + k);
        const every = byStep(
          yearStep,
          [
            { min: 34, out: 1 },
            { min: 10, out: 2 },
            { min: 5, out: 5 },
            { min: 2.5, out: 10 },
          ],
          25
        );
        const tip = hover.key === null ? undefined : data[hover.key];
        return (
          <div className="relative">
            <ChartSvg
              height={height}
              label={`Sea area lineage ${y0}–${y1}: ${data.map((d) => `${d.name}, ${describe(d)}`).join("; ")}`}
              leave={hover.clear}
              title="Sea area lineage"
              width={width}
            >
              <YearGrid
                years={years}
                y={y}
                x0={gx0}
                x1={gx0 + colsW}
                every={every}
              />
              {data.map((d, i) => (
                <DimGroup
                  key={d.name}
                  dim={hover.dim(i)}
                  onPointerEnter={hover.enter(i)}
                >
                  <FeatureColumn
                    feature={d}
                    index={i}
                    x={cx(i)}
                    colW={colW}
                    top={m.top}
                    floor={floor}
                    floorYear={y1 + FLOOR_PAD}
                    size={size}
                    y={y}
                    hero={hero === d.name}
                  />
                </DimGroup>
              ))}
              <FootNote height={height} text={props.note} width={width} />
            </ChartSvg>
            {tip !== undefined && hover.key !== null && (
              <Tooltip x={cx(hover.key)} y={y(tip.shipped) - DOT[size] - 4}>
                <TipText facts={[describe(tip)]} lead={tip.name} />
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
