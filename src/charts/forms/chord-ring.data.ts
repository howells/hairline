/**
 * O6 Goods exports: what the UK sold to its five largest export markets in
 * 2025, by kind of goods.
 * Source: Office for National Statistics, "Trade in goods: country by
 * commodity" (Open Government Licence), dataset trade, edition time-series,
 * version 65 (released 2026-02-18), https://www.ons.gov.uk/economy/nationalaccounts/balanceofpayments/datasets/uktradecountrybycommodityexports
 * through the ONS API https://api.beta.ons.gov.uk/v1/datasets/trade/editions/time-series/versions/65/observations
 * (UK, direction EX, monthly, GBP million, not seasonally adjusted). Fetched
 * 2026-10-15; every response is saved in reference/raw/O6/api.
 * Transform: each cell is the sum of the twelve months of 2025, rounded to
 * GBP 1 million. Partners: the five countries with the largest 2025 goods
 * exports total (United States including Puerto Rico, Germany, Netherlands,
 * Ireland, France). Goods: the five SITC sections with the largest 2025
 * exports to the whole world, leaving out section 9 (unspecified): 7 Machinery
 * and transport equipment, 5 Chemicals, 8 Miscellaneous manufactures, 6
 * Material manufactures, 3 Fuels; the names are shortened to Machinery,
 * Chemicals, Manufactures, Materials and Fuels. The matrix is symmetric: the
 * first five rows and columns are the partners, the last five the goods, and a
 * ribbon joins a partner to a kind of goods, never two partners or two goods.
 * A group's total is therefore its trade within these five by five.
 */

/** Groups on a ring and the flows between them. */
export interface SharedWork {
  /** Symmetric: `matrix[a][b]` is GBP million of exports between group a and group b. */
  matrix: number[][];
  teams: string[];
}

/** UK goods exports in 2025, GBP million: five partners, five kinds of goods. */
export const sharedWorkDemo: SharedWork = {
  matrix: [
    [0, 0, 0, 0, 0, 27_540, 13_915, 7521, 5129, 1211],
    [0, 0, 0, 0, 0, 17_780, 4623, 3799, 3763, 1497],
    [0, 0, 0, 0, 0, 7331, 3923, 2776, 1676, 9212],
    [0, 0, 0, 0, 0, 5817, 4568, 2940, 2929, 3675],
    [0, 0, 0, 0, 0, 10_206, 4361, 3215, 1783, 1122],
    [27_540, 17_780, 7331, 5817, 10_206, 0, 0, 0, 0, 0],
    [13_915, 4623, 3923, 4568, 4361, 0, 0, 0, 0, 0],
    [7521, 3799, 2776, 2940, 3215, 0, 0, 0, 0, 0],
    [5129, 3763, 1676, 2929, 1783, 0, 0, 0, 0, 0],
    [1211, 1497, 9212, 3675, 1122, 0, 0, 0, 0, 0],
  ],
  teams: [
    "United States",
    "Germany",
    "Netherlands",
    "Ireland",
    "France",
    "Machinery",
    "Chemicals",
    "Manufactures",
    "Materials",
    "Fuels",
  ],
};
