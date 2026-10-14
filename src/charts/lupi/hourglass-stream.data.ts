/** One funnel stage and how many people reached it. */
export interface StageDatum {
  label: string;
  value: number;
}

/** Fieldnote's 2026 trial funnel, from a first visit to a paid plan. */
export const hourglassDemo: StageDatum[] = [
  { label: "Site visits", value: 52_000 },
  { label: "Trials", value: 9800 },
  { label: "Wrote a note", value: 4150 },
  { label: "Back in month 2", value: 2300 },
  { label: "Subscribed", value: 1250 },
];
