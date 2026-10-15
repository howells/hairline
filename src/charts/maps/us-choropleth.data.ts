/**
 * M1 Christmas trees: cultivated Christmas trees cut, by state, 2022.
 * Source: USDA National Agricultural Statistics Service, 2022 Census of
 * Agriculture, Volume 1 Chapter 2, Table 35 "Cultivated Christmas Trees: 2022
 * and 2017", https://www.nass.usda.gov/Publications/AgCensus/2022/Full_Report/Volume_1,_Chapter_2_US_State_Level/st99_2_035_035.pdf
 * Fetched 2026-10-15.
 * Transform: the 2022 "Trees cut, Number" column for the 50 states, copied as
 * printed. Alaska, Arizona and Nevada print (D), withheld to protect
 * individual farms, and are left out so they draw as no data. The United
 * States total (14,548,694) exceeds the 47 published states by 1,590 trees,
 * the withheld three. The District of Columbia and Puerto Rico are not in the
 * table and also draw as no data.
 */

import statesTopo from "us-atlas/states-10m.json";

import { regionsFrom } from "./geo";
import type { Region } from "./geo";

/** FIPS code → USPS postal code. */
const POSTAL = new Map([
  ["01", "AL"],
  ["02", "AK"],
  ["04", "AZ"],
  ["05", "AR"],
  ["06", "CA"],
  ["08", "CO"],
  ["09", "CT"],
  ["10", "DE"],
  ["11", "DC"],
  ["12", "FL"],
  ["13", "GA"],
  ["15", "HI"],
  ["16", "ID"],
  ["17", "IL"],
  ["18", "IN"],
  ["19", "IA"],
  ["20", "KS"],
  ["21", "KY"],
  ["22", "LA"],
  ["23", "ME"],
  ["24", "MD"],
  ["25", "MA"],
  ["26", "MI"],
  ["27", "MN"],
  ["28", "MS"],
  ["29", "MO"],
  ["30", "MT"],
  ["31", "NE"],
  ["32", "NV"],
  ["33", "NH"],
  ["34", "NJ"],
  ["35", "NM"],
  ["36", "NY"],
  ["37", "NC"],
  ["38", "ND"],
  ["39", "OH"],
  ["40", "OK"],
  ["41", "OR"],
  ["42", "PA"],
  ["44", "RI"],
  ["45", "SC"],
  ["46", "SD"],
  ["47", "TN"],
  ["48", "TX"],
  ["49", "UT"],
  ["50", "VT"],
  ["51", "VA"],
  ["53", "WA"],
  ["54", "WV"],
  ["55", "WI"],
  ["56", "WY"],
  ["72", "PR"],
]);

/** Every state (plus DC and Puerto Rico) keyed by postal code, from us-atlas states-10m. */
export const usStates: Region[] = regionsFrom(
  statesTopo,
  "states",
  (id) => POSTAL.get(id) ?? id
);

export interface StateDatum {
  /** USPS postal code, e.g. "CA". */
  state: string;
  value: number;
}

/** Cultivated Christmas trees cut by state in 2022, most first. */
export const usChoroplethDemo: StateDatum[] = [
  { state: "OR", value: 4_823_877 },
  { state: "NC", value: 3_208_419 },
  { state: "MI", value: 1_799_391 },
  { state: "WA", value: 936_904 },
  { state: "PA", value: 721_480 },
  { state: "WI", value: 601_199 },
  { state: "VA", value: 578_777 },
  { state: "NY", value: 318_745 },
  { state: "OH", value: 189_240 },
  { state: "MN", value: 153_600 },
  { state: "CA", value: 130_730 },
  { state: "VT", value: 127_121 },
  { state: "ME", value: 94_425 },
  { state: "CT", value: 88_893 },
  { state: "NH", value: 79_323 },
  { state: "MA", value: 78_630 },
  { state: "IL", value: 68_681 },
  { state: "GA", value: 63_915 },
  { state: "IN", value: 60_841 },
  { state: "NJ", value: 58_817 },
  { state: "TX", value: 43_668 },
  { state: "MD", value: 40_697 },
  { state: "WV", value: 39_391 },
  { state: "AL", value: 24_586 },
  { state: "SC", value: 23_317 },
  { state: "IA", value: 21_826 },
  { state: "MO", value: 21_461 },
  { state: "OK", value: 21_352 },
  { state: "ID", value: 15_980 },
  { state: "TN", value: 12_129 },
  { state: "RI", value: 11_936 },
  { state: "KS", value: 11_204 },
  { state: "MS", value: 11_175 },
  { state: "LA", value: 10_825 },
  { state: "NE", value: 10_417 },
  { state: "AR", value: 8410 },
  { state: "FL", value: 8353 },
  { state: "MT", value: 6338 },
  { state: "KY", value: 4748 },
  { state: "CO", value: 4667 },
  { state: "NM", value: 2693 },
  { state: "HI", value: 2570 },
  { state: "SD", value: 2380 },
  { state: "DE", value: 1780 },
  { state: "UT", value: 1722 },
  { state: "WY", value: 244 },
  { state: "ND", value: 227 },
];
