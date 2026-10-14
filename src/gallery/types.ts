import type { ReactNode } from "react";

export type Family =
  | "lupi"
  | "basics"
  | "glance"
  | "big"
  | "maps"
  | "board"
  | "originals"
  | "forms"
  | "palette";

/** One chart in the grid. */
export interface GalleryEntry {
  /** Catalogue code: L1–L20, F1–F17, G3–G22, B1–B3, M1–M2, O1–O4 originals, O5… forms, D1… for boards, P1 the fills sheet. */
  id: string;
  family: Family;
  /** Form name, e.g. "Hourglass Stream", shown under the chart. */
  name: string;
  /** "full" spans both gallery columns. */
  span?: "half" | "full";
  dark?: boolean;
  render: () => ReactNode;
}
