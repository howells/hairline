export interface RaceSeries {
  label: string;
  /** One value per period. */
  values: number[];
}

export interface RaceData {
  periods: string[];
  series: RaceSeries[];
}

/**
 * Busiest stations: passenger entries and exits in millions a year at eight
 * London stations, financial years 2017-18 to 2024-25 (April to March).
 *
 * Source: Office of Rail and Road, Estimates of station usage, Table 1415
 * "Time series of passenger entries, exits and interchanges by station",
 * worksheet 1415a_Entries_and_Exits (Open Government Licence v3.0):
 * https://dataportal.orr.gov.uk/statistics/usage/estimates-of-station-usage/
 * file https://dataportal.orr.gov.uk/media/1908/table-1415-time-series-of-passenger-entries-and-exits-and-interchanges-by-station.ods
 * Fetched 2026-10-15.
 *
 * Transform: for each of the eight stations (rows "London Waterloo", "London
 * Victoria", "London Liverpool Street", "London Bridge", "Stratford (London)",
 * "London Paddington", "London Euston", "Farringdon"), the eight columns
 * "Apr 2017 to Mar 2018" to "Apr 2024 to Mar 2025", divided by 1,000,000 and
 * rounded to one decimal. The stations were picked because their order
 * changes: Waterloo is first until 2021-22 except in 2020-21, when Stratford
 * leads, and Liverpool Street is first from 2022-23, the year the Elizabeth
 * line opened. Station names
 * are shortened ("London Waterloo" to "Waterloo"). The workbook marks 2022-23
 * with a break in the series [b].
 */
export const barRaceDemo: RaceData = {
  periods: [
    "2017-18",
    "2018-19",
    "2019-20",
    "2020-21",
    "2021-22",
    "2022-23",
    "2023-24",
    "2024-25",
  ],
  series: [
    {
      label: "Waterloo",
      values: [94.4, 94.2, 86.9, 12.2, 41.4, 57.8, 62.5, 70.4],
    },
    {
      label: "Victoria",
      values: [75, 74.7, 73.6, 13.8, 36.8, 45.6, 50.8, 53.8],
    },
    {
      label: "Liverpool Street",
      values: [67, 69.5, 66, 11.2, 32.2, 80.4, 94.5, 98],
    },
    {
      label: "London Bridge",
      values: [48.5, 61.3, 63.1, 13.8, 33.3, 47.7, 50, 54.7],
    },
    {
      label: "Stratford",
      values: [40.1, 41.2, 41.9, 14, 28.2, 44.1, 56.6, 51.5],
    },
    {
      label: "Paddington",
      values: [36.6, 38.2, 44.9, 6.4, 23.9, 59.2, 66.9, 69.9],
    },
    {
      label: "Euston",
      values: [44.7, 46.1, 44.8, 6.6, 23.1, 31.3, 36.2, 40.2],
    },
    {
      label: "Farringdon",
      values: [12.6, 15.1, 16.5, 2.6, 6.9, 31.5, 46, 50.2],
    },
  ],
};
