import { entries as basics } from "../charts/basics";
import { entries as big } from "../charts/big";
import { entries as board } from "../charts/board";
import { entries as forms } from "../charts/forms";
import { entries as glance } from "../charts/glance";
import { entries as lupi } from "../charts/lupi";
import { entries as maps } from "../charts/maps";
import { entries as originals } from "../charts/originals";
import { entries as palette } from "../charts/palette";
import type { GalleryEntry } from "./types";

const byId = (list: GalleryEntry[], id: string) =>
  list.filter((e) => e.id === id);
const without = (list: GalleryEntry[], ...ids: string[]) => {
  const skip = new Set(ids);
  return list.filter((e) => !skip.has(e.id));
};

/*
 * The order of the grid. Full-width plates are spread through it as section
 * breaks (L17 closes the editorial set, B1 the glance set, B3 the boards, and
 * the world map closes the grid) rather than stacked at the end.
 */
export const ALL_ENTRIES: GalleryEntry[] = [
  ...lupi,
  ...basics,
  ...glance,
  ...byId(big, "B1"),
  ...board,
  ...byId(big, "B3"),
  ...without(big, "B1", "B3"),
  ...without(maps, "M2"),
  ...originals,
  ...forms,
  ...byId(maps, "M2"),
  // The fills and marks sheets close the grid: every fill and marker above is one of these.
  ...palette,
];

export const entryById = (id: string) =>
  ALL_ENTRIES.find((e) => e.id.toLowerCase() === id.toLowerCase());
