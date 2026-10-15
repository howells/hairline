import { scaleLinear, scaleUtc } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import {
  area,
  curveCatmullRom,
  line,
  stack,
  stackOffsetWiggle,
  stackOrderNone,
} from "d3-shape";
import { useState } from "react";
import type { PointerEvent } from "react";

import { fmtDay, fmtInt, fmtK, monthTickLabels } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useSvgId } from "../hooks";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch, PlateLabel, Rules, Stipple } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { sansWidth, stagger, sum } from "../util";
import { streamRibbonDemo } from "./stream-ribbon.data";
import type { StreamData } from "./stream-ribbon.data";
import { inkWidth, maxIndex } from "./util-b";

interface StreamRibbonProps {
  data?: StreamData;
  format?: (v: number) => string;
  height?: number;
  note?: string;
}

/** One band's lower and upper edge at one date, in data units. */
interface Edge {
  y0: number;
  y1: number;
}

interface River {
  hi: number;
  layers: Edge[][];
  lo: number;
  names: string[];
  /** Ladder fill step per series: today's leader is darkest. */
  steps: number[];
  totals: number[];
}

interface Layout {
  /** The svg height: the given height, less the slack above a width-bound river. */
  height: number;
  narrow: boolean;
  plotW: number;
  px0: number;
  xs: number[];
  y: ScaleLinear<number, number>;
}

interface Trend {
  mean: number;
  mid: number;
  slope: number;
}

interface Hover {
  i: number;
  /** A narrow plot gets a two-line tooltip that fits its width. */
  narrow: boolean;
  s: number | null;
  x: number;
  y: number;
}

/** Engravings for the bands in rank order: the leader is crosshatched in ink. */
const TEXTURES = ["cross", "hatch", "stipple", "rules"] as const;

/** Ladder steps by series count (index = count − 1), darkest first. */
const LADDERS = [[0], [0, 4], [0, 3, 5], [0, 2, 4, 5], [0, 2, 3, 4, 5]];
const curve = curveCatmullRom.alpha(0.5);

/** Least-squares slope and mean of a series against its index. */
const trend = (values: number[]): Trend => {
  const mid = (values.length - 1) / 2;
  const mean = sum(values) / Math.max(1, values.length);
  let num = 0;
  let den = 0;
  for (const [i, v] of values.entries()) {
    num += (i - mid) * (v - mean);
    den += (i - mid) ** 2;
  }
  return { mean, mid, slope: den === 0 ? 0 : num / den };
};

const buildRiver = (data: StreamData): River => {
  const rows = data.dates.map((_, i) =>
    data.series.map((s) => s.values[i] ?? 0)
  );
  const stacked = stack<number[], number>()
    .keys(data.series.map((_, k) => k))
    .value((row, k) => row[k] ?? 0)
    .order(stackOrderNone)
    .offset(stackOffsetWiggle)(rows);
  // Wiggle keeps slopes small but lets the river drift as one series grows;
  // removing the straight-line drift of its midline keeps it level.
  const bottom = stacked[0] ?? [];
  const top = stacked.at(-1) ?? [];
  const mids = bottom.map((p, i) => (p[0] + (top[i]?.[1] ?? p[1])) / 2);
  const { mean, mid, slope } = trend(mids);
  const layers = stacked.map((layer) =>
    layer.map((p, i) => ({
      y0: p[0] - mean - slope * (i - mid),
      y1: p[1] - mean - slope * (i - mid),
    }))
  );
  const ladder = LADDERS[Math.min(5, data.series.length) - 1] ?? [
    0, 2, 3, 4, 5,
  ];
  const ranked = data.series
    .map((s, k) => ({ k, v: s.values.at(-1) ?? 0 }))
    .toSorted((a, b) => b.v - a.v);
  const steps = data.series.map(
    (_, k) =>
      ladder[
        Math.min(
          ranked.findIndex((r) => r.k === k),
          ladder.length - 1
        )
      ] ?? 0
  );
  return {
    hi: Math.max(...(layers.at(-1) ?? []).map((p) => p.y1)),
    layers,
    lo: Math.min(...(layers[0] ?? []).map((p) => p.y0)),
    names: data.series.map((s) => s.name),
    steps,
    totals: rows.map((r) => sum(r)),
  };
};

/** Margin kept between the ink and the svg edge. */
const EDGE = 2;

const buildLayout = (
  width: number,
  height: number,
  data: StreamData,
  river: River,
  hasNote: boolean
): Layout => {
  const narrow = width < 560;
  // The axis rule reaches 10px past the river on each side, and the latest
  // total sits 10px past its mouth; both stay EDGE inside the svg.
  const totalW = Math.max(
    inkWidth(fmtK(river.totals.at(-1) ?? 0)),
    inkWidth("Total")
  );
  const left = EDGE + 10;
  const right = EDGE + 10 + Math.ceil(totalW);
  const top = 18;
  const plotW = Math.min(width - left - right, 1180);
  const px0 = left + (width - left - right - plotW) / 2;
  const first = data.dates[0] ?? new Date(0);
  const last = data.dates.at(-1) ?? first;
  const x = scaleUtc()
    .domain([first, last])
    .range([px0, px0 + plotW]);
  const tall = height - (hasNote ? 84 : 42) - 18;
  // The river fills the height, but its widest point never passes about
  // three fifths of the plot width, so it stays a river rather than a slab.
  const k = Math.min(
    (tall - top) / (river.hi - river.lo),
    (plotW * 0.6) / Math.max(...river.totals)
  );
  const half = ((river.hi - river.lo) * k) / 2;
  // Height a width-bound river can't use is given back rather than left empty.
  const trim = Math.max(0, Math.floor(tall - top - 12 - half * 2));
  const riverBottom = tall - trim;
  const midY = Math.max((riverBottom + top) / 2, riverBottom - 12 - half);
  return {
    height: height - trim,
    narrow,
    plotW,
    px0,
    xs: data.dates.map((d) => x(d)),
    y: scaleLinear()
      .domain([river.lo, river.hi])
      .range([midY + half, midY - half]),
  };
};

/** Rank of each series' tone, 0 = today's leader. */
const toneRanks = (steps: number[]) => {
  const order = [...new Set(steps)].toSorted((a, b) => a - b);
  return steps.map((step) => order.indexOf(step));
};

const Bands = (props: {
  clip: string;
  /** Pattern ids for the bands, by rank. */
  textures: (name: (typeof TEXTURES)[number]) => string;
  hover: Hover | null;
  layout: Layout;
  river: River;
}) => {
  const { layout, river, hover } = props;
  const xAt = (_: Edge, i: number): number => layout.xs[i] ?? 0;
  const band = area<Edge>()
    .x(xAt)
    .y0((p) => layout.y(p.y0))
    .y1((p) => layout.y(p.y1))
    .curve(curve);
  const topEdge = line<Edge>()
    .x(xAt)
    .y((p) => layout.y(p.y1))
    .curve(curve);
  const hoverTop =
    hover === null ? 0 : layout.y(river.layers.at(-1)?.[hover.i]?.y1 ?? 0);
  const hoverBottom =
    hover === null ? 0 : layout.y(river.layers[0]?.[hover.i]?.y0 ?? 0);
  const ranks = toneRanks(river.steps);
  const dim = (k: number) =>
    hover !== null && hover.s !== null && hover.s !== k ? "opacity-30" : "";
  const hero = ranks.indexOf(0);
  const heroLayer = river.layers[hero];
  return (
    <g clipPath={`url(#${props.clip})`}>
      {river.layers.map((layer, k) => {
        const kind = TEXTURES[Math.min(ranks[k] ?? 0, TEXTURES.length - 1)];
        return (
          <path
            className={`stroke-l5 transition-opacity ${dim(k)}`}
            d={band(layer) ?? ""}
            fill={paint(props.textures(kind ?? "rules"))}
            key={river.names[k]}
            strokeWidth={1}
          />
        );
      })}
      {heroLayer === undefined ? null : (
        <path
          className={`cap-round stroke-ink fill-none transition-opacity ${dim(hero)}`}
          d={topEdge(heroLayer) ?? ""}
          strokeWidth={2}
        />
      )}
      {hover === null ? null : (
        <line
          className="stroke-paper shape-crisp"
          strokeWidth={1}
          x1={crisp(hover.x)}
          x2={crisp(hover.x)}
          y1={hoverTop}
          y2={hoverBottom}
        />
      )}
    </g>
  );
};

/** Each series named where its band is thickest, kept inside the plot. */
const Labels = (props: { data: StreamData; layout: Layout; river: River }) => {
  const { layout, river } = props;
  const labels = river.layers.map((layer, k) => {
    const name = props.data.series[k]?.name ?? "";
    const half = (sansWidth(name, 12) + 16) / 2;
    const thickness = layer.map((p, i) => {
      const x = layout.xs[i] ?? 0;
      const inside =
        x - half >= layout.px0 + 6 && x + half <= layout.px0 + layout.plotW - 6;
      return inside ? layout.y(p.y0) - layout.y(p.y1) : 0;
    });
    const best = maxIndex(thickness);
    const edge = layer[best] ?? { y0: 0, y1: 0 };
    return {
      fits: (thickness[best] ?? 0) >= 18,
      hero: (toneRanks(river.steps)[k] ?? 0) === 0,
      name,
      x: layout.xs[best] ?? 0,
      y: (layout.y(edge.y0) + layout.y(edge.y1)) / 2,
    };
  });
  return (
    <g className="fade pointer-events-none" style={stagger(8)}>
      {labels.map((l) =>
        l.fits ? (
          <PlateLabel
            className="t-label"
            hero={l.hero}
            key={l.name}
            text={l.name}
            x={l.x}
            y={l.y}
          />
        ) : null
      )}
    </g>
  );
};

/** The latest total, set at the river's mouth. */
const Total = (props: { layout: Layout; river: River }) => {
  const { layout, river } = props;
  const last = river.totals.length - 1;
  const top = layout.y(river.layers.at(-1)?.[last]?.y1 ?? 0);
  const bottom = layout.y(river.layers[0]?.[last]?.y0 ?? 0);
  const x = layout.px0 + layout.plotW;
  const mid = (top + bottom) / 2;
  return (
    <g className="fade" style={stagger(9)}>
      <text className="t-value" x={x + 10} y={mid - 2}>
        {fmtK(river.totals.at(-1) ?? 0)}
      </text>
      <text className="t-note" x={x + 10} y={mid + 12}>
        Total
      </text>
    </g>
  );
};

/** A tick at the first week of every third month (sixth when narrow); the year on the first and where it changes. */
const TimeAxis = (props: { data: StreamData; layout: Layout; y: number }) => {
  const { layout, data } = props;
  const every = layout.narrow ? 6 : 3;
  const ticks = data.dates.flatMap((d, i) => {
    const prev = data.dates[i - 1];
    const newMonth =
      prev === undefined || prev.getUTCMonth() !== d.getUTCMonth();
    return newMonth && d.getUTCMonth() % every === 0
      ? [{ date: d, x: layout.xs[i] ?? 0 }]
      : [];
  });
  const labels = monthTickLabels(ticks.map((t) => t.date));
  return (
    <g>
      <line
        className="hairline"
        x1={Math.round(layout.px0 - 10)}
        x2={Math.round(layout.px0 + layout.plotW + 10)}
        y1={crisp(props.y)}
        y2={crisp(props.y)}
      />
      {ticks.map((t) => (
        <line
          className="hairline"
          key={t.date.getTime()}
          x1={crisp(t.x)}
          x2={crisp(t.x)}
          y1={Math.round(props.y) - 6}
          y2={Math.round(props.y)}
        />
      ))}
      {ticks.map((t, k) => (
        <text
          className="t-axis"
          key={t.date.getTime()}
          textAnchor={k === 0 ? "start" : "middle"}
          x={k === 0 ? t.x - 2 : t.x}
          y={props.y + 20}
        >
          {labels[k]}
        </text>
      ))}
    </g>
  );
};

/** Nearest week to the pointer, and which band (if any) sits under it. */
const hoverAt = (
  e: PointerEvent<SVGSVGElement>,
  layout: Layout,
  river: River
): Hover | null => {
  const box = e.currentTarget.getBoundingClientRect();
  const px = e.clientX - box.left;
  if (px < layout.px0 - 10 || px > layout.px0 + layout.plotW + 10) {
    return null;
  }
  const i = maxIndex(layout.xs.map((x) => -Math.abs(x - px)));
  const v = layout.y.invert(e.clientY - box.top);
  const s = river.layers.findIndex((l) => {
    const edge = l[i];
    return edge !== undefined && v >= edge.y0 && v <= edge.y1;
  });
  return {
    i,
    narrow: layout.narrow,
    s: s === -1 ? null : s,
    x: layout.xs[i] ?? 0,
    y: layout.y(river.layers.at(-1)?.[i]?.y1 ?? 0) - 6,
  };
};

const HoverTip = (props: {
  data: StreamData;
  format: (v: number) => string;
  hover: Hover;
  river: River;
}) => {
  const { data, format, hover } = props;
  const date = data.dates[hover.i] ?? new Date(0);
  const total = format(props.river.totals[hover.i] ?? 0);
  if (hover.narrow) {
    // Narrow: the week, then only the band under the pointer and the total.
    const series = hover.s === null ? undefined : data.series[hover.s];
    return (
      <Tooltip x={hover.x} y={hover.y}>
        <b>Week of {fmtDay(date)}</b>
        <br />
        {series === undefined
          ? ""
          : `${series.name} ${format(series.values[hover.i] ?? 0)} · `}
        Total {total}
      </Tooltip>
    );
  }
  return (
    <Tooltip x={hover.x} y={hover.y}>
      <b>Week of {fmtDay(date)}</b>
      {data.series.toReversed().map((s) => {
        const k = data.series.indexOf(s);
        return (
          <span
            className={hover.s === null || hover.s === k ? "" : "opacity-55"}
            key={s.name}
          >
            {" "}
            · {s.name} {format(s.values[hover.i] ?? 0)}
          </span>
        );
      })}{" "}
      · Total {total}
    </Tooltip>
  );
};

/**
 * F16 Streamgraph. Composition over continuous time as a wiggle-centred
 * stream: band width = each series, the river's width = the total. Every
 * band is engraved on paper inside a 1px rule; today's leader is crosshatched
 * in ink under a 2px ink top edge. Sized
 * for a half cell, the river fills the height; the latest total sits at its
 * mouth.
 */
export const StreamRibbon = (props: StreamRibbonProps) => {
  const data = props.data ?? streamRibbonDemo;
  const height = props.height ?? 440;
  const format = props.format ?? fmtInt;
  const clip = useSvgId("stream");
  const textures = useTextureIds("stream");
  const [hover, setHover] = useState<Hover | null>(null);
  const river = buildRiver(data);
  const label = `Stream of ${data.series.map((s) => s.name).join(", ")} over ${data.dates.length} weeks; latest total ${format(river.totals.at(-1) ?? 0)}`;

  return (
    <Plot
      overlay={
        hover === null ? null : (
          <HoverTip data={data} format={format} hover={hover} river={river} />
        )
      }
    >
      {(width) => {
        const hasNote = props.note !== undefined;
        const layout = buildLayout(width, height, data, river, hasNote);
        return (
          <svg
            aria-label={label}
            height={layout.height}
            onPointerLeave={() => {
              setHover(null);
            }}
            onPointerMove={(e) => {
              setHover(hoverAt(e, layout, river));
            }}
            width={width}
          >
            <title>{label}</title>
            <defs>
              <clipPath id={clip}>
                <rect
                  className="sweep"
                  height={layout.height}
                  width={layout.plotW + 8}
                  x={layout.px0 - 4}
                  y={0}
                />
              </clipPath>
            </defs>
            <defs>
              <CrossHatch
                ground="fill-paper"
                id={textures("cross")}
                tone="fill-hero"
              />
              <Hatch
                ground="fill-paper"
                id={textures("hatch")}
                tone="fill-l3"
              />
              <Stipple
                ground="fill-paper"
                id={textures("stipple")}
                tone="fill-l3"
              />
              <Rules
                ground="fill-paper"
                id={textures("rules")}
                tone="fill-l4"
              />
            </defs>
            <Bands
              clip={clip}
              hover={hover}
              layout={layout}
              river={river}
              textures={textures}
            />
            <Labels data={data} layout={layout} river={river} />
            <Total layout={layout} river={river} />
            <TimeAxis
              data={data}
              layout={layout}
              y={layout.height - (hasNote ? 84 : 42) + 10}
            />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={layout.px0 + layout.plotW / 2}
              y={layout.height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
