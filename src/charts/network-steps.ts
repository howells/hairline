import { Delaunay } from "d3-delaunay";

/*
 * Fading out from one node. Select a node and everything is toned by how
 * many links away it is: the node and its direct links in ink, what is two
 * steps away in a mid tone of the ramp, the rest close to the paper.
 */

/** Steps from the selected node: 0 is the node, 3 is anything further. */
export type Step = 0 | 1 | 2 | 3;

/** Who each node is linked to. */
export type Adjacency = ReadonlyMap<string, readonly string[]>;

type Link = Readonly<Record<"source" | "target", string>>;

/** Each node's neighbours, both ways, in the order the links give them. */
export const adjacencyOf = (
  ids: readonly string[],
  links: readonly Link[]
): Adjacency => {
  const next = new Map<string, string[]>(ids.map((id) => [id, []]));
  for (const l of links) {
    next.get(l.source)?.push(l.target);
    next.get(l.target)?.push(l.source);
  }
  return next;
};

/** Steps from `start`, by breadth-first search, out to two; a node further off is absent. */
export const stepsFrom = (
  adjacency: Adjacency,
  start: string
): ReadonlyMap<string, Step> => {
  const steps = new Map<string, Step>([[start, 0]]);
  let ring = [start];
  for (const step of [1, 2] as const) {
    const out: string[] = [];
    for (const id of ring) {
      for (const n of adjacency.get(id) ?? []) {
        if (!steps.has(n)) {
          steps.set(n, step);
          out.push(n);
        }
      }
    }
    ring = out;
  }
  return steps;
};

/** A node's step; with nothing selected, 0 (everything at rest). */
export const stepOf = (
  steps: ReadonlyMap<string, Step> | null,
  id: string
): Step => (steps === null ? 0 : (steps.get(id) ?? 3));

/**
 * A link's step: 1 when it leaves the selected node (a direct link), 2 when
 * it leaves a direct neighbour, 3 for the rest.
 */
export const linkStepOf = (
  steps: ReadonlyMap<string, Step> | null,
  a: string,
  b: string
): Step => {
  if (steps === null) {
    return 0;
  }
  const near = Math.min(stepOf(steps, a), stepOf(steps, b));
  if (near === 0) {
    return 1;
  }
  return near === 1 ? 2 : 3;
};

/** A node's fill by step, and a ring's or link's stroke by step: ink, ink, mid, near the paper. */
export const STEP_FILL = [
  "fill-hero",
  "fill-ink",
  "fill-l3",
  "fill-l5",
] as const;
export const STEP_STROKE = [
  "stroke-ink",
  "stroke-ink",
  "stroke-l3",
  "stroke-l5",
] as const;

/** What is further than two steps is pushed back to the paper, easing as the selection moves. */
export const stepFade = (step: Step) =>
  step === 3 ? "opacity-40 transition-opacity" : "transition-opacity";

/** "2 direct, 5 at two steps": what the selected node reaches. */
export const reachText = (steps: ReadonlyMap<string, Step>): string => {
  const values = [...steps.values()];
  const direct = values.filter((s) => s === 1).length;
  const second = values.filter((s) => s === 2).length;
  if (direct === 0) {
    return "No links";
  }
  return second === 0
    ? `${direct} direct`
    : `${direct} direct, ${second} at two steps`;
};

/** Pointer reach round a node, in px: a 44px target for a finger, 28px for a mouse. */
export const REACH = { mouse: 14, touch: 22 } as const;

interface Pickable {
  r: number;
  x: number;
  y: number;
}

/**
 * The node a pointer means. A node under the pointer wins; otherwise the
 * nearest one (a Voronoi cell, found through its Delaunay triangulation) if
 * it is within `reach` of its edge, so a node a few pixels wide still has a
 * target a finger can hit. -1 when none.
 */
export const pickNode = (
  nodes: readonly Pickable[],
  x: number,
  y: number,
  reach: number
): number => {
  if (nodes.length === 0) {
    return -1;
  }
  const near = Delaunay.from(nodes.map((n) => [n.x, n.y])).find(x, y, 0);
  const gap = Math.hypot(nodes[near].x - x, nodes[near].y - y) - nodes[near].r;
  // A big node beside a small one: the pointer on its disc is on it.
  const under = nodes.findIndex((n) => Math.hypot(n.x - x, n.y - y) <= n.r);
  if (under !== -1) {
    return under;
  }
  return gap <= reach ? near : -1;
};

/**
 * What an arrow, Home, End or Escape key does to the selection: the node it
 * moves to, null to clear it, or undefined when the key is none of these.
 */
export const nextByKey = (
  key: string,
  ids: readonly string[],
  selected: string | null
): string | null | undefined => {
  const from = selected === null ? -1 : ids.indexOf(selected);
  const wrap = (i: number) => ids[(i + ids.length) % ids.length];
  switch (key) {
    case "ArrowDown":
    case "ArrowRight": {
      return wrap(from + 1);
    }
    case "ArrowLeft":
    case "ArrowUp": {
      return wrap(from === -1 ? -1 : from - 1);
    }
    case "End": {
      return wrap(-1);
    }
    case "Escape": {
      return null;
    }
    case "Home": {
      return wrap(0);
    }
    default: {
      return undefined;
    }
  }
};
