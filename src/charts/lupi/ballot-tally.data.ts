/**
 * L15 Days out: how many people in the European Union went to each kind of
 * outing in the previous twelve months. Each person could have done any or
 * all of them, so the four rows are independent.
 *
 * Source: Eurostat, ilc_scp03 "Persons participating in cultural or sport
 * activities in the last 12 months by sex, age, educational attainment,
 * activity type and frequency" (EU-SILC 2015 ad hoc module).
 * Dataset: https://ec.europa.eu/eurostat/databrowser/view/ilc_scp03/
 * Query: https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/ilc_scp03?format=JSON&lang=en&geo=EU27_2020&sex=T&age=Y_GE16&isced11=TOTAL&frequenc=GE1
 * Fetched 2026-10-15. Eurostat data are reusable with attribution (Commission
 * Decision 2011/833/EU).
 *
 * Transform: geo EU27_2020, 2015 (the only year with an EU aggregate), both
 * sexes, aged 16 or over, all education levels, frequency "At least once",
 * unit percentage. The four activity rows are copied (Cinema 44.4, Live
 * performances 40.7, Cultural sites 40.9, Sports events 29.6) and rounded to
 * whole numbers per hundred. The combined "cultural activities" row (62.7) is
 * left out because it overlaps the first three.
 * Script: reference/scripts/L15/outings.py.
 */

/** One option on a multi-select ballot and how many of the sample ticked it. */
export interface TallyDatum {
  label: string;
  value: number;
}

/** Of every hundred people aged 16 or over in the EU, those who went, 2015. */
export const ballotTallyDemo: TallyDatum[] = [
  { label: "Cinema", value: 44 },
  { label: "Live performances", value: 41 },
  { label: "Cultural sites", value: 41 },
  { label: "Sports events", value: 30 },
];
