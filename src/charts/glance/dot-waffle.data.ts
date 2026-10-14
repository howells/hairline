export interface WaffleDatum {
  label: string;
  value: number;
}

/** Fieldnote sign-ups in 2026 by the platform they started on, % of the whole. */
export const dotWaffleDemo: WaffleDatum[] = [
  { label: "Web", value: 42 },
  { label: "iOS", value: 26 },
  { label: "Desktop", value: 19 },
  { label: "Android", value: 13 },
];
