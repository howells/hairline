import { useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { RING_STEP } from "../marks";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import { noteSpace, sansWidth, stagger } from "../util";
import { circularGraphDemo } from "./circular-graph.data";
import type { RingData } from "./circular-graph.data";

interface CircularGraphProps {
  data?: RingData;
  format?: (v: number) => string;
  height?: number;
  /** Node id(s) labelled at rest; defaults to the two largest of each group. */
  highlight?: string | string[];
  /** Word after the neighbour count in the tooltip, e.g. "borders shown". */
  linkUnit?: string;
  note?: string;
  /** Unit after a node's size in the tooltip. */
  sizeUnit?: string;
}

/** A node placed on the ring. */
interface Bead {
  angle: number;
  degree: number;
  fill: string;
  group: string;
  /** The best-connected node: the one mark in ink. */
  hero: boolean;
  hub: boolean;
  id: string;
  r: number;
  size: number;
  x: number;
  y: number;
}

/** A link drawn as a chord-like curve inside the ring. */
interface Chord {
  d: string;
  id: string;
  source: string;
  target: string;
  weight: number;
}

interface RingLayout {
  beads: Bead[];
  byId: Map<string, Bead>;
  chords: Chord[];
  cx: number;
  cy: number;
  /** Pointer radius round each node: as wide as the ring spacing allows. */
  hitR: number;
  maxWeight: number;
  neighbours: Map<string, string[]>;
  /** Ring radius: the beads sit on it. */
  R: number;
}

interface RingTip {
  /** Upper-half nodes take the tip below them: inside the ring, clear of their label. */
  below: boolean;
  id: string;
  linked: number;
  size: number;
  x: number;
  y: number;
}

/**
 * Lightness is data: the most collaborative groups are brightest on the dark
 * card, a fill tone per pair of ranks. Ink is kept for the hero.
 */
const LADDER = [
  "fill-l2",
  "fill-l2",
  "fill-l3",
  "fill-l3",
  "fill-l4",
  "fill-l4",
  "fill-l5",
  "fill-l5",
];

/**
 * Chords at rest: one tone at one opacity, so the web glows brighter where
 * links overlap. Heavier links draw 1.5px, the rest 1px.
 */
const CHORD_OPACITY = 0.14;
const chordWidth = (weight: number, maxWeight: number) =>
  weight / maxWeight > 0.5 ? 1.5 : 1;

/** How far inside the ring a node's tooltip sits: a small inset, plus a reach at the sides. */
const TIP_INSET = 4;
const TIP_REACH = 110;

/** Largest pointer target worth giving a node: 22px radius, a 44px circle. */
const HIT_MAX = 22;

const groupFills = (data: RingData, strength: Map<string, number>) => {
  const totals = new Map<string, number>();
  for (const n of data.nodes) {
    totals.set(n.group, (totals.get(n.group) ?? 0) + (strength.get(n.id) ?? 0));
  }
  const ranked = [...totals.keys()].toSorted(
    (a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0)
  );
  return new Map(
    ranked.map((g, i) => [g, LADDER[Math.min(i, LADDER.length - 1)]])
  );
};

const hubIds = (data: RingData, highlight: string | string[] | undefined) => {
  if (highlight !== undefined) {
    return new Set([highlight].flat());
  }
  const hubs = new Set<string>();
  for (const g of new Set(data.nodes.map((n) => n.group))) {
    const members = data.nodes
      .filter((n) => n.group === g)
      .toSorted((a, b) => b.size - a.size);
    for (const n of members.slice(0, 2)) {
      hubs.add(n.id);
    }
  }
  return hubs;
};

/** Cubic through two control points pulled toward the centre: near pairs loop deep, far pairs cross the middle. */
const chordPath = (a: Bead, b: Bead, cx: number, cy: number, R: number) => {
  let gap = Math.abs(a.angle - b.angle) % (Math.PI * 2);
  if (gap > Math.PI) {
    gap = Math.PI * 2 - gap;
  }
  const k = 0.18 + 0.32 * (1 - gap / Math.PI);
  const c = (n: Bead) =>
    `${(cx + R * k * Math.cos(n.angle)).toFixed(1)},${(cy + R * k * Math.sin(n.angle)).toFixed(1)}`;
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)}C${c(a)} ${c(b)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
};

/** Clear space round a small ring: just its biggest bead, so the ink runs edge to edge. */
const SMALL_MARGIN = 8;

/*
 * One axis of a small ring's frame. `along` is the hero name's share of the
 * axis (the cosine or sine of its angle), signed toward its side; `spike` is
 * how far the name reaches past the ring.
 */

/** The largest radius that fits the ring and the hero's name across `room`. */
const axisRadius = (room: number, spike: number, along: number) => {
  const a = Math.abs(along);
  return Math.min(
    room / 2 - SMALL_MARGIN,
    (room - SMALL_MARGIN - spike * a) / (1 + a)
  );
};

/** The ring's centre on the axis: the name's side gets its room, the slack is shared. */
const axisCentre = (room: number, spike: number, along: number, R: number) => {
  const plain = R + SMALL_MARGIN;
  const named = Math.max(plain, (R + spike) * Math.abs(along));
  const [lo, hi] = along < 0 ? [named, plain] : [plain, named];
  return lo + (room - lo - hi) / 2;
};

/**
 * Where the ring goes. Wide: centred, with room all round for the names.
 * Small: only the hero is named, so the ring takes the plot, shrunk and
 * shifted just enough for the hero's name to fit on its side.
 */
const ringFrame = (
  width: number,
  plotH: number,
  hero: { angle: number; reach: number } | null
) => {
  if (width >= 560 || hero === null) {
    const margin = width < 560 ? SMALL_MARGIN : 84;
    return {
      R: Math.max(60, Math.min(width / 2, plotH / 2) - margin),
      cx: width / 2,
      cy: plotH / 2,
    };
  }
  const [cos, sin] = [Math.cos(hero.angle), Math.sin(hero.angle)];
  const R = Math.max(
    60,
    Math.min(
      axisRadius(width, hero.reach, cos),
      axisRadius(plotH, hero.reach, sin)
    )
  );
  return {
    R,
    cx: axisCentre(width, hero.reach, cos, R),
    cy: axisCentre(plotH, hero.reach, sin, R),
  };
};

/** A bead's radius: area is size. */
const beadR = (size: number, maxSize: number, small: boolean) =>
  Math.max(2.2, (small ? 6 : 10) * Math.sqrt(size / maxSize));

/** Gap between a bead and its name. */
const LABEL_GAP = 6;

const layoutRing = (
  data: RingData,
  width: number,
  plotH: number,
  highlight: string | string[] | undefined
): RingLayout => {
  const small = width < 560;
  const neighbours = new Map<string, string[]>(
    data.nodes.map((n) => [n.id, []])
  );
  const strength = new Map<string, number>();
  for (const l of data.links) {
    neighbours.get(l.source)?.push(l.target);
    neighbours.get(l.target)?.push(l.source);
    strength.set(l.source, (strength.get(l.source) ?? 0) + l.weight);
    strength.set(l.target, (strength.get(l.target) ?? 0) + l.weight);
  }
  const fills = groupFills(data, strength);
  const hubs = hubIds(data, highlight);
  const heroId = [...strength].toSorted((a, b) => b[1] - a[1])[0]?.[0];
  const maxSize = Math.max(...data.nodes.map((n) => n.size));
  const step = (Math.PI * 2) / data.nodes.length;
  const angleAt = (i: number) => -Math.PI * 0.56 + i * step;
  const heroAt = data.nodes.findIndex((n) => n.id === heroId);
  const heroNode = data.nodes[heroAt];
  const { R, cx, cy } = ringFrame(
    width,
    plotH,
    heroAt === -1
      ? null
      : {
          angle: angleAt(heroAt),
          // The name's far end, from the ring: bead, gap, then the name itself.
          reach:
            beadR(heroNode.size, maxSize, small) +
            LABEL_GAP +
            sansWidth(heroNode.id, 11),
        }
  );
  const beads = data.nodes.map((n, i): Bead => {
    const angle = angleAt(i);
    return {
      angle,
      degree: neighbours.get(n.id)?.length ?? 0,
      fill: fills.get(n.group) ?? "fill-l3",
      group: n.group,
      hero: n.id === heroId,
      hub: hubs.has(n.id),
      id: n.id,
      r: beadR(n.size, maxSize, small),
      size: n.size,
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    };
  });
  const byId = new Map(beads.map((b) => [b.id, b]));
  const chords: Chord[] = [];
  // Light chords first, so the heavier tones sit on top.
  const links = data.links.toSorted((a, b) => a.weight - b.weight);
  for (const l of links) {
    const a = byId.get(l.source);
    const b = byId.get(l.target);
    if (a !== undefined && b !== undefined) {
      chords.push({
        d: chordPath(a, b, cx, cy, R),
        id: `${l.source}~${l.target}`,
        source: l.source,
        target: l.target,
        weight: l.weight,
      });
    }
  }
  return {
    R,
    beads,
    byId,
    chords,
    cx,
    cy,
    hitR: Math.min(HIT_MAX, (R * step) / 2),
    maxWeight: Math.max(1, ...data.links.map((l) => l.weight)),
    neighbours,
  };
};

const BeadLabel = (props: { bead: Bead; bright: boolean }) => {
  const { bead } = props;
  const left = Math.cos(bead.angle) < 0;
  const deg = (bead.angle * 180) / Math.PI + (left ? 180 : 0);
  const off = bead.r + LABEL_GAP;
  return (
    <text
      className={`t-name pointer-events-none ${props.bright ? "fill-ink" : "fill-muted"}`}
      dy="0.35em"
      textAnchor={left ? "end" : "start"}
      transform={`translate(${bead.x + off * Math.cos(bead.angle)},${bead.y + off * Math.sin(bead.angle)}) rotate(${deg})`}
    >
      {bead.id}
    </text>
  );
};

const touchesBead = (c: Chord, id: string) =>
  c.source === id || c.target === id;

/** Everything at rest: chords drawing in, beads popping round the ring, hub labels; the hero and its chords in ink. */
const RingBase = (props: { layout: RingLayout; small: boolean }) => {
  const { beads, chords, cx, cy, maxWeight, R } = props.layout;
  const hero = beads.find((b) => b.hero);
  const leads = (c: Chord) => hero !== undefined && touchesBead(c, hero.id);
  // The hero's chords draw last, so nothing crosses over them.
  const ordered = [
    ...chords.filter((c) => !leads(c)),
    ...chords.filter((c) => leads(c)),
  ];
  return (
    <g className="transition-opacity group-data-[focus=true]/ring:opacity-25">
      <g className="fade" style={{ "--i": 0 }}>
        <DotRing cx={cx} cy={cy} r={R} step={RING_STEP.guide} tone="fill-l5" />
      </g>
      <g className="cap-round stroke-ink" fill="none">
        {ordered.map((c, i) => {
          const lead = leads(c);
          return (
            <path
              className="draw"
              d={c.d}
              key={c.id}
              pathLength={1}
              strokeOpacity={lead ? 1 : CHORD_OPACITY}
              strokeWidth={lead ? 1.5 : chordWidth(c.weight, maxWeight)}
              style={stagger(i * 0.4, "dense")}
            />
          );
        })}
      </g>
      {beads.map((b, i) => (
        <circle
          className={`pop ${b.hero ? "fill-hero" : b.fill}`}
          cx={b.x}
          cy={b.y}
          key={b.id}
          r={b.r}
          style={stagger(i, "fine")}
        />
      ))}
      {/* Small plots name only the hero: there is no room round the ring for the rest. */}
      <g className="fade" style={{ "--i": 12 }}>
        {beads.flatMap((b) =>
          b.hero || (b.hub && !props.small)
            ? [<BeadLabel bead={b} bright={b.hero} key={b.id} />]
            : []
        )}
      </g>
    </g>
  );
};

/**
 * The hovered node, its chords and its neighbours, redrawn bright above the
 * dimmed ring. Small plots leave out the names other than the hero's (the
 * tooltip names the node): there is no room round the ring for them.
 */
const FocusLayer = (props: {
  focus: string;
  layout: RingLayout;
  small: boolean;
}) => {
  const { byId, chords, neighbours } = props.layout;
  const bead = byId.get(props.focus);
  if (bead === undefined) {
    return null;
  }
  const near = (neighbours.get(bead.id) ?? []).flatMap(
    (id) => byId.get(id) ?? []
  );
  return (
    <g className="pointer-events-none">
      <g className="cap-round stroke-ink" fill="none" strokeWidth={1.5}>
        {chords.flatMap((c) =>
          touchesBead(c, bead.id) ? [<path d={c.d} key={c.id} />] : []
        )}
      </g>
      {near.map((n) => (
        <circle
          className={n.hero ? "fill-hero" : n.fill}
          cx={n.x}
          cy={n.y}
          key={n.id}
          r={n.r}
        />
      ))}
      <circle className="fill-hero" cx={bead.x} cy={bead.y} r={bead.r} />
      {!props.small &&
        near.map((n) => <BeadLabel bead={n} bright={false} key={n.id} />)}
      {/* The hero's name always fits: the ring is framed round it. */}
      {(!props.small || bead.hero) && <BeadLabel bead={bead} bright />}
    </g>
  );
};

const RingSvg = (props: {
  data: RingData;
  focus: string | null;
  height: number;
  highlight?: string | string[];
  note?: string;
  onFocus: (id: string | null, tip: RingTip | null) => void;
  onReplay: () => void;
  take: number;
  width: number;
}) => {
  const { data, focus, highlight, onFocus, take, width } = props;
  const small = width < 560;
  // Notes and ring shrink with the column: no empty bands on a phone.
  const noteH = noteSpace(props.note, width - 16, 18);
  const height = Math.min(props.height, width + (small ? 60 : 168) + noteH);
  const plotH = height - noteH;
  const layout = useMemo(
    () => layoutRing(data, width, plotH, highlight),
    [data, width, plotH, highlight]
  );
  // Same element between renders, so hover only re-renders the focus layer. The key replays the entry.
  const base = useMemo(
    () => <RingBase key={take} layout={layout} small={small} />,
    [layout, small, take]
  );
  const label = `Land borders: ${data.nodes.length} countries on a ring, ${data.links.length} shared borders`;

  const onMove = (e: PointerEvent<SVGGElement>) => {
    const { target } = e;
    const id = target instanceof SVGElement ? target.dataset.id : undefined;
    const bead = id === undefined ? undefined : layout.byId.get(id);
    if (bead === undefined || bead.id === focus) {
      return;
    }
    // The tip sits inside the ring, clear of the labels round it: further in
    // at the sides, where its width would reach across the neighbours' labels.
    const [cos, sin] = [Math.cos(bead.angle), Math.sin(bead.angle)];
    const inward = bead.r + TIP_INSET + TIP_REACH * Math.abs(cos);
    const below = sin < 0;
    onFocus(bead.id, {
      below,
      id: bead.id,
      linked: bead.degree,
      size: bead.size,
      x: bead.x - inward * cos,
      y: bead.y - inward * sin,
    });
  };

  return (
    <svg
      aria-label={label}
      className="group/ring cursor-pointer"
      data-focus={focus !== null}
      height={height}
      onPointerUp={props.onReplay}
      onPointerLeave={() => {
        onFocus(null, null);
      }}
      width={width}
    >
      <title>{label}</title>
      {base}
      {focus !== null && (
        <FocusLayer focus={focus} layout={layout} small={small} />
      )}
      <g className="fill-transparent" onPointerMove={onMove}>
        {layout.beads.map((b) => (
          <circle
            cx={b.x}
            cy={b.y}
            data-id={b.id}
            key={b.id}
            r={Math.max(b.r + 3, layout.hitR)}
          />
        ))}
      </g>
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
 * B1 Land borders (big). Countries sit on a ring grouped by continent, dot area =
 * land neighbours; links curve inside the ring like chords. Hover a node to light up its
 * neighbours; click anywhere to replay the entry.
 */
export const CircularGraph = (props: CircularGraphProps) => {
  const data = props.data ?? circularGraphDemo;
  const format = props.format ?? String;
  const [focus, setFocus] = useState<string | null>(null);
  const [take, setTake] = useState(0);
  const [tip, setTip] = useState<RingTip | null>(null);

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip below={tip.below} x={tip.x} y={tip.y}>
            <b>{tip.id}</b> · {format(tip.size)}{" "}
            {props.sizeUnit ?? "land neighbours"} · {tip.linked}{" "}
            {props.linkUnit ?? "shown"}
          </Tooltip>
        )
      }
    >
      {(width) => (
        <RingSvg
          data={data}
          focus={focus}
          height={props.height ?? 560}
          highlight={props.highlight}
          note={props.note}
          onFocus={(id, t) => {
            setFocus(id);
            setTip(t);
          }}
          onReplay={() => {
            setFocus(null);
            setTip(null);
            setTake((t) => t + 1);
          }}
          take={take}
          width={width}
        />
      )}
    </Plot>
  );
};
