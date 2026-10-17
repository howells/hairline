import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { HRule, Tick } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DottedLine } from "../texture";
import { stagger } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { binMedian, rungHistogramDemo } from "./rung-histogram.data";
import type { HistBin } from "./rung-histogram.data";
import { Rungs } from "./rungs";
import { maxIndex } from "./util-b";

interface RungHistogramProps {
  data?: HistBin[];
  format?: (v: number) => string;
  /** Formats bin edges on the axis, e.g. 210 → "3:30". */
  formatX?: (v: number) => string;
  height?: number;
  /** Label every nth bin edge (doubled when bins are under 34px wide). */
  labelEvery?: number;
  /** The marker's position; defaults to the median. Pass null to hide it. */
  marker?: number | null;
  markerLabel?: string;
  note?: string;
  /** Records per rung. */
  unit?: number;
}

/** Minutes as h:mm, so 210 reads 3:30. */
const hoursMinutes = (v: number) =>
  `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;

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
      <HRule
        x0={Math.round(layout.x0 - 8)}
        x1={Math.round(layout.x0 + layout.plotW + 8)}
        y={y}
      />
      {edges.map((e, k) => (
        <g key={e}>
          <Tick size={k % step === 0 ? "md" : "sm"} x={layout.x(e)} y={y + 1} />
          {k % step === 0 ? (
            <Label
              anchor="middle"
              voice="axis"
              x={layout.x(e)}
              y={layout.floor + 30}
            >
              {props.formatX(e)}
            </Label>
          ) : null}
        </g>
      ))}
    </g>
  );
};

interface BinProps {
  bin: HistBin;
  dim: boolean;
  format: (v: number) => string;
  index: number;
  layout: Layout;
  onHover: (x: number, y: number) => void;
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
    <DimGroup
      dim={props.dim}
      onPointerEnter={() => {
        props.onHover(left + bw / 2, top - (props.peak ? 26 : 6));
      }}
    >
      <HitRect height={layout.floor - hitTop} width={bw} x={left} y={hitTop} />
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
        <Label
          anchor="middle"
          order={index}
          tier="series"
          voice="value"
          x={left + bw / 2}
          y={top - 10}
        >
          {props.format(bin.count)}
        </Label>
      ) : null}
    </DimGroup>
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
        tone="fill-l2"
        x0={mx}
        x1={mx}
        y0={layout.top - 2}
        y1={layout.floor + 3}
      />
      <Label
        anchor={flip ? "end" : "start"}
        halo
        voice="axis"
        x={mx + (flip ? -8 : 8)}
        y={layout.top + 2}
      >
        {props.label}
      </Label>
    </g>
  );
};

/**
 * F14 Finish times. Binned counts drawn as stacks of 2px rungs at one pitch, one
 * per record, every fifth darker; the tallest bin in ink with its count, and an evenly dotted guide where half the records are in.
 */
export const RungHistogram = (props: RungHistogramProps) => {
  const data = props.data ?? rungHistogramDemo;
  const height = props.height ?? 440;
  const unit = props.unit ?? 1;
  const formatX = props.formatX ?? hoursMinutes;
  const format = props.format ?? String;
  const marker = props.marker === undefined ? binMedian(data) : props.marker;
  const peak = maxIndex(data.map((d) => d.count));
  const hover = useHover<number>();
  const label = data
    .map((d) => `${formatX(d.x0)}–${formatX(d.x1)}: ${format(d.count)}`)
    .join(", ");
  const lo = data[0]?.x0 ?? 0;
  const hi = data.at(-1)?.x1 ?? 0;

  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[format(data[hover.at.key].count)]}
              lead={`${formatX(data[hover.at.key].x0)}–${formatX(data[hover.at.key].x1)}`}
            />
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
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <Axis
              data={data}
              every={props.labelEvery ?? 3}
              formatX={formatX}
              layout={layout}
            />
            {data.map((bin, i) => (
              <Bin
                bin={bin}
                dim={hover.dim(i)}
                format={format}
                index={i}
                key={bin.x0}
                layout={layout}
                onHover={(x, y) => {
                  hover.show(i, x, y);
                }}
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
            <FootNote height={height} text={props.note} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
