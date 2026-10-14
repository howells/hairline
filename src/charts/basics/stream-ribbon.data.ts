import { rndSigned } from "../../lib/random";

export interface StreamSeries {
  name: string;
  values: number[];
}

/** Series are listed bottom to top; every series has one value per date. */
export interface StreamData {
  dates: Date[];
  series: StreamSeries[];
}

const WEEKS = 104;
const START = Date.UTC(2025, 0, 6);
const WEEK_MS = 7 * 86_400_000;
const ease = (t: number): number => t * t * (3 - 2 * t);
const weeks = Array.from({ length: WEEKS }, (_, i) => ({
  i,
  t: i / (WEEKS - 1),
}));

/** A platform's weekly actives: a start, a finish, an easing between, and weekly noise. */
const platform = (
  from: number,
  to: number,
  noise: number,
  seed: number,
  growth: (t: number) => number = ease
) =>
  weeks.map(({ i, t }) =>
    Math.round(
      from +
        (to - from) * growth(t) +
        noise * Math.sin(i / 3.1 + seed) +
        noise * 0.6 * rndSigned(i, seed)
    )
  );

/**
 * Fieldnote's weekly active users by platform, January 2025 to December 2026:
 * the desktop app overtakes the web app during 2026.
 */
export const streamRibbonDemo: StreamData = {
  dates: weeks.map(({ i }) => new Date(START + i * WEEK_MS)),
  series: [
    { name: "Desktop", values: platform(45_000, 126_000, 2600, 1) },
    {
      name: "Web",
      values: platform(121_000, 104_000, 3000, 2, (t) => t),
    },
    { name: "iOS", values: platform(26_000, 51_000, 1500, 3) },
    { name: "Android", values: platform(12_000, 23_000, 900, 4) },
  ],
};
