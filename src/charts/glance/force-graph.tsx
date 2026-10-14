import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
} from "d3-force";
import type {
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { useReducedMotion, useReveal } from "../hooks";
import { PlotNote } from "../plot-note";
import { dimClass, noteSpace } from "../util";
import { forceGraphDemo } from "./force-graph.data";
import type { ForceLink, ForceNode } from "./force-graph.data";
import { LinkBundle } from "./link-bundle";
import { bundleLines } from "./util-b";

interface ForceGraphProps {
  nodes?: ForceNode[];
  links?: ForceLink[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
}

interface SimNode extends SimulationNodeDatum {
  datum: ForceNode;
  r: number;
  hub: boolean;
}

/** An edge as drawn: typed endpoints, independent of d3's mutable link objects. */
interface Edge {
  id: string;
  s: SimNode;
  t: SimNode;
  value: number;
  hub: boolean;
}

interface Graph {
  nodes: SimNode[];
  edges: Edge[];
  maxLink: number;
}

/** Room kept beside a node for its name ("Notion import"), px. */
const LABEL_ROOM = 90;

/** Where the hub is pinned, relative to the plot centre. */
const HUB_Y = -6;

/** Satellites well to the left of the hub carry their label on the left. */
const labelLeft = (n: SimNode) => {
  const dx = n.x ?? 0;
  const dy = (n.y ?? 0) - HUB_Y;
  return !n.hub && dx < -0.4 * Math.hypot(dx, dy);
};

const defaultFormat = (v: number) =>
  `${v.toLocaleString("en-US")}k syncs a month`;

/** Nodes sized by sqrt(value); the hub is the biggest. */
const buildGraph = (nodes: ForceNode[], links: ForceLink[]): Graph => {
  const maxV = Math.max(...nodes.map((n) => n.value));
  let hubId = nodes[0].id;
  for (const n of nodes) {
    if (n.value === maxV) {
      hubId = n.id;
    }
  }
  const sim: SimNode[] = nodes.map((datum, i) => {
    const a = (i / nodes.length) * Math.PI * 2;
    const hub = datum.id === hubId;
    // The hub is pinned to the centre; satellites settle around it.
    return {
      datum,
      fx: hub ? 0 : null,
      fy: hub ? HUB_Y : null,
      hub,
      r: Math.max(9, 40 * Math.sqrt(datum.value / maxV)),
      x: Math.cos(a) * 12,
      y: Math.sin(a) * 12,
    };
  });
  const byId = new Map(sim.map((n) => [n.datum.id, n]));
  const edges = links.flatMap((l) => {
    const s = byId.get(l.source);
    const t = byId.get(l.target);
    return s === undefined || t === undefined
      ? []
      : [
          {
            hub: s.hub || t.hub,
            id: `${l.source}→${l.target}`,
            s,
            t,
            value: l.value,
          },
        ];
  });
  return { edges, maxLink: Math.max(...links.map((l) => l.value)), nodes: sim };
};

/**
 * Room kept around a node beyond its radius. Narrow plots (scale < 1) set
 * the hub's name inside it, so the hub needs less; satellites need more.
 */
const clearance = (hub: boolean, scale: number) => {
  if (scale < 1) {
    return hub ? 16 : 34;
  }
  return hub ? 44 : 40;
};

const makeSimulation = (g: Graph, scale: number) => {
  const links: SimulationLinkDatum<SimNode>[] = g.edges.map((e) => ({
    source: e.s,
    target: e.t,
  }));
  return (
    forceSimulation<SimNode>(g.nodes)
      .force(
        "link",
        forceLink<SimNode, SimulationLinkDatum<SimNode>>(links)
          .distance((_, i) => {
            const e = g.edges[i];
            return (e.hub ? 118 + (e.s.r + e.t.r) * 0.9 : 80) * scale;
          })
          .strength((_, i) => (g.edges[i].hub ? 0.7 : 0.22))
      )
      .force("charge", forceManyBody<SimNode>().strength(-340 * scale))
      .force(
        "collide",
        forceCollide<SimNode>((n) => n.r * scale + clearance(n.hub, scale))
      )
      // Wide plots spread sideways; narrow ones (scale < 1) spread down instead.
      .force("x", forceX<SimNode>(0).strength(scale < 1 ? 0.12 : 0.02))
      .force("y", forceY<SimNode>(HUB_Y).strength(scale < 1 ? 0.02 : 0.05))
      .alphaDecay(0.035)
      .stop()
  );
};

interface FieldProps {
  width: number;
  height: number;
  nodes: ForceNode[];
  links: ForceLink[];
  format: (v: number) => string;
  note?: string;
}

/** Runs the simulation (once visible) and redraws on every tick. */
const useForce = (
  graph: Graph,
  scale: number,
  shown: boolean,
  reduced: boolean
) => {
  const [, setFrame] = useState(0);
  const simRef = useRef<Simulation<SimNode, undefined> | null>(null);
  useEffect(() => {
    const sim = makeSimulation(graph, scale);
    simRef.current = sim;
    sim.on("tick", () => {
      setFrame((f) => f + 1);
    });
    if (shown && reduced) {
      // Settle off-screen, then one last (async) tick draws the result.
      sim.alpha(1);
      sim.tick(320);
      sim.alpha(0.002).restart();
    } else if (shown) {
      sim.alpha(1).restart();
    }
    return () => {
      sim.stop();
      sim.on("tick", null);
      simRef.current = null;
    };
  }, [graph, scale, shown, reduced]);
  const redraw = () => {
    setFrame((f) => f + 1);
  };
  return { redraw, simRef };
};

interface LinksProps {
  graph: Graph;
  focus: SimNode | null;
  at: (n: SimNode) => { x: number; y: number };
}

const linkTone = (on: boolean, hero: boolean) => {
  if (hero) {
    return "stroke-ink";
  }
  return on ? "stroke-l2" : "stroke-l4";
};

/** The hero link: the hub's strongest. */
const heroEdge = (graph: Graph) =>
  graph.edges.filter((e) => e.hub).toSorted((a, b) => b.value - a.value)[0];

/** Each link engraved as a bundle of 1–4 hairlines by strength. */
const ForceLinks = ({ graph, focus, at }: LinksProps) => {
  const hero = heroEdge(graph);
  return (
    <g>
      {graph.edges.map((e) => {
        const on = focus !== null && (e.s === focus || e.t === focus);
        return (
          <LinkBundle
            key={e.id}
            className={`${linkTone(on, e === hero)} ${dimClass(focus !== null && !on)}`}
            lines={bundleLines(e.value, graph.maxLink)}
            s={at(e.s)}
            t={at(e.t)}
          />
        );
      })}
    </g>
  );
};

interface DotProps {
  n: SimNode;
  at: { x: number; y: number };
  r: number;
  /** Label on the left (satellites left of the hub). */
  left: boolean;
  dim: boolean;
  grabbing: boolean;
  onPointerEnter: () => void;
  onPointerDown: (e: PointerEvent<SVGGElement>) => void;
  onPointerMove: (e: PointerEvent<SVGGElement>) => void;
  onPointerUp: (e: PointerEvent<SVGGElement>) => void;
}

const labelX = (hub: boolean, left: boolean, x: number, r: number) => {
  if (hub) {
    return x;
  }
  return left ? x - r - 7 : x + r + 7;
};

const labelAnchor = (hub: boolean, left: boolean) => {
  if (hub) {
    return "middle";
  }
  return left ? "end" : "start";
};

const ForceDot = ({
  n,
  at,
  r,
  left,
  dim,
  grabbing,
  onPointerEnter,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: DotProps) => (
  <g
    className={`${dimClass(dim)} ${grabbing ? "cursor-grabbing" : "cursor-grab"}`}
    onPointerEnter={onPointerEnter}
    onPointerDown={onPointerDown}
    onPointerMove={onPointerMove}
    onPointerUp={onPointerUp}
    onPointerCancel={onPointerUp}
  >
    <circle cx={at.x} cy={at.y} r={r + 6} fill="transparent" />
    {/* The hub is the one solid node; satellites are hollow rings. */}
    <circle
      className={n.hub ? "fill-hero" : "fill-paper stroke-l3"}
      cx={at.x}
      cy={at.y}
      r={n.hub ? r : r - 0.75}
      strokeWidth={n.hub ? undefined : 1.5}
    />
    {/* The hub carries its name inside; satellites beside them. */}
    <text
      className={`t-name pointer-events-none ${n.hub ? "fill-paper" : "fill-muted"}`}
      x={labelX(n.hub, left, at.x, r)}
      y={at.y}
      dy="0.35em"
      textAnchor={labelAnchor(n.hub, left)}
    >
      {n.datum.id}
    </text>
  </g>
);

const ForceField = (props: FieldProps) => {
  const { width, height } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useReveal(wrap);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<SimNode | null>(null);
  const [dragging, setDragging] = useState<SimNode | null>(null);
  const narrow = width < 460;
  const scale = narrow ? 0.78 : 1;
  const graph = useMemo(
    () => buildGraph(props.nodes, props.links),
    [props.nodes, props.links]
  );
  const { redraw, simRef } = useForce(graph, scale, shown, reduced);

  const cx = width / 2;
  const cy = height / 2 - noteSpace(props.note, width - 16, 16) / 2;
  const clampX = (x: number, r: number) =>
    Math.max(-cx + r + LABEL_ROOM, Math.min(cx - r - LABEL_ROOM, x));
  const clampY = (y: number, r: number) =>
    Math.max(-cy + r + 8, Math.min(height - cy - r - 8, y));
  const place = (n: SimNode) => ({
    x: cx + clampX(n.x ?? 0, n.r * scale),
    y: cy + clampY(n.y ?? 0, n.r * scale),
  });
  const pin = (n: SimNode, e: PointerEvent<SVGGElement>) => {
    const box = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (box === undefined) {
      return;
    }
    n.fx = clampX(e.clientX - box.left - cx, n.r * scale);
    n.fy = clampY(e.clientY - box.top - cy, n.r * scale);
  };

  const focus = dragging ?? hover;
  const near = new Set<SimNode>();
  for (const e of graph.edges) {
    if (focus !== null && (e.s === focus || e.t === focus)) {
      near.add(e.s);
      near.add(e.t);
    }
  }
  const hub = graph.nodes.find((n) => n.hub);
  const label = `${hub?.datum.id ?? "Hub"} linked to ${graph.nodes.length - 1} integrations: ${graph.nodes
    .flatMap((n) =>
      n.hub ? [] : [`${n.datum.id} ${props.format(n.datum.value)}`]
    )
    .join(", ")}. Drag a node to move it.`;

  return (
    <div ref={wrap} className="relative">
      <svg
        className={`duration-enter touch-none transition-opacity ${shown ? "opacity-100" : "opacity-0"}`}
        width={width}
        height={height}
        aria-label={label}
        onPointerLeave={() => {
          if (dragging === null) {
            setHover(null);
          }
        }}
      >
        <title>{label}</title>
        <ForceLinks graph={graph} focus={focus} at={place} />
        {graph.nodes.map((n) => (
          <ForceDot
            key={n.datum.id}
            n={n}
            at={place(n)}
            r={n.r * scale}
            left={labelLeft(n)}
            dim={focus !== null && focus !== n && !near.has(n)}
            grabbing={dragging === n}
            onPointerEnter={() => {
              if (dragging === null) {
                setHover(n);
              }
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              pin(n, e);
              setDragging(n);
              simRef.current?.alphaTarget(0.3).restart();
            }}
            onPointerMove={(e) => {
              if (dragging === n) {
                pin(n, e);
                redraw();
              }
            }}
            onPointerUp={(e) => {
              e.currentTarget.releasePointerCapture(e.pointerId);
              n.fx = n.hub ? 0 : null;
              n.fy = n.hub ? HUB_Y : null;
              setDragging(null);
              setHover(null);
              simRef.current?.alphaTarget(0);
            }}
          />
        ))}
        <PlotNote
          text={props.note}
          width={width - 16}
          x={width / 2}
          y={height - 6}
        />
      </svg>
      {focus === null ? null : (
        <Tooltip x={place(focus).x} y={place(focus).y - focus.r * scale - 4}>
          <b>{focus.datum.id}</b> · {props.format(focus.datum.value)}
        </Tooltip>
      )}
    </div>
  );
};

/**
 * G11 Integrations. A hub and its satellites in a d3-force layout, node
 * area = volume, each link a bundle of 1–4 hairlines by strength. The hub is
 * the one solid node and its strongest link the one ink bundle; satellites
 * are hollow rings. Drag a node: the springs pull it back when you let go.
 */
export const ForceGraph = (props: ForceGraphProps) => {
  const height = props.height ?? 440;
  const nodes = props.nodes ?? forceGraphDemo.nodes;
  const links = props.links ?? forceGraphDemo.links;
  const format = props.format ?? defaultFormat;
  return (
    <Plot>
      {(width) => (
        <ForceField
          width={width}
          // Narrow plots get a square field no taller than 360, so the graph fills it.
          height={width < 460 ? Math.min(width, 360) : height}
          nodes={nodes}
          links={links}
          format={format}
          note={props.note}
        />
      )}
    </Plot>
  );
};
