/**
 * The twelve most common named checkmates among Lichess's puzzles.
 *
 * Source: the Lichess open database of puzzles (CC0),
 * https://database.lichess.org/lichess_db_puzzle.csv.zst, 6,157,341 rated
 * puzzles, last updated 2026-10-05 by the site. Fetched 2026-10-15 (saved to
 * reference/raw/L2/).
 *
 * Transform: each puzzle carries a space-separated list of themes. Every
 * theme is counted once per puzzle that carries it. Of the themes that name a
 * mating pattern (those ending "Mate", leaving out the "mateIn1" to "mateIn5"
 * depth themes), the twelve with the most puzzles are kept: backRankMate,
 * pillsburysMate, operaMate, smotheredMate, epauletteMate, cornerMate,
 * hookMate, swallowstailMate, triangleMate, arabianMate, anastasiaMate and
 * morphysMate. `value` is the count of puzzles. A puzzle can carry more than
 * one theme, so the counts overlap. Scripts: reference/scripts/L2/themes.py
 * and emit.py.
 */
export interface DotCascadeDatum {
  label: string;
  value: number;
}

/** Puzzles carrying each named mate. */
export const dotCascadeDemo: DotCascadeDatum[] = [
  { label: "Morphy's", value: 7133 },
  { label: "Anastasia's", value: 7524 },
  { label: "Arabian", value: 7560 },
  { label: "Triangle", value: 7741 },
  { label: "Swallow's tail", value: 8397 },
  { label: "Hook", value: 10_729 },
  { label: "Corner", value: 10_782 },
  { label: "Epaulette", value: 22_646 },
  { label: "Smothered", value: 24_332 },
  { label: "Opera", value: 63_940 },
  { label: "Pillsbury's", value: 67_644 },
  { label: "Back rank", value: 208_093 },
];
