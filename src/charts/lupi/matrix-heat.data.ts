/** A grid of values over two discrete dimensions. */
export interface MatrixData {
  /** Row labels; columns use the same labels unless `cols` is given. */
  rows: string[];
  cols?: string[];
  /** values[row][col]; null = no value (e.g. the diagonal). */
  values: (number | null)[][];
}

const features = [
  "Notes",
  "Search",
  "Clips",
  "Canvas",
  "Tags",
  "Sync",
  "Share",
  "Comments",
];

// Upper triangle of Fieldnote's co-usage matrix (% of active accounts using
// both in a month), mirrored below.
const upper: number[][] = [
  [63, 48, 37, 41, 29, 24, 18],
  [42, 26, 38, 22, 17, 12],
  [19, 27, 15, 11, 8],
  [14, 21, 26, 23],
  [16, 9, 6],
  [13, 7],
  [34],
];

const cellAt = (r: number, c: number): number | null => {
  if (r === c) {
    return null;
  }
  const [a, b] = r < c ? [r, c] : [c, r];
  return upper[a]?.[b - a - 1] ?? null;
};

export const matrixHeatDemo: MatrixData = {
  rows: features,
  values: features.map((_, r) => features.map((__, c) => cellAt(r, c))),
};
