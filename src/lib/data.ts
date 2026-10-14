// Fieldnote's numbers for the dashboard boards (docs/DATA.md): one note-taking
// company, January 2025 to December 2026. Everything is fixed or seeded, so
// the charts look identical on every load.

import { mulberry32 } from "./random";

const DAY = 86_400_000;
const WEEK = 7 * DAY;

export interface Point {
  date: Date;
  value: number;
}

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Mondays from 30 Dec 2024 (the week holding 1 Jan 2025) to 28 Dec 2026. */
export const WEEKS: Date[] = Array.from(
  { length: 105 },
  (_, i) => new Date(utc("2024-12-30").getTime() + i * WEEK)
);

/** First of each month, Jan 2025 – Dec 2026. */
export const MONTHS: Date[] = Array.from(
  { length: 24 },
  (_, i) => new Date(Date.UTC(2025, i, 1))
);

/** Index of the week closest to an ISO date. */
export const weekIndex = (iso: string) =>
  Math.round((utc(iso).getTime() - WEEKS[0].getTime()) / WEEK);

/** Index of an ISO month ("2025-06") in MONTHS. */
export const monthIndex = (iso: string) =>
  MONTHS.findIndex((d) => d.toISOString().startsWith(iso));

interface Dip {
  at: string;
  depth: number;
  width: number;
  profile?: "v" | "box";
}

/**
 * Piecewise-linear trend through keyframes, plus seeded noise and dips/spikes.
 * Dip widths are in weeks; positive depth makes a spike.
 */
interface SeriesSpec {
  clamp?: [number, number];
  dips?: Dip[];
  keys: [string, number][];
  noise: number;
  seed: number;
}

/** The trend between the two keyframes around time `t`. */
const trendAt = (keys: (readonly [number, number])[], t: number) => {
  let k = keys.findIndex(([kt]) => kt > t);
  if (k === -1) {
    k = keys.length - 1;
  }
  if (k === 0) {
    k = 1;
  }
  const [t0, v0] = keys[k - 1];
  const [t1, v1] = keys[k];
  return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0);
};

const dipAt = (dip: Dip, i: number) => {
  const d = (i - weekIndex(dip.at)) / dip.width;
  const falloff =
    dip.profile === "box" ? Math.exp(-(d ** 6)) : Math.exp(-(d * d));
  return dip.depth * falloff;
};

const series = (opts: SeriesSpec): Point[] => {
  const rand = mulberry32(opts.seed);
  const keys = opts.keys.map(([iso, v]) => [utc(iso).getTime(), v] as const);
  return WEEKS.map((date, i) => {
    let value = trendAt(keys, date.getTime());
    value += (rand() - 0.5) * 2 * opts.noise;
    for (const dip of opts.dips ?? []) {
      value += dipAt(dip, i);
    }
    if (opts.clamp) {
      value = Math.min(opts.clamp[1], Math.max(opts.clamp[0], value));
    }
    return { date, value };
  });
};

// ---------- Weekly series ----------

/** Assistant, Fieldnote's writing helper, ships in the week of 2 Jun 2025. */
export const ASSISTANT_LAUNCH = weekIndex("2025-06-02");

/** The quiet weeks: late summer and the turn of the year. */
const holidays = (scale: number): Dip[] => [
  { at: "2025-08-11", depth: -0.06 * scale, width: 1.6 },
  { at: "2025-12-29", depth: -0.2 * scale, width: 1.1 },
  { at: "2026-08-10", depth: -0.07 * scale, width: 1.6 },
];

/** Weekly active users. */
export const weeklyActive = series({
  dips: holidays(190_000),
  keys: [
    ["2024-12-30", 118_000],
    ["2025-06-02", 141_000],
    ["2025-12-15", 196_000],
    ["2026-12-28", 268_000],
  ],
  noise: 2200,
  seed: 41,
});

/** Weekly users of Assistant: none before launch, then a steep climb. */
export const assistantUsers: Point[] = (() => {
  const rand = mulberry32(43);
  const last = WEEKS.length - 1;
  return WEEKS.map((date, i) => {
    if (i < ASSISTANT_LAUNCH) {
      return { date, value: 0 };
    }
    const f = (i - ASSISTANT_LAUNCH + 1) / (last - ASSISTANT_LAUNCH + 1);
    const holiday = dipAt({ at: "2025-12-29", depth: -0.2, width: 1.1 }, i);
    const noise = (rand() - 0.5) * 3600 * f;
    return {
      date,
      value: Math.max(0, 214_000 * f ** 1.7 * (1 + holiday) + noise),
    };
  });
})();

/** Monthly active users, measured weekly over the trailing 28 days. */
export const monthlyActive = series({
  dips: holidays(110_000),
  keys: [
    ["2024-12-30", 188_000],
    ["2025-06-02", 216_000],
    ["2025-12-15", 296_000],
    ["2026-12-28", 410_000],
  ],
  noise: 2400,
  seed: 47,
});

/** Year-on-year change in weekly sign-ups, %. */
export const signupGrowth = series({
  dips: [
    { at: "2025-08-11", depth: -24, profile: "box", width: 2.2 },
    { at: "2026-08-10", depth: -27, profile: "box", width: 2.2 },
  ],
  keys: [
    ["2024-12-30", 14],
    ["2025-05-26", 17],
    ["2025-06-16", 52],
    ["2025-07-21", 31],
    ["2026-05-25", 24],
    ["2026-12-28", 61],
  ],
  noise: 3.2,
  seed: 53,
});

/** Search incidents: P95 and P50 both spike in the same weeks. */
const searchIncidents = ["2025-03-17", "2025-10-06", "2026-06-15"];

export const searchP95 = series({
  dips: searchIncidents.map((at, i) => ({
    at,
    depth: [148, 176, 139][i],
    width: 0.6,
  })),
  keys: [
    ["2024-12-30", 128],
    ["2025-09-01", 146],
    ["2026-12-28", 168],
  ],
  noise: 9,
  seed: 59,
});

export const searchP50 = series({
  dips: searchIncidents.map((at, i) => ({
    at,
    depth: [61, 72, 58][i],
    width: 0.6,
  })),
  keys: [
    ["2024-12-30", 52],
    ["2025-09-01", 58],
    ["2026-12-28", 67],
  ],
  noise: 4,
  seed: 61,
});

/** The search latency target, ms. */
export const SEARCH_TARGET = 250;

/** Weekly uptime of sync, %: one long outage in February 2026. */
export const syncUptime = series({
  clamp: [0, 99.99],
  dips: [
    { at: "2025-04-07", depth: -0.15, width: 0.35 },
    { at: "2026-02-09", depth: -0.39, width: 0.35 },
  ],
  keys: [
    ["2024-12-30", 99.955],
    ["2026-12-28", 99.96],
  ],
  noise: 0.016,
  seed: 67,
});

/** Support tickets a week, with a rush after each search incident. */
export const tickets = series({
  dips: searchIncidents.map((at) => ({ at, depth: 160, width: 0.7 })),
  keys: [
    ["2024-12-30", 380],
    ["2026-12-28", 520],
  ],
  noise: 24,
  seed: 71,
});

/** Files stored, TB: capacity is added in monthly steps. */
export const filesStored: Point[] = (() => {
  const rand = mulberry32(73);
  let level = 38;
  return WEEKS.map((date, i) => {
    if (i > 0 && i % 5 === 0) {
      level += 3 + rand() * 2.6;
    }
    return { date, value: level };
  });
})();

// ---------- Monthly series (Jan 2025 – Dec 2026) ----------

/** Monthly active users across every platform. */
const ACTIVE_TOTAL = [
  190, 196, 204, 211, 219, 236, 248, 242, 255, 266, 272, 268, 282, 291, 303,
  314, 326, 338, 349, 344, 362, 378, 396, 410,
].map((v) => v * 1000);

/** Each platform's share of users, first month to last. */
const PLATFORM_SHARE = {
  android: [0.12, 0.14],
  desktop: [0.18, 0.22],
  ios: [0.24, 0.26],
  web: [0.46, 0.38],
};

const shareOf = (range: number[], i: number) =>
  range[0] + ((range[1] - range[0]) * i) / (ACTIVE_TOTAL.length - 1);

/** Monthly active users by platform, to the nearest hundred. */
export const platformUsers = (() => {
  const rand = mulberry32(79);
  const split = (range: number[]) =>
    ACTIVE_TOTAL.map(
      (total, i) =>
        Math.round(
          (total * shareOf(range, i) * (1 + (rand() - 0.5) * 0.04)) / 100
        ) * 100
    );
  return {
    android: split(PLATFORM_SHARE.android),
    desktop: split(PLATFORM_SHARE.desktop),
    ios: split(PLATFORM_SHARE.ios),
    web: split(PLATFORM_SHARE.web),
  };
})();

/** Month-on-month change in sign-ups, %. Null: no month before it. */
export const signupChange: (number | null)[] = [
  null,
  6,
  9,
  -4,
  3,
  31,
  12,
  -14,
  8,
  5,
  2,
  -11,
  18,
  4,
  7,
  -3,
  6,
  9,
  3,
  -16,
  11,
  6,
  4,
  -9,
];

/** New accounts a month, compounding the changes above from 41,000. */
export const signups: number[] = [];
for (const change of signupChange) {
  const prev = signups.at(-1);
  signups.push(
    prev === undefined ? 41_000 : Math.round(prev * (1 + (change ?? 0) / 100))
  );
}

/** Cloud spend a month, $: Assistant's launch month runs over budget. */
export const cloudSpend = [
  118, 121, 124, 127, 131, 171, 149, 141, 146, 152, 155, 158, 154, 157, 161,
  150, 153, 158, 156, 151, 157, 159, 166, 172,
].map((v) => v * 1000);

export const SPEND_BUDGET = 160_000;

/** Share of recurring revenue by plan (%), largest accounts first. */
export const planShare = MONTHS.map((_, i) => {
  const t = i / (MONTHS.length - 1);
  const enterprise = 16 + 11 * t;
  const business = 24 + 4 * t;
  const pro = 31 - 5 * t;
  return {
    business,
    enterprise,
    plus: 100 - enterprise - business - pro,
    pro,
  };
});

// ---------- Weekly sessions by platform, Jul – Dec 2026 ----------

/** The 26 weeks of the second half of 2026. */
export const HALF_YEAR_WEEKS = WEEKS.slice(weekIndex("2026-07-06"));

/** Sessions a week, in thousands, by platform. */
export const platformSessions = (() => {
  const rand = mulberry32(83);
  const n = HALF_YEAR_WEEKS.length;
  const quiet = (i: number) =>
    1 -
    0.09 * Math.exp(-(((i - 5) / 1.6) ** 2)) -
    0.18 * Math.exp(-(((i - (n - 1)) / 1.1) ** 2));
  const run = (from: number, to: number) =>
    HALF_YEAR_WEEKS.map((_, i) =>
      Math.round(
        (from + ((to - from) * i) / (n - 1)) * quiet(i) +
          (rand() - 0.5) * 0.05 * from
      )
    );
  return {
    android: run(104, 131),
    desktop: run(190, 236),
    ios: run(240, 292),
    web: run(380, 452),
  };
})();

// ---------- Services and endpoints ----------

/** Requests a day by service. */
export const serviceRequests = [
  { name: "Sync", value: 61_400_000 },
  { name: "API", value: 42_800_000 },
  { name: "Search", value: 18_600_000 },
  { name: "Auth", value: 9_700_000 },
  { name: "Clips", value: 6_200_000 },
  { name: "Notify", value: 4_900_000 },
  { name: "Canvas", value: 3_100_000 },
  { name: "Export", value: 800_000 },
];

/** Service P95 latency, ms: January 2025 against December 2026. */
export const serviceLatency = [
  { from: 618, name: "Assistant", to: 384 },
  { from: 262, name: "Canvas", to: 207 },
  { from: 188, name: "Clips", to: 246 },
  { from: 143, name: "Sync", to: 118 },
  { from: 94, name: "Notify", to: 72 },
];

/** Endpoint latency target, ms. */
export const ENDPOINT_TARGET = 400;

export interface Endpoint {
  service: string;
  /** Method and path, as routed. */
  route: string;
  /** Requests a second at the daily peak. */
  rps: number;
  /** P95 latency in 2026, ms. */
  p95: number;
}

/** Every public endpoint, by service. */
export const endpoints: Endpoint[] = [
  { p95: 86, route: "GET /notes", rps: 940, service: "API" },
  { p95: 112, route: "POST /notes", rps: 410, service: "API" },
  { p95: 98, route: "PATCH /notes/:id", rps: 520, service: "API" },
  { p95: 74, route: "DELETE /notes/:id", rps: 60, service: "API" },
  { p95: 41, route: "GET /me", rps: 880, service: "API" },
  { p95: 132, route: "POST /sessions", rps: 210, service: "Auth" },
  { p95: 58, route: "POST /tokens/refresh", rps: 640, service: "Auth" },
  { p95: 214, route: "GET /sso/callback", rps: 35, service: "Auth" },
  { p95: 164, route: "GET /search", rps: 720, service: "Search" },
  { p95: 62, route: "GET /search/suggest", rps: 1080, service: "Search" },
  { p95: 338, route: "POST /search/reindex", rps: 12, service: "Search" },
  { p95: 124, route: "POST /sync/push", rps: 1140, service: "Sync" },
  { p95: 98, route: "GET /sync/pull", rps: 1190, service: "Sync" },
  { p95: 71, route: "GET /sync/changes", rps: 860, service: "Sync" },
  { p95: 246, route: "POST /clips", rps: 260, service: "Clips" },
  { p95: 182, route: "GET /clips/:id/preview", rps: 330, service: "Clips" },
  { p95: 204, route: "GET /canvas/:id", rps: 190, service: "Canvas" },
  { p95: 146, route: "POST /canvas/:id/ops", rps: 470, service: "Canvas" },
  { p95: 612, route: "POST /export/pdf", rps: 28, service: "Export" },
  { p95: 236, route: "POST /export/markdown", rps: 44, service: "Export" },
  { p95: 92, route: "GET /export/:id", rps: 70, service: "Export" },
  { p95: 118, route: "GET /billing/plan", rps: 55, service: "Billing" },
  { p95: 342, route: "POST /billing/checkout", rps: 9, service: "Billing" },
  { p95: 64, route: "POST /notify/push", rps: 390, service: "Notify" },
  { p95: 88, route: "GET /notify/inbox", rps: 280, service: "Notify" },
  {
    p95: 384,
    route: "POST /assistant/summarise",
    rps: 120,
    service: "Assistant",
  },
  { p95: 142, route: "GET /assistant/threads", rps: 210, service: "Assistant" },
  { p95: 452, route: "POST /assistant/draft", rps: 150, service: "Assistant" },
];

/** Cities' P95 page load, ms: January 2025 against December 2026. */
export const cityLatency = [
  { after: 119, before: 182, name: "London" },
  { after: 118, before: 176, name: "Berlin" },
  { after: 112, before: 156, name: "Toronto" },
  { after: 103, before: 149, name: "Austin" },
  { after: 344, before: 301, name: "São Paulo" },
  { after: 208, before: 352, name: "Nairobi" },
  { after: 196, before: 318, name: "Bangalore" },
  { after: 137, before: 241, name: "Seoul" },
];

// ---------- Errors by service and hour ----------

export const HOURS = Array.from({ length: 24 }, (_, h) => h);
export const ERROR_SERVICES = [
  "API",
  "Auth",
  "Search",
  "Sync",
  "Clips",
  "Notify",
];

/** Error rate (%) per service per hour of the day, UTC. */
export const errorRates: number[][] = (() => {
  const rand = mulberry32(89);
  // Service-hour cells that run hot, keyed "service-hour": sync at the
  // European morning, api in the American afternoon.
  const hot = new Map([
    ["3-8", 1.82],
    ["3-9", 2.36],
    ["3-10", 1.74],
    ["0-19", 1.69],
  ]);
  return ERROR_SERVICES.map((_, r) =>
    HOURS.map(
      (h) =>
        hot.get(`${r}-${h}`) ??
        Math.round((0.12 + rand() ** 1.6 * 1.3) * 100) / 100
    )
  );
})();

export const ERROR_THRESHOLD = 1.6;

// ---------- The funnel ----------

/** One month's visitors, followed from first visit to the ninetieth day. */
export const funnel = {
  links: [
    { source: "visitors", target: "trials", value: 9800 },
    { source: "visitors", target: "left", value: 42_200 },
    { source: "trials", target: "activated", value: 4100 },
    { source: "trials", target: "idle", value: 5700 },
    { source: "activated", target: "retained", value: 2300 },
    { source: "activated", target: "lapsed", value: 1800 },
    { source: "retained", target: "paying", value: 1250 },
    { source: "retained", target: "free", value: 1050 },
  ],
  nodes: [
    { id: "visitors", label: "Visitors", stage: 0 },
    { id: "trials", label: "Trials", stage: 1 },
    { id: "left", label: "Left", stage: 1 },
    { id: "activated", label: "Activated", stage: 2 },
    { id: "idle", label: "Never set up", stage: 2 },
    { id: "retained", label: "Retained", stage: 3 },
    { alert: true, id: "lapsed", label: "Lapsed", stage: 3 },
    { id: "paying", label: "Paying", stage: 4 },
    { id: "free", label: "Free plan", stage: 4 },
  ],
  stages: ["First visit", "Day 1", "Day 7", "Day 30", "Day 90"],
};
