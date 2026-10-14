/** One feature's weekly active users (thousands), one value per quarter. */
export interface FeatureUse {
  feature: string;
  weekly: number[];
}

/** The quarters of 2026, as broadsheet ticks: the year on the first only. */
export const QUARTERS = ["Q1 2026", "Q2", "Q3", "Q4"];

/**
 * Fieldnote's seven largest features by weekly active users, 2026. Notes
 * leads until the rebuilt search overtakes it in the fourth quarter.
 */
export const featureUse: FeatureUse[] = [
  { feature: "Notes", weekly: [164, 166, 168, 171] },
  { feature: "Search", weekly: [96, 118, 149, 176] },
  { feature: "Clips", weekly: [121, 124, 126, 128] },
  { feature: "Canvas", weekly: [58, 71, 88, 104] },
  { feature: "Tags", weekly: [92, 87, 81, 74] },
  { feature: "Sync", weekly: [70, 69, 67, 66] },
  { feature: "Share", weekly: [49, 52, 55, 58] },
];
