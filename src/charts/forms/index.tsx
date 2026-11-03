import type { GalleryEntry } from "../../gallery/types";
import { AreaDifference } from "./area-difference";
import { ArrowPlot } from "./arrow-plot";
import { BrushedOverview } from "./brushed-overview";
import { Bullet } from "./bullet";
import { ChordRing } from "./chord-ring";
import { CirclePack } from "./circle-pack";
import { HatchedStack } from "./hatched-stack";
import { Pyramid } from "./pyramid";
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
    name: "Goods exports",
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
    name: "Towers by county",
    render: () => <CirclePack />,
  },
  {
    family: "forms",
    id: "O10",
    name: "Land by nation",
    render: () => <HatchedStack />,
  },
  {
    family: "forms",
    id: "O11",
    name: "Share of orders",
    render: () => <ArrowPlot format={(v) => `${v}%`} />,
  },
  {
    family: "forms",
    id: "O12",
    name: "Against plan",
    render: () => <Bullet />,
  },
  {
    family: "forms",
    id: "O13",
    name: "Members by age",
    render: () => <Pyramid format={(v) => `${v}%`} />,
  },
];
