/** A step adds or removes `value`; a total draws the running level from the floor (its `value` is optional). */
export interface WaterfallDatum {
  label: string;
  total?: boolean;
  value?: number;
}

/**
 * F9 Where carbon goes. The world's carbon dioxide in an average year of
 * 2015 to 2024, in billions of tonnes of CO2: what fossil fuels and land use
 * emit (40.9), what the ocean and plants take back up, and what is left in
 * the air (20.4), about half.
 *
 * Source: Global Carbon Project, Global Carbon Budget 2025 (Friedlingstein et
 * al., 2025, Earth System Science Data), Global_Carbon_Budget_2025v1.0.xlsx,
 * sheet "Global Carbon Budget". Freely available; cite the Global Carbon
 * Budget 2025 (ICOS licence CC BY 4.0).
 *   https://globalcarbonbudget.org/datahub/the-latest-gcb-data-2025/
 *   https://doi.org/10.18160/GCP-2025
 * Fetched 2026-10-16.
 *
 * Transform: mean of the ten years 2015 to 2024 for each column, in GtC.
 * Fossil is "fossil emissions excluding carbonation" less "cement
 * carbonation sink" (10.012 - 0.210 = 9.802), as the budget's headline
 * fossil figure is net of carbonation; land use is "land-use change
 * emissions" (1.372); ocean and plants are "ocean sink" (3.221) and "land
 * sink" (2.363). Each is multiplied by 3.664 to give GtCO2, as the sheet
 * directs, and rounded to 0.1 so the totals add up as shown: 35.9, 5.0,
 * 11.8 and 8.7. The closing total is the level reached, 20.4, as is measured
 * "atmospheric growth" (20.42); the budget imbalance (0.06) is left out. Scripts: reference/scripts/F9-gcb/sheet.py and budget.py.
 */
export const rungWaterfallDemo: WaterfallDatum[] = [
  { label: "Fossil", value: 35.9 },
  { label: "Land use", value: 5 },
  { label: "Emitted", total: true },
  { label: "Ocean", value: -11.8 },
  { label: "Plants", value: -8.7 },
  { label: "Air", total: true },
];
