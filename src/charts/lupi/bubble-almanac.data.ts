/**
 * Twelve coffee-growing countries over nine years, 2016 to 2024: tonnes of
 * green coffee produced (size), the yield per hectare (the dark core) and
 * whether that year's crop fell from the year before (a dotted ring).
 *
 * Source: FAO, FAOSTAT "Crops and livestock products" (QCL), bulk file
 * Production_Crops_Livestock_E_All_Data_(Normalized).csv, item "Coffee,
 * green", elements Production (tonnes) and Yield (kg/ha), CC BY 4.0:
 * https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_All_Data_(Normalized).zip
 * (catalogue: https://www.fao.org/faostat/en/#data/QCL).
 * Fetched 2026-10-15 (saved to reference/raw/L9/).
 *
 * Transform: the twelve countries with the largest 2024 production, leaving
 * out regional and income-group aggregates. `value` is Production in millions
 * of tonnes to three decimals; `core` is Yield in tonnes per hectare (kg/ha
 * divided by 1,000) to two decimals; `flag` is true when the year's production
 * is below the previous year's (2015 is read for 2016). "Central African
 * Republic" is shortened to "Central African Rep." to fit the column head. A country-year with
 * no figure is left out. FAOSTAT revises past years, so a refetch can differ.
 * Script: reference/scripts/L9/coffee.py and emit.py.
 */
export interface AlmanacCell {
  category: string;
  year: number;
  /** Size of the circle: millions of tonnes produced. */
  value: number;
  /** Drawn as the dark core: yield, tonnes per hectare. */
  core: number;
  /** Drawn as a dotted ring: production fell on the year before. */
  flag?: boolean;
}

export interface AlmanacNote {
  category: string;
  year: number;
  text: string;
  /** Offset of the note text from the bubble centre, in px. */
  dx: number;
  dy: number;
}

export interface AlmanacEvent {
  label: string;
  text: string;
}

export const bubbleAlmanacDemo: AlmanacCell[] = [
  { category: "Brazil", core: 1.51, value: 3.024, year: 2016 },
  { category: "Brazil", core: 1.49, flag: true, value: 2.685, year: 2017 },
  { category: "Brazil", core: 1.91, value: 3.553, year: 2018 },
  { category: "Brazil", core: 1.65, flag: true, value: 3.012, year: 2019 },
  { category: "Brazil", core: 1.95, value: 3.706, year: 2020 },
  { category: "Brazil", core: 1.63, flag: true, value: 2.986, year: 2021 },
  { category: "Brazil", core: 1.7, value: 3.179, year: 2022 },
  { category: "Brazil", core: 1.76, value: 3.349, year: 2023 },
  { category: "Brazil", core: 1.74, value: 3.388, year: 2024 },
  { category: "Viet Nam", core: 2.44, value: 1.461, year: 2016 },
  { category: "Viet Nam", core: 2.55, value: 1.542, year: 2017 },
  { category: "Viet Nam", core: 2.61, value: 1.616, year: 2018 },
  { category: "Viet Nam", core: 2.7, value: 1.687, year: 2019 },
  { category: "Viet Nam", core: 2.77, value: 1.763, year: 2020 },
  { category: "Viet Nam", core: 2.82, value: 1.845, year: 2021 },
  { category: "Viet Nam", core: 2.98, value: 1.954, year: 2022 },
  { category: "Viet Nam", core: 2.93, value: 1.957, year: 2023 },
  { category: "Viet Nam", core: 2.97, value: 2.015, year: 2024 },
  { category: "Colombia", core: 1.05, flag: true, value: 0.818, year: 2016 },
  { category: "Colombia", core: 0.94, value: 0.852, year: 2017 },
  { category: "Colombia", core: 0.93, flag: true, value: 0.813, year: 2018 },
  { category: "Colombia", core: 1.04, value: 0.885, year: 2019 },
  { category: "Colombia", core: 0.99, flag: true, value: 0.833, year: 2020 },
  { category: "Colombia", core: 0.67, flag: true, value: 0.56, year: 2021 },
  { category: "Colombia", core: 0.79, value: 0.665, year: 2022 },
  { category: "Colombia", core: 0.81, value: 0.681, year: 2023 },
  { category: "Colombia", core: 1, value: 0.84, year: 2024 },
  { category: "Indonesia", core: 0.52, flag: true, value: 0.639, year: 2016 },
  { category: "Indonesia", core: 0.58, value: 0.718, year: 2017 },
  { category: "Indonesia", core: 0.6, value: 0.756, year: 2018 },
  { category: "Indonesia", core: 0.6, flag: true, value: 0.753, year: 2019 },
  { category: "Indonesia", core: 0.61, value: 0.762, year: 2020 },
  { category: "Indonesia", core: 0.61, value: 0.786, year: 2021 },
  { category: "Indonesia", core: 0.61, flag: true, value: 0.775, year: 2022 },
  { category: "Indonesia", core: 0.6, flag: true, value: 0.759, year: 2023 },
  { category: "Indonesia", core: 0.64, value: 0.808, year: 2024 },
  { category: "Ethiopia", core: 0.65, flag: true, value: 0.495, year: 2016 },
  { category: "Ethiopia", core: 0.68, value: 0.55, year: 2017 },
  { category: "Ethiopia", core: 0.66, value: 0.574, year: 2018 },
  { category: "Ethiopia", core: 0.66, flag: true, value: 0.574, year: 2019 },
  { category: "Ethiopia", core: 0.68, value: 0.585, year: 2020 },
  { category: "Ethiopia", core: 0.65, value: 0.59, year: 2021 },
  { category: "Ethiopia", core: 0.69, flag: true, value: 0.546, year: 2022 },
  { category: "Ethiopia", core: 0.66, value: 0.559, year: 2023 },
  { category: "Ethiopia", core: 0.67, value: 0.576, year: 2024 },
  { category: "Uganda", core: 0.56, value: 0.243, year: 2016 },
  { category: "Uganda", core: 0.57, value: 0.302, year: 2017 },
  { category: "Uganda", core: 0.57, flag: true, value: 0.284, year: 2018 },
  { category: "Uganda", core: 0.58, value: 0.314, year: 2019 },
  { category: "Uganda", core: 0.57, value: 0.36, year: 2020 },
  { category: "Uganda", core: 0.56, value: 0.414, year: 2021 },
  { category: "Uganda", core: 0.56, value: 0.507, year: 2022 },
  { category: "Uganda", core: 0.55, flag: true, value: 0.468, year: 2023 },
  { category: "Uganda", core: 0.55, flag: true, value: 0.402, year: 2024 },
  { category: "India", core: 0.8, value: 0.348, year: 2016 },
  { category: "India", core: 0.69, flag: true, value: 0.312, year: 2017 },
  { category: "India", core: 0.77, value: 0.316, year: 2018 },
  { category: "India", core: 0.77, value: 0.32, year: 2019 },
  { category: "India", core: 0.71, flag: true, value: 0.298, year: 2020 },
  { category: "India", core: 0.79, value: 0.334, year: 2021 },
  { category: "India", core: 0.73, value: 0.352, year: 2022 },
  { category: "India", core: 0.74, value: 0.36, year: 2023 },
  { category: "India", core: 0.74, value: 0.363, year: 2024 },
  { category: "Peru", core: 0.72, value: 0.278, year: 2016 },
  { category: "Peru", core: 0.8, value: 0.337, year: 2017 },
  { category: "Peru", core: 0.85, value: 0.37, year: 2018 },
  { category: "Peru", core: 0.83, flag: true, value: 0.363, year: 2019 },
  { category: "Peru", core: 0.82, flag: true, value: 0.353, year: 2020 },
  { category: "Peru", core: 0.85, value: 0.364, year: 2021 },
  { category: "Peru", core: 0.85, flag: true, value: 0.357, year: 2022 },
  { category: "Peru", core: 0.86, value: 0.367, year: 2023 },
  { category: "Peru", core: 0.85, flag: true, value: 0.359, year: 2024 },
  { category: "Central African Rep.", core: 0.23, value: 0.01, year: 2016 },
  {
    category: "Central African Rep.",
    core: 0.22,
    flag: true,
    value: 0.01,
    year: 2017,
  },
  { category: "Central African Rep.", core: 0.3, value: 0.09, year: 2018 },
  { category: "Central African Rep.", core: 0.33, value: 0.203, year: 2019 },
  { category: "Central African Rep.", core: 0.4, value: 0.289, year: 2020 },
  { category: "Central African Rep.", core: 0.4, value: 0.298, year: 2021 },
  { category: "Central African Rep.", core: 0.4, value: 0.307, year: 2022 },
  { category: "Central African Rep.", core: 0.4, value: 0.316, year: 2023 },
  { category: "Central African Rep.", core: 0.34, value: 0.325, year: 2024 },
  { category: "Honduras", core: 1.18, value: 0.367, year: 2016 },
  { category: "Honduras", core: 1.13, value: 0.478, year: 2017 },
  { category: "Honduras", core: 1.11, value: 0.479, year: 2018 },
  { category: "Honduras", core: 1.11, flag: true, value: 0.472, year: 2019 },
  { category: "Honduras", core: 1.13, flag: true, value: 0.365, year: 2020 },
  { category: "Honduras", core: 1.17, value: 0.418, year: 2021 },
  { category: "Honduras", core: 1.18, flag: true, value: 0.33, year: 2022 },
  { category: "Honduras", core: 1.2, value: 0.384, year: 2023 },
  { category: "Honduras", core: 1.21, flag: true, value: 0.324, year: 2024 },
  { category: "Guatemala", core: 0.86, value: 0.236, year: 2016 },
  { category: "Guatemala", core: 0.87, flag: true, value: 0.224, year: 2017 },
  { category: "Guatemala", core: 0.86, value: 0.24, year: 2018 },
  { category: "Guatemala", core: 0.83, flag: true, value: 0.216, year: 2019 },
  { category: "Guatemala", core: 0.77, value: 0.246, year: 2020 },
  { category: "Guatemala", core: 0.71, flag: true, value: 0.227, year: 2021 },
  { category: "Guatemala", core: 0.63, value: 0.238, year: 2022 },
  { category: "Guatemala", core: 0.57, flag: true, value: 0.213, year: 2023 },
  { category: "Guatemala", core: 0.6, value: 0.225, year: 2024 },
  { category: "Mexico", core: 0.23, flag: true, value: 0.152, year: 2016 },
  { category: "Mexico", core: 0.24, value: 0.154, year: 2017 },
  { category: "Mexico", core: 0.25, value: 0.158, year: 2018 },
  { category: "Mexico", core: 0.26, value: 0.166, year: 2019 },
  { category: "Mexico", core: 0.28, value: 0.176, year: 2020 },
  { category: "Mexico", core: 0.27, flag: true, value: 0.174, year: 2021 },
  { category: "Mexico", core: 0.29, value: 0.189, year: 2022 },
  { category: "Mexico", core: 0.3, value: 0.195, year: 2023 },
  { category: "Mexico", core: 0.29, flag: true, value: 0.194, year: 2024 },
];

export const bubbleAlmanacLabelled = [];
