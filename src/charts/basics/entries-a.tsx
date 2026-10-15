import type { GalleryEntry } from "../../gallery/types";
import { fmtMoney } from "../../lib/format";
import { HairlineArea } from "./hairline-area";
import { HairlineLine } from "./hairline-line";
import { PairedRungs } from "./paired-rungs";
import { PlumbScatter } from "./plumb-scatter";
import { RungWaterfall } from "./rung-waterfall";
import { StackedRungs } from "./stacked-rungs";
import { TickDonut } from "./tick-donut";
import { TickRows } from "./tick-rows";

/** Gallery entries owned by agent basics-a, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "basics",
    id: "F2",
    name: "Daily line",
    render: () => <HairlineLine />,
  },
  {
    family: "basics",
    id: "F3",
    name: "Daily area",
    render: () => <HairlineArea />,
  },
  {
    family: "basics",
    id: "F4",
    name: "Share ring",
    render: () => <TickDonut format={(v) => `${v}k`} unit="sign-ups" />,
  },
  {
    family: "basics",
    id: "F5",
    name: "Count rows",
    render: () => <TickRows format={(v) => `${v}k`} />,
  },
  {
    family: "basics",
    id: "F6",
    name: "Getting to work",
    render: () => <PairedRungs format={(v) => `${v}%`} unit={1} />,
  },
  {
    family: "basics",
    id: "F7",
    name: "Stacked counts",
    render: () => <StackedRungs />,
  },
  {
    family: "basics",
    id: "F8",
    name: "Stem scatter",
    render: () => (
      <PlumbScatter
        formatX={(v) => `${v}% use it`}
        xDomain={[0, 100]}
        xLabels={["Fewer users", "More users"]}
        yLabel="Satisfaction ↑"
      />
    ),
  },
  {
    family: "basics",
    id: "F9",
    name: "Waterfall",
    render: () => <RungWaterfall format={(v) => fmtMoney(v * 1e3)} unit={50} />,
  },
];
