export interface MorphDatum {
  label: string;
  /** Size: area in the scatter, height in the bars, angle in the ring. */
  value: number;
  /** Scatter x: minutes a week per user. */
  x: number;
  /** Scatter y: growth this year, %. */
  y: number;
}

/** Fieldnote's twelve features: weekly users (k), minutes a week, growth. */
export const scatterMorphDemo: MorphDatum[] = [
  { label: "Notes", value: 312, x: 96, y: 14 },
  { label: "Search", value: 241, x: 38, y: 22 },
  { label: "Clips", value: 188, x: 56, y: 5 },
  { label: "Canvas", value: 143, x: 74, y: 37 },
  { label: "Tags", value: 121, x: 14, y: 3 },
  { label: "Sync", value: 104, x: 6, y: 18 },
  { label: "Share", value: 86, x: 20, y: 33 },
  { label: "Comments", value: 72, x: 26, y: 46 },
  { label: "Templates", value: 55, x: 30, y: -4 },
  { label: "Calendar", value: 43, x: 62, y: 28 },
  { label: "Export", value: 29, x: 8, y: -8 },
  { label: "Assistant", value: 38, x: 44, y: 54 },
];
