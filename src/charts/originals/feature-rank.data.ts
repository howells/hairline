/**
 * O3 Arable crops: the area of eight arable crops in the United Kingdom,
 * ranked in each of five years.
 * Source: Defra with the Scottish Government, Welsh Government and DAERA,
 * "Agricultural land use in the United Kingdom" (Open Government Licence),
 * https://www.gov.uk/government/statistics/agricultural-land-use-in-the-united-kingdom
 * Fetched 2026-10-15.
 * File: Agricultural-land-use-uk-june25-20251211.ods, sheet Arable_crops (crop
 * areas on agricultural holdings on 1 June, hectares, from the June Survey
 * and Census of Agriculture). Transform: the rows Wheat, Barley, Oilseed rape,
 * Oats, Field beans, Sugar beet, Potatoes and Maize (including fodder and
 * green maize) for 1984, 1994, 2004, 2014 and 2024, in thousands of hectares
 * to 0.1. Not shown: peas for harvesting dry and the other arable crops.
 * Caveat from the source: from 2010 England's figures cover commercial
 * holdings only, so the 2014 and 2024 columns are not strictly on the same
 * footing as the earlier ones. Surveys are samples, subject to sampling error.
 */

/** One crop's area in thousands of hectares, one value per year. */
export interface FeatureUse {
  feature: string;
  weekly: number[];
}

/** The years shown, as broadsheet ticks. */
export const QUARTERS = ["1984", "1994", "2004", "2014", "2024"];

/**
 * Eight arable crops by area, 1984 to 2024. Barley led in 1984; maize climbs
 * from last place to fourth.
 */
export const featureUse: FeatureUse[] = [
  { feature: "Wheat", weekly: [1939.3, 1811.3, 1989.8, 1935.7, 1530.8] },
  { feature: "Barley", weekly: [1979.7, 1107.7, 1007.4, 1079.8, 1193.9] },
  { feature: "Oats", weekly: [105.2, 108.6, 107.8, 137.2, 182] },
  { feature: "Oilseed rape", weekly: [268.6, 404.4, 498.4, 674.6, 293.2] },
  { feature: "Potatoes", weekly: [198.4, 164.1, 148.4, 140.5, 118.4] },
  { feature: "Sugar beet", weekly: [199.1, 194.8, 153.9, 116.3, 102.8] },
  { feature: "Field beans", weekly: [32.4, 149.3, 179.2, 107.1, 135.4] },
  { feature: "Maize", weekly: [15.5, 94.2, 117.6, 183.5, 266.4] },
];
