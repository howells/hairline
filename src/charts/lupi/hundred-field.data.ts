/** One group's share of the whole, in units (people in a hundred). */
export interface ShareDatum {
  label: string;
  value: number;
}

/** How 100 Fieldnote users feel about it, from the 2026 customer survey. */
export const hundredFieldDemo: ShareDatum[] = [
  { label: "Devoted", value: 38 },
  { label: "Curious", value: 31 },
  { label: "Wavering", value: 20 },
  { label: "Lapsed", value: 11 },
];
