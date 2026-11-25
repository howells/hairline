import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { plural } from "../../lib/format";
import { resolveFormat } from "../../schema/format";
import { keyOf } from "../../schema/key";
import type { SlopeProps, SlopeRow as RowData } from "../../schema/slope";
import { Plot } from "../core";
import { DimGroup } from "../hover";
import { nudge } from "../line-ends";
import type { Nudged } from "../line-ends";
import { Dot, Ring } from "../markers";
import { FootNote } from "../plot-note";
import { Pointer } from "../pointer";
import type { Stop } from "../pointer";
import { VALUE } from "../roles";
import { VRule } from "../rules";
import { chartTable, plotOptions, scoped } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { noteSpace, stagger } from "../util";
import { nameWidth } from "./room";

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

/**
 * The labels carry semibold values, wider than the measure's regular glyphs,
 * so nothing is shaved off their width: a shave let the longest name run past
 * the svg's edge at phone widths, where it was clipped.
 */
const LABEL_SHAVE = 1;

/** Below this width the narrow format is used, px. */
const NARROW = 520;

/** Gap between a column and its row labels, px. */
const LABEL_GAP = 14;

/** A label nudged off its row's end is joined back to it by a short leader. */
const Leader = (props: {
  at: number;
  label: Nudged;
  side: 1 | -1;
  x: number;
}) =>
  props.label.moved ? (
    <line
      className="rule"
      x1={props.x + props.side * 4}
      x2={props.x + props.side * (LABEL_GAP - 3)}
      y1={props.at}
      y2={props.label.y}
    />
  ) : null;

type Role = "lead" | "worst" | "rest";

type Alert = NonNullable<SlopeProps["alert"]>;

/**
 * The biggest change against the alert direction in the hero tone, the biggest
 * change in it in red, every other row grey. Values stay in text tones: ink for the two marked rows.
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
  labelYs: [Nudged, Nudged];
  y: ScaleLinear<number, number>;
  dim: boolean;
  /** The hero row, the alert row, or neither. */
  role: Role;
  format: (v: number) => string;
}) => {
  const { i, row, y } = props;
  const [xa, xb] = props.xs;
  const tone = ROW_TONE[props.role];
  const valueClass = `${VALUE} ${tone.value}`;
  const { name } = row;

  return (
    <DimGroup className="fade" dim={props.dim} style={stagger(i)}>
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
      <Leader at={y(row.from)} label={props.labelYs[0]} side={-1} x={xa} />
      <Leader at={y(row.to)} label={props.labelYs[1]} side={1} x={xb} />
      <text
        x={xa - LABEL_GAP}
        y={props.labelYs[0].y}
        dy="0.34em"
        textAnchor="end"
        className="t-label"
      >
        <tspan fill="var(--hl-muted)">{name} </tspan>
        <tspan className={valueClass}>{props.format(row.from)}</tspan>
      </text>
      <text
        x={xb + LABEL_GAP}
        y={props.labelYs[1].y}
        dy="0.34em"
        className="t-label"
      >
        <tspan className={valueClass}>{props.format(row.to)}</tspan>
        <tspan fill="var(--hl-muted)"> {name}</tspan>
      </text>
    </DimGroup>
  );
};

/**
 * The row's role. The biggest change in the `alert` direction is the alert
 * ("worst"), the biggest change the other way is the hero ("lead"); with no
 * alert direction, the biggest change either way is the hero.
 */
const roleOf = (row: Row, rows: Row[], alert: Alert): Role => {
  const change = (r: Row) => r.to - r.from;

  if (alert === "none") {
    const biggest = Math.max(...rows.map((r) => Math.abs(change(r))));

    return biggest > 0 && Math.abs(change(row)) === biggest ? "lead" : "rest";
  }

  // Signed so that the alert direction is positive.
  const bad = (r: Row) => (alert === "rise" ? change(r) : -change(r));
  const best = Math.min(...rows.map(bad));
  const worst = Math.max(...rows.map(bad));

  if (best < 0 && bad(row) === best) {
    return "lead";
  }

  return worst > 0 && bad(row) === worst ? "worst" : "rest";
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

/** Where the two columns stand: each side's labels run out to the edge, the columns just inside. */
const columnXs = (
  rows: RowData[],
  format: (v: number) => string,
  width: number,
  metrics: SlopeProps["metrics"]
): [number, number] => [
  LABEL_GAP +
    nameWidth(
      rows.map((r) => `${r.name} ${format(r.from)}`),
      LABEL_SHAVE,
      metrics
    ),
  width -
    LABEL_GAP -
    3 -
    nameWidth(
      rows.map((r) => `${format(r.to)} ${r.name}`),
      LABEL_SHAVE,
      metrics
    ),
];

const SlopeSvg = (props: {
  domain: [number, number];
  format: (v: number) => string;
  h: number;
  props: SlopeProps;
  rows: Row[];
  width: number;
}) => {
  const { domain, format, h, rows, width } = props;
  const chart = props.props;
  const top = 40;

  // The note sits under the columns, which stop short of it.
  const noteRoom = noteSpace(chart.unitNote, width - 16, 26, chart.metrics);
  const bottom = 24 + noteRoom;
  const xs = columnXs(rows, format, width, chart.metrics);

  const y = scaleLinear()
    .domain(domain)
    .range([h - bottom, top + 16]);

  const lys = nudge(
    rows.map((r) => y(r.from)),
    15,
    top + 8,
    h - bottom + 16
  );

  const rys = nudge(
    rows.map((r) => y(r.to)),
    15,
    top + 8,
    h - bottom + 16
  );

  const seen = new Map<string, number>();

  const keys = rows.map((r) => {
    const key = keyOf(r);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);

    return `${key}#${nth}`;
  });

  const roleAt = (r: Row, i: number): Role => {
    if (chart.emphasis === undefined) {
      return roleOf(r, rows, chart.alert ?? "rise");
    }

    // The first row of that key leads, should the key repeat.
    return keys[i] === `${chart.emphasis}#0` ? "lead" : "rest";
  };

  const label =
    chart.title ??
    chart.label ??
    (rows.length === 0
      ? "No data"
      : rows
          .map(
            (r) =>
              `${r.name} ${format(r.from)} ${chart.labels[0]}, ${format(r.to)} ${chart.labels[1]}`
          )
          .join("; "));

  const stops: Stop<number>[] = rows.map((r, i) => ({
    key: i,
    lead: r.name,
    rows: [
      { name: chart.labels[0], value: format(r.from) },
      { name: chart.labels[1], value: format(r.to) },
    ],
    x: (xs[0] + xs[1]) / 2,
    y: (lys[i].y + rys[i].y) / 2,
  }));

  return (
    <Pointer axis="y" height={h} stops={stops} width={width}>
      {(pointer) => (
        <ChartSvg
          desc={summary(rows, chart.labels, format)}
          height={h}
          label={label}
          width={width}
          {...pointer.svg}
        >
          <Columns
            xs={xs}
            labels={chart.labels}
            top={top}
            height={h - noteRoom}
          />
          {rows.map((r, i) => (
            <SlopeRow
              key={keys[i]}
              row={r}
              i={i}
              xs={xs}
              labelYs={[lys[i], rys[i]]}
              y={y}
              dim={pointer.key !== null && pointer.key !== i}
              role={roleAt(r, i)}
              format={format}
            />
          ))}
          <FootNote
            height={h}
            metrics={chart.metrics}
            text={chart.unitNote}
            width={width}
          />
        </ChartSvg>
      )}
    </Pointer>
  );
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
      {(width) => (
        <SlopeSvg
          domain={domain}
          format={width < NARROW ? narrow : wide}
          h={h}
          props={props}
          rows={rows}
          width={width}
        />
      )}
    </Plot>
  );
};

/**
 * Before/after slope chart, the bare plot: by default the biggest fall inked
 * and the biggest rise red (`alert` turns that round, or off), or the
 * `emphasis` row inked alone. Name, source and notes belong
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
