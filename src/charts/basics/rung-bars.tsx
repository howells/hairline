import { scaleBand } from "d3-scale";
import type { ScaleBand } from "d3-scale";

import { plural } from "../../lib/format";
import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/key";
import type { FontMetrics } from "../../schema/metrics";
import type { RungBarsProps, RungDatum } from "../../schema/rung-bars";
import { Plot } from "../core";
import { DimGroup } from "../hover";
import { FootNote } from "../plot-note";
import { Pointer } from "../pointer";
import type { Stop } from "../pointer";
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
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger, noteOf, countingUnit, sansWidth } from "../util";
import { rungPitch, rungY } from "./rung-geometry";
import { Rungs } from "./rungs";
import { maxIndex } from "./util-b";

/**
 * How far each column's engraved shadow falls, right and down, in px: 10,
 * or less where the columns stand close, so a shadow takes at most this
 * share of the gap and never reaches the next column.
 */
const SHADOW = 10;
const SHADOW_SHARE = 0.4;
/** The long, dark rung: every tenth, reaching this far past the column. */
const TENS = 10;
const TENS_REACH = 3;
/** Room kept between two neighbouring bar labels, px. */
const LABEL_ROOM = 8;
/** How far above a column's top its tip stands: clear of the value on top, px. */
const LABEL_ROOM_ABOVE = 28;
/** How far the second line of bar labels sits below the first, px. */
const LABEL_STEP = 14;

/**
 * True when two neighbouring labels, each centred on its bar, would touch:
 * then every other label drops to a second line, as a narrow chart needs.
 */
const labelsCollide = (
  labels: readonly string[],
  step: number,
  metrics: FontMetrics | undefined
) => {
  const widths = labels.map((label) => sansWidth(label, undefined, metrics));
  return widths
    .slice(1)
    .some((width, i) => (widths[i] + width) / 2 + LABEL_ROOM > step);
};

interface Ladder {
  bandwidth: number;
  datum: RungDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  /** What a withheld bar prints. */
  hidden: string;
  /** Print `hidden` above a withheld column. */
  printHidden: boolean;
  hero: boolean;
  /** Stepped back: a reference line asks for ink and this bar falls short. */
  back: boolean;
  index: number;
  /** How far below the first line this bar's label sits: 0, or LABEL_STEP. */
  labelDrop: number;
  left: number;
  pitch: number;
  rungs: number;
  shadow: number;
  /** Pattern id for a named engraving. */
  tex: (name: string) => string;
}

/**
 * The column's cast shadow, the way shaded engraved type is cut: a band of
 * hatch on paper along the column's right side, meeting its top corner at 45°
 * and standing on the floor. Light falls from the upper left.
 */
const CastShadow = (props: {
  floor: number;
  hero: boolean;
  index: number;
  right: number;
  shadow: number;
  tex: (name: string) => string;
  top: number;
}) => {
  const { floor, right, shadow, top } = props;
  const points = [
    [right, top],
    [right + shadow, top + shadow],
    [right + shadow, floor],
    [right, floor],
  ]
    .map((p) => p.join(","))
    .join(" ");
  return (
    <polygon
      className="fade shape-crisp"
      fill={paint(props.tex(props.hero ? "shade-hero" : "shade"))}
      points={points}
      style={stagger(props.index)}
    />
  );
};

/** A bar's rung tones: ink for the hero, a step back when a reference line asks for ink, else grey. */
const rungTone = (props: { back: boolean; hero: boolean }) => {
  if (props.hero) {
    return { accent: "fill-hero", rung: "fill-hero" };
  }
  return props.back
    ? { accent: "fill-l4", rung: "fill-l5" }
    : { accent: "fill-l2", rung: "fill-l4" };
};

/**
 * One bar: a carved column of 2px rungs, one per unit, every tenth long and
 * dark, with its engraved shadow behind and its value on top.
 */
const LadderBar = (props: Ladder) => {
  const top = rungY(props.floor, props.rungs - 1, props.pitch);
  const centre = props.left + props.bandwidth / 2;
  const right = Math.round(props.left + props.bandwidth);
  return (
    <DimGroup dim={props.dim}>
      {props.datum.value === null ? (
        <line
          className="stroke-l4"
          strokeDasharray="2 3"
          strokeWidth={1}
          x1={Math.round(props.left)}
          x2={right}
          y1={props.floor - 4.5}
          y2={props.floor - 4.5}
        />
      ) : null}
      {props.back ? null : (
        <CastShadow
          floor={props.floor}
          hero={props.hero}
          index={props.index}
          right={right}
          shadow={props.shadow}
          tex={props.tex}
          top={top}
        />
      )}
      <Rungs
        accent={rungTone(props).accent}
        className={rungTone(props).rung}
        every={TENS}
        reach={TENS_REACH}
        floor={props.floor}
        id={props.datum.label}
        left={props.left}
        n={props.rungs}
        order={props.index * 2}
        pitch={props.pitch}
        width={props.bandwidth}
      />
      {props.datum.value === null && !props.printHidden ? null : (
        <Label
          anchor="middle"
          order={props.index}
          muted={props.datum.value === null}
          voice="value"
          x={centre}
          y={top - 10}
        >
          {props.datum.value === null
            ? props.hidden
            : props.format(props.datum.value)}
        </Label>
      )}
      <Label
        anchor="middle"
        muted
        voice="label"
        x={centre}
        y={props.floor + 18 + props.labelDrop}
      >
        {props.datum.label}
      </Label>
    </DimGroup>
  );
};

/** What the bars say, in words, from the data passed in. */
const describe = (
  data: RungDatum[],
  format: (v: number) => string,
  hidden: string
) => {
  const shown = data.flatMap((d) =>
    d.value === null ? [] : [{ label: d.label, value: d.value }]
  );
  const withheld = data.length - shown.length;
  const held = withheld === 0 ? "" : ` ${hidden}: ${plural(withheld, "bar")}.`;
  if (shown.length === 0) {
    return data.length === 0
      ? "No data."
      : `${plural(data.length, "bar")}.${held}`;
  }
  const at = (i: number) => `${shown[i].label}, ${format(shown[i].value)}`;
  const hi = maxIndex(shown.map((d) => d.value));
  const lo = maxIndex(shown.map((d) => -d.value));
  return `${plural(data.length, "bar")}. Largest: ${at(hi)}.${
    shown.length > 1 ? ` Smallest: ${at(lo)}.` : ""
  }${held} The data table lists every bar.`;
};

/** A bar's value as printed: its figure, or the withheld word. */
const printed = (
  datum: RungDatum,
  format: (v: number) => string,
  hidden: string
) => (datum.value === null ? hidden : format(datum.value));

/** React keys: each datum's key, numbered when the key repeats. */
const reactKeys = (data: RungDatum[]) => {
  const seen = new Map<string, number>();
  return data.map((d) => {
    const key = keyOf(d);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);
    return `${key}#${nth}`;
  });
};

interface BarStopGeometry {
  floor: number;
  format: (v: number) => string;
  hidden: string;
  pitch: number;
  shadow: number;
  unit: number;
  x: ScaleBand<number>;
}

/** Where the pointer lands on each bar, and what its tip says. */
const barStops = (data: RungDatum[], g: BarStopGeometry): Stop<number>[] =>
  data.map((datum, index) => ({
    above: LABEL_ROOM_ABOVE,
    clear: g.x.bandwidth() / 2 + g.shadow,
    key: index,
    lead: datum.label,
    rows: [
      { value: printed(datum, g.format, g.hidden) },
      ...(datum.detail === undefined
        ? []
        : [{ muted: true, value: datum.detail }]),
    ],
    x: (g.x(index) ?? 0) + g.x.bandwidth() / 2,
    y: rungY(
      g.floor,
      Math.max(0, Math.round((datum.value ?? 0) / g.unit)) - 1,
      g.pitch
    ),
  }));

/** Side margin either side of the bars, px. */
const SIDE = 16;

/**
 * The bars' bands across the width, centred and at most 120px a bar, and
 * whether their labels need two lines to clear each other.
 */
const bands = (
  data: RungDatum[],
  width: number,
  metrics: FontMetrics | undefined
) => {
  const plotWidth = Math.min(width - SIDE * 2, data.length * 120);
  const x0 = (width - plotWidth) / 2;
  const x = scaleBand<number>()
    .domain(data.map((_, i) => i))
    .range([x0, x0 + plotWidth])
    .paddingInner(0.42)
    .paddingOuter(0.3);
  const alternate = labelsCollide(
    data.map((d) => d.label),
    x.step(),
    metrics
  );
  return { alternate, plotWidth, x, x0 };
};

interface LayoutOptions {
  data: RungDatum[];
  fixedHeight: boolean;
  height: number;
  /** The tallest column, in rungs. */
  max: number;
  metrics: FontMetrics | undefined;
  note: string | undefined;
  /** The chart shares its max with others, so it keeps one pitch and one floor. */
  sharedMax: boolean;
  width: number;
}

/** Where the bars stand: their bands, the floor, the rung pitch and the shadow. */
const layout = (o: LayoutOptions) => {
  const margin = {
    bottom: 30 + noteSpace(o.note, o.width - 16, 20, o.metrics),
    top: 28,
  };
  const { alternate, plotWidth, x, x0 } = bands(o.data, o.width, o.metrics);
  // A shared max keeps room for a second line of labels either way,
  // so charts set side by side keep one pitch and one floor.
  const bottom = margin.bottom + (alternate || o.sharedMax ? LABEL_STEP : 0);
  const pitch = rungPitch(o.height - bottom - margin.top, o.max);
  // When the pitch reaches its cap the columns stop short of the
  // room, so the plot closes up round them instead of leaving air;
  // at its floor the tallest column needs more, so the plot grows.
  // A fixed-size chart keeps exactly the height it was given.
  const tallest = Math.round(o.max) * pitch;
  const fitted = o.fixedHeight
    ? o.height
    : Math.max(
        Math.min(o.height, margin.top + Math.ceil(o.max) * pitch + bottom),
        margin.top + tallest + bottom
      );
  const shadow = Math.min(
    SHADOW,
    Math.round((x.step() - x.bandwidth()) * SHADOW_SHARE)
  );
  return {
    alternate,
    fitted,
    floor: Math.round(fitted - bottom),
    pitch,
    plotWidth,
    shadow,
    x,
    x0,
  };
};

interface SvgProps {
  data: RungDatum[];
  format: (v: number) => string;
  hidden: string;
  name: string;
  props: RungBarsProps;
  scale: {
    fixedHeight: boolean;
    height: number;
    largest: number;
    unit: number;
    values: number[];
  };
  tex: ReturnType<typeof useTextureIds>;
  width: number;
}

/** The ladder bars, their references and the floor they stand on. */
const RungBarsSvg = ({
  data,
  format,
  hidden,
  name,
  props,
  scale,
  tex,
  width,
}: SvgProps) => {
  const { fixedHeight, height, largest, unit, values } = scale;
  const { alternate, fitted, floor, pitch, plotWidth, shadow, x, x0 } = layout({
    data,
    fixedHeight,
    height,
    max: largest / unit,
    metrics: props.metrics,
    note: noteOf(props),
    sharedMax: props.max !== undefined,
    width,
  });
  const keys = reactKeys(data);
  const plane = {
    x0,
    x1: x0 + plotWidth,
    y0: 28,
    y1: floor,
  };
  // A value's height: one pitch for each unit, up from the floor.
  const valueY = (v: number) => floor - (v / unit) * pitch;
  // Emphasis is by key (id, else label) so sorting never moves it;
  // none given, the largest. A key that names no bar emphasises none.
  const hero =
    props.emphasis === undefined
      ? maxIndex(values)
      : data.findIndex((d) => keyOf(d) === props.emphasis);
  // A reference line that asks for ink decides each bar's tone instead.
  const standing = (index: number) =>
    clears(props.references, data[index].value ?? Number.NaN);

  const stops = barStops(data, {
    floor,
    format,
    hidden,
    pitch,
    shadow,
    unit,
    x,
  });

  return (
    <Pointer
      axis="x"
      height={fitted}
      reach={x.step()}
      stops={stops}
      width={width}
    >
      {(pointer) => (
        <ChartSvg
          desc={[
            describe(data, format, hidden),
            referenceDesc(props.references, format),
          ]
            .filter((text) => text !== "")
            .join(" ")}
          height={fitted}
          label={name}
          width={width}
          {...pointer.svg}
        >
          <defs>
            <Hatch id={tex("shade")} tone="fill-l4" />
            <CrossHatch id={tex("shade-hero")} tone="fill-l3" />
          </defs>
          <ReferenceBands
            along="y"
            plane={plane}
            refs={props.references}
            scale={valueY}
          />
          <HRule
            x0={Math.round(x0)}
            x1={Math.round(x0 + plotWidth)}
            y={floor}
          />
          {data.map((datum, index) => (
            <LadderBar
              key={keys[index]}
              bandwidth={x.bandwidth()}
              datum={datum}
              dim={pointer.key !== null && pointer.key !== index}
              floor={floor}
              format={format}
              hidden={hidden}
              printHidden={props.printHidden ?? true}
              back={standing(index) === false}
              hero={standing(index) ?? hero === index}
              index={index}
              labelDrop={alternate && index % 2 === 1 ? LABEL_STEP : 0}
              left={x(index) ?? 0}
              pitch={pitch}
              rungs={Math.max(0, Math.round((datum.value ?? 0) / unit))}
              shadow={shadow}
              tex={tex}
            />
          ))}
          <ReferenceOverlay
            along="y"
            plane={plane}
            refs={props.references}
            scale={valueY}
          />
          <FootNote
            height={fitted}
            metrics={props.metrics}
            text={noteOf(props)}
            width={width}
          />
        </ChartSvg>
      )}
    </Pointer>
  );
};

const RungBarsPlot = (props: RungBarsProps) => {
  const data = (props.data ?? []).filter(
    (d) => d.value === null || Number.isFinite(d.value)
  );
  const values = data.map((d) => d.value ?? 0);
  const largest = Math.max(
    0,
    props.max ?? 0,
    ...values,
    ...referenceValues(props.references)
  );
  const unit = countingUnit(
    props.unit !== undefined && props.unit > 0 ? props.unit : 1,
    largest
  );
  const hidden = props.hidden ?? "Hidden";
  const fixedHeight = props.width !== undefined && props.height !== undefined;
  const height = props.height ?? 460;
  const format = resolveFormat(props.format);
  const tex = useTextureIds("counted");
  const name = props.title ?? `Bar chart of ${plural(data.length, "value")}`;

  return (
    <Plot
      {...plotOptions(props)}
      initialWidth={props.initialWidth}
      table={chartTable(
        props,
        name,
        ["Label", "Value"],
        [
          ...data.map((d) => [d.label, printed(d, format, hidden)]),
          ...referenceRows(props.references, format, {
            columns: 2,
            values: [1],
          }),
        ]
      )}
      width={props.width}
    >
      {(width) => (
        <RungBarsSvg
          data={data}
          format={format}
          hidden={hidden}
          name={name}
          props={props}
          scale={{ fixedHeight, height, largest, unit, values }}
          tex={tex}
          width={width}
        />
      )}
    </Plot>
  );
};

/**
 * F1 Counted bars. Each bar is a carved column of solid 2px rungs at one
 * pitch, one per unit, every tenth long and dark like the marks on a rule,
 * casting an engraved hatch shadow behind and to its right. The largest bar
 * is in ink and its shadow is crosshatched.
 *
 * Props are the `rungBarsSchema` payload (src/schema/rung-bars.ts); `data` is
 * required and never defaults to demo data. Give `width` and `height` for a
 * fixed-size chart that is complete on the first (server) render. Bad input
 * is tolerated: a datum whose value is not a finite number is skipped,
 * a negative value stands as an empty column with its figure, a null one
 * as an empty column printed with `hidden` ("Hidden") unless
 * `printHidden` is false, duplicate
 * labels each get a bar (give them `id`s to tell them apart), and no data
 * draws a quiet empty axis.
 */
export const RungBars = (props: RungBarsProps) =>
  scoped(props.idPrefix, <RungBarsPlot {...props} />);
