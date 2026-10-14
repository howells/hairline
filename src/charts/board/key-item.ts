import type { LegendItem } from "../core";
import type { KeyItem } from "./key";

/** A shared-core legend item (colour + label) as a board key item. */
export const keyItem = (item: LegendItem): KeyItem =>
  item.hollow === true
    ? { label: item.label, tone: "fill-paper" }
    : { fill: item.color, label: item.label };
