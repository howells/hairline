import type { Simulation } from "d3-force";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";

import type { NoteProps } from "../../schema/options";
import { Plot, Tooltip } from "../core";
import { useReducedMotion, useReveal } from "../hooks";
import { HitRect, TipText } from "../hover";
import { FOCUS_RING } from "../network-select";
import {
  REACH,
  linkStepOf,
  nextByKey,
  pickNode,
  reachText,
  stepsFrom,
} from "../network-steps";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { CrossHatch, Hatch, PlateLabel } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { clamp, noteSpace, noteOf, sansWidth } from "../util";
import {
  RING_BELOW,
  buildGalaxy,
  drawGalaxy,
  fitHub,
  labelAt,
  labelOnEngraving,
  makeSimulation,
  placeCaption,
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

/** Millions a year to one decimal ("84.6m"). */
const fmtMillions = (v: number) => `${v.toFixed(1)}m`;

interface ForceGalaxyProps extends NoteProps {
  data?: GalaxyData;
  format?: (v: number) => string;
  height?: number;
  /** Unit after the volume in the tooltip. */
  unit?: string;
  /** Node id selected until the pointer or keys choose another; everything fades out from it by links. */
  selected?: string;
}

/** Class names per tone, written out so Tailwind sees them. */
const TONE_CLASS: Record<Tone, { fill: string; stroke: string }> = {
  ink: { fill: "fill-hero", stroke: "stroke-ink" },
  l2: { fill: "fill-l2", stroke: "stroke-l2" },
  l3: { fill: "fill-l3", stroke: "stroke-l3" },
  l4: { fill: "fill-l4", stroke: "stroke-l4" },
  l5: { fill: "fill-l5", stroke: "stroke-l5" },
};
const TONES: Tone[] = ["ink", "l2", "l3", "l4", "l5"];
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
/*
 * Selecting a star sets data-step on it and on what it reaches (0 itself, 1
 * direct, 2 two steps) and data-focus on the root; the browser restyles, React
 * renders nothing. What is further than two steps has no step and fades.
 */
/** A satellite: ink at 0 and 1, mid at 2, the rest back to the paper. */
const STAR_STEP = `transition-opacity group-data-[focus=true]/galaxy:not-data-[step]:opacity-40 group-data-[focus=true]/galaxy:data-[step=0]:fill-hero group-data-[focus=true]/galaxy:data-[step=1]:fill-ink group-data-[focus=true]/galaxy:data-[step=2]:fill-l3`;
/** A hub is engraved: its rule takes the step's tone. */
const HUB_STEP = `transition-opacity group-data-[focus=true]/galaxy:not-data-[step]:opacity-40 group-data-[focus=true]/galaxy:data-[step=0]:stroke-ink group-data-[focus=true]/galaxy:data-[step=1]:stroke-ink group-data-[focus=true]/galaxy:data-[step=2]:stroke-l3`;
/** A hub's name: faded with the rest, and left to the caption when selected. */
const NAME_STEP = `transition-opacity group-data-[focus=true]/galaxy:not-data-[step]:opacity-40 group-data-[focus=true]/galaxy:data-[step=0]:opacity-0`;
const EDGE_STEP = `transition-tone group-data-[focus=true]/galaxy:not-data-[step]:opacity-10 group-data-[focus=true]/galaxy:data-[step=1]:stroke-ink group-data-[focus=true]/galaxy:data-[step=2]:stroke-l3`;

/** Runs the layout once the plot is on screen; stops it on unmount or resize. */
const useGalaxySimulation = (
  galaxy: Galaxy,
  shown: boolean,
  handles: Handles
) => {
  const sim = useRef<Simulation<Star, Edge> | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const simulation = shown
      ? makeSimulation(galaxy, () => {
          drawGalaxy(galaxy, handles);
        })
      : null;
    sim.current = simulation;
    if (simulation !== null && reduced) {
      settle(galaxy, simulation);
      drawGalaxy(galaxy, handles);
    }
    return () => {
      simulation?.stop();
      sim.current = null;
    };
  }, [galaxy, shown, handles, reduced]);
  return sim;
};

/** The caption's name and reach, set on the caption the star follows. */
const writeCaption = (caption: SVGGElement | undefined, text: string[]) => {
  if (caption === undefined) {
    return;
  }
  const [name, note] = text.length === 0 ? ["", ""] : text;
  const lines = caption.querySelectorAll("text");
  lines[0].textContent = name;
  lines[1].textContent = note;
  caption.dataset.run = String(
    Math.max(sansWidth(name, 11), sansWidth(note, 11))
  );
  caption.setAttribute("visibility", text.length === 0 ? "hidden" : "visible");
};

/**
 * Focus by data attributes: the browser restyles, React renders nothing. A
 * fresh layout is fresh elements, so the `rest` node (the preselected one, if
 * any) is lit on them whenever the layout or `rest` changes.
 */
const useStarFocus = (
  galaxy: Galaxy,
  handles: Handles,
  rest: string | null
) => {
  const lit = useRef<SVGElement[]>([]);
  const current = useRef<string | null>(null);
  const live = useRef<HTMLSpanElement | null>(null);
  const focus = useCallback(
    (id: string | null) => {
      if (current.current === id) {
        return;
      }
      current.current = id;
      for (const el of lit.current) {
        delete el.dataset.step;
      }
      lit.current = [];
      const root = handles.frame.get("root");
      if (root !== undefined) {
        root.dataset.focus = String(id !== null);
      }
      const caption = handles.caption.get("root");
      if (caption !== undefined) {
        caption.dataset.id = id ?? "";
      }
      if (id === null) {
        writeCaption(caption, []);
        if (live.current !== null) {
          live.current.textContent = "";
        }
        return;
      }
      const steps = stepsFrom(galaxy.neighbours, id);
      const mark = (el: SVGElement | undefined, step: number) => {
        if (el !== undefined) {
          el.dataset.step = String(step);
          lit.current.push(el);
        }
      };
      for (const [n, step] of steps) {
        mark(handles.stars.get(n), step);
        mark(handles.labels.get(n), step);
      }
      for (const e of galaxy.edges) {
        const step = linkStepOf(steps, e.a.id, e.b.id);
        if (step < 3) {
          mark(handles.edges.get(e.id), step);
        }
      }
      writeCaption(caption, [id, reachText(steps)]);
      placeCaption(galaxy, handles);
      if (live.current !== null) {
        live.current.textContent = `${id}: ${reachText(steps)}`;
      }
    },
    [galaxy, handles]
  );
  useEffect(() => {
    current.current = null;
    focus(rest);
  }, [focus, rest]);
  return { current, focus, live };
};

/** Hub textures: each tone hatched on paper; the hero crosshatched in ink. */
const HubDefs = (props: { pid: string }) => (
  <defs>
    {TONES.map((t) =>
      t === "ink" ? (
        <CrossHatch
          id={`${props.pid}-${t}`}
          key={t}
          tone={TONE_CLASS[t].fill}
        />
      ) : (
        <Hatch id={`${props.pid}-${t}`} key={t} tone={TONE_CLASS[t].fill} />
      )
    )}
  </defs>
);

/** Hubs: engraved fill inside a 1px rule (ink for the hero). Satellites: solid. */
const starPaint = (s: Star, pid: string) =>
  s.hub
    ? {
        className: s.tone === "ink" ? "stroke-ink" : "stroke-l5",
        fill: paint(`${pid}-${s.tone}`),
        strokeWidth: 1,
      }
    : {
        className: TONE_CLASS[s.tone].fill,
        fill: undefined,
        strokeWidth: undefined,
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
            className={`${EDGE_CLASS[e.kind]} ${EDGE_STEP}`}
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
              className={`cursor-grab touch-none ${look.className} ${s.hub ? HUB_STEP : STAR_STEP}`}
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
          // On another hub's engraving the name sits on a plate; elsewhere,
          // over lines and satellites, on its halo. drawGalaxy keeps both the
          // position and the choice current as hubs move.
          return (
            <g
              className={`group/hub ${NAME_STEP}`}
              data-plate={String(labelOnEngraving(galaxy, ring, spot))}
              key={ring.hub.id}
              ref={(el) => {
                if (el !== null) {
                  handles.labels.set(ring.hub.id, el);
                }
              }}
              transform={`translate(${Math.round(spot.x)} ${Math.round(spot.y)})`}
            >
              <g className="hidden group-data-[plate=true]/hub:inline">
                <PlateLabel
                  className="t-label"
                  text={ring.hub.id}
                  x={0}
                  y={0}
                />
              </g>
              <Label
                anchor="middle"
                className="group-data-[plate=true]/hub:hidden"
                dy="0.35em"
                voice="label"
              >
                {ring.hub.id}
              </Label>
            </g>
          );
        })}
      </g>
      <g
        className="pointer-events-none"
        ref={(el) => {
          if (el !== null) {
            handles.caption.set("root", el);
          }
        }}
        visibility="hidden"
      >
        <Label voice="label" y={-1} />
        <Label muted voice="axis" y={12} />
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

/** The star under the pointer, or the nearest within reach of it: a fingertip reaches further than a mouse. */
const starUnder = (e: PointerEvent<SVGSVGElement>, galaxy: Galaxy) => {
  const { x, y } = pointerIn(e);
  const at = pickNode(
    galaxy.stars.map((s) => ({ r: s.r, x: s.x ?? 0, y: s.y ?? 0 })),
    x,
    y,
    e.pointerType === "touch" ? REACH.touch : REACH.mouse
  );
  return galaxy.stars[at] ?? null;
};

/** Drag with spring-back, hover focus and click-empty-space-to-replay, all on the <svg>. */
const useGalaxyPointer = (args: {
  current: RefObject<string | null>;
  focus: (id: string | null) => void;
  galaxy: Galaxy;
  handles: Handles;
  onTip: (t: StarTip | null) => void;
  /** The node selected when the pointer is on none: the preselected one, if any. */
  rest: string | null;
  sim: RefObject<Simulation<Star, Edge> | null>;
}) => {
  const { current, focus, galaxy, handles, onTip, rest, sim } = args;
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
    focus(star?.id ?? rest);
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
  /** A tap holds its node: a finger lifting is not the pointer leaving. */
  const onPointerLeave = (e: PointerEvent<SVGSVGElement>) => {
    if (
      e.pointerType !== "touch" &&
      (drag.current === null || drag.current.star === null)
    ) {
      focus(rest);
      onTip(null);
    }
  };
  /** Arrow keys step through the stars; Escape gives the selection back. */
  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    const ids = galaxy.stars.map((s) => s.id);
    const next = nextByKey(e.key, ids, current.current);
    if (next === undefined) {
      return;
    }
    e.preventDefault();
    const star = galaxy.stars.find((s) => s.id === next);
    focus(next ?? rest);
    onTip(star === undefined ? null : tipFor(star));
  };
  return {
    onKeyDown,
    onPointerCancel: onPointerUp,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
    tabIndex: 0,
  };
};

const GalaxySvg = (props: {
  data: GalaxyData;
  height: number;
  note?: string;
  onTip: (t: StarTip | null) => void;
  selected?: string;
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
      caption: new Map(),
      edges: new Map(),
      frame: new Map(),
      labels: new Map(),
      stars: new Map(),
    }),
    []
  );
  const sim = useGalaxySimulation(galaxy, shown, handles);
  const pid = useTextureIds("galaxy")("hub");
  const rest = props.selected ?? null;
  const { current, focus, live } = useStarFocus(galaxy, handles, rest);
  const pointer = useGalaxyPointer({
    current,
    focus,
    galaxy,
    handles,
    onTip,
    rest,
    sim,
  });
  // Built once per layout; the simulation then moves these elements directly.
  const marks = useMemo(
    () => <GalaxyMarks galaxy={galaxy} handles={handles} pid={pid} />,
    [galaxy, handles, pid]
  );
  const domains = new Set(data.nodes.map((n) => n.domain)).size;
  const label = `Underground lines and stations: ${data.nodes.length} nodes in ${domains} lines`;

  return (
    <div className="fade" ref={wrap}>
      <ChartSvg
        className={`group/galaxy touch-pan-y data-[dragging=true]:cursor-grabbing ${FOCUS_RING}`}
        desc="Arrow keys step through the stations and lines; Escape clears."
        height={height}
        label={label}
        ref={(el) => {
          if (el !== null) {
            handles.frame.set("root", el);
          }
        }}
        width={width}
        {...pointer}
      >
        <HubDefs pid={pid} />
        <HitRect height={height} width={width} />
        {marks}
        <FootNote height={height} text={props.note} width={width} />
      </ChartSvg>
      <span aria-live="polite" className="sr-only" ref={live} />
    </div>
  );
};

/**
 * B2 Lines and stations. Stations round the lines they sit on: d3-force lays out the hubs,
 * and each hub carries its satellites on one ring at an even angular pitch,
 * busiest first from noon. Drag a hub (or any of its satellites) and it
 * springs back when released; hover, tap or arrow to a node and everything
 * fades out from it by links (it and its direct links in ink, two steps in a
 * mid tone, the rest near the paper), with its name and reach beside it;
 * click empty space to replay the big bang.
 */
export const ForceGalaxy = (props: ForceGalaxyProps) => {
  const data = props.data ?? forceGalaxyDemo;
  const format = props.format ?? fmtMillions;
  const [tip, setTip] = useState<StarTip | null>(null);
  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <TipText
              facts={[
                `${format(tip.volume)} ${props.unit ?? "entries and exits a year"}`,
                `${tip.degree} links`,
              ]}
              lead={tip.id}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <GalaxySvg
          data={data}
          height={props.height ?? 480}
          note={noteOf(props)}
          onTip={setTip}
          selected={props.selected}
          width={width}
        />
      )}
    </Plot>
  );
};
