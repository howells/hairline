import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DottedLine } from "../texture";
import { dimClass, stagger } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { binMedian, rungHistogramDemo } from "./rung-histogram.data";
import type { HistBin } from "./rung-histogram.data";
import { Rungs } from "./rungs";
import { isActive, maxIndex } from "./util-b";
import type { Tip } from "./util-b";

interface RungHistogramProps {
  data?: HistBin[];
  format?: (v: number) => string;
  /** Formats bin edges on the axis, e.g. 4 → "4h". */
  formatX?: (v: number) => string;
  height?: number;
  /** Label every nth bin edge. */
  labelEvery?: number;
  /** The marker's position; defaults to the median. Pass null to hide it. */
  marker?: number | null;
  markerLabel?: string;
  note?: string;
  /** Records per rung. */
  unit?: number;
}

interface Layout {
  floor: number;
  pitch: number;
  plotW: number;
  top: number;
  x: ScaleLinear<number, number>;
  x0: number;
}

const buildLayout = (
  width: number,
  height: number,
  data: HistBin[],
  unit: number,
  hasNote: boolean
): Layout => {
  const top = 34;
  const plotW = Math.min(width - 36, data.length * 58);
  const x0 = (width - plotW) / 2;
  const floor = Math.round(height - (hasNote ? 66 : 36));
  const maxRungs = Math.max(1, ...data.map((d) => Math.round(d.count / unit)));
  const lo = data[0]?.x0 ?? 0;
  const hi = data.at(-1)?.x1 ?? 1;
  return {
    floor,
    // The tallest bin reaches the top: rungs spread to fill the height given.
    pitch: rungPitch(floor - top - 6, maxRungs, 18),
    plotW,
    top,
    x: scaleLinear()
      .domain([lo, hi])
      .range([x0, x0 + plotW]),
    x0,
  };
};

const Axis = (props: {
  data: HistBin[];
  every: number;
  formatX: (v: number) => string;
  layout: Layout;
}) => {
  const { layout } = props;
  const last = props.data.at(-1);
  const edges = [
    ...props.data.map((d) => d.x0),
    ...(last === undefined ? [] : [last.x1]),
  ];
  const step = Math.max(
    1,
    props.every * (layout.plotW / props.data.length < 34 ? 2 : 1)
  );
  const y = layout.floor + 4;
  return (
    <g>
      <line
        className="hairline"
        x1={Math.round(layout.x0 - 8)}
        x2={Math.round(layout.x0 + layout.plotW + 8)}
        y1={crisp(y)}
        y2={crisp(y)}
      />
      {edges.map((e, k) => (
        <g key={e}>
          <line
            className="hairline"
            x1={crisp(layout.x(e))}
            x2={crisp(layout.x(e))}
            y1={y + 1}
            y2={y + (k % step === 0 ? 7 : 4)}
          />
          {k % step === 0 ? (
            <text
              className="t-axis"
              textAnchor="middle"
              x={layout.x(e)}
              y={layout.floor + 30}
            >
              {props.formatX(e)}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
};

interface BinProps {
  bin: HistBin;
  format: (v: number) => string;
  hover: number | null;
  index: number;
  layout: Layout;
  onHover: (tip: Tip<HistBin>) => void;
  peak: boolean;
  unit: number;
}

const Bin = (props: BinProps) => {
  const { bin, layout, index } = props;
  const count = Math.round(bin.count / props.unit);
  const left = layout.x(bin.x0);
  const bw = layout.x(bin.x1) - left;
  const top = rungY(layout.floor, count - 1, layout.pitch);
  const hitTop = Math.min(top, layout.floor - 30) - 12;
  return (
    <g
      className={dimClass(isActive(props.hover, bin.x0) === false)}
      onPointerEnter={() => {
        props.onHover({
          item: bin,
          x: left + bw / 2,
          y: top - (props.peak ? 26 : 6),
        });
      }}
    >
      <rect
        className="fill-transparent"
        height={layout.floor - hitTop}
        width={bw}
        x={left}
        y={hitTop}
      />
      <Rungs
        accent={props.peak ? "fill-hero" : "fill-l2"}
        className={props.peak ? "fill-hero" : "fill-l4"}
        floor={layout.floor}
        id={`bin-${bin.x0}`}
        left={left + bw * 0.12}
        n={count}
        order={index * 1.6}
        pitch={layout.pitch}
        width={bw * 0.76}
      />
      {props.peak ? (
        <text
          className="fade t-value"
          style={stagger(index, "series")}
          textAnchor="middle"
          x={left + bw / 2}
          y={top - 10}
        >
          {props.format(bin.count)}
        </text>
      ) : null}
    </g>
  );
};

/** An evenly dotted guide at the marker and its label, flipped left when it sits far right. */
const Marker = (props: { label: string; layout: Layout; value: number }) => {
  const { layout } = props;
  const mx = layout.x(props.value);
  const flip = mx > layout.x0 + layout.plotW * 0.7;
  return (
    <g className="fade" pointerEvents="none" style={stagger(10)}>
      <DottedLine
        tone="fill-l1"
        x0={mx}
        x1={mx}
        y0={layout.top - 2}
        y1={layout.floor + 3}
      />
      <text
        className="t-axis t-halo"
        textAnchor={flip ? "end" : "start"}
        x={mx + (flip ? -8 : 8)}
        y={layout.top + 2}
      >
        {props.label}
      </text>
    </g>
  );
};

/**
 * F14 Histogram. Binned counts drawn as stacks of 2px rungs at one pitch, one
 * per record, every fifth darker; the tallest bin in ink with its count, and an evenly dotted guide where half the records are in.
 */
export const RungHistogram = (props: RungHistogramProps) => {
  const data = props.data ?? rungHistogramDemo;
  const height = props.height ?? 440;
  const unit = props.unit ?? 1;
  const formatX = props.formatX ?? ((v: number) => `${v}h`);
  const format = props.format ?? String;
  const marker = props.marker === undefined ? binMedian(data) : props.marker;
  const peak = maxIndex(data.map((d) => d.count));
  const [tip, setTip] = useState<Tip<HistBin> | null>(null);
  const label = data
    .map((d) => `${formatX(d.x0)}–${formatX(d.x1)}: ${format(d.count)}`)
    .join(", ");
  const lo = data[0]?.x0 ?? 0;
  const hi = data.at(-1)?.x1 ?? 0;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>
              {formatX(tip.item.x0)}–{formatX(tip.item.x1)}
            </b>{" "}
            · {format(tip.item.count)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = buildLayout(
          width,
          height,
          data,
          unit,
          props.note !== undefined
        );
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>{label}</title>
            <Axis
              data={data}
              every={props.labelEvery ?? 2}
              formatX={formatX}
              layout={layout}
            />
            {data.map((bin, i) => (
              <Bin
                bin={bin}
                format={format}
                hover={tip?.item.x0 ?? null}
                index={i}
                key={bin.x0}
                layout={layout}
                onHover={setTip}
                peak={i === peak}
                unit={unit}
              />
            ))}
            {marker !== null && marker >= lo && marker <= hi ? (
              <Marker
                label={
                  props.markerLabel ?? `Median · ${formatX(Math.round(marker))}`
                }
                layout={layout}
                value={marker}
              />
            ) : null}
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
