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
    name: "Spring arrivals",
    render: () => <LaunchFan />,
  },
  {
    family: "lupi",
    id: "L2",
    name: "Named mates",
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
    name: "New woodland",
    render: () => <ArcMatrix top={1} />,
  },
  {
    family: "lupi",
    id: "L5",
    name: "Named storms",
    render: () => <RadialConvergence />,
  },
  {
    family: "lupi",
    id: "L6",
    name: "Grape families",
    render: () => <ClusterField />,
  },
  {
    family: "lupi",
    id: "L7",
    name: "Four summits",
    render: () => <BrandSpectrum />,
  },
  {
    family: "lupi",
    id: "L8",
    name: "Years gained",
    render: () => <DottyMatrix />,
  },
  {
    family: "lupi",
    id: "L9",
    name: "Coffee growers",
    render: () => <BubbleAlmanac height={400} />,
  },
  {
    family: "lupi",
    id: "L10",
    name: "Solar flares",
    render: () => <RadialPatchwork />,
  },
];
