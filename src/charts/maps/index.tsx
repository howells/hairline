import type { GalleryEntry } from "../../gallery/types";
import { USChoropleth } from "./us-choropleth";
import { WorldChoropleth } from "./world-choropleth";

/** Gallery entries for the maps family, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "maps",
    id: "M1",
    name: "Christmas trees",
    render: () => <USChoropleth unit="trees" />,
  },
  {
    family: "maps",
    id: "M2",
    name: "Wine drinking",
    render: () => <WorldChoropleth unit="litres of pure alcohol a year" />,
    span: "full",
  },
];
