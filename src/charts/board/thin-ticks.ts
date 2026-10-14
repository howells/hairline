/**
 * Minimum distance between neighbouring x-axis labels, centre to centre, px.
 * A month label ("Jul 2024") is about 50px wide in the tick type, so labels
 * this far apart keep a little clear space between them.
 */
export const MIN_TICK_GAP = 60;

/** Approximate advance of one tick-type glyph (11px Inter), px. */
export const TICK_CHAR = 6.4;
/** Clear space wanted between short tick labels, px. */
const TICK_PAD = 14;

/** Approximate advance of one label glyph (12px medium), px. */
const LABEL_CHAR = 6.8;
/** Room around a row label: the gap to the plot and a little air, px. */
const LABEL_PAD = 36;

/** A left margin wide enough for the longest row name. */
export const labelRoom = (rows: { name: string }[]) =>
  Math.round(
    Math.max(...rows.map((r) => r.name.length)) * LABEL_CHAR + LABEL_PAD
  );

/** A minimum tick spacing for labels of arbitrary length ("500k", "1,000"). */
export const labelGap = (labels: string[]) =>
  Math.max(0, ...labels.map((l) => l.length)) * TICK_CHAR + TICK_PAD;

/** Whether every kept tick sits at least `gap` px after the one before it. */
const isSpaced = (xs: number[], gap: number) =>
  xs.every((x, i) => i === 0 || x - (xs[i - 1] ?? 0) >= gap);

/**
 * Every k-th tick, with k the smallest step that keeps labels `gap` px
 * apart. Wide plots keep every tick; narrow ones drop alternate labels.
 */
export const thinTicks = <T>(
  ticks: T[],
  x: (tick: T) => number,
  gap = MIN_TICK_GAP
): T[] => {
  for (let step = 1; step < ticks.length; step += 1) {
    const kept = ticks.filter((_, i) => i % step === 0);
    if (isSpaced(kept.map(x), gap)) {
      return kept;
    }
  }
  return ticks.slice(0, 1);
};
