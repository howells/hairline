import { plural } from "../../lib/format";
import type { HairlineAreaProps } from "../../schema/hairline-area";
import { referenceDesc } from "../reference-marks";
import { seriesOf } from "./daily-readings";
import type { Reading } from "./daily-readings";
import { intervalDesc } from "./intervals";
import type { Band } from "./intervals";

interface Words {
  bands: Band[];
  fmtDate: (d: Date) => string;
  forecast: { at: number; label: string };
  forecasting: boolean;
  format: (v: number) => string;
  max: number;
  peak: number;
  readings: Reading[];
  references: HairlineAreaProps["references"];
}

/** The chart's accessible name and its description, from the readings. */
export const describeArea = (w: Words) => {
  const { fmtDate, format, readings } = w;
  const { live } = seriesOf(readings);
  const peakAt = fmtDate(readings[w.peak].date);

  return {
    desc: [
      `${plural(live.length, "reading")}. Peak ${format(w.max)} on ${peakAt}.`,
      referenceDesc(w.references, format),
      intervalDesc(w.bands, { label: w.forecast.label, shown: w.forecasting }),
      "The data table lists every reading.",
    ]
      .filter((text) => text !== "")
      .join(" "),
    label: `Daily values, ${fmtDate(readings[live[0]].date)} to ${fmtDate(readings[live.at(-1) ?? 0].date)}: peak ${format(w.max)} on ${peakAt}`,
  };
};
