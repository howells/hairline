/**
 * Twelve summer migrants in Britain: the week each arrives and how its share of
 * bird records climbs, March to August 2025.
 *
 * Source: GBIF occurrence search, the eBird Observation Dataset (Cornell Lab
 * of Ornithology, CC BY 4.0, https://doi.org/10.15468/aomfnb) and the other
 * datasets GBIF aggregates, restricted to country GB. Each count is
 * https://api.gbif.org/v1/occurrence/search?country=GB&taxonKey=<key>&eventDate=<first day>,<last day>&limit=0
 * for 24 consecutive 7-day weeks from 2025-03-01 to 2025-08-15, once for each
 * species and once for all birds (taxonKey=212, class Aves). The species
 * keys came from https://api.gbif.org/v1/species/match: Northern wheatear Oenanthe oenanthe (5231240), Sand martin Riparia riparia (2489160), Chiffchaff Phylloscopus collybita (2493091), Swallow Hirundo rustica (9515886), Willow warbler Phylloscopus trochilus (2493052), Cuckoo Cuculus canorus (5231918), Whitethroat Curruca communis (10507373), House martin Delichon urbicum (2489214), Nightingale Luscinia megarhynchos (7660710), Garden warbler Sylvia borin (2492942), Swift Apus apus (5228676), Spotted flycatcher Muscicapa striata (2492576).
 * Fetched 2026-10-15 (saved to reference/raw/L1/gbif_weekly_2025.json).
 * GBIF counts drift as records are added, so a refetch will differ a little.
 * BTO BirdTrack reporting rates, the plan's first choice, are not offered as a
 * download.
 *
 * Transform: a species' reading for a week is its record count divided by the
 * count of all bird records that week, in per cent, to two decimals (a share
 * of records, not a BirdTrack-style reporting rate). `size` is the largest
 * weekly reading. `launch` is the 1-based week (1 is the week from 1 March)
 * of the first reading at or above a quarter of the species' own peak. `weekly[t]` is the
 * reading t weeks after that week, through week 24; weekly[0] is the arrival
 * week itself. Spokes are sorted by `launch` in the chart. Chiffchaff, which
 * winters here in small numbers, arrives in week 2 on this rule; the
 * quarter-of-peak threshold is mine and is the one judgment in the transform.
 * Script: reference/scripts/L1/emit.py.
 */
export interface LaunchFanDatum {
  name: string;
  /** Week (or month, with `unit="month"`) of arrival, 1-based. */
  launch: number;
  /** Peak reading. Sizes the arrival dot. */
  size: number;
  /** One reading per week (or month) from arrival on; sizes the small dots. */
  weekly?: number[];
}

/** Weeks in the demo span: 1 March 2025 starts week 1, week 24 ends 15 August. */
export const ARRIVAL_WEEKS = 24;

/** The first day of demo week `n` (week 1 starts on 1 March 2025). */
export const arrivalWeekDate = (n: number) =>
  new Date(Date.UTC(2025, 2, 1 + 7 * (n - 1)));

const seeds: [string, number, number, number[]][] = [
  [
    "Chiffchaff",
    2,
    3.31,
    [
      1.32, 1.63, 2.87, 3.31, 2.98, 2.54, 2.28, 2.25, 2.11, 1.9, 1.95, 1.51,
      1.57, 1.65, 1.66, 1.66, 1.6, 1.28, 1.13, 0.85, 0.83, 1.02, 0.98,
    ],
  ],
  [
    "Sand martin",
    4,
    0.58,
    [
      0.2, 0.24, 0.47, 0.58, 0.49, 0.43, 0.51, 0.39, 0.4, 0.49, 0.49, 0.43, 0.5,
      0.51, 0.42, 0.38, 0.34, 0.41, 0.32, 0.48, 0.31,
    ],
  ],
  [
    "Wheatear",
    4,
    0.38,
    [
      0.11, 0.12, 0.32, 0.32, 0.33, 0.38, 0.23, 0.15, 0.14, 0.1, 0.12, 0.1,
      0.18, 0.15, 0.12, 0.14, 0.12, 0.13, 0.17, 0.13, 0.27,
    ],
  ],
  [
    "Swallow",
    6,
    1.75,
    [
      0.8, 0.89, 1.13, 1.19, 1.44, 1.5, 1.46, 1.36, 1.36, 1.45, 1.43, 1.49,
      1.41, 1.59, 1.44, 1.5, 1.57, 1.75, 1.69,
    ],
  ],
  [
    "Willow warbler",
    6,
    0.97,
    [
      0.7, 0.92, 0.97, 0.84, 0.69, 0.84, 0.66, 0.64, 0.81, 0.68, 0.45, 0.32,
      0.26, 0.18, 0.16, 0.2, 0.31, 0.28, 0.35,
    ],
  ],
  [
    "Nightingale",
    7,
    0.13,
    [
      0.11, 0.13, 0.12, 0.1, 0.08, 0.06, 0.04, 0.06, 0.05, 0, 0.01, 0.01, 0.01,
      0, 0.01, 0, 0.02, 0.01,
    ],
  ],
  [
    "Whitethroat",
    7,
    1.25,
    [
      0.48, 0.82, 1.25, 1, 0.9, 0.75, 0.65, 0.67, 0.7, 0.61, 0.57, 0.56, 0.47,
      0.3, 0.27, 0.24, 0.32, 0.25,
    ],
  ],
  [
    "Cuckoo",
    8,
    0.62,
    [
      0.3, 0.53, 0.56, 0.55, 0.62, 0.46, 0.28, 0.25, 0.22, 0.08, 0.03, 0.03,
      0.02, 0.04, 0.03, 0.03, 0.03,
    ],
  ],
  [
    "Garden warbler",
    8,
    0.45,
    [
      0.19, 0.34, 0.45, 0.31, 0.33, 0.2, 0.17, 0.21, 0.16, 0.16, 0.11, 0.07,
      0.06, 0.03, 0.04, 0.04, 0.03,
    ],
  ],
  [
    "House martin",
    9,
    1.42,
    [
      0.52, 0.73, 0.88, 1.05, 1.15, 1.06, 0.99, 1.18, 1.42, 1.05, 1.07, 0.96,
      1.11, 1.11, 1.08, 0.88,
    ],
  ],
  [
    "Swift",
    9,
    1.47,
    [
      0.53, 1.02, 1.12, 1.14, 1.47, 1.29, 1.34, 1.22, 1.33, 1.22, 1.42, 1.09,
      0.88, 0.51, 0.56, 0.42,
    ],
  ],
  [
    "Spotted flycatcher",
    10,
    0.32,
    [
      0.11, 0.24, 0.19, 0.18, 0.15, 0.16, 0.24, 0.18, 0.26, 0.19, 0.25, 0.19,
      0.23, 0.26, 0.32,
    ],
  ],
];

export const launchFanDemo: LaunchFanDatum[] = seeds.map(
  ([name, launch, size, weekly]) => ({ launch, name, size, weekly })
);
