/**
 * O10 Land by nation: how the land of each UK nation is covered.
 * Source: UK Centre for Ecology and Hydrology, Land Cover Map 2021 (LCM2021),
 * Marston et al. 2023, Earth System Science Data 15, 4631-4649 (CC BY 4.0),
 * Table 5, https://essd.copernicus.org/articles/15/4631/2023/essd-15-4631-2023.pdf
 * Fetched 2026-10-15.
 * Transform: Table 5 gives the area in km2 of 21 classes for the UK and each
 * nation. Farmland is arable (3) plus improved grassland (4); Woodland is
 * broadleaved (1) plus coniferous (2); Built is urban (20) plus suburban
 * (21); Other is the remaining 15 classes (semi-natural grassland, heather,
 * bog, fen, rock, water and the coast). Each share is the group's area over
 * the sum of the 21 classes (which differs from the printed total by 0 to 5
 * km2 of rounding), to one decimal, the four rounded by largest remainder so
 * each row sums to 100.0.
 */

/**
 * The engraving that marks a kind of land, one of four families: upright
 * rules, a halftone dot screen, crosshatch, and level rules.
 */
export type WorkTexture = "cross" | "dots" | "level" | "upright";

/** One kind of land, and the engraving that marks it. */
export interface WorkKind {
  name: string;
  texture: WorkTexture;
}

/** One nation's land, as percentage shares in `kinds` order. */
export interface TeamShares {
  shares: number[];
  team: string;
}

export interface ShareTable {
  kinds: WorkKind[];
  rows: TeamShares[];
}

/** How the land of each UK nation is covered, in percent of its area. */
export const timeSharesDemo: ShareTable = {
  kinds: [
    { name: "Farmland", texture: "upright" },
    { name: "Woodland", texture: "cross" },
    { name: "Built", texture: "dots" },
    { name: "Other", texture: "level" },
  ],
  rows: [
    { shares: [61.2, 11.4, 13.4, 14], team: "England" },
    { shares: [24.1, 18.2, 2.9, 54.8], team: "Scotland" },
    { shares: [41.1, 19, 7.3, 32.6], team: "Wales" },
    { shares: [46.8, 10, 6.1, 37.1], team: "Northern Ireland" },
    { shares: [46.8, 14.1, 9.1, 30], team: "UK" },
  ],
};
