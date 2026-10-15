import { scaleBand, scaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { chunkyBarsDemo } from "./chunky-bars.data";
import type { ChunkyDatum } from "./chunky-bars.data";
import { BAR_RADIUS, barPath, rankTones } from "./util-a";

interface ChunkyBarsProps {
  data?: ChunkyDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Footnote under the labels. */
  note?: string;
  /** Index of the bar to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

interface BarMarkProps {
  bw: number;
  cx: number;
  floor: number;
  /** Pattern id of the hatch fill. */
  hatch: string;
  hero: boolean;
  i: number;
  top: number;
}

/** The hero bar in solid ink; any other bar hatched inside a crisp 1px outline. */
const BarMark = (p: BarMarkProps) =>
  p.hero ? (
    <path
      className="grow-y fill-hero"
      style={stagger(p.i, "series")}
      d={barPath(p.cx - p.bw / 2, p.top, p.bw, p.floor - p.top, "up")}
    />
  ) : (
    <rect
      className="grow-y stroke-l5 shape-crisp"
      style={stagger(p.i, "series")}
      x={crisp(p.cx - p.bw / 2)}
      y={crisp(p.top)}
      width={Math.round(p.bw) - 1}
      height={Math.round(p.floor) - Math.round(p.top)}
      rx={BAR_RADIUS}
      fill={paint(p.hatch)}
      strokeWidth={1}
    />
  );

/** The data is in pence: 477 reads £4.77. */
const defaultFormat = (v: number) => `£${(v / 100).toFixed(2)}`;

/**
 * G3 A pint over time. A handful of wide bars, squared off with a 2px corner,
 * standing on a hairline baseline with the value above each. The leader is
 * solid ink; the rest are engraved: 45° hatching in one grey inside a crisp
 * 1px outline.
 */
export const ChunkyBars = (props: ChunkyBarsProps) => {
  const data = props.data ?? chunkyBarsDemo;
  const height = props.height ?? 400;
  const format = props.format ?? defaultFormat;
  const [tip, setTip] = useState<Tip | null>(null);
  const tex = useTextureIds("bars");
  const hatch = tex("hatch");
  // The leader in ink, every other bar engraved in one grey.
  const tones = rankTones(
    data.map((d) => d.value),
    [0, 4]
  );
  const label = data.map((d) => `${d.label} ${format(d.value)}`).join(", ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 460;
        const m = {
          bottom: 34 + noteSpace(props.note, width - 16, 18),
          left: 8,
          right: 8,
          top: 40,
        };
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.left, width - m.right])
          .paddingInner(narrow ? 0.38 : 0.58)
          .paddingOuter(0.25);
        const bw = Math.min(x.bandwidth(), 96);
        const floor = height - m.bottom;
        const y = scaleLinear()
          .domain([0, Math.max(...data.map((d) => d.value))])
          .range([floor, m.top]);

        return (
          <svg
            width={width}
            height={height}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={hatch} tone="fill-l4" />
            </defs>
            {data.map((d, i) => {
              const cx = (x(i) ?? 0) + x.bandwidth() / 2;
              const top = y(d.value);
              return (
                <g
                  key={d.label}
                  className={dimClass(tip !== null && tip.i !== i)}
                  onPointerEnter={() => {
                    setTip({ i, x: cx, y: top - 34 });
                  }}
                >
                  <rect
                    x={cx - bw / 2 - 8}
                    y={m.top - 36}
                    width={bw + 16}
                    height={floor - m.top + 60}
                    fill="transparent"
                  />
                  <BarMark
                    bw={bw}
                    cx={cx}
                    floor={floor}
                    hatch={hatch}
                    hero={tones[i] === 0 || props.highlight === i}
                    i={i}
                    top={top}
                  />
                  <text
                    className={`fade t-value ${tones[i] === 0 ? "" : "fill-muted"}`}
                    style={stagger(i + 3, "series")}
                    x={cx}
                    y={top - 10}
                    textAnchor="middle"
                  >
                    {format(d.value)}
                  </text>
                  <text
                    className="t-label fill-muted"
                    x={cx}
                    y={floor + 20}
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                </g>
              );
            })}
            <line
              className="hairline"
              x1={m.left}
              x2={width - m.right}
              y1={crisp(floor)}
              y2={crisp(floor)}
            />
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
