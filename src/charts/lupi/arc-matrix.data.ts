import { rnd } from "../../lib/random";

export interface ArcMatrixData {
  rows: string[];
  cols: string[];
  /** values[row][col] */
  values: number[][];
}

// Fieldnote's eight largest features across its twelve biggest cities:
// weekly active users, in thousands.
const rows = [
  "Notes",
  "Search",
  "Clips",
  "Canvas",
  "Tags",
  "Sync",
  "Share",
  "Comments",
];
const cols = [
  "London",
  "Berlin",
  "Lisbon",
  "Stockholm",
  "Toronto",
  "Austin",
  "Mexico City",
  "São Paulo",
  "Nairobi",
  "Bangalore",
  "Seoul",
  "Melbourne",
];

/** Hand-set headline cells: [row, col, value]. */
const pinned: [number, number, number][] = [
  [0, 0, 41],
  [0, 9, 34],
  [2, 1, 27],
  [1, 0, 18],
  [1, 1, 6],
  [0, 10, 23],
];

const cell = (r: number, c: number) => {
  const hit = pinned.find(([pr, pc]) => pr === r && pc === c);
  if (hit !== undefined) {
    return hit[2];
  }
  // Big features and big cities score high, with a bit of local colour.
  const v =
    19 *
    (1 - r * 0.08) *
    (1 - c * 0.035) *
    (0.05 + 0.95 * rnd(r + 17, c + 5) ** 1.7);
  return Math.max(0, Math.round(v));
};

export const arcMatrixDemo: ArcMatrixData = {
  cols,
  rows,
  values: rows.map((_, r) => cols.map((_c, c) => cell(r, c))),
};
