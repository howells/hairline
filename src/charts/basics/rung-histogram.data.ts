/** One bin: [x0, x1) and how many records fell in it. */
export interface HistBin {
  count: number;
  x0: number;
  x1: number;
}

/**
 * London Marathon 2016 (24 April 2016): mass-event finishers in five-minute
 * bins of finish time, 2:30 to 7:00, as a count of runners. Edges are finish
 * time in minutes, so 180 is 3:00 (the file does not say gun or chip time).
 *
 * Source: AndrewMillerOnline/marathon-results (MIT licence), a public GitHub
 * dataset of marathon results gathered from the race's own results site, file
 * London/results-2014-2018.csv. No login or token needed.
 *   https://github.com/AndrewMillerOnline/marathon-results
 *   https://raw.githubusercontent.com/AndrewMillerOnline/marathon-results/main/London/results-2014-2018.csv
 * Fetched 2026-10-15.
 *
 * Transform: keep rows with year = 2016 (38,983 rows). Drop the 44 elite-field
 * rows (event=ELIT in details_url) and 79 rows with no valid half and finish
 * time pair (the finish is blank or not after halfway), leaving 38,860 mass
 * finishers. Rows for 2015 to 2018 are one field short (no club value), so the
 * finish time sits in the column headed time_half and the half-way time in the
 * one headed division; the time_full column is empty on every such row. Each
 * finish time is floored to whole minutes and counted in [x0, x1) five-minute
 * bins from 150 to 420 minutes. 72 finishers under 2:30 and 442 at 7:00
 * or later fall outside the window and are not drawn, so the 54 bins hold
 * 38,346. Runners tied on place stay as separate records (each has its own id).
 * Cross-check: https://www.race-insight.com/en/results/london-marathon-2016
 * (fetched 2026-10-15) lists 38,983 participants, the same as the file's 38,983 rows.
 */
export const rungHistogramDemo: HistBin[] = [
  79, 157, 243, 285, 409, 839, 512, 615, 744, 746, 772, 1058, 975, 1019, 1203,
  1308, 1390, 1815, 1210, 1248, 1239, 1341, 1334, 1272, 1328, 1164, 1184, 1149,
  1134, 1178, 895, 753, 801, 703, 714, 620, 581, 505, 462, 438, 383, 417, 276,
  245, 236, 208, 194, 208, 151, 131, 124, 121, 108, 122,
].map((count, i) => ({
  count,
  x0: 150 + i * 5,
  x1: 150 + i * 5 + 5,
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
