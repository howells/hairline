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

/** Days after 21 March as a date: 0 is 21 March, 11 is 1 April. */
const easterDate = (v: number) => {
  const day = 21 + Math.round(v);
  return day <= 31 ? `${day} Mar` : `${day - 31} Apr`;
};

/** Gallery entries owned by agent glance-b (G13–G22), in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "glance",
    id: "G13",
    name: "Free time",
    render: () => <BigSlice intensityLabel="a day" />,
  },
  {
    family: "glance",
    id: "G14",
    name: "Up the Hudson",
    render: () => <SingleAxis highlight={5} />,
  },
  {
    family: "glance",
    id: "G15",
    name: "Easter dates",
    render: () => <JitterStrip format={easterDate} unit="year" />,
  },
  {
    family: "glance",
    id: "G16",
    name: "Busiest stations",
    render: () => <BarRace />,
  },
  {
    family: "glance",
    id: "G17",
    name: "Rolling swell",
    render: () => <DynamicStream />,
  },
  {
    family: "glance",
    id: "G18",
    name: "Premier League goals",
    render: () => <DrawIn />,
  },
  {
    family: "glance",
    id: "G19",
    name: "Tenor weights",
    render: () => <Violin lowIsBest={false} />,
  },
  {
    family: "glance",
    id: "G20",
    name: "Kit by income",
    render: () => <MatrixHeatGlance highlight={[0, 2]} />,
  },
  {
    family: "glance",
    id: "G21",
    name: "Nobel countries",
    render: () => <RankStrip />,
  },
  {
    family: "glance",
    id: "G22",
    name: "Free vote",
    render: () => <AggregateSankey />,
  },
];
