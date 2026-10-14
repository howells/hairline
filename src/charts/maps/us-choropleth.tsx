import { geoAlbersUsa } from "d3-geo";
import type { FeatureCollection } from "geojson";
import { useMemo } from "react";

import { fmtInt } from "../../lib/format";
import { Choropleth } from "./choropleth";
import { usChoroplethDemo, usStates } from "./us-choropleth.data";
import type { StateDatum } from "./us-choropleth.data";

interface USChoroplethProps {
  data?: StateDatum[];
  format?: (v: number) => string;
  /** Upper cap on the map height; otherwise the map keeps its own aspect. */
  height?: number;
  /** Postal code(s) printed on the map; defaults to "CA". */
  highlight?: string | string[];
  note?: string;
  /** Short value for legend and labels, e.g. 96k. */
  short?: (v: number) => string;
  /** Four ascending breaks between the five shades. */
  thresholds?: [number, number, number, number];
  /** Unit after the tooltip value, e.g. "sign-ups". */
  unit?: string;
}

/** Doubling breaks: each step twice the last. */
const BREAKS: [number, number, number, number] = [2000, 4000, 8000, 16_000];
const project = (size: [number, number], outlines: FeatureCollection) =>
  geoAlbersUsa().fitSize(size, outlines);
const kShort = (v: number) => `${Math.round(v / 1000)}k`;

/**
 * M1 States. Real state outlines (Alaska and Hawaii inset lower left),
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
    props.highlight === undefined ? ["CA"] : [props.highlight].flat();
  const top = data
    .toSorted((a, b) => b.value - a.value)
    .slice(0, 5)
    .map((d) => `${d.state} ${format(d.value)}`);
  return (
    <Choropleth
      ariaLabel={`US choropleth, highest: ${top.join(", ")}`}
      aspect={0.7}
      data={rows}
      format={format}
      labels={labels}
      maxHeight={props.height ?? 420}
      note={props.note}
      project={project}
      regions={usStates}
      short={props.short ?? kShort}
      thresholds={props.thresholds ?? BREAKS}
      unit={props.unit}
    />
  );
};
