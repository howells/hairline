import type { GalleryEntry } from "../../gallery/types";
import { ChunkyBars } from "./chunky-bars";
import { CircularGraph } from "./circular-graph";
import { DivergingBar } from "./diverging-bar";
import { DotWaffle } from "./dot-waffle";
import { ForceGraph } from "./force-graph";
import { PictorialBar } from "./pictorial-bar";
import { RainfallDualArea } from "./rainfall-dual-area";
import { ScatterMorph } from "./scatter-morph";
import { StaggerWave } from "./stagger-wave";
import { TreeLR } from "./tree-lr";

/** Gallery entries owned by agent glance-a, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "glance",
    id: "G3",
    name: "MRR by plan",
    render: () => <ChunkyBars />,
  },
  {
    family: "glance",
    id: "G4",
    name: "Sign-ups by platform",
    render: () => <DotWaffle />,
  },
  {
    family: "glance",
    id: "G5",
    name: "Notes by platform",
    render: () => <PictorialBar />,
  },
  {
    family: "glance",
    id: "G6",
    name: "Team links",
    render: () => <CircularGraph />,
  },
  {
    family: "glance",
    id: "G7",
    name: "Feature tree",
    render: () => <TreeLR />,
  },
  {
    family: "glance",
    id: "G8",
    name: "Spend and sign-ups",
    render: () => <RainfallDualArea />,
  },
  {
    family: "glance",
    id: "G9",
    name: "Three views",
    render: () => <ScatterMorph />,
  },
  {
    family: "glance",
    id: "G10",
    name: "Net change",
    render: () => <DivergingBar />,
  },
  {
    family: "glance",
    id: "G11",
    name: "Integrations",
    render: () => <ForceGraph />,
  },
  {
    family: "glance",
    id: "G12",
    name: "Daily sign-ups",
    render: () => <StaggerWave />,
  },
];
