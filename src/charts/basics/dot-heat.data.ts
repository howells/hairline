/** A rows × columns grid of counts, e.g. weekday × hour. */
export interface DotHeatData {
  columns: string[];
  rows: string[];
  values: number[][];
}

/** Fieldnote's support tickets in an average week of September 2026, by weekday and hour. */
export const dotHeatDemo: DotHeatData = {
  columns: [
    "7:00",
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ],
  rows: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  values: [
    [3, 9, 21, 18, 15, 11, 12, 13, 11, 9, 6, 3],
    [2, 7, 15, 16, 13, 9, 11, 12, 10, 8, 5, 2],
    [2, 6, 13, 14, 12, 8, 10, 11, 10, 7, 4, 2],
    [2, 6, 12, 14, 11, 8, 11, 12, 9, 7, 4, 1],
    [1, 5, 10, 11, 9, 6, 7, 6, 5, 3, 2, 1],
    [0, 1, 2, 3, 3, 3, 2, 2, 2, 1, 1, 0],
    [0, 0, 1, 2, 3, 3, 3, 4, 4, 3, 2, 1],
  ],
};
