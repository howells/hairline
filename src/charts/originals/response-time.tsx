import { scaleLog } from "d3-scale";
import type { ScaleLogarithmic } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { DotScreen, KeySwatch } from "../texture";
import {
  HALFTONE_R,
  paint,
  TEXTURE_PITCH,
  useTextureIds,
} from "../texture-ids";
import { dimClass, sansWidth, stagger } from "../util";
import { fmtDuration } from "./format";
import { Key } from "./key";
import { LEVELS, MEDIAN, responseTimes } from "./response-time.data";
import type { ChannelTimes } from "./response-time.data";

const TOP = 30;
/** One channel per row: a 44px-plus touch row. */
const ROW = 80;
const GAP = 16;
const DECILE = 14;
const MEDIAN_H = 18;
const DOMAIN: [number, number] = [1, 2880];
/** The halftone: the shared ladder's dot sizes, largest where tickets crowd. */
const DOT_R = HALFTONE_R;
/**
 * The band, centred on its row: 21px inside the outline, a whole number of
 * screen tiles and one, so the dots sit as far from the bottom as the top.
 */
const BAND_UP = 11;
const BAND_H = 23;
const TICKS_WIDE = [1, 5, 15, 60, 240, 1440];
const TICKS_NARROW = [1, 10, 60, 1440];

interface Frame {
  rowY: (k: number) => number;
  x: ScaleLogarithmic<number, number>;
  x1: number;
}

/** Share of tickets per pixel in each step between kept percentiles. */
const densities = (q: number[], x: (v: number) => number) =>
  q
    .slice(0, -1)
    .map(
      (v, i) => (LEVELS[i + 1] - LEVELS[i]) / Math.max(1, x(q[i + 1]) - x(v))
    );

/** Which dot size a density gets, against the chart's densest step. */
const levelOf = (d: number, max: number) =>
  Math.min(DOT_R.length - 1, Math.floor((d / max) * DOT_R.length));

interface RowProps {
  datum: ChannelTimes;
  /** Halftone pattern ids, and the densest step in the chart. */
  dense: { max: number; tex: (name: string) => string };
  dim: boolean;
  frame: Frame;
  hero: boolean;
  k: number;
  onEnter: () => void;
  width: number;
}

/**
 * One channel: name, a halftone band from the 5th to the 95th percentile
 * whose dots grow where tickets crowd, a tick at every tenth percentile,
 * and the median.
 */
const ChannelRow = ({
  datum,
  dense,
  dim,
  frame,
  hero,
  k,
  onEnter,
  width,
}: RowProps) => {
  const y = frame.rowY(k);
  const median = datum.q[MEDIAN];
  const mx = hero ? Math.round(frame.x(median)) : crisp(frame.x(median));
  const deciles = datum.q.slice(1, -1).filter((_, j) => j + 1 !== MEDIAN);
  // The band's outer top-left pixel, and where its screen stops: on a whole
  // tile, a pixel or more clear of the right outline, so no dot is cut.
  const bx = Math.round(frame.x(datum.q[0]));
  const by = Math.round(y) - BAND_UP;
  const bandW = Math.round(frame.x(datum.q.at(-1) ?? 1)) - bx;
  const screenEnd =
    Math.floor((bandW - 3) / TEXTURE_PITCH.screen) * TEXTURE_PITCH.screen;
  return (
    <g className={dimClass(dim)} onPointerEnter={onEnter}>
      <rect
        className="fill-transparent"
        height={ROW}
        width={width}
        x={0}
        y={y - ROW / 2}
      />
      <text
        className={`t-label ${hero ? "" : "fill-muted"}`}
        dy="0.34em"
        x={0}
        y={y}
      >
        {datum.channel}
      </text>
      <g className="grow-x" style={stagger(k, "series")}>
        {/* The screen is pinned to the band's inside edge, not the svg. */}
        <g transform={`translate(${bx + 1} ${by + 1})`}>
          <rect
            className="fill-paper stroke-l5 shape-crisp"
            height={BAND_H - 1}
            strokeWidth={1}
            width={Math.max(1, bandW - 1)}
            x={-0.5}
            y={-0.5}
          />
          {densities(datum.q, frame.x).map((d, i) => {
            const a = Math.max(0, Math.round(frame.x(datum.q[i])) - bx - 1);
            const b = Math.min(
              screenEnd,
              Math.round(frame.x(datum.q[i + 1])) - bx - 1
            );
            return (
              <rect
                fill={paint(dense.tex(String(levelOf(d, dense.max))))}
                height={BAND_H - 2}
                key={`${datum.channel}-${LEVELS[i]}`}
                width={Math.max(0, b - a)}
                x={a}
                y={0}
              />
            );
          })}
        </g>
      </g>
      {deciles.map((v, j) => (
        <line
          className="pop stroke-l2 shape-crisp"
          key={`${datum.channel}-${v}`}
          strokeWidth={1}
          style={stagger(k * 10 + j, "fine")}
          x1={crisp(frame.x(v))}
          x2={crisp(frame.x(v))}
          y1={Math.round(y) - DECILE}
          y2={Math.round(y) + DECILE + 1}
        />
      ))}
      <line
        className={`pop shape-crisp ${hero ? "stroke-ink" : "stroke-l1"}`}
        strokeWidth={hero ? 2 : 1}
        style={stagger(k * 10 + 9, "fine")}
        x1={mx}
        x2={mx}
        y1={Math.round(y) - MEDIAN_H}
        y2={Math.round(y) + MEDIAN_H + 1}
      />
      <text
        className={`fade t-value ${hero ? "" : "fill-muted"}`}
        dy="0.34em"
        style={stagger(k + 4)}
        textAnchor="end"
        x={width}
        y={y}
      >
        {fmtDuration(median)}
      </text>
    </g>
  );
};

const tickMark = (half: number, tone: string) => (
  <line
    className={`shape-crisp ${tone}`}
    strokeWidth={1}
    x1={6.5}
    x2={6.5}
    y1={-half}
    y2={half}
  />
);

/** The key: median and decile ticks, and a swatch of the halftone. */
const keyItems = (tex: (name: string) => string) => [
  { label: "Median", mark: tickMark(6, "stroke-l1") },
  { label: "Deciles", mark: tickMark(4, "stroke-l2") },
  {
    label: "Tickets",
    mark: (
      <KeySwatch fill={paint(tex(String(DOT_R.length - 1)))} x={0} y={-6} />
    ),
  },
];

/** The halftone screens, one per dot size. */
const Screens = ({ tex }: { tex: (name: string) => string }) => (
  <defs>
    {DOT_R.map((r, i) => (
      <DotScreen
        ground="fill-paper"
        id={tex(String(i))}
        key={r}
        pitch={TEXTURE_PITCH.screen}
        r={r}
        tone="fill-l4"
      />
    ))}
  </defs>
);

interface ResponseTimeProps {
  data?: ChannelTimes[];
}

/**
 * O4 Response time. Each channel's first-response times as a comb on one
 * log scale: a tick at every tenth percentile over a halftone band whose
 * dots swell where tickets crowd. The fastest median is in ink.
 */
export const ResponseTime = (props: ResponseTimeProps) => {
  const data = props.data ?? responseTimes;
  const [hover, setHover] = useState<number | null>(null);
  const tex = useTextureIds("response-time");
  const medians = data.map((d) => d.q[MEDIAN]);
  const hero = medians.indexOf(Math.min(...medians));
  const floor = TOP + data.length * ROW;
  const height = floor + 26;
  const label = `First response by channel, median: ${data.map((d) => `${d.channel} ${fmtDuration(d.q[MEDIAN])}`).join(", ")}`;

  return (
    <Plot>
      {(width) => {
        const nameW = Math.max(...data.map((d) => sansWidth(d.channel, 12)));
        const valueW = Math.max(
          ...medians.map((m) => sansWidth(fmtDuration(m), 12))
        );
        const x1 = width - valueW - GAP;
        const frame: Frame = {
          rowY: (k) => TOP + k * ROW + ROW / 2,
          x: scaleLog()
            .domain(DOMAIN)
            .range([nameW + GAP, x1]),
          x1,
        };
        const ticks = width < 480 ? TICKS_NARROW : TICKS_WIDE;
        const max = Math.max(...data.flatMap((d) => densities(d.q, frame.x)));
        const tip = hover === null ? null : data[hover];
        return (
          <>
            <svg
              aria-label={label}
              height={height}
              onPointerLeave={() => {
                setHover(null);
              }}
              width={width}
            >
              <title>{label}</title>
              <Screens tex={tex} />
              <Key items={keyItems(tex)} right={width} y={8} />
              {ticks.map((t) => (
                <g key={t}>
                  <line
                    className="grid-line"
                    x1={crisp(frame.x(t))}
                    x2={crisp(frame.x(t))}
                    y1={TOP}
                    y2={floor}
                  />
                  <text
                    className="t-axis"
                    textAnchor="middle"
                    x={frame.x(t)}
                    y={floor + 18}
                  >
                    {fmtDuration(t)}
                  </text>
                </g>
              ))}
              {data.map((d, k) => (
                <ChannelRow
                  datum={d}
                  dense={{ max, tex }}
                  dim={hover !== null && hover !== k}
                  frame={frame}
                  hero={k === hero}
                  k={k}
                  key={d.channel}
                  onEnter={() => {
                    setHover(k);
                  }}
                  width={width}
                />
              ))}
            </svg>
            {tip === null || hover === null ? null : (
              <Tooltip
                x={frame.x(tip.q[MEDIAN])}
                y={frame.rowY(hover) - MEDIAN_H - 2}
              >
                <b>{tip.channel}</b> · median {fmtDuration(tip.q[MEDIAN])} · p90{" "}
                {fmtDuration(tip.q[9])}
              </Tooltip>
            )}
          </>
        );
      }}
    </Plot>
  );
};
