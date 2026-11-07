import { clamp } from "./util";

/** Where the exemplar glyph is drawn: its centre, and the side of the square it fits. */
export interface GlyphBox {
  cx: number;
  cy: number;
  size: number;
}

/** One labelled part of the glyph: the point it names on the glyph, and what it means. */
export interface GlyphPart {
  /** The point on the glyph the leader touches, in the key's pixels. */
  at: readonly [number, number];
  /** What the part encodes: "Orders that month". */
  detail: string;
  /** The part's name: "Petal length". */
  name: string;
}

/** Height of the key, px: room for a 136px glyph, its record's name, and up to four labels. */
export const GLYPH_KEY_HEIGHT = 168;

/** Room round the glyph's box, px. */
export const GLYPH_KEY_PAD = 8;

/** The box a key of `width` draws its glyph in: a square at the left, at most 136px. */
export const glyphBox = (width: number): GlyphBox => {
  const size = clamp(Math.round(width * 0.38), 96, 136);

  return {
    cx: GLYPH_KEY_PAD + size / 2,
    cy: GLYPH_KEY_PAD + size / 2,
    size,
  };
};
