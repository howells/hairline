import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { dumbbellKeyOf } from "../../schema/dumbbell-queue";
import type {
  DumbbellDatum,
  DumbbellQueueProps,
} from "../../schema/dumbbell-queue";
import { resolveFormat } from "../../schema/format";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { DOT, MARK_WEIGHT } from "../marks";
import type { DotSize } from "../marks";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { stagger, noteOf } from "../util";
import { inkWidth, maxIndex } from "./util-b";

interface Layout {
  dotR: number;
  dotSize: DotSize;
  labelW: number;
  pitch: number;
  top: number;
  x: ScaleLinear<number, number>;
}

interface RowProps {
  /** Which direction of change draws its rungs in the alert colour. */
  alert: "fall" | "rise";
  datum: DumbbellDatum;
  dim: boolean;
  format: (v: number) => string;
  hero: boolean;
  index: number;
  layout: Layout;
  onHover: (x: number, y: number) => void;
  unit: number;
  width: number;
}

/** Margin kept between the ink and the svg edge. */
const EDGE = 2;

/**
 * Width a row's value label takes to the right of its rightmost dot: the
 * before value when the row improved, else the after value.
 */
const rightLabelW = (
  d: DumbbellDatum,
  format: (v: number) => string,
  dotR: number
) => {
  const text = d.after <= d.before ? format(d.before) : format(d.after);
  return dotR + 2 + inkWidth(text);
};

const buildLayout = (
  width: number,
  height: number,
  data: DumbbellDatum[],
  hasNote: boolean,
  format: (v: number) => string
): Layout => {
  const longest = Math.max(0, ...data.map((d) => inkWidth(d.label)));
  // The row names end at `labelW`, the longest starting at the edge margin.
  const labelW = EDGE + Math.min(width * 0.32, Math.ceil(longest));
  const top = 36;
  const bottom = hasNote ? 74 : 44;
  const values = data.flatMap((d) => [d.before, d.after]);
  // The axis runs from zero, or below it when a value is negative.
  const lo = Math.min(0, ...values) * 1.04;
  const hi = Math.max(0, ...values) * 1.04;
  const span = hi > lo ? hi - lo : 1;
  const dotSize: DotSize = width < 420 ? "md" : "lg";
  const dotR = DOT[dotSize];
  const x0 = labelW + 12;
  // Pull the track's right end in until every right-hand value label fits.
  const x1 = Math.min(
    width - EDGE,
    ...data.map((d) => {
      const t = (Math.max(d.before, d.after) - lo) / span;
      return t > 0
        ? x0 + (width - EDGE - rightLabelW(d, format, dotR) - x0) / t
        : Infinity;
    })
  );
  return {
    dotR,
    dotSize,
    labelW,
    pitch: (height - top - bottom) / Math.max(1, data.length - 1),
    top,
    x: scaleLinear()
      .domain([lo, lo + span])
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
  alert: "fall" | "rise";
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
  const worse =
    props.alert === "rise"
      ? datum.after > datum.before
      : datum.after < datum.before;
  const rungs = Array.from({ length: count }, (_, k) => ({
    id: `${datum.label}-rung-${k}`,
    k,
    x: Math.round(gap0 + ((k + 0.5) / count) * (gap1 - gap0)) - MARK_WEIGHT / 2,
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
          width={MARK_WEIGHT}
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
    <DimGroup
      dim={props.dim}
      onPointerEnter={() => {
        props.onHover((xa + xb) / 2, y - 16);
      }}
    >
      <HitRect
        height={layout.pitch}
        width={props.width}
        x={0}
        y={y - layout.pitch / 2}
      />
      <HRule
        kind="rule"
        x0={Math.round(layout.x(0))}
        x1={Math.round(layout.x.range()[1])}
        y={y}
      />
      <Label anchor="end" middle muted voice="label" x={layout.labelW} y={y}>
        {datum.label}
      </Label>
      <ChangeRungs
        alert={props.alert}
        datum={datum}
        index={props.index}
        layout={layout}
        unit={props.unit}
        y={y}
      />
      <Ring
        className="pop stroke-l3"
        cx={xb}
        cy={y + 0.5}
        size={layout.dotSize}
        style={stagger(props.index * 3, "mark")}
      />
      <Dot
        className={props.hero ? "pop fill-hero" : "pop fill-l3"}
        cx={xa}
        cy={y + 0.5}
        size={layout.dotSize}
        style={stagger(props.index * 3 + beadCount * 0.6, "mark")}
      />
      <Label
        anchor={afterLeft ? "end" : "start"}
        order={props.index + 4}
        tier="mark"
        voice="value"
        x={xa + (afterLeft ? -R - 2 : R + 2)}
        y={y - 12}
      >
        {props.format(datum.after)}
      </Label>
      <Label
        anchor={afterLeft ? "start" : "end"}
        order={props.index + 4}
        tier="mark"
        voice="axis"
        x={xb + (afterLeft ? R + 2 : -R - 2)}
        y={y - 12}
      >
        {props.format(datum.before)}
      </Label>
    </DimGroup>
  );
};

const describe = (d: DumbbellDatum, format: (v: number) => string): string =>
  d.after <= d.before
    ? `${format(d.before - d.after)} less`
    : `${format(d.after - d.before)} more`;

/** React keys: each datum's key, numbered when the key repeats. */
const reactKeys = (data: DumbbellDatum[]) => {
  const seen = new Map<string, number>();
  return data.map((d) => {
    const key = dumbbellKeyOf(d);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);
    return `${key}#${nth}`;
  });
};

/**
 * Props are the `dumbbellQueueSchema` payload (src/schema/dumbbell-queue.ts);
 * `data` is required and never defaults to demo data. Give `width` and
 * `height` for a fixed-size chart that is complete on the first (server)
 * render. Bad input is tolerated: a row with a value that is not a finite
 * number is skipped, negatives extend the axis below zero, equal ends draw
 * no rungs, duplicate labels each get a row (give them `id`s to tell them
 * apart), and no data draws a quiet empty axis.
 *
 * F12 Before and after. Hollow dot = before, solid dot = after, and the gap
 * between them holds one 2px rung per unit of change, so it can be counted.
 * The biggest change is in ink; a row that changed the alert way (a rise by default) rungs in the alert colour.
 */
export const DumbbellQueue = (props: DumbbellQueueProps) => {
  const data = (props.data ?? []).filter(
    (d) => Number.isFinite(d.before) && Number.isFinite(d.after)
  );
  const height = props.height ?? 380;
  const format = resolveFormat(props.format);
  const unit = props.unit !== undefined && props.unit > 0 ? props.unit : 1;
  const alert = props.alert ?? "rise";
  const ends = props.ends ?? ["0", "Units"];
  const keys = reactKeys(data);
  // Emphasis is by key (id, else label) so reordering never moves it; none
  // given, the biggest change. A key that names no row emphasises none.
  const hero =
    props.emphasis === undefined
      ? maxIndex(data.map((d) => Math.abs(d.before - d.after)))
      : data.findIndex((d) => dumbbellKeyOf(d) === props.emphasis);
  const hover = useHover<number>();
  const label =
    data.length === 0
      ? "No data"
      : data
          .map((d) => `${d.label}: ${format(d.before)} to ${format(d.after)}`)
          .join(", ");

  return (
    <Plot
      initialWidth={props.initialWidth}
      width={props.width}
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                `${format(data[hover.at.key].before)} → ${format(data[hover.at.key].after)}`,
                describe(data[hover.at.key], format),
              ]}
              lead={data[hover.at.key].label}
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
          noteOf(props) !== undefined,
          format
        );
        const endsY = height - (noteOf(props) === undefined ? 10 : 40);
        return (
          <ChartSvg
            height={height}
            label={label}
            leave={hover.clear}
            width={width}
          >
            {data.map((d, i) => (
              <Row
                alert={alert}
                datum={d}
                dim={hover.dim(i)}
                format={format}
                hero={hero === i}
                index={i}
                key={keys[i]}
                layout={layout}
                onHover={hover.showAt(i)}
                unit={unit}
                width={width}
              />
            ))}
            <Label voice="axis" x={layout.x.range()[0]} y={endsY}>
              {ends[0]}
            </Label>
            <Label anchor="end" voice="axis" x={layout.x.range()[1]} y={endsY}>
              {ends[1]}
            </Label>
            <FootNote height={height} text={noteOf(props)} width={width} />
          </ChartSvg>
        );
      }}
    </Plot>
  );
};
