import { scaleRadial } from "d3-scale";
import type { ScaleRadial } from "d3-scale";
import { arc, pie } from "d3-shape";
import type { PieArcDatum } from "d3-shape";
import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotRing, Hatch } from "../texture";
import { TEXTURE_PITCH, paint, useTextureIds } from "../texture-ids";
import { dimClass, noteSpace, ranks, sansWidth, stagger } from "../util";
import { bigSliceDemo } from "./big-slice.data";
import type { SliceDatum } from "./big-slice.data";

interface BigSliceProps {
  data?: SliceDatum[];
  height?: number;
  /** Intensity values for the reference rings. */
  rings?: number[];
  /** Labels for the reference rings. */
  ringFormat?: (v: number) => string;
  /** Formats a share (already in percent). */
  formatShare?: (v: number) => string;
  /** Formats an intensity value. */
  format?: (v: number) => string;
  /** Words after the intensity in the tooltip, e.g. "a day". */
  intensityLabel?: string;
  note?: string;
  /** Index of the slice to draw in the hero colour. */
  highlight?: number;
}

interface Tip {
  i: number;
  x: number;
  y: number;
}

interface Wedge {
  endAngle: number;
  outer: number;
  padAngle: number;
  startAngle: number;
}

interface SliceProps {
  centre: { cx: number; cy: number };
  d: SliceDatum;
  fill: string;
  /** Engraved pattern fill; omit for a solid wedge. */
  pattern?: string;
  i: number;
  labelRadius: number;
  narrow: boolean;
  onEnter: (tip: Tip) => void;
  r: ScaleRadial<number, number>;
  shareText: string;
  slice: PieArcDatum<SliceDatum>;
  tip: Tip | null;
  valueText: string;
  wedge: (w: Wedge) => string | null;
}

const pct = (v: number) => `${Math.round(v)}%`;
const minutes = (v: number) => {
  const total = Math.round(v);
  return total < 60
    ? `${total}m`
    : `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
};
const ringHours = (v: number) => `${v / 60}h`;

const TAU = Math.PI * 2;

/** Space between a slice's name and its figures, and the label's offset past the pie. */
const LABEL_SPACE = 6;
const LABEL_OFFSET = 14;

/** Angular distance from 12 o'clock. */
const fromTop = (a: number) => Math.min(a % TAU, TAU - (a % TAU));

/** Runs of consecutive slices (wrapping past 12 o'clock) that pass `keep`. */
const runsOf = (
  slices: PieArcDatum<SliceDatum>[],
  keep: (s: PieArcDatum<SliceDatum>) => boolean
) => {
  const first = slices.findIndex((s) => !keep(s));
  if (first === -1) {
    return null;
  }
  const runs: { a0: number; a1: number }[] = [];
  let run: { a0: number; a1: number } | null = null;
  for (let k = 1; k <= slices.length; k += 1) {
    const slice = slices[(first + k) % slices.length];
    if (keep(slice)) {
      const a0: number = run === null ? slice.startAngle : run.a0;
      // Angles restart at 0 after the last slice; keep the run increasing.
      const lap = slice.startAngle < a0 ? TAU : 0;
      run = { a0, a1: slice.endAngle + lap };
    } else if (run !== null) {
      runs.push(run);
      run = null;
    }
  }
  return runs;
};

/**
 * For a ring clear of every slice: halfway between the two slice labels
 * either side of 12 o'clock, so the ring's value never crowds a name.
 */
const topGap = (slices: PieArcDatum<SliceDatum>[]) => {
  const mids = slices.map((s) => (s.startAngle + s.endAngle) / 2);
  const before = Math.max(...mids);
  const after = Math.min(...mids) + TAU;
  return (before + after) / 2;
};

/**
 * Where a ring's label goes: on the ring, inside a run of slices that stop
 * short of it (clear space, not a wedge), as near 12 o'clock as the run
 * allows so the labels read as one scale. Null when no run has room.
 */
const ringLabelAngle = (
  slices: PieArcDatum<SliceDatum>[],
  r: ScaleRadial<number, number>,
  ring: number,
  labelW: number
): number | null => {
  const radius = r(ring);
  // A slice leaves room if its tip stops a label's half-height short of the ring.
  const runs = runsOf(slices, (s) => r(s.data.intensity) < radius - 7);
  if (runs === null) {
    return topGap(slices);
  }
  const half = (labelW / 2 + 8) / radius;
  let best: number | null = null;
  for (const run of runs) {
    const lo = run.a0 + half;
    const hi = run.a1 - half;
    if (lo > hi) {
      continue;
    }
    const pick =
      lo <= TAU && TAU <= hi
        ? 0
        : [lo, hi].toSorted((a, b) => fromTop(a) - fromTop(b))[0];
    if (best === null || fromTop(pick) < fromTop(best)) {
      best = pick;
    }
  }
  return best;
};

interface RadiusInput {
  bottom: number;
  height: number;
  /** Each slice's outside label: its name and its figures. */
  labels: { figures: string; name: string }[];
  /** Largest intensity on the radial scale. */
  max: number;
  narrow: boolean;
  /** The last reference ring, which labels sit outside of. */
  ring: number;
  slices: PieArcDatum<SliceDatum>[];
  width: number;
}

/** Sine range swept by an arc between two clock angles (0 to 2π). */
const sineSpan = (a0: number, a1: number) => {
  const ends = [Math.sin(a0), Math.sin(a1)];
  return {
    max: a0 <= Math.PI / 2 && a1 >= Math.PI / 2 ? 1 : Math.max(...ends),
    min: a0 <= 1.5 * Math.PI && a1 >= 1.5 * Math.PI ? -1 : Math.min(...ends),
  };
};

/** How far wedges and outside labels reach left and right of the centre of a pie of radius `outer`. */
const reach = (p: RadiusInput, outer: number) => {
  const r = scaleRadial()
    .domain([0, p.max])
    .range([outer * 0.24, outer]);
  const labelRadius = r(p.ring);
  let left = 0;
  let right = 0;
  for (const [k, sl] of p.slices.entries()) {
    const ro = r(sl.data.intensity);
    const span = sineSpan(sl.startAngle, sl.endAngle);
    left = Math.max(left, -span.min * ro);
    right = Math.max(right, span.max * ro);
    const { figures, name } = p.labels[k];
    const text = sansWidth(name, 11) + LABEL_SPACE + sansWidth(figures, 11);
    const x =
      Math.sin((sl.startAngle + sl.endAngle) / 2) *
      (Math.max(ro, labelRadius) + LABEL_OFFSET);
    if (x >= 0) {
      right = Math.max(right, x + text);
    } else {
      left = Math.max(left, -x + text);
    }
  }
  return { left, right };
};

/**
 * The pie's outer radius and where its centre goes: as large as the height
 * allows, and small enough that wedges and every outside label (name, a
 * space, figures) fit the width. The pie and its labels are centred together.
 */
const pieFit = (p: RadiusInput) => {
  const cap = Math.max(
    60,
    Math.min(
      (p.height - p.bottom - 56) / 2,
      (p.width - (p.narrow ? 68 : 300)) / 2
    )
  );
  const fits = (outer: number) => {
    const { left, right } = reach(p, outer);
    // A couple of pixels each side for text measured a little short.
    return left + right + 4 <= p.width;
  };
  let lo = 60;
  let hi = cap;
  if (!fits(hi)) {
    for (let k = 0; k < 20; k += 1) {
      const mid = (lo + hi) / 2;
      if (fits(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    hi = lo;
  }
  const { left, right } = reach(p, hi);
  return { cx: (p.width - left - right) / 2 + left, outer: hi };
};

interface RingLabelProps {
  angle: number | null;
  radius: number;
  text: string;
}

/** Text rotation that runs along the ring at a clock angle, never upside down. */
const tangent = (angle: number) => {
  const deg = (angle * 180) / Math.PI;
  return deg > 90 && deg < 270 ? deg - 180 : deg;
};

/** A ring's value: along the ring in a gap when there is one, else tucked left of 12 o'clock. */
const RingLabel = (p: RingLabelProps) =>
  p.angle === null ? (
    <text
      className="t-note t-halo"
      x={-5}
      y={-p.radius + 3}
      dy="0.7em"
      textAnchor="end"
    >
      {p.text}
    </text>
  ) : (
    <text
      className="t-note t-halo"
      dy="0.35em"
      textAnchor="middle"
      transform={`translate(${Math.sin(p.angle) * p.radius},${-Math.cos(p.angle) * p.radius}) rotate(${tangent(p.angle)})`}
    >
      {p.text}
    </text>
  );

/** One slice: the wedge plus its outside label. */
const Slice = (p: SliceProps) => {
  const ro = p.r(p.d.intensity);
  const mid = (p.slice.startAngle + p.slice.endAngle) / 2;
  const lr = Math.max(ro, p.labelRadius) + LABEL_OFFSET;
  const lx = Math.sin(mid) * lr;
  const ly = -Math.cos(mid) * lr;
  const anchor = Math.sin(mid) >= 0 ? "start" : "end";
  const { cx, cy } = p.centre;
  return (
    <g
      className={dimClass(p.tip !== null && p.tip.i !== p.i)}
      onPointerEnter={() => {
        p.onEnter({
          i: p.i,
          x: cx + Math.sin(mid) * ro * 0.7,
          y: cy - Math.cos(mid) * ro * 0.7 - 8,
        });
      }}
    >
      <path
        className={`pop ${p.fill}`}
        fill={p.pattern}
        strokeWidth={p.pattern === undefined ? undefined : 1}
        style={{
          ...stagger(p.i, "series"),
          transformBox: "view-box",
          transformOrigin: `${cx}px ${cy}px`,
        }}
        d={
          p.wedge({
            endAngle: p.slice.endAngle,
            outer: ro,
            padAngle: p.slice.padAngle,
            startAngle: p.slice.startAngle,
          }) ?? ""
        }
      />
      {/* Narrow: the name keeps its share and drops the duration, never the name. */}
      <text
        className="fade fill-text"
        style={{ "--i": p.i + 3 }}
        x={lx}
        y={ly}
        dy="0.35em"
        textAnchor={anchor}
      >
        <tspan className="t-name">{p.d.label}</tspan>
        <tspan className="t-axis" dx={LABEL_SPACE}>
          {p.narrow ? p.shareText : `${p.shareText} · ${p.valueText}`}
        </tspan>
      </text>
    </g>
  );
};

interface RingGuide {
  /** Where the ring's label sits on it, or null when tucked inside it. */
  angle: number | null;
  /** Half the label's angular width plus a margin, in radians. */
  half: number;
  radius: number;
}

/** Each reference ring: its radius and where its label opens it. */
const ringGuides = (
  rings: number[],
  slices: PieArcDatum<SliceDatum>[],
  r: ScaleRadial<number, number>,
  ringFormat: (v: number) => string
): RingGuide[] =>
  rings.map((v) => {
    const labelW = sansWidth(ringFormat(v), 11);
    return {
      angle: ringLabelAngle(slices, r, v, labelW),
      half: (labelW / 2 + 5) / r(v),
      radius: r(v),
    };
  });

/**
 * The intensity scale: evenly dotted rings in l5, like an engraved guide.
 * A ring opens where its label sits, so no dot shows through the text.
 */
const RingGuides = (p: { rings: RingGuide[] }) => (
  <g>
    {p.rings.map((g) =>
      g.angle === null ? (
        <DotRing
          key={g.radius}
          cx={0}
          cy={0}
          r={g.radius}
          step={TEXTURE_PITCH.dense}
          tone="fill-l5"
        />
      ) : (
        <DotRing
          key={g.radius}
          cx={0}
          cy={0}
          from={g.angle + g.half}
          r={g.radius}
          step={TEXTURE_PITCH.dense}
          to={g.angle - g.half + TAU}
          tone="fill-l5"
        />
      )
    )}
  </g>
);

/**
 * G13 Free time. A pie where the angle is the share and the radius is
 * the intensity. Radius runs on a radial (square-root) scale so slice area
 * stays honest. Evenly dotted 1px rings mark the intensity scale; the most
 * intense slice (or the highlight) is solid ink, the rest hatched on paper
 * inside a 1px outline.
 */
export const BigSlice = (props: BigSliceProps) => {
  const data = props.data ?? bigSliceDemo;
  const height = props.height ?? 400;
  const rings = props.rings ?? [240, 360];
  const fmtShare = props.formatShare ?? pct;
  const format = props.format ?? minutes;
  const ringFormat = props.ringFormat ?? ringHours;
  const [tip, setTip] = useState<Tip | null>(null);
  const rank = ranks(data.map((d) => d.intensity));
  const heroIndex = props.highlight ?? rank.indexOf(0);
  const tex = useTextureIds("slice");
  const total = data.reduce((s, d) => s + d.share, 0);
  const shareOf = (d: SliceDatum) => fmtShare((d.share / total) * 100);
  const label = `Pie: ${data.map((d) => `${d.label} ${shareOf(d)}, ${format(d.intensity)}`).join("; ")}`;
  const suffix =
    props.intensityLabel === undefined ? "" : ` ${props.intensityLabel}`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {shareOf(data[tip.i])} of adults ·{" "}
            {format(data[tip.i].intensity)}
            {suffix}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const narrow = width < 520;
        // Narrow: the name keeps its share and drops the duration.
        const outside = (d: SliceDatum) => ({
          figures: narrow
            ? shareOf(d)
            : `${shareOf(d)} · ${format(d.intensity)}`,
          name: d.label,
        });
        const bottom = 8 + noteSpace(props.note, width - 16, 18);
        const slices = pie<SliceDatum>()
          .value((d) => d.share)
          .sortValues(null)
          .padAngle(0.035)(data);
        const max = Math.max(...data.map((d) => d.intensity), ...rings);
        const { cx, outer } = pieFit({
          bottom,
          height,
          labels: slices.map((sl) => outside(sl.data)),
          max,
          narrow,
          ring: rings.at(-1) ?? max,
          slices,
          width,
        });
        const inner = outer * 0.24;
        const centre = { cx, cy: 28 + outer };
        // Narrow screens: the pie is width-bound, so trim the unused height.
        const svgH = Math.min(
          height,
          Math.round(centre.cy + outer + 34 + bottom)
        );
        const r = scaleRadial().domain([0, max]).range([inner, outer]);
        const guides = ringGuides(rings, slices, r, ringFormat);
        const wedge = arc<Wedge>()
          .innerRadius(inner)
          .outerRadius((d) => d.outer)
          .cornerRadius(4)
          .padRadius(outer);

        return (
          <svg
            width={width}
            height={svgH}
            aria-label={label}
            onPointerLeave={() => {
              setTip(null);
            }}
          >
            <title>{label}</title>
            <defs>
              <Hatch ground="fill-paper" id={tex("hatch")} tone="fill-l4" />
            </defs>
            <g transform={`translate(${centre.cx},${centre.cy})`}>
              <RingGuides rings={guides} />
              {slices.map((s, i) => (
                <Slice
                  key={s.data.label}
                  centre={centre}
                  d={s.data}
                  fill={heroIndex === i ? "fill-hero" : "stroke-l5"}
                  pattern={heroIndex === i ? undefined : paint(tex("hatch"))}
                  i={i}
                  labelRadius={r(rings.at(-1) ?? max)}
                  narrow={narrow}
                  onEnter={setTip}
                  r={r}
                  shareText={shareOf(s.data)}
                  slice={s}
                  tip={tip}
                  valueText={format(s.data.intensity)}
                  wedge={wedge}
                />
              ))}
              {guides.map((g, k) => (
                <RingLabel
                  key={g.radius}
                  angle={g.angle}
                  radius={g.radius}
                  text={ringFormat(rings[k])}
                />
              ))}
            </g>
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={svgH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
