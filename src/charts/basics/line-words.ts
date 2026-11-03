import { plural } from "../../lib/format";
import type { HairlineLineProps } from "../../schema/hairline-line";
import { referenceDesc } from "../reference-marks";
import { seriesOf, valueAt } from "./daily-readings";
import type { Reading } from "./daily-readings";
import { intervalDesc } from "./intervals";
import type { Band } from "./intervals";

export interface Words {
  bands: Band[];
  ends: { first: number; last: number; peak: number; trough: number };
  fmtDate: (d: Date) => string;
  forecast: { at: number; label: string };
  forecasting: boolean;
  format: (v: number) => string;
  range: { hi: number; lo: number };
  readings: Reading[];
  references: HairlineLineProps["references"];
}

/** The chart's accessible name and its description, from the readings. */
export const describeLine = (w: Words) => {
  const { first, last, peak, trough } = w.ends;
  const { fmtDate, format, readings } = w;
  const high = `high ${format(w.range.hi)} on ${fmtDate(readings[peak].date)}, low ${format(w.range.lo)} on ${fmtDate(readings[trough].date)}`;
  return {
    desc: [
      `${plural(seriesOf(readings).live.length, "reading")}. ${high[0].toUpperCase()}${high.slice(1)}.`,
      referenceDesc(w.references, format),
      intervalDesc(w.bands, {
        label: w.forecast.label,
        shown: w.forecasting,
      }),
      "The data table lists every reading.",
    ]
      .filter((text) => text !== "")
      .join(" "),
    label: `Daily values, ${fmtDate(readings[first].date)} to ${fmtDate(readings[last].date)}: ${high}, latest ${format(valueAt(readings, last))}`,
  };
};
