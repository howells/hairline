/** One part of a whole. */
export interface ShareDatum {
  label: string;
  value: number;
}

/** Fieldnote's sign-ups by acquisition channel, July to September 2026, in thousands. */
export const tickDonutDemo: ShareDatum[] = [
  { label: "Search", value: 71 },
  { label: "Word of mouth", value: 57 },
  { label: "Newsletter", value: 38 },
  { label: "Podcasts", value: 27 },
  { label: "Partners", value: 17 },
];
