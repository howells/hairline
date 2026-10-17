/*
 * The role classes every chart draws with: text voices, rules, the cursor,
 * outlines and lines. A chart names a role rather than spelling its classes.
 * PANEL is the board's card; board colours resolve only inside a
 * `.surface-board` container.
 */

/** The panel each board chart sits in. */
export const PANEL =
  "relative min-w-0 rounded-xs bg-panel px-2 py-3 font-sans [&_svg]:block [&_svg]:overflow-visible [&_svg]:select-none [&_svg:focus]:outline-none [&_svg:focus-visible]:outline-1 [&_svg:focus-visible]:outline-offset-4 [&_svg:focus-visible]:outline-muted [&_svg:focus-visible]:outline-solid";

/** Ticks, scale labels and small secondary labels (the axis role). */
export const TICK = "t-axis";
/** The tick under the cursor, one step stronger. */
export const TICK_STRONG = "t-axis fill-text";
/** Category and series names. */
export const LABEL = "text-tick font-medium";
/** Data values (the value role). */
export const VALUE = "t-value";
/** The one big figure, when a chart has one. */
export const VALUE_LG = "t-value-lg";
/** A small heading over an HTML block, in the axis voice. */
export const CAPTION = "text-tick text-muted";

/** Gridlines: solid 1px hairlines, snapped. */
export const GRID_H = "grid-line";
export const GRID_V = "grid-line";
/** Baselines and zero rules. */
export const RULE_ZERO = "hairline";
/** A limit or plan line: the one dash, because it marks a target. */
export const RULE_TARGET = "stroke-l3 dash-rule shape-crisp";
/** The scrub cursor: a solid hairline. */
export const CURSOR = "stroke-faint shape-crisp";
/** The 1px rule around every textured fill. */
export const OUTLINE = "fill-none stroke-l5 shape-crisp";

export const LINE = "fill-none stroke-medium cap-round";
/** Cursor dots sit on the cursor (no glide) and recolour across a threshold. */
export const DOT = "transition-tone";
/** Scatter points swell on hover. */
export const POINT = "transition-radius";
/** Bars recolour as the cursor passes them. */
export const MARK = "transition-colors";
