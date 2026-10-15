import type { GalleryEntry } from "../../gallery/types";
import { ArcMatrix } from "./arc-matrix";
import { BarcodeLollipop } from "./barcode-lollipop";
import { BrandSpectrum } from "./brand-spectrum";
import { BubbleAlmanac } from "./bubble-almanac";
import { ClusterField } from "./cluster-field";
import { DotCascade } from "./dot-cascade";
import { DottyMatrix } from "./dotty-matrix";
import { LaunchFan } from "./launch-fan";
import { RadialConvergence } from "./radial-convergence";
import { RadialPatchwork } from "./radial-patchwork";

/** Gallery entries owned by agent lupi-a, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "lupi",
    id: "L1",
    name: "Integration launches",
    render: () => <LaunchFan />,
  },
  {
    family: "lupi",
    id: "L2",
    name: "Ranked causes",
    render: () => <DotCascade />,
  },
  {
    family: "lupi",
    id: "L3",
    name: "Autumn tides",
    render: () => <BarcodeLollipop />,
  },
  {
    family: "lupi",
    id: "L4",
    name: "Features by city",
    render: () => <ArcMatrix />,
  },
  {
    family: "lupi",
    id: "L5",
    name: "Requests by theme",
    render: () => <RadialConvergence />,
  },
  {
    family: "lupi",
    id: "L6",
    name: "Contributor clusters",
    render: () => <ClusterField />,
  },
  {
    family: "lupi",
    id: "L7",
    name: "Brand traits",
    render: () => <BrandSpectrum />,
  },
  {
    family: "lupi",
    id: "L8",
    name: "Team weeks",
    render: () => <DottyMatrix />,
  },
  {
    family: "lupi",
    id: "L9",
    name: "Tickets by year",
    render: () => <BubbleAlmanac />,
  },
  {
    family: "lupi",
    id: "L10",
    name: "Deploy hours",
    render: () => <RadialPatchwork />,
  },
];
