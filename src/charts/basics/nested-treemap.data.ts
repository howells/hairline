export interface TreemapLeaf {
  name: string;
  value: number;
}

export interface TreemapGroup {
  children: TreemapLeaf[];
  name: string;
}

/** Fieldnote's support tickets in September 2026, by platform, then by feature. */
export const nestedTreemapDemo: TreemapGroup[] = [
  {
    children: [
      { name: "Sync", value: 245 },
      { name: "Export", value: 185 },
      { name: "Share", value: 140 },
      { name: "Canvas", value: 115 },
    ],
    name: "Web",
  },
  {
    children: [
      { name: "Sync", value: 215 },
      { name: "Clips", value: 145 },
      { name: "Export", value: 100 },
    ],
    name: "Desktop",
  },
  {
    children: [
      { name: "Sync", value: 165 },
      { name: "Clips", value: 135 },
      { name: "Calendar", value: 100 },
    ],
    name: "iOS",
  },
  {
    children: [
      { name: "Sync", value: 135 },
      { name: "Clips", value: 95 },
    ],
    name: "Android",
  },
];
