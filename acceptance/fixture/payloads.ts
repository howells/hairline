// The payloads Wiredeck's agent would send: plain JSON keyed by chart kind,
// each checked by the registry before it is drawn. Dates are generated from a
// fixed formula so every run draws the same marks.
const DAY = 86_400_000;

const daily = (start: string, count: number, at: (index: number) => number) =>
  Array.from({ length: count }, (_, index) => ({
    date: new Date(Date.parse(start) + index * DAY).toISOString().slice(0, 10),
    value: Math.round(at(index) * 100) / 100,
  }));

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
    data: daily("2025-09-01", 90, (i) => 12 - i * 0.07 + Math.sin(i / 6) * 0.6),
    ticks: [0, 4, 8, 12],
    unitNote: "Hours of daylight",
  },
  "hairline-line": {
    data: daily("2025-11-01", 40, (i) => 7 + Math.cos(i / 7) * 0.8 - i * 0.01),
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
  "range-dots": {
    coverage: 0.9,
    data: [
      { estimate: 42, high: 46, label: "Paint", low: 38 },
      { estimate: 35, high: 41, label: "Tile", low: 29 },
      { estimate: 31, high: 40, label: "Flooring", low: 22 },
      { estimate: 19, high: 30, label: "Stone", low: 8 },
    ],
    domain: [0, 60],
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
