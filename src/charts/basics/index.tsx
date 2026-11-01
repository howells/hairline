import type { GalleryEntry } from "../../gallery/types";
import { fmtInt } from "../../lib/format";
import { entries as a } from "./entries-a";
import { entries as b } from "./entries-b";
import { RungBars } from "./rung-bars";
import { rungBarsDemo } from "./rung-bars.data";

/** Gallery entries for the basics family, in catalogue order. */
const f1: GalleryEntry[] = [
  {
    family: "basics",
    id: "F1",
    name: "Major earthquakes",
    render: () => <RungBars data={rungBarsDemo} format={fmtInt} />,
  },
];

export const entries: GalleryEntry[] = [...f1, ...a, ...b];
