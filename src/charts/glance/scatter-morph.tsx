import { scaleLinear } from "d3-scale";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useReducedMotion, useReveal } from "../hooks";
import { DURATION, easeTravel } from "../motion";
import { PlotNote } from "../plot-note";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { ControlSlot } from "./control-slot";
import { scatterMorphDemo } from "./scatter-morph.data";
import type { MorphDatum } from "./scatter-morph.data";
import {
  blendPts,
  circlePts,
  ptsPath,
  rankTones,
  rectPts,
  sectorPts,
} from "./util-a";
import type { Pt } from "./util-a";
import { CONTROL_SLOT_H } from "./util-b";

interface ScatterMorphProps {
  data?: MorphDatum[];
  height?: number;
  format?: (v: number) => string;
  /** Axis names for the scatter view. */
  xLabel?: string;
  yLabel?: string;
  formatX?: (v: number) => string;
  formatY?: (v: number) => string;
  note?: string;
}

type View = "bars" | "ring" | "scatter";
const VIEWS: View[] = ["scatter", "bars", "ring"];
const VIEW_NAMES: Record<View, string> = {
  bars: "Bars",
  ring: "Ring",
  scatter: "Scatter",
};

type LabelKind = "category" | "name" | "value";

interface MarkLabel {
  id: string;
  x: number;
  y: number;
  text: string;
  anchor: "end" | "middle" | "start";
  kind: LabelKind;
  leader?: string;
  rotate?: number;
}

interface Layout {
  marks: Pt[][];
  labels: MarkLabel[];
  tips: Pt[];
  furniture: ReactNode;
}

interface Ctx {
  data: MorphDatum[];
  /** Indices sorted by value, largest first. */
  order: number[];
  width: number;
  h: number;
  narrow: boolean;
  fx: (v: number) => string;
  fy: (v: number) => string;
  xLabel: string;
  yLabel: string;
}

const HOLD = 3000;
const MORPH = DURATION.long;
/** Corner radius (the radius scale's small step), drawn as a round-joined stroke around an inset outline. */
const ROUND = 2;

const defaultFormat = (v: number) => `${v}k weekly users`;
const defaultFx = String;
const defaultFy = (v: number) => {
  if (v === 0) {
    return "0%";
  }
  return v > 0 ? `+${v}%` : `−${Math.abs(v)}%`;
};

const scatterLayout = (c: Ctx): Layout => {
  const m = { bottom: 34, left: 46, right: 18, top: 14 };
  const xs = scaleLinear()
    .domain([0, Math.max(...c.data.map((d) => d.x))])
    .nice(4)
    .range([m.left, c.width - m.right - 30]);
  const ys = scaleLinear()
    .domain([
      Math.min(0, ...c.data.map((d) => d.y)),
      Math.max(...c.data.map((d) => d.y)),
    ])
    .nice(4)
    .range([c.h - m.bottom, m.top]);
  const maxV = Math.max(...c.data.map((d) => d.value));
  const rad = (v: number) =>
    Math.max(ROUND + 3, (c.narrow ? 18 : 24) * Math.sqrt(v / maxV));
  const furniture = (
    <g>
      {ys.ticks(4).map((v) => (
        <g key={`y${v}`}>
          <line
            className={v === 0 ? "hairline" : "grid-line"}
            x1={m.left}
            x2={c.width - m.right}
            y1={Math.round(ys(v)) + 0.5}
            y2={Math.round(ys(v)) + 0.5}
          />
          <text
            className="t-axis"
            x={m.left - 8}
            y={ys(v)}
            dy="0.35em"
            textAnchor="end"
          >
            {c.fy(v)}
          </text>
        </g>
      ))}
      {xs.ticks(4).map((v) => (
        <text
          key={`x${v}`}
          className="t-axis"
          x={xs(v)}
          y={c.h - m.bottom + 18}
          textAnchor="middle"
        >
          {c.fx(v)}
        </text>
      ))}
      <text
        className="t-note"
        x={c.width - m.right}
        y={c.h - 2}
        textAnchor="end"
      >
        {c.xLabel} →
      </text>
      <text className="t-note" x={m.left} y={m.top - 6}>
        ↑ {c.yLabel}
      </text>
    </g>
  );
  return {
    furniture,
    labels: c.data.map((d) => ({
      anchor: "start",
      id: d.label,
      kind: "name",
      text: d.label,
      x: xs(d.x) + rad(d.value) + 5,
      y: ys(d.y),
    })),
    marks: c.data.map((d) => circlePts(xs(d.x), ys(d.y), rad(d.value) - ROUND)),
    tips: c.data.map((d): Pt => [xs(d.x), ys(d.y) - rad(d.value)]),
  };
};

const barsLayout = (c: Ctx): Layout => {
  const step = (c.width - 12) / c.data.length;
  // Names tilt when the longest no longer fits under its bar.
  const longest = Math.max(...c.data.map((d) => sansWidth(d.label, 12)));
  const tilt = c.narrow || longest > step - 6;
  const m = { bottom: tilt ? 60 : 30, left: 6, right: 6, top: 24 };
  const bw = step * (c.narrow ? 0.7 : 0.62);
  const floor = c.h - m.bottom;
  const yv = scaleLinear()
    .domain([0, Math.max(...c.data.map((d) => d.value))])
    .range([floor, m.top]);
  const slot = new Map(c.order.map((i, k) => [i, k]));
  const cxOf = (i: number) => m.left + ((slot.get(i) ?? 0) + 0.5) * step;
  return {
    furniture: (
      <line
        className="hairline"
        x1={m.left}
        x2={c.width - m.right}
        y1={floor + 0.5}
        y2={floor + 0.5}
      />
    ),
    labels: c.data.flatMap((d, i) => [
      {
        anchor: tilt ? "end" : "middle",
        id: `${d.label}-cat`,
        kind: "category",
        rotate: tilt ? -50 : 0,
        text: d.label,
        x: cxOf(i),
        y: floor + 14,
      },
      {
        anchor: "middle",
        id: `${d.label}-val`,
        kind: "value",
        text: String(d.value),
        x: cxOf(i),
        y: yv(d.value) - 8,
      },
    ]),
    marks: c.data.map((d, i) =>
      rectPts(
        cxOf(i) - bw / 2 + ROUND,
        yv(d.value) + ROUND,
        cxOf(i) + bw / 2 - ROUND,
        floor - ROUND
      )
    ),
    tips: c.data.map((d, i): Pt => [cxOf(i), yv(d.value) - 18]),
  };
};

/** Minimum vertical pitch between two ring labels on one side, px. */
const LABEL_PITCH = 14;

interface Seat {
  /** Index into the data. */
  i: number;
  y: number;
}

/**
 * One relaxation pass over a column of labels sorted top to bottom: each is
 * pushed away from its neighbour until they sit LABEL_PITCH apart, upward in
 * the top half of the ring and downward in the bottom half (away from the
 * ring's waist), then held inside [lo, hi].
 */
const relax = (seats: Seat[], mid: number, lo: number, hi: number) => {
  const ys = seats.map((s) => s.y);
  const top = ys.filter((y) => y < mid).length;
  // Top half: from its lowest label up, then back down from the top bound.
  for (let k = top - 2; k >= 0; k -= 1) {
    ys[k] = Math.min(ys[k], ys[k + 1] - LABEL_PITCH);
  }
  if (top > 0) {
    ys[0] = Math.max(lo, ys[0]);
  }
  // Then everything down from the top, which also settles the bottom half.
  for (let k = 1; k < ys.length; k += 1) {
    ys[k] = Math.max(ys[k], ys[k - 1] + LABEL_PITCH);
  }
  // Out of room at the bottom: pull back up from the bottom bound.
  const last = ys.length - 1;
  if (last >= 0 && ys[last] > hi) {
    ys[last] = hi;
    for (let k = last - 1; k >= 0; k -= 1) {
      ys[k] = Math.min(ys[k], ys[k + 1] - LABEL_PITCH);
    }
  }
  return new Map(seats.map((s, k) => [s.i, ys[k]]));
};

const ringLayout = (c: Ctx): Layout => {
  const cx = c.width / 2;
  const cy = c.h / 2;
  const r1 = Math.min(c.h / 2 - 26, c.width / 2 - (c.narrow ? 70 : 110));
  const r0 = r1 * 0.42;
  const total = c.data.reduce((a, d) => a + d.value, 0);
  const angles = new Map<number, { a0: number; a1: number }>();
  let acc = 0;
  for (const i of c.order) {
    const a0 = (acc / total) * Math.PI * 2;
    acc += c.data[i].value;
    angles.set(i, { a0, a1: (acc / total) * Math.PI * 2 });
  }
  const span = (i: number) => angles.get(i) ?? { a0: 0, a1: 0 };
  const mid = (i: number) => (span(i).a0 + span(i).a1) / 2;
  const run = c.narrow ? 14 : 34;
  // On narrow plots the thinnest slices go unlabelled (the tooltip still names them).
  const named = c.data.flatMap((_, i) =>
    c.narrow && span(i).a1 - span(i).a0 < 0.25 ? [] : [i]
  );
  const elbow = (i: number): Pt => [
    cx + (r1 + 16) * Math.sin(mid(i)),
    cy - (r1 + 16) * Math.cos(mid(i)),
  ];
  // Each side's labels relaxed to a 14px pitch so thin neighbours never overprint.
  const side = (right: boolean) =>
    named
      .flatMap((i): Seat[] =>
        Math.sin(mid(i)) >= 0 === right ? [{ i, y: elbow(i)[1] }] : []
      )
      .toSorted((a, b) => a.y - b.y);
  const seatY = new Map([
    ...relax(side(true), cy, 7, c.h - 7),
    ...relax(side(false), cy, 7, c.h - 7),
  ]);
  return {
    furniture: null,
    labels: named.map((i): MarkLabel => {
      const sx = Math.sin(mid(i));
      const sy = -Math.cos(mid(i));
      const right = sx >= 0;
      const [ex] = elbow(i);
      const ly = seatY.get(i) ?? elbow(i)[1];
      const end = ex + (right ? run : -run);
      return {
        anchor: right ? "start" : "end",
        id: c.data[i].label,
        kind: "name",
        // Out from the ring to the label's own height, then level to the name.
        leader: `M${cx + (r1 + 4) * sx},${cy + (r1 + 4) * sy}L${ex},${ly}L${end},${ly}`,
        text: c.data[i].label,
        x: end + (right ? 6 : -6),
        y: ly,
      };
    }),
    marks: c.data.map((_, i) =>
      sectorPts(
        cx,
        cy,
        r0 + ROUND,
        r1 - ROUND,
        span(i).a0,
        span(i).a1,
        1.5 + ROUND
      )
    ),
    tips: c.data.map((_, i): Pt => [
      cx + r1 * Math.sin(mid(i)),
      cy - r1 * Math.cos(mid(i)),
    ]),
  };
};

const LAYOUTS: Record<View, (c: Ctx) => Layout> = {
  bars: barsLayout,
  ring: ringLayout,
  scatter: scatterLayout,
};

/**
 * View cycling: hold, then morph to the next view with requestAnimationFrame.
 * Paused while hovered; reduced motion jumps straight to the chosen view.
 */
const useMorph = (shown: boolean, reduced: boolean, paused: boolean) => {
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [t, setT] = useState(1);
  const go = (k: number) => {
    if (k === to) {
      return;
    }
    if (from !== to) {
      setFrom(to);
    }
    setT(reduced ? 1 : 0);
    setTo(k);
    if (reduced) {
      setFrom(k);
    }
  };
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / MORPH);
      setT(p);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        setFrom(to);
      }
    };
    if (from !== to && !reduced) {
      raf = requestAnimationFrame(step);
    }
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [from, to, reduced]);
  const next = (to + 1) % VIEWS.length;
  const idle = shown && !reduced && !paused && from === to;
  useEffect(() => {
    let id = 0;
    if (idle) {
      id = window.setTimeout(() => {
        setT(0);
        setTo(next);
      }, HOLD);
    }
    return () => {
      window.clearTimeout(id);
    };
  }, [idle, next]);
  return { from, go, settled: from === to && t >= 1, t, to };
};

interface MarkProps {
  d: string;
  dim: boolean;
  /** Pattern fill for an engraved mark; omit for the solid hero. */
  fill?: string;
  i: number;
  onPointerEnter: () => void;
}

/**
 * One morphing mark. Its outline is inset by ROUND and stroked 2 × ROUND
 * with round joins, which rounds every corner. The hero is solid ink; any
 * other mark is the hatch on paper inside a 1px l5 rim (the rim is the
 * outer pixel of an l5 underlay).
 */
const MorphMark = ({ onPointerEnter, ...p }: MarkProps) => (
  <g
    className={`pop ${dimClass(p.dim)}`}
    style={stagger(p.i, "mark")}
    strokeLinejoin="round"
    onPointerEnter={onPointerEnter}
  >
    {p.fill === undefined ? (
      <path className="fill-hero stroke-hero" d={p.d} strokeWidth={ROUND * 2} />
    ) : (
      <>
        <path className="fill-l5 stroke-l5" d={p.d} strokeWidth={ROUND * 2} />
        <path
          d={p.d}
          fill={p.fill}
          stroke={p.fill}
          strokeWidth={ROUND * 2 - 2}
        />
      </>
    )}
  </g>
);

const ViewChips = ({
  active,
  onPick,
}: {
  active: number;
  onPick: (k: number) => void;
}) => (
  <fieldset className="m-0 flex gap-1 border-0 p-0">
    <legend className="sr-only">View</legend>
    {VIEWS.map((v, k) => (
      <Control
        key={v}
        pressed={k === active}
        onClick={() => {
          onPick(k);
        }}
      >
        {VIEW_NAMES[v]}
      </Control>
    ))}
  </fieldset>
);

const LABEL_CLASS: Record<LabelKind, string> = {
  category: "t-label fill-muted",
  name: "t-name",
  value: "t-value",
};

const MorphLabels = ({
  labels,
  halo,
}: {
  labels: MarkLabel[];
  halo: boolean;
}) => (
  <g className="pointer-events-none">
    {labels.map((l) => (
      <g key={l.id} className="fade">
        {l.leader === undefined ? null : (
          <path
            className="stroke-faint"
            d={l.leader}
            fill="none"
            strokeWidth={1}
          />
        )}
        <text
          className={`${LABEL_CLASS[l.kind]} ${halo ? "t-halo" : ""}`}
          x={l.x}
          y={l.y}
          dy="0.35em"
          textAnchor={l.anchor}
          transform={
            l.rotate === undefined || l.rotate === 0
              ? undefined
              : `rotate(${l.rotate} ${l.x} ${l.y})`
          }
        >
          {l.text}
        </text>
      </g>
    ))}
  </g>
);

/**
 * G9 Three views. One set of entities that cycles through three views,
 * scatter → bars → ring, every few seconds; each mark flies smoothly into its
 * new shape. Hover pauses the cycle; the view controls jump straight to a
 * view. The biggest item is solid ink; the rest are hatched on paper inside
 * a 1px rim, the pattern fixed to the page so marks glide across one
 * continuous engraved screen.
 */
export const ScatterMorph = (props: ScatterMorphProps) => {
  const data = props.data ?? scatterMorphDemo;
  const height = props.height ?? 380;
  const format = props.format ?? defaultFormat;
  const fx = props.formatX ?? defaultFx;
  const fy = props.formatY ?? defaultFy;
  const xName = props.xLabel ?? "Minutes a week";
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useReveal(wrap);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const morph = useMorph(shown, reduced, hover !== null);
  const tex = useTextureIds("morph");
  const handlePick = morph.go;
  // The biggest item in solid ink; the rest engraved in one hatch.
  const tones = rankTones(
    data.map((d) => d.value),
    [0, 4]
  );
  const order = data
    .map((_, i) => i)
    .toSorted((a, b) => data[b].value - data[a].value);
  const view = VIEWS[morph.to];
  const label = `${data.length} items shown as ${VIEW_NAMES[view].toLowerCase()}: ${order.map((i) => `${data[i].label} ${format(data[i].value)}`).join(", ")}`;

  return (
    <div ref={wrap}>
      <ControlSlot>
        <ViewChips active={morph.to} onPick={handlePick} />
      </ControlSlot>
      <Plot>
        {(width) => {
          const noteH = noteSpace(props.note, width - 16, 16);
          const h = height - CONTROL_SLOT_H - noteH;
          const ctx: Ctx = {
            data,
            fx,
            fy,
            h,
            narrow: width < 460,
            order,
            width,
            xLabel: xName,
            yLabel: props.yLabel ?? "Growth",
          };
          const a = LAYOUTS[VIEWS[morph.from]](ctx);
          const b = LAYOUTS[view](ctx);
          const e = easeTravel(morph.t);
          const tip = hover === null ? undefined : b.tips[hover];
          return (
            <div className="relative">
              <svg
                width={width}
                height={h + noteH}
                aria-label={label}
                onPointerLeave={() => {
                  setHover(null);
                }}
              >
                <title>{label}</title>
                <defs>
                  <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l3" />
                </defs>
                {morph.settled ? (
                  <g key={`f-${view}`} className="fade">
                    {b.furniture}
                  </g>
                ) : null}
                {data.map((d, i) => (
                  <MorphMark
                    key={d.label}
                    d={ptsPath(
                      morph.settled
                        ? b.marks[i]
                        : blendPts(a.marks[i], b.marks[i], e)
                    )}
                    dim={hover !== null && hover !== i}
                    fill={tones[i] === 0 ? undefined : paint(tex("hatch"))}
                    i={i}
                    onPointerEnter={() => {
                      setHover(i);
                    }}
                  />
                ))}
                {morph.settled ? (
                  <MorphLabels
                    key={`l-${view}`}
                    labels={b.labels}
                    halo={view === "scatter"}
                  />
                ) : null}
                <PlotNote
                  text={props.note}
                  width={width - 16}
                  x={width / 2}
                  y={h + noteH - 6}
                />
              </svg>
              {tip === undefined || hover === null ? null : (
                <Tooltip x={tip[0]} y={tip[1]}>
                  <b>{data[hover].label}</b> · {format(data[hover].value)} ·{" "}
                  {fx(data[hover].x)} {xName.toLowerCase()} ·{" "}
                  {fy(data[hover].y)}
                </Tooltip>
              )}
            </div>
          );
        }}
      </Plot>
    </div>
  );
};
