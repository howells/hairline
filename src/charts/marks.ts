/*
 * The mark taxonomy: every point marker, tick and small rule a chart may
 * draw, and its sizes. Like fills.ts, this is the whole list: the Marks sheet
 * at the end of the grid draws it, and charts pick from it rather than
 * typing a radius or a tick length of their own. Marks whose size encodes
 * data (bubbles, dot-heat cells, bar lengths) are not markers and sit
 * outside it.
 */

/**
 * Point markers, by radius in px: the outer edge of the painted mark, so a
 * solid dot and a hollow ring of one size cover the same ground.
 * - xs: secondary marks on dense data, retired or minor events
 * - sm: every point at rest, and the hover dot
 * - md: the hero, the active point, an endpoint, the cursor ring
 * - lg: the hero on a large-format layout with room to spare
 */
export const DOT = { lg: 6, md: 4.5, sm: 3, xs: 2 } as const;

export type DotSize = keyof typeof DOT;

/** A hollow ring's stroke: 1px at rest, 1.5px for the cursor or hover ring. */
export const RING_WEIGHT = { cursor: 1.5, rest: 1 } as const;

export type RingWeight = keyof typeof RING_WEIGHT;

/**
 * Tick lengths in px, all 1px thick: a ruler's one, five and ten (sm, md,
 * lg), and the long dimension mark (xl). Axis ticks are md. A tick centred
 * on its line runs half its length either side.
 */
export const TICK = { lg: 9, md: 6, sm: 4, xl: 14 } as const;

export type TickSize = keyof typeof TICK;

/**
 * The 2px family: hero stems, medians, caps, grips and label ticks. Rest
 * stems are 1px; the hero's stem is 2px.
 */
export const MARK_WEIGHT = 2;
export const STEM = { hero: 2, rest: 1 } as const;

/** The tick beside a label in a column of names: 2px tall, 6px long. */
export const LABEL_TICK = { h: 2, w: 6 } as const;

/** Dot pitch of a dotted ring: 4 for guides and grids, 3 for a ring that marks one point. */
export const RING_STEP = { guide: 4, mark: 3 } as const;

/** Key swatch size, swatch-to-label gap and gap between key entries. */
export const KEY = { entryGap: 16, gap: 6, swatch: 12 } as const;
