import { scaleBand, scaleLinear } from "d3-scale";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { area, curveMonotoneX, line } from "d3-shape";
import type { PointerEvent } from "react";

import { dayTickLabels, fmtDay } from "../../lib/format";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { TipText } from "../hover";
import { Ring } from "../markers";
import { FootNote } from "../plot-note";
import { HRule, Stem } from "../rules";
import { barPath } from "../shapes";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch, Rules } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger } from "../util";
import { rainfallDemo } from "./rainfall-dual-area.data";
import type { RainfallDatum } from "./rainfall-dual-area.data";
import { labelRoom } from "./util-a";

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
        <Label
          anchor="end"
          dy="0.35em"
          key={v}
          voice="axis"
          x={f.left - 10}
          y={f.yIn(v)}
        >
          {fmt(v)}
        </Label>
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
      <HRule x0={f.left} x1={f.right} y={f.top} />
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
          <HRule
            kind={v === 0 ? "hairline" : "grid"}
            x0={f.left}
            x1={f.right}
            y={f.yOut(v)}
          />
          <Label
            anchor="end"
            dy="0.35em"
            voice="axis"
            x={f.left - 10}
            y={f.yOut(v)}
          >
            {fmt(v)}
          </Label>
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
        <Label
          anchor={k === 0 ? "start" : "middle"}
          dx={k === 0 ? -f.x.bandwidth() / 2 : 0}
          key={t.d.date.toISOString()}
          voice="axis"
          x={f.cx(t.i)}
          y={f.floor + 16}
        >
          {tickLabels[k]}
        </Label>
      ))}
    </g>
  );
};

/** The scrub cursor: a hairline drop from the day's rain to the floor, ringed at the river. */
const Cursor = (p: { datum: RainfallDatum; f: Frame; i: number }) => (
  <g pointerEvents="none">
    <Stem
      className="stroke-muted"
      x={p.f.cx(p.i)}
      y0={Math.round(p.f.yIn(p.datum.input) + 4)}
      y1={p.f.floor}
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
  const hover = useHover<number>();
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
          hover: hover.key,
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
          hover.show(Math.max(0, Math.min(data.length - 1, i)));
        };
        const h = hover.key === null ? undefined : data[hover.key];

        return (
          <div className="relative">
            <ChartSvg
              className="touch-pan-y"
              height={height}
              label={label}
              leave={hover.clear}
              onPointerMove={move}
              width={width}
            >
              <defs>
                <Hatch id={tex("hatch")} tone="fill-l4" />
                <Rules id={tex("rule")} tone="fill-l5" />
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
              {hover.key !== null && h !== undefined ? (
                <Cursor datum={h} f={f} i={hover.key} />
              ) : null}
              <FootNote height={height} text={props.note} width={width} />
            </ChartSvg>
            {hover.key !== null && h !== undefined ? (
              <Tooltip x={cx(hover.key)} y={f.yOut(h.output) - 8}>
                <TipText
                  facts={[
                    `${fIn(h.input)} ${inName}`,
                    `${fOut(h.output)} ${outName}`,
                  ]}
                  lead={fmtDay(h.date)}
                />
              </Tooltip>
            ) : null}
          </div>
        );
      }}
    </Plot>
  );
};
