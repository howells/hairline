export interface MatrixGlanceData {
  columns: string[];
  rows: string[];
  /** values[row][column]. */
  values: number[][];
}

/** Fieldnote, December 2026: % of each plan's weekly users who used each feature. */
export const matrixHeatGlanceDemo: MatrixGlanceData = {
  columns: ["Search", "Clips", "Canvas", "Tags", "Share", "Sync"],
  rows: ["Enterprise", "Business", "Pro", "Plus", "Free"],
  values: [
    [91, 68, 57, 74, 83, 96],
    [88, 63, 51, 67, 77, 94],
    [81, 59, 38, 55, 47, 90],
    [72, 52, 25, 41, 29, 85],
    [59, 33, 8, 22, 13, 48],
  ],
};
