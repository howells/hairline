import tenors from "./violin.tenors.json";

export interface ViolinGroup {
  label: string;
  /** One value per record. */
  values: number[];
}

/** Pounds in a hundredweight. */
const LB_PER_CWT = 112;

/**
 * Tenor weights: the weight of the heaviest bell, in hundredweight (cwt), for
 * every full-circle ring of 6, 8, 10 and 12 bells, one value per tower.
 *
 * Source: Dove's Guide for Church Bell Ringers, Central Council of Church Bell
 * Ringers, dove.csv, licensed Creative Commons Attribution-ShareAlike 4.0
 * (credit the Central Council; data derived from it shares alike):
 * https://dove.cccbr.org.uk/dove.csv (download page https://dove.cccbr.org.uk/downloads)
 * Fetched 2026-10-15.
 *
 * Transform: rows with RingType "Full-circle ring" and Bells 6, 8, 10 or 12
 * (2,958, 1,892, 303 and 139 towers); the column Wt, which is the tenor in
 * pounds, was kept as given (blank weights dropped) and is in
 * violin.tenors.json, sorted. Divided here by 112 to give hundredweight.
 * Sanity: the heaviest tenor is Liverpool Cathedral's, 9,195 lb or 82 cwt, in
 * the ring of 12; the median tenor is 10 cwt for six bells and 25.7 cwt for
 * twelve. Dove marks some weights as approximate or estimated.
 */
export const violinDemo: ViolinGroup[] = tenors.map((g) => ({
  label: g.label,
  values: g.lb.map((lb) => lb / LB_PER_CWT),
}));
