import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { utcFormat } from "d3-time-format";

import { fmtDegC } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Bar } from "../markers";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { cx, noteSpace, stagger } from "../util";
import { staggerWaveDemo } from "./stagger-wave.data";
import type { WaveDatum } from "./stagger-wave.data";
import { labelRoom } from "./util-a";

interface StaggerWaveProps {
  data?: WaveDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the bar to draw in the hero colour. */
  highlight?: number;
}

interface WaveBarProps {
  bw: number;
  /** Where the bar stands: the zero line. */
  zero: number;
  /** Pattern id of the hatch fill. */
  hatch: string;
  hero: boolean;
  i: number;
  left: number;
  top: number;
}

/**
 * The extreme in solid ink; every other bar hatched inside a crisp outline.
 * A bar stands up from the zero line for a positive value, down for a
 * negative one.
 */
const WaveBar = (p: WaveBarProps) => {
  const up = p.top <= p.zero;
  return (
    <Bar
      className={cx("grow-y", up ? null : "from-top", p.hero && "fill-hero")}
      dir={up ? "up" : "down"}
      fill={p.hero ? undefined : paint(p.hatch)}
      h={up ? p.zero - p.top : p.top - p.zero}
      style={stagger(p.i, "fine")}
      w={p.bw}
      x={p.left}
      y={up ? p.top : p.zero}
    />
  );
};

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
        <HRule
          kind={t === 0 ? "hairline" : "grid"}
          x0={p.left}
          x1={p.right}
          y={p.y(t)}
        />
        <Label anchor="end" dy="0.35em" voice="axis" x={p.left - 10} y={p.y(t)}>
          {p.format(t)}
        </Label>
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

const defaultFormat = (v: number) => fmtDegC(v);
const axisFormat = (v: number) => `${v < 0 ? "−" : ""}${Math.abs(v)} °C`;

/** Room for the value labels, flush left of the plot. */
const axisRoom = (ticks: number[]) =>
  labelRoom(ticks.map(axisFormat), "t-axis") + 10;

/** Day labels under the bars; the first is set flush with its bar's left edge. */
const DayTicks = (props: {
  bw: number;
  labels: string[];
  ticks: { at: number; d: WaveDatum }[];
  y: number;
}) =>
  props.ticks.map((t, k) => (
    <Label
      anchor={k === 0 ? "start" : "middle"}
      dx={k === 0 ? -props.bw / 2 : 0}
      key={t.d.date.toISOString()}
      voice="axis"
      x={t.at + props.bw / 2}
      y={props.y}
    >
      {props.labels[k]}
    </Label>
  ));

/**
 * G12 Cold December. Thirty to sixty narrow bars, one a day, squared off with
 * a 2px corner, that enter as a wave, left to right. Bars stand on a zero
 * line: up for a positive value, down for a negative one. The peak (or the
 * highlight) is solid ink; every other bar is hatched inside a crisp 1px
 * outline. The card's Replay re-runs it.
 */
export const StaggerWave = (props: StaggerWaveProps) => {
  const data = props.data ?? staggerWaveDemo;
  const height = props.height ?? 340;
  const format = props.format ?? defaultFormat;
  const hover = useHover<number>();
  const max = Math.max(...data.map((d) => d.value));
  const heroIndex = props.highlight ?? data.findIndex((d) => d.value === max);
  const tex = useTextureIds("wave");
  const hatch = tex("hatch");
  const lowest = Math.min(...data.map((d) => d.value));
  const label = `Daily mean temperature over ${data.length} days, from ${format(lowest)} to ${format(max)}.`;

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[format(data[hover.at.key].value)]}
              lead={weekday(data[hover.at.key].date)}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const bottom = 24 + noteSpace(props.note, width - 16, 16);
        const floor = height - bottom;
        const y = scaleLinear()
          .domain([Math.min(0, lowest), Math.max(0, max)])
          .nice(6)
          .range([floor, 8]);
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
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={hatch} tone="fill-l4" />
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
                const zero = y(0);
                return (
                  <DimGroup
                    key={d.date.toISOString()}
                    dim={hover.dim(i)}
                    onPointerEnter={() => {
                      hover.show(i, left + bw / 2, Math.min(top, zero) - 4);
                    }}
                  >
                    <HitRect
                      x={left - (x.step() - bw) / 2}
                      y={m.top}
                      width={x.step()}
                      height={floor - m.top}
                    />
                    {/* The wave: grow-y re-timed to overshoot and settle, 32ms after its left neighbour. */}
                    <WaveBar
                      bw={bw}
                      zero={zero}
                      hatch={hatch}
                      hero={heroIndex === i}
                      i={i}
                      left={left}
                      top={top}
                    />
                  </DimGroup>
                );
              })}
            </g>
            <DayTicks
              bw={bw}
              labels={tickLabels}
              ticks={ticks.map((t) => ({ at: x(t.i) ?? 0, d: t.d }))}
              y={floor + 16}
            />
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
