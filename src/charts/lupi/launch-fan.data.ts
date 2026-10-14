import { rnd } from "../../lib/random";

export interface LaunchFanDatum {
  name: string;
  /** Week (or month, with `unit="month"`) the feature launched, 1-based. */
  launch: number;
  /** Size today, e.g. monthly active users. Sizes the launch dot. */
  size: number;
  /** One reading per week (or month) since launch; sizes the small dots. */
  weekly?: number[];
}

/** Months in the demo span: January 2025 is month 1, December 2026 month 24. */
export const LAUNCH_MONTHS = 24;

/** The calendar month of demo month `n` (month 0 is December 2024). */
export const launchMonthDate = (n: number) =>
  new Date(Date.UTC(2024, 11 + n, 1));

// Fieldnote's twelve integrations: launch month and accounts connected today.
const seeds: [string, number, number][] = [
  ["Google Drive", 1, 152_000],
  ["Slack", 3, 128_000],
  ["Email", 5, 97_000],
  ["Dropbox", 6, 64_000],
  ["Calendar", 8, 83_000],
  ["Zoom", 9, 51_000],
  ["GitHub", 11, 38_000],
  ["Figma", 13, 29_000],
  ["Linear", 15, 24_000],
  ["Readwise", 17, 18_000],
  ["Notion import", 19, 41_000],
  ["Zotero", 21, 9000],
];

export const launchFanDemo: LaunchFanDatum[] = seeds.map(
  ([name, launch, size], i) => ({
    launch,
    name,
    size,
    weekly: Array.from({ length: LAUNCH_MONTHS - launch + 1 }, (_, t) =>
      Math.round(
        size * (1 - Math.exp(-(t + 1) / 5)) * (0.82 + 0.3 * rnd(i + 7, t))
      )
    ),
  })
);
