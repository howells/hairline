import type { GalleryEntry } from "../gallery/types";
import { PlumbScatter } from "./basics/plumb-scatter";
import { plumbScatterDemo } from "./basics/plumb-scatter.data";
import { CircularGraph } from "./big/circular-graph";
import { ForceGalaxy } from "./big/force-galaxy";
import { ForceGraph } from "./glance/force-graph";

/*
 * The same charts with one thing singled out: a hero group against grey or
 * faint ink, and a network faded out from the node it opens on. The ribbon
 * charts need no entry of their own; their gradients are in their plates.
 */

const apples = (context: "grey" | "opacity") => (
  <PlumbScatter
    context={context}
    data={plumbScatterDemo}
    format={(v) => `${v} t/ha`}
    formatX={(v) => `${v}k ha`}
    hero={["Chile", "South Africa", "Italy"]}
    heroLabel="Smallest orchards, biggest yields"
    xDomain={[0, 340]}
    xLabels={["Smaller", "Larger"]}
    yLabel="Yield ↑"
  />
);

export const entries: GalleryEntry[] = [
  {
    family: "basics",
    id: "F20",
    name: "Best yields",
    render: () => apples("grey"),
  },
  {
    family: "basics",
    id: "F21",
    name: "Faint crowd",
    render: () => apples("opacity"),
  },
  {
    family: "glance",
    id: "G23",
    name: "From the Wey",
    render: () => <ForceGraph selected="Wey" />,
  },
  {
    family: "big",
    id: "B4",
    name: "From Germany",
    render: () => <CircularGraph selected="Germany" />,
    span: "full",
  },
  {
    family: "big",
    id: "B5",
    name: "From Piccadilly",
    render: () => <ForceGalaxy selected="Piccadilly" />,
  },
];
