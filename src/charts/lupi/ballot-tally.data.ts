/** One option on a multi-select ballot and how many of the sample picked it. */
export interface TallyDatum {
  label: string;
  value: number;
}

/** "What gets in the way of your work?" Fieldnote's 2026 survey; pick any. */
export const ballotTallyDemo: TallyDatum[] = [
  { label: "Notes I never find again", value: 58 },
  { label: "Too many tools", value: 47 },
  { label: "Meetings eat the day", value: 39 },
  { label: "Losing context between projects", value: 26 },
];
