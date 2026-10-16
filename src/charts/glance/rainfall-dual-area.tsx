import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import { useState } from "react";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtDay } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { Ring } from "../markers";
import { PlotNote } from "../plot-note";
import { Hatch, Rules } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger } from "../util";
import { rainfallDemo } from "./rainfall-dual-area.data";
import type { RainfallDatum } from "./rainfall-dual-area.data";
import { barPath, labelRoom } from "./util-a";

interface RainfallDualAreaProps {
  data?: RainfallDatum[];
  height?: number;
  formatInput?: (v: number) => string;
  formatOutput?: (v: number) => string;
  /** Names for the two series, used in the tooltip. */
  inputName?: string;
  outputName?: string;
  note?: string;
}

interface Frame {
  data: RainfallDatum[];
  x: ScaleBand<number>;
  cx: (i: number) => number;
  yIn: ScaleLinear<number, number>;
  yOut: ScaleLinear<number, number>;
  inTicks: number[];
  top: number;
  floor: number;
  left: number;
  right: number;
  hover: number | null;
  /** Pattern id by name. */
  tex: (name: string) => string;
}

/** Rain is in millimetres, river flow in cubic metres a second. */
const defaultIn = (v: number) => `${v} mm`;
const defaultOut = (v: number) => `${v} m³/s`;

/** About four friendly steps on the hanging scale, from 0 to a round floor. */
const inputTicks = (max: number) =>
  scaleLinear().domain([0, max]).nice(4).ticks(4);

/** Labelled steps on the hanging scale: the top, the middle and the deepest. */
const rainLabels = (ticks: number[]) =>
  ticks.filter(
    (_, k) =>
      k === 0 || k === Math.floor(ticks.length / 2) || k === ticks.length - 1
  );

/** Rain bars hanging from a hairline top rule. */
const Rain = ({ f, fmt }: { f: Frame; fmt: (v: number) => string }) => {
  const bw = f.x.bandwidth();
  return (
    <g>
      {rainLabels(f.inTicks).map((v) => (
        <text
          key={v}
          className="t-axis"
          x={f.left - 10}
          y={f.yIn(v)}
          dy="0.35em"
          textAnchor="end"
        >
          {fmt(v)}
        </text>
      ))}
      {f.data.map((d, i) =>
        d.input > 0 ? (
          <path
            key={d.date.toISOString()}
            className={`grow-y from-top transition-opacity ${f.hover === i ? "fill-l2 stroke-l2" : "stroke-l5"} shape-crisp ${f.hover !== null && f.hover !== i ? "opacity-30" : ""}`}
            style={stagger(i, "mark")}
            d={barPath(
              crisp(f.cx(i) - bw / 2),
              crisp(f.top),
              Math.round(bw) - 1,
              Math.round(f.yIn(d.input)) - Math.round(f.top),
              "down"
            )}
            fill={f.hover === i ? undefined : paint(f.tex("hatch"))}
            strokeWidth={1}
          />
        ) : null
      )}
      <line
        className="hairline"
        x1={f.left}
        x2={f.right}
        y1={crisp(f.top)}
        y2={crisp(f.top)}
      />
    </g>
  );
};

const Flow = ({
  f,
  fmt,
  clip,
  narrow,
}: {
  f: Frame;
  fmt: (v: number) => string;
  clip: string;
  narrow: boolean;
}) => {
  const lineGen = line<RainfallDatum>()
    .x((_, i) => f.cx(i))
    .y((d) => f.yOut(d.output))
    .curve(curveMonotoneX);
  const areaGen = area<RainfallDatum>()
    .x((_, i) => f.cx(i))
    .y0(f.floor)
    .y1((d) => f.yOut(d.output))
    .curve(curveMonotoneX);
  // Every third day on a wide plot, every sixth on a phone; the month printed
  // on the first tick and where it changes.
  const every = narrow ? 6 : 3;
  const ticks = f.data.flatMap((d, i) => (i % every === 0 ? [{ d, i }] : []));
  const tickLabels = dayTickLabels(ticks.map((t) => t.d.date));
  return (
    <g>
      <path
        fill={paint(f.tex("rule"))}
        clipPath={`url(#${clip})`}
        d={areaGen(f.data) ?? ""}
      />
      {f.yOut.ticks(narrow ? 4 : 6).map((v) => (
        <g key={v}>
          <line
            className={v === 0 ? "hairline" : "grid-line"}
            x1={f.left}
            x2={f.right}
            y1={crisp(f.yOut(v))}
            y2={crisp(f.yOut(v))}
          />
          <text
            className="t-axis"
            x={f.left - 10}
            y={f.yOut(v)}
            dy="0.35em"
            textAnchor="end"
          >
            {fmt(v)}
          </text>
        </g>
      ))}
      <g clipPath={`url(#${clip})`}>
        <path
          className="stroke-ink"
          d={lineGen(f.data) ?? ""}
          fill="none"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
      {ticks.map((t, k) => (
        <text
          key={t.d.date.toISOString()}
          className="t-axis"
          x={f.cx(t.i)}
          y={f.floor + 16}
          textAnchor={k === 0 ? "start" : "middle"}
          dx={k === 0 ? -f.x.bandwidth() / 2 : 0}
        >
          {tickLabels[k]}
        </text>
      ))}
    </g>
  );
};

/** The scrub cursor: a hairline drop from the day's rain to the floor, ringed at the river. */
const Cursor = (p: { datum: RainfallDatum; f: Frame; i: number }) => (
  <g pointerEvents="none">
    <line
      className="stroke-muted shape-crisp"
      x1={crisp(p.f.cx(p.i))}
      x2={crisp(p.f.cx(p.i))}
      y1={Math.round(p.f.yIn(p.datum.input) + 4)}
      y2={p.f.floor}
      strokeWidth={1}
    />
    <Ring
      className="stroke-ink"
      cx={p.f.cx(p.i)}
      cy={p.f.yOut(p.datum.output)}
      size="md"
      weight="cursor"
    />
  </g>
);

/**
 * G8 Rain and river. Hatched input bars hang from a hairline top rule like
 * rain (millimetres a day); the output rises below as an area engraved in fine
 * horizontal rules (river flow) under a 2px ink line. Two scales, stacked, one
 * shared time axis. Scrub to read a day.
 */
export const RainfallDualArea = (props: RainfallDualAreaProps) => {
  const data = props.data ?? rainfallDemo;
  const height = props.height ?? 420;
  const fIn = props.formatInput ?? defaultIn;
  const fOut = props.formatOutput ?? defaultOut;
  const inName = props.inputName ?? "rain";
  const outName = props.outputName ?? "flow";
  const tex = useTextureIds("rain");
  const [hover, setHover] = useState<number | null>(null);
  const last = data.at(-1);
  const label = `${inName} hanging from the top and ${outName} rising below over ${data.length} days${last === undefined ? "" : `; last: ${fIn(last.input)}, ${fOut(last.output)}`}`;

  return (
    <Plot>
      {(width) => {
        // Room for the widest axis label on either scale.
        const [, outTop = 1] = scaleLinear()
          .domain([0, Math.max(...data.map((d) => d.output))])
          .nice(6)
          .domain();
        const inTop = inputTicks(Math.max(...data.map((d) => d.input))).at(-1);
        const m = {
          bottom: 24 + noteSpace(props.note, width - 16, 20),
          left: labelRoom([fIn(inTop ?? 0), fOut(outTop)], "t-axis") + 12,
          right: 0,
          top: 6,
        };
        const innerH = height - m.top - m.bottom;
        const floor = height - m.bottom;
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([m.left, width - m.right])
          .paddingInner(0.42)
          .paddingOuter(0.1);
        const cx = (i: number) => (x(i) ?? 0) + x.bandwidth() / 2;
        const inTicks = inputTicks(Math.max(...data.map((d) => d.input)));
        const f: Frame = {
          cx,
          data,
          floor,
          hover,
          inTicks,
          left: m.left,
          right: width - m.right,
          tex,
          top: m.top,
          x,
          yIn: scaleLinear()
            .domain([0, inTicks.at(-1) ?? 1])
            .range([m.top, m.top + innerH * 0.3]),
          yOut: scaleLinear()
            .domain([0, Math.max(...data.map((d) => d.output))])
            .range([floor, m.top + innerH * 0.4])
            .nice(6),
        };
        const move = (e: PointerEvent<SVGSVGElement>) => {
          const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
          const i = Math.round((px - cx(0)) / x.step());
          setHover(Math.max(0, Math.min(data.length - 1, i)));
        };
        const h = hover === null ? undefined : data[hover];

        return (
          <div className="relative">
            <svg
              className="touch-pan-y"
              width={width}
              height={height}
              aria-label={label}
              onPointerMove={move}
              onPointerLeave={() => {
                setHover(null);
              }}
            >
              <title>{label}</title>
              <defs>
                <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l4" />
                <Rules ground="fill-paper" id={tex("rule")} tone="fill-l5" />
                <clipPath id={tex("sweep")}>
                  <rect
                    className="sweep"
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                  />
                </clipPath>
              </defs>
              <Rain f={f} fmt={fIn} />
              <Flow f={f} fmt={fOut} clip={tex("sweep")} narrow={width < 460} />
              {hover !== null && h !== undefined ? (
                <Cursor datum={h} f={f} i={hover} />
              ) : null}
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={height - 6}
              />
            </svg>
            {hover !== null && h !== undefined ? (
              <Tooltip x={cx(hover)} y={f.yOut(h.output) - 8}>
                <b>{fmtDay(h.date)}</b> · {fIn(h.input)} {inName} ·{" "}
                {fOut(h.output)} {outName}
              </Tooltip>
            ) : null}
          </div>
        );
      }}
    </Plot>
  );
};
