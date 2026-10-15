import type { GalleryEntry } from "../../gallery/types";
import { BallotTally } from "./ballot-tally";
import { CalendarHeat } from "./calendar-heat";
import { HourglassStream } from "./hourglass-stream";
import { HundredField } from "./hundred-field";
import { MatrixHeat } from "./matrix-heat";
import { ParallelCoordinates } from "./parallel-coordinates";
import { Ridgeline } from "./ridgeline";
import { TrendLineage } from "./trend-lineage";
import { TypeColonnade } from "./type-colonnade";

/** Gallery entries owned by agent lupi-b, in catalogue order. */
export const entries: GalleryEntry[] = [
  {
    family: "lupi",
    id: "L11",
    name: "Sea areas",
    render: () => <TrendLineage years={[1924, 2026]} />,
  },
  {
    family: "lupi",
    id: "L14",
    name: "A hundred donors",
    render: () => <HundredField />,
  },
  {
    family: "lupi",
    id: "L13",
    name: "Library earnings",
    render: () => <HourglassStream />,
  },
  {
    family: "lupi",
    id: "L12",
    name: "Lights by keeper",
    render: () => <TypeColonnade unit="lights" />,
  },
  {
    family: "lupi",
    id: "L15",
    name: "Days out",
    render: () => <BallotTally />,
  },
  {
    family: "lupi",
    id: "L16",
    name: "Letter pairs",
    render: () => <MatrixHeat thresholds={[5, 10, 15, 20]} />,
  },
  {
    family: "lupi",
    id: "L17",
    name: "A year of births",
    render: () => <CalendarHeat unit="births" />,
    span: "full",
  },
  {
    family: "lupi",
    id: "L19",
    name: "January by decade",
    render: () => <Ridgeline highlight="2010s" />,
  },
  {
    family: "lupi",
    id: "L20",
    name: "Twelve cheeses",
    render: () => <ParallelCoordinates highlight="Roquefort" />,
  },
];
