export interface SliceDatum {
  /** How intense the slice is (drives the radius), e.g. minutes per day. */
  intensity: number;
  label: string;
  /** Share of the whole (drives the angle). Any unit; normalised to the total. */
  share: number;
}

/**
 * Free time by age: adults in seven age bands (angle: each band's share of all
 * adults in the United Kingdom) and the minutes a day each band spent on
 * "entertainment, socialising and other free time" (radius), March 2024.
 *
 * Source: Office for National Statistics, Time use in the UK: 9 to 17 March
 * 2024 (Online Time Use Survey, NatCen Opinion Panel; Open Government Licence
 * v3.0), worksheet 7 "Average daily time (minutes) spent doing specified
 * activities, all adults: by age group":
 * https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/timeuseintheuk
 * file https://www.ons.gov.uk/file?uri=/peoplepopulationandcommunity/personalandhouseholdfinances/incomeandwealth/datasets/timeuseintheuk/march2024/timeuseintheukmarch24.xlsx
 * Fetched 2026-10-15.
 *
 * Transform: in Table 7a the row "Entertainment, socialising and other free
 * time", and in Table 7c the row "Weighted count", for the seven columns
 * "Aged 18 to 24 March 2024" to "Aged 75 and over March 2024", as given. The
 * weighted counts (adults) are the shares and add up to 53.1 million adults,
 * the survey's total; the means (minutes a day) are the radii. Sample sizes run from 127
 * (18 to 24) to 663 (55 to 64).
 * Sanity: free time climbs with age, from 157 minutes (25 to 34) to 335
 * (75 and over).
 */
export const bigSliceDemo: SliceDatum[] = [
  { intensity: 169.8, label: "18–24", share: 5_246_523 },
  { intensity: 156.8, label: "25–34", share: 8_957_457 },
  { intensity: 169.8, label: "35–44", share: 8_996_949 },
  { intensity: 209.5, label: "45–54", share: 8_448_639 },
  { intensity: 242, label: "55–64", share: 8_815_721 },
  { intensity: 317.6, label: "65–74", share: 8_305_762 },
  { intensity: 334.8, label: "75+", share: 4_376_563 },
];
