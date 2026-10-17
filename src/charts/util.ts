import type { CSSProperties } from "react";

import { mulberry32 } from "../lib/random";
import type { StaggerTier } from "./motion";

/*
 * Helpers shared by every editorial family. Family-specific geometry stays
 * in each family's util-*.ts; anything two families need lives here.
 */

/** Join class names, skipping the empty and the switched-off. */
export const cx = (...names: (false | null | string | undefined)[]): string =>
  names
    .filter(
      (n): n is string =>
        n !== false && n !== null && n !== undefined && n !== ""
    )
    .join(" ");

export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v));

export const sum = (values: readonly number[]): number => {
  let total = 0;
  for (const v of values) {
    total += v;
  }
  return total;
};

/**
 * The 7-day mean of a daily series, always over a full week: centred on each
 * day, or trailing (the week ending on it). At the ends the window slides in
 * rather than shrinking, so the line never lurches.
 */
export const weeklyMean = (
  values: readonly number[],
  align: "centred" | "trailing" = "centred"
) =>
  values.map((_, i) => {
    const start = align === "centred" ? i - 3 : i - 6;
    const lo = clamp(start, 0, Math.max(0, values.length - 7));
    const week = values.slice(lo, lo + 7);
    return sum(week) / week.length;
  });

/** True when an optional string has content (a note, a label). */
export const hasText = (s: string | undefined): s is string =>
  s !== undefined && s !== "";

/**
 * Entry-animation order: `i` places the mark in its group, `tier` sets the
 * step between neighbours (a --stagger-* token). Without a tier each motion
 * utility uses its own default.
 */
export const stagger = (i: number, tier?: StaggerTier): CSSProperties =>
  tier === undefined
    ? { "--i": i }
    : { "--i": i, "--stagger": `var(--stagger-${tier})` };

/**
 * The default hover: the hovered record stays, the rest drop to 30%.
 * Put it on every hoverable record group, dimmed or not, so it transitions.
 */
export const dimClass = (dim: boolean): string =>
  dim ? "opacity-30 transition-opacity" : "transition-opacity";

/** Rank of each value, 0 = largest (or smallest when `ascending`). */
export const ranks = (values: readonly number[], ascending = false) => {
  const order = values
    .map((v, i) => ({ i, v }))
    .toSorted((a, b) => (ascending ? a.v - b.v : b.v - a.v));
  const out = values.map(() => 0);
  for (const [r, entry] of order.entries()) {
    out[entry.i] = r;
  }
  return out;
};

/* ---------- In-plot unit footnote (`t-axis`) ---------- */

/** Line pitch of a wrapped footnote (measured with sansWidth, below). */
export const NOTE_LINE = 12;

/** Deterministic normal samples (Box–Muller over mulberry32), for demo data. */
export const normals = (
  seed: number,
  n: number,
  mean: number,
  sd: number
): number[] => {
  const uniform = mulberry32(seed);
  return Array.from({ length: n }, () => {
    const u = Math.max(1e-9, uniform());
    const v = uniform();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  });
};

/* ---------- Label measuring ---------- */

const SANS_NARROW = new Set(" !',.:;Iijl|·’");
const SANS_SLIM = new Set("()/1[]frt");
const SANS_WIDE = new Set("mw");
const SANS_WIDEST = new Set("%@MW—…");

/** Em advance of one Inter glyph, bucketed from measurements (rounded up). */
const sansEm = (ch: string) => {
  if (SANS_NARROW.has(ch)) {
    return 0.3;
  }
  if (SANS_SLIM.has(ch)) {
    return 0.41;
  }
  if (SANS_WIDE.has(ch)) {
    return 0.9;
  }
  if (SANS_WIDEST.has(ch)) {
    return 1.02;
  }
  return ch === ch.toLowerCase() ? 0.63 : 0.76;
};

/**
 * Estimated width of a string in the Inter roles (`t-label`, `t-axis`) at
 * `size` px. Errs slightly wide, so a label that "fits" really does.
 */
export const sansWidth = (text: string, size = 11) => {
  let em = 0;
  for (const ch of text) {
    em += sansEm(ch);
  }
  return em * size;
};

/** `t-axis` is set at 11px. */
const NOTE_SIZE = 11;

/**
 * Breaks a " · "-separated footnote into lines that fit `width`. Returns no
 * lines (the note hides) when there is no text or when even one segment is
 * wider than the room: a clipped footnote is worse than none.
 */
export const noteLines = (text: string | undefined, width: number) => {
  if (!hasText(text)) {
    return [];
  }
  const parts = text.split(" · ");
  if (parts.some((part) => sansWidth(part, NOTE_SIZE) > width)) {
    return [];
  }
  const lines: string[] = [];
  for (const part of parts) {
    const last = lines.at(-1);
    if (
      last !== undefined &&
      sansWidth(`${last} · ${part}`, NOTE_SIZE) <= width
    ) {
      lines[lines.length - 1] = `${last} · ${part}`;
    } else {
      lines.push(part);
    }
  }
  return lines;
};

/**
 * Vertical room to reserve for a footnote: `room` for its first line (the
 * gap above it included) plus a line pitch per extra line; 0 when it hides.
 */
export const noteSpace = (
  text: string | undefined,
  width: number,
  room: number
) => {
  const n = noteLines(text, width).length;
  return n === 0 ? 0 : room + (n - 1) * NOTE_LINE;
};

/**
 * Greedy word wrap: lines no wider than `width` by `measure`. A single word
 * wider than the room gets a line of its own (it is never split).
 */
export const wrapWords = (
  text: string,
  width: number,
  measure: (s: string) => number
) => {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && measure(`${last} ${word}`) <= width) {
      lines[lines.length - 1] = `${last} ${word}`;
    } else {
      lines.push(word);
    }
  }
  return lines;
};
