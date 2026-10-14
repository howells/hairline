import type { GalleryEntry } from "../../gallery/types";
import { USChoropleth } from "./us-choropleth";
import { WorldChoropleth } from "./world-choropleth";

/** Gallery entries for the maps family, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "maps",
    id: "M1",
    name: "States",
    render: () => <USChoropleth unit="sign-ups" />,
  },
  {
    family: "maps",
    id: "M2",
    name: "Countries",
    render: () => <WorldChoropleth unit="active accounts" />,
    span: "full",
  },
];
