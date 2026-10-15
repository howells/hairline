/** One category measured in two periods. */
export interface PairDatum {
  current: number;
  label: string;
  previous: number;
}

/**
 * How people in England and Wales usually travel to work, as a percentage of
 * residents in employment: Census Day 2011 (previous) against Census Day 2021
 * (current).
 *
 * Source: Office for National Statistics, Census 2021 TS061 "Method used to
 * travel to work" (2001 specification) and Census 2011 QS703EW "Method of
 * Travel to Work (2001 specification)", both via Nomis (Open Government Licence).
 *   2021: https://www.nomisweb.co.uk/api/v01/dataset/NM_2078_1.data.csv?geography=2092957703&c2021_ttwmeth_12=0...11&measures=20100
 *   2011: https://www.nomisweb.co.uk/api/v01/dataset/NM_576_1.data.csv?geography=2092957703&cell=0...12&measures=20100
 *   Quality note: https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/traveltoworkqualityinformationforcensus2021
 * Fetched 2026-10-15. Geography: England and Wales (K04000001).
 *
 * Why QS703EW and not QS701EW: both TS061 and QS703EW use the 2001
 * specification, in which someone whose workplace is their home counts as
 * "Work mainly at or from home" even if they also drive (for example to visit
 * clients). QS701EW (2011 specification) ranks the travel method first and
 * gives about 1.42 million home workers in 2011 against 2.72 million in
 * QS703EW, so it is not comparable with TS061. ONS publishes the same headline
 * for the compatible pair: 10.3% in 2011 and 31.2% in 2021.
 *
 * Base population: 2021 is residents aged 16 and over in employment the week
 * before the census (27,773,666). 2011 is residents aged 16 to 74 (41,126,540)
 * less the "Not in employment" cell (14,600,204), which leaves 26,526,336 in
 * employment. The age ceiling differs slightly, so shares are shown, not counts.
 *
 * Transform: per category, 100 * cell / employed base for each census, rounded
 * to one decimal place. Categories kept: "Driving a car or van" (Driving),
 * "Work mainly at or from home" (At home), "On foot", "Bus, minibus or coach"
 * (Bus) and "Train"; the rest are dropped, so the five do not sum to 100.
 *
 * Caveat: Census Day 2021 (21 March 2021) fell in a national lockdown with
 * about 5.6 million people on furlough, so the home-working jump is partly a
 * snapshot of the pandemic. ONS: "census travel to work data are a mixture of
 * pandemic and pre-pandemic travel behaviours".
 */
export const pairedRungsDemo: PairDatum[] = [
  { current: 45.1, label: "Driving", previous: 54.5 },
  { current: 31.2, label: "At home", previous: 10.3 },
  { current: 7.6, label: "On foot", previous: 9.8 },
  { current: 4.2, label: "Bus", previous: 7.2 },
  { current: 1.9, label: "Train", previous: 5 },
];
