import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";

import { sansWidth } from "../util";
import type { GalaxyData } from "./force-galaxy.data";

/*
 * B2's model: the galaxy's nodes and links, their starting positions, the
 * force simulation, and the DOM writes it makes each tick. No React here.
 */

/** A ramp step for a domain, or ink for the hero. */
export type Tone = "ink" | "l1" | "l2" | "l3" | "l4" | "l5";

/** A node in the simulation. d3-force writes x, y, vx, vy, fx, fy. */
export interface Star extends SimulationNodeDatum {
  domain: string;
  hub: boolean;
  id: string;
  r: number;
  tone: Tone;
  volume: number;
}

export type EdgeKind = "cross" | "mesh" | "spoke";

/** A link in the simulation; `a`/`b` keep typed handles on its ends. */
export interface Edge extends SimulationLinkDatum<Star> {
  a: Star;
  b: Star;
  id: string;
  kind: EdgeKind;
  weight: number;
}

/**
 * How the hubs are laid out: `free` lets the forces find a layout across a
 * wide plot; `ring` sets them on an ellipse (labels outside), for plots too
 * narrow for the forces to settle without crowding.
 */
export type GalaxyMode = "free" | "ring";

export interface Galaxy {
  cx: number;
  cy: number;
  edges: Edge[];
  floor: number;
  mode: GalaxyMode;
  neighbours: Map<string, string[]>;
  /** Re-sets every satellite on its hub's ring (after a hub moves). */
  orbit: () => void;
  place: () => void;
  /** Rings by hub id. */
  rings: Map<string, Ring>;
  scale: number;
  /** Ring mode: each hub's home on the circle. */
  slots: Map<string, Point>;
  stars: Star[];
  width: number;
}

/** A position in the plot, in px. */
export interface Point {
  x: number;
  y: number;
}

export interface StarTip {
  degree: number;
  id: string;
  volume: number;
  x: number;
  y: number;
}

/** DOM handles, so the simulation writes positions without a React render per frame. */
export interface Handles {
  edges: Map<string, SVGLineElement>;
  /** The <svg> itself, under the key "root". */
  frame: Map<"root", SVGSVGElement>;
  labels: Map<string, SVGTextElement>;
  stars: Map<string, SVGCircleElement>;
}

/**
 * Lightness is data: the domain with the most traffic is brightest. Ink is
 * kept for the hero, the busiest hub.
 */
const LADDER: Tone[] = ["l1", "l2", "l2", "l3", "l3", "l4", "l4", "l5"];

const domainFills = (data: GalaxyData) => {
  const totals = new Map<string, number>();
  for (const n of data.nodes) {
    totals.set(n.domain, (totals.get(n.domain) ?? 0) + n.volume);
  }
  const ranked = [...totals.keys()].toSorted(
    (a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0)
  );
  return {
    fills: new Map(
      ranked.map((d, i) => [d, LADDER[Math.min(i, LADDER.length - 1)]])
    ),
    ranked,
  };
};

const edgeKind = (a: Star, b: Star): EdgeKind => {
  if (a.hub && b.hub) {
    return "mesh";
  }
  return a.domain === b.domain ? "spoke" : "cross";
};

/** A hub and its satellites, set on one ring at an even angular pitch. */
export interface Ring {
  /** Room the ring and its label need, from the hub's centre. */
  extent: number;
  hub: Star;
  /** The hub's name, as set in `t-label`. */
  labelW: number;
  /** Distance from the hub's centre to the satellites' centres. */
  orbit: number;
  /** Satellites, busiest first, clockwise from noon. */
  sats: Star[];
}

/** Room under a ring for its hub's name. */
const LABEL_ROOM = 16;
/** Half the height of a `t-label` line. */
const LABEL_HALF = 8;
/** Gap between a ring's outer satellites and its hub's name. */
const LABEL_GAP = 6;
/** Clear space kept between every ring, label and the plot's edge. */
const EDGE_PAD = 4;
/** Below this plot width the hubs sit on a ring rather than float free. */
export const RING_BELOW = 520;

const starsFor = (data: GalaxyData, scale: number) => {
  const { fills, ranked } = domainFills(data);
  // The hero: the hub of the busiest domain.
  const heroId = data.nodes.find(
    (n) => n.hub === true && n.domain === ranked[0]
  )?.id;
  const maxOf = (hub: boolean) =>
    Math.max(
      1,
      ...data.nodes.flatMap((n) => ((n.hub === true) === hub ? [n.volume] : []))
    );
  const [maxHub, maxSat] = [maxOf(true), maxOf(false)];
  return data.nodes.map((n): Star => ({
    domain: n.domain,
    hub: n.hub === true,
    id: n.id,
    r:
      n.hub === true
        ? (9 + 5 * Math.sqrt(n.volume / maxHub)) * scale
        : Math.max(1.5, 4 * Math.sqrt(n.volume / maxSat) * scale),
    tone: n.id === heroId ? "ink" : (fills.get(n.domain) ?? "l3"),
    volume: n.volume,
  }));
};

/** Each hub's ring: an orbit wide enough to keep its satellites evenly apart. */
const ringsFor = (stars: Star[], scale: number) => {
  const rings = new Map<string, Ring>();
  for (const hub of stars.filter((s) => s.hub)) {
    const sats = stars
      .filter((s) => !s.hub && s.domain === hub.domain)
      .toSorted((a, b) => b.volume - a.volume);
    const widest = Math.max(0, ...sats.map((s) => s.r));
    const around = sats.reduce((t, s) => t + 2 * s.r + 4 * scale, 0);
    const orbit = Math.max(hub.r + 12 * scale + widest, around / (2 * Math.PI));
    rings.set(hub.id, {
      extent: orbit + widest + LABEL_ROOM,
      hub,
      labelW: Math.ceil(sansWidth(hub.id, 12)) + 4,
      orbit,
      sats,
    });
  }
  return rings;
};

/** Sets every satellite on its hub's ring. */
const orbitAll = (rings: Map<string, Ring>) => {
  for (const ring of rings.values()) {
    const n = Math.max(1, ring.sats.length);
    for (const [k, s] of ring.sats.entries()) {
      const a = (k / n) * Math.PI * 2;
      s.x = (ring.hub.x ?? 0) + ring.orbit * Math.sin(a);
      s.y = (ring.hub.y ?? 0) - ring.orbit * Math.cos(a);
    }
  }
};

const edgesFor = (data: GalaxyData, stars: Star[]) => {
  const byId = new Map(stars.map((s) => [s.id, s]));
  const neighbours = new Map<string, string[]>(stars.map((s) => [s.id, []]));
  const edges: Edge[] = [];
  for (const l of data.links) {
    const a = byId.get(l.source);
    const b = byId.get(l.target);
    if (a !== undefined && b !== undefined) {
      neighbours.get(a.id)?.push(b.id);
      neighbours.get(b.id)?.push(a.id);
      edges.push({
        a,
        b,
        id: `${a.id}~${b.id}`,
        kind: edgeKind(a, b),
        source: a,
        target: b,
        weight: l.weight ?? 1,
      });
    }
  }
  return { edges, neighbours };
};

/** A ring's outer radius: its satellites' far edge. */
const ringRadius = (ring: Ring) => ring.extent - LABEL_ROOM;

/**
 * Ring mode's homes: hubs on a circle, busiest from noon, clockwise. The
 * circle leaves room outside it for every ring and, above or below each,
 * its name.
 */
const slotsFor = (
  hubs: Ring[],
  width: number,
  floor: number
): Map<string, Point> => {
  const ringR = Math.max(0, ...hubs.map(ringRadius));
  const nameW = Math.max(0, ...hubs.map((r) => r.labelW));
  const across = width / 2 - EDGE_PAD - Math.max(ringR, nameW / 2);
  const down = floor / 2 - EDGE_PAD - ringR - LABEL_GAP - LABEL_HALF * 2;
  const R = Math.max(20, Math.min(across, down));
  return new Map(
    hubs.map((ring, i) => {
      const a = (i / hubs.length) * Math.PI * 2;
      return [
        ring.hub.id,
        { x: width / 2 + R * Math.sin(a), y: floor / 2 - R * Math.cos(a) },
      ];
    })
  );
};

export const buildGalaxy = (
  data: GalaxyData,
  width: number,
  floor: number
): Galaxy => {
  const scale = Math.max(0.62, Math.min(1.3, width / 560, floor / 460));
  const [cx, cy] = [width / 2, floor / 2];
  const stars = starsFor(data, scale);
  const rings = ringsFor(stars, scale);
  const { edges, neighbours } = edgesFor(data, stars);
  const hubs = [...rings.values()].map((r) => r.hub);
  const mode: GalaxyMode = width < RING_BELOW ? "ring" : "free";
  // Big bang: hubs start on a small ring, each carrying its satellites.
  const place = () => {
    for (const [i, hub] of hubs.entries()) {
      const angle = (i / hubs.length) * Math.PI * 2;
      hub.x = cx + 40 * scale * Math.cos(angle);
      hub.y = cy + 40 * scale * Math.sin(angle);
      hub.vx = 0;
      hub.vy = 0;
      hub.fx = null;
      hub.fy = null;
    }
    orbitAll(rings);
  };
  place();
  return {
    cx,
    cy,
    edges,
    floor,
    mode,
    neighbours,
    orbit: () => {
      orbitAll(rings);
    },
    place,
    rings,
    scale,
    slots:
      mode === "ring"
        ? slotsFor([...rings.values()], width, floor)
        : new Map<string, Point>(),
    stars,
    width,
  };
};

const fixed = (v: number | undefined) => (v ?? 0).toFixed(1);

/**
 * A hub's name, centred on its ring: under it on a free layout; on a ring
 * layout, on the side away from the centre (above the upper half, below the
 * lower), so every name sits outside the ring of hubs.
 */
export const labelAt = (galaxy: Galaxy, ring: Ring): Point => {
  const [hx, hy] = [ring.hub.x ?? galaxy.cx, ring.hub.y ?? galaxy.cy];
  const out = ringRadius(ring) + LABEL_GAP + LABEL_HALF;
  const above = galaxy.mode === "ring" && hy < galaxy.cy;
  return { x: hx, y: above ? hy - out : hy + out - 1 };
};

/** The box a ring and its name cover, relative to the hub's centre. */
const reachOf = (galaxy: Galaxy, ring: Ring) => {
  const hy = ring.hub.y ?? galaxy.cy;
  const r = ringRadius(ring);
  const half = Math.max(r, ring.labelW / 2);
  const ly = labelAt(galaxy, ring).y - hy;
  return {
    bottom: Math.max(r, ly + LABEL_HALF),
    left: half,
    right: half,
    top: Math.max(r, LABEL_HALF - ly),
  };
};

/** `v` held between `lo` and `hi`; midway when the range is empty. */
const keep = (v: number, lo: number, hi: number) =>
  lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v));

/**
 * The nearest hub centre to (x, y) that keeps the ring and its name inside
 * the plot. A ring too big for the plot is centred in it.
 */
export const fitHub = (
  galaxy: Galaxy,
  ring: Ring,
  x: number,
  y: number
): Point => {
  const reach = reachOf(galaxy, ring);
  return {
    x: keep(x, reach.left + EDGE_PAD, galaxy.width - reach.right - EDGE_PAD),
    y: keep(y, reach.top + EDGE_PAD, galaxy.floor - reach.bottom - EDGE_PAD),
  };
};

/** Pulls every hub back inside the plot, then sets the satellites on their rings. */
export const constrain = (galaxy: Galaxy) => {
  for (const ring of galaxy.rings.values()) {
    const s = ring.hub;
    const at = fitHub(galaxy, ring, s.x ?? galaxy.cx, s.y ?? galaxy.cy);
    s.x = at.x;
    s.y = at.y;
  }
  orbitAll(galaxy.rings);
};

const drawStar = (s: Star, handles: Handles) => {
  const dot = handles.stars.get(s.id);
  dot?.setAttribute("cx", fixed(s.x));
  dot?.setAttribute("cy", fixed(s.y));
};

const drawEdge = (e: Edge, handles: Handles) => {
  const line = handles.edges.get(e.id);
  line?.setAttribute("x1", fixed(e.a.x));
  line?.setAttribute("y1", fixed(e.a.y));
  line?.setAttribute("x2", fixed(e.b.x));
  line?.setAttribute("y2", fixed(e.b.y));
};

export const drawGalaxy = (galaxy: Galaxy, handles: Handles) => {
  for (const s of galaxy.stars) {
    drawStar(s, handles);
  }
  for (const ring of galaxy.rings.values()) {
    const label = handles.labels.get(ring.hub.id);
    const spot = labelAt(galaxy, ring);
    label?.setAttribute("x", fixed(spot.x));
    label?.setAttribute("y", fixed(spot.y));
  }
  for (const e of galaxy.edges) {
    drawEdge(e, handles);
  }
};

/** Pull toward the centre: strong enough that no hub drifts to an edge. */
const CENTRE_PULL = 0.08;
/** Pull toward a ring-mode home: firm, so a dragged hub springs back. */
const SLOT_PULL = 0.2;

/**
 * Only hubs move. Free: the mesh pulls them together, charge and their
 * rings keep them apart, and a pull to the centre keeps the whole inside the
 * plot. Ring: each hub is pulled to its home on the ellipse. Every tick ends
 * with `constrain`, so nothing leaves the plot.
 */
export const makeSimulation = (galaxy: Galaxy, onTick: () => void) => {
  const { cx, cy, rings, scale, slots } = galaxy;
  const hubs = [...rings.values()].map((r) => r.hub);
  const sim = forceSimulation<Star, Edge>(hubs).alphaDecay(0.022);
  if (galaxy.mode === "ring") {
    sim
      .force(
        "x",
        forceX<Star>((s) => slots.get(s.id)?.x ?? cx).strength(SLOT_PULL)
      )
      .force(
        "y",
        forceY<Star>((s) => slots.get(s.id)?.y ?? cy).strength(SLOT_PULL)
      );
  } else {
    const reach = (s: Star) => rings.get(s.id)?.extent ?? s.r;
    sim
      .force(
        "link",
        forceLink<Star, Edge>(galaxy.edges.filter((e) => e.kind === "mesh"))
          .distance(220 * scale)
          .strength(0.04)
      )
      .force("charge", forceManyBody<Star>().strength(-900 * scale))
      .force(
        "collide",
        forceCollide<Star>((s) => reach(s) + 8 * scale).strength(0.9)
      )
      .force("x", forceX<Star>(cx).strength(CENTRE_PULL))
      .force("y", forceY<Star>(cy).strength(CENTRE_PULL));
  }
  return sim.on("tick", () => {
    constrain(galaxy);
    onTick();
  });
};

/** The settled layout at once, for reduced motion: manual ticks fire no tick events, so each is constrained here. */
export const settle = (
  galaxy: Galaxy,
  sim: ReturnType<typeof makeSimulation>
) => {
  sim.stop();
  for (const _ of Array.from({ length: 320 })) {
    sim.tick();
    constrain(galaxy);
  }
};
