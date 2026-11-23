// React-free. One small, valid payload per chart: it is the live example on a
// chart's page, the code beside it, and a test checks each against the
// chart's schema. The figures are rounded public numbers, for illustration.
// Temperatures are 1991–2020 daily means (January, July) from each city's
// climate table on Wikipedia; day lengths are London's, sunrise to sunset,
// from the NOAA solar declination with the sun's centre at −0.833°.
import type { ChartKind } from "@howells/hairline/schema";
import { z } from "zod";

const DAY = 86_400_000;

/** A daily series from a start day and a list of readings. */
const daily = (start: string, values: number[]) =>
  values.map((value, index) => ({
    date: new Date(Date.parse(start) + index * DAY).toISOString().slice(0, 10),
    value,
  }));

/** A payload as the JSON an agent would write. */
export type Payload = Record<string, z.infer<ReturnType<typeof z.json>>>;

export const EXAMPLES: Record<ChartKind, Payload> = {
  "dumbbell-queue": {
    data: [
      { after: 12, before: 1, label: "Reykjavik" },
      { after: 20, before: -6, label: "Moscow" },
      { after: 19, before: 5, label: "London" },
      { after: 26, before: 7, label: "Madrid" },
      { after: 29, before: 14, label: "Cairo" },
    ],
    emphasis: "Moscow",
    ends: ["Colder", "Warmer"],
    unit: 2,
    unitNote: "Mean temperature, January to July. One rung = 2 °C",
  },
  "hairline-area": {
    data: daily(
      "2025-12-01",
      [
        8.2, 8.17, 8.13, 8.1, 8.07, 8.05, 8.02, 8, 7.97, 7.95, 7.93, 7.91, 7.9,
        7.88, 7.87, 7.86, 7.85, 7.84, 7.83, 7.83, 7.83, 7.83, 7.83, 7.83, 7.84,
        7.84, 7.85, 7.86,
      ]
    ),
    format: { maximumFractionDigits: 1 },
    ticks: [0, 3, 6, 9],
    unitNote: "Hours of daylight in London, December 2025",
  },
  "hairline-line": {
    data: daily(
      "2025-12-14",
      [
        7.88, 7.87, 7.86, 7.85, 7.84, 7.83, 7.83, 7.83, 7.83, 7.83, 7.83, 7.84,
        7.84, 7.85, 7.86,
      ]
    ),
    format: { maximumFractionDigits: 2, minimumFractionDigits: 2 },
    // The solstice: rounded, five days tie, so name the shortest rather than
    // asking for the trough, which would take the first of them.
    hero: ["2025-12-21"],
    unitNote: "Hours of daylight in London, December 2025",
  },
  "plumb-scatter": {
    // Degrees north, and hours from sunrise to sunset on 21 December.
    data: [
      { label: "Athens", x: 38, y: 9.5 },
      { label: "Rome", x: 41.9, y: 9.1 },
      { label: "Paris", x: 48.9, y: 8.2 },
      { label: "London", x: 51.5, y: 7.8 },
      { label: "Edinburgh", x: 56, y: 7 },
      { label: "Stockholm", x: 59.3, y: 6.1 },
      { label: "Reykjavik", x: 64.2, y: 4.1 },
    ],
    hero: ["London"],
    labelled: ["Athens", "London", "Reykjavik"],
    xDomain: [35, 65],
    xLabels: ["Further south", "Further north"],
    yDomain: [0, 10],
    yLabel: "Hours of daylight, 21 December",
  },
  "range-dots": {
    // Illustrative shares, with their 90% intervals: no survey stands behind them.
    coverage: 0.9,
    data: [
      { estimate: 42, high: 46, label: "Paint", low: 38 },
      { estimate: 35, high: 41, label: "Tile", low: 29 },
      { estimate: 31, high: 40, label: "Flooring", low: 22 },
      { estimate: 19, high: 30, label: "Stone", low: 8 },
    ],
    domain: [0, 60],
    unitNote: "Estimate and 90% interval",
    wide: 15,
  },
  "rung-bars": {
    data: [
      { label: "Everest", value: 8849 },
      { label: "K2", value: 8611 },
      { label: "Kangchenjunga", value: 8586 },
      { label: "Lhotse", value: 8516 },
      { label: "Makalu", value: 8485 },
    ],
    unit: 500,
    unitNote: "One rung = 500 m",
  },
  slope: {
    emphasis: "India",
    labels: ["2000", "2020"],
    rows: [
      { from: 1262, name: "China", to: 1411 },
      { from: 1057, name: "India", to: 1380 },
      { from: 282, name: "United States", to: 331 },
      { from: 127, name: "Japan", to: 126 },
      { from: 82, name: "Germany", to: 83 },
      { from: 59, name: "United Kingdom", to: 67 },
    ],
  },
};

const Rows = z.array(z.record(z.string(), z.json())).min(1);

/** One object on one line: { label: "K2", value: 8611 }. */
const row = (item: Payload) =>
  `{ ${Object.entries(item)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;

/** A prop's value as it reads in JSX: arrays of objects one row to a line. */
const literal = (value: Payload[string]) => {
  const rows = Rows.safeParse(value);

  return rows.success
    ? `[\n${rows.data.map((item) => `    ${row(item)},`).join("\n")}\n  ]`
    : JSON.stringify(value);
};

const isKind = (kind: string): kind is ChartKind =>
  Object.hasOwn(EXAMPLES, kind);

/** The example for a kind, or a throw: every registry kind has one. */
export const exampleFor = (kind: string): Payload => {
  if (!isKind(kind)) {
    throw new Error(`No example for ${kind}`);
  }

  return EXAMPLES[kind];
};

/** The copyable code for a chart: its import and a call with the example payload. */
export const exampleCode = (component: string, kind: string) => {
  const props = Object.entries(exampleFor(kind)).map(([name, value]) =>
    z.string().safeParse(value).success
      ? `  ${name}=${JSON.stringify(value)}`
      : `  ${name}={${literal(value)}}`
  );

  return [
    `import { ${component} } from "@howells/hairline/${kind}";`,
    "",
    `<${component}`,
    ...props,
    "/>;",
  ].join("\n");
};
