/**
 * L16 Letter pairs: which letter comes next, for the eight commonest letters.
 *
 * Sources: Peter Norvig, "English Letter Frequency Counts: Mayzner Revisited"
 * (letter ranking, from Google Books Ngrams, 3.56 trillion letters), and his
 * two-letter sequence counts, count_2l.txt (data files used under his
 * published terms; the counts are facts).
 * Pages: https://norvig.com/mayzner.html
 * File: https://norvig.com/ngrams/count_2l.txt
 * Fetched 2026-10-15.
 *
 * Transform: the eight commonest letters are the first eight rows of the
 * "Letter Counts" table (E T A O I N S R). For each, every count of that
 * letter followed by another letter inside a word is totalled over all 26
 * following letters; each of the eight following letters is then that count
 * as a percentage of the total, rounded to a whole number. Row = the first
 * letter, column = the letter after it, so rows do not sum to 100 (the other
 * eighteen letters follow too). The diagonal is real (EE, TT and so on).
 * Script: reference/scripts/L16/bigrams.py.
 */

/** A grid of values over two discrete dimensions. */
export interface MatrixData {
  /** Row labels; columns use the same labels unless `cols` is given. */
  rows: string[];
  cols?: string[];
  /** values[row][col]; null = no value (e.g. the diagonal). */
  values: (number | null)[][];
}

const letters = ["E", "T", "A", "O", "I", "N", "S", "R"];

/** Per cent of the row letter's followers that are the column letter. */
const values: number[][] = [
  [4, 6, 7, 2, 2, 10, 13, 16],
  [14, 3, 8, 12, 14, 0, 5, 5],
  [0, 14, 0, 0, 3, 18, 8, 12],
  [1, 6, 2, 3, 1, 18, 4, 16],
  [5, 11, 4, 9, 0, 25, 10, 3],
  [11, 16, 7, 7, 6, 2, 7, 1],
  [14, 19, 8, 8, 10, 1, 8, 1],
  [24, 7, 10, 10, 11, 3, 7, 2],
];

export const matrixHeatDemo: MatrixData = {
  rows: letters,
  values,
};
