export interface RungDatum {
  label: string;
  value: number;
}

/** Fieldnote's weekly active users by feature, September 2026, in thousands. */
export const rungBarsDemo: RungDatum[] = [
  { label: "Notes", value: 44 },
  { label: "Search", value: 35 },
  { label: "Clips", value: 26 },
  { label: "Canvas", value: 19 },
  { label: "Tags", value: 14 },
  { label: "Sync", value: 9 },
];
