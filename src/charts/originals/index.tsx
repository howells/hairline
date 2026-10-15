import type { GalleryEntry } from "../../gallery/types";
import { DailyUsers } from "./daily-users";
import { FeatureRank } from "./feature-rank";
import { ResponseTime } from "./response-time";
import { RevenueByPlan } from "./revenue-by-plan";

/** Charts of our own, designed in the Hairline grammar rather than rebuilt from a reference. */
export const entries: GalleryEntry[] = [
  {
    family: "originals",
    id: "O1",
    name: "Summer of 1976",
    render: () => <DailyUsers />,
  },
  {
    family: "originals",
    id: "O2",
    name: "Everyday prices",
    render: () => <RevenueByPlan />,
  },
  {
    family: "originals",
    id: "O3",
    name: "Arable crops",
    render: () => <FeatureRank />,
  },
  {
    family: "originals",
    id: "O4",
    name: "Vote share",
    render: () => <ResponseTime />,
  },
];
