import type { geoPath } from "d3-geo";
import { geoArea, geoCentroid, geoDistance } from "d3-geo";
import type { Feature, Polygon, Position } from "geojson";
import { feature } from "topojson-client";

/** One outline on a map: a stable key (postal code, country name), a display name and its geometry. */
export interface Region {
  feature: Feature;
  key: string;
  name: string;
}

type Topology = Parameters<typeof feature>[0];

/** The parts of an imported TopoJSON file this module reads: geometry ids and names. */
interface TopologyJson<K extends string> {
  objects: Record<
    K,
    { geometries: { id?: string; properties: { name: string } }[] }
  >;
  type: string;
}

const isTopology = <T extends { type: string }>(raw: T): raw is T & Topology =>
  raw.type === "Topology";

/** Turn an imported TopoJSON file into keyed regions, checking it is a topology at the boundary. */
export const regionsFrom = <K extends string>(
  raw: TopologyJson<K>,
  object: K,
  keyOf: (id: string, name: string) => string
): Region[] => {
  if (!isTopology(raw)) {
    throw new Error("Expected a TopoJSON topology");
  }
  const { geometries } = raw.objects[object];
  const collection = feature(raw, raw.objects[object]);
  const features =
    collection.type === "FeatureCollection"
      ? collection.features
      : [collection];
  const regions: Region[] = [];
  for (const [i, f] of features.entries()) {
    const id = geometries[i].id ?? "";
    const { name } = geometries[i].properties;
    regions.push({ feature: f, key: keyOf(id, name), name });
  }
  return regions;
};

/** Centroid of the largest polygon, so Alaska or Hawaii don't drag a label off the mainland. */
export const mainCentroid = (
  f: Feature,
  path: ReturnType<typeof geoPath>
): [number, number] => {
  const { geometry } = f;
  if (geometry.type !== "MultiPolygon") {
    return path.centroid(f);
  }
  let best: Polygon | null = null;
  let bestArea = -1;
  for (const coordinates of geometry.coordinates) {
    const polygon: Polygon = { coordinates, type: "Polygon" };
    const area = geoArea(polygon);
    if (area > bestArea) {
      bestArea = area;
      best = polygon;
    }
  }
  return best === null ? path.centroid(f) : path.centroid(best);
};

/** A region's value. `label` overrides the text printed on the map; dx/dy move that label off the region with a leader. */
export interface ChoroplethDatum {
  dx?: number;
  dy?: number;
  key: string;
  label?: string;
  value: number;
}

/** One part of a multi-part region, as a disc on the sphere (degrees). */
interface Part {
  area: number;
  centre: [number, number];
  r: number;
}

const degrees = (rad: number) => (rad * 180) / Math.PI;

const partOf = (coordinates: Position[][]): Part => {
  const polygon: Polygon = { coordinates, type: "Polygon" };
  const centre = geoCentroid(polygon);
  let r = 0;
  for (const p of coordinates[0]) {
    r = Math.max(r, degrees(geoDistance(centre, [p[0], p[1]])));
  }
  return { area: geoArea(polygon), centre, r };
};

/** A lower bound on the distance between two parts, in degrees. */
const partGap = (a: Part, b: Part) =>
  Math.max(0, degrees(geoDistance(a.centre, b.centre)) - a.r - b.r);

/** Groups parts lying within `link` degrees of each other; returns a group id per part. */
const clusterParts = (parts: Part[], link: number) => {
  const group = parts.map((_, i) => i);
  const root = (i: number): number => (group[i] === i ? i : root(group[i]));
  for (const [i, a] of parts.entries()) {
    for (const [j, b] of parts.entries()) {
      if (j > i && partGap(a, b) < link) {
        group[root(i)] = root(j);
      }
    }
  }
  return parts.map((_, i) => root(i));
};

/**
 * Drops a region's remote specks: a cluster of its parts (pieces within 5°
 * of each other) holding under 1% of its largest part's area and lying over
 * 15° from every other part. On a world map Hawaii is such a cluster: a
 * lone dot in the Pacific that reads as a stray mark, while the mainland
 * already carries the value. With countries-110m this removes Hawaii only.
 */
export const withoutRemoteIslets = (region: Region): Region => {
  const { geometry } = region.feature;
  if (geometry.type !== "MultiPolygon") {
    return region;
  }
  const parts = geometry.coordinates.map(partOf);
  const groups = clusterParts(parts, 5);
  const biggest = Math.max(...parts.map((p) => p.area));
  const mainGroup = groups[parts.findIndex((p) => p.area === biggest)];
  const remote = new Set<number>();
  for (const g of new Set(groups)) {
    const members = parts.flatMap((_, i) => (groups[i] === g ? [i] : []));
    const area = members.reduce((total, i) => total + parts[i].area, 0);
    const nearest = Math.min(
      ...members.flatMap((i) =>
        parts.flatMap((p, j) => (groups[j] === g ? [] : [partGap(parts[i], p)]))
      )
    );
    if (g !== mainGroup && area < biggest * 0.01 && nearest > 15) {
      for (const i of members) {
        remote.add(i);
      }
    }
  }
  if (remote.size === 0) {
    return region;
  }
  return {
    ...region,
    feature: {
      ...region.feature,
      geometry: {
        coordinates: geometry.coordinates.filter((_, i) => !remote.has(i)),
        type: "MultiPolygon",
      },
    },
  };
};

/** Longitude past which a ring counts as touching the antimeridian. */
const FAR_SIDE = 179;

/**
 * Drops a region's minor parts that straddle the antimeridian. A projection
 * centred on Greenwich splits such a part and throws one half to the map's
 * opposite edge (a sliver of Fiji alone at the far left), where it reads as
 * a stray mark. The region's largest part is always kept.
 */
export const withoutWrappedParts = (region: Region): Region => {
  const { geometry } = region.feature;
  if (geometry.type !== "MultiPolygon") {
    return region;
  }
  const areas = geometry.coordinates.map((coordinates) =>
    geoArea({ coordinates, type: "Polygon" })
  );
  const biggest = Math.max(...areas);
  const kept = geometry.coordinates.filter((polygon, i) => {
    const lons = polygon[0].map((p) => p[0]);
    const straddles =
      Math.min(...lons) < -FAR_SIDE && Math.max(...lons) > FAR_SIDE;
    return areas[i] === biggest || !straddles;
  });
  if (kept.length === geometry.coordinates.length) {
    return region;
  }
  return {
    ...region,
    feature: {
      ...region.feature,
      geometry: { coordinates: kept, type: "MultiPolygon" },
    },
  };
};
