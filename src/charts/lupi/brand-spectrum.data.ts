/**
 * Ben Nevis against Snowdon, Scafell Pike and Slieve Donard, on six measures
 * of a hill.
 *
 * Source: The Database of British and Irish Hills v18.6 (Creative Commons
 * Attribution 4.0; cite as "The Database of British and Irish Hills v18.6",
 * www.hill-bagging.co.uk/dobih), file hillcsv.zip, DoBIH_v18_6.csv, 21,576
 * hills: https://www.hill-bagging.co.uk/dobih-downloads/hillcsv.zip
 * (licence and downloads page: https://www.hill-bagging.co.uk/dobih/downloads/).
 * Fetched 2026-10-15 (saved to reference/raw/L7/).
 *
 * Transform: the four hills are rows 278 (Ben Nevis), 1963 (Snowdon - Yr
 * Wyddfa), 2359 (Scafell Pike) and 20016 (Slieve Donard). Each position is
 * (value - lowest in the file) / (highest - lowest) over all 21,576 hills,
 * to two decimals, so 0 is the least and 1 the most of any hill in the
 * database. Measures, left pole to right pole: Metres (Low to High, 2 to
 * 1,344.53); Drop (Minor to Prominent, 0 to 1,344.5 m); Col height (Low col
 * to High col, 0 to 1,275.9 m); Latitude (Southern to Northern, 49.17 to
 * 60.86); Longitude (Western to Eastern, -10.65 to 1.74); Lists (Few lists to
 * Many lists, the number of classifications in the "Classification" column,
 * 1 to 13). Script: reference/scripts/L7/hills.py.
 */
export interface SpectrumRow {
  left: string;
  right: string;
  /** The inked hill's position, 0 = fully left pole, 1 = fully right pole. */
  us: number;
  /** One position per other hill, in the order of the `competitors` prop. */
  others: number[];
}

/** The three other hills, in the order of each row's `others`. */
export const brandSpectrumCompetitors = [
  "Snowdon",
  "Scafell Pike",
  "Slieve Donard",
];

/** Where each hill sits on six measures, across all the hills in the database. */
export const brandSpectrumDemo: SpectrumRow[] = [
  {
    left: "Low",
    others: [0.81, 0.73, 0.63],
    right: "High",
    us: 1,
  },
  {
    left: "Minor",
    others: [0.77, 0.68, 0.61],
    right: "Prominent",
    us: 1,
  },
  {
    left: "Low col",
    others: [0.04, 0.05, 0.02],
    right: "High col",
    us: 0,
  },
  {
    left: "Southern",
    others: [0.33, 0.45, 0.43],
    right: "Northern",
    us: 0.65,
  },
  {
    left: "Western",
    others: [0.53, 0.6, 0.38],
    right: "Eastern",
    us: 0.46,
  },
  {
    left: "Few lists",
    others: [0.67, 1, 0.58],
    right: "Many lists",
    us: 0.58,
  },
];
