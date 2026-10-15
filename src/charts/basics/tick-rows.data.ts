/** A labelled count. */
export interface CountDatum {
  label: string;
  value: number;
}

/**
 * F5 Birds counted. Total birds of each species counted in the UK's gardens in
 * the 2026 Big Garden Birdwatch, the six most seen: the house
 * sparrow (1,275,378) heads the list, ahead of the blue tit (1,114,620).
 *
 * Source: RSPB, Big Garden Birdwatch results page and its data file
 * bgbw_results_2022_2026_en.json (version 2026-03-12), UK leaderboard for 2026.
 *   https://www.rspb.org.uk/whats-happening/big-garden-birdwatch/results
 *   https://base-prod.rspb-prod.magnolia-platform.com/dam/jcr:a3238936-23e0-4b99-a88a-6838d0f0c9b2/bgbw_results_2022_2026_en.json
 * Fetched 2026-10-15. The RSPB states no reuse licence on the page; the counts
 * are published facts and are credited here.
 *
 * Transform: the first six species of years[2026].countries["UK"].species, in
 * the order given (already by count, largest first), with the first letter of
 * each name capitalised and the rest lower case. Counts are as published.
 * Scripts: reference/scripts/F5/gen.py.
 */
export const tickRowsDemo: CountDatum[] = [
  { label: "House sparrow", value: 1_275_378 },
  { label: "Blue tit", value: 1_114_620 },
  { label: "Starling", value: 796_002 },
  { label: "Woodpigeon", value: 787_190 },
  { label: "Blackbird", value: 598_783 },
  { label: "Great tit", value: 562_690 },
];
