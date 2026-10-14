import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import {
  NOTE_LINE,
  dimClass,
  hasText,
  noteLines,
  sansWidth,
  stagger,
} from "../util";
import { plumbScatterDemo } from "./plumb-scatter.data";
import type { PlumbDatum } from "./plumb-scatter.data";
import { isDim, useHoverTip } from "./util-a";

interface PlumbScatterProps {
  data?: PlumbDatum[];
  height?: number;
  /** Formats y (the height). */
  format?: (v: number) => string;
  formatX?: (v: number) => string;
  note?: string;
  /** Names for the low and high ends of the x axis. */
  xLabels?: [string, string];
  /** Name for the y direction, drawn up the left side. */
  yLabel?: string;
  xDomain?: [number, number];
  yDomain?: [number, number];
  /** Indices to name beside their dot. Defaults to the highest and lowest. */
  labelled?: number[];
  /** Index drawn in the hero colour. */
  highlight?: number;
}

interface FloorProps {
  floor: number;
  highName: string;
  lowName: string;
  x0: number;
  x1: number;
  yLabel: string;
}

/** The floor: one hairline with the axis names; the y name sits top left. */
const Floor = ({ floor, highName, lowName, x0, x1, yLabel }: FloorProps) => (
  <g>
    <line
      className="hairline"
      x1={Math.round(x0)}
      x2={Math.round(x1)}
      y1={crisp(floor)}
      y2={crisp(floor)}
    />
    <text className="t-axis" x={x0} y={floor + 20}>
      {lowName}
    </text>
    <text className="t-axis" textAnchor="end" x={x1} y={floor + 20}>
      {highName}
    </text>
    <text className="t-axis" x={x0} y={20}>
      {yLabel}
    </text>
  </g>
);

const dotClass = (hero: boolean) => (hero ? "pop fill-hero" : "pop fill-l3");

/** Where a point's name sits: centred above the dot, or beside it. */
interface Placement {
  anchor: "end" | "middle" | "start";
  dx: number;
  dy: number;
}

const ABOVE: Placement = { anchor: "middle", dx: 0, dy: -12 };
const PLACEMENTS: Placement[] = [
  ABOVE,
  { anchor: "start", dx: 10, dy: 4 },
  { anchor: "end", dx: -10, dy: 4 },
];

/** Horizontal extent of a name set with `place` at `px`. */
const extent = (place: Placement, px: number, w: number) => {
  if (place.anchor === "middle") {
    return [px - w / 2, px + w / 2];
  }
  return place.anchor === "start"
    ? [px + place.dx, px + place.dx + w]
    : [px + place.dx - w, px + place.dx];
};

/**
 * The first placement whose name crosses no other point's stem: a stem runs
 * from its dot down to the floor, so a name set low beside a tall stem would
 * cut it.
 */
const placeName = (
  self: { px: number; py: number; w: number },
  stems: { px: number; py: number }[]
) =>
  PLACEMENTS.find((place) => {
    const [l, r] = extent(place, self.px, self.w);
    const top = self.py + place.dy - 10;
    return (
      stems.every(
        (st) =>
          st.px === self.px ||
          st.px < l - 4 ||
          st.px > r + 4 ||
          st.py > self.py + place.dy + 2
      ) && top > 0
    );
  }) ?? ABOVE;

interface PointProps {
  datum: PlumbDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  named: boolean;
  onEnter: (x: number, y: number) => void;
  order: number;
  /** Where the name sits, when named. */
  place: Placement;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

/** One point on its stem to the floor (evenly dotted, solid ink for the hero), named when asked. */
const Point = ({
  datum,
  dim,
  floor,
  format,
  hero,
  named,
  onEnter,
  order,
  place,
  x,
  y,
}: PointProps) => {
  const px = x(datum.x);
  const py = y(datum.y);
  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(px, py - (named ? 28 : 10));
      }}
    >
      <rect
        className="fill-transparent"
        height={floor - py + 10}
        width={18}
        x={px - 9}
        y={py - 10}
      />
      {hero ? (
        <line
          className="grow-y hairline stroke-hero"
          style={stagger(order, "mark")}
          x1={crisp(px)}
          x2={crisp(px)}
          y1={Math.round(floor)}
          y2={py}
        />
      ) : (
        <g className="fade" style={stagger(order, "mark")}>
          <DottedLine
            pitch={TEXTURE_PITCH.dense}
            tone="fill-l3"
            x0={px}
            x1={px}
            y0={py + 4}
            y1={floor - 2}
          />
        </g>
      )}
      <circle
        className={dotClass(hero)}
        cx={crisp(px)}
        cy={py}
        r={hero ? 4.5 : 3}
        style={stagger(order + 6, "mark")}
      />
      {named ? (
        <text
          className={`fade t-halo ${hero ? "t-label" : "t-axis"}`}
          style={stagger(order + 8, "mark")}
          textAnchor={place.anchor}
          x={px + place.dx}
          y={py + place.dy}
        >
          {datum.label} · {format(datum.y)}
        </text>
      ) : null}
    </g>
  );
};

/**
 * F8 Stem scatter. Up to twenty points, each on a stem to the floor so x can
 * be read where the stem lands: dotted at pitch 3, solid ink for the hero.
 * The highest point is the hero; the highest and lowest are named.
 */
export const PlumbScatter = (props: PlumbScatterProps) => {
  const data = props.data ?? plumbScatterDemo;
  const height = props.height ?? 440;
  const format = props.format ?? String;
  const formatX = props.formatX ?? ((v: number) => `${Math.round(v)}`);
  const [lowName, highName] = props.xLabels ?? ["Low", "High"];
  const hasNote = hasText(props.note);
  const { clear, hover, show, tip } = useHoverTip();

  const ys = data.map((d) => d.y);
  const xs = data.map((d) => d.x);
  const hero = props.highlight ?? ys.indexOf(Math.max(...ys));
  const labelled = new Set(
    props.labelled ?? [ys.indexOf(Math.max(...ys)), ys.indexOf(Math.min(...ys))]
  );
  const xDomain = props.xDomain ?? [
    0,
    Math.ceil((Math.max(...xs) * 1.12) / 10) * 10,
  ];
  const yDomain = props.yDomain ?? [
    Math.max(0, Math.floor((Math.min(...ys) - 10) / 10) * 10),
    Math.max(...ys),
  ];
  const byX = data.map((d, i) => ({ i, x: d.x })).toSorted((a, b) => a.x - b.x);
  const order = new Map(byX.map((entry, r) => [entry.i, r]));
  const label = data
    .map((d) => `${d.label}: ${formatX(d.x)}, ${format(d.y)}`)
    .join("; ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {formatX(data[tip.i].x)} ·{" "}
            {format(data[tip.i].y)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const plotW = Math.min(width - 64, 600);
        const x0 = (width - plotW) / 2 + 8;
        const notes = noteLines(props.note, width - 24);
        const floor =
          Math.round(height) -
          (hasNote ? 58 : 36) -
          Math.max(0, notes.length - 1) * NOTE_LINE;
        const x = scaleLinear()
          .domain(xDomain)
          .range([x0, x0 + plotW]);
        const y = scaleLinear()
          .domain(yDomain)
          .range([floor - 14, 46]);
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={clear}
            width={width}
          >
            <title>{label}</title>
            <Floor
              floor={floor}
              highName={highName}
              lowName={lowName}
              x0={x0}
              x1={x0 + plotW}
              yLabel={props.yLabel ?? "Higher ↑"}
            />
            {data.map((d, i) => (
              <Point
                place={placeName(
                  {
                    px: x(d.x),
                    py: y(d.y),
                    w: sansWidth(
                      `${d.label} · ${format(d.y)}`,
                      hero === i ? 12 : 11
                    ),
                  },
                  data.map((o) => ({ px: x(o.x), py: y(o.y) }))
                )}
                datum={d}
                dim={isDim(hover, i)}
                floor={floor}
                format={format}
                hero={hero === i}
                key={d.label}
                named={labelled.has(i)}
                onEnter={(px, py) => {
                  show(i, px, py);
                }}
                order={order.get(i) ?? i}
                x={x}
                y={y}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 24}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
