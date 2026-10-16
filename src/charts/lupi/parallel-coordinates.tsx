import { quantile } from "d3-array";
import { scaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Dot } from "../markers";
import { TICK } from "../marks";
import { PlotNote } from "../plot-note";
import { Hatch, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, sansWidth, stagger, wrapWords } from "../util";
import { parallelDemo } from "./parallel-coordinates.data";
import type {
  ParallelAxis,
  ParallelData,
  ParallelRow,
} from "./parallel-coordinates.data";

interface ParallelCoordinatesProps {
  data?: ParallelData;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Name of the entity to draw in ink and label at the end. */
  highlight?: string;
  /**
   * Widest the block of axes gets, in px. Defaults to 600, which suits a
   * gallery card; pass `Infinity` to fill a full-width row.
   */
  maxWidth?: number;
}

interface Point {
  x: number;
  y: number;
}

/** Length of a rug tick, drawn out from the left of its axis. */
const RUG = TICK.md;

/** A row's path: smooth S-curves from axis to axis, flat where it crosses each axis. */
const rowPath = (pts: Point[]) => {
  const segments = pts.slice(1).map((p, k) => {
    const from = pts[k];
    const dx = (p.x - from.x) * 0.45;
    return `C${from.x + dx},${from.y} ${p.x - dx},${p.y} ${p.x},${p.y}`;
  });
  return pts.length > 0 ? `M${pts[0].x},${pts[0].y}${segments.join("")}` : "";
};

/**
 * A band between two rows of points, on the lines' own curve: out along the
 * upper edge, back along the lower. Every line between the two edges' values
 * at each axis stays inside it.
 */
const bandPath = (upper: Point[], lower: Point[]) =>
  `${rowPath(upper)}L${rowPath(lower.toReversed()).slice(1)}Z`;

/** Line pitch of a wrapped axis title. */
const TITLE_LINE = 14;

/** A value with its axis's unit (zero needs none), and a true minus sign. */
const withUnit = (
  axis: ParallelAxis,
  v: number,
  format: (v: number) => string
) => (v === 0 ? "0" : `${format(v).replace("-", "−")}${axis.unit ?? ""}`);

interface AxisProps {
  axis: ParallelAxis;
  /** Every row's value on this axis, in px: the rug. */
  rug: number[];
  index: number;
  x: number;
  top: number;
  bottom: number;
  /** The title, broken into lines that fit between neighbouring axes. */
  lines: string[];
  format: (v: number) => string;
}

/**
 * One axis as a ruler: a 1px rule carrying a rug of 1px ticks, one for every
 * row's value, so the ruler shows the spread; the end values labelled.
 */
const AxisRule = ({
  axis,
  rug,
  index,
  x,
  top,
  bottom,
  lines,
  format,
}: AxisProps) => (
  <g className="fade" style={stagger(index, "mark")}>
    {/* Every title ends on one baseline; a long one wraps upward. */}
    {lines.map((line, k) => (
      <text
        className="t-label fill-muted"
        key={line}
        textAnchor="middle"
        x={x}
        y={top - 26 - (lines.length - 1 - k) * TITLE_LINE}
      >
        {line}
      </text>
    ))}
    <line
      className="rule"
      x1={crisp(x)}
      x2={crisp(x)}
      y1={Math.round(top)}
      y2={Math.round(bottom)}
    />
    {rug.map((ty) => (
      <line
        className="stroke-l2 shape-crisp"
        key={`${axis.key}-${ty}`}
        strokeWidth={1}
        x1={Math.round(x) + 1 - RUG}
        x2={Math.round(x) + 1}
        y1={crisp(ty)}
        y2={crisp(ty)}
      />
    ))}
    <text className="t-axis fill-muted" dy="0.34em" x={x + 9} y={top}>
      {withUnit(axis, axis.domain[1], format)}
    </text>
    <text className="t-axis fill-muted" dy="0.34em" x={x + 9} y={bottom}>
      {withUnit(axis, axis.domain[0], format)}
    </text>
  </g>
);

interface LineProps {
  row: ParallelRow;
  index: number;
  pts: Point[];
  hero: boolean;
  active: boolean | null;
  onEnter: () => void;
}

/** The hero in ink at 2px; a hovered row in ink; the rest faint hairlines. */
const RowLine = ({ row, index, pts, hero, active, onEnter }: LineProps) => {
  const d = rowPath(pts);
  const strong = hero || active === true;
  const last = pts.at(-1);
  return (
    <g className={dimClass(active === false)} onPointerEnter={onEnter}>
      <path className="fill-none stroke-transparent" d={d} strokeWidth={10} />
      <path
        className={`draw cap-round fill-none ${strong ? "stroke-hero" : "stroke-l4"}`}
        d={d}
        pathLength={1}
        strokeWidth={strong ? 2 : 1}
        style={stagger(hero ? 14 : index, "mark")}
      />
      {hero
        ? pts.map((p) => (
            <Dot
              className="fade fill-hero"
              cx={p.x}
              cy={p.y}
              key={`${row.name}-${p.x}`}
              size="md"
              style={stagger(index + 4, "mark")}
            />
          ))
        : null}
      {hero && last !== undefined && (
        <text
          className="fade t-label"
          dy="0.34em"
          style={stagger(16)}
          x={last.x + 12}
          y={last.y}
        >
          {row.name}
        </text>
      )}
    </g>
  );
};

/** The engraved ground: full range stippled, middle half hatched, both on paper. */
const Ground = (props: {
  ids: (name: string) => string;
  range: string;
  middle: string;
}) => (
  <g className="fade" style={stagger(2, "series")}>
    <defs>
      <Stipple ground="fill-paper" id={props.ids("range")} tone="fill-l4" />
      <Hatch ground="fill-paper" id={props.ids("middle")} tone="fill-l5" />
    </defs>
    <path
      className="stroke-l5"
      d={props.range}
      fill={paint(props.ids("range"))}
      strokeWidth={1}
    />
    <path
      className="stroke-l5"
      d={props.middle}
      fill={paint(props.ids("middle"))}
      strokeWidth={1}
    />
  </g>
);

/** An axis's stated domain, widened to every row's value. */
const widened = (data: ParallelData, a: ParallelAxis): [number, number] => {
  const values = data.rows.map((r) => r.values[a.key] ?? a.domain[0]);
  return [Math.min(a.domain[0], ...values), Math.max(a.domain[1], ...values)];
};

/** Each axis's scale: its widened domain. */
const scalesOf = (data: ParallelData, top: number, bottom: number) =>
  data.axes.map((a) =>
    scaleLinear().domain(widened(data, a)).range([bottom, top])
  );

// sansWidth rounds each glyph up: a size a little under the real 11 is nearer the ink.
const textW = (t: string) => sansWidth(t, 10.4);

/** Half the widest line of an axis title wrapped to the gap between axes. */
const halfTitle = (axis: ParallelAxis | undefined, gap: number) =>
  Math.max(0, ...wrapWords(axis?.label ?? "", gap - 10, textW).map(textW)) / 2;

/**
 * What hangs outside the first and last axes: a wrapped title (centred on
 * its axis), the rug, and on the right the end values or the highlighted
 * name. Titles wrap to the gap between axes, which in turn depends on these
 * edges, so settle it.
 */
const edgesFor = (
  data: ParallelData,
  blockW: number,
  format: (v: number) => string,
  highlight: string | undefined
) => {
  const first = data.axes.at(0);
  const last = data.axes.at(-1);
  const endW =
    last === undefined
      ? 0
      : Math.max(
          ...widened(data, last).map((v) => textW(withUnit(last, v, format)))
        );
  const heroW = data.rows.some((r) => r.name === highlight)
    ? 12 + textW(highlight ?? "")
    : 0;
  const settle = (edge: { l: number; r: number }) => {
    const gap = (blockW - edge.l - edge.r) / Math.max(1, data.axes.length - 1);
    return {
      gap,
      l: Math.max(RUG, halfTitle(first, gap)),
      r: Math.max(halfTitle(last, gap), 9 + endW, heroW),
    };
  };
  // A title that wraps or not as the edges move can flip-flop: keep the wider
  // edges, and wrap the titles to the roomier gap that goes with them.
  let prev = settle({ l: 30, r: 30 });
  let edge = settle(prev);
  for (
    let pass = 0;
    pass < 4 && (edge.l !== prev.l || edge.r !== prev.r);
    pass += 1
  ) {
    prev = edge;
    edge = settle(edge);
  }
  return {
    gap: Math.max(prev.gap, edge.gap),
    l: Math.max(prev.l, edge.l),
    r: Math.max(prev.r, edge.r),
  };
};

/** Points at one statistic of every axis's values (min, quartiles, max). */
const statPoints = (
  data: ParallelData,
  ys: ReturnType<typeof scalesOf>,
  ax: (k: number) => number,
  p: number
) =>
  data.axes.map((a, k) => ({
    x: ax(k),
    y: ys[k](
      quantile(
        data.rows.map((r) => r.values[a.key] ?? a.domain[0]),
        p
      ) ?? a.domain[0]
    ),
  }));

/**
 * L20 Twelve cheeses. Entities across three to six continuous axes, laid
 * over an engraved ground: the full range of every entity between each pair
 * of axes stippled, the middle half hatched, each axis carrying a rug of its
 * values. The rest are faint hairlines; the highlighted entity is in ink,
 * dotted at each axis and named.
 */
export const ParallelCoordinates = (props: ParallelCoordinatesProps) => {
  const data = props.data ?? parallelDemo;
  const height = props.height ?? 470;
  const format = props.format ?? ((v: number) => `${v}`);
  const [hover, setHover] = useState<number | null>(null);
  const ids = useTextureIds("ranges");
  // Hero last, so it sits on top.
  const order = data.rows
    .map((r, i) => ({ i, r }))
    .toSorted(
      (a, b) =>
        Number(a.r.name === props.highlight) -
        Number(b.r.name === props.highlight)
    );

  return (
    <Plot>
      {(width) => {
        const blockW = Math.min(width, props.maxWidth ?? 600);
        const edge = edgesFor(data, blockW, format, props.highlight);
        const left = (width - blockW) / 2 + edge.l;
        const right = (width + blockW) / 2 - edge.r;
        const top = 58;
        const noteW = width - 16 - Math.abs(left + right - width);
        const bottom = height - (30 + noteSpace(props.note, noteW, 24));
        const ax = (k: number) =>
          left + ((right - left) * k) / Math.max(1, data.axes.length - 1);
        const ys = scalesOf(data, top, bottom);
        // Room each axis title has between its neighbours.
        const { gap } = edge;
        // The axes as drawn: end labels follow the widened domains.
        const shown = data.axes.map((a, k): ParallelAxis => {
          const scale = ys.at(k);
          const lo = scale === undefined ? a.domain[0] : scale.invert(bottom);
          const hi = scale === undefined ? a.domain[1] : scale.invert(top);
          return { ...a, domain: [lo, hi] };
        });
        const pointsOf = (r: ParallelRow) =>
          data.axes.map((a, k) => ({
            x: ax(k),
            y: ys[k](r.values[a.key] ?? a.domain[0]),
          }));
        const stat = (p: number) => statPoints(data, ys, ax, p);
        const tipRow = hover === null ? undefined : data.rows[hover];
        const tipPts = tipRow === undefined ? [] : pointsOf(tipRow);
        return (
          <div className="relative">
            <svg
              aria-label={`${data.rows.length} cheeses across ${data.axes.map((a) => a.label).join(", ")}`}
              height={height}
              onPointerLeave={() => {
                setHover(null);
              }}
              width={width}
            >
              <title>Twelve cheeses</title>
              <Ground
                ids={ids}
                middle={bandPath(stat(0.75), stat(0.25))}
                range={bandPath(stat(1), stat(0))}
              />
              {shown.map((a, k) => (
                <AxisRule
                  axis={a}
                  bottom={bottom}
                  format={format}
                  index={k}
                  key={a.key}
                  rug={data.rows.map((r) =>
                    ys[k](r.values[a.key] ?? a.domain[0])
                  )}
                  lines={wrapWords(a.label, gap - 10, textW)}
                  top={top}
                  x={ax(k)}
                />
              ))}
              {order.map(({ r, i }) => (
                <RowLine
                  active={hover === null ? null : hover === i}
                  hero={props.highlight === r.name}
                  index={i}
                  key={r.name}
                  onEnter={() => {
                    setHover(i);
                  }}
                  pts={pointsOf(r)}
                  row={r}
                />
              ))}
              <PlotNote
                text={props.note}
                width={noteW}
                x={(left + right) / 2}
                y={height - 6}
              />
            </svg>
            {tipRow !== undefined && tipPts.length > 0 && (
              <Tooltip
                x={tipPts[Math.floor(tipPts.length / 2)].x}
                y={Math.min(...tipPts.map((p) => p.y)) - 6}
              >
                <b>{tipRow.name}</b> ·{" "}
                {data.axes
                  .map(
                    (a) =>
                      `${a.label} ${withUnit(a, tipRow.values[a.key] ?? 0, format)}`
                  )
                  .join(" · ")}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
