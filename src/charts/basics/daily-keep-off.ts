import type { Box } from "../label-box";
import { referenceBoxes } from "../reference-plates";
import type { ReferenceProps } from "../reference-plates";
import { dailyNoteBoxes } from "./daily-note-boxes";
import type { NoteProps } from "./daily-note-boxes";
import { forecastNameBox, intervalFacts, intervalNameBoxes } from "./intervals";
import type { Band } from "./intervals";

interface KeepOff {
  bands: Band[];
  forecast: { at: number; label: string };
  forecasting: boolean;
  /** The notes' room and the frame's scales. */
  notes: NoteProps;
  /** The reference marks' plane, their value scale and the marks they keep clear of. */
  references: Pick<ReferenceProps, "avoid" | "plane" | "refs" | "within"> & {
    scale: (v: number) => number;
  };
}

/** Everything a daily chart prints beside its line that a tip keeps off: notes, the forecast's name, reference and interval names. */
export const dailyKeepOff = (o: KeepOff): Box[] => {
  const { frame, floor } = o.notes;
  const { plane } = o.references;

  return [
    ...dailyNoteBoxes(o.notes),
    ...(o.forecasting
      ? [
          forecastNameBox(
            o.forecast.label,
            Math.round(frame.x(o.forecast.at - 1)),
            plane.y0
          ),
        ]
      : []),
    ...referenceBoxes({ ...o.references, along: "y" }),
    ...intervalNameBoxes(o.bands, {
      bounds: [plane.y0, floor],
      x: frame.x,
      y: o.references.scale,
    }),
  ];
};

/** The quiet words a reading's tip adds: a forecast's name and the ranges the bands give. */
export const dailyFacts =
  (o: Pick<KeepOff, "bands" | "forecast">, format: (v: number) => string) =>
  (i: number) => [
    ...(i >= o.forecast.at ? [o.forecast.label.toLowerCase()] : []),
    ...intervalFacts(o.bands, i, format),
  ];
