/** A named point. */
export interface PlumbDatum {
  label: string;
  x: number;
  y: number;
}

/**
 * Fieldnote's twelve features: the share of weekly active users who use each
 * (%) against its satisfaction score, September 2026.
 */
export const plumbScatterDemo: PlumbDatum[] = [
  { label: "Notes", x: 92, y: 74 },
  { label: "Search", x: 78, y: 81 },
  { label: "Clips", x: 61, y: 69 },
  { label: "Canvas", x: 44, y: 88 },
  { label: "Tags", x: 52, y: 57 },
  { label: "Sync", x: 70, y: 41 },
  { label: "Share", x: 38, y: 63 },
  { label: "Comments", x: 29, y: 66 },
  { label: "Templates", x: 34, y: 72 },
  { label: "Calendar", x: 21, y: 54 },
  { label: "Export", x: 17, y: 47 },
  { label: "Assistant", x: 26, y: 79 },
];
