import type { Simulation } from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, RefObject } from "react";

import { fmtInt } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { useReveal } from "../hooks";
import { PlotNote } from "../plot-note";
import { CrossHatch, Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, noteSpace } from "../util";
import {
  RING_BELOW,
  buildGalaxy,
  drawGalaxy,
  fitHub,
  labelAt,
  makeSimulation,
  settle,
} from "./force-galaxy-model";
import type {
  Edge,
  EdgeKind,
  Galaxy,
  Handles,
  Star,
  StarTip,
  Tone,
} from "./force-galaxy-model";
import { forceGalaxyDemo } from "./force-galaxy.data";
import type { GalaxyData } from "./force-galaxy.data";

interface ForceGalaxyProps {
  data?: GalaxyData;
  format?: (v: number) => string;
  height?: number;
  note?: string;
  /** Unit after the volume in the tooltip. */
  unit?: string;
}

/** Class names per tone, written out so Tailwind sees them. */
const TONE_CLASS: Record<Tone, { fill: string; stroke: string }> = {
  ink: { fill: "fill-ink", stroke: "stroke-ink" },
  l1: { fill: "fill-l1", stroke: "stroke-l1" },
  l2: { fill: "fill-l2", stroke: "stroke-l2" },
  l3: { fill: "fill-l3", stroke: "stroke-l3" },
  l4: { fill: "fill-l4", stroke: "stroke-l4" },
  l5: { fill: "fill-l5", stroke: "stroke-l5" },
};
const TONES: Tone[] = ["ink", "l1", "l2", "l3", "l4", "l5"];
/** Solid tones per link kind: the service mesh reads first, satellites quietly. */
const EDGE_CLASS: Record<EdgeKind, string> = {
  cross: "stroke-grid",
  mesh: "stroke-l5",
  spoke: "stroke-l6",
};
/** Hub-to-hub traffic in the three line weights: 1px, 1.5px, 2px. */
const MESH_WIDTHS = [1, 1.5, 2];
const edgeWidth = (e: Edge) =>
  e.kind === "mesh"
    ? MESH_WIDTHS[Math.min(MESH_WIDTHS.length, Math.max(1, e.weight)) - 1]
    : 1;
const DIM =
  "transition-opacity group-data-[focus=true]/galaxy:not-data-[on=true]:opacity-25";
const EDGE_DIM =
  "transition-tone group-data-[focus=true]/galaxy:not-data-[on=true]:opacity-5 data-[on=true]:stroke-ink";

/** Runs the layout once the plot is on screen; stops it on unmount or resize. */
const useGalaxySimulation = (
  galaxy: Galaxy,
  shown: boolean,
  handles: Handles
) => {
  const sim = useRef<Simulation<Star, Edge> | null>(null);
  useEffect(() => {
    const simulation = shown
      ? makeSimulation(galaxy, () => {
          drawGalaxy(galaxy, handles);
        })
      : null;
    sim.current = simulation;
    if (
      simulation !== null &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      settle(galaxy, simulation);
      drawGalaxy(galaxy, handles);
    }
    return () => {
      simulation?.stop();
      sim.current = null;
    };
  }, [galaxy, shown, handles]);
  return sim;
};

/** Focus by data attributes: the browser restyles, React renders nothing. */
const useStarFocus = (galaxy: Galaxy, handles: Handles) => {
  const lit = useRef<SVGElement[]>([]);
  const current = useRef<string | null>(null);
  return (id: string | null) => {
    if (current.current === id) {
      return;
    }
    current.current = id;
    for (const el of lit.current) {
      delete el.dataset.on;
    }
    lit.current = [];
    const root = handles.frame.get("root");
    if (root !== undefined) {
      root.dataset.focus = String(id !== null);
    }
    if (id === null) {
      return;
    }
    const on = (el: SVGElement | undefined) => {
      if (el !== undefined) {
        el.dataset.on = "true";
        lit.current.push(el);
      }
    };
    for (const n of [id, ...(galaxy.neighbours.get(id) ?? [])]) {
      on(handles.stars.get(n));
      on(handles.labels.get(n));
    }
    for (const e of galaxy.edges) {
      if (e.a.id === id || e.b.id === id) {
        on(handles.edges.get(e.id));
      }
    }
  };
};

/** Hub textures: each tone hatched on paper; the hero crosshatched in ink. */
const HubDefs = (props: { pid: string }) => (
  <defs>
    {TONES.map((t) =>
      t === "ink" ? (
        <CrossHatch
          ground="fill-paper"
          id={`${props.pid}-${t}`}
          key={t}
          tone={TONE_CLASS[t].fill}
        />
      ) : (
        <Hatch
          ground="fill-paper"
          id={`${props.pid}-${t}`}
          key={t}
          tone={TONE_CLASS[t].fill}
        />
      )
    )}
  </defs>
);

/** Hubs: engraved fill inside a 1px rule (ink for the hero). Satellites: solid, with a wide invisible stroke to catch the pointer. */
const starPaint = (s: Star, pid: string) =>
  s.hub
    ? {
        className: s.tone === "ink" ? "stroke-ink" : "stroke-l5",
        fill: paint(`${pid}-${s.tone}`),
        strokeWidth: 1,
      }
    : {
        className: `stroke-transparent ${TONE_CLASS[s.tone].fill}`,
        fill: undefined,
        strokeWidth: 7,
      };

const GalaxyMarks = (props: {
  galaxy: Galaxy;
  handles: Handles;
  pid: string;
}) => {
  const { galaxy, handles, pid } = props;
  return (
    <>
      <g>
        {galaxy.edges.map((e) => (
          <line
            className={`${EDGE_CLASS[e.kind]} ${EDGE_DIM}`}
            key={e.id}
            ref={(el) => {
              if (el !== null) {
                handles.edges.set(e.id, el);
              }
            }}
            strokeLinecap="round"
            strokeWidth={edgeWidth(e)}
            x1={e.a.x}
            x2={e.b.x}
            y1={e.a.y}
            y2={e.b.y}
          />
        ))}
      </g>
      <g>
        {galaxy.stars.map((s) => {
          const look = starPaint(s, pid);
          return (
            <circle
              className={`cursor-grab touch-none ${look.className} ${DIM}`}
              cx={s.x}
              cy={s.y}
              data-id={s.id}
              fill={look.fill}
              key={s.id}
              r={s.r}
              ref={(el) => {
                if (el !== null) {
                  handles.stars.set(s.id, el);
                }
              }}
              strokeWidth={look.strokeWidth}
            />
          );
        })}
      </g>
      <g className="pointer-events-none">
        {[...galaxy.rings.values()].map((ring) => {
          const spot = labelAt(galaxy, ring);
          return (
            <text
              className={`t-label t-halo ${DIM}`}
              dy="0.35em"
              key={ring.hub.id}
              ref={(el) => {
                if (el !== null) {
                  handles.labels.set(ring.hub.id, el);
                }
              }}
              textAnchor="middle"
              x={spot.x}
              y={spot.y}
            >
              {ring.hub.id}
            </text>
          );
        })}
      </g>
    </>
  );
};

interface DragState {
  moved: boolean;
  pointer: number;
  star: Star | null;
  x0: number;
  y0: number;
}

const pointerIn = (e: PointerEvent<SVGSVGElement>) => {
  const box = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - box.left, y: e.clientY - box.top };
};

const starUnder = (e: PointerEvent<SVGSVGElement>, galaxy: Galaxy) => {
  const { target } = e;
  const id = target instanceof SVGElement ? target.dataset.id : undefined;
  return id === undefined
    ? null
    : (galaxy.stars.find((s) => s.id === id) ?? null);
};

/** Drag with spring-back, hover focus and click-empty-space-to-replay, all on the <svg>. */
const useGalaxyPointer = (args: {
  focus: (id: string | null) => void;
  galaxy: Galaxy;
  handles: Handles;
  onTip: (t: StarTip | null) => void;
  sim: RefObject<Simulation<Star, Edge> | null>;
}) => {
  const { focus, galaxy, handles, onTip, sim } = args;
  const drag = useRef<DragState | null>(null);
  const tipFor = (s: Star): StarTip => ({
    degree: galaxy.neighbours.get(s.id)?.length ?? 0,
    id: s.id,
    volume: s.volume,
    x: s.x ?? 0,
    y: (s.y ?? 0) - s.r - 4,
  });
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    const { x, y } = pointerIn(e);
    const under = starUnder(e, galaxy);
    // A satellite rides on its ring: grabbing it moves the whole hub.
    const star =
      under === null || under.hub
        ? under
        : ([...galaxy.rings.values()].find((r) => r.sats.includes(under))
            ?.hub ?? null);
    drag.current = { moved: false, pointer: e.pointerId, star, x0: x, y0: y };
    if (star === null) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.dataset.dragging = "true";
    star.fx = star.x;
    star.fy = star.y;
    sim.current?.alphaTarget(0.25).restart();
    focus(star.id);
    onTip(null);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const { x, y } = pointerIn(e);
    const d = drag.current;
    if (d !== null && Math.hypot(x - d.x0, y - d.y0) > 3) {
      d.moved = true;
    }
    if (d !== null && d.star !== null) {
      const s = d.star;
      const ring = galaxy.rings.get(s.id);
      // The hub follows the pointer, but its ring and name stay in the plot.
      const at = ring === undefined ? { x, y } : fitHub(galaxy, ring, x, y);
      s.fx = at.x;
      s.fy = at.y;
      if (sim.current === null) {
        s.x = s.fx;
        s.y = s.fy;
        galaxy.orbit();
        drawGalaxy(galaxy, handles);
      }
      return;
    }
    const star = starUnder(e, galaxy);
    focus(star?.id ?? null);
    onTip(star === null ? null : tipFor(star));
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (d === null) {
      return;
    }
    if (d.star !== null) {
      // Let go: the links pull it home.
      d.star.fx = null;
      d.star.fy = null;
      sim.current
        ?.alphaTarget(0)
        .alpha(Math.max(sim.current.alpha(), 0.5))
        .restart();
      if (e.currentTarget.hasPointerCapture(d.pointer)) {
        e.currentTarget.releasePointerCapture(d.pointer);
      }
      return;
    }
    if (!d.moved) {
      // Click on empty space: replay the big bang.
      focus(null);
      onTip(null);
      galaxy.place();
      drawGalaxy(galaxy, handles);
      sim.current?.alpha(1).restart();
    }
  };
  const onPointerLeave = () => {
    if (drag.current === null || drag.current.star === null) {
      focus(null);
      onTip(null);
    }
  };
  return {
    onPointerCancel: onPointerUp,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
  };
};

const GalaxySvg = (props: {
  data: GalaxyData;
  height: number;
  note?: string;
  onTip: (t: StarTip | null) => void;
  width: number;
}) => {
  const { data, onTip, width } = props;
  // A ring layout needs a taller plot than a free one: its ellipse stands upright.
  const aspect = width < RING_BELOW ? 1.15 : 0.82;
  const height = Math.min(
    props.height,
    Math.round(clamp(width * aspect, 360, 480))
  );
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useReveal(wrap);
  const floor = height - noteSpace(props.note, width - 16, 18);
  const galaxy = useMemo(
    () => buildGalaxy(data, width, floor),
    [data, width, floor]
  );
  const handles = useMemo<Handles>(
    () => ({
      edges: new Map(),
      frame: new Map(),
      labels: new Map(),
      stars: new Map(),
    }),
    []
  );
  const sim = useGalaxySimulation(galaxy, shown, handles);
  const pid = useTextureIds("galaxy")("hub");
  const focus = useStarFocus(galaxy, handles);
  const pointer = useGalaxyPointer({
    focus,
    galaxy,
    handles,
    onTip,
    sim,
  });
  // Built once per layout; the simulation then moves these elements directly.
  const marks = useMemo(
    () => <GalaxyMarks galaxy={galaxy} handles={handles} pid={pid} />,
    [galaxy, handles, pid]
  );
  const domains = new Set(data.nodes.map((n) => n.domain)).size;
  const label = `Service calls: ${data.nodes.length} services in ${domains} groups`;

  return (
    <div
      className={`duration-enter transition-opacity ${shown ? "opacity-100" : "opacity-0"}`}
      ref={wrap}
    >
      <svg
        aria-label={label}
        className="group/galaxy touch-pan-y data-[dragging=true]:cursor-grabbing"
        height={height}
        ref={(el) => {
          if (el !== null) {
            handles.frame.set("root", el);
          }
        }}
        width={width}
        {...pointer}
      >
        <title>{label}</title>
        <HubDefs pid={pid} />
        <rect className="fill-transparent" height={height} width={width} />
        {marks}
        <PlotNote
          text={props.note}
          width={width - 16}
          x={width / 2}
          y={height - 6}
        />
      </svg>
    </div>
  );
};

/**
 * B2 Service calls. ~180 services in domains: d3-force lays out the hubs,
 * and each hub carries its satellites on one ring at an even angular pitch,
 * busiest first from noon. Drag a hub (or any of its satellites) and it
 * springs back when released; hover to focus a node and its neighbours;
 * click empty space to replay the big bang.
 */
export const ForceGalaxy = (props: ForceGalaxyProps) => {
  const data = props.data ?? forceGalaxyDemo;
  const format = props.format ?? fmtInt;
  const [tip, setTip] = useState<StarTip | null>(null);
  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{tip.id}</b> · {format(tip.volume)} {props.unit ?? "calls/min"} ·{" "}
            {tip.degree} links
          </Tooltip>
        )
      }
    >
      {(width) => (
        <GalaxySvg
          data={data}
          height={props.height ?? 480}
          note={props.note}
          onTip={setTip}
          width={width}
        />
      )}
    </Plot>
  );
};
