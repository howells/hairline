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
import { staggerWaveColdest } from "./stagger-wave.data";
import { TreeLR } from "./tree-lr";

/** Gallery entries owned by agent glance-a, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "glance",
    id: "G3",
    name: "A pint over time",
    render: () => <ChunkyBars />,
  },
  {
    family: "glance",
    id: "G4",
    name: "Pollen in honey",
    render: () => <DotWaffle highlight={0} />,
  },
  {
    family: "glance",
    id: "G5",
    name: "Long novels",
    render: () => <PictorialBar />,
  },
  {
    family: "glance",
    id: "G6",
    name: "Moving between regions",
    render: () => <CircularGraph />,
  },
  {
    family: "glance",
    id: "G7",
    name: "Indo-European",
    render: () => <TreeLR />,
  },
  {
    family: "glance",
    id: "G8",
    name: "Rain and river",
    render: () => <RainfallDualArea />,
  },
  {
    family: "glance",
    id: "G9",
    name: "Largest asteroids",
    render: () => <ScatterMorph />,
  },
  {
    family: "glance",
    id: "G10",
    name: "Names rising, falling",
    render: () => <DivergingBar />,
  },
  {
    family: "glance",
    id: "G11",
    name: "Into the Thames",
    render: () => <ForceGraph />,
  },
  {
    family: "glance",
    id: "G12",
    name: "Cold December",
    render: () => <StaggerWave highlight={staggerWaveColdest} />,
  },
];
