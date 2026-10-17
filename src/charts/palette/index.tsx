import type { GalleryEntry } from "../../gallery/types";
import { FillSheet } from "./fill-sheet";
import { MarkSheet } from "./mark-sheet";
import { TypeSheet } from "./type-sheet";

/** The library's own reference sheets, shown on the Kit page: fills, marks and type. */
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
  {
    family: "palette",
    id: "P3",
    name: "Type",
    render: () => <TypeSheet />,
  },
];
