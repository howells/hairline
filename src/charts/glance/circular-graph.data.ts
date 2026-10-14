export interface CircleNode {
  id: string;
  value: number;
}

export interface CircleLink {
  source: string;
  target: string;
  value: number;
}

export interface CircleGraphData {
  nodes: CircleNode[];
  links: CircleLink[];
}

/** Fieldnote's eight teams (people) and the projects each pair shared in 2026. */
export const circularGraphDemo: CircleGraphData = {
  links: [
    { source: "Platform", target: "Infra", value: 7 },
    { source: "Platform", target: "Product", value: 6 },
    { source: "Product", target: "Design", value: 6 },
    { source: "Platform", target: "Mobile", value: 5 },
    { source: "Product", target: "Growth", value: 5 },
    { source: "Product", target: "Mobile", value: 4 },
    { source: "Growth", target: "Data", value: 4 },
    { source: "Data", target: "Platform", value: 3 },
    { source: "Support", target: "Product", value: 3 },
    { source: "Design", target: "Mobile", value: 3 },
    { source: "Growth", target: "Design", value: 2 },
    { source: "Data", target: "Product", value: 2 },
    { source: "Infra", target: "Mobile", value: 2 },
    { source: "Infra", target: "Data", value: 2 },
    { source: "Support", target: "Platform", value: 1 },
  ],
  nodes: [
    { id: "Support", value: 8 },
    { id: "Growth", value: 14 },
    { id: "Data", value: 12 },
    { id: "Infra", value: 16 },
    { id: "Platform", value: 24 },
    { id: "Mobile", value: 18 },
    { id: "Design", value: 10 },
    { id: "Product", value: 22 },
  ],
};
