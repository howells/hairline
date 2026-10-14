import type { GalleryEntry } from "../../gallery/types";
import { CircularGraph } from "./circular-graph";
import { ForceGalaxy } from "./force-galaxy";
import { ThreadTriptych } from "./thread-triptych";

/** Gallery entries for the big family, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    dark: true,
    family: "big",
    id: "B1",
    name: "Repo network",
    render: () => <CircularGraph />,
    span: "full",
  },
  {
    family: "big",
    id: "B2",
    name: "Service calls",
    render: () => <ForceGalaxy />,
  },
  {
    family: "big",
    id: "B3",
    name: "Data paths",
    render: () => <ThreadTriptych />,
    span: "full",
  },
];
