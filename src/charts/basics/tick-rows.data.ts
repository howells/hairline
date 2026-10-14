/** A labelled count. */
export interface CountDatum {
  label: string;
  value: number;
}

/** Workspaces with each integration connected, September 2026, in thousands. */
export const tickRowsDemo: CountDatum[] = [
  { label: "Google Drive", value: 31 },
  { label: "Slack", value: 26 },
  { label: "Dropbox", value: 19 },
  { label: "Zoom", value: 15 },
  { label: "GitHub", value: 10 },
  { label: "Figma", value: 6 },
];
