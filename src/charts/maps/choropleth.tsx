import { geoContains, geoPath } from "d3-geo";
import type { GeoProjection } from "d3-geo";
import { scaleThreshold } from "d3-scale";
import type { FeatureCollection } from "geojson";
import { useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import type { Hover } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DotScreen, PlateLabel } from "../texture";
import { HALFTONE_R, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { clamp, noteSpace, sansWidth, stagger } from "../util";
import { mainCentroid } from "./geo";
import type { ChoroplethDatum, Region } from "./geo";
import { Legend } from "./legend";
import { stepFill } from "./step-fill";
import type { StepFill } from "./step-fill";

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
  /** Four ascending breaks → five steps on the halftone ladder. */
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

/** Room under the map for the key row. */
const LEGEND_H = 52;
/** The key row's centre, below the map. */
const LEGEND_Y = 28;

/**
 * The stepped dot screen for every step, on paper: the shared halftone
 * ladder, its dots growing a step per bin on a pitch-4 screen in the mid
 * tone. Solid ink is the hero's alone.
 */
const SCREENS = HALFTONE_R.map((r) => ({
  pitch: TEXTURE_PITCH.screen,
  r,
  tone: "fill-l3",
}));
const SOLID = "fill-hero";

/** A region's fill: the hero solid, every other region its step's screen. */
const territoryFill = (t: Territory, pid: string): StepFill =>
  t.solid ? { className: SOLID } : stepFill(t.bin, pid);

/** One screen per shaded step, ids `${pid}-0` … `${pid}-4`. */
const ScreenDefs = (props: { pid: string }) => (
  <defs>
    {SCREENS.map((s, i) => (
      <DotScreen
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

/** Half the height of a label's plate, and the steps tried when one collides. */
const LABEL_HALF = 8;
const NUDGES = [0, -1, 1, -2, 2];
/** A plate's padding either side of its text (PlateLabel). */
const PLATE_PAD = 4;

/** The label's plate: its text plus padding, anchored at x. */
const boxOf = (p: PlacedLabel): Box => {
  const w = Math.ceil(sansWidth(p.text, 11)) + PLATE_PAD * 2;
  const shift = { end: w, middle: w / 2, start: 0 }[p.anchor];
  return {
    x0: p.x - shift,
    x1: p.x - shift + w,
    y0: p.y - LABEL_HALF,
    y1: p.y + LABEL_HALF,
  };
};

/** The glyphs' own box: the plate without its padding, x-height deep. */
const glyphBox = (p: PlacedLabel): Box => {
  const b = boxOf(p);
  return {
    x0: b.x0 + PLATE_PAD,
    x1: b.x1 - PLATE_PAD,
    y0: p.y - 4,
    y1: p.y + 4,
  };
};

/** A label on the hero's plate: unled, on the solid hero, its glyphs inside the region. */
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
        <DimGroup dim={props.lit !== null && !props.lit.has(p.key)}>
          {p.leader && (
            <line
              className="rule"
              x1={p.ax}
              x2={p.x}
              y1={p.ay}
              y2={p.y + (p.dy < 0 ? 5 : -5)}
            />
          )}
          {p.leader ? (
            <Label
              anchor={p.anchor}
              dy="0.35em"
              halo
              voice="value"
              x={p.x}
              y={p.y}
            >
              {p.text}
            </Label>
          ) : (
            <PlateLabel
              anchor={p.anchor}
              hero={onDark(p)}
              text={p.text}
              x={p.x}
              y={p.y}
            />
          )}
        </DimGroup>
      </g>
    ))}
  </g>
);

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
    hover: Hover<string>;
    values: Map<string, ChoroplethDatum>;
    width: number;
  }
) => {
  const { focus, hover, onFocus, values, width } = props;
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
    hover.show(key, e.clientX - box.left, e.clientY - box.top - 6);
  };
  const clear = () => {
    onFocus(null);
    hover.clear();
  };

  return (
    <ChartSvg
      className="group/map"
      data-focus={focus !== null}
      height={height}
      label={props.ariaLabel}
      leave={clear}
      width={width}
    >
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
          hover.clear();
          onFocus(bin === null ? null : { bin, kind: "bin" });
        }}
        pid={pid}
        short={props.short}
        thresholds={thresholds}
        width={width}
        y={mapH + LEGEND_Y}
      />
      <FootNote height={height} text={props.note} width={width} />
    </ChartSvg>
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
  const hover = useHover<string>();
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
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[tipValue(hover.at.key)]}
              lead={names.get(hover.at.key) ?? ""}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <MapSvg
          {...props}
          focus={focus}
          hover={hover}
          onFocus={setFocus}
          values={values}
          width={width}
        />
      )}
    </Plot>
  );
};
