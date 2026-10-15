import { geoAlbersUsa } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

import { fmtInt } from "../../lib/format";
import { Choropleth } from "./choropleth";
import { usChoroplethDemo, usStates } from "./us-choropleth.data";
import type { StateDatum } from "./us-choropleth.data";

interface USChoroplethProps {
  data?: StateDatum[];
  /** Legend and tooltip text for states with no value. */
  emptyLabel?: string;
  format?: (v: number) => string;
  /** Upper cap on the map height; otherwise the map keeps its own aspect. */
  height?: number;
  /** Postal code(s) printed on the map; defaults to the three states that cut most. */
  highlight?: string | string[];
  note?: string;
  /** Short value for legend and labels, e.g. 96k. */
  short?: (v: number) => string;
  /** Four ascending breaks between the five shades. */
  thresholds?: [number, number, number, number];
  /** Unit after the tooltip value, e.g. "trees". */
  unit?: string;
}

/** Breaks for trees cut: ten thousand, fifty thousand, a quarter of a million, a million. */
const BREAKS: [number, number, number, number] = [
  10_000, 50_000, 250_000, 1_000_000,
];
/** The states printed on the map by default, most trees first. */
const LABELLED = ["OR", "NC", "MI"];
const project = (size: [number, number], outlines: FeatureCollection) =>
  geoAlbersUsa().fitSize(size, outlines);
/** Trees in thousands or millions ("10k", "4.8m"). */
const treesShort = (v: number) =>
  v >= 1_000_000
    ? `${Number((v / 1_000_000).toFixed(1))}m`
    : `${Math.round(v / 1000)}k`;

/**
 * M1 Christmas trees. Real state outlines (Alaska and Hawaii inset lower left),
 * value as a dot screen in five steps, 1px outlines, a hover tooltip
 * and a legend scale that isolates a step.
 */
export const USChoropleth = (props: USChoroplethProps) => {
  const data = props.data ?? usChoroplethDemo;
  const format = props.format ?? fmtInt;
  const rows = useMemo(
    () => data.map((d) => ({ key: d.state, value: d.value })),
    [data]
  );
  const labels =
    props.highlight === undefined ? LABELLED : [props.highlight].flat();
  const top = data
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((d) => `${d.state} ${format(d.value)}`);
  return (
    <Choropleth
      ariaLabel={`Christmas trees cut in 2022 by state, most: ${top.join(", ")}`}
      aspect={0.7}
      data={rows}
      emptyLabel={props.emptyLabel ?? "No data"}
      format={format}
      labels={labels}
      maxHeight={props.height ?? 420}
      note={props.note}
      project={project}
      regions={usStates}
      short={props.short ?? treesShort}
      thresholds={props.thresholds ?? BREAKS}
      unit={props.unit}
    />
  );
};
