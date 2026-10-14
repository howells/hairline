export interface RankSeries {
  label: string;
  /** Rank in each period, 1 = top. */
  ranks: number[];
}

export interface RankStripData {
  periods: string[];
  series: RankSeries[];
}

/** Fieldnote's features ranked by weekly users gained, a quarter at a time. */
export const rankStripDemo: RankStripData = {
  periods: ["Q3 2025", "Q4 2025", "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"],
  series: [
    { label: "Assistant", ranks: [6, 5, 4, 3, 2, 1] },
    { label: "Notes", ranks: [1, 1, 1, 1, 1, 2] },
    { label: "Search", ranks: [2, 2, 2, 2, 3, 3] },
    { label: "Clips", ranks: [3, 3, 5, 5, 5, 5] },
    { label: "Canvas", ranks: [5, 4, 3, 4, 4, 4] },
    { label: "Tags", ranks: [4, 6, 6, 6, 6, 6] },
  ],
};
