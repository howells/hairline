/**
 * G3 A pint over time: the average price of a pint of draught lager, in
 * pence, in four years ten years apart.
 *
 * Source: Office for National Statistics, "RPI: Ave price - Draught lager,
 * per pint", series CZMS in dataset MM23 (Average prices of selected items),
 * release of 16 September 2026, Open Government Licence v3.0:
 * https://www.ons.gov.uk/economy/inflationandpriceindices/timeseries/czms/mm23
 * File: https://www.ons.gov.uk/generator?format=csv&uri=/economy/inflationandpriceindices/timeseries/czms/mm23
 * Fetched 2026-10-15.
 *
 * Transform: the annual values (the rows keyed by a bare year) for 1994, 2004,
 * 2014 and 2024, in pence as they stand. The plan's 1995, 2005, 2015 and 2025
 * would have ended on 2025, which has no annual value yet (the file holds only
 * January 2025, 483p), and 2020 and 2021 are blank, so the span ends in 2024.
 * A pint cost 158p in 1994 and 477p in 2024.
 */

export interface ChunkyDatum {
  label: string;
  /** Pence. */
  value: number;
}

/** Average price of a pint of draught lager, pence. */
export const chunkyBarsDemo: ChunkyDatum[] = [
  { label: "1994", value: 158 },
  { label: "2004", value: 233 },
  { label: "2014", value: 337 },
  { label: "2024", value: 477 },
];
