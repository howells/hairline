export interface DivergingDatum {
  label: string;
  value: number;
}

/** Fieldnote's net change in weekly users by feature, Q4 2026, thousands. */
export const divergingBarDemo: DivergingDatum[] = [
  { label: "Assistant", value: 41 },
  { label: "Canvas", value: 23 },
  { label: "Search", value: 15 },
  { label: "Comments", value: 8 },
  { label: "Templates", value: -4 },
  { label: "Export", value: -9 },
  { label: "Calendar", value: -14 },
];
