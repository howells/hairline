import { useState } from "react";

import { Plot, Tooltip } from "../core";
import { Dot, Ring } from "../markers";
import { DOT, RING_STEP } from "../marks";
import type { DotSize } from "../marks";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import { hundredFieldDemo } from "./hundred-field.data";
import type { ShareDatum } from "./hundred-field.data";

interface HundredFieldProps {
  data?: ShareDatum[];
  height?: number;
  /** What one seed stands for, used in the tooltip ("donors"). */
  unit?: string;
  note?: string;
  /** Group drawn in the hero colour. Defaults to the largest. */
  highlight?: string;
}

/** The glyph a group's seeds are engraved with. */
type Glyph = "cross" | "dot" | "ring" | "seed";

interface Seed {
  /** Order out from the centre: the spiral index. */
  k: number;
  x: number;
  y: number;
}

interface Wedge {
  /** Angles clockwise from noon, in radians. */
  from: number;
  glyph: Glyph;
  group: ShareDatum;
  hero: boolean;
  index: number;
  seeds: Seed[];
  to: number;
}

interface Head {
  cx: number;
  cy: number;
  /** Radius of the outermost seed. */
  R: number;
  /** Spiral spacing: seed k sits at c·√(k + ½). */
  c: number;
  wedges: Wedge[];
}

const TURN = 2 * Math.PI;
/** Vogel's golden angle. */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
/** The cuts start this many spiral steps out, leaving the heart open. */
const CUT_FROM = 2.2;
/** Room for a rim label above or below the head: the name over its count. */
const LABEL_H = 30;

/** The non-hero glyphs, in data order. */
const GLYPHS: Glyph[] = ["ring", "dot", "cross"];

interface Polar {
  a: number;
  k: number;
  r: number;
}

/** Candidate cut angles tried within each gap between two wedges. */
const CUT_TRIES = 24;

/**
 * The cut between sorted seeds `e - 1` and `e`: the angle in that gap that
 * keeps the most room between the hairline and the nearest seeds.
 */
const cutAngle = (seeds: Polar[], e: number, from: number) => {
  const n = seeds.length;
  const at = (j: number) => {
    const p = seeds[((j % n) + n) % n];
    const wrap = Math.floor(j / n) * TURN;
    return p === undefined ? undefined : { a: p.a + wrap, r: p.r };
  };
  const lo = at(e - 1)?.a ?? 0;
  const hi = at(e)?.a ?? 0;
  const near = Array.from({ length: 10 }, (_, j) => at(e - 5 + j)).filter(
    (p) => p !== undefined && p.r > from
  );
  let best = { a: (lo + hi) / 2, room: -1 };
  for (let t = 1; t < CUT_TRIES; t += 1) {
    const a = lo + ((hi - lo) * t) / CUT_TRIES;
    const room = Math.min(
      ...near.map((p) => (p?.r ?? 0) * Math.abs(Math.sin(a - (p?.a ?? 0))))
    );
    if (room > best.room) {
      best = { a, room };
    }
  }
  return best.a;
};

/**
 * One sunflower of `total` seeds (Vogel: angle k·golden, radius ∝ √k), cut
 * into contiguous wedges: the seeds are sorted by angle and dealt out in
 * order, so every group owns exactly its count, in one slice.
 */
const sunflower = (
  data: ShareDatum[],
  hero: number,
  frame: { cx: number; cy: number; R: number }
): Head => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const c = frame.R / Math.sqrt(Math.max(1, total));
  const raw = Array.from({ length: total }, (_, k) => ({
    a: (k * GOLDEN) % TURN,
    k,
    r: c * Math.sqrt(k + 0.5),
  })).toSorted((p, q) => p.a - q.a);
  // Turn the head so the cut between the last and first seed sits at noon.
  const spin = TURN - cutAngle(raw, total, c * CUT_FROM);
  const cut = (e: number) => {
    if (e <= 0) {
      return 0;
    }
    return e >= total ? TURN : cutAngle(raw, e, c * CUT_FROM) + spin;
  };
  let start = 0;
  let other = 0;
  const wedges = data.map((group, index): Wedge => {
    const end = start + group.value;
    const seeds = raw.slice(start, end).map((p): Seed => {
      const a = p.a + spin;
      return {
        k: p.k,
        x: Math.round(frame.cx + p.r * Math.sin(a)) + 0.5,
        y: Math.round(frame.cy - p.r * Math.cos(a)) + 0.5,
      };
    });
    const isHero = index === hero;
    const glyph = isHero ? "seed" : (GLYPHS[other % GLYPHS.length] ?? "dot");
    if (!isHero) {
      other += 1;
    }
    const wedge = {
      from: cut(start),
      glyph,
      group,
      hero: isHero,
      index,
      seeds,
      to: cut(end),
    };
    start = end;
    return wedge;
  });
  return { ...frame, c, wedges };
};

/** Dot sizes per glyph: full-size heads, and one step down for tight ones. */
const SIZES: Record<"large" | "small", Record<Glyph, DotSize>> = {
  large: { cross: "sm", dot: "sm", ring: "lg", seed: "lg" },
  small: { cross: "xs", dot: "xs", ring: "md", seed: "md" },
};
/** Below this spiral spacing (px) the seeds step down a size. */
const SMALL_HEAD = 15;

const SeedMark = (props: { glyph: Glyph; seed: Seed; small: boolean }) => {
  const { glyph, seed } = props;
  const size = SIZES[props.small ? "small" : "large"][glyph];
  const style = stagger(seed.k, "dense");
  if (glyph === "cross") {
    // Arms one pixel longer than the dot of the same size, on whole pixels.
    const s = DOT[size] + 1;
    const x = seed.x - 0.5;
    const y = seed.y - 0.5;
    return (
      <g style={style} className="pop fill-l3">
        <rect height={1} width={s * 2 + 1} x={x - s} y={y} />
        <rect height={s * 2 + 1} width={1} x={x} y={y - s} />
      </g>
    );
  }
  if (glyph === "ring") {
    return (
      <Ring
        style={style}
        className="pop stroke-l2"
        cx={seed.x}
        cy={seed.y}
        size={size}
      />
    );
  }
  return (
    <Dot
      style={style}
      className={`pop ${glyph === "seed" ? "fill-hero" : "fill-l3"}`}
      cx={seed.x}
      cy={seed.y}
      size={size}
    />
  );
};

const polar = (head: Head, r: number, a: number) => ({
  x: head.cx + r * Math.sin(a),
  y: head.cy - r * Math.cos(a),
});

/** The wedge's slice from the heart to the labels: its hover target. */
const slicePath = (head: Head, w: Wedge, r: number) => {
  const p = polar(head, r, w.from);
  const q = polar(head, r, w.to);
  const large = w.to - w.from > Math.PI ? 1 : 0;
  return `M${head.cx},${head.cy}L${p.x},${p.y}A${r},${r} 0 ${large} 1 ${q.x},${q.y}Z`;
};

/** Where a wedge's name and count sit, just past the rim. */
const labelAt = (head: Head, w: Wedge) => {
  const mid = (w.from + w.to) / 2;
  const p = polar(head, head.R + head.c * 1.6, mid);
  const sin = Math.sin(mid);
  const cos = Math.cos(mid);
  let anchor: "end" | "middle" | "start" = "middle";
  if (sin > 0.3) {
    anchor = "start";
  } else if (sin < -0.3) {
    anchor = "end";
  }
  // Name baseline: the two-line block hangs above, below or beside the point.
  let y = p.y + 1;
  if (cos > 0.5) {
    y = p.y - 16;
  } else if (cos < -0.5) {
    y = p.y + 11;
  }
  return { anchor, lower: cos < 0, x: p.x, y };
};

const WedgeMarks = ({ head, w }: { head: Head; w: Wedge }) => {
  const label = labelAt(head, w);
  return (
    <>
      <path d={slicePath(head, w, head.R + head.c * 2)} fill="transparent" />
      {w.seeds.map((seed) => (
        <SeedMark
          glyph={w.glyph}
          key={`${w.group.label}-${seed.k}`}
          seed={seed}
          small={head.c < SMALL_HEAD}
        />
      ))}
      <text
        className="fade fill-text"
        style={stagger(w.index + 4, "series")}
        textAnchor={label.anchor}
        x={label.x}
        y={label.y}
      >
        <tspan className={`t-label ${w.hero ? "" : "fill-muted"}`}>
          {w.group.label}
        </tspan>
        <tspan className="t-value" dy={14} x={label.x}>
          {w.group.value}
        </tspan>
      </text>
    </>
  );
};

/** Fine radial hairlines between wedges, and an engraved ring at the rim. */
const Engraving = ({ head }: { head: Head }) => (
  <g className="fade" style={stagger(0, "series")}>
    <DotRing
      cx={head.cx}
      cy={head.cy}
      r={head.R + head.c * 0.8}
      step={RING_STEP.guide}
      tone="fill-l5"
    />
    {head.wedges.map((w) => {
      const p = polar(head, head.c * CUT_FROM, w.from);
      const q = polar(head, head.R + head.c * 0.8, w.from);
      return (
        <line
          className="stroke-l4"
          key={`cut-${w.group.label}`}
          strokeWidth={1}
          x1={p.x}
          x2={q.x}
          y1={p.y}
          y2={q.y}
        />
      );
    })}
  </g>
);

/**
 * L14 A hundred donors. A hundred donors as one engraved seed head: a
 * sunflower of exactly a hundred seeds, cut into contiguous wedges by blood
 * type, each with its own glyph. The largest is the hero, in solid
 * ink seeds.
 */
export const HundredField = (props: HundredFieldProps) => {
  const data = props.data ?? hundredFieldDemo;
  const height = props.height ?? 460;
  const unit = props.unit ?? "donors";
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const [hover, setHover] = useState<number | null>(null);
  const byValue = [...data.keys()].toSorted(
    (a, b) => (data[b]?.value ?? 0) - (data[a]?.value ?? 0)
  );
  const hero =
    props.highlight === undefined
      ? (byValue[0] ?? 0)
      : data.findIndex((d) => d.label === props.highlight);

  return (
    <Plot>
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 24);
        // The wedge angles don't depend on the radius, so a probe head gives
        // the label sides; the head then grows until head and labels fill
        // the width, and the whole is centred.
        const probe = sunflower(data, hero, { R: 100, cx: 0, cy: 0 });
        const spanAt = (r: number) => {
          const c = r / Math.sqrt(Math.max(1, total));
          const rim = r + Math.max(0.8 * c + 2, 7);
          let lo = -rim;
          let hi = rim;
          for (const w of probe.wedges) {
            const mid = (w.from + w.to) / 2;
            const px = (r + c * 1.6) * Math.sin(mid);
            const room = Math.max(
              sansWidth(w.group.label, 11),
              sansWidth(String(w.group.value), 11)
            );
            if (Math.sin(mid) > 0.3) {
              hi = Math.max(hi, px + room);
            } else if (Math.sin(mid) < -0.3) {
              lo = Math.min(lo, px - room);
            } else {
              lo = Math.min(lo, px - room / 2);
              hi = Math.max(hi, px + room / 2);
            }
          }
          return { hi, lo };
        };
        let R = Math.max(40, (height - noteH - 2 * LABEL_H) / 2 - 12);
        while (R > 40 && spanAt(R).hi - spanAt(R).lo > width) {
          R -= 1;
        }
        const span = spanAt(R);
        // On narrow screens the head is width-bound: drop the unused height.
        const svgH = Math.min(
          height,
          Math.round(2 * (R + 12 + LABEL_H) + noteH)
        );
        const head = sunflower(data, hero, {
          R,
          cx: Math.round((width - (span.hi - span.lo)) / 2 - span.lo) + 0.5,
          cy: Math.round((svgH - noteH) / 2),
        });
        const tip = hover === null ? undefined : head.wedges[hover];
        const tipAt = tip === undefined ? undefined : labelAt(head, tip);
        return (
          <div className="relative">
            <svg
              aria-label={`${total} ${unit}: ${data.map((d) => `${d.label} ${d.value}`).join(", ")}`}
              height={svgH}
              onPointerLeave={() => {
                setHover(null);
              }}
              width={width}
            >
              <title>A hundred donors by blood type</title>
              <Engraving head={head} />
              {head.wedges.map((w) => (
                <g
                  className={dimClass(hover !== null && hover !== w.index)}
                  key={w.group.label}
                  onPointerEnter={() => {
                    setHover(w.index);
                  }}
                >
                  <WedgeMarks head={head} w={w} />
                </g>
              ))}
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={svgH - 6}
              />
            </svg>
            {tip !== undefined && tipAt !== undefined && (
              <Tooltip
                // Off the head: under a lower label, over an upper one.
                below={tipAt.lower}
                x={tipAt.x}
                y={tipAt.lower ? tipAt.y + 18 : tipAt.y - 12}
              >
                <b>{tip.group.label}</b> · {tip.group.value} of {total} {unit}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
