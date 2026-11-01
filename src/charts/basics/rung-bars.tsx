import { scaleBand } from "d3-scale";

import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/rung-bars";
import type { RungBarsProps, RungDatum } from "../../schema/rung-bars";
import { Plot, Tooltip } from "../core";
import { DataTable } from "../data-table";
import { IdScope, useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, stagger } from "../util";
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

interface Ladder {
  bandwidth: number;
  datum: RungDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  index: number;
  left: number;
  pitch: number;
  rungs: number;
  shadow: number;
  /** Pattern id for a named engraving. */
  tex: (name: string) => string;
  onEnter: () => void;
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

/**
 * One bar: a carved column of 2px rungs, one per unit, every tenth long and
 * dark, with its engraved shadow behind and its value on top.
 */
const LadderBar = (props: Ladder) => {
  const top = rungY(props.floor, props.rungs - 1, props.pitch);
  const centre = props.left + props.bandwidth / 2;
  const right = Math.round(props.left + props.bandwidth);
  return (
    <DimGroup dim={props.dim} onPointerEnter={props.onEnter}>
      <HitRect
        height={props.floor - top + 24}
        width={props.bandwidth + 12 + props.shadow}
        x={props.left - 6}
        y={top - 24}
      />
      <CastShadow
        floor={props.floor}
        hero={props.hero}
        index={props.index}
        right={right}
        shadow={props.shadow}
        tex={props.tex}
        top={top}
      />
      <Rungs
        accent={props.hero ? "fill-hero" : "fill-l2"}
        className={props.hero ? "fill-hero" : "fill-l4"}
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
      <Label
        anchor="middle"
        order={props.index}
        voice="value"
        x={centre}
        y={top - 10}
      >
        {props.format(props.datum.value)}
      </Label>
      <Label
        anchor="middle"
        muted
        voice="label"
        x={centre}
        y={props.floor + 18}
      >
        {props.datum.label}
      </Label>
    </DimGroup>
  );
};

const plural = (n: number, noun: string) => `${n} ${noun}${n === 1 ? "" : "s"}`;

/** What the bars say, in words, from the data passed in. */
const describe = (data: RungDatum[], format: (v: number) => string) => {
  if (data.length === 0) {
    return "No data.";
  }
  const at = (i: number) => `${data[i].label}, ${format(data[i].value)}`;
  const hi = maxIndex(data.map((d) => d.value));
  const lo = maxIndex(data.map((d) => -d.value));
  return `${plural(data.length, "bar")}. Largest: ${at(hi)}.${
    data.length > 1 ? ` Smallest: ${at(lo)}.` : ""
  } The data table lists every bar.`;
};

/** Every bar's label and value as a table: hidden by default, or shown. */
const rungTable = (
  data: RungDatum[],
  format: (v: number) => string,
  caption: string,
  visible: boolean | undefined
) => (
  <DataTable
    caption={caption}
    columns={["Label", "Value"]}
    rows={data.map((d) => [d.label, format(d.value)])}
    visible={visible}
  />
);

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

const RungBarsPlot = (props: RungBarsProps) => {
  const data = (props.data ?? []).filter((d) => Number.isFinite(d.value));
  const unit = props.unit !== undefined && props.unit > 0 ? props.unit : 1;
  const fixedHeight = props.width !== undefined && props.height !== undefined;
  const height = props.height ?? 460;
  const format = resolveFormat(props.format);
  const hover = useHover<number>();
  const tex = useTextureIds("counted");
  const name = props.title ?? `Bar chart of ${plural(data.length, "value")}`;

  return (
    <Plot
      initialWidth={props.initialWidth}
      scaling={{ fit: props.fit, scale: props.scale, strokes: props.strokes }}
      table={rungTable(data, format, name, props.table)}
      width={props.width}
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[format(data[hover.at.key].value)]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => {
        const margin = {
          bottom: 30 + noteSpace(props.note, width - 16, 20, props.metrics),
          left: 16,
          right: 16,
          top: 28,
        };
        const plotWidth = Math.min(
          width - margin.left - margin.right,
          data.length * 120
        );
        const x0 = (width - plotWidth) / 2;
        const x = scaleBand<number>()
          .domain(data.map((_, i) => i))
          .range([x0, x0 + plotWidth])
          .paddingInner(0.42)
          .paddingOuter(0.3);
        const max = Math.max(0, ...data.map((d) => d.value / unit));
        const pitch = rungPitch(height - margin.bottom - margin.top, max);
        // When the pitch reaches its cap the columns stop short of the
        // room, so the plot closes up round them instead of leaving air;
        // at its floor the tallest column needs more, so the plot grows.
        // A fixed-size chart keeps exactly the height it was given.
        const tallest = Math.round(max) * pitch;
        const fitted = fixedHeight
          ? height
          : Math.max(
              Math.min(
                height,
                margin.top + Math.ceil(max) * pitch + margin.bottom
              ),
              margin.top + tallest + margin.bottom
            );
        const floor = Math.round(fitted - margin.bottom);
        const shadow = Math.min(
          SHADOW,
          Math.round((x.step() - x.bandwidth()) * SHADOW_SHARE)
        );
        const keys = reactKeys(data);
        // Emphasis is by key (id, else label) so sorting never moves it;
        // none given, the largest. A key that names no bar emphasises none.
        const hero =
          props.emphasis === undefined
            ? maxIndex(data.map((d) => d.value))
            : data.findIndex((d) => keyOf(d) === props.emphasis);

        return (
          <ChartSvg
            desc={describe(data, format)}
            height={fitted}
            label={name}
            leave={hover.clear}
            width={width}
          >
            <defs>
              <Hatch id={tex("shade")} tone="fill-l4" />
              <CrossHatch id={tex("shade-hero")} tone="fill-l3" />
            </defs>
            <HRule
              x0={Math.round(x0)}
              x1={Math.round(x0 + plotWidth)}
              y={floor}
            />
            {data.map((datum, index) => {
              const left = x(index) ?? 0;
              const rungs = Math.max(0, Math.round(datum.value / unit));
              return (
                <LadderBar
                  key={keys[index]}
                  bandwidth={x.bandwidth()}
                  datum={datum}
                  dim={hover.dim(index)}
                  floor={floor}
                  format={format}
                  hero={hero === index}
                  index={index}
                  left={left}
                  pitch={pitch}
                  rungs={rungs}
                  shadow={shadow}
                  tex={tex}
                  onEnter={hover.enter(
                    index,
                    left + x.bandwidth() / 2,
                    rungY(floor, rungs - 1, pitch) - 22
                  )}
                />
              );
            })}
            <FootNote
              height={fitted}
              metrics={props.metrics}
              text={props.note}
              width={width}
            />
          </ChartSvg>
        );
      }}
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
 * a negative value stands as an empty column with its figure, duplicate
 * labels each get a bar (give them `id`s to tell them apart), and no data
 * draws a quiet empty axis.
 */
export const RungBars = (props: RungBarsProps) =>
  props.idPrefix === undefined ? (
    <RungBarsPlot {...props} />
  ) : (
    <IdScope prefix={props.idPrefix}>
      <RungBarsPlot {...props} />
    </IdScope>
  );
