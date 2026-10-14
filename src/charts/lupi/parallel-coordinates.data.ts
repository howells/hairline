/** One vertical axis: which value it reads and the range it spans (bottom → top). */
export interface ParallelAxis {
  key: string;
  label: string;
  domain: [number, number];
  /** Suffix for this axis's values, e.g. "%" or "k". */
  unit?: string;
}

/** One entity: a value for every axis key. */
export interface ParallelRow {
  name: string;
  values: Record<string, number>;
}

export interface ParallelData {
  axes: ParallelAxis[];
  rows: ParallelRow[];
}

const row = (
  name: string,
  users: number,
  rating: number,
  kept: number,
  growth: number
): ParallelRow => ({
  name,
  values: { growth, kept, rating, users },
});

/** Fieldnote's twelve features in December 2026. */
export const parallelDemo: ParallelData = {
  axes: [
    { domain: [0, 300], key: "users", label: "Weekly users", unit: "k" },
    { domain: [3, 5], key: "rating", label: "Rating" },
    { domain: [30, 90], key: "kept", label: "Kept at week 8", unit: "%" },
    { domain: [-10, 80], key: "growth", label: "Growth", unit: "%" },
  ],
  rows: [
    row("Notes", 290, 4.5, 84, 12),
    row("Search", 210, 4.1, 79, 18),
    row("Clips", 150, 4.4, 66, 22),
    row("Canvas", 110, 4.2, 61, 31),
    row("Tags", 120, 3.9, 72, 4),
    row("Sync", 95, 3.6, 77, 8),
    row("Share", 70, 4, 52, 15),
    row("Comments", 55, 3.8, 49, 11),
    row("Templates", 48, 4.3, 44, -3),
    row("Calendar", 32, 3.7, 41, 27),
    row("Export", 20, 3.5, 36, -6),
    row("Assistant", 44, 4.7, 68, 74),
  ],
};
