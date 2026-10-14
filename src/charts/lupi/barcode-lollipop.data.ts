import { rnd } from "../../lib/random";

export interface BarcodeDatum {
  date: Date;
  /** The day's reading, e.g. peak concurrent users. */
  value: number;
  /** Where the stem ends: the day's low. Defaults to 90% of the value. */
  low?: number;
}

const DAY = 86_400_000;
const start = Date.UTC(2026, 9, 1);

// Fieldnote's peak concurrent users each day (thousands), October to
// December 2026: an autumn climb, the Thanksgiving dip, the December planning
// high, then the Christmas trough.
const outline: [number, number][] = [
  [0, 28],
  [12, 31.5],
  [20, 30.8],
  [34, 29.9],
  [46, 32.1],
  [56, 28.2],
  [61, 30.8],
  [68, 33],
  [77, 31.9],
  [85, 23.8],
  [90, 25.7],
];

const seasonal = (day: number) => {
  const k = Math.max(
    0,
    outline.findIndex(
      ([d], j) => day >= d && day <= (outline[j + 1]?.[0] ?? Infinity)
    )
  );
  const [d0, v0] = outline[k];
  const [d1, v1] = outline[Math.min(k + 1, outline.length - 1)];
  const t = d1 === d0 ? 0 : (day - d0) / (d1 - d0);
  return v0 + (v1 - v0) * (0.5 - Math.cos(t * Math.PI) / 2);
};

/** Three stand-out weekdays, so the top-3 labels have something to say. */
const peaks = new Map([
  [13, 34.6],
  [47, 36.2],
  [68, 38.1],
]);

/** Weekends run lighter: people take fewer notes on Saturdays. */
const weekendDip = (day: number) => {
  const weekday = new Date(start + day * DAY).getUTCDay();
  return weekday === 0 || weekday === 6 ? 0.92 : 1;
};

export const barcodeLollipopDemo: BarcodeDatum[] = Array.from(
  { length: 91 },
  (_, i) => {
    const value = Math.round(
      (peaks.get(i) ??
        (seasonal(i) + 2.2 * (rnd(i, 5) - 0.5)) * weekendDip(i)) * 1000
    );
    return {
      date: new Date(start + i * DAY),
      low: Math.round(value - (2.4 + 6.6 * rnd(i, 11)) * 1000),
      value,
    };
  }
);
