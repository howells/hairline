import { logNormals } from "./util-b";

export interface JitterGroup {
  label: string;
  /** One value per record. */
  values: number[];
}

/** `n` log-normal samples, dropping any that land past `cap`. */
const capped = (
  seed: number,
  n: number,
  med: number,
  sigma: number,
  cap: number
) =>
  logNormals(seed, n * 3, med, sigma)
    .filter((v) => v <= cap && v >= 0.05)
    .slice(0, n);

/** Fieldnote support, December 2026: hours to close, one value per ticket, by how it came in. */
export const jitterStripDemo: JitterGroup[] = [
  { label: "Chat", values: capped(21, 30, 1.2, 0.75, 6) },
  { label: "Email", values: capped(22, 104, 5, 0.55, 19) },
  { label: "Forum", values: capped(23, 78, 11, 0.5, 29) },
  {
    label: "Escalated",
    values: [...capped(24, 46, 19, 0.45, 40), 45.5, 46.8],
  },
];
