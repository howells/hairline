/** One bin: [x0, x1) and how many records fell in it. */
export interface HistBin {
  count: number;
  x0: number;
  x1: number;
}

/** Fieldnote's session lengths in five-minute bins, as a percentage of September's sessions. */
export const rungHistogramDemo: HistBin[] = [
  9, 24, 19, 14, 10, 7, 5, 4, 3, 2, 2, 1,
].map((count, i) => ({
  count,
  x0: i * 5,
  x1: i * 5 + 5,
}));

/** Where the cumulative count crosses half, interpolated inside its bin. */
export const binMedian = (bins: readonly HistBin[]): number => {
  let total = 0;
  for (const b of bins) {
    total += b.count;
  }
  let run = 0;
  for (const b of bins) {
    if (run + b.count >= total / 2) {
      return b.x0 + ((total / 2 - run) / b.count) * (b.x1 - b.x0);
    }
    run += b.count;
  }
  return bins.at(-1)?.x1 ?? 0;
};
