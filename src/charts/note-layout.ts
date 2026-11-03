// React-free. Where the notes on a chart go: each beside the point it
// explains, on the side and at the end that keep clear of the line, of the
// other notes and of the plot's edges. The drawing is in ./notes.tsx.

import { sansWidth } from "./util";

/** Below this width the notes are numbered discs, their words under the chart. */
export const NUMBERED_BELOW = 520;

/** The plot's top when it carries notes: room for a note above the highest point, px. */
export const NOTED_TOP = 66;

/** A note's point on the plot, and its words. */
export interface NotePoint {
  detail?: string;
  label: string;
  x: number;
  y: number;
}

/** The plot's box, and the line the notes keep off (a polyline, in px). */
export interface NoteRoom {
  bottom: number;
  line: readonly { x: number; y: number }[];
  top: number;
  x0: number;
  x1: number;
}

export interface PlacedNote extends NotePoint {
  /** The number on the disc, from 1. */
  n: number;
  /** Which way from the point the note sits. */
  side: "above" | "below";
  /** The text block's anchor: its start, or its end, sits on the leader. */
  anchor: "end" | "start";
  /** The leader's two ends: from the point out to the text. */
  leader: { y0: number; y1: number };
  /** Baselines of the title and the detail. */
  titleY: number;
  detailY: number;
}

/** A rectangle a note takes up. */
interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The gap between a point and its leader, px. */
const POINT_GAP = 5;
/** Leader length, px. */
const LEAD = 18;
/** Line heights of the title and the detail, px. */
const TITLE_H = 14;
const DETAIL_H = 13;
/** Clear space kept around a note, px. */
const CLEAR = 4;
/** Samples along the line are this far apart, px. */
const STEP = 4;
/** A numbered disc's radius, and its gap from the point, px. */
export const DISC_R = 8;
const DISC_GAP = 4;

const overlaps = (a: Box, b: Box, pad: number) =>
  a.x0 < b.x1 + pad &&
  a.x1 > b.x0 - pad &&
  a.y0 < b.y1 + pad &&
  a.y1 > b.y0 - pad;

/** The line sampled every few px, so a steep run is not missed between vertices. */
const sampled = (line: NoteRoom["line"]) =>
  line.flatMap((p, k) => {
    const next = line[k + 1];
    if (next === undefined) {
      return [p];
    }
    const n = Math.max(
      1,
      Math.ceil(Math.hypot(next.x - p.x, next.y - p.y) / STEP)
    );
    return Array.from({ length: n }, (_, i) => ({
      x: p.x + ((next.x - p.x) * i) / n,
      y: p.y + ((next.y - p.y) * i) / n,
    }));
  });

const outside = (b: Box, room: NoteRoom) =>
  b.x0 < room.x0 || b.x1 > room.x1 || b.y0 < room.top || b.y1 > room.bottom;

/** What a candidate position costs: a box off the plot, on the line or on another note. */
const cost = (
  boxes: Box[],
  taken: Box[],
  room: NoteRoom,
  samples: ReturnType<typeof sampled>
) => {
  let total = 0;
  for (const b of boxes) {
    total += outside(b, room) ? 1000 : 0;
    total += taken.some((t) => overlaps(b, t, CLEAR)) ? 500 : 0;
    total +=
      8 *
      samples.filter(
        (p) =>
          p.x > b.x0 - CLEAR &&
          p.x < b.x1 + CLEAR &&
          p.y > b.y0 - CLEAR &&
          p.y < b.y1 + CLEAR
      ).length;
  }
  return total;
};

/** The words' width: the longer of the title and the detail. */
const widthOf = (p: NotePoint) =>
  Math.ceil(
    Math.max(
      sansWidth(p.label, 11) * 1.06,
      p.detail === undefined ? 0 : sansWidth(p.detail, 11)
    )
  );

const textHeight = (p: NotePoint) =>
  TITLE_H + (p.detail === undefined ? 0 : DETAIL_H);

/** One candidate: its boxes (words, then leader) and where the lines go. */
const candidate = (
  p: NotePoint,
  side: PlacedNote["side"],
  anchor: PlacedNote["anchor"]
) => {
  const w = widthOf(p);
  const h = textHeight(p);
  const above = side === "above";
  const near = above ? p.y - POINT_GAP - LEAD : p.y + POINT_GAP + LEAD;
  const y0 = above ? near - h : near;
  const x0 = anchor === "start" ? p.x : p.x - w;
  const words: Box = { x0, x1: x0 + w, y0, y1: y0 + h };
  const leader: Box = {
    x0: p.x - 1,
    x1: p.x + 1,
    y0: Math.min(p.y + (above ? -POINT_GAP : POINT_GAP), near),
    y1: Math.max(p.y + (above ? -POINT_GAP : POINT_GAP), near),
  };
  return {
    boxes: [words, leader],
    placed: {
      anchor,
      detailY: y0 + TITLE_H + DETAIL_H - 3,
      leader: {
        y0: p.y + (above ? -POINT_GAP : POINT_GAP),
        y1: above ? near + 1 : near - 1,
      },
      side,
      titleY: y0 + TITLE_H - 3,
    },
  };
};

const ORDER = [
  ["above", "start"],
  ["above", "end"],
  ["below", "start"],
  ["below", "end"],
] as const;

/**
 * Each note's place, in the order given: above or below its point, its words
 * starting or ending at the leader, whichever costs least (off the plot, on
 * the line or on a note already placed), the first of a tie.
 */
export const placeNotes = (points: readonly NotePoint[], room: NoteRoom) => {
  const samples = sampled(room.line);
  const taken: Box[] = [];
  return points.map((p, k): PlacedNote => {
    const options = ORDER.map(([side, anchor], i) => ({
      ...candidate(p, side, anchor),
      rank: i,
    }));
    const costs = options.map(
      (o) => cost(o.boxes, taken, room, samples) + o.rank * 0.1
    );
    const best = options[costs.indexOf(Math.min(...costs))];
    taken.push(...best.boxes);
    return { ...p, ...best.placed, n: k + 1 };
  });
};

/** A numbered disc's place: above or below its point. */
export interface PlacedDisc extends NotePoint {
  cy: number;
  n: number;
}

/** Phones: each note a disc above or below its point, whichever is clear. */
export const placeDiscs = (points: readonly NotePoint[], room: NoteRoom) => {
  const samples = sampled(room.line);
  const taken: Box[] = [];
  return points.map((p, k): PlacedDisc => {
    const options = [-1, 1].map((dir, rank) => {
      const cy = p.y + dir * (DISC_GAP + DISC_R);
      const disc: Box = {
        x0: p.x - DISC_R,
        x1: p.x + DISC_R,
        y0: cy - DISC_R,
        y1: cy + DISC_R,
      };
      return { cy, disc, rank };
    });
    const costs = options.map(
      (o) => cost([o.disc], taken, room, samples) + o.rank * 0.1
    );
    const best = options[costs.indexOf(Math.min(...costs))];
    taken.push(best.disc);
    return { ...p, cy: best.cy, n: k + 1 };
  });
};
