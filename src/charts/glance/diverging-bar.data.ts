/**
 * G10 Names rising, falling: the change in the number of babies given each of
 * seven names in England and Wales, 2015 to 2025.
 *
 * Source: Office for National Statistics, "Baby names in England and Wales
 * from 1996", Tables 1 (girls) and 2 (boys), counts by name for 2015 and
 * 2025, Open Government Licence v3.0:
 * https://www.ons.gov.uk/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesinenglandandwalesfrom1996
 * File: babynames1996to2025.xlsx, fetched 2026-10-15 from
 * https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/birthsdeathsandmarriages/livebirths/datasets/babynamesinenglandandwalesfrom1996/1996to2025/babynames1996to2025.xlsx
 *
 * Transform: for every row of both tables, count 2025 minus count 2015 (a
 * redacted count, 2 or fewer, is taken as 0). The four largest rises and the
 * three largest falls are kept, largest rise first; all seven are boys' names.
 * The plan's 2014 to 2024 became 2015 to 2025, the latest ten years in the
 * file. The ONS counts the exact spelling registered, with similar spellings
 * counted separately, so Muhammad is one spelling among several and a fall
 * can partly be a split into other spellings. Oliver was given to 6,941 boys
 * in 2015 and 3,154 in 2025.
 */

export interface DivergingDatum {
  label: string;
  /** Change in the number of babies given the name. */
  value: number;
}

/** Change in babies given each name, England and Wales, 2015 to 2025. */
export const divergingBarDemo: DivergingDatum[] = [
  { label: "Muhammad", value: 2227 },
  { label: "Luca", value: 2099 },
  { label: "Arlo", value: 1464 },
  { label: "Theodore", value: 1336 },
  { label: "Jacob", value: -3592 },
  { label: "Jack", value: -3776 },
  { label: "Oliver", value: -3787 },
];
