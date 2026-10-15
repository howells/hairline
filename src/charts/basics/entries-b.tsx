import type { GalleryEntry } from "../../gallery/types";
import { fmtInt, fmtMoney } from "../../lib/format";
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
    name: "Progress dial",
    render: () => <TickGauge format={(v) => fmtMoney(v * 1e6)} />,
  },
  {
    family: "basics",
    id: "F12",
    name: "Before and after",
    render: () => (
      <DumbbellQueue ends={["0", "Minutes to reply"]} format={(v) => `${v}`} />
    ),
  },
  {
    family: "basics",
    id: "F13",
    name: "Tickets by platform",
    render: () => <NestedTreemap />,
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
    name: "Box plot",
    render: () => (
      <TickBox format={(v) => `${Number.isInteger(v) ? v : v.toFixed(1)}s`} />
    ),
  },
  {
    family: "basics",
    id: "F16",
    name: "Streamgraph",
    render: () => <StreamRibbon />,
  },
  {
    family: "basics",
    id: "F17",
    name: "Daily price",
    render: () => <Candlestick />,
  },
];
