export interface StreamSeries {
  name: string;
  values: number[];
}

/** Series are listed bottom to top; every series has one value per date. */
export interface StreamData {
  dates: Date[];
  series: StreamSeries[];
}

const YEARS = [
  "2008",
  "2009",
  "2010",
  "2011",
  "2012",
  "2013",
  "2014",
  "2015",
  "2016",
  "2017",
  "2018",
  "2019",
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
  "2026",
];

/**
 * F16 Runs by source. Where the runs came from in the Indian Premier League,
 * each year from 2008 to 2026: running between the wickets, fours, sixes and
 * extras, in the first two innings of every match (1243 matches). Sixes
 * grew from 3,738 runs in 2008 to 8,556 in 2026.
 *
 * Source: Cricsheet, Indian Premier League ball-by-ball data, CSV format
 * (ipl_csv2.zip; Open Data Commons Attribution License v1.0, credit Cricsheet).
 *   https://cricsheet.org/downloads/
 *   https://cricsheet.org/downloads/ipl_csv2.zip
 * Fetched 2026-10-15.
 *
 * Transform: for every match file (all_matches.csv, which repeats every match, is skipped), every delivery in innings 1 and 2 (super overs left out),
 * group by the year of start_date. A delivery with runs_off_bat of 4 or 6 that
 * is not flagged non_boundary counts its runs to Fours or Sixes; every other
 * run off the bat counts to Running; the extras column (wides, no-balls, byes,
 * leg byes, penalties) counts to Extras. Each year is dated 1 January in the
 * chart, a placeholder for the season. Scripts: reference/scripts/F16/gen.py.
 */
export const streamRibbonDemo: StreamData = {
  dates: YEARS.map((year) => new Date(`${year}-01-01T00:00:00Z`)),
  series: [
    {
      name: "Running",
      values: [
        6259, 7040, 7393, 8430, 9281, 9169, 7390, 6829, 7596, 7233, 7258, 7257,
        7766, 7398, 8600, 8984, 8391, 8440, 8263,
      ],
    },
    {
      name: "Fours",
      values: [
        6812, 5268, 6832, 7664, 7644, 8208, 6248, 6428, 6532, 6444, 6608, 6612,
        6332, 6196, 8080, 8700, 8700, 9040, 9332,
      ],
    },
    {
      name: "Sixes",
      values: [
        3738, 3036, 3510, 3834, 4398, 4050, 4284, 4152, 3834, 4230, 5232, 4704,
        4410, 4122, 6372, 6744, 7566, 7806, 8556,
      ],
    },
    {
      name: "Extras",
      values: [
        1128, 976, 1129, 1226, 1130, 1114, 987, 923, 900, 862, 803, 827, 844,
        906, 1343, 1260, 1314, 1217, 1299,
      ],
    },
  ],
};
