import type { GalleryEntry } from "../../gallery/types";
import { FillSheet } from "./fill-sheet";

/** The library's own reference sheets: the agreed fills. */
export const entries: GalleryEntry[] = [
  {
    family: "palette",
    id: "P1",
    name: "Fills",
    render: () => <FillSheet />,
    span: "full",
  },
];
