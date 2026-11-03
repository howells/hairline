/** One metric: a measure against a target, over three qualitative ranges. */
export interface BulletDatum {
  label: string;
  /**
   * The upper edge of each of the three ranges, rising; the last is the end
   * of the row's own scale.
   */
  ranges: [number, number, number];
  target: number;
  value: number;
}

/**
 * O12 Bullet. Made-up year-to-date figures for a supplier against plan, each
 * on its own scale: the ranges are the plan's poor, fair and good.
 */
export const bulletDemo: BulletDatum[] = [
  { label: "Orders", ranges: [600, 850, 1000], target: 1000, value: 820 },
  { label: "Members", ranges: [1800, 2700, 3500], target: 3000, value: 3100 },
  { label: "Brands", ranges: [30, 45, 60], target: 60, value: 44 },
  { label: "Searches", ranges: [0.8, 1.4, 2], target: 2, value: 1.2 },
];
