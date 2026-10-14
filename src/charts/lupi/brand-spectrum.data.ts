export interface SpectrumRow {
  left: string;
  right: string;
  /** Our position, 0 = fully left trait, 1 = fully right trait. */
  us: number;
  /** One position per competitor, in the order of the `competitors` prop. */
  others: number[];
}

/** Three other note-taking apps the panel was shown. */
export const brandSpectrumCompetitors = ["Inkwell", "Quire", "Margin"];

/** Where 140 Fieldnote customers placed each app between paired traits. */
export const brandSpectrumDemo: SpectrumRow[] = [
  { left: "Calm", others: [0.47, 0.63, 0.71], right: "Lively", us: 0.23 },
  {
    left: "Personal",
    others: [0.56, 0.69, 0.83],
    right: "Professional",
    us: 0.37,
  },
  { left: "Simple", others: [0.31, 0.77, 0.86], right: "Powerful", us: 0.61 },
  { left: "Familiar", others: [0.18, 0.34, 0.45], right: "Novel", us: 0.68 },
];
