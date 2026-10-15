export interface RankSeries {
  label: string;
  /** Rank in each period, 1 = top. */
  ranks: number[];
}

export interface RankStripData {
  periods: string[];
  series: RankSeries[];
  /** Size of the field the ranks are among, for the tooltip ("#3 of 6"); defaults to the number of series. */
  outOf?: number;
}

/**
 * Nobel countries: where six countries rank among themselves by Nobel Prizes
 * won in five 15-year periods, 1951 to 2025.
 *
 * Source: Nobel Prize Outreach, Nobel Prize API v2.1, all laureates (CC0, per
 * the API terms of use, https://www.nobelprize.org/about/terms-of-use-for-api-nobelprize-org-and-data-nobelprize-org/):
 * https://api.nobelprize.org/2.1/laureates?limit=1200&format=json
 * Fetched 2026-10-15.
 *
 * Transform, one rule throughout: a laureate's country is their country of
 * birth in today's borders (birth.place.countryNow), not the country of their
 * institution. Every laureate and prize pair counts 1, so a shared prize is
 * counted whole for each laureate, and someone with two prizes counts twice.
 * Organisations have no birthplace and are skipped (34 prizes, with a few
 * laureates without a recorded birth country). A prize belongs to the period
 * of its award year, and 2026 is not in the table. Counts, in period order:
 * USA 30, 48, 52, 70, 61; United Kingdom 12, 17, 7, 14, 18; Germany 9, 11, 14,
 * 7, 7; France 8, 8, 4, 4, 12; Japan 1, 3, 3, 9, 13; Sweden 3, 6, 5, 1, 3.
 * Rank is among these six only (1 is most prizes). The six and the periods were
 * chosen so that no two countries tie in any period, so no tie-break is
 * needed (the script checks it).
 * Sanity: Japan climbs from 6th to 3rd with 13 prizes in 2011 to 2025; Germany
 * slips from 3rd to 5th.
 */
export const rankStripDemo: RankStripData = {
  outOf: 6,
  periods: ["1951–65", "1966–80", "1981–95", "1996–2010", "2011–25"],
  series: [
    { label: "USA", ranks: [1, 1, 1, 1, 1] },
    { label: "United Kingdom", ranks: [2, 2, 3, 2, 2] },
    { label: "Germany", ranks: [3, 3, 2, 4, 5] },
    { label: "France", ranks: [4, 4, 5, 5, 4] },
    { label: "Japan", ranks: [6, 6, 6, 3, 3] },
    { label: "Sweden", ranks: [5, 5, 4, 6, 6] },
  ],
};
