import easter from "./jitter-strip.easter.json";

export interface JitterGroup {
  label: string;
  /** One value per record. */
  values: number[];
  /** One name per record, in the same order as `values`, for the tooltip. */
  names?: string[];
}

/**
 * Easter dates: the date of Easter Sunday in every year of the 1800s, 1900s,
 * 2000s and 2100s (100 years each), as days after 21 March (0 is 21 March, 35
 * is 25 April), which are the earliest and latest it can fall. The days are
 * in jitter-strip.easter.json, one list a century in year order.
 *
 * Source: computed with the Gregorian rule, the Meeus/Jones/Butcher
 * algorithm (Jean Meeus, Astronomical Algorithms, 1991), as set out at
 * https://en.wikipedia.org/wiki/Date_of_Easter#Anonymous_Gregorian_algorithm
 * and checked against the Good Friday dates (2019 to 2028, ten of them) in
 * gov.uk's bank holidays file for England and Wales (Open Government
 * Licence v3.0), https://www.gov.uk/bank-holidays.json, fetched 2026-10-15.
 *
 * Transform: for each year, Easter Sunday minus 21 March of that year in
 * days. The 2100s are a prediction.
 * Sanity: the earliest Easter in the four centuries is 22 March (1818) and
 * the latest 25 April (1886, 1943, 2038 and 2190); the median in the 2000s is
 * 20 days after 21 March, 10 April.
 */
export const jitterStripDemo: JitterGroup[] = easter.map((c) => ({
  label: c.label,
  names: c.days.map((_, i) => String(c.start + i)),
  values: c.days,
}));
