/** One reading per day. */
export interface DailyDatum {
  date: Date;
  value: number;
}

/**
 * F2 Sterling in September. US dollars to the pound, the Federal Reserve's
 * daily noon buying rate in New York, for each day it was published in
 * September 2022: 21 readings, none at weekends. The lowest is 1.0703 on
 * 2022-09-26, the first trading day after the mini-budget of Friday 23 September; the
 * highest is 1.1701 on 2022-09-12. The Fed publishes no rate for 2022-09-05 (a US
 * holiday, marked ND in the table).
 *
 * Source: Board of Governors of the Federal Reserve System, Foreign Exchange
 * Rates - H.10, historical rates for the Great British Pound (a US government
 * publication, public domain).
 *   https://www.federalreserve.gov/releases/h10/hist/dat00_uk.htm
 * Fetched 2026-10-15 (release date 13 October 2026).
 *
 * Transform: keep the rows dated September 2022 and drop the ND row. Rates are
 * as published, four decimal places. Scripts: reference/scripts/F2/gen.py.
 */
const readings: [string, number][] = [
  ["2022-09-01", 1.1541],
  ["2022-09-02", 1.1582],
  ["2022-09-06", 1.1549],
  ["2022-09-07", 1.1473],
  ["2022-09-08", 1.1489],
  ["2022-09-09", 1.16],
  ["2022-09-12", 1.1701],
  ["2022-09-13", 1.1526],
  ["2022-09-14", 1.1564],
  ["2022-09-15", 1.1472],
  ["2022-09-16", 1.1419],
  ["2022-09-19", 1.1403],
  ["2022-09-20", 1.1405],
  ["2022-09-21", 1.133],
  ["2022-09-22", 1.1269],
  ["2022-09-23", 1.0921],
  ["2022-09-26", 1.0703],
  ["2022-09-27", 1.0753],
  ["2022-09-28", 1.0832],
  ["2022-09-29", 1.1048],
  ["2022-09-30", 1.1134],
];

export const hairlineLineDemo: DailyDatum[] = readings.map(([day, value]) => ({
  date: new Date(`${day}T00:00:00Z`),
  value,
}));
