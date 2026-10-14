/** One category measured in two periods. */
export interface PairDatum {
  current: number;
  label: string;
  previous: number;
}

/** Fieldnote's monthly active users by platform (thousands), September 2026 against September 2025. */
export const pairedRungsDemo: PairDatum[] = [
  { current: 175, label: "Web", previous: 130 },
  { current: 115, label: "Desktop", previous: 85 },
  { current: 75, label: "iOS", previous: 50 },
  { current: 45, label: "Android", previous: 35 },
];
