export interface RungDatum {
  label: string;
  value: number;
}

/**
 * F1 Major earthquakes. Earthquakes of magnitude 7.0 or more recorded
 * worldwide in each calendar year from 2016 to 2025, 134 in all: 7 in 2017 at
 * the fewest, 19 in 2021 at the most.
 *
 * Source: U.S. Geological Survey, Earthquake Catalog, FDSN event web service,
 * count method (USGS-authored data, public domain), eventtype=earthquake.
 *   https://earthquake.usgs.gov/fdsnws/event/1/count?starttime=2016-01-01&endtime=2017-01-01&minmagnitude=7&eventtype=earthquake
 *   (the same request for each year to 2025)
 * Fetched 2026-10-15.
 *
 * Transform: none. Each value is the count returned for 1 January to 1
 * January of the following year (UTC). Scripts: reference/scripts/F1/fetch.py
 * and gen.py.
 */
export const rungBarsDemo: RungDatum[] = [
  { label: "2016", value: 16 },
  { label: "2017", value: 7 },
  { label: "2018", value: 17 },
  { label: "2019", value: 10 },
  { label: "2020", value: 9 },
  { label: "2021", value: 19 },
  { label: "2022", value: 11 },
  { label: "2023", value: 19 },
  { label: "2024", value: 10 },
  { label: "2025", value: 16 },
];
