import { geoContains, geoPath } from "d3-geo";
import type { GeoProjection } from "d3-geo";
import { scaleThreshold } from "d3-scale";
import type { FeatureCollection } from "geojson";
import { useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotScreen, KeySwatch } from "../texture";
import { TEXTURE_PITCH, paint, useTextureIds } from "../texture-ids";
import { clamp, dimClass, noteSpace, sansWidth, stagger } from "../util";
import { mainCentroid } from "./geo";
import type { ChoroplethDatum, Region } from "./geo";

export interface ChoroplethProps {
  ariaLabel: string;
  data: ChoroplethDatum[];
  /** Legend and tooltip text for regions without a value; omit to leave them out of the legend. */
  emptyLabel?: string;
  format: (v: number) => string;
  /** Keys printed on the map. The first is the hero: set in solid ink when it is in the top step. */
  labels: string[];
  /** Upper cap on the map height. */
  maxHeight?: number;
  /** Map height as a share of width. */
  aspect: number;
  note?: string;
  /** Fits a projection into [width, height] for the given outlines. */
  project: (
    size: [number, number],
    outlines: FeatureCollection
  ) => GeoProjection;
  regions: Region[];
  /** Short form for legend and in-map labels, e.g. 96k. */
  short: (v: number) => string;
  /** Four ascending breaks → five shades, heat-1 … heat-5. */
  thresholds: [number, number, number, number];
  /** Unit after the value in the tooltip, e.g. "sign-ups". */
  unit?: string;
}

/** A region as drawn: its outline, label anchor and shade step (−1 = no value). */
interface Territory {
  anchor: [number, number];
  bin: number;
  /** The hero: the one region in solid ink. */
  solid: boolean;
  /** True when every corner of a box lies inside the outline. */
  covers: (box: Box) => boolean;
  d: string;
  key: string;
  name: string;
}

type Focus =
  | { bin: number; kind: "bin" }
  | { key: string; kind: "region" }
  | null;

interface MapTip {
  key: string;
  x: number;
  y: number;
}

/** Room under the map for the key row. */
const LEGEND_H = 52;
/** The key row's centre, below the map. */
const LEGEND_Y = 28;
/** Side of a key swatch (KeySwatch), and the gap before its label. */
const SWATCH = 12;
const SWATCH_GAP = 6;
/** Widest gap between keys. */
const KEY_GAP = 12;
/** Each key's pointer target: at least 44 by 44. */
const HIT = 44;

/**
 * The stepped dot screen for every step, on paper: the dots grow and the
 * screen tightens from pitch 4 to 3 as the value climbs. At the top step the
 * dots touch, leaving only pinholes of paper. Solid ink is the hero's alone.
 */
const SCREENS = [
  { pitch: TEXTURE_PITCH.screen, r: 0.75, tone: "fill-heat-2" },
  { pitch: TEXTURE_PITCH.screen, r: 1.25, tone: "fill-heat-3" },
  { pitch: TEXTURE_PITCH.dense, r: 1, tone: "fill-heat-4" },
  { pitch: TEXTURE_PITCH.dense, r: 1.25, tone: "fill-heat-5" },
  { pitch: TEXTURE_PITCH.dense, r: 1.5, tone: "fill-heat-5" },
] as const;
const SOLID = "fill-heat-5";

interface StepFill {
  className: string;
  fill?: string;
}

/** Fill for a shade step under the pattern id prefix `pid`; −1 (no value) is bare paper. */
const stepFill = (bin: number, pid: string): StepFill => {
  if (bin < 0) {
    return { className: "fill-paper" };
  }
  return { className: "", fill: paint(`${pid}-${bin}`) };
};

/** A region's fill: the hero solid, every other region its step's screen. */
const territoryFill = (t: Territory, pid: string): StepFill =>
  t.solid ? { className: SOLID } : stepFill(t.bin, pid);

/** One screen per shaded step, ids `${pid}-0` … `${pid}-4`. */
const ScreenDefs = (props: { pid: string }) => (
  <defs>
    {SCREENS.map((s, i) => (
      <DotScreen
        ground="fill-paper"
        id={`${props.pid}-${i}`}
        key={`${s.pitch}-${s.r}`}
        pitch={s.pitch}
        r={s.r}
        tone={s.tone}
      />
    ))}
  </defs>
);

interface TerritoryInput {
  hero: string | undefined;
  mapH: number;
  project: ChoroplethProps["project"];
  regions: Region[];
  thresholds: ChoroplethProps["thresholds"];
  values: Map<string, ChoroplethDatum>;
  width: number;
}

const territoriesFor = ({
  hero,
  mapH,
  project,
  regions,
  thresholds,
  values,
  width,
}: TerritoryInput): Territory[] => {
  const outlines: FeatureCollection = {
    features: regions.map((r) => r.feature),
    type: "FeatureCollection",
  };
  const projection = project([width, mapH], outlines);
  const path = geoPath(projection);
  const bins = scaleThreshold().domain(thresholds).range([0, 1, 2, 3, 4]);
  const territories: Territory[] = [];
  for (const region of regions) {
    const d = path(region.feature) ?? "";
    if (d === "") {
      continue;
    }
    const value = values.get(region.key)?.value;
    const inside = (x: number, y: number) => {
      const point = projection.invert?.([x, y]);
      return point !== null && point !== undefined
        ? geoContains(region.feature, point)
        : false;
    };
    const bin = value === undefined ? -1 : bins(value);
    territories.push({
      anchor: mainCentroid(region.feature, path),
      bin,
      covers: (b) =>
        inside(b.x0, b.y0) &&
        inside(b.x1, b.y0) &&
        inside(b.x0, b.y1) &&
        inside(b.x1, b.y1),
      d,
      key: region.key,
      name: region.name,
      solid: region.key === hero && bin === SCREENS.length - 1,
    });
  }
  return territories;
};

/** Region outlines: the 1px l5 rule every texture sits inside, round-joined. */
const OUTLINE = "stroke-l5";

/** The full map, drawn once per size: hover only touches the focus layer above it. */
const RegionLayer = (props: {
  pid: string;
  territories: Territory[];
  width: number;
}) => (
  <g className="transition-opacity group-data-[focus=true]/map:opacity-30">
    {props.territories.map((t) => {
      const f = territoryFill(t, props.pid);
      return (
        <path
          className={`fade ${OUTLINE} ${f.className}`}
          d={t.d}
          data-key={t.key}
          fill={f.fill}
          key={t.key}
          strokeLinejoin="round"
          strokeWidth={1}
          style={stagger(Math.round((t.anchor[0] / props.width) * 24), "mark")}
        />
      );
    })}
  </g>
);

/** Paper text when the label sits wholly on the solid hero; otherwise ink with the paper halo. */
const labelClass = (onDark: boolean) =>
  onDark ? "t-value fill-paper" : "t-value t-halo";

const anchorFor = (dx: number) => {
  if (dx < 0) {
    return "end";
  }
  return dx > 0 ? "start" : "middle";
};

interface MapLabelsProps {
  labels: string[];
  /** Regions lit by hover; labels of the others dim with their regions. */
  lit: Set<string> | null;
  /** Narrow plots drop labels that need a leader, and any after the first that spill out of their region. */
  narrow: boolean;
  short: (v: number) => string;
  territories: Territory[];
  values: Map<string, ChoroplethDatum>;
  width: number;
}

/** A label as placed: its text position, the region anchor and whether it needs a leader. */
interface PlacedLabel {
  anchor: "end" | "middle" | "start";
  ax: number;
  ay: number;
  /** Whether a box sits wholly inside the labelled region. */
  covers: (box: Box) => boolean;
  dy: number;
  key: string;
  leader: boolean;
  /** Whether the labelled region is the solid hero. */
  solid: boolean;
  text: string;
  x: number;
  y: number;
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** Half the height of a `t-value` label box, and the steps tried when one collides. */
const LABEL_HALF = 8;
const NUDGES = [0, -1, 1, -2, 2];

const boxOf = (p: PlacedLabel): Box => {
  const w = sansWidth(p.text, 12);
  const shift = { end: w, middle: w / 2, start: 0 }[p.anchor];
  return {
    x0: p.x - shift - 2,
    x1: p.x - shift + w + 2,
    y0: p.y - LABEL_HALF,
    y1: p.y + LABEL_HALF,
  };
};

/** The glyphs' own box: the label box without its padding, x-height deep. */
const glyphBox = (p: PlacedLabel): Box => {
  const b = boxOf(p);
  return { x0: b.x0 + 2, x1: b.x1 - 2, y0: p.y - 4, y1: p.y + 4 };
};

/** A label set in paper: unled, on the solid hero, its glyphs inside the region. */
const onDark = (p: PlacedLabel) =>
  !p.leader && p.solid && p.covers(glyphBox(p));

const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

/** The label shifted sideways so its box sits inside the plot. */
const keepInside = (p: PlacedLabel, width: number): PlacedLabel => {
  const box = boxOf(p);
  const dx = clamp(0, 2 - box.x0, width - 2 - box.x1);
  return { ...p, x: p.x + dx };
};

/**
 * A label at its home spot: on its region's anchor, or offset (with a
 * leader) by the datum's dx/dy. Null when there is no room for it: an offset
 * label on a narrow plot, or on a narrow plot any label after the first that
 * would spill out of its region.
 */
const homeLabel = (
  key: string,
  props: MapLabelsProps,
  t: Territory | undefined,
  first: boolean
): PlacedLabel | null => {
  const datum = props.values.get(key);
  const dx = datum?.dx ?? 0;
  const dy = datum?.dy ?? 0;
  const offset = dx !== 0 || dy !== 0;
  if (t === undefined || datum === undefined || (offset && props.narrow)) {
    return null;
  }
  const home: PlacedLabel = {
    anchor: anchorFor(dx),
    ax: t.anchor[0],
    ay: t.anchor[1],
    covers: t.covers,
    dy,
    key,
    leader: offset,
    solid: t.solid,
    text: `${datum.label ?? key} ${props.short(datum.value)}`,
    x: t.anchor[0] + dx,
    y: t.anchor[1] + dy,
  };
  const spills = !t.covers(glyphBox(home));
  return props.narrow && !first && spills ? null : home;
};

/**
 * Labels in priority order (the order given). Each keeps its spot when it is
 * free; otherwise it steps up or down a line (with a leader back to its
 * region), and is dropped when no nearby spot is free.
 */
const placeLabels = (props: MapLabelsProps): PlacedLabel[] => {
  const placed: PlacedLabel[] = [];
  const byKey = new Map(props.territories.map((t) => [t.key, t]));
  for (const key of props.labels) {
    const base = homeLabel(key, props, byKey.get(key), placed.length === 0);
    if (base === null) {
      continue;
    }
    const spot = NUDGES.map((n) =>
      keepInside(
        {
          ...base,
          dy: n === 0 ? base.dy : n * LABEL_HALF * 2,
          leader: base.leader || n !== 0,
          y: base.y + n * LABEL_HALF * 2,
        },
        props.width
      )
    ).find((c) => placed.every((q) => !overlaps(boxOf(c), boxOf(q))));
    if (spot !== undefined) {
      placed.push(spot);
    }
  }
  return placed;
};

const MapLabels = (props: MapLabelsProps) => (
  <g className="pointer-events-none">
    {placeLabels(props).map((p, i) => (
      <g className="fade" key={p.key} style={stagger(10 + i, "mark")}>
        <g className={dimClass(props.lit !== null && !props.lit.has(p.key))}>
          {p.leader && (
            <line
              className="rule"
              x1={p.ax}
              x2={p.x}
              y1={p.ay}
              y2={p.y + (p.dy < 0 ? 5 : -5)}
            />
          )}
          <text
            className={labelClass(onDark(p))}
            dy="0.35em"
            textAnchor={p.anchor}
            x={p.x}
            y={p.y}
          >
            {p.text}
          </text>
        </g>
      </g>
    ))}
  </g>
);

interface LegendProps {
  active: number | null;
  pid: string;
  /** Label for the no-value key; omitted when every region has a value. */
  emptyLabel?: string;
  onStep: (bin: number | null) => void;
  short: (v: number) => string;
  thresholds: ChoroplethProps["thresholds"];
  width: number;
  y: number;
}

/** A key as laid out: its step, label, drawn width and slot (the touch target). */
interface Key {
  bin: number;
  label: string;
  slot: number;
  w: number;
  x: number;
}

/** Keys left to right: no value (when shown), under the first break, then each break and up. */
const keysFor = (props: LegendProps): Key[] => {
  const t = props.thresholds;
  const rows = [
    ...(props.emptyLabel === undefined
      ? []
      : [{ bin: -1, label: props.emptyLabel }]),
    { bin: 0, label: `<${props.short(t[0])}` },
    ...t.map((v, i) => ({ bin: i + 1, label: `${props.short(v)}+` })),
  ];
  const sized = rows.map((r) => {
    const w = SWATCH + SWATCH_GAP + sansWidth(r.label, 11);
    return { ...r, slot: Math.max(HIT, Math.ceil(w)), w };
  });
  // The gap closes up on narrow plots so the row always fits on one line.
  const room = props.width - sized.reduce((acc, k) => acc + k.slot, 0);
  const gap = clamp(room / Math.max(1, sized.length - 1), 0, KEY_GAP);
  const keys: Key[] = [];
  let x = 0;
  for (const k of sized) {
    keys.push({ ...k, x });
    x += k.slot + gap;
  }
  return keys;
};

/** One key with its 44px pointer target; hovering it isolates its step. */
const LegendKey = (props: {
  active: number | null;
  k: Key;
  onStep: (bin: number | null) => void;
  pid: string;
}) => {
  const { k } = props;
  const f = stepFill(k.bin, props.pid);
  const left = k.x + (k.slot - k.w) / 2;
  return (
    <g
      className={dimClass(props.active !== null && props.active !== k.bin)}
      onPointerEnter={() => {
        props.onStep(k.bin);
      }}
      onPointerLeave={() => {
        props.onStep(null);
      }}
    >
      <rect
        className="fill-transparent"
        height={HIT}
        width={k.slot}
        x={k.x}
        y={-HIT / 2}
      />
      <KeySwatch
        fill={f.fill}
        tone={f.fill === undefined ? f.className : undefined}
        x={left}
        y={-SWATCH / 2}
      />
      <text
        className="t-axis pointer-events-none"
        dy="0.35em"
        x={left + SWATCH + SWATCH_GAP}
        y={0}
      >
        {k.label}
      </text>
    </g>
  );
};

/** The key row, centred under the map: one KeySwatch per step. */
const Legend = (props: LegendProps) => {
  const keys = keysFor(props);
  const last = keys.at(-1);
  const total = last === undefined ? 0 : last.x + last.slot;
  const left = Math.round(Math.max(0, (props.width - total) / 2));
  return (
    <g transform={`translate(${left}, ${Math.round(props.y)})`}>
      {keys.map((k) => (
        <LegendKey
          active={props.active}
          k={k}
          key={k.bin}
          onStep={props.onStep}
          pid={props.pid}
        />
      ))}
    </g>
  );
};

/** The regions in focus, redrawn above the dimmed map inside an ink rule. */
const LitLayer = (props: { lit: Territory[]; pid: string }) => (
  <g className="pointer-events-none">
    {props.lit.map((t) => {
      const f = territoryFill(t, props.pid);
      return (
        <path
          className={`stroke-ink ${f.className}`}
          d={t.d}
          fill={f.fill}
          key={t.key}
          strokeLinejoin="round"
          strokeWidth={1}
        />
      );
    })}
  </g>
);

const MapSvg = (
  props: ChoroplethProps & {
    focus: Focus;
    onFocus: (f: Focus) => void;
    onTip: (t: MapTip | null) => void;
    values: Map<string, ChoroplethDatum>;
    width: number;
  }
) => {
  const { focus, onFocus, onTip, values, width } = props;
  const mapH = Math.round(
    Math.min(props.maxHeight ?? Infinity, width * props.aspect)
  );
  const height = mapH + LEGEND_H + noteSpace(props.note, width - 16, 18);
  const { project, regions, thresholds } = props;
  const pid = useTextureIds("map")("screen");
  const hero = props.labels.at(0);
  const territories = useMemo(
    () =>
      territoriesFor({
        hero,
        mapH,
        project,
        regions,
        thresholds,
        values,
        width,
      }),
    [hero, mapH, project, regions, thresholds, values, width]
  );
  // Same element between renders, so React skips the whole map on hover.
  const regionLayer = useMemo(
    () => <RegionLayer pid={pid} territories={territories} width={width} />,
    [pid, territories, width]
  );
  const focusBin =
    focus?.kind === "region"
      ? (territories.find((t) => t.key === focus.key)?.bin ?? null)
      : (focus?.bin ?? null);
  const lit =
    focus === null
      ? []
      : territories.filter((t) =>
          focus.kind === "region" ? t.key === focus.key : t.bin === focus.bin
        );

  const onMove = (e: PointerEvent<SVGGElement>) => {
    const { target } = e;
    if (!(target instanceof SVGElement)) {
      return;
    }
    const { key } = target.dataset;
    if (key === undefined) {
      return;
    }
    if (focus?.kind !== "region" || focus.key !== key) {
      onFocus({ key, kind: "region" });
    }
    const box = (
      e.currentTarget.ownerSVGElement ?? e.currentTarget
    ).getBoundingClientRect();
    onTip({ key, x: e.clientX - box.left, y: e.clientY - box.top - 6 });
  };
  const clear = () => {
    onFocus(null);
    onTip(null);
  };

  return (
    <svg
      aria-label={props.ariaLabel}
      className="group/map"
      data-focus={focus !== null}
      height={height}
      onPointerLeave={clear}
      width={width}
    >
      <title>{props.ariaLabel}</title>
      <ScreenDefs pid={pid} />
      <g onPointerLeave={clear} onPointerMove={onMove}>
        {regionLayer}
      </g>
      <LitLayer lit={lit} pid={pid} />
      <MapLabels
        labels={props.labels}
        lit={focus === null ? null : new Set(lit.map((t) => t.key))}
        narrow={width < 560}
        short={props.short}
        territories={territories}
        values={values}
        width={width}
      />
      <Legend
        active={focusBin}
        emptyLabel={props.emptyLabel}
        onStep={(bin) => {
          onTip(null);
          onFocus(bin === null ? null : { bin, kind: "bin" });
        }}
        pid={pid}
        short={props.short}
        thresholds={thresholds}
        width={width}
        y={mapH + LEGEND_Y}
      />
      <PlotNote
        text={props.note}
        width={width - 16}
        x={width / 2}
        y={height - 6}
      />
    </svg>
  );
};

/**
 * Shared choropleth plot: real outlines, value in five quantized steps as
 * an engraved dot screen (the hero alone in solid ink), no value as bare
 * paper, 1px outlines, a hover tooltip and a key row whose keys isolate one
 * step on hover.
 */
export const Choropleth = (props: ChoroplethProps) => {
  const [focus, setFocus] = useState<Focus>(null);
  const [tip, setTip] = useState<MapTip | null>(null);
  const values = useMemo(
    () => new Map(props.data.map((d) => [d.key, d])),
    [props.data]
  );
  const names = useMemo(
    () => new Map(props.regions.map((r) => [r.key, r.name])),
    [props.regions]
  );

  const tipValue = (key: string) => {
    const datum = values.get(key);
    if (datum === undefined) {
      return props.emptyLabel ?? "No data";
    }
    return `${props.format(datum.value)}${props.unit === undefined ? "" : ` ${props.unit}`}`;
  };

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{names.get(tip.key)}</b> · {tipValue(tip.key)}
          </Tooltip>
        )
      }
    >
      {(width) => (
        <MapSvg
          {...props}
          focus={focus}
          onFocus={setFocus}
          onTip={setTip}
          values={values}
          width={width}
        />
      )}
    </Plot>
  );
};
