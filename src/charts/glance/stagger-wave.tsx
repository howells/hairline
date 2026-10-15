import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { utcFormat } from "d3-time-format";
import { useState } from "react";

import { fmtInt } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { staggerWaveDemo } from "./stagger-wave.data";
import type { WaveDatum } from "./stagger-wave.data";
import { barPath, labelRoom } from "./util-a";

interface StaggerWaveProps {
  data?: WaveDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the bar to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

interface WaveBarProps {
  bw: number;
  floor: number;
  /** Pattern id of the hatch fill. */
  hatch: string;
  hero: boolean;
  i: number;
  left: number;
  top: number;
}

/** The peak in solid ink; every other bar hatched inside a crisp outline. */
const WaveBar = (p: WaveBarProps) =>
  p.hero ? (
    <path
      className="grow-y fill-hero"
      style={stagger(p.i, "fine")}
      d={barPath(p.left, p.top, p.bw, p.floor - p.top, "up")}
    />
  ) : (
    <path
      className="grow-y stroke-l5 shape-crisp"
      style={stagger(p.i, "fine")}
      d={barPath(
        crisp(p.left),
        crisp(p.top),
        Math.round(p.bw) - 1,
        Math.round(p.floor) - Math.round(p.top),
        "up"
      )}
      fill={paint(p.hatch)}
      strokeWidth={1}
    />
  );

/** Gridlines with their values: a hairline at zero, the grid above it. */
const YGrid = (p: {
  format: (v: number) => string;
  left: number;
  right: number;
  y: ScaleLinear<number, number>;
}) => (
  <g>
    {p.y.ticks(6).map((t) => (
      <g key={t}>
        <line
          className={t === 0 ? "hairline" : "grid-line"}
          x1={p.left}
          x2={p.right}
          y1={crisp(p.y(t))}
          y2={crisp(p.y(t))}
        />
        <text
          className="t-axis"
          x={p.left - 10}
          y={p.y(t)}
          dy="0.35em"
          textAnchor="end"
        >
          {p.format(t)}
        </text>
      </g>
    ))}
  </g>
);

const dayMonth = utcFormat("%-d %b");
const dayOnly = utcFormat("%-d");
const weekday = utcFormat("%a %-d %b");

/**
 * Week ticks in the broadsheet style: the month is printed on the first tick
 * and wherever it changes ("2 Nov · 9 · 16 · 23 · 30 · 7 Dec · 14").
 */
const dayTickLabels = (dates: Date[]) =>
  dates.map((d, i) => {
    const prev = dates[i - 1];
    return prev === undefined || prev.getUTCMonth() !== d.getUTCMonth()
      ? dayMonth(d)
      : dayOnly(d);
  });

const defaultFormat = (v: number) => fmtInt(v);
const axisFormat = (v: number) => (v === 0 ? "0" : `${v / 1000}k`);

/** Room for the value labels, flush left of the plot. */
const axisRoom = (ticks: number[]) =>
  labelRoom(ticks.map(axisFormat), "t-axis") + 10;

/**
 * G12 Daily sign-ups. Thirty to sixty narrow bars, one a day, squared off with a 2px
 * corner, that enter as a wave, left to right. The peak (or the highlight)
 * is solid ink; every other bar is hatched inside a crisp 1px outline. The
 * card's Replay re-runs it.
 */
export const StaggerWave = (props: StaggerWaveProps) => {
  const data = props.data ?? staggerWaveDemo;
  const height = props.height ?? 340;
  const format = props.format ?? defaultFormat;
  const [tip, setTip] = useState<Tip | null>(null);
  const max = Math.max(...data.map((d) => d.value));
  const heroIndex = props.highlight ?? data.findIndex((d) => d.value === max);
  const tex = useTextureIds("wave");
  const hatch = tex("hatch");
  const label = `Sign-ups a day over ${data.length} days, from ${format(Math.min(...data.map((d) => d.value)))} to ${format(max)}.`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{weekday(data[tip.i].date)}</b> · {format(data[tip.i].value)}{" "}
            sign-ups
          </Tooltip>
        )
      }
    >
      {(width) => {
        const bottom = 24 + noteSpace(props.note, width - 16, 16);
        const floor = height - bottom;
        const y = scaleLinear().domain([0, max]).nice(6).range([floor, 8]);
        const m = { bottom, left: axisRoom(y.ticks(6)), right: 0, top: 8 };
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.left, width - m.right])
          .paddingInner(width < 460 ? 0.25 : 0.32)
          .paddingOuter(0.1);
        const bw = x.bandwidth();
        // Mondays: every week on a wide plot, every other week on a phone.
        const every = width < 460 ? 14 : 7;
        const ticks = data.flatMap((d, i) =>
          i % every === 0 ? [{ d, i }] : []
        );
        const tickLabels = dayTickLabels(ticks.map((t) => t.d.date));

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
            <YGrid
              format={axisFormat}
              left={m.left}
              right={width - m.right}
              y={y}
            />
            <g>
              {data.map((d, i) => {
                const left = x(i) ?? 0;
                const top = y(d.value);
                return (
                  <g
                    key={d.date.toISOString()}
                    className={dimClass(tip !== null && tip.i !== i)}
                    onPointerEnter={() => {
                      setTip({ i, x: left + bw / 2, y: top - 4 });
                    }}
                  >
                    <rect
                      x={left - (x.step() - bw) / 2}
                      y={m.top}
                      width={x.step()}
                      height={floor - m.top}
                      fill="transparent"
                    />
                    {/* The wave: grow-y re-timed to overshoot and settle, 32ms after its left neighbour. */}
                    <WaveBar
                      bw={bw}
                      floor={floor}
                      hatch={hatch}
                      hero={heroIndex === i}
                      i={i}
                      left={left}
                      top={top}
                    />
                  </g>
                );
              })}
            </g>
            {ticks.map((t, k) => (
              <text
                key={t.d.date.toISOString()}
                className="t-axis"
                x={(x(t.i) ?? 0) + bw / 2}
                y={floor + 16}
                textAnchor={k === 0 ? "start" : "middle"}
                dx={k === 0 ? -bw / 2 : 0}
              >
                {tickLabels[k]}
              </text>
            ))}
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
