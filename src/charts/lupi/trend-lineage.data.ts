/** One feature's life: when it shipped, was reworked, sat dormant, or was retired. */
export interface LineageDatum {
  name: string;
  /** Year it first shipped (fractions allowed: 2017.5 = mid-2017). */
  shipped: number;
  /** Years it was substantially reworked. */
  reworked?: number[];
  /** Spans when it sat untouched, drawn dotted. */
  dormant?: [number, number][];
  /** Year it was retired. Omit if it is still alive today. */
  retired?: number;
}

/** Ten Fieldnote features, 2018 to 2026: when each shipped, was reworked or sat idle. */
export const trendLineageDemo: LineageDatum[] = [
  { name: "Notes", reworked: [2021, 2025], shipped: 2018 },
  { name: "Search", reworked: [2023], shipped: 2018 },
  {
    dormant: [[2020.5, 2023]],
    name: "Clips",
    reworked: [2023.5],
    shipped: 2019,
  },
  {
    dormant: [[2021, 2024.5]],
    name: "Tags",
    reworked: [2025],
    shipped: 2019.5,
  },
  { name: "Canvas", reworked: [2024], shipped: 2020 },
  { name: "Share", shipped: 2020.5 },
  { name: "Comments", reworked: [2022.5], shipped: 2021 },
  { name: "Templates", reworked: [2023.5], shipped: 2022 },
  { name: "Calendar", shipped: 2023 },
  { name: "Assistant", reworked: [2025, 2026], shipped: 2024 },
];
