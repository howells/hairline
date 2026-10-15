/**
 * L20 Twelve cheeses: what is in 100 g of each.
 *
 * Source: Public Health England, McCance and Widdowson's The Composition of
 * Foods Integrated Dataset (CoFID) 2021, workbook sheets "1.3 Proximates"
 * (protein, fat) and "1.4 Inorganics" (calcium, sodium). Open Government
 * Licence v3.0.
 * Page: https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid
 * File: https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx
 * Fetched 2026-10-15.
 *
 * Transform: twelve foods of the cheese group (BL), chosen as a spread of
 * styles and countries, taken by CoFID food code: Cheddar 12-346 (English),
 * Stilton 12-367 (blue), Brie 12-344 (rind removed), Camembert 12-345, Edam
 * 12-355, Emmental 12-493, Parmesan 12-526 (fresh), Feta 12-525, Mozzarella
 * 12-360 (fresh), Roquefort 12-177, Mascarpone 12-490 and Cottage 12-539
 * (plain). Fat and protein are in grams, calcium and sodium in milligrams, all
 * per 100 g, copied unchanged. Sodium is shown, not salt, so no conversion is
 * applied.
 * Script: reference/scripts/L20/cheeses.py (with xl.py).
 */

/** One vertical axis: which value it reads and the range it spans (bottom → top). */
export interface ParallelAxis {
  key: string;
  label: string;
  domain: [number, number];
  /** Suffix for this axis's values, e.g. "%" or "k". */
  unit?: string;
}

/** One entity: a value for every axis key. */
export interface ParallelRow {
  name: string;
  values: Record<string, number>;
}

export interface ParallelData {
  axes: ParallelAxis[];
  rows: ParallelRow[];
}

const row = (
  name: string,
  fat: number,
  protein: number,
  calcium: number,
  sodium: number
): ParallelRow => ({
  name,
  values: { calcium, fat, protein, sodium },
});

/** Twelve cheeses, per 100 g. */
export const parallelDemo: ParallelData = {
  axes: [
    { domain: [0, 50], key: "fat", label: "Fat", unit: "g" },
    { domain: [0, 40], key: "protein", label: "Protein", unit: "g" },
    { domain: [0, 1200], key: "calcium", label: "Calcium", unit: "mg" },
    { domain: [0, 2000], key: "sodium", label: "Sodium", unit: "mg" },
  ],
  rows: [
    row("Cheddar", 34.9, 25.4, 739, 723),
    row("Stilton", 35, 23.7, 326, 788),
    row("Brie", 29.1, 20.3, 256, 556),
    row("Camembert", 22.7, 21.5, 235, 605),
    row("Edam", 26, 26.7, 795, 996),
    row("Emmental", 30.9, 30.2, 1025, 187),
    row("Parmesan", 29.7, 36.2, 1025, 660),
    row("Feta", 20.2, 15.6, 360, 1000),
    row("Mozzarella", 20.3, 18.6, 362, 395),
    row("Roquefort", 32.9, 19.7, 530, 1670),
    row("Mascarpone", 44.5, 4.6, 161, 70),
    row("Cottage", 6, 9.4, 127, 250),
  ],
};
