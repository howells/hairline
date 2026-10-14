import { rnd } from "../../lib/random";

export interface ClusterDatum {
  id: string;
  label: string;
  /** One size per member (e.g. commits); sizes the member dot by area. */
  members: number[];
  /** Hub position in frame units; the frame is cropped to the hubs and scaled to the width. */
  at?: [number, number];
}

export interface ClusterField {
  clusters: ClusterDatum[];
  /** Cross-contribution paths between cluster ids. */
  links: [string, string][];
}

/** Commits this quarter for each of `n` engineers: most modest, a few prolific. */
const sizes = (n: number, seed: number) =>
  Array.from({ length: n }, (_, k) => Math.round(12 + 150 * rnd(seed, k) ** 2));

/**
 * Fieldnote engineers by team, each dot one engineer sized by commits this
 * quarter; paths are teams that shipped work together.
 */
export const clusterFieldDemo: ClusterField = {
  clusters: [
    {
      at: [215, 215],
      id: "platform",
      label: "Platform",
      members: sizes(44, 11),
    },
    { at: [62, 410], id: "design", label: "Design", members: sizes(9, 12) },
    { at: [490, 78], id: "product", label: "Product", members: sizes(21, 13) },
    { at: [540, 222], id: "growth", label: "Growth", members: sizes(11, 14) },
    { at: [468, 350], id: "mobile", label: "Mobile", members: sizes(17, 15) },
    { at: [330, 412], id: "data", label: "Data", members: sizes(14, 16) },
  ],
  links: [
    ["platform", "design"],
    ["platform", "product"],
    ["platform", "mobile"],
    ["platform", "data"],
    ["product", "growth"],
  ],
};
