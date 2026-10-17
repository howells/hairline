import { chord } from "d3-chord";
import type { Chord, ChordGroup } from "d3-chord";
import { arc } from "d3-shape";
import { useMemo } from "react";
import type { PointerEvent } from "react";

import { Plot, Tooltip } from "../core";
import { useHover } from "../hooks";
import type { Hover } from "../hooks";
import { DimGroup, TipText } from "../hover";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { Hatch } from "../texture";
import { paint, TEXTURE_PITCH, useTextureIds } from "../texture-ids";
import { sansWidth, stagger, sum } from "../util";
import { sharedWorkDemo } from "./chord-ring.data";
import type { SharedWork } from "./chord-ring.data";

/** Millions of pounds as billions ("£59.2bn"). */
const fmtBn = (v: number) => `£${(v / 1000).toFixed(1)}bn`;

/** Room outside the ring for the horizontal group names. */
const LABEL_ROOM = 66;
/** Thickness of a group's ring segment. */
const RING = 3;
/** Where ribbons and threads meet the ring: just inside its inner edge. */
const GAP = 3;
/** Samples along each thread's curve; enough that 1px reads as one smooth line. */
const SAMPLES = 40;

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

/** The ring's groups, as drawn: the same chord layout the ring uses. */
const layoutOf = (matrix: number[][]) =>
  chord()
    .padAngle(0.035)
    .sortSubgroups((a, b) => b - a)(matrix);

/**
 * The ring's centre across the plot, so that the ring and its names, taken
 * together, sit the same distance from either side.
 */
const centreOf = (data: SharedWork, r: number, width: number) => {
  let lo = -r;
  let hi = r;
  for (const g of layoutOf(data.matrix).groups) {
    const mid = (g.startAngle + g.endAngle) / 2;
    const x = Math.sin(mid) * (r + 12);
    const w = sansWidth(data.teams[g.index], 12);
    const side = anchorAt(mid);
    if (side === "start") {
      hi = Math.max(hi, x + w);
    } else if (side === "end") {
      lo = Math.min(lo, x - w);
    } else {
      lo = Math.min(lo, x - w / 2);
      hi = Math.max(hi, x + w / 2);
    }
  }
  return Math.round((width - (hi - lo)) / 2 - lo);
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
    <Label
      anchor={anchorAt(mid)}
      className="fade"
      dy={dy}
      voice={props.hot ? "value" : "label"}
      x={p.x}
      y={p.y}
    >
      {props.name}
    </Label>
  );
};

const touches = (c: Chord, team: number) =>
  c.source.index === team || c.target.index === team;

/** One pair as drawn: its ribbon and its bundle of threads, built once per size. */
interface Pair {
  chord: Chord;
  key: string;
  ribbon: string;
  threads: { d: string; shift: number }[];
}

/** Every pair's ribbon and threads, and the ring's segments, for one radius. */
const geometryOf = (data: SharedWork, r: number) => {
  const chords = layoutOf(data.matrix);
  const inner = r - RING;
  const most = Math.max(...chords.map((c) => c.source.value));
  const pairs = chords.map((c): Pair => ({
    chord: c,
    key: `${data.teams[c.source.index]}-${data.teams[c.target.index]}`,
    ribbon: ribbonPath(c, inner - GAP),
    threads: shifts(threadCount(c.source.value, most)).map((shift) => ({
      d: threadPath(c, inner - GAP, shift),
      shift,
    })),
  }));
  const segment = arc<ChordGroup>().innerRadius(inner).outerRadius(r);
  return {
    groups: chords.groups.map((g) => ({ d: segment(g) ?? "", group: g })),
    pairs,
  };
};

type Geometry = ReturnType<typeof geometryOf>;

interface RingProps {
  data: SharedWork;
  /** Id of the ink hatch the focused group's ribbons are engraved with. */
  hatch: string;
  focus: number;
  geometry: Geometry;
  hovering: boolean;
  r: number;
}

/**
 * Threads first, the focused group's ribbons over them, then the ring and
 * names. Every pair keeps both its threads and its ribbon mounted; focus only
 * crossfades between them, so moving from group to group never redraws.
 */
const Ring = (props: RingProps) => (
  <g>
    {/* Every other pair as hairline threads on bare paper, under the hero. */}
    <DimGroup dim={props.hovering}>
      {props.geometry.pairs.map((p) => (
        <g
          className="ease-enter transition-opacity"
          key={p.key}
          opacity={touches(p.chord, props.focus) ? 0 : 1}
        >
          {p.threads.map((t) => (
            <path
              className="draw stroke-l4 fill-none"
              d={t.d}
              key={t.shift}
              pathLength={1}
              strokeWidth={1}
            />
          ))}
        </g>
      ))}
    </DimGroup>
    {/* The focused group's ribbons lead: ink hatch on paper, the one fill. */}
    {props.geometry.pairs.map((p) => (
      <g
        className="ease-enter transition-opacity"
        key={p.key}
        opacity={touches(p.chord, props.focus) ? 1 : 0}
      >
        <path
          className="fade stroke-l5"
          d={p.ribbon}
          fill={paint(props.hatch)}
          strokeWidth={1}
        />
      </g>
    ))}
    {props.geometry.groups.map(({ d, group: g }) => (
      <g key={props.data.teams[g.index]}>
        <path
          className={`pop transition-tone ${g.index === props.focus ? "fill-hero" : "fill-l3"}`}
          d={d}
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

/**
 * The group nearest the pointer's angle: inside a segment it is that group,
 * and in the gap between two it is the closer, so the focus never drops out
 * as the pointer crosses from one group to the next.
 */
const teamAt = (geometry: Geometry, angle: number) => {
  const turn = (angle + Math.PI * 2) % (Math.PI * 2);
  const off = (g: ChordGroup) => {
    if (turn >= g.startAngle && turn <= g.endAngle) {
      return 0;
    }
    const d = Math.min(
      Math.abs(turn - g.startAngle),
      Math.abs(turn - g.endAngle)
    );
    return Math.min(d, Math.PI * 2 - d);
  };
  return geometry.groups
    .map(({ group }) => group)
    .toSorted((a, b) => off(a) - off(b))[0];
};

/** The ring at one width: geometry built once per size, focus moved by the pointer. */
const ChordSvg = (props: {
  data: SharedWork;
  hover: Hover<number>;
  totals: number[];
  width: number;
}) => {
  const { data, hover, totals, width } = props;
  const hatch = useTextureIds("exports")("hatch");
  const busiest = totals.indexOf(Math.max(...totals));
  const size = Math.min(width, 460);
  const r = size / 2 - LABEL_ROOM;
  const cx = centreOf(data, r, width);
  const cy = Math.round(size / 2);
  const geometry = useMemo(() => geometryOf(data, r), [data, r]);
  const label = `UK goods exports in 2025 between ${data.teams.length} partners and kinds of goods; ${data.teams[busiest]} is the largest, ${fmtBn(totals[busiest])}`;
  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - box.left - cx;
    const dy = e.clientY - box.top - cy;
    // Over the hub the focus holds, so crossing the middle never flickers.
    if (Math.hypot(dx, dy) < r * 0.45) {
      return;
    }
    const g = teamAt(geometry, Math.atan2(dx, -dy));
    if (g === undefined || g.index === hover.key) {
      return;
    }
    const p = polar(middle(g), r);
    hover.show(g.index, cx + p.x, cy + p.y - 12);
  };
  return (
    <ChartSvg
      className="touch-pan-y"
      height={size}
      label={label}
      leave={hover.clear}
      onPointerMove={onMove}
      width={width}
    >
      <defs>
        <Hatch id={hatch} tone="fill-hero" />
      </defs>
      <g transform={`translate(${cx} ${cy})`}>
        <Ring
          data={data}
          focus={hover.key ?? busiest}
          geometry={geometry}
          hatch={hatch}
          hovering={hover.key !== null}
          r={r}
        />
      </g>
    </ChartSvg>
  );
};

/**
 * O6 Goods exports. Partners and kinds of goods on a thin ring; every pair that trades is
 * tied by a bundle of one to three hairlines through the centre, more
 * threads for more pounds, so the ring reads as an engraved web on paper.
 * The busiest group is the ink hero, its pairs drawn as ribbons in an ink
 * hatch on paper; hovering another group crossfades the hatch to its pairs
 * and dims the threads.
 */
export const ChordRing = (props: { data?: SharedWork }) => {
  const data = props.data ?? sharedWorkDemo;
  const hover = useHover<number>();
  const totals = data.matrix.map((row) => sum(row));
  return (
    <Plot
      overlay={
        hover.at === null ? null : (
          <Tooltip x={hover.at.x} y={hover.at.y}>
            <TipText
              facts={[fmtBn(totals[hover.at.key])]}
              lead={data.teams[hover.at.key]}
            />
          </Tooltip>
        )
      }
    >
      {(width) => (
        <ChordSvg data={data} hover={hover} totals={totals} width={width} />
      )}
    </Plot>
  );
};
