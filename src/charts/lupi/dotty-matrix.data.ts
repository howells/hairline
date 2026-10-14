import { rnd } from "../../lib/random";

export interface DottyGroup {
  label: string;
  /** grid × grid values, row-major (e.g. 36 weeks for a 6 × 6 plane). */
  values: number[];
}

/**
 * Fieldnote teams, tasks closed in each of the last 36 weeks. Busier teams
 * first: the top plane is the most important.
 */
const squads: [string, number, number][] = [
  ["Product", 17, 0.1],
  ["Data", 12, 0.16],
  ["Design", 10, 0.22],
  ["Support", 7, 0.28],
];

export const dottyMatrixDemo: DottyGroup[] = squads.map(
  ([label, peak, idle], g) => ({
    label,
    values: Array.from({ length: 36 }, (_, k) =>
      rnd(g + 21, k) < idle
        ? 0
        : Math.round(peak * (0.25 + 0.75 * rnd(k, g + 31)))
    ),
  })
);
