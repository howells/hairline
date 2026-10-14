export interface DumbbellDatum {
  after: number;
  before: number;
  label: string;
}

/** Fieldnote's median minutes to a first support reply, by feature, before and after the new triage. */
export const dumbbellQueueDemo: DumbbellDatum[] = [
  { after: 10, before: 23, label: "Share" },
  { after: 16, before: 28, label: "Templates" },
  { after: 17, before: 34, label: "Export" },
  { after: 27, before: 39, label: "Canvas" },
  { after: 24, before: 47, label: "Sync" },
];
