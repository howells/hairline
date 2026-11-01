import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { plural } from "../../lib/format";
import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/key";
import type { SlopeProps, SlopeRow as RowData } from "../../schema/slope";
import { Plot } from "../core";
import { useHover } from "../hooks";
import { DimGroup } from "../hover";
import { Dot, Ring } from "../markers";
import { LABEL, VALUE } from "../roles";
import { VRule } from "../rules";
import { chartTable, plotOptions, scoped } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { stagger } from "../util";
import { nameWidth } from "./room";
import { relax } from "./spread";

type Row = RowData;

/** The two year columns: a rule and a heading each. */
const Columns = (props: {
  xs: [number, number];
  labels: [string, string];
  top: number;
  height: number;
}) =>
  props.xs.map((x, i) => (
    <g key={x}>
      <VRule kind="grid" x={x} y0={props.top} y1={props.height} />
      <Label anchor="middle" voice="axis" x={x} y={props.top - 14}>
        {props.labels[i]}
      </Label>
    </g>
  ));

/** The labels carry semibold values, so less is shaved off their width. */
const LABEL_SHAVE = 0.95;

/** Below this width the narrow format is used, px. */
const NARROW = 520;

/** Gap between a column and its row labels, px. */
const LABEL_GAP = 14;

type Role = "lead" | "worst" | "rest";

/**
 * The biggest fall in the hero tone, the single biggest rise in red, every other
 * row grey. Values stay in text tones: ink for the two marked rows.
 */
const ROW_TONE: Record<
  Role,
  { dotClass: string; ringClass: string; stroke: string; value: string }
> = {
  lead: {
    dotClass: "fill-hero",
    ringClass: "stroke-hero",
    stroke: "var(--hl-hero)",
    value: "fill-ink",
  },
  rest: {
    dotClass: "fill-l3",
    ringClass: "stroke-l3",
    stroke: "var(--hl-l3)",
    value: "fill-muted",
  },
  worst: {
    dotClass: "fill-alert",
    ringClass: "stroke-alert",
    stroke: "var(--hl-alert)",
    value: "fill-ink",
  },
};

/** One row's before/after segment with a label at each end. */
const SlopeRow = (props: {
  row: Row;
  i: number;
  xs: [number, number];
  labelYs: [number, number];
  y: ScaleLinear<number, number>;
  dim: boolean;
  /** The biggest fall, the biggest rise, or neither. */
  role: Role;
  format: (v: number) => string;
  onHover: () => void;
}) => {
  const { i, row, y } = props;
  const [xa, xb] = props.xs;
  const tone = ROW_TONE[props.role];
  const valueClass = `${VALUE} ${tone.value}`;
  const { name } = row;
  return (
    <DimGroup
      className="fade"
      dim={props.dim}
      style={stagger(i)}
      onPointerEnter={props.onHover}
    >
      <line
        x1={xa}
        x2={xb}
        y1={y(row.from)}
        y2={y(row.to)}
        stroke="transparent"
        strokeWidth={14}
      />
      <line
        className="cap-round"
        x1={xa}
        x2={xb}
        y1={y(row.from)}
        y2={y(row.to)}
        stroke={tone.stroke}
        strokeWidth={1.5}
      />
      <Ring className={tone.ringClass} cx={xa} cy={y(row.from)} size="sm" />
      <Dot
        className={tone.dotClass}
        cx={xb}
        cy={y(row.to)}
        size={props.role === "rest" ? "sm" : "md"}
      />
      <text
        x={xa - LABEL_GAP}
        y={props.labelYs[0]}
        dy="0.34em"
        textAnchor="end"
        className={LABEL}
      >
        <tspan fill="var(--hl-muted)">{name} </tspan>
        <tspan className={valueClass}>{props.format(row.from)}</tspan>
      </text>
      <text
        x={xb + LABEL_GAP}
        y={props.labelYs[1]}
        dy="0.34em"
        className={LABEL}
      >
        <tspan className={valueClass}>{props.format(row.to)}</tspan>
        <tspan fill="var(--hl-muted)"> {name}</tspan>
      </text>
    </DimGroup>
  );
};

/** The row's role: the biggest fall, the biggest rise, or neither. */
const roleOf = (row: Row, rows: Row[]): Role => {
  const change = (r: Row) => r.to - r.from;
  const best = Math.min(...rows.map(change));
  const worst = Math.max(...rows.map(change));
  if (best < 0 && change(row) === best) {
    return "lead";
  }
  return worst > 0 && change(row) === worst ? "worst" : "rest";
};

/** The lowest and highest value of any row; a flat set is given some room. */
const extentOf = (rows: Row[]): [number, number] => {
  const values = rows.flatMap((r) => [r.from, r.to]);
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (values.length === 0) {
    return [0, 1];
  }
  return low === high ? [low - 1, high + 1] : [low, high];
};

/** What the lines say, in words, from the data passed in. */
const summary = (
  rows: RowData[],
  labels: [string, string],
  format: (v: number) => string
) => {
  if (rows.length === 0) {
    return "No data.";
  }
  let [up] = rows;
  let [down] = rows;
  for (const r of rows) {
    up = r.to - r.from > up.to - up.from ? r : up;
    down = r.to - r.from < down.to - down.from ? r : down;
  }
  return `${plural(rows.length, "line")} from ${labels[0]} to ${labels[1]}. Biggest rise: ${up.name}, ${format(up.from)} to ${format(up.to)}. Biggest fall: ${down.name}, ${format(down.from)} to ${format(down.to)}. The data table lists every line.`;
};

const SlopePlot = (props: SlopeProps) => {
  const rows = (props.rows ?? []).filter(
    (r) => Number.isFinite(r.from) && Number.isFinite(r.to)
  );
  const h = props.height ?? 420;
  const wide = resolveFormat(props.format);
  const narrow =
    props.narrowFormat === undefined ? wide : resolveFormat(props.narrowFormat);
  const domain = props.domain ?? extentOf(rows);
  const hover = useHover<number>();

  return (
    <Plot
      {...plotOptions(props)}
      initialWidth={props.initialWidth}
      table={chartTable(
        props,
        props.title ?? props.label ?? "Change between two points",
        ["Name", props.labels[0], props.labels[1]],
        rows.map((r) => [r.name, wide(r.from), wide(r.to)])
      )}
      width={props.width}
    >
      {(width) => {
        const format = width < NARROW ? narrow : wide;
        const top = 40;
        const bottom = 24;
        // Each side's labels run out to the edge: the columns sit just inside.
        const xs: [number, number] = [
          LABEL_GAP +
            nameWidth(
              rows.map((r) => `${r.name} ${format(r.from)}`),
              LABEL_SHAVE,
              props.metrics
            ),
          width -
            LABEL_GAP -
            3 -
            nameWidth(
              rows.map((r) => `${format(r.to)} ${r.name}`),
              LABEL_SHAVE,
              props.metrics
            ),
        ];
        const y = scaleLinear()
          .domain(domain)
          .range([h - bottom, top + 16]);
        // relax reads its first item, so no rows is spared the call.
        const spread = (ys: number[]) =>
          ys.length === 0 ? ys : relax(ys, 15, top + 8, h - 8);
        const lys = spread(rows.map((r) => y(r.from)));
        const rys = spread(rows.map((r) => y(r.to)));
        const seen = new Map<string, number>();
        const keys = rows.map((r) => {
          const key = keyOf(r);
          const nth = seen.get(key) ?? 0;
          seen.set(key, nth + 1);
          return `${key}#${nth}`;
        });
        const roleAt = (r: Row, i: number): Role => {
          if (props.emphasis === undefined) {
            return roleOf(r, rows);
          }
          // The first row of that key leads, should the key repeat.
          return keys[i] === `${props.emphasis}#0` ? "lead" : "rest";
        };
        const label =
          props.title ??
          props.label ??
          (rows.length === 0
            ? "No data"
            : rows
                .map(
                  (r) =>
                    `${r.name} ${format(r.from)} ${props.labels[0]}, ${format(r.to)} ${props.labels[1]}`
                )
                .join("; "));

        return (
          <ChartSvg
            desc={summary(rows, props.labels, format)}
            height={h}
            label={label}
            leave={hover.clear}
            width={width}
          >
            <Columns xs={xs} labels={props.labels} top={top} height={h} />
            {rows.map((r, i) => (
              <SlopeRow
                key={keys[i]}
                row={r}
                i={i}
                xs={xs}
                labelYs={[lys[i], rys[i]]}
                y={y}
                dim={hover.dim(i)}
                role={roleAt(r, i)}
                format={format}
                onHover={() => {
                  hover.show(i);
                }}
              />
            ))}
          </ChartSvg>
        );
      }}
    </Plot>
  );
};

/**
 * Before/after slope chart, the bare plot: the biggest fall inked, the biggest
 * rise red, or the `emphasis` row inked alone. Name, source and notes belong
 * to the host.
 *
 * Props are the `slopeSchema` payload (src/schema/slope.ts); `rows` is
 * required and never defaults to demo data. Give `width` and `height` for a
 * fixed-size chart that is complete on the first (server) render. Bad input
 * is tolerated: a row with a value that is not a finite number is skipped,
 * duplicate names each get a line (give them `id`s to tell them apart), and
 * no rows draws the two headed columns alone.
 */
export const Slope = (props: SlopeProps) =>
  scoped(props.idPrefix, <SlopePlot {...props} />);
