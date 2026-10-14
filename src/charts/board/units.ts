// Number formats the boards share beyond src/lib/format.ts.

import { fmtKInt } from "../../lib/format";

/** Millions to one place: "61.4m". */
export const fmtM = (v: number) => `${(v / 1_000_000).toFixed(1)}m`;

/** Scale ticks: zero bare, then whole thousands or millions ("0", "50k", "1.2m"). */
export const fmtCountTick = (v: number) => {
  if (v === 0) {
    return "0";
  }
  if (Math.abs(v) >= 1_000_000) {
    return `${v / 1_000_000}m`;
  }
  return fmtKInt(v);
};
