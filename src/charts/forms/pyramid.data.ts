/** One band: its name and a value for each side. */
export interface PyramidDatum {
  label: string;
  left: number;
  right: number;
}

/**
 * O13 Pyramid. Made-up shares of a supplier's members by age band, at home
 * addresses (left) against workplaces (right); each side sums to 100.
 */
export const pyramidDemo: PyramidDatum[] = [
  { label: "65+", left: 6, right: 9 },
  { label: "55–64", left: 11, right: 14 },
  { label: "45–54", left: 17, right: 19 },
  { label: "35–44", left: 24, right: 21 },
  { label: "25–34", left: 28, right: 23 },
  { label: "18–24", left: 14, right: 14 },
];

export const pyramidSides: [string, string] = ["Homes", "Workplaces"];
