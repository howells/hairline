/** A node in the org: a group with children, or a team with a headcount. */
export interface OrgNode {
  children?: OrgNode[];
  name: string;
  value?: number;
}

/**
 * Fieldnote headcount by department and team, end of 2026: 120 engineers in
 * eight teams, and the company around them.
 */
export const orgDemo: OrgNode = {
  children: [
    {
      children: [
        { name: "Product", value: 24 },
        { name: "Platform", value: 20 },
        { name: "Growth", value: 16 },
        { name: "Data", value: 14 },
        { name: "Infra", value: 14 },
        { name: "Mobile", value: 13 },
        { name: "Design", value: 10 },
        { name: "Support", value: 9 },
      ],
      name: "Engineering",
    },
    {
      children: [
        { name: "Sales", value: 17 },
        { name: "Success", value: 13 },
        { name: "Marketing", value: 10 },
        { name: "Partners", value: 4 },
      ],
      name: "Go to market",
    },
    {
      children: [
        { name: "People", value: 6 },
        { name: "Finance", value: 5 },
        { name: "IT", value: 4 },
        { name: "Legal", value: 3 },
      ],
      name: "Operations",
    },
  ],
  name: "Fieldnote",
};
