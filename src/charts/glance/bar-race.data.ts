export interface RaceSeries {
  label: string;
  /** One value per period. */
  values: number[];
}

export interface RaceData {
  periods: string[];
  series: RaceSeries[];
}

/** Fieldnote monthly active users by country, thousands, a quarter at a time. */
export const barRaceDemo: RaceData = {
  periods: [
    "Q1 2025",
    "Q2 2025",
    "Q3 2025",
    "Q4 2025",
    "Q1 2026",
    "Q2 2026",
    "Q3 2026",
    "Q4 2026",
  ],
  series: [
    { label: "US", values: [92, 98, 104, 109, 115, 121, 127, 134] },
    { label: "UK", values: [31, 33, 35, 37, 39, 41, 43, 45] },
    { label: "DE", values: [26, 28, 31, 33, 36, 38, 41, 43] },
    { label: "IN", values: [9, 13, 18, 24, 30, 37, 44, 52] },
    { label: "FR", values: [17, 18, 19, 21, 22, 23, 24, 26] },
    { label: "CA", values: [15, 16, 17, 18, 19, 20, 21, 22] },
    { label: "BR", values: [8, 10, 12, 14, 17, 19, 22, 25] },
    { label: "JP", values: [11, 12, 13, 14, 15, 16, 17, 18] },
  ],
};
