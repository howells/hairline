import type { DumbbellDatum } from "../../schema/dumbbell-queue";

/**
 * O11 Arrow plot. Made-up shares of a supplier's orders by material, last
 * year against this: three rise, two fall and two barely move.
 */
export const arrowPlotDemo: DumbbellDatum[] = [
  { after: 71, before: 63, label: "Paint" },
  { after: 44, before: 47, label: "Tile" },
  { after: 52, before: 41, label: "Flooring" },
  { after: 30, before: 36, label: "Textiles" },
  { after: 38, before: 31, label: "Stone" },
  { after: 22, before: 21, label: "Wood" },
  { after: 20, before: 15, label: "Glass" },
];
