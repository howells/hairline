import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { MARK_WEIGHT } from "../marks";
import { Stem, VRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DotScreen, KeySwatch } from "../texture";
import {
  HALFTONE_R,
  paint,
  TEXTURE_PITCH,
  useTextureIds,
} from "../texture-ids";
import { sansWidth, stagger } from "../util";
import { fmtPercent } from "./format";
import { Key } from "./key";
import { LEVELS, MEDIAN, responseTimes } from "./response-time.data";
import type { ChannelTimes } from "./response-time.data";

const TOP = 30;
/** One party per row: a 44px-plus touch row. */
const ROW = 80;
const GAP = 16;
const DECILE = 14;
const MEDIAN_H = 18;
const DOMAIN: [number, number] = [0, 60];
/** The halftone: the shared ladder's dot sizes, largest where constituencies crowd. */
const DOT_R = HALFTONE_R;
/**
 * The band, centred on its row: 21px inside the outline, a whole number of
 * screen tiles and one, so the dots sit as far from the bottom as the top.
 */
const BAND_UP = 11;
const BAND_H = 23;
const TICKS_WIDE = [0, 10, 20, 30, 40, 50, 60];
const TICKS_NARROW = [0, 20, 40, 60];

interface Frame {
  rowY: (k: number) => number;
  x: ScaleLinear<number, number>;
  x1: number;
}

/** Share of constituencies per pixel in each step between kept percentiles. */
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
 * One party: name, a halftone band from the 5th to the 95th percentile
 * whose dots grow where constituencies crowd, a tick at every tenth percentile,
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
  const deciles = datum.q.slice(1, -1).filter((_, j) => j + 1 !== MEDIAN);
  // The band's outer top-left pixel, and where its screen stops: on a whole
  // tile, a pixel or more clear of the right outline, so no dot is cut.
  const bx = Math.round(frame.x(datum.q[0]));
  const by = Math.round(y) - BAND_UP;
  const bandW = Math.round(frame.x(datum.q.at(-1) ?? 1)) - bx;
  const screenEnd =
    Math.floor((bandW - 3) / TEXTURE_PITCH.screen) * TEXTURE_PITCH.screen;
  return (
    <DimGroup dim={dim} onPointerEnter={onEnter}>
      <HitRect height={ROW} width={width} x={0} y={y - ROW / 2} />
      <Label middle muted={!hero} voice="label" x={0} y={y}>
        {datum.channel}
      </Label>
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
        <Stem
          className="pop stroke-l2"
          key={`${datum.channel}-${v}`}
          style={stagger(k * 10 + j, "fine")}
          x={frame.x(v)}
          y0={Math.round(y) - DECILE}
          y1={Math.round(y) + DECILE + 1}
        />
      ))}
      <Stem
        className={`pop ${hero ? "stroke-ink" : "stroke-l1"}`}
        hero
        style={stagger(k * 10 + 9, "fine")}
        x={frame.x(median)}
        y0={Math.round(y) - MEDIAN_H}
        y1={Math.round(y) + MEDIAN_H + 1}
      />
      <Label
        anchor="end"
        middle
        muted={!hero}
        order={k + 4}
        voice="value"
        x={width}
        y={y}
      >
        {fmtPercent(median)}
      </Label>
    </DimGroup>
  );
};

const tickMark = (half: number, tone: string, weight: number) => (
  <Stem
    className={tone}
    hero={weight === MARK_WEIGHT}
    x={6}
    y0={-half}
    y1={half}
  />
);

/** The key: median and decile ticks, and a swatch of the halftone. */
const keyItems = (tex: (name: string) => string) => [
  { label: "Median", mark: tickMark(6, "stroke-l1", MARK_WEIGHT) },
  { label: "Deciles", mark: tickMark(4, "stroke-l2", 1) },
  {
    label: "Seats",
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
 * O4 Vote share. Each party's constituency vote shares as a comb on one
 * percentage scale: a tick at every tenth percentile over a halftone band
 * whose dots swell where constituencies crowd. The highest median is in ink.
 */
export const ResponseTime = (props: ResponseTimeProps) => {
  const data = props.data ?? responseTimes;
  const hover = useHover<number>();
  const tex = useTextureIds("response-time");
  const medians = data.map((d) => d.q[MEDIAN]);
  const hero = medians.indexOf(Math.max(...medians));
  const floor = TOP + data.length * ROW;
  const height = floor + 26;
  const label = `Vote share by constituency at the 2024 general election, median: ${data.map((d) => `${d.channel} ${fmtPercent(d.q[MEDIAN])}`).join(", ")}`;

  return (
    <Plot>
      {(width) => {
        const nameW = Math.max(...data.map((d) => sansWidth(d.channel, 12)));
        const valueW = Math.max(
          ...medians.map((m) => sansWidth(fmtPercent(m), 12))
        );
        const x1 = width - valueW - GAP;
        const frame: Frame = {
          rowY: (k) => TOP + k * ROW + ROW / 2,
          x: scaleLinear()
            .domain(DOMAIN)
            .range([nameW + GAP, x1]),
          x1,
        };
        const ticks = width < 480 ? TICKS_NARROW : TICKS_WIDE;
        const max = Math.max(...data.flatMap((d) => densities(d.q, frame.x)));
        const tip = hover.key === null ? null : data[hover.key];
        return (
          <>
            <ChartSvg
              height={height}
              label={label}
              leave={hover.clear}
              width={width}
            >
              <Screens tex={tex} />
              <Key items={keyItems(tex)} right={width} y={8} />
              {ticks.map((t) => (
                <g key={t}>
                  <VRule kind="grid" x={frame.x(t)} y0={TOP} y1={floor} />
                  <Label
                    anchor="middle"
                    voice="axis"
                    x={frame.x(t)}
                    y={floor + 18}
                  >
                    {fmtPercent(t)}
                  </Label>
                </g>
              ))}
              {data.map((d, k) => (
                <ChannelRow
                  datum={d}
                  dense={{ max, tex }}
                  dim={hover.dim(k)}
                  frame={frame}
                  hero={k === hero}
                  k={k}
                  key={d.channel}
                  onEnter={() => {
                    hover.show(k);
                  }}
                  width={width}
                />
              ))}
            </ChartSvg>
            {tip === null || hover.key === null ? null : (
              <Tooltip
                x={frame.x(tip.q[MEDIAN])}
                y={frame.rowY(hover.key) - MEDIAN_H - 2}
              >
                <TipText
                  facts={[
                    `median ${fmtPercent(tip.q[MEDIAN])}`,
                    `one in ten above ${fmtPercent(tip.q[9])}`,
                  ]}
                  lead={tip.channel}
                />
              </Tooltip>
            )}
          </>
        );
      }}
    </Plot>
  );
};
