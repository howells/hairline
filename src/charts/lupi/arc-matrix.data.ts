/**
 * Hectares of new woodland planted each year in the four countries of the UK,
 * 2014/15 to 2025/26.
 *
 * Source: Forest Research, Provisional Woodland Statistics 2026 (Official
 * Statistics, published 25 June 2026, updated 16 July 2026), workbook
 * pws_2026-06-25.ods, sheet "Data_for_Figure_3" (area of new planting, UK,
 * thousands of hectares, years ending 31 March): Crown copyright, Open
 * Government Licence v3.0.
 * https://cdn.forestresearch.gov.uk/2026/07/pws_2026-06-25.ods
 * (publication page: https://www.forestresearch.gov.uk/tools-and-resources/statistics/publications/woodland-statistics/)
 * Fetched 2026-10-15 (saved to reference/raw/L4/).
 *
 * Transform: the rows for years ending March 2015 to March 2026 are read, so
 * "2014/15" is the year ending 31 March 2015. Each figure, in thousands of
 * hectares to two decimals, is multiplied by 1,000 to give hectares. Rows are
 * ordered by their twelve-year total: Scotland 106.4 thousand ha, England
 * 33.2, Wales 5.8, Northern Ireland 3.7. The workbook marks 2023/24 as
 * revised ([r]); the figures are used as published.
 * Script: reference/scripts/L4/emit.py.
 */
export interface ArcMatrixData {
  rows: string[];
  cols: string[];
  /** values[row][col] */
  values: number[][];
}

const rows = ["Scotland", "England", "Wales", "Northern Ireland"];
const cols = [
  "2014/15",
  "2015/16",
  "2016/17",
  "2017/18",
  "2018/19",
  "2019/20",
  "2020/21",
  "2021/22",
  "2022/23",
  "2023/24",
  "2024/25",
  "2025/26",
];

/** Hectares of new woodland by country (rows) and year (columns). */
const values: number[][] = [
  [
    7560, 4630, 4760, 7140, 11_210, 11_050, 10_660, 10_480, 8190, 15_040, 8470,
    7220,
  ],
  [2430, 820, 1680, 1500, 1410, 2340, 2050, 2260, 3130, 4590, 5770, 5250],
  [100, 110, 410, 200, 670, 80, 290, 620, 1190, 640, 840, 680],
  [210, 50, 210, 210, 240, 200, 280, 540, 450, 430, 500, 330],
];

export const arcMatrixDemo: ArcMatrixData = { cols, rows, values };
