import { mulberry32 } from "../../lib/random";

export interface ViolinGroup {
  label: string;
  /** One value per record. */
  values: number[];
}

/** Skewed samples between `lo` and `hi`, peaking near `mode`. Deterministic. */
const skewed = (
  seed: number,
  n: number,
  lo: number,
  mode: number,
  hi: number
) => {
  const r = mulberry32(seed);
  const c = (mode - lo) / (hi - lo);
  const triangular = () => {
    const u = r();
    return u < c
      ? lo + Math.sqrt(u * (hi - lo) * (mode - lo))
      : hi - Math.sqrt((1 - u) * (hi - lo) * (hi - mode));
  };
  // Blend of two triangular draws: a rounder hump than one alone.
  return Array.from({ length: n }, () => (triangular() * 2 + triangular()) / 3);
};

/** Fieldnote email support, December 2026: hours to first reply, one value per ticket, by plan. */
export const violinDemo: ViolinGroup[] = [
  { label: "Enterprise", values: skewed(41, 120, 0, 0.8, 3.2) },
  { label: "Business", values: skewed(42, 210, 0, 1.9, 5.8) },
  { label: "Plus", values: skewed(43, 260, 0.3, 4.6, 10.5) },
  { label: "Free", values: skewed(44, 300, 0.8, 11, 22) },
];
