import type { GalleryEntry } from "../../gallery/types";
import { AreaDifference } from "./area-difference";
import { BrushedOverview } from "./brushed-overview";
import { ChordRing } from "./chord-ring";
import { CirclePack } from "./circle-pack";
import { HatchedStack } from "./hatched-stack";
import { RadialYear } from "./radial-year";

/** Standard forms we lacked, drawn in the Hairline grammar. */
export const entries: GalleryEntry[] = [
  {
    family: "forms",
    id: "O5",
    name: "Against normal",
    render: () => <AreaDifference />,
  },
  {
    family: "forms",
    id: "O6",
    name: "Shared work",
    render: () => <ChordRing />,
  },
  {
    family: "forms",
    id: "O7",
    name: "A year by month",
    render: () => <RadialYear />,
  },
  {
    family: "forms",
    id: "O8",
    name: "Hot year",
    render: () => <BrushedOverview />,
  },
  {
    family: "forms",
    id: "O9",
    name: "Teams by size",
    render: () => <CirclePack />,
  },
  {
    family: "forms",
    id: "O10",
    name: "Hatched shares",
    render: () => <HatchedStack />,
  },
];
