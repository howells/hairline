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

/**
 * F15 Sunshine by season. Hours of bright sunshine in each month recorded at
 * Oxford (Radcliffe Observatory), grouped by season: spring is March to May,
 * summer June to August, autumn September to November, winter December to
 * February. 1173 monthly readings, from 1929 to 2026-09.
 *
 * Source: Met Office historic station data, Oxford, monthly (Open Government
 * Licence v3.0). Sunshine comes from a Campbell Stokes recorder, and from an
 * automatic Kipp & Zonen sensor in later years, as the file's header explains.
 *   https://www.metoffice.gov.uk/research/climate/maps-and-data/historic-station-data
 *   https://www.metoffice.gov.uk/pub/data/weather/uk/climate/stationdata/oxforddata.txt
 * Fetched 2026-10-15.
 *
 * Transform: take the "sun" column, drop months marked missing (---), strip the
 * estimate (*) and sensor (#) marks, and group the months by season. For each
 * season: quartiles by linear interpolation, the whiskers at the lowest and
 * highest reading within 1.5 times the interquartile range of the box, and the
 * readings beyond them listed as outliers. Scripts: reference/scripts/F11/gen.py.
 */
export const tickBoxDemo: BoxDatum[] = [
  {
    label: "Spring",
    max: 285,
    median: 154.55,
    min: 48.8,
    outliers: [300.8, 322.8],
    q1: 123.125,
    q3: 188.275,
  },
  {
    label: "Summer",
    max: 303.7,
    median: 192,
    min: 97.5,
    outliers: [353],
    q1: 161.875,
    q3: 226.875,
  },
  {
    label: "Autumn",
    max: 199.1,
    median: 101.85,
    min: 31,
    outliers: [210.4, 213.9],
    q1: 76.7,
    q3: 129.25,
  },
  {
    label: "Winter",
    max: 107,
    median: 59.7,
    min: 18.2,
    outliers: [112.9, 113, 115.1, 115.9, 117.6, 124.1, 127.8],
    q1: 47.7,
    q3: 72.3,
  },
];
