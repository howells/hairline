/** One category split into up to three parts, bottom part first. */
export interface StackDatum {
  label: string;
  parts: number[];
}

/** Fieldnote's incidents in 2026 so far, by service, split by cause. */
export const stackedRungsDemo: StackDatum[] = [
  { label: "API", parts: [16, 10, 8] },
  { label: "Sync", parts: [12, 8, 10] },
  { label: "Search", parts: [10, 8, 3] },
  { label: "Assistant", parts: [8, 3, 1] },
];

/** Series names for the demo, bottom (darkest) first. */
export const stackedRungsSeries = ["Deploy", "Config", "Capacity"];
