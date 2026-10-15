/** A step adds or removes `value`; a total draws the running level from the floor (its `value` is optional). */
export interface WaterfallDatum {
  label: string;
  total?: boolean;
  value?: number;
}

/**
 * F9 Population change. How the population of England and Wales changed in the
 * year to mid-2025: births and deaths, net migration from abroad, and everything
 * else, ending at the year's growth of 224,874 people (from 61,785,119 to
 * 62,009,993).
 *
 * Source: Office for National Statistics, "Estimates of the population for
 * England and Wales", mid-2011 to mid-2025 detailed time series, sheet MYEB3,
 * estimated components of population change by local authority (Open
 * Government Licence v3.0).
 *   https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/estimatesofthepopulationforenglandandwales
 *   https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/populationandmigration/populationestimates/datasets/estimatesofthepopulationforenglandandwales/mid2011tomid2025detailedtimeseries/myebtablesenglandwales20112025.xlsx
 * Fetched 2026-10-15.
 *
 * Transform: add up the 318 local authorities (country E or W) for the columns
 * births_2025 (587,976), deaths_2025 (568,352), international_net_2025
 * (211,691), internal_net_2025 (-5,940) and other_change_2025
 * (-501). "Other" is internal_net plus other_change (moves to and
 * from Scotland and Northern Ireland, and armed forces and dependants): -6,441.
 * The steps sum exactly to population_2025 minus population_2024. Scripts:
 * reference/scripts/F9/sum.py and gen.py.
 */
export const rungWaterfallDemo: WaterfallDatum[] = [
  { label: "Births", value: 587_976 },
  { label: "Deaths", value: -568_352 },
  { label: "Migration", value: 211_691 },
  { label: "Other", value: -6441 },
  { label: "Growth", total: true },
];
