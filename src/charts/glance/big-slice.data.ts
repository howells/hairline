export interface SliceDatum {
  /** How intense the slice is (drives the radius), e.g. minutes per day. */
  intensity: number;
  label: string;
  /** Share of the whole (drives the angle). Any unit; normalised to the total. */
  share: number;
}

/** Fieldnote in December 2026: share of daily users by where they spend most time, and minutes a day there. */
export const bigSliceDemo: SliceDatum[] = [
  { intensity: 52, label: "Notes", share: 36 },
  { intensity: 9, label: "Search", share: 21 },
  { intensity: 38, label: "Canvas", share: 15 },
  { intensity: 16, label: "Clips", share: 12 },
  { intensity: 24, label: "Assistant", share: 9 },
  { intensity: 5, label: "Other", share: 7 },
];
