export interface TreeDatum {
  name: string;
  children?: TreeDatum[];
}

/** Fieldnote's twelve features, grouped by what they help you do. */
export const treeLRDemo: TreeDatum = {
  children: [
    {
      children: [
        { name: "Notes" },
        { name: "Clips" },
        { name: "Templates" },
        { name: "Calendar" },
      ],
      name: "Capture",
    },
    {
      children: [{ name: "Tags" }, { name: "Canvas" }],
      name: "Organise",
    },
    {
      children: [{ name: "Search" }, { name: "Assistant" }],
      name: "Find",
    },
    {
      children: [
        { name: "Share" },
        { name: "Comments" },
        { name: "Sync" },
        { name: "Export" },
      ],
      name: "Connect",
    },
  ],
  name: "Fieldnote",
};
