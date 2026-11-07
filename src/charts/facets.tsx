import type { ReactNode } from "react";

import { VALUE_AXIS_LEFT } from "./basics/util-a";
import {
  FACET_GAP,
  facetColumns,
  facetDomains,
  facetWidth,
  highestPanel,
} from "./facet-layout";
import type { FacetCell, FacetPanel } from "./facet-layout";
import { useMeasure } from "./hooks";

interface FacetsProps {
  /** Print the shared scale's values once, in a margin left of the first column, so every plot is the same width. */
  axis?: boolean;
  /** Draws one panel's chart at the cell's width and domain. */
  children: (cell: FacetCell) => ReactNode;
  /** Gap between panels, px. */
  gap?: number;
  /** The panel to draw in ink, by key; null for none. Defaults to the one reaching highest. */
  hero?: string | null;
  /** Side margin the chart keeps, px: headers sit in line with the plot's rules. Defaults to 0. */
  inset?: number;
  /** Names the group for screen readers. */
  label: string;
  /** Narrowest a panel gets before the grid drops a column, px. Defaults to 240. */
  minWidth?: number;
  panels: FacetPanel[];
  /** "shared" (default): every panel on one scale. "free": each on its own, and labelled so. */
  scale?: "free" | "shared";
  /** Fixed mode: lay out at exactly this width and measure nothing. */
  width?: number;
}

const Header = (props: {
  hero: boolean;
  left: number;
  panel: FacetPanel;
  right: number;
}) => (
  <div
    className="text-tick mb-2 flex items-baseline justify-between gap-3"
    style={{ paddingLeft: props.left, paddingRight: props.right }}
  >
    <span className={`font-medium ${props.hero ? "text-ink" : "text-muted"}`}>
      {props.panel.name}
    </span>
    <span
      className={`tabular-nums ${props.hero ? "text-ink font-semibold" : "text-muted"}`}
    >
      {props.panel.value}
    </span>
  </div>
);

/**
 * Small multiples on one scale: the same chart once per panel in a responsive
 * grid (as many columns as fit `minWidth`, one on a phone). The value scale
 * is shared by default, so equal heights mean equal values; free it and each
 * panel fills its own box, and a note says so. Each header carries the panel's
 * name and current value; the hero panel is in ink, the rest on the ramp, and
 * gridline values print once, in a margin left of the first column (`axis`), so every plot is the same width.
 *
 * It lays out and measures; the chart is the caller's: `children` gets the
 * width and domain and draws, passing the domain on as the chart's own scale
 * (HairlineArea and HairlineLine `domain`, RungBars `max`) and `hero` as its
 * emphasis. Not a typed JSON chart: a render function cannot be a payload.
 */
export const Facets = (props: FacetsProps) => {
  const [ref, measured] = useMeasure<HTMLDivElement>(
    props.width ?? 0,
    props.width === undefined
  );

  const width = props.width ?? measured;
  const gap = props.gap ?? FACET_GAP;
  const scale = props.scale ?? "shared";
  const { panels } = props;
  const columns = facetColumns(width, panels.length, props.minWidth, gap);
  const domains = facetDomains(panels, scale);
  const hero = props.hero === undefined ? highestPanel(panels) : props.hero;
  const gutter = props.axis === true ? VALUE_AXIS_LEFT : 0;
  const inset = props.inset ?? 0;
  const plot = facetWidth(width, columns, gap, gutter);

  return (
    <section aria-label={props.label} ref={ref}>
      {width > 0 && panels.length > 0 ? (
        <div
          className="grid"
          style={{
            columnGap: gap,
            gridTemplateColumns: `${plot + gutter}px repeat(${columns - 1}, ${plot}px)`,
            rowGap: gap,
          }}
        >
          {panels.map((panel, index) => {
            const first = index % columns === 0;
            const room = first ? gutter : 0;

            return (
              <div className="min-w-0" key={panel.key}>
                <Header
                  hero={panel.key === hero}
                  left={inset + room}
                  panel={panel}
                  right={inset}
                />
                {props.children({
                  axis: first && gutter > 0 ? "left" : "none",
                  domain: domains[index],
                  hero: panel.key === hero,
                  index,
                  panel,
                  width: plot + room,
                })}
              </div>
            );
          })}
        </div>
      ) : null}
      {scale === "free" && width > 0 ? (
        <p className="text-tick text-muted mt-4">Each panel on its own scale</p>
      ) : null}
    </section>
  );
};
