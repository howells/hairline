import type { CSSProperties } from "react";

interface Point {
  x: number;
  y: number;
}

/** Pitch between a bundle's hairlines, px. */
const LINE_PITCH = 2;

/** The unit normal to the left of the direction a → b. */
const normal = (a: Point, b: Point): Point => {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
};

const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

/**
 * A quadratic curve p0 → q → p2 moved sideways by `d` px: each end slides
 * along its own tangent's normal and the control point sits where the two
 * moved tangents meet, so parallel strands keep an even gap along the curve.
 */
const offsetCurve = (p0: Point, q: Point, p2: Point, d: number) => {
  const n0 = normal(p0, q);
  const n2 = normal(q, p2);
  const a = { x: q.x - p0.x, y: q.y - p0.y };
  const b = { x: p2.x - q.x, y: p2.y - q.y };
  const s0 = { x: p0.x + d * n0.x, y: p0.y + d * n0.y };
  const s2 = { x: p2.x + d * n2.x, y: p2.y + d * n2.y };
  const denom = cross(a, b);
  const t =
    Math.abs(denom) < 1e-6
      ? 0.5
      : cross({ x: s2.x - s0.x, y: s2.y - s0.y }, b) / denom;
  const c =
    Math.abs(denom) < 1e-6
      ? { x: q.x + d * n0.x, y: q.y + d * n0.y }
      : { x: s0.x + a.x * t, y: s0.y + a.y * t };
  return `M${s0.x},${s0.y}Q${c.x},${c.y} ${s2.x},${s2.y}`;
};

interface LinkBundleProps {
  /** Tone, motion and hover classes for the strands, e.g. "stroke-l4 draw". */
  className: string;
  /** Number of hairlines, 1–4: the link's weight. */
  lines: number;
  /** Control point of a bowed link; omit for a straight one. */
  q?: Point;
  s: Point;
  style?: CSSProperties;
  t: Point;
}

/**
 * A link engraved as a bundle of 1px hairlines at a 2px pitch, centred on
 * the link's path; the number of strands carries its weight.
 */
export const LinkBundle = (props: LinkBundleProps) => {
  const q = props.q ?? {
    x: (props.s.x + props.t.x) / 2,
    y: (props.s.y + props.t.y) / 2,
  };
  const offsets = Array.from(
    { length: props.lines },
    (_, k) => (k - (props.lines - 1) / 2) * LINE_PITCH
  );
  return (
    <g className={props.className} fill="none" style={props.style}>
      {offsets.map((d) => (
        <path
          key={d}
          d={offsetCurve(props.s, q, props.t, d)}
          pathLength={1}
          strokeWidth={1}
        />
      ))}
    </g>
  );
};
