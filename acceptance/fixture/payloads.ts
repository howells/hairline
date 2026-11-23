// The payloads a deck-building agent would send: plain JSON keyed by chart kind,
// each checked by the registry before it is drawn. The data is the gallery's
// own, imported from its data files, where each set names its source, the date
// it was fetched and how it was transformed.
import { dumbbellQueueDemo } from "../../src/charts/basics/dumbbell-queue.data.ts";
import { hairlineAreaDemo } from "../../src/charts/basics/hairline-area.data.ts";
import { hairlineLineDemo } from "../../src/charts/basics/hairline-line.data.ts";
import { plumbScatterDemo } from "../../src/charts/basics/plumb-scatter.data.ts";
import { rangeDemo } from "../../src/charts/basics/references.data.ts";
import { rungBarsDemo } from "../../src/charts/basics/rung-bars.data.ts";
import { cleanerRegions } from "../../src/lib/data.ts";

export const KIND_ORDER = [
  "rung-bars",
  "hairline-line",
  "hairline-area",
  "plumb-scatter",
  "range-dots",
  "slope",
  "dumbbell-queue",
] as const;

export type Kind = (typeof KIND_ORDER)[number];

export const PAYLOADS = {
  // Visits to DCMS-sponsored museums, 2019 against 2025 (F12).
  "dumbbell-queue": {
    data: dumbbellQueueDemo,
    emphasis: "Tate",
    ends: ["0", "Millions of visits"],
    format: { maximumFractionDigits: 1, minimumFractionDigits: 1 },
    unit: 0.25,
    unitNote: "One rung = 250,000 visits",
  },
  // Daylight in Tromsø on each day of 2026 (F3).
  "hairline-area": {
    data: hairlineAreaDemo,
    ticks: [0, 6, 12, 18, 24],
    unitNote: "Hours of daylight in Tromsø, 2026",
  },
  // Sterling in September 2022, the Fed's noon buying rate (F2).
  "hairline-line": {
    data: hairlineLineDemo,
    extreme: "trough",
    unitNote: "US dollars to the pound, September 2022",
  },
  // Apple orchards in 2024: area harvested against yield (F8).
  "plumb-scatter": {
    data: plumbScatterDemo,
    hero: ["Chile"],
    xDomain: [0, 340],
    xLabels: ["Smaller orchards", "Larger orchards"],
    yLabel: "Tonnes of apples a hectare",
  },
  // Adults who use e-cigarettes in 2023, CDC BRFSS (R6).
  "range-dots": {
    coverage: 0.95,
    data: rangeDemo,
    domain: [0, 25],
    format: { maximumFractionDigits: 1 },
    formatMargin: { maximumFractionDigits: 1, minimumFractionDigits: 1 },
    unitNote:
      "Percent of adults using e-cigarettes, 2023 · Estimate and 95% interval",
    wide: 3.5,
  },
  // Earthquakes of magnitude 7 or more a year, USGS (F1).
  "rung-bars": {
    data: rungBarsDemo,
    unitNote: "One rung = one earthquake of magnitude 7 or more",
  },
  // Mean carbon intensity of the five GB regions that fell most, g CO2/kWh (D7).
  slope: {
    domain: [60, 300],
    labels: ["Jan 2023", "Dec 2024"],
    rows: cleanerRegions,
    unitNote: "Mean carbon intensity, grams of CO₂ a kWh",
  },
};
