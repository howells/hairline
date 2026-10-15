/**
 * G8 Rain and river: the Ure in Wensleydale, 28 November to 21 December 2015.
 * Rain hangs from the top; the river rises from the floor.
 *
 * Sources: Environment Agency Hydrology API (Open Government Licence v3.0),
 * https://environment.data.gov.uk/hydrology/ , fetched 2026-10-15.
 *  - Flow: daily mean flow, m3/s, River Ure at Kilgram Bridge (station
 *    F2206, guid 41d13879-a145-4975-83bc-1aa9878d2fb5), measure
 *    41d13879-a145-4975-83bc-1aa9878d2fb5-flow-m-86400-m3s-qualified:
 *    https://environment.data.gov.uk/hydrology/id/measures/41d13879-a145-4975-83bc-1aa9878d2fb5-flow-m-86400-m3s-qualified/readings.json?mineq-date=2015-11-28&maxeq-date=2015-12-21
 *  - Rain: daily total, mm, the Sedbusk rain gauge in Upper Wensleydale
 *    (guid 74d6a909-ad5a-4e66-8f2a-9ad42ec1dbb5), measure
 *    74d6a909-ad5a-4e66-8f2a-9ad42ec1dbb5-rainfall-t-86400-mm-qualified:
 *    https://environment.data.gov.uk/hydrology/id/measures/74d6a909-ad5a-4e66-8f2a-9ad42ec1dbb5-rainfall-t-86400-mm-qualified/readings.json?mineq-date=2015-11-28&maxeq-date=2015-12-21
 *
 * Transform: the 24 days from 2015-11-28 to 2015-12-21, each date's rain
 * total and mean flow side by side, flow rounded to 0.1 m3/s. All 48 readings
 * are marked Complete. The rain gauge is one point, not a catchment average.
 * The wettest day is 5 December (76.8
 * mm); the river's daily mean peaks the same day (315.1 m3/s), so the two
 * shapes line up bar for bar rather than lagging by days.
 */

export interface RainfallDatum {
  /** The day. */
  date: Date;
  /** Hangs from the top: rain, mm. */
  input: number;
  /** Rises from the floor: mean river flow, m3/s. */
  output: number;
}

/** Year, month, day, rain (mm), flow (m3/s). */
const DAYS: [number, number, number, number, number][] = [
  [2015, 11, 28, 26, 64.7],
  [2015, 11, 29, 11.8, 88.9],
  [2015, 11, 30, 17.6, 70.6],
  [2015, 12, 1, 4.2, 59.2],
  [2015, 12, 2, 11.4, 52.9],
  [2015, 12, 3, 24.6, 95.7],
  [2015, 12, 4, 49.6, 78.9],
  [2015, 12, 5, 76.8, 315.1],
  [2015, 12, 6, 1, 210.2],
  [2015, 12, 7, 11.8, 53.1],
  [2015, 12, 8, 7.2, 62.2],
  [2015, 12, 9, 43.6, 76.6],
  [2015, 12, 10, 8.6, 162],
  [2015, 12, 11, 5.2, 60.3],
  [2015, 12, 12, 10.8, 60.3],
  [2015, 12, 13, 16.6, 44],
  [2015, 12, 14, 3.6, 55.7],
  [2015, 12, 15, 4.2, 48.7],
  [2015, 12, 16, 1.8, 51.9],
  [2015, 12, 17, 2.4, 33.7],
  [2015, 12, 18, 5, 31.1],
  [2015, 12, 19, 29.4, 73.7],
  [2015, 12, 20, 6.6, 83.2],
  [2015, 12, 21, 36.2, 71.2],
];

/** Rain at Sedbusk and flow of the Ure at Kilgram Bridge, a day at a time. */
export const rainfallDemo: RainfallDatum[] = DAYS.map(
  ([y, m, d, input, output]) => ({
    date: new Date(Date.UTC(y, m - 1, d)),
    input,
    output,
  })
);
