// React-free. One small, valid payload per chart: it is the live example on a
// chart's docs page, the code beside it, and a test checks each against the
// chart's schema. The figures are rounded public numbers, for illustration.
import type { ChartKind } from "../schema/registry";

const DAY = 86_400_000;

/** A daily series from a start day and a list of readings. */
const daily = (start: string, values: number[]) =>
  values.map((value, index) => ({
    date: new Date(Date.parse(start) + index * DAY).toISOString().slice(0, 10),
    value,
  }));

export type Payload = Record<string, unknown>;

export const EXAMPLES: Record<ChartKind, Payload> = {
  "dumbbell-queue": {
    data: [
      { after: 19, before: 0, label: "Reykjavik" },
      { after: 19, before: -4, label: "Moscow" },
      { after: 19, before: 5, label: "London" },
      { after: 25, before: 6, label: "Madrid" },
      { after: 28, before: 14, label: "Cairo" },
    ],
    emphasis: "Moscow",
    ends: ["Colder", "Warmer"],
    unit: 2,
    unitNote: "One rung = 2 °C",
  },
  "hairline-area": {
    data: daily(
      "2025-12-01",
      [
        7.5, 7.4, 7.3, 7.2, 7.1, 7.05, 7.0, 6.95, 6.9, 6.88, 6.86, 6.85, 6.84,
        6.83, 6.83, 6.83, 6.84, 6.85, 6.86, 6.88, 6.9, 6.93, 6.96, 7.0, 7.04,
        7.08, 7.12, 7.17,
      ]
    ),
    ticks: [0, 2, 4, 6, 8],
    unitNote: "Hours of daylight",
  },
  "hairline-line": {
    data: daily(
      "2025-12-08",
      [7.05, 6.97, 6.9, 6.86, 6.84, 6.83, 6.83, 6.83, 6.84, 6.86, 6.9]
    ),
    extreme: "trough",
    unitNote: "Hours of daylight",
  },
  "plumb-scatter": {
    data: [
      { label: "Mercury", x: 0.39, y: 0.24 },
      { label: "Venus", x: 0.72, y: 0.62 },
      { label: "Earth", x: 1, y: 1 },
      { label: "Mars", x: 1.52, y: 1.88 },
      { label: "Jupiter", x: 5.2, y: 11.86 },
      { label: "Saturn", x: 9.58, y: 29.45 },
    ],
    emphasis: "Earth",
    xLabels: ["Near the Sun", "Far from the Sun"],
    yLabel: "Years per orbit",
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
    labels: ["2000", "2020"],
    rows: [
      { from: 1262, name: "China", to: 1411 },
      { from: 1057, name: "India", to: 1380 },
      { from: 282, name: "United States", to: 331 },
      { from: 127, name: "Japan", to: 126 },
      { from: 82, name: "Germany", to: 83 },
      { from: 59, name: "United Kingdom", to: 67 },
    ],
    emphasis: "India",
  },
};

/** One object on one line: { label: "K2", value: 8611 }. */
const row = (item: object) =>
  `{ ${Object.entries(item)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;

/** A value as it reads in JSX: arrays of objects one row to a line. */
const literal = (value: unknown, indent: string): string => {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "object" && item !== null)
  ) {
    const rows = value.map((item) => `${indent}  ${row(item)},`);
    return `[\n${rows.join("\n")}\n${indent}]`;
  }
  return Array.isArray(value)
    ? `[${value.map((item) => JSON.stringify(item)).join(", ")}]`
    : JSON.stringify(value);
};

/** The copyable code for a chart: its import and a call with the example payload. */
export const exampleCode = (
  component: string,
  kind: ChartKind,
  payload: Payload = EXAMPLES[kind]
) => {
  const props = Object.entries(payload).map(([name, value]) =>
    typeof value === "string"
      ? `  ${name}=${JSON.stringify(value)}`
      : `  ${name}={${literal(value, "  ")}}`
  );
  return [
    `import { ${component} } from "@howells/hairline/${kind}";`,
    "",
    `<${component}`,
    ...props,
    "/>;",
  ].join("\n");
};
