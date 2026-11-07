import { scaleLinear } from "d3-scale";

import type { ValueAxis } from "../schema/daily";

/** One small multiple: its name, its current value as printed, and its own extent. */
export interface FacetPanel {
  /** The panel's own lowest and highest value; the shared scale spans them all. */
  domain: [number, number];
  /** Names the panel and keeps its place when panels are reordered. */
  key: string;
  name: string;
  /** The panel's current value, as it prints in the header. */
  value: string;
}

/** What a panel's chart is drawn with. */
export interface FacetCell {
  /** The value scale to draw on: the shared one, or the panel's own when scales are free. */
  domain: [number, number];
  /** Where the chart prints its value axis: on the left in the first column when the facets have one, else none. */
  axis: ValueAxis;
  /** The hero panel: draw it in ink, and the rest on the ramp. */
  hero: boolean;
  index: number;
  panel: FacetPanel;
  /** Width the chart is drawn at, px; the first column's includes the axis gutter. */
  width: number;
}

/** Gap between panels, px. */
export const FACET_GAP = 24;

/** Narrowest a panel gets before the grid drops a column, px. */
export const FACET_MIN_WIDTH = 240;

/**
 * How many columns fit `width`: as many panels of at least `minWidth` as
 * leave `gap` between them, never more than there are panels, and at least
 * one (a phone gets one column).
 */
export const facetColumns = (
  width: number,
  count: number,
  minWidth = FACET_MIN_WIDTH,
  gap = FACET_GAP
) => Math.max(1, Math.min(count, Math.floor((width + gap) / (minWidth + gap))));

/**
 * The width each panel's plot gets in `columns` columns. A `gutter` (the
 * axis margin of the first column) comes out of the row first, so every plot
 * is this wide and the first column's chart is drawn `gutter` wider.
 */
export const facetWidth = (
  width: number,
  columns: number,
  gap = FACET_GAP,
  gutter = 0
) => Math.floor((width - gap * (columns - 1) - gutter) / columns);

/** A value scale's ends, rounded outward to tick values. */
const nice = (lo: number, hi: number): [number, number] => {
  const [a, b] = scaleLinear().domain([lo, hi]).nice(4).domain();

  return [a, b];
};

/**
 * The scale each panel draws on. Shared: one niced domain across every panel,
 * so equal heights mean equal values. Free: each panel's own, niced.
 */
export const facetDomains = (
  panels: FacetPanel[],
  scale: "free" | "shared"
): [number, number][] => {
  if (scale === "free") {
    return panels.map((p) => nice(...p.domain));
  }

  const shared = nice(
    Math.min(...panels.map((p) => p.domain[0])),
    Math.max(...panels.map((p) => p.domain[1]))
  );

  return panels.map(() => shared);
};

/** The key of the panel reaching highest, the default hero. */
export const highestPanel = (panels: FacetPanel[]) => {
  let [best] = panels;

  for (const p of panels) {
    if (p.domain[1] > best.domain[1]) {
      best = p;
    }
  }

  return best.key;
};
