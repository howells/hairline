/** One plan's annual recurring revenue, in millions of dollars. */
export interface PlanRevenue {
  plan: string;
  /** The same plan a year earlier, end of 2025. */
  prior: number;
  revenue: number;
}

/**
 * Fieldnote annual recurring revenue by paid plan, end of 2026: $18.4m, up
 * from $14.9m a year earlier, with Business and Enterprise together about 55%
 * of it. Enterprise grew fastest. Free pays nothing.
 */
export const planRevenue: PlanRevenue[] = [
  { plan: "Enterprise", prior: 4.1, revenue: 5.8 },
  { plan: "Pro", prior: 4.4, revenue: 5.1 },
  { plan: "Business", prior: 3.4, revenue: 4.3 },
  { plan: "Plus", prior: 3, revenue: 3.2 },
];
