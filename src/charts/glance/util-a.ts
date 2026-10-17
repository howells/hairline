import { ranks, sansWidth } from "../util";

const widths = new Map<string, number>();
let probe: SVGTextElement | null = null;

/**
 * Rendered width of `text` in a text role (`t-label`, `t-axis`, ...), read
 * from the page's own Inter. Falls back to the estimate until the font is in
 * (and is not remembered then).
 */
export const textWidth = (text: string, role: string) => {
  const key = `${role}|${text}`;
  const known = widths.get(key);
  if (known !== undefined) {
    return known;
  }
  if (typeof document === "undefined" || document.fonts.status !== "loaded") {
    return sansWidth(text);
  }
  if (probe === null) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.style.cssText =
      "position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none";
    probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
    svg.append(probe);
    document.body.append(svg);
  }
  probe.setAttribute("class", role);
  probe.textContent = text;
  const w = probe.getComputedTextLength();
  widths.set(key, w);
  return w;
};

/** Width of the widest of `labels` in `role`, rounded up: room to reserve beside a plot. */
export const labelRoom = (labels: string[], role = "t-label") =>
  Math.ceil(Math.max(0, ...labels.map((l) => textWidth(l, role))));

/*
 * Importance ladder as Tailwind classes. Written out in full so Tailwind
 * finds every class; index = ladder step (0 = most important). Fills keep to
 * the fill taxonomy's solid tones (fills.ts): step 0 is the ink tone, and the
 * ramp's l1 and l6 fold onto their nearest fill tone.
 */
export const LADDER_FILL = [
  "fill-hero",
  "fill-l2",
  "fill-l2",
  "fill-l3",
  "fill-l4",
  "fill-l5",
  "fill-l5",
];
export const LADDER_STROKE = [
  "stroke-l0",
  "stroke-l1",
  "stroke-l2",
  "stroke-l3",
  "stroke-l4",
  "stroke-l5",
  "stroke-l6",
];

const step = (i: number) => Math.max(0, Math.min(6, Math.round(i)));

/** Fill class for a ladder step, or the hero fill. */
export const fillFor = (i: number, hero = false) =>
  hero ? "fill-hero" : LADDER_FILL[step(i)];

/** Stroke class for a ladder step, or the hero stroke. */
export const strokeFor = (i: number, hero = false) =>
  hero ? "stroke-hero" : LADDER_STROKE[step(i)];

/**
 * Ladder steps by rank: the largest value gets `steps[0]`, the next
 * `steps[1]`, and so on (the last step repeats).
 */
export const rankTones = (values: number[], steps: number[]) =>
  ranks(values).map((rank) => steps[Math.min(steps.length - 1, rank)]);

/** Explicit plus and a true minus sign: +12, −18. */
export const fmtSigned = (v: number) => {
  if (v === 0) {
    return "0";
  }
  return `${v > 0 ? "+" : "−"}${Math.abs(v)}`;
};

/* ---------- Morphable outlines ----------
 * Every outline is the same 64 points (16 per side, clockwise from the
 * top-left), so any two can be blended point by point.
 */

export type Pt = [number, number];

const SIDE = 16;
const ticks = Array.from({ length: SIDE }, (_, k) => k / SIDE);

export const rectPts = (
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Pt[] => [
  ...ticks.map((f): Pt => [x0 + (x1 - x0) * f, y0]),
  ...ticks.map((f): Pt => [x1, y0 + (y1 - y0) * f]),
  ...ticks.map((f): Pt => [x1 - (x1 - x0) * f, y1]),
  ...ticks.map((f): Pt => [x0, y1 - (y1 - y0) * f]),
];

export const circlePts = (cx: number, cy: number, r: number): Pt[] =>
  Array.from({ length: SIDE * 4 }, (_, k): Pt => {
    const a = (-3 * Math.PI) / 4 + (k / (SIDE * 4)) * Math.PI * 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });

/**
 * Annular sector between radii r0 < r1 and angles a0 < a1 (clockwise from
 * 12 o'clock), trimmed by a parallel gap `g` on each radial side.
 */
export const sectorPts = (
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number,
  g: number
): Pt[] => {
  const at = (r: number, a: number): Pt => [
    cx + r * Math.sin(a),
    cy - r * Math.cos(a),
  ];
  const lo = (r: number) => a0 + Math.min(g / r, (a1 - a0) / 2.2);
  const hi = (r: number) => a1 - Math.min(g / r, (a1 - a0) / 2.2);
  return [
    ...ticks.map((f) => at(r1, lo(r1) + (hi(r1) - lo(r1)) * f)),
    ...ticks.map((f) => at(r1 - (r1 - r0) * f, hi(r1 - (r1 - r0) * f))),
    ...ticks.map((f) => at(r0, hi(r0) - (hi(r0) - lo(r0)) * f)),
    ...ticks.map((f) => at(r0 + (r1 - r0) * f, lo(r0 + (r1 - r0) * f))),
  ];
};

export const ptsPath = (pts: Pt[]) =>
  `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("L")}Z`;

export const blendPts = (a: Pt[], b: Pt[], t: number) =>
  a.map((p, k): Pt => [
    p[0] + (b[k][0] - p[0]) * t,
    p[1] + (b[k][1] - p[1]) * t,
  ]);
