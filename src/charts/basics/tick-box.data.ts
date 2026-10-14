/** A five-number summary plus the points beyond the whiskers. */
export interface BoxDatum {
  label: string;
  max: number;
  median: number;
  min: number;
  outliers?: number[];
  q1: number;
  q3: number;
}

/** Seconds for an edit to reach every device, by platform, September 2026. */
export const tickBoxDemo: BoxDatum[] = [
  {
    label: "Desktop",
    max: 2.9,
    median: 1.2,
    min: 0.4,
    outliers: [4.2],
    q1: 0.8,
    q3: 1.7,
  },
  {
    label: "Web",
    max: 4.6,
    median: 1.9,
    min: 0.6,
    outliers: [6.8],
    q1: 1.3,
    q3: 2.7,
  },
  {
    label: "iOS",
    max: 6.6,
    median: 2.8,
    min: 0.9,
    outliers: [9.1],
    q1: 1.8,
    q3: 4,
  },
  {
    label: "Android",
    max: 9.8,
    median: 4.2,
    min: 1.1,
    outliers: [12.4, 13.7],
    q1: 2.6,
    q3: 6,
  },
];
