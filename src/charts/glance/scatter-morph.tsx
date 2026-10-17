import { scaleLinear } from "d3-scale";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { Control } from "../control";
import { Plot, Tooltip } from "../core";
import { useHover, useReducedMotion, useReveal } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { DURATION, easeTravel } from "../motion";
import { useFrame } from "../playback";
import { FootNote } from "../plot-note";
import { HRule } from "../rules";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, useTextureIds } from "../texture-ids";
import { noteSpace, sansWidth, stagger } from "../util";
import { ControlSlot } from "./control-slot";
import { placeNames } from "./scatter-labels";
import { scatterMorphDemo } from "./scatter-morph.data";
import type { MorphDatum } from "./scatter-morph.data";
import {
  blendPts,
  circlePts,
  labelRoom,
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

const defaultFormat = (v: number) => `${v} km`;
const defaultFx = (v: number) => `${v}°`;
const defaultFy = (v: number) => v.toFixed(2);

const scatterLayout = (c: Ctx): Layout => {
  const yDomain = [
    Math.min(0, ...c.data.map((d) => d.y)),
    Math.max(...c.data.map((d) => d.y)),
  ];
  const yLabels = scaleLinear().domain(yDomain).nice(4).ticks(4).map(c.fy);
  // Names of the scale flush left; the axis note and the plot end flush right.
  const m = {
    bottom: 34,
    left: labelRoom(yLabels, "t-axis") + 8,
    right: 0,
    top: 14,
  };
  const xs = scaleLinear()
    .domain([0, Math.max(...c.data.map((d) => d.x))])
    .nice(4)
    .range([m.left, c.width - m.right - 30]);
  const ys = scaleLinear()
    .domain(yDomain)
    .nice(4)
    .range([c.h - m.bottom, m.top]);
  const maxV = Math.max(...c.data.map((d) => d.value));
  const rad = (v: number) =>
    Math.max(ROUND + 3, (c.narrow ? 18 : 24) * Math.sqrt(v / maxV));
  const furniture = (
    <g>
      {ys.ticks(4).map((v) => (
        <g key={`y${v}`}>
          <HRule
            kind={v === 0 ? "hairline" : "grid"}
            x0={m.left}
            x1={c.width - m.right}
            y={ys(v)}
          />
          <Label anchor="end" dy="0.35em" voice="axis" x={m.left - 8} y={ys(v)}>
            {c.fy(v)}
          </Label>
        </g>
      ))}
      {xs.ticks(4).map((v) => (
        <Label
          anchor="middle"
          key={`x${v}`}
          voice="axis"
          x={xs(v)}
          y={c.h - m.bottom + 18}
        >
          {c.fx(v)}
        </Label>
      ))}
      <Label anchor="end" voice="axis" x={c.width - m.right} y={c.h - 2}>
        {c.xLabel} →
      </Label>
      <Label voice="axis" x={m.left} y={m.top - 6}>
        ↑ {c.yLabel}
      </Label>
    </g>
  );
  return {
    furniture,
    labels: placeNames(c.data, { left: m.left, right: c.width }, (d) => [
      xs(d.x),
      ys(d.y),
      rad(d.value),
    ]),
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

/** Where a morph starts: a settled view, or the pose an earlier morph was cut off at. */
type Pose =
  | { kind: "between"; from: Pose; t: number; to: number }
  | { kind: "view"; view: number };

/** The marks of a pose, given each view's marks. */
const poseMarks = (pose: Pose, marksOf: (view: number) => Pt[][]): Pt[][] => {
  if (pose.kind === "view") {
    return marksOf(pose.view);
  }
  const a = poseMarks(pose.from, marksOf);
  const b = marksOf(pose.to);
  const e = easeTravel(pose.t);
  return a.map((pts, i) => blendPts(pts, b[i], e));
};

/**
 * View cycling: hold, then morph to the next view on the shared frame clock.
 * Picking a view mid-morph sets off from the pose on screen, so the marks
 * turn rather than jump. Paused while hovered; reduced motion jumps straight
 * to the chosen view.
 */
const useMorph = (shown: boolean, reduced: boolean, paused: boolean) => {
  const [start, setStart] = useState<Pose>({ kind: "view", view: 0 });
  const [to, setTo] = useState(0);
  const [t, setT] = useState(1);
  const settled = t >= 1;
  const go = (k: number) => {
    if (k === to) {
      return;
    }
    setStart(
      settled || reduced
        ? { kind: "view", view: to }
        : { from: start, kind: "between", t, to }
    );
    setTo(k);
    setT(reduced ? 1 : 0);
  };
  useFrame(!settled && !reduced, (dt) => {
    setT((cur) => Math.min(1, cur + dt / MORPH));
  });
  const next = (to + 1) % VIEWS.length;
  const idle = shown && !reduced && !paused && settled;
  useEffect(() => {
    let id = 0;
    if (idle) {
      id = window.setTimeout(() => {
        setStart({ kind: "view", view: to });
        setTo(next);
        setT(0);
      }, HOLD);
    }
    return () => {
      window.clearTimeout(id);
    };
  }, [idle, next, to]);
  return { go, settled, start, t, to };
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
  <DimGroup
    className="pop"
    dim={p.dim}
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
  </DimGroup>
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
        <Label
          anchor={l.anchor}
          dy="0.35em"
          halo={halo}
          muted={l.kind === "category"}
          transform={
            l.rotate === undefined || l.rotate === 0
              ? undefined
              : `rotate(${l.rotate} ${l.x} ${l.y})`
          }
          voice={l.kind === "value" ? "value" : "label"}
          x={l.x}
          y={l.y}
        >
          {l.text}
        </Label>
      </g>
    ))}
  </g>
);

/**
 * G9 Largest asteroids. One set of entities that cycles through three views,
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
  const xName = props.xLabel ?? "Inclination";
  const yName = props.yLabel ?? "Eccentricity";
  const wrap = useRef<HTMLDivElement>(null);
  const shown = useReveal(wrap);
  const reduced = useReducedMotion();
  const hover = useHover<number>();
  const morph = useMorph(shown, reduced, hover.key !== null);
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
            yLabel: yName,
          };
          const b = LAYOUTS[view](ctx);
          const marks = morph.settled
            ? b.marks
            : poseMarks(
                {
                  from: morph.start,
                  kind: "between",
                  t: morph.t,
                  to: morph.to,
                },
                (v) => LAYOUTS[VIEWS[v]](ctx).marks
              );
          const tip = hover.key === null ? undefined : b.tips[hover.key];
          return (
            <div className="relative">
              <ChartSvg
                height={h + noteH}
                label={label}
                leave={hover.clear}
                width={width}
              >
                <defs>
                  <Hatch id={tex("hatch")} tone="fill-l3" />
                </defs>
                {morph.settled ? (
                  <g key={`f-${view}`} className="fade">
                    {b.furniture}
                  </g>
                ) : null}
                {data.map((d, i) => (
                  <MorphMark
                    key={d.label}
                    d={ptsPath(marks[i])}
                    dim={hover.dim(i)}
                    fill={tones[i] === 0 ? undefined : paint(tex("hatch"))}
                    i={i}
                    onPointerEnter={hover.enter(i)}
                  />
                ))}
                {morph.settled ? (
                  <MorphLabels
                    key={`l-${view}`}
                    labels={b.labels}
                    halo={view === "scatter"}
                  />
                ) : null}
                <FootNote height={h + noteH} text={props.note} width={width} />
              </ChartSvg>
              {tip === undefined || hover.key === null ? null : (
                <Tooltip x={tip[0]} y={tip[1]}>
                  <TipText
                    facts={[
                      format(data[hover.key].value),
                      `${fx(data[hover.key].x)} ${xName.toLowerCase()}`,
                      `${fy(data[hover.key].y)} ${yName.toLowerCase()}`,
                    ]}
                    lead={data[hover.key].label}
                  />
                </Tooltip>
              )}
            </div>
          );
        }}
      </Plot>
    </div>
  );
};
