/**
 * Autumn 2026 high and low water at Eastport, Maine, a day at a time.
 *
 * Source: NOAA CO-OPS tide predictions (Center for Operational Oceanographic
 * Products and Services), station 8410140 (Eastport), the coming autumn: 1
 * October to 31 December 2026, 92 days. Query:
 * https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?product=predictions&application=hairline&begin_date=20261001&end_date=20261231&datum=MLLW&station=8410140&time_zone=lst&units=metric&interval=hilo&format=json
 * The station ID was looked up in NOAA's station list:
 * https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json?type=tidepredictions
 * Fetched 2026-10-15. Heights are predictions in metres above MLLW (mean lower
 * low water), so a low can read below zero.
 *
 * Transform: the file lists every high ("H") and low ("L") tide with its time
 * in local standard time ("lst", no daylight saving). Each calendar day takes
 * its highest "H" height as `value` and its lowest "L" height as `low`, so
 * the stem is that day's range. Nothing else changes: the heights are the
 * file's own, with trailing zeros dropped. All 92 days have a high and a low.
 */
export interface BarcodeDatum {
  date: Date;
  /** The day's high water, in metres above MLLW. */
  value: number;
  /** Where the stem ends: the day's low water. Defaults to 90% of the value. */
  low?: number;
}

const DAY = 86_400_000;
const start = Date.UTC(2026, 9, 1);

/** Each day's highest high water, 1 October to 31 December 2026. */
const HIGH = [
  6.087, 5.891, 5.689, 5.554, 5.54, 5.638, 5.784, 5.912, 5.973, 6.09, 6.116,
  6.051, 5.914, 5.73, 5.522, 5.316, 5.138, 5.022, 4.997, 5.071, 5.227, 5.429,
  5.642, 5.873, 6.143, 6.347, 6.459, 6.463, 6.361, 6.175, 5.943, 5.717, 5.556,
  5.498, 5.529, 5.613, 5.798, 5.937, 6.009, 6.007, 5.942, 5.828, 5.685, 5.53,
  5.377, 5.241, 5.138, 5.087, 5.105, 5.197, 5.405, 5.689, 5.984, 6.251, 6.454,
  6.564, 6.566, 6.465, 6.282, 6.048, 5.8, 5.582, 5.477, 5.516, 5.598, 5.692,
  5.771, 5.821, 5.835, 5.814, 5.763, 5.691, 5.606, 5.512, 5.416, 5.322, 5.24,
  5.248, 5.356, 5.518, 5.729, 5.97, 6.212, 6.421, 6.56, 6.605, 6.544, 6.386,
  6.148, 5.86, 5.693, 5.572,
];

/** Each day's lowest low water, 1 October to 31 December 2026. */
const LOW = [
  -0.101, 0.101, 0.276, 0.356, 0.688, 0.312, 0.177, 0.02, -0.149, -0.248,
  -0.243, -0.147, 0.015, 0.218, 0.433, 0.634, 0.791, 0.872, 0.858, 1.109, 0.75,
  0.576, 0.316, 0.002, -0.268, -0.458, -0.544, -0.519, -0.395, -0.204, 0.01,
  0.191, 0.294, 0.6, 0.306, 0.257, 0.083, -0.058, -0.123, -0.108, -0.026, 0.102,
  0.251, 0.403, 0.54, 0.649, 0.716, 0.729, 0.682, 0.815, 0.559, 0.254, -0.059,
  -0.334, -0.532, -0.628, -0.618, -0.516, -0.349, -0.147, 0.057, 0.23, 0.352,
  0.445, 0.346, 0.229, 0.13, 0.071, 0.058, 0.086, 0.14, 0.209, 0.282, 0.355,
  0.425, 0.493, 0.55, 0.583, 0.576, 0.482, 0.247, -0.019, -0.282, -0.501,
  -0.643, -0.691, -0.641, -0.503, -0.292, -0.033, 0.239, 0.399,
];

export const barcodeLollipopDemo: BarcodeDatum[] = HIGH.map((value, i) => ({
  date: new Date(start + i * DAY),
  low: LOW[i],
  value,
}));
