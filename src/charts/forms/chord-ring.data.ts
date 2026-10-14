/** Teams and the projects each pair shared over the year. */
export interface SharedWork {
  /** Symmetric: `matrix[a][b]` projects shared by teams a and b. */
  matrix: number[][];
  teams: string[];
}

/** Fieldnote's eight engineering teams and the projects they shared, 2026. */
export const sharedWorkDemo: SharedWork = {
  matrix: [
    [0, 14, 11, 5, 13, 4, 2, 9],
    [14, 0, 5, 7, 3, 6, 13, 8],
    [11, 5, 0, 9, 6, 2, 1, 4],
    [5, 7, 9, 0, 1, 3, 5, 2],
    [13, 3, 6, 1, 0, 2, 1, 7],
    [4, 6, 2, 3, 2, 0, 2, 3],
    [2, 13, 1, 5, 1, 2, 0, 3],
    [9, 8, 4, 2, 7, 3, 3, 0],
  ],
  teams: [
    "Product",
    "Platform",
    "Growth",
    "Data",
    "Design",
    "Support",
    "Infra",
    "Mobile",
  ],
};
