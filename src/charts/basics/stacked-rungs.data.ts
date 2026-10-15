/** One category split into up to three parts, bottom part first. */
export interface StackDatum {
  label: string;
  parts: number[];
}

/**
 * F7 Medals by Games. Great Britain's gold, silver and bronze medals at the
 * last four Summer Olympics. Totals: London 65, Rio 67, Tokyo 64, Paris 65.
 *
 * Source: the medal counts in the infobox of the Wikipedia article for each
 * Games (text available under CC BY-SA 4.0), which cite the IOC and BBC Sport
 * medal tables.
 *   https://en.wikipedia.org/wiki/Great_Britain_at_the_2012_Summer_Olympics
 *   https://en.wikipedia.org/wiki/Great_Britain_at_the_2016_Summer_Olympics
 *   https://en.wikipedia.org/wiki/Great_Britain_at_the_2020_Summer_Olympics
 *   https://en.wikipedia.org/wiki/Great_Britain_at_the_2024_Summer_Olympics
 * Fetched 2026-10-15 (wikitext via action=raw).
 *
 * Transform: the gold, silver and bronze fields of each infobox, unchanged.
 * London 2012 is the count after the later reallocation of a men's high jump
 * medal (29 gold, 18 silver, 18 bronze; the original count was 17 silver and
 * 19 bronze, as the article text says). Scripts: reference/scripts/F7/gen.py.
 */
export const stackedRungsDemo: StackDatum[] = [
  { label: "London 2012", parts: [29, 18, 18] },
  { label: "Rio 2016", parts: [27, 23, 17] },
  { label: "Tokyo 2020", parts: [22, 20, 22] },
  { label: "Paris 2024", parts: [14, 22, 29] },
];

/** Series names for the demo, bottom (darkest) first. */
export const stackedRungsSeries = ["Gold", "Silver", "Bronze"];
