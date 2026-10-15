/**
 * O2 Everyday prices: four goods in 2014 and in 2024.
 * Source: Office for National Statistics, Average prices (RPI) in dataset
 * MM23, https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/czms/mm23
 * Fetched 2026-10-15 (release of 16 September 2026).
 * File: the full MM23 CSV (mm23.csv), series CZMS (draught lager, per pint),
 * CZOH (white loaf, sliced, 800g), CZNT (milk, pasteurised, per pint) and
 * CZNQ (tea bags, per 250g). The series' own annual rows "2014" and "2024"
 * are the figures, in pence. Transform: pence divided by 100 to pounds, no
 * other change. The ONS egg series (CZNU) stops in January 2022, so tea
 * stands in for the dozen eggs the plan had.
 */

/** One good's average price in pounds, and the same good ten years earlier. */
export interface PlanRevenue {
  /** The good's name. */
  plan: string;
  /** Its average price in 2014, in pounds. */
  prior: number;
  /** Its average price in 2024, in pounds. */
  revenue: number;
}

/**
 * Average shop prices, 2014 and 2024: a pint of lager is £3.37 then and
 * £4.77 now; a loaf £1.16 then and £1.40 now.
 */
export const planRevenue: PlanRevenue[] = [
  { plan: "Lager", prior: 3.37, revenue: 4.77 },
  { plan: "Tea", prior: 1.97, revenue: 2.62 },
  { plan: "Loaf", prior: 1.16, revenue: 1.4 },
  { plan: "Milk", prior: 0.462, revenue: 0.651 },
];
