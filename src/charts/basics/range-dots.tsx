import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { plural } from "../../lib/format";
import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/key";
import type { RangeDatum, RangeDotsProps } from "../../schema/range-dots";
import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot, Ring } from "../markers";
import { FootNote } from "../plot-note";
import { HRule, VGrid, VRule } from "../rules";
import { chartTable, plotOptions, scoped } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { noteOf, noteSpace, sansWidth, stagger } from "../util";

/** Margin kept between the ink and the svg edge, px. */
const EDGE = 2;
/** Room above the first row, px. */
const TOP = 12;
/** Room under the last row for the scale, px. */
const SCALE_ROOM = 34;
/** The height of a row when the chart sizes itself, px. */
const ROW = 40;
/** Half the height of a whisker's cap, px. */
const CAP = 4;
/** Gap between a whisker's end and the value after it, px. */
const AFTER = 10;

type Format = (v: number) => string;

/** A row's value as printed: "42% ± 4" for a symmetric interval, else the estimate and its ends. */
const printed = (d: RangeDatum, format: Format, margin: Format) => {
  const below = d.estimate - d.low;
  const above = d.high - d.estimate;
  return Math.abs(below - above) <= 1e-9 * (d.high - d.low + 1)
    ? `${format(d.estimate)} ± ${margin(above)}`
    : `${format(d.estimate)}, ${format(d.low)} to ${format(d.high)}`;
};

/** Whether the row's interval is too wide to rank. */
const isOpen = (d: RangeDatum, wide: number | undefined) =>
  wide !== undefined && d.high - d.low > wide;

interface Layout {
  axisY: number;
  labelW: number;
  pitch: number;
  x: ScaleLinear<number, number>;
}

const layoutOf = (
  props: RangeDotsProps,
  data: RangeDatum[],
  texts: string[],
  size: { height: number; width: number }
): Layout => {
  const longest = Math.max(
    0,
    ...data.map((d) => sansWidth(d.label, 11, props.metrics))
  );
  const labelW = EDGE + Math.min(size.width * 0.32, Math.ceil(longest));
  const widest = Math.max(
    0,
    ...texts.map((text) => sansWidth(text, 11, props.metrics))
  );
  const x0 = labelW + 12;
  const x1 = Math.max(x0 + 1, size.width - EDGE - AFTER - Math.ceil(widest));
  const lo = Math.min(0, ...data.map((d) => d.low));
  const hi = Math.max(...data.map((d) => d.high));
  const axisY = Math.round(
    size.height -
      SCALE_ROOM -
      noteSpace(noteOf(props), size.width - 16, 20, props.metrics)
  );
  return {
    axisY,
    labelW,
    pitch: (axisY - TOP) / Math.max(1, data.length),
    x: scaleLinear()
      .domain(props.domain ?? [lo, hi > lo ? hi : lo + 1])
      .nice(props.domain === undefined ? 4 : 0)
      .range([x0, x1]),
  };
};

interface RowProps {
  datum: RangeDatum;
  dim: boolean;
  format: Format;
  index: number;
  layout: Layout;
  onEnter: () => void;
  open: boolean;
  text: string;
  width: number;
}

/** One row: its name, the whisker with caps across the interval, the dot at the estimate and the value. */
const Row = ({
  datum,
  dim,
  index,
  layout,
  onEnter,
  open,
  text,
  width,
}: RowProps) => {
  const { x } = layout;
  const y = Math.round(TOP + layout.pitch * (index + 0.5));
  const lo = x(datum.low);
  const hi = x(datum.high);
  const tone = open ? "stroke-l4" : "stroke-l2";
  return (
    <DimGroup dim={dim} onPointerEnter={onEnter}>
      <HitRect
        height={layout.pitch}
        width={width}
        x={0}
        y={y - layout.pitch / 2}
      />
      <Label
        anchor="end"
        middle
        muted={open}
        voice="label"
        x={layout.labelW}
        y={y}
      >
        {datum.label}
      </Label>
      <g className="fade" style={stagger(index, "mark")}>
        <HRule className={tone} kind="plain" x0={lo} x1={hi} y={y} />
        <VRule
          className={tone}
          kind="plain"
          x={lo}
          y0={y - CAP}
          y1={y + CAP + 1}
        />
        <VRule
          className={tone}
          kind="plain"
          x={hi}
          y0={y - CAP}
          y1={y + CAP + 1}
        />
      </g>
      {open ? (
        <Ring
          className="pop stroke-l3"
          cx={x(datum.estimate)}
          cy={y + 0.5}
          size="md"
          style={stagger(index + 3, "mark")}
        />
      ) : (
        <Dot
          className="pop fill-hero"
          cx={x(datum.estimate)}
          cy={y + 0.5}
          size="md"
          style={stagger(index + 3, "mark")}
        />
      )}
      <Label
        anchor="start"
        middle
        order={index + 4}
        tier="mark"
        voice={open ? "axis" : "value"}
        x={hi + AFTER}
        y={y}
      >
        {text}
      </Label>
    </DimGroup>
  );
};

/** What the rows say, in words, from the data passed in. */
const describe = (
  data: RangeDatum[],
  props: RangeDotsProps,
  format: Format
) => {
  const open = data.filter((d) => isOpen(d, props.wide));
  const cover =
    props.coverage === undefined
      ? "an interval"
      : `a ${Math.round(props.coverage * 100)}% interval`;
  const [widest] = data.toSorted((a, b) => b.high - b.low - (a.high - a.low));
  return [
    `${plural(data.length, "estimate")}, each with ${cover}.`,
    `Widest: ${widest.label}, ${format(widest.low)} to ${format(widest.high)}.`,
    open.length === 0
      ? ""
      : `Too wide to rank: ${open.map((d) => d.label).join(", ")}.`,
    "The data table lists every row.",
  ]
    .filter((text) => text !== "")
    .join(" ");
};

/** React keys: each datum's key, numbered when the key repeats. */
const reactKeys = (data: RangeDatum[]) => {
  const seen = new Map<string, number>();
  return data.map((d) => {
    const key = keyOf(d);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);
    return `${key}#${nth}`;
  });
};

interface SvgProps {
  data: RangeDatum[];
  format: (v: number) => string;
  height: number;
  hover: ReturnType<typeof useHover<number>>;
  keys: string[];
  name: string;
  props: RangeDotsProps;
  texts: string[];
  width: number;
}

/** The axis, the grid and one row for each estimate. */
const RangeSvg = ({
  data,
  format,
  height,
  hover,
  keys,
  name,
  props,
  texts,
  width,
}: SvgProps) => {
  const layout = layoutOf(props, data, texts, { height, width });
  const ticks = layout.x.ticks(4);
  return (
    <ChartSvg
      desc={data.length === 0 ? "No data." : describe(data, props, format)}
      height={height}
      label={name}
      leave={hover.clear}
      width={width}
    >
      <VGrid xs={ticks.map((t) => layout.x(t))} y0={TOP} y1={layout.axisY} />
      <HRule
        x0={layout.x.range()[0]}
        x1={layout.x.range()[1]}
        y={layout.axisY}
      />
      {ticks.map((t) => (
        <Label
          anchor="middle"
          key={t}
          voice="axis"
          x={layout.x(t)}
          y={layout.axisY + 18}
        >
          {format(t)}
        </Label>
      ))}
      {data.map((d, i) => (
        <Row
          datum={d}
          dim={hover.dim(i)}
          format={format}
          index={i}
          key={keys[i]}
          layout={layout}
          onEnter={hover.enter(
            i,
            layout.x(d.estimate),
            Math.round(TOP + layout.pitch * (i + 0.5)) - 16
          )}
          open={isOpen(d, props.wide)}
          text={texts[i]}
          width={width}
        />
      ))}
      <FootNote
        height={height}
        metrics={props.metrics}
        text={noteOf(props)}
        width={width}
      />
    </ChartSvg>
  );
};

const RangeDotsPlot = (props: RangeDotsProps) => {
  const data = (props.data ?? []).filter(
    (d) =>
      Number.isFinite(d.estimate) &&
      Number.isFinite(d.low) &&
      Number.isFinite(d.high)
  );
  const format = resolveFormat(props.format);
  const margin =
    props.formatMargin === undefined
      ? format
      : resolveFormat(props.formatMargin);
  const texts = data.map((d) => printed(d, format, margin));
  const keys = reactKeys(data);
  const hover = useHover<number>();
  const height =
    props.height ??
    TOP +
      data.length * ROW +
      SCALE_ROOM +
      noteSpace(noteOf(props), 480, 20, props.metrics);
  const cover =
    props.coverage === undefined
      ? ""
      : `, ${Math.round(props.coverage * 100)}% interval`;
  const ranking = props.wide !== undefined;
  const name =
    props.title ?? `Estimates with intervals for ${plural(data.length, "row")}`;

  return (
    <Plot
      {...plotOptions(props)}
      initialWidth={props.initialWidth}
      table={chartTable(
        props,
        name,
        [
          "Label",
          "Estimate",
          `Low${cover}`,
          `High${cover}`,
          ...(ranking ? ["Ranking"] : []),
        ],
        data.map((d) => [
          d.label,
          format(d.estimate),
          format(d.low),
          format(d.high),
          ...(ranking
            ? [isOpen(d, props.wide) ? "Too wide to rank" : "Ranked"]
            : []),
        ])
      )}
      width={props.width}
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[
                texts[hover.at.key],
                ...(isOpen(data[hover.at.key], props.wide)
                  ? ["too wide to rank"]
                  : []),
              ]}
              lead={data[hover.at.key].label}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <RangeSvg
          data={data}
          format={format}
          height={height}
          hover={hover}
          keys={keys}
          name={name}
          props={props}
          texts={texts}
          width={width}
        />
      )}
    </Plot>
  );
};

/**
 * Error bars. One row for each estimate: a dot at the estimate, a whisker
 * with a cap at each end across its interval, and its value after it, as
 * "42% ± 4". A row whose interval is wider than `wide` is too uncertain to
 * rank, so its dot is open and the whole row steps back to a quieter tone.
 *
 * Props are the `rangeDotsSchema` payload (src/schema/range-dots.ts); `data`
 * is required and never defaults to demo data. Give `width` and `height` for
 * a fixed-size chart that is complete on the first (server) render. Bad input
 * is tolerated: a row with a value that is not a finite number is skipped,
 * rows draw in the order given (sort them to rank), an interval that does
 * not hold its estimate is drawn as given, and no data draws a quiet empty
 * axis.
 */
export const RangeDots = (props: RangeDotsProps) =>
  scoped(props.idPrefix, <RangeDotsPlot {...props} />);
