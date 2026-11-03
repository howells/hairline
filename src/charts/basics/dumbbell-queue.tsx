import type {
  DumbbellDatum,
  DumbbellQueueProps,
} from "../../schema/dumbbell-queue";
import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/key";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { MARK_WEIGHT } from "../marks";
import { FootNote } from "../plot-note";
import {
  clears,
  referenceDesc,
  referenceRows,
  referenceValues,
} from "../reference-marks";
import { ReferenceBands, ReferenceOverlay } from "../references";
import { HRule } from "../rules";
import { chartTable, plotOptions, scoped } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { stagger, noteOf, countingUnit } from "../util";
import { buildLayout, describe, reactKeys, summary } from "./before-after";
import type { Layout, SideLabels } from "./before-after";
import { maxIndex } from "./util-b";

interface RowProps {
  /** Which direction of change draws its rungs in the alert colour. */
  alert: "fall" | "rise";
  /** Whether the after value clears the reference line that asks for ink; undefined when none does. */
  clearing: boolean | undefined;
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

/**
 * The text beside a row's dots: the before value to the right when the row
 * improved, else the after value; the left holds the other.
 */
const sideLabels = (format: (v: number) => string): SideLabels => ({
  left: () => "",
  right: (d) => (d.after <= d.before ? format(d.before) : format(d.after)),
});

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

/** The after dot: ink for the hero, or by whether it clears a reference line, else grey. */
const afterTone = (clearing: boolean | undefined, hero: boolean) => {
  if (clearing !== undefined) {
    return clearing ? "fill-hero" : "fill-l5";
  }
  return hero ? "fill-hero" : "fill-l3";
};

/**
 * The values beside a row's dots, drawn over the reference lines so a line
 * through a label is cut away by the label's halo.
 */
const RowValues = (props: RowProps) => {
  const { datum, layout } = props;
  const y = Math.round(layout.top + props.index * layout.pitch);
  const xa = layout.x(datum.after);
  const xb = layout.x(datum.before);
  // The after label sits outside the pair on its side, the before label on the other.
  const afterLeft = xa <= xb;
  const R = layout.dotR;
  return (
    <DimGroup dim={props.dim}>
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

const Row = (props: RowProps) => {
  const { datum, layout } = props;
  const y = Math.round(layout.top + props.index * layout.pitch);
  const xa = layout.x(datum.after);
  const xb = layout.x(datum.before);
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
        className={`pop ${afterTone(props.clearing, props.hero)}`}
        cx={xa}
        cy={y + 0.5}
        size={layout.dotSize}
        style={stagger(props.index * 3 + beadCount * 0.6, "mark")}
      />
    </DimGroup>
  );
};

interface SvgProps {
  alert: NonNullable<DumbbellQueueProps["alert"]>;
  data: DumbbellDatum[];
  format: (v: number) => string;
  height: number;
  hero: number;
  hover: ReturnType<typeof useHover<number>>;
  keys: string[];
  label: string;
  props: DumbbellQueueProps;
  unit: number;
  width: number;
}

/** The references, one row for each pair and the ends of the scale. */
const DumbbellSvg = ({
  alert,
  data,
  format,
  height,
  hero,
  hover,
  keys,
  label,
  props,
  unit,
  width,
}: SvgProps) => {
  const layout = buildLayout(
    width,
    height,
    data,
    noteOf(props) !== undefined,
    sideLabels(format),
    36,
    props.metrics,
    referenceValues(props.references)
  );
  const plane = {
    x0: layout.x.range()[0],
    x1: layout.x.range()[1],
    y0: layout.top - 22,
    y1: layout.top + (data.length - 1) * layout.pitch + 18,
  };
  const avoid = data.flatMap((d, i) =>
    [d.before, d.after].map((v) => ({
      x: layout.x(v),
      y: layout.top + i * layout.pitch,
    }))
  );
  const [lowEnd, highEnd] = layout.x.domain();
  const ends = props.ends ?? [format(lowEnd), format(highEnd)];
  const endsY = height - (noteOf(props) === undefined ? 10 : 40);
  return (
    <ChartSvg
      desc={[summary(data, format), referenceDesc(props.references, format)]
        .filter((text) => text !== "")
        .join(" ")}
      height={height}
      label={label}
      leave={hover.clear}
      width={width}
    >
      <ReferenceBands
        along="x"
        plane={plane}
        refs={props.references}
        scale={layout.x}
      />
      {data.map((d, i) => (
        <Row
          alert={alert}
          clearing={clears(props.references, d.after)}
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
      <ReferenceOverlay
        along="x"
        avoid={avoid}
        plane={plane}
        refs={props.references}
        scale={layout.x}
      />
      {data.map((d, i) => (
        <RowValues
          alert={alert}
          clearing={undefined}
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
      <FootNote
        height={height}
        metrics={props.metrics}
        text={noteOf(props)}
        width={width}
      />
    </ChartSvg>
  );
};

const DumbbellQueuePlot = (props: DumbbellQueueProps) => {
  const data = (props.data ?? []).filter(
    (d) => Number.isFinite(d.before) && Number.isFinite(d.after)
  );
  const height = props.height ?? 380;
  const format = resolveFormat(props.format);
  const unit = countingUnit(
    props.unit !== undefined && props.unit > 0 ? props.unit : 1,
    Math.max(0, ...data.map((d) => Math.abs(d.before - d.after)))
  );
  const alert = props.alert ?? "rise";
  const keys = reactKeys(data);
  // Emphasis is by key (id, else label) so reordering never moves it; none
  // given, the biggest change. A key that names no row emphasises none.
  const hero =
    props.emphasis === undefined
      ? maxIndex(data.map((d) => Math.abs(d.before - d.after)))
      : data.findIndex((d) => keyOf(d) === props.emphasis);
  const hover = useHover<number>();
  const label =
    props.title ??
    (data.length === 0
      ? "No data"
      : data
          .map((d) => `${d.label}: ${format(d.before)} to ${format(d.after)}`)
          .join(", "));

  return (
    <Plot
      {...plotOptions(props)}
      initialWidth={props.initialWidth}
      table={chartTable(
        props,
        props.title ?? "Before and after",
        ["Label", "Before", "After"],
        [
          ...data.map((d) => [d.label, format(d.before), format(d.after)]),
          ...referenceRows(props.references, format, {
            columns: 3,
            values: [1, 2],
          }),
        ]
      )}
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
      {(width) => (
        <DumbbellSvg
          alert={alert}
          data={data}
          format={format}
          height={height}
          hero={hero}
          hover={hover}
          keys={keys}
          label={label}
          props={props}
          unit={unit}
          width={width}
        />
      )}
    </Plot>
  );
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
export const DumbbellQueue = (props: DumbbellQueueProps) =>
  scoped(props.idPrefix, <DumbbellQueuePlot {...props} />);
