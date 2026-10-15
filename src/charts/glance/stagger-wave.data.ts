/**
 * G12 Cold December: the daily mean temperature of central England, 2 November
 * to 27 December 2010, one bar a day.
 *
 * Source: Met Office Hadley Centre Central England Temperature (HadCET),
 * daily mean, v2.1.1.0 + provisional,
 * https://www.metoffice.gov.uk/hadobs/hadcet/data/download.html
 * File: https://www.metoffice.gov.uk/hadobs/hadcet/data/meantemp_daily_totals.txt
 * Fetched 2026-10-15. Licence: Open Government Licence v3.0, with the Met
 * Office's attribution.
 *
 * Transform: the 56 values from 2010-11-02 to 2010-12-27, in degrees Celsius
 * to one decimal place, exactly as they stand (none is missing). The coldest
 * is 20 December, -7.0; 23 of the 56 days are below zero. December 2010 had
 * a mean of -0.67 (the mean of its 31 daily values), the coldest December in
 * the series since 1890 (-0.80).
 */

export interface WaveDatum {
  date: Date;
  /** Daily mean temperature, degrees Celsius. */
  value: number;
}

const START = Date.UTC(2010, 10, 2);
const DAY = 86_400_000;

const MEANS = [
  11, 12.7, 13.5, 13.6, 8.1, 5.2, 4.4, 5.8, 5.4, 6.7, 9.8, 7.5, 4.9, 2.9, 3.5,
  3.1, 7.1, 6.1, 5.2, 4.7, 5.4, 5.1, 1.6, 0.2, -0.5, -1.6, -4, -2.5, -1, -2,
  -1.3, -2.6, -1.5, 0.4, -3.8, -3.5, -2.7, 0.5, 3.8, 6, 0.8, 1.5, 1.9, 3.3, 4.2,
  -2.1, -3, -6.8, -7, -5.9, -2.1, -2.2, -2.8, -5.9, -3.6, -1.7,
];

/** Daily mean central England temperature, 2 November to 27 December 2010. */
export const staggerWaveDemo: WaveDatum[] = MEANS.map((value, d) => ({
  date: new Date(START + d * DAY),
  value,
}));

/** Index of the coldest day, the bar drawn in ink. */
export const staggerWaveColdest = MEANS.indexOf(Math.min(...MEANS));
