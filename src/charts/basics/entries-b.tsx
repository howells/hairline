import type { GalleryEntry } from "../../gallery/types";
import { fmtInt } from "../../lib/format";
import { Candlestick } from "./candlestick";
import { DotHeat } from "./dot-heat";
import { DumbbellQueue } from "./dumbbell-queue";
import { NestedTreemap } from "./nested-treemap";
import { RungHistogram } from "./rung-histogram";
import { StreamRibbon } from "./stream-ribbon";
import { TickBox } from "./tick-box";
import { TickGauge } from "./tick-gauge";

/** Gallery entries owned by agent basics-b, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "basics",
    id: "F10",
    name: "Hour of birth",
    render: () => <DotHeat format={(v) => `${v.toFixed(1)}%`} labelEvery={4} />,
  },
  {
    family: "basics",
    id: "F11",
    name: "Rain so far",
    render: () => <TickGauge format={(v) => `${Math.round(v)} mm`} />,
  },
  {
    family: "basics",
    id: "F12",
    name: "Museum visits",
    render: () => (
      <DumbbellQueue
        alert="fall"
        ends={["0", "Millions of visits"]}
        format={(v) => v.toFixed(1)}
        unit={0.25}
      />
    ),
  },
  {
    family: "basics",
    id: "F13",
    name: "Milk by use",
    render: () => <NestedTreemap format={(v) => `${fmtInt(v)}m litres`} />,
  },
  {
    family: "basics",
    id: "F14",
    name: "Finish times",
    render: () => <RungHistogram format={fmtInt} unit={50} />,
  },
  {
    family: "basics",
    id: "F15",
    name: "Sunshine by season",
    render: () => <TickBox format={(v) => `${Math.round(v)} h`} />,
  },
  {
    family: "basics",
    id: "F16",
    name: "Runs by source",
    render: () => <StreamRibbon format={fmtInt} yearly />,
  },
  {
    family: "basics",
    id: "F17",
    name: "Daily price",
    render: () => (
      <Candlestick format={fmtInt} formatPrice={(v) => v.toFixed(2)} />
    ),
  },
];
