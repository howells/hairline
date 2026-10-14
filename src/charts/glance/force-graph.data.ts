export interface ForceNode {
  id: string;
  value: number;
}

export interface ForceLink {
  source: string;
  target: string;
  value: number;
}

export interface ForceGraphData {
  nodes: ForceNode[];
  links: ForceLink[];
}

/** Fieldnote's integrations by syncs a month (thousands), around the app itself. */
export const forceGraphDemo: ForceGraphData = {
  links: [
    { source: "Fieldnote", target: "Google Drive", value: 9 },
    { source: "Fieldnote", target: "Email", value: 8 },
    { source: "Fieldnote", target: "Calendar", value: 7 },
    { source: "Fieldnote", target: "Dropbox", value: 4 },
    { source: "Fieldnote", target: "Readwise", value: 3 },
    { source: "Fieldnote", target: "Notion import", value: 2 },
    { source: "Fieldnote", target: "Zotero", value: 1 },
    { source: "Calendar", target: "Email", value: 1 },
    { source: "Readwise", target: "Zotero", value: 1 },
  ],
  nodes: [
    { id: "Fieldnote", value: 1486 },
    { id: "Google Drive", value: 412 },
    { id: "Email", value: 356 },
    { id: "Calendar", value: 298 },
    { id: "Dropbox", value: 164 },
    { id: "Readwise", value: 121 },
    { id: "Notion import", value: 88 },
    { id: "Zotero", value: 47 },
  ],
};
