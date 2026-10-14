import { geoEqualEarth } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

import { fmtInt } from "../../lib/format";
import { Choropleth } from "./choropleth";
import { withoutRemoteIslets, withoutWrappedParts } from "./geo";
import { worldChoroplethDemo, worldCountries } from "./world-choropleth.data";
import type { CountryDatum } from "./world-choropleth.data";

interface WorldChoroplethProps {
  data?: CountryDatum[];
  /** Legend and tooltip text for countries with no value. */
  emptyLabel?: string;
  format?: (v: number) => string;
  /** Upper cap on the map height; otherwise the map keeps its own aspect. */
  height?: number;
  /** Countries (by name) printed on the map, with their code; defaults to five leaders. */
  highlight?: string | string[];
  note?: string;
  short?: (v: number) => string;
  thresholds?: [number, number, number, number];
  unit?: string;
}

const BREAKS: [number, number, number, number] = [5000, 10_000, 25_000, 50_000];
/** Countries printed on the map by default: the four largest markets and Australia. */
const LABELLED = [
  "United States of America",
  "United Kingdom",
  "Germany",
  "India",
  "Australia",
];
const project = (size: [number, number], outlines: FeatureCollection) =>
  geoEqualEarth().fitSize(size, outlines);
const kShort = (v: number) => `${Math.round(v / 1000)}k`;
/**
 * Outlines without far-flung specks (Hawaii would be a stray dot in the
 * Pacific) or slivers thrown across the antimeridian to the map's far edge.
 */
const regions = worldCountries.map((r) =>
  withoutRemoteIslets(withoutWrappedParts(r))
);

/**
 * M2 Countries. Equal Earth projection, value as a dot screen in five
 * steps, unopened markets as bare paper, 1px outlines, a hover tooltip and a
 * legend scale that isolates a step.
 */
export const WorldChoropleth = (props: WorldChoroplethProps) => {
  const data = props.data ?? worldChoroplethDemo;
  const format = props.format ?? fmtInt;
  const rows = useMemo(
    () =>
      data.map((d) => ({
        dx: d.dx,
        dy: d.dy,
        key: d.country,
        label: d.code,
        value: d.value,
      })),
    [data]
  );
  const labels =
    props.highlight === undefined ? LABELLED : [props.highlight].flat();
  const top = data
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((d) => `${d.code ?? d.country} ${format(d.value)}`);
  return (
    <Choropleth
      ariaLabel={`World choropleth, highest: ${top.join(", ")}`}
      aspect={0.46}
      data={rows}
      emptyLabel={props.emptyLabel ?? "Not opened"}
      format={format}
      labels={labels}
      maxHeight={props.height ?? 480}
      note={props.note}
      project={project}
      regions={regions}
      short={props.short ?? kShort}
      thresholds={props.thresholds ?? BREAKS}
      unit={props.unit}
    />
  );
};
