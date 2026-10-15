// How much side room a chart's labels need, so plots start and end where the
// ink does and the margins hold no spare air.

import { sansWidth } from "../util";

/** The widest label on a value scale, px (tabular figures: a 1 is as wide as a 0). */
export const scaleWidth = (axis: {
  format?: (v: number) => string;
  ticks?: readonly number[];
}) =>
  Math.ceil(
    Math.max(
      0,
      ...(axis.ticks ?? []).map((v) =>
        sansWidth((axis.format ?? String)(v).replaceAll("1", "0"))
      )
    )
  );

/**
 * The widest of some category or series names, px. sansWidth runs a little
 * wide for the medium weight, so it is shaved; `shave` lets a caller whose
 * text is heavier (names with values) keep more of it.
 */
export const nameWidth = (names: readonly string[], shave = 0.92) =>
  Math.ceil(Math.max(0, ...names.map((n) => sansWidth(n))) * shave);

/** Gap between a plot's right edge and the names set beside it, px. */
export const SIDE_GAP = 12;

/** Right margin for labels set beside the plot: their gap and widest name. */
export const sideRoom = (items: readonly { label?: string }[]) =>
  SIDE_GAP + nameWidth(items.map((s) => s.label ?? ""));
