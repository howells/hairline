import { isBand } from "../schema/references";
import type {
  Reference,
  ReferenceBand,
  ReferenceLine,
} from "../schema/references";
import { sansWidth } from "./util";

/*
 * What a chart reads from its `references` without drawing them: the values
 * its axis must keep room for, which readings clear a line that asks for
 * ink, and the references as table rows and as words.
 */

export const linesOf = (refs: readonly Reference[] | undefined) =>
  (refs ?? []).filter((r): r is ReferenceLine => !isBand(r));
export const bandsOf = (refs: readonly Reference[] | undefined) =>
  (refs ?? []).filter((r): r is ReferenceBand => isBand(r));

/** Every value the references stand at, so a chart can keep room for them. */
export const referenceValues = (refs: readonly Reference[] | undefined) =>
  (refs ?? []).flatMap((r) =>
    (isBand(r) ? [r.from, r.to] : [r.value]).filter((v) => Number.isFinite(v))
  );

/**
 * Whether a reading clears the line that asks for it: true at or beyond it,
 * false short of it, undefined when no line asks (the marks keep their tones).
 */
export const clears = (
  refs: readonly Reference[] | undefined,
  value: number
): boolean | undefined => {
  const line = linesOf(refs).find((r) => r.emphasis !== undefined);
  if (line === undefined) {
    return undefined;
  }
  return line.emphasis === "above" ? value >= line.value : value <= line.value;
};

/** Whether a reading cleared every line that asked of it, on either axis. */
export const clearsAll = (standing: (boolean | undefined)[]) =>
  standing.every((s) => s === undefined)
    ? undefined
    : standing.every((s) => s !== false);

const nameOf = (ref: Reference) =>
  ref.label ?? (isBand(ref) ? "Reference band" : "Reference line");

const rangeOf = (ref: ReferenceBand, format: (v: number) => string) =>
  `${format(ref.from)} to ${format(ref.to)}`;

/**
 * The references as rows of a chart's data table: the name in the first
 * cell, and the value (a band's two ends) in each of the `values` columns.
 * `axis` names the axis when a chart has two.
 */
export const referenceRows = (
  refs: readonly Reference[] | undefined,
  format: (v: number) => string,
  cells: { axis?: "x" | "y"; columns: number; values: readonly number[] }
) =>
  (refs ?? []).map((ref) => {
    const kind = isBand(ref) ? "Reference band" : "Reference line";
    const axis = cells.axis === undefined ? "" : ` on ${cells.axis}`;
    const row = Array.from({ length: cells.columns }, () => "");
    row[0] = `${kind}${axis}: ${nameOf(ref)}`;
    for (const column of cells.values) {
      row[column] = isBand(ref) ? rangeOf(ref, format) : format(ref.value);
    }
    return row;
  });

/** The references in words, for a chart's description; empty when there are none. */
export const referenceDesc = (
  refs: readonly Reference[] | undefined,
  format: (v: number) => string,
  axis?: "x" | "y"
) => {
  const on = axis === undefined ? "" : ` on ${axis}`;
  const parts = (refs ?? []).map((ref) => {
    if (isBand(ref)) {
      return `${nameOf(ref)}${on}, ${rangeOf(ref, format)}`;
    }
    const ink =
      ref.emphasis === undefined
        ? ""
        : `; readings ${ref.emphasis === "above" ? "at or above" : "at or below"} it are in ink`;
    return `${nameOf(ref)}${on}, ${format(ref.value)}${ink}`;
  });
  return parts.length === 0 ? "" : `${parts.join(". ")}.`;
};

/** A point a reference label should keep clear of: a dot, or the line's own end value. */
export interface Spot {
  x: number;
  y: number;
}

/** A label's plate in px: its left edge, top edge and size. */
export interface Plate {
  h: number;
  left: number;
  top: number;
  w: number;
}

/** How far a spot is from a plate: 0 on or inside it. */
export const gapTo = (plate: Plate, spot: Spot) =>
  Math.hypot(
    Math.max(plate.left - spot.x, 0, spot.x - (plate.left + plate.w)),
    Math.max(plate.top - spot.y, 0, spot.y - (plate.top + plate.h))
  );

/** How far a plate stands from the nearest spot to avoid, px; Infinity with none. */
export const clearance = (plate: Plate, avoid: readonly Spot[] | undefined) =>
  Math.min(Infinity, ...(avoid ?? []).map((spot) => gapTo(plate, spot)));

/** The clearance a name needs to count as clear of the marks, px. */
export const CLEAR = 3;

/**
 * The candidate plate that stands farthest from every spot to avoid; the
 * first of equals, so the order of `candidates` is the order of preference.
 */
export const clearest = <T extends Plate>(
  candidates: readonly T[],
  avoid: readonly Spot[] | undefined
): T => {
  const score = (plate: T) => clearance(plate, avoid);
  let [best] = candidates;
  for (const plate of candidates) {
    if (score(plate) > score(best)) {
      best = plate;
    }
  }
  return best;
};

/** Room between a plate and the edge it stands against, px. */
export const MARGIN = 4;
/** A plate's height, as PlateLabel sets it, and the width it adds round its text. */
export const PLATE_H = 15;
export const PLATE_PAD = 8;

export const plateWidth = (text: string) =>
  Math.ceil(sansWidth(text, 11)) + PLATE_PAD;

/** Candidate plates along a level line, above and below it, at eighths of its length. */
export const alongLinePlates = (
  width: number,
  y: number,
  across: { hi: number; lo: number }
): Plate[] => {
  const room = across.hi - across.lo - 2 * MARGIN - width;
  if (room <= 0) {
    return [];
  }
  return [y - 3 - PLATE_H, y + 3].flatMap((top) =>
    Array.from({ length: 9 }, (_, k) => ({
      h: PLATE_H,
      left: Math.round(across.lo + MARGIN + (room * k) / 8),
      top,
      w: width,
    }))
  );
};

/** Candidate plates for a band's name along a level axis: inside the band, at its ends. */
export const levelBandPlates = (
  width: number,
  band: { end: number; start: number },
  across: { hi: number; lo: number }
): Plate[] => {
  const room = band.end - band.start;
  const tops =
    room >= PLATE_H + 6
      ? [
          (band.start + band.end) / 2 - PLATE_H / 2,
          band.start + 3,
          band.end - 3 - PLATE_H,
        ]
      : [(band.start + band.end) / 2 - PLATE_H / 2];
  return tops.flatMap((top) =>
    [across.hi - MARGIN - width, across.lo + MARGIN].map((left) => ({
      h: PLATE_H,
      left,
      top,
      w: width,
    }))
  );
};

/** Candidate plates for a target line's name along a level axis: above or below it. */
export const levelLinePlates = (
  width: number,
  y: number,
  across: { hi: number; lo: number },
  at: ReferenceLine["at"]
): Plate[] => {
  const lefts =
    at === "start"
      ? [across.lo + MARGIN]
      : [across.hi - MARGIN - width, across.lo + MARGIN].slice(
          0,
          at === "end" ? 1 : 2
        );
  return [y - 3 - PLATE_H, y + 3].flatMap((top) =>
    lefts.map((left) => ({ h: PLATE_H, left, top, w: width }))
  );
};
