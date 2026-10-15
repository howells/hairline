/**
 * Years of life expectancy gained by men at birth since 1980-82, in each of
 * the 36 three-year periods from 1987-89 to 2022-24, in the four countries of
 * the UK, the biggest gain first.
 *
 * Source: ONS national life tables, one reference workbook per country, each a
 * sheet per three-year period with "ex" (period expectation of life) by age
 * for males and females (OGL):
 * https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/lifeexpectancies/datasets/nationallifetablesenglandreferencetables
 * and the same path ending nationallifetableswalesreferencetables,
 * nationallifetablesscotlandreferencetables and
 * nationallifetablesnorthernirelandreferencetables (files nlte, nltw, nlts and
 * nltni 198020223.xlsx, published 10 December 2025).
 * Fetched 2026-10-15 (saved to reference/raw/L8/).
 *
 * Transform: in each country's workbook, the male "ex" at age 0 is read from
 * every period sheet. `values` is that figure minus the same country's
 * figure for 1980-82 (England 71.08, Wales 70.52, Scotland 69.11, Northern
 * Ireland 69.15), to two decimals, so a dot's area is the gain. Periods run
 * oldest first, six to a row of the plane. The periods overlap (each shares
 * two years with the next). The dip in 2020-22 is the pandemic. Groups are
 * ordered by the gain in 2022-24. Script: reference/scripts/L8/extract.py.
 */
export interface DottyGroup {
  label: string;
  /** grid × grid values, row-major (e.g. 36 periods for a 6 × 6 plane). */
  values: number[];
}

const PERIODS = [
  "1987–89",
  "1988–90",
  "1989–91",
  "1990–92",
  "1991–93",
  "1992–94",
  "1993–95",
  "1994–96",
  "1995–97",
  "1996–98",
  "1997–99",
  "1998–00",
  "1999–01",
  "2000–02",
  "2001–03",
  "2002–04",
  "2003–05",
  "2004–06",
  "2005–07",
  "2006–08",
  "2007–09",
  "2008–10",
  "2009–11",
  "2010–12",
  "2011–13",
  "2012–14",
  "2013–15",
  "2014–16",
  "2015–17",
  "2016–18",
  "2017–19",
  "2018–20",
  "2019–21",
  "2020–22",
  "2021–23",
  "2022–24",
];

/** The period of cell `k` (0 is 1987-89): "1987–89". */
export const dottyPeriodLabel = (k: number) => PERIODS[k] ?? "";

/** Years gained by men at birth since 1980-82, by country and period. */
export const dottyMatrixDemo: DottyGroup[] = [
  {
    label: "Northern Ireland",
    values: [
      2.33, 2.58, 2.98, 3.4, 3.58, 3.85, 3.96, 4.36, 4.67, 5.01, 5.12, 5.32,
      5.64, 6.04, 6.4, 6.67, 6.84, 6.93, 7, 7.18, 7.52, 7.82, 8.25, 8.54, 8.85,
      9.11, 9.16, 9.39, 9.32, 9.55, 9.64, 9.56, 9.32, 9.27, 9.6, 9.63,
    ],
  },
  {
    label: "England",
    values: [
      1.57, 1.77, 2, 2.29, 2.51, 2.85, 3.02, 3.27, 3.43, 3.66, 3.92, 4.21, 4.53,
      4.82, 5.05, 5.36, 5.71, 6.08, 6.37, 6.62, 6.92, 7.23, 7.63, 7.93, 8.12,
      8.25, 8.26, 8.33, 8.35, 8.4, 8.51, 8.15, 7.91, 7.75, 7.99, 8.31,
    ],
  },
  {
    label: "Scotland",
    values: [
      1.44, 1.65, 1.95, 2.27, 2.36, 2.59, 2.77, 2.97, 3.13, 3.29, 3.53, 3.74,
      3.99, 4.21, 4.4, 4.68, 5.12, 5.49, 5.69, 5.89, 6.24, 6.69, 7.1, 7.4, 7.67,
      7.95, 8.01, 7.99, 7.93, 7.95, 8.03, 7.68, 7.46, 7.42, 7.67, 8.01,
    ],
  },
  {
    label: "Wales",
    values: [
      1.81, 2.06, 2.28, 2.6, 2.72, 2.91, 2.9, 3.18, 3.29, 3.67, 3.78, 4.06, 4.3,
      4.74, 4.95, 5.26, 5.58, 6.04, 6.16, 6.35, 6.56, 6.99, 7.31, 7.55, 7.63,
      7.85, 7.84, 7.84, 7.7, 7.65, 7.82, 7.59, 7.46, 7.41, 7.54, 7.73,
    ],
  },
];
