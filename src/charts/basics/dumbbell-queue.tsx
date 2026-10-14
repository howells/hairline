import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";
import { useState } from "react";

import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { dimClass, sansWidth, stagger } from "../util";
import { dumbbellQueueDemo } from "./dumbbell-queue.data";
import type { DumbbellDatum } from "./dumbbell-queue.data";
import { isActive, maxIndex } from "./util-b";
import type { Tip } from "./util-b";

interface DumbbellQueueProps {
  data?: DumbbellDatum[];
  /** Axis end labels: [low end, high end]. */
  ends?: readonly [string, string];
  format?: (v: number) => string;
  height?: number;
  /** Label of the row to draw in the hero colour. Defaults to the biggest change. */
  highlight?: string;
  note?: string;
  /** Size of one bead in data units. */
  unit?: number;
}

interface Layout {
  dotR: number;
  labelW: number;
  pitch: number;
  top: number;
  x: ScaleLinear<number, number>;
}

interface RowProps {
  datum: DumbbellDatum;
  format: (v: number) => string;
  hero: boolean;
  hover: string | null;
  index: number;
  layout: Layout;
  onHover: (tip: Tip<DumbbellDatum>) => void;
  unit: number;
  width: number;
}

/**
 * Width a row's value label takes to the right of its rightmost dot: the
 * before value (`t-axis`, 11px) when the row improved, else the after value
 * (`t-value`, 12px).
 */
const rightLabelW = (
  d: DumbbellDatum,
  format: (v: number) => string,
  dotR: number
) => {
  const text = d.after <= d.before ? format(d.before) : format(d.after);
  return dotR + 2 + sansWidth(text, d.after <= d.before ? 11 : 12);
};

const buildLayout = (
  width: number,
  height: number,
  data: DumbbellDatum[],
  hasNote: boolean,
  format: (v: number) => string
): Layout => {
  const longest = Math.max(...data.map((d) => sansWidth(d.label, 12)));
  const labelW = Math.min(width * 0.32, longest + 12);
  const top = 36;
  const bottom = hasNote ? 74 : 44;
  const max = Math.max(...data.flatMap((d) => [d.before, d.after]));
  const dotR = width < 420 ? 4.5 : 6;
  const x0 = labelW + 12;
  // Pull the track's right end in until every right-hand value label fits.
  const x1 = Math.min(
    width - (width < 420 ? 22 : 40),
    ...data.map((d) => {
      const t = Math.max(d.before, d.after) / (max * 1.04);
      return t > 0
        ? x0 + (width - 2 - rightLabelW(d, format, dotR) - x0) / t
        : Infinity;
    })
  );
  return {
    dotR,
    labelW,
    pitch: (height - top - bottom) / Math.max(1, data.length - 1),
    top,
    x: scaleLinear()
      .domain([0, max * 1.04])
      .range([x0, x1]),
  };
};

/** Height of a change rung. */
const RUNG_H = 8;

/**
 * One 2px rung per unit of change, spaced evenly in the gap between the two
 * dots (so none hide under a dot), on whole pixels.
 */
const ChangeRungs = (props: {
  datum: DumbbellDatum;
  index: number;
  layout: Layout;
  unit: number;
  y: number;
}) => {
  const { datum, layout } = props;
  const xa = layout.x(datum.after);
  const xb = layout.x(datum.before);
  const dir = Math.sign(xa - xb);
  const gap0 = xb + dir * (layout.dotR + 3);
  const gap1 = xa - dir * (layout.dotR + 3);
  const count = Math.round(Math.abs(datum.before - datum.after) / props.unit);
  const worse = datum.after > datum.before;
  const rungs = Array.from({ length: count }, (_, k) => ({
    id: `${datum.label}-rung-${k}`,
    k,
    x: Math.round(gap0 + ((k + 0.5) / count) * (gap1 - gap0)) - 1,
  }));
  return (
    <g className={worse ? "fill-alert" : "fill-l4"}>
      {rungs.map((b) => (
        <rect
          // Every fifth unit steps darker, so the gap counts off in fives.
          className={
            !worse && (b.k + 1) % 5 === 0 ? "grow-y fill-l2" : "grow-y"
          }
          height={RUNG_H}
          key={b.id}
          style={stagger(props.index * 3 + b.k * 0.6, "mark")}
          width={2}
          x={b.x}
          y={props.y - RUNG_H / 2}
        />
      ))}
    </g>
  );
};

const Row = (props: RowProps) => {
  const { datum, layout } = props;
  const y = Math.round(layout.top + props.index * layout.pitch);
  const xa = layout.x(datum.after);
  const xb = layout.x(datum.before);
  // The after label sits outside the pair on its side, the before label on the other.
  const afterLeft = xa <= xb;
  const R = layout.dotR;
  const beadCount = Math.round(
    Math.abs(datum.before - datum.after) / props.unit
  );
  return (
    <g
      className={dimClass(isActive(props.hover, datum.label) === false)}
      onPointerEnter={() => {
        props.onHover({ item: datum, x: (xa + xb) / 2, y: y - 16 });
      }}
    >
      <rect
        className="fill-transparent"
        height={layout.pitch}
        width={props.width}
        x={0}
        y={y - layout.pitch / 2}
      />
      <line
        className="rule"
        x1={Math.round(layout.x(0))}
        x2={Math.round(layout.x.range()[1])}
        y1={crisp(y)}
        y2={crisp(y)}
      />
      <text
        className="t-label fill-muted"
        dy="0.34em"
        textAnchor="end"
        x={layout.labelW}
        y={y}
      >
        {datum.label}
      </text>
      <ChangeRungs
        datum={datum}
        index={props.index}
        layout={layout}
        unit={props.unit}
        y={y}
      />
      <circle
        className="pop fill-paper stroke-l3"
        cx={xb}
        cy={y + 0.5}
        r={R - 0.5}
        strokeWidth={1}
        style={stagger(props.index * 3, "mark")}
      />
      <circle
        className={props.hero ? "pop fill-hero" : "pop fill-l3"}
        cx={xa}
        cy={y + 0.5}
        r={R}
        style={stagger(props.index * 3 + beadCount * 0.6, "mark")}
      />
      <text
        className="fade t-value"
        style={stagger(props.index + 4, "mark")}
        textAnchor={afterLeft ? "end" : "start"}
        x={xa + (afterLeft ? -R - 2 : R + 2)}
        y={y - 12}
      >
        {props.format(datum.after)}
      </text>
      <text
        className="fade t-axis"
        style={stagger(props.index + 4, "mark")}
        textAnchor={afterLeft ? "start" : "end"}
        x={xb + (afterLeft ? R + 2 : -R - 2)}
        y={y - 12}
      >
        {props.format(datum.before)}
      </text>
    </g>
  );
};

const describe = (d: DumbbellDatum, format: (v: number) => string): string =>
  d.after <= d.before
    ? `${format(d.before - d.after)} saved`
    : `${format(d.after - d.before)} lost`;

/**
 * F12 Before and after. Hollow dot = before, solid dot = after, and the gap
 * between them holds one 2px rung per unit of change, so it can be counted.
 * The biggest change is in ink; a row that got worse rungs in the alert colour.
 */
export const DumbbellQueue = (props: DumbbellQueueProps) => {
  const data = props.data ?? dumbbellQueueDemo;
  const height = props.height ?? 380;
  const format = props.format ?? String;
  const unit = props.unit ?? 1;
  const ends = props.ends ?? ["0", "Units"];
  const hero =
    props.highlight ??
    data[maxIndex(data.map((d) => Math.abs(d.before - d.after)))]?.label;
  const [tip, setTip] = useState<Tip<DumbbellDatum> | null>(null);
  const label = data
    .map((d) => `${d.label}: ${format(d.before)} to ${format(d.after)}`)
    .join(", ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tip.item.label}</b> · {format(tip.item.before)} →{" "}
            {format(tip.item.after)} · {describe(tip.item, format)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const layout = buildLayout(
          width,
          height,
          data,
          props.note !== undefined,
          format
        );
        const endsY = height - (props.note === undefined ? 10 : 40);
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
            {data.map((d, i) => (
              <Row
                datum={d}
                format={format}
                hero={hero === d.label}
                hover={tip?.item.label ?? null}
                index={i}
                key={d.label}
                layout={layout}
                onHover={setTip}
                unit={unit}
                width={width}
              />
            ))}
            <text className="t-axis" x={layout.x(0)} y={endsY}>
              {ends[0]}
            </text>
            <text
              className="t-axis"
              textAnchor="end"
              x={layout.x.range()[1]}
              y={endsY}
            >
              {ends[1]}
            </text>
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
