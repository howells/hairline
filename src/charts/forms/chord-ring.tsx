import { chord } from "d3-chord";
import type { Chord, ChordGroup } from "d3-chord";
import { arc } from "d3-shape";
import { useState } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { Hatch } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { dimClass, stagger, sum } from "../util";
import { sharedWorkDemo } from "./chord-ring.data";
import type { SharedWork } from "./chord-ring.data";

/** Room outside the ring for the horizontal team names. */
const LABEL_ROOM = 66;
/** Thickness of a team's ring segment. */
const RING = 3;
/** Where ribbons and threads meet the ring: just inside its inner edge. */
const GAP = 3;
/** Samples along each thread's curve; enough that 1px reads as one smooth line. */
const SAMPLES = 40;

interface Hover {
  team: number;
  x: number;
  y: number;
}

/** A point on the ring; angles run clockwise from twelve o'clock. */
const polar = (angle: number, r: number) => ({
  x: Math.sin(angle) * r,
  y: -Math.cos(angle) * r,
});

/** SVG large-arc flag for an arc from `a` to `b`. */
const sweep = (a: number, b: number) => (b - a > Math.PI ? 1 : 0);

/**
 * A ribbon between two stretches of the ring: along the source arc, a
 * quadratic through the centre to the target, along it, and back.
 */
const ribbonPath = (c: Chord, r: number) => {
  const s0 = polar(c.source.startAngle, r);
  const s1 = polar(c.source.endAngle, r);
  const t0 = polar(c.target.startAngle, r);
  const t1 = polar(c.target.endAngle, r);
  return [
    `M${s0.x} ${s0.y}`,
    `A${r} ${r} 0 ${sweep(c.source.startAngle, c.source.endAngle)} 1 ${s1.x} ${s1.y}`,
    `Q0 0 ${t0.x} ${t0.y}`,
    `A${r} ${r} 0 ${sweep(c.target.startAngle, c.target.endAngle)} 1 ${t1.x} ${t1.y}`,
    `Q0 0 ${s0.x} ${s0.y}Z`,
  ].join("");
};

/** The middle of one end of a chord, as an angle. */
const middle = (g: { endAngle: number; startAngle: number }) =>
  (g.startAngle + g.endAngle) / 2;

/**
 * One thread of a bundle: the ribbon's centre line (a quadratic from end to
 * end, pulled through the centre), offset by `shift` px along its own normal
 * so the threads of a bundle run parallel, a whole pitch apart, end to end.
 */
const threadPath = (c: Chord, r: number, shift: number) => {
  const p = polar(middle(c.source), r);
  const q = polar(middle(c.target), r);
  const points = Array.from({ length: SAMPLES + 1 }, (_, k) => {
    const t = k / SAMPLES;
    // B(t) = (1-t)²P + t²Q, the control point being the centre.
    const bx = (1 - t) ** 2 * p.x + t ** 2 * q.x;
    const by = (1 - t) ** 2 * p.y + t ** 2 * q.y;
    const dx = 2 * t * q.x - 2 * (1 - t) * p.x;
    const dy = 2 * t * q.y - 2 * (1 - t) * p.y;
    const len = Math.hypot(dx, dy);
    return {
      x: bx - (dy / len) * shift,
      y: by + (dx / len) * shift,
    };
  });
  return points
    .map(
      (pt, k) => `${k === 0 ? "M" : "L"}${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`
    )
    .join("");
};

/** Threads in a pair's bundle: one for each third of the busiest pair's count it reaches. */
const threadCount = (value: number, most: number) =>
  Math.min(3, Math.ceil((value / most) * 3));

/** Each thread's offset from the bundle's centre line, a whole pitch apart. */
const shifts = (n: number) =>
  Array.from({ length: n }, (_, k) => (k - (n - 1) / 2) * TEXTURE_PITCH.dense);

const anchorAt = (angle: number) => {
  const s = Math.sin(angle);
  if (Math.abs(s) < 0.15) {
    return "middle";
  }
  return s > 0 ? "start" : "end";
};

/** Names sit just outside the ring, set horizontally, hugging their side. */
const TeamLabel = (props: {
  group: ChordGroup;
  hot: boolean;
  name: string;
  r: number;
}) => {
  const mid = (props.group.startAngle + props.group.endAngle) / 2;
  const p = polar(mid, props.r + 12);
  const c = Math.cos(mid);
  let dy = "0.34em";
  if (c > 0.85) {
    dy = "0";
  } else if (c < -0.85) {
    dy = "0.71em";
  }
  return (
    <text
      className={`fade ${props.hot ? "t-value" : "t-label"}`}
      dy={dy}
      textAnchor={anchorAt(mid)}
      x={p.x}
      y={p.y}
    >
      {props.name}
    </text>
  );
};

const touches = (c: Chord, team: number) =>
  c.source.index === team || c.target.index === team;

interface RingProps {
  data: SharedWork;
  /** Id of the ink hatch the focused team's ribbons are engraved with. */
  hatch: string;
  focus: number;
  hover: number | null;
  r: number;
}

/** Threads first, the focused team's ribbons over them, then the ring and names. */
const Ring = (props: RingProps) => {
  const chords = chord()
    .padAngle(0.035)
    .sortSubgroups((a, b) => b - a)(props.data.matrix);
  const inner = props.r - RING;
  const mine = chords.filter((c) => touches(c, props.focus));
  const others = chords.filter((c) => !touches(c, props.focus));
  const most = Math.max(...chords.map((c) => c.source.value));
  const segment = arc<ChordGroup>().innerRadius(inner).outerRadius(props.r);
  return (
    <g>
      {/* Every other pair as hairline threads on bare paper, under the hero. */}
      <g className={dimClass(props.hover !== null)}>
        {others.flatMap((c) => {
          const key = `${props.data.teams[c.source.index]}-${props.data.teams[c.target.index]}`;
          return shifts(threadCount(c.source.value, most)).map((shift) => (
            <path
              className="draw stroke-l4 fill-none"
              d={threadPath(c, inner - GAP, shift)}
              key={`${key}-${shift}`}
              pathLength={1}
              strokeWidth={1}
            />
          ));
        })}
      </g>
      {/* The focused team's ribbons lead: ink hatch on paper, the one fill. */}
      {mine.map((c) => (
        <path
          className="fade stroke-l5"
          d={ribbonPath(c, inner - GAP)}
          fill={paint(props.hatch)}
          key={`${props.data.teams[c.source.index]}-${props.data.teams[c.target.index]}`}
          strokeWidth={1}
        />
      ))}
      {chords.groups.map((g) => (
        <g key={props.data.teams[g.index]}>
          <path
            className={`pop transition-colors ${g.index === props.focus ? "fill-hero" : "fill-l3"}`}
            d={segment(g) ?? ""}
            style={stagger(g.index, "mark")}
          />
          <TeamLabel
            group={g}
            hot={g.index === props.focus}
            name={props.data.teams[g.index]}
            r={props.r}
          />
        </g>
      ))}
    </g>
  );
};

/** The team whose ring segment spans the pointer's angle, if any. */
const teamAt = (data: SharedWork, angle: number) => {
  const { groups } = chord().padAngle(0.035)(data.matrix);
  const turn = (angle + Math.PI * 2) % (Math.PI * 2);
  return groups.find((g) => turn >= g.startAngle && turn <= g.endAngle);
};

/**
 * O6 Shared work. Teams on a thin ring; every pair that shared projects is
 * tied by a bundle of one to three hairlines through the centre, more
 * threads for more projects, so the ring reads as an engraved web on paper.
 * The busiest team is the ink hero, its pairs drawn as ribbons in an ink
 * hatch on paper; hovering another team moves the hatch to its pairs and
 * dims the threads.
 */
export const ChordRing = (props: { data?: SharedWork }) => {
  const data = props.data ?? sharedWorkDemo;
  const [hover, setHover] = useState<Hover | null>(null);
  const hatch = useTextureIds("shared")("hatch");
  const totals = data.matrix.map((row) => sum(row));
  const busiest = totals.indexOf(Math.max(...totals));
  const focus = hover?.team ?? busiest;
  return (
    <Plot
      overlay={
        hover === null ? null : (
          <Tooltip x={hover.x} y={hover.y}>
            <b>{data.teams[hover.team]}</b> · {totals[hover.team]} shared
            projects
          </Tooltip>
        )
      }
    >
      {(width) => {
        const size = Math.min(width, 460);
        const r = size / 2 - LABEL_ROOM;
        const cx = Math.round(width / 2);
        const cy = Math.round(size / 2);
        const label = `Projects shared between ${data.teams.length} teams in 2026; ${data.teams[busiest]} shared the most, ${totals[busiest]}`;
        const onMove = (e: PointerEvent<SVGSVGElement>) => {
          const box = e.currentTarget.getBoundingClientRect();
          const dx = e.clientX - box.left - cx;
          const dy = e.clientY - box.top - cy;
          const g = teamAt(data, Math.atan2(dx, -dy));
          if (g === undefined || Math.hypot(dx, dy) < r * 0.45) {
            setHover(null);
            return;
          }
          const mid = (g.startAngle + g.endAngle) / 2;
          const p = polar(mid, r);
          setHover({ team: g.index, x: cx + p.x, y: cy + p.y - 12 });
        };
        return (
          <svg
            aria-label={label}
            className="touch-pan-y"
            height={size}
            onPointerLeave={() => {
              setHover(null);
            }}
            onPointerMove={onMove}
            width={width}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={hatch} tone="fill-hero" />
            </defs>
            <g transform={`translate(${cx} ${cy})`}>
              <Ring
                data={data}
                hatch={hatch}
                focus={focus}
                hover={hover?.team ?? null}
                r={r}
              />
            </g>
          </svg>
        );
      }}
    </Plot>
  );
};
