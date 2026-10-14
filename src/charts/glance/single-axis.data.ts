import { rnd } from "../../lib/random";

export interface SingleAxisRow {
  label: string;
  /** One value per column (hour). */
  values: number[];
}

interface Region {
  label: string;
  /** Busiest hour, UTC: early afternoon local time. */
  noon: number;
  /** Syncs at the busiest hour, thousands. */
  peak: number;
}

const REGIONS: Region[] = [
  { label: "US East", noon: 17, peak: 48 },
  { label: "US West", noon: 20, peak: 31 },
  { label: "EU West", noon: 12, peak: 36 },
  { label: "EU Central", noon: 11, peak: 27 },
  { label: "AP South", noon: 7, peak: 14 },
  { label: "AP Northeast", noon: 4, peak: 18 },
];

/** Hours between `h` and `noon` around the clock. */
const apart = (h: number, noon: number) => {
  const d = Math.abs(h - noon) % 24;
  return Math.min(d, 24 - d);
};

/**
 * Fieldnote syncs an hour (thousands, UTC) by cloud region on a working
 * day: each region's hump follows its own time zone.
 */
export const singleAxisDemo: SingleAxisRow[] = REGIONS.map((region, r) => ({
  label: region.label,
  values: Array.from({ length: 24 }, (_, h) => {
    const day = Math.exp(-((apart(h, region.noon) / 3.4) ** 2));
    const night = 0.04 + rnd(h, r + 31) * 0.05;
    return Math.round(
      region.peak * Math.max(day, night) * (0.9 + rnd(r, h) * 0.2)
    );
  }),
}));
