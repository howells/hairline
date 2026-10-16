import type { GalleryEntry } from "../../gallery/types";
import { FillSheet } from "./fill-sheet";
import { MarkSheet } from "./mark-sheet";

/** The library's own reference sheets: the agreed fills and marks. */
export const entries: GalleryEntry[] = [
  {
    family: "palette",
    id: "P1",
    name: "Fills",
    render: () => <FillSheet />,
    span: "full",
  },
  {
    family: "palette",
    id: "P2",
    name: "Marks",
    render: () => <MarkSheet />,
  },
];
