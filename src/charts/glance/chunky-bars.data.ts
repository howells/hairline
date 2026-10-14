export interface ChunkyDatum {
  label: string;
  value: number;
}

/** Fieldnote MRR by paid plan, December 2026, $K (about $18.4m ARR). */
export const chunkyBarsDemo: ChunkyDatum[] = [
  { label: "Plus", value: 226 },
  { label: "Pro", value: 464 },
  { label: "Business", value: 512 },
  { label: "Enterprise", value: 331 },
];
