import { scaleLinear } from "d3-scale";
import type { ScaleLinear } from "d3-scale";

import { plural } from "../../lib/format";
import { resolveFormat } from "../../schema/format";
import type { HeroContext } from "../../schema/hero";
import { keyOf } from "../../schema/key";
import type { PlumbDatum, PlumbScatterProps } from "../../schema/plumb-scatter";
import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { contextClass, heroKeys, heroLast } from "../hero";
import { HeroDot, HeroLabel } from "../hero-marks";
import { useHover } from "../hooks";
import { DimGroup, HitRect, TipText } from "../hover";
import { Dot } from "../markers";
import { FootNote } from "../plot-note";
import {
  clears,
  clearsAll,
  referenceDesc,
  referenceRows,
  referenceValues,
} from "../reference-marks";
import { ReferenceBands, ReferenceOverlay } from "../references";
import { HRule, Stem } from "../rules";
import { chartTable, plotOptions, scoped } from "../shared-options";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DottedLine } from "../texture";
import { TEXTURE_PITCH } from "../texture-ids";
import {
  NOTE_LINE,
  hasText,
  noteLines,
  sansWidth,
  stagger,
  noteOf,
} from "../util";

interface FloorProps {
  floor: number;
  highName: string;
  lowName: string;
  x0: number;
  x1: number;
  yLabel: string;
}

/** The floor: one hairline with the axis names; the y name sits top left. */
const Floor = ({ floor, highName, lowName, x0, x1, yLabel }: FloorProps) => (
  <g>
    <HRule x0={Math.round(x0)} x1={Math.round(x1)} y={floor} />
    <Label voice="axis" x={x0} y={floor + 20}>
      {lowName}
    </Label>
    <Label anchor="end" voice="axis" x={x1} y={floor + 20}>
      {highName}
    </Label>
    <Label voice="axis" x={x0} y={20}>
      {yLabel}
    </Label>
  </g>
);

/** A point's tone: by whether it clears the reference lines that ask for ink, else the context's. */
const dotClass = (
  clearing: boolean | undefined,
  context: HeroContext | undefined
) => {
  if (clearing !== undefined) {
    return clearing ? "pop fill-hero" : "pop fill-l5";
  }
  return `pop ${contextClass(context, "fill")}`;
};

/** Where a point's name sits: centred above the dot, or beside it. */
interface Placement {
  anchor: "end" | "middle" | "start";
  dx: number;
  dy: number;
}

/** Margin kept between a name and the svg edge. */
const EDGE = 2;

const ABOVE: Placement = { anchor: "middle", dx: 0, dy: -12 };
const PLACEMENTS: Placement[] = [
  ABOVE,
  { anchor: "start", dx: 10, dy: 4 },
  { anchor: "end", dx: -10, dy: 4 },
];

/** Horizontal extent of a name set with `place` at `px`. */
const extent = (place: Placement, px: number, w: number) => {
  if (place.anchor === "middle") {
    return [px - w / 2, px + w / 2];
  }
  return place.anchor === "start"
    ? [px + place.dx, px + place.dx + w]
    : [px + place.dx - w, px + place.dx];
};

/**
 * The first placement whose name stays inside the svg and crosses no other
 * point's stem: a stem runs from its dot down to the floor, so a name set low
 * beside a tall stem would cut it. Failing that, the hero's name takes the
 * first that stays inside, or sits above slid in from the edge; any other
 * name is left to the tooltip.
 */
const placeName = (
  self: { px: number; py: number; w: number },
  stems: { px: number; py: number }[],
  width: number,
  hero: boolean
): Placement | undefined => {
  const inside = (place: Placement) => {
    const [l, r] = extent(place, self.px, self.w);
    return l >= EDGE && r <= width - EDGE && self.py + place.dy - 10 > 0;
  };
  const clear = (place: Placement) => {
    const [l, r] = extent(place, self.px, self.w);
    return stems.every(
      (st) =>
        st.px === self.px ||
        st.px < l - 4 ||
        st.px > r + 4 ||
        st.py > self.py + place.dy + 2
    );
  };
  const clean = PLACEMENTS.find((place) => inside(place) && clear(place));
  if (clean !== undefined || !hero) {
    return clean;
  }
  const half = self.w / 2;
  return (
    PLACEMENTS.find(inside) ?? {
      ...ABOVE,
      dx: Math.max(
        EDGE + half - self.px,
        Math.min(0, width - EDGE - half - self.px)
      ),
    }
  );
};

/** Spots along a point's printed name, for reference labels to keep clear of. */
const nameSpots = (
  place: Placement | undefined,
  self: { px: number; py: number; w: number }
) => {
  if (place === undefined) {
    return [];
  }
  const [l, r] = extent(place, self.px, self.w);
  const y = self.py + place.dy;
  return Array.from({ length: Math.ceil((r - l) / 24) + 1 }, (_, k) => ({
    x: Math.min(r, l + k * 24),
    y,
  }));
};

interface PointProps {
  /** Whether the point clears the reference lines that ask for ink; undefined when none does. */
  clearing: boolean | undefined;
  context: HeroContext | undefined;
  datum: PlumbDatum;
  dim: boolean;
  floor: number;
  format: (v: number) => string;
  hero: boolean;
  onEnter: (x: number, y: number) => void;
  order: number;
  /** Where the name sits; undefined when the point is not named. */
  place: Placement | undefined;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

/** One point on its stem to the floor (evenly dotted, solid ink for the hero), named when asked. */
const Point = ({
  clearing,
  context,
  datum,
  dim,
  floor,
  format,
  hero,
  onEnter,
  order,
  place,
  x,
  y,
}: PointProps) => {
  const px = x(datum.x);
  const py = y(datum.y);
  const named = place !== undefined;
  return (
    <DimGroup
      dim={dim}
      onPointerEnter={() => {
        onEnter(px, py - (named ? 28 : 10));
      }}
    >
      <HitRect height={floor - py + 10} width={18} x={px - 9} y={py - 10} />
      {hero ? (
        <Stem
          className="grow-y stroke-hero"
          hero
          style={stagger(order, "mark")}
          x={px}
          y0={Math.round(floor)}
          y1={py}
        />
      ) : (
        <g className="fade" style={stagger(order, "mark")}>
          <DottedLine
            pitch={TEXTURE_PITCH.dense}
            tone={contextClass(context, "fill")}
            x0={px}
            x1={px}
            y0={py + 4}
            y1={floor - 2}
          />
        </g>
      )}
      {hero && clearing === undefined ? (
        <HeroDot
          className="pop"
          cx={crisp(px)}
          cy={py}
          style={stagger(order + 6, "mark")}
        />
      ) : (
        <Dot
          className={dotClass(clearing, context)}
          cx={crisp(px)}
          cy={py}
          size={hero ? "md" : "sm"}
          style={stagger(order + 6, "mark")}
        />
      )}
      {place === undefined ? null : (
        <Label
          anchor={place.anchor}
          order={order + 8}
          tier="mark"
          voice={hero ? "label" : "axis"}
          x={px + place.dx}
          y={py + place.dy}
        >
          {datum.label} · {format(datum.y)}
        </Label>
      )}
    </DimGroup>
  );
};

/** React keys: each datum's key, numbered when the key repeats. */
const reactKeys = (data: PlumbDatum[]) => {
  const seen = new Map<string, number>();
  return data.map((d) => {
    const key = keyOf(d);
    const nth = seen.get(key) ?? 0;
    seen.set(key, nth + 1);
    return `${key}#${nth}`;
  });
};

/** Default y range: from a tidy floor under the lowest (zero if none dips below) to the highest. */
const defaultYDomain = (ys: number[]): [number, number] => {
  if (ys.length === 0) {
    return [0, 1];
  }
  const min = Math.min(...ys);
  const tidy = Math.floor((min - 10) / 10) * 10;
  const lo = min < 0 ? tidy : Math.max(0, tidy);
  const hi = Math.max(...ys);
  return [lo, hi > lo ? hi : lo + 1];
};

/** Default x range: zero (or a tidy floor, if any x is negative) to a little past the largest. */
const defaultXDomain = (xs: number[]): [number, number] => {
  if (xs.length === 0) {
    return [0, 10];
  }
  const lo =
    Math.min(...xs) < 0 ? Math.floor((Math.min(...xs) * 1.12) / 10) * 10 : 0;
  const hi = Math.ceil((Math.max(...xs) * 1.12) / 10) * 10;
  return [lo, hi > lo ? hi : lo + 10];
};

/** Indices of the points to name: those whose key is listed, else `fallback`. */
const labelledIndices = (
  data: PlumbDatum[],
  keys: string[] | undefined,
  fallback: number[]
) => {
  if (keys === undefined) {
    return new Set(fallback);
  }
  const wanted = new Set(keys);
  return new Set(data.flatMap((d, i) => (wanted.has(keyOf(d)) ? [i] : [])));
};

/** What the points say, in words, from the data passed in. */
const summary = (
  data: PlumbDatum[],
  formats: { x: (v: number) => string; y: (v: number) => string },
  props: PlumbScatterProps,
  heroCount: number
) => {
  if (data.length === 0) {
    return "No data.";
  }
  const ys = data.map((d) => d.y);
  const high = data[ys.indexOf(Math.max(...ys))];
  const low = data[ys.indexOf(Math.min(...ys))];
  return [
    `${plural(data.length, "point")}. Highest: ${high.label}, ${formats.y(high.y)}. Lowest: ${low.label}, ${formats.y(low.y)}.`,
    props.heroLabel === undefined
      ? ""
      : `${props.heroLabel}: ${plural(heroCount, "point")}.`,
    referenceDesc(props.references, formats.y, "y"),
    referenceDesc(props.xReferences, formats.x, "x"),
    "The data table lists every point.",
  ]
    .filter((text) => text !== "")
    .join(" ");
};

/** The svg's accessible name: every point read out, or "No data". */
const describe = (
  data: PlumbDatum[],
  formatX: (v: number) => string,
  format: (v: number) => string
) =>
  data.length === 0
    ? "No data"
    : data.map((d) => `${d.label}: ${formatX(d.x)}, ${format(d.y)}`).join("; ");

const scatterTip = (
  at: { key: number; x: number; y: number } | null,
  data: PlumbDatum[],
  formatX: (v: number) => string,
  format: (v: number) => string
) =>
  at === null ? null : (
    <Tooltip x={at.x} y={at.y}>
      <TipText
        facts={[formatX(data[at.key].x), format(data[at.key].y)]}
        lead={data[at.key].label}
      />
    </Tooltip>
  );

interface NamesArgs {
  format: (v: number) => string;
  heroes: ReadonlySet<number>;
  labelled: Set<number>;
  metrics: PlumbScatterProps["metrics"];
  width: number;
  x: (v: number) => number;
  y: (v: number) => number;
}

/** Where each labelled point prints its name, and the spots that keeps reference labels off. */
const namesOf = (data: PlumbDatum[], a: NamesArgs) => {
  const { format, heroes, labelled, metrics, width, x, y } = a;
  const selves = data.map((d, i) => ({
    px: x(d.x),
    py: y(d.y),
    w: sansWidth(
      `${d.label} · ${format(d.y)}`,
      heroes.has(i) ? 12 : 11,
      metrics
    ),
  }));
  const places = selves.map((self, i) =>
    labelled.has(i)
      ? placeName(
          self,
          selves.map((o) => ({ px: o.px, py: o.py })),
          width,
          heroes.has(i)
        )
      : undefined
  );
  const avoid = [
    ...data.map((d) => ({ x: x(d.x), y: y(d.y) })),
    ...selves.flatMap((self, i) => nameSpots(places[i], self)),
  ];
  return { avoid, places };
};

/** The topmost of the given points on the page (the smallest y). */
const topmost = (points: { x: number; y: number }[]) =>
  points.toSorted((a, b) => a.y - b.y)[0];

/** Whether a point clears the reference lines that ask for ink; undefined when none does. */
const clearingOf = (props: PlumbScatterProps, d: PlumbDatum) =>
  clearsAll([clears(props.references, d.y), clears(props.xReferences, d.x)]);

interface SvgProps {
  data: PlumbDatum[];
  domains: { x: [number, number]; y: [number, number] };
  format: (v: number) => string;
  formatX: (v: number) => string;
  height: number;
  heroes: ReadonlySet<number>;
  hover: ReturnType<typeof useHover<number>>;
  keys: string[];
  label: string;
  labelled: Set<number>;
  order: Map<number, number>;
  props: PlumbScatterProps;
  width: number;
}

/** The floor, the references and a stemmed point for each datum. */
const PlumbScatterSvg = ({
  data,
  domains,
  format,
  formatX,
  height,
  heroes,
  hover,
  keys,
  label,
  labelled,
  order,
  props,
  width,
}: SvgProps) => {
  const [lowName, highName] = props.xLabels ?? ["Low", "High"];
  const hasNote = hasText(noteOf(props));
  const plotW = Math.min(width - EDGE * 2, 600);
  const x0 = (width - plotW) / 2;
  const notes = noteLines(noteOf(props), width - 24, props.metrics);
  const floor =
    Math.round(height) -
    (hasNote ? 58 : 36) -
    Math.max(0, notes.length - 1) * NOTE_LINE;
  const x = scaleLinear()
    .domain(domains.x)
    .range([x0, x0 + plotW]);
  const y = scaleLinear()
    .domain(domains.y)
    .range([floor - 14, 46]);
  const plane = { x0, x1: x0 + plotW, y0: 30, y1: floor };
  const { avoid, places } = namesOf(data, {
    format,
    heroes,
    labelled,
    metrics: props.metrics,
    width,
    x,
    y,
  });
  return (
    <ChartSvg
      desc={summary(data, { x: formatX, y: format }, props, heroes.size)}
      height={height}
      label={label}
      leave={hover.clear}
      width={width}
    >
      <Floor
        floor={floor}
        highName={highName}
        lowName={lowName}
        x0={x0}
        x1={x0 + plotW}
        yLabel={props.yLabel ?? "Higher ↑"}
      />
      <ReferenceBands
        along="y"
        plane={plane}
        refs={props.references}
        scale={y}
      />
      <ReferenceBands
        along="x"
        plane={plane}
        refs={props.xReferences}
        scale={x}
      />
      {heroLast([...data.keys()], (i) => heroes.has(i)).map((i) => (
        <Point
          clearing={clearingOf(props, data[i])}
          context={props.context}
          place={places[i]}
          datum={data[i]}
          dim={hover.dim(i)}
          floor={floor}
          format={format}
          hero={heroes.has(i)}
          key={keys[i]}
          onEnter={hover.showAt(i)}
          order={order.get(i) ?? i}
          x={x}
          y={y}
        />
      ))}
      {props.heroLabel === undefined || heroes.size === 0 ? null : (
        <HeroLabel
          count={plural(heroes.size, "point")}
          dot={topmost(
            [...heroes].map((i) => ({ x: x(data[i].x), y: y(data[i].y) }))
          )}
          name={props.heroLabel}
          width={width}
        />
      )}
      <ReferenceOverlay
        along="y"
        avoid={avoid}
        plane={plane}
        refs={props.references}
        scale={y}
      />
      <ReferenceOverlay
        along="x"
        avoid={avoid}
        plane={plane}
        refs={props.xReferences}
        scale={x}
      />
      <FootNote
        gutter={12}
        height={height}
        metrics={props.metrics}
        text={noteOf(props)}
        width={width}
      />
    </ChartSvg>
  );
};

const PlumbScatterPlot = (props: PlumbScatterProps) => {
  const data = (props.data ?? []).filter(
    (d) => Number.isFinite(d.x) && Number.isFinite(d.y)
  );
  const height = props.height ?? 440;
  const format = resolveFormat(props.format);
  const formatX =
    props.formatX === undefined
      ? (v: number) => `${Math.round(v)}`
      : resolveFormat(props.formatX);
  const hover = useHover<number>();

  const ys = data.map((d) => d.y);
  const xs = data.map((d) => d.x);
  const keys = reactKeys(data);
  const highest = ys.length === 0 ? -1 : ys.indexOf(Math.max(...ys));
  const lowest = ys.length === 0 ? -1 : ys.indexOf(Math.min(...ys));
  // The hero and the labels are by key so reordering never moves them; a key
  // that names no point draws none. The highest is the hero unless told.
  const heroKeyed = heroKeys(
    props.hero,
    highest < 0 ? [] : [keyOf(data[highest])]
  );
  const heroes = new Set(
    data.flatMap((d, i) => (heroKeyed.has(keyOf(d)) ? [i] : []))
  );
  // The hero group's label names it, so its points need no name of their own.
  const labelled = new Set(
    [...labelledIndices(data, props.labelled, [highest, lowest])].filter(
      (i) => props.heroLabel === undefined || !heroes.has(i)
    )
  );
  const xDomain =
    props.xDomain ??
    defaultXDomain([...xs, ...referenceValues(props.xReferences)]);
  const yDomain =
    props.yDomain ??
    defaultYDomain([...ys, ...referenceValues(props.references)]);
  const byX = data.map((d, i) => ({ i, x: d.x })).toSorted((a, b) => a.x - b.x);
  const order = new Map(byX.map((entry, r) => [entry.i, r]));
  const label = props.title ?? describe(data, formatX, format);
  const columns =
    props.heroLabel === undefined
      ? ["Label", "X", "Y"]
      : ["Label", "X", "Y", props.heroLabel];

  return (
    <Plot
      {...plotOptions(props)}
      initialWidth={props.initialWidth}
      table={chartTable(props, props.title ?? "Points", columns, [
        ...data.map((d, i) => [
          d.label,
          formatX(d.x),
          format(d.y),
          ...(props.heroLabel === undefined
            ? []
            : [heroes.has(i) ? "Yes" : "No"]),
        ]),
        ...referenceRows(props.references, format, {
          axis: "y",
          columns: columns.length,
          values: [2],
        }),
        ...referenceRows(props.xReferences, formatX, {
          axis: "x",
          columns: columns.length,
          values: [1],
        }),
      ])}
      width={props.width}
      overlay={scatterTip(hover.at, data, formatX, format)}
    >
      {(width) => (
        <PlumbScatterSvg
          data={data}
          domains={{ x: xDomain, y: yDomain }}
          format={format}
          formatX={formatX}
          height={height}
          heroes={heroes}
          hover={hover}
          keys={keys}
          label={label}
          labelled={labelled}
          order={order}
          props={props}
          width={width}
        />
      )}
    </Plot>
  );
};

/**
 * F8 Stem scatter. Up to twenty points, each on a stem to the floor so x can
 * be read where the stem lands: dotted at pitch 3, solid ink for the hero.
 * The highest point is the hero unless `hero` lists others; the highest and
 * lowest are named. `context` sets how the rest are drawn, `heroLabel` names
 * the hero group.
 *
 * Props are the `plumbScatterSchema` payload (src/schema/plumb-scatter.ts);
 * `data` is required and never defaults to demo data. Give `width` and
 * `height` for a fixed-size chart that is complete on the first (server)
 * render. Bad input is tolerated: a point with a coordinate that is not a
 * finite number is skipped, coincident points each get a dot, negatives are
 * drawn on the axes, and no data draws a quiet empty axis.
 */
export const PlumbScatter = (props: PlumbScatterProps) =>
  scoped(props.idPrefix, <PlumbScatterPlot {...props} />);
