/**
 * The engraving that marks a kind of work, one of four families: upright
 * rules, a halftone dot screen, crosshatch, and level rules.
 */
export type WorkTexture = "cross" | "dots" | "level" | "upright";

/** One kind of work, and the engraving that marks it. */
export interface WorkKind {
  name: string;
  texture: WorkTexture;
}

/** One team's year, as percentage shares in `kinds` order. */
export interface TeamShares {
  shares: number[];
  team: string;
}

export interface ShareTable {
  kinds: WorkKind[];
  rows: TeamShares[];
}

/** Where each engineering team's time went in 2026, in percent. */
export const timeSharesDemo: ShareTable = {
  kinds: [
    { name: "New work", texture: "upright" },
    { name: "Upkeep", texture: "dots" },
    { name: "Incidents", texture: "cross" },
    { name: "Requests", texture: "level" },
  ],
  rows: [
    { shares: [54, 22, 8, 16], team: "Product" },
    { shares: [48, 26, 9, 17], team: "Mobile" },
    { shares: [43, 29, 11, 17], team: "Growth" },
    { shares: [36, 33, 15, 16], team: "Platform" },
    { shares: [21, 42, 27, 10], team: "Infra" },
  ],
};
