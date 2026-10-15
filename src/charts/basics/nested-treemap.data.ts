export interface TreemapLeaf {
  name: string;
  value: number;
}

export interface TreemapGroup {
  children: TreemapLeaf[];
  name: string;
}

/**
 * F13 Milk by use. Where the United Kingdom's milk went in 2025: the milk
 * dairies put into each product, in millions of litres, grouped by kind of
 * product. Cheddar takes 3,372 of the 12,515 drawn, drinking milk 6,035.
 *
 * Source: Defra, "Milk utilisation by dairies in England and Wales", Milk
 * availability, usage and production dataset (Milkutil_dataset_20261001.ods,
 * sheet UK_Annual; Open Government Licence v3.0).
 *   https://www.gov.uk/government/statistics/milk-utilisation-by-dairies-in-england-and-wales
 *   https://assets.publishing.service.gov.uk/media/6abd090155bc01d752a7f14d/Milkutil_dataset_20261001.ods
 * Fetched 2026-10-15.
 *
 * Transform: the last row of UK_Annual, which is 2025 (its year cell is stored
 * as the date 2025-07-17); the twelve months of 2025 in UK_Monthly sum to the
 * same liquid milk and cheddar figures, to 0.1. Columns "Disposals of milk
 * for ..." in million litres, rounded to whole numbers. Territorials are "other
 * long life" plus "short life" territorial cheese. Butter is in million cream
 * litres, as the file gives it. Left out: milk powders (suppressed in the file
 * as [x]) and the file's catch-all "other products" (1,987 million litres).
 * Scripts: reference/scripts/F13/gen.py.
 */
export const nestedTreemapDemo: TreemapGroup[] = [
  {
    children: [{ name: "Drinking milk", value: 6035 }],
    name: "Liquid",
  },
  {
    children: [
      { name: "Cheddar", value: 3372 },
      { name: "Territorials", value: 362 },
      { name: "Blue vein", value: 84 },
      { name: "Other cheese", value: 965 },
    ],
    name: "Cheese",
  },
  {
    children: [
      { name: "Butter", value: 409 },
      { name: "Cream", value: 437 },
      { name: "Yoghurt", value: 522 },
      { name: "Condensed milk", value: 329 },
    ],
    name: "Other",
  },
];
