import type { GalleryEntry } from "../../gallery/types";
import { fmtInt } from "../../lib/format";
import { HairlineArea } from "./hairline-area";
import { HairlineLine } from "./hairline-line";
import { PairedRungs } from "./paired-rungs";
import { PlumbScatter } from "./plumb-scatter";
import { RungWaterfall } from "./rung-waterfall";
import { StackedRungs } from "./stacked-rungs";
import { TickDonut } from "./tick-donut";
import { TickRows } from "./tick-rows";

/** Dollars to the pound, to the cent. */
const fmtDollars = (v: number) => `$${v.toFixed(2)}`;

/** A length of daylight in hours, as 15h 25m. */
const fmtDaylight = (v: number) => {
  const minutes = Math.round(v * 60);
  const rest = minutes % 60;
  const hours = `${Math.floor(minutes / 60)}h`;
  return rest === 0 ? hours : `${hours} ${rest}m`;
};

/** Billions of tonnes of CO2, to one decimal. */
const fmtGt = (v: number) => `${v.toFixed(1)}Gt`;

const fmtPounds = (v: number) => `£${fmtInt(v)}`;
const fmtMillions = (v: number) => `${(v / 1e6).toFixed(2)}m`;

/** Gallery entries owned by agent basics-a, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "basics",
    id: "F2",
    name: "Sterling in September",
    render: () => <HairlineLine emphasis="trough" format={fmtDollars} />,
  },
  {
    family: "basics",
    id: "F3",
    name: "Daylight in Tromsø",
    render: () => (
      <HairlineArea format={fmtDaylight} ticks={[0, 6, 12, 18, 24]} />
    ),
  },
  {
    family: "basics",
    id: "F4",
    name: "Where the bill goes",
    render: () => <TickDonut format={fmtPounds} unit="a year" />,
  },
  {
    family: "basics",
    id: "F5",
    name: "Birds counted",
    render: () => <TickRows format={fmtMillions} unit={50_000} />,
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
    name: "Medals by Games",
    render: () => <StackedRungs />,
  },
  {
    family: "basics",
    id: "F8",
    name: "Apple orchards",
    render: () => (
      <PlumbScatter
        format={(v) => `${v} t/ha`}
        formatX={(v) => `${v}k ha`}
        xDomain={[0, 340]}
        xLabels={["Smaller", "Larger"]}
        yLabel="Yield ↑"
      />
    ),
  },
  {
    family: "basics",
    id: "F9",
    name: "Where carbon goes",
    render: () => <RungWaterfall format={fmtGt} />,
  },
];
