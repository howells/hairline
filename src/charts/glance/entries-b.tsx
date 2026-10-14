import type { GalleryEntry } from "../../gallery/types";
import { AggregateSankey } from "./aggregate-sankey";
import { BarRace } from "./bar-race";
import { BigSlice } from "./big-slice";
import { DrawIn } from "./draw-in";
import { DynamicStream } from "./dynamic-stream";
import { JitterStrip } from "./jitter-strip";
import { MatrixHeatGlance } from "./matrix-heat-glance";
import { RankStrip } from "./rank-strip";
import { SingleAxis } from "./single-axis";
import { Violin } from "./violin";

/** Gallery entries owned by agent glance-b (G13–G22), in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "glance",
    id: "G13",
    name: "Time in product",
    render: () => <BigSlice intensityLabel="a day" />,
  },
  {
    family: "glance",
    id: "G14",
    name: "Syncs by hour",
    render: () => <SingleAxis />,
  },
  {
    family: "glance",
    id: "G15",
    name: "Time to close",
    render: () => <JitterStrip axisLabel="hours to close" />,
  },
  {
    family: "glance",
    id: "G16",
    name: "Users by country",
    render: () => <BarRace />,
  },
  {
    family: "glance",
    id: "G17",
    name: "Live users",
    render: () => <DynamicStream />,
  },
  {
    family: "glance",
    id: "G18",
    name: "Bookings to date",
    render: () => <DrawIn />,
  },
  {
    family: "glance",
    id: "G19",
    name: "Reply times",
    render: () => <Violin />,
  },
  {
    family: "glance",
    id: "G20",
    name: "Feature adoption",
    render: () => <MatrixHeatGlance />,
  },
  {
    family: "glance",
    id: "G21",
    name: "Rank by quarter",
    render: () => <RankStrip />,
  },
  {
    family: "glance",
    id: "G22",
    name: "Channel to plan",
    render: () => <AggregateSankey />,
  },
];
