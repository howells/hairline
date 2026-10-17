import { format as d3format } from "d3-format";
import { scaleLinear } from "d3-scale";
import type { PointerEvent } from "react";

import { monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { Dot } from "../markers";
import { DOT } from "../marks";
import type { DotSize } from "../marks";
import { PlotNote } from "../plot-note";
import { Stem } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { clamp, noteSpace, sansWidth, stagger } from "../util";
import { barcodeLollipopDemo } from "./barcode-lollipop.data";
import type { BarcodeDatum } from "./barcode-lollipop.data";
import { argMax } from "./util-b";

interface BarcodeLollipopProps {
  data?: BarcodeDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Ignored: the margin paragraph is no longer drawn. */
  aside?: string;
  /** How many top days to label. Default 3. */
  top?: number;
}

const twoDp = d3format(".2f");
const metres = (v: number) => `${twoDp(v)} m`;
const dayFmt = (d: Date) =>
  d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });

interface TopLabel {
  i: number;
  w: number;
  x: number;
  y: number;
}

/**
 * Centre x of each top-day label, pushed apart sideways where two would
 * overlap (adjacent peaks at similar heights), then kept inside [lo, hi].
 */
const spreadLabels = (labels: TopLabel[], lo: number, hi: number) => {
  const placed = labels.map((l) => ({ ...l })).toSorted((a, b) => a.x - b.x);
  const clash = (a: TopLabel, b: TopLabel) => Math.abs(a.y - b.y) < 14;
  for (let pass = 0; pass < 40; pass += 1) {
    let moved = false;
    for (const [k, b] of placed.entries()) {
      const a = placed[k - 1];
      const overlap = a === undefined ? 0 : a.x + a.w / 2 + 6 - (b.x - b.w / 2);
      if (a !== undefined && overlap > 0.5 && clash(a, b)) {
        a.x -= overlap / 2;
        b.x += overlap / 2;
        moved = true;
      }
    }
    for (const l of placed) {
      l.x = clamp(l.x, lo + l.w / 2, hi - l.w / 2);
    }
    if (!moved) {
      break;
    }
  }
  return new Map(placed.map((l) => [l.i, l.x]));
};

/** A top day's value label, centred over its dot, before any spreading. */
const topLabel = (
  i: number,
  datum: BarcodeDatum,
  format: (v: number) => string,
  x: (i: number) => number,
  y: (v: number) => number
): TopLabel => ({
  i,
  w: sansWidth(format(datum.value), 12),
  x: x(i),
  y: y(datum.value),
});

interface DayMarkProps {
  datum: BarcodeDatum;
  dim: boolean;
  dotSize: DotSize;
  format: (v: number) => string;
  /** The highest day: the one mark in ink. */
  hero: boolean;
  i: number;
  isTop: boolean;
  /** Centre of the value label, when it had to move off the dot. */
  labelX: number | undefined;
  low: number;
  x: number;
  y: (v: number) => number;
}

const DayMark = ({
  datum,
  dim,
  dotSize,
  format,
  hero,
  i,
  isTop,
  labelX,
  low,
  x,
  y,
}: DayMarkProps) => {
  const cy = y(datum.value);
  const r = DOT[hero ? "md" : dotSize];
  // A 2px stem sits on whole pixels, a 1px one on the half pixel.
  const stemX = hero ? Math.round(x) : crisp(x);
  return (
    <DimGroup dim={dim}>
      <Stem
        className={`grow-y from-top ${hero ? "stroke-hero" : "stroke-l4"}`}
        hero={hero}
        style={stagger(i, "dense")}
        x={x}
        y0={cy}
        y1={y(low)}
      />
      <Dot
        className={`pop ${hero ? "fill-hero" : "fill-l2"}`}
        cx={stemX}
        cy={cy}
        size={hero ? "md" : dotSize}
        style={stagger(i, "dense")}
      />
      {isTop ? (
        <Label
          anchor="middle"
          className="fade"
          halo
          voice={hero ? "value" : "axis"}
          x={labelX ?? x}
          y={cy - r - 8}
        >
          {format(datum.value)}
        </Label>
      ) : null}
    </DimGroup>
  );
};

/** A label under the first day and each month's first day, broadsheet style. */
const MonthTicks = (props: {
  data: BarcodeDatum[];
  floor: number;
  x: (i: number) => number;
}) => {
  const starts = props.data.flatMap((d, i) =>
    i === 0 || d.date.getUTCDate() === 1 ? [i] : []
  );
  const labels = monthTickLabels(starts.map((i) => props.data[i].date));
  return (
    <g>
      {starts.map((i, k) => (
        <Label
          key={`month-${props.data[i].date.toISOString()}`}
          voice="axis"
          x={props.x(i)}
          y={props.floor + 22}
        >
          {labels[k]}
        </Label>
      ))}
    </g>
  );
};

/** The barcode: one hairline per calendar day, plus month labels. */
const Barcode = (props: {
  data: BarcodeDatum[];
  floor: number;
  hover: number | null;
  top: number;
  x: (i: number) => number;
}) => (
  <g>
    {props.data.map((d, i) => (
      <line
        className={`grow-y ${props.hover === i ? "stroke-l5 shape-crisp" : "grid-line"}`}
        key={`bar-${d.date.toISOString()}`}
        style={stagger(i, "dense")}
        x1={crisp(props.x(i))}
        x2={crisp(props.x(i))}
        y1={props.top}
        y2={props.floor}
      />
    ))}
    <MonthTicks data={props.data} floor={props.floor} x={props.x} />
  </g>
);

/**
 * L3 Autumn tides. A vertical hairline for every day (the barcode), a
 * lollipop dot at each day's high water with a stem down to its low water, so
 * the stem is the day's range and the fortnightly spring and neap swell shows
 * in the stem lengths. The highest high waters are labelled.
 */
export const BarcodeLollipop = (props: BarcodeLollipopProps) => {
  const data = props.data ?? barcodeLollipopDemo;
  const height = props.height ?? 440;
  const format = props.format ?? metres;
  const topN = props.top ?? 3;
  const hover = useHover<number>();
  const lows = data.map((d) => d.low ?? d.value * 0.9);
  const top = new Set(
    data
      .map((d, i) => ({ i, v: d.value }))
      .toSorted((a, b) => b.v - a.v)
      .slice(0, topN)
      .map((d) => d.i)
  );

  const peak = argMax(data.map((d) => d.value));

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `high ${format(data[hover.at.key].value)}`,
                `low ${format(lows[hover.at.key])}`,
              ]}
              lead={dayFmt(data[hover.at.key].date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const m = {
          bottom: 30 + noteSpace(props.note, width - 12, 20),
          left: 4,
          right: 8,
          top: 10,
        };
        const floor = height - m.bottom;
        const step = (width - m.left - m.right) / Math.max(1, data.length - 1);
        const x = (i: number) => m.left + i * step;
        const y = scaleLinear()
          .domain([Math.min(...lows), Math.max(...data.map((d) => d.value))])
          .range([floor - 6, m.top + 22]);
        const dotSize: DotSize = step >= 8 ? "sm" : "xs";
        const labelX = spreadLabels(
          [...top].map((i) => topLabel(i, data[i], format, x, y)),
          m.left - step / 2,
          width - 2
        );
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
          if (px < m.left - step || px > width - m.right + step) {
            hover.clear();
            return;
          }
          const i = clamp(Math.round((px - m.left) / step), 0, data.length - 1);
          hover.show(i, x(i), y(data[i].value) - DOT[dotSize] - 6);
        };

        return (
          <ChartSvg
            height={height}
            label={`Daily high and low water over ${data.length} days. Highest high water: ${[...top].map((i) => `${dayFmt(data[i].date)} ${format(data[i].value)}`).join(", ")}`}
            leave={hover.clear}
            onPointerMove={onMove}
            title="One hairline per day, a lollipop at each day's high water"
            width={width}
          >
            <Barcode
              data={data}
              floor={floor}
              hover={hover.key}
              top={m.top}
              x={x}
            />
            {data.map((d, i) => (
              <DayMark
                datum={d}
                dim={hover.dim(i)}
                dotSize={dotSize}
                format={format}
                i={i}
                hero={i === peak}
                isTop={top.has(i)}
                labelX={labelX.get(i)}
                key={`day-${d.date.toISOString()}`}
                low={lows[i]}
                x={x(i)}
                y={y}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - m.left - m.right}
              x={(m.left + width - m.right) / 2}
              y={height - 6}
            />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
