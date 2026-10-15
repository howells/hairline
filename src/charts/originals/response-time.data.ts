/**
 * O4 Vote share: how each party's share of the vote ran across the
 * constituencies it contested at the 2024 general election.
 * Source: House of Commons Library, UK Parliament Election Results website
 * (Open Parliament Licence), https://electionresults.parliament.uk/general-elections/6
 * File: candidacies.csv (one row per candidate, with "Candidate vote share"
 * as a fraction of valid votes). Fetched 2026-10-15.
 * Transform: for each of five parties (Labour 631 candidates, Conservative
 * 635, Reform UK 609, Liberal Democrat 630, Green 574; the five that stood
 * in more than 570 constituencies of 650), the vote shares in percent were
 * sorted and the 5th, 10th, 20th ... 90th and 95th percentiles taken by
 * linear interpolation (as d3.quantileSorted does), each rounded to 0.1.
 */

/** One party's constituency vote shares, as percentiles in percent. */
export interface ChannelTimes {
  channel: string;
  /** 5th, 10th, 20th … 90th, 95th percentiles; the median is index 5. */
  q: number[];
}

/** The percentiles kept: the 5–95 span, and every tenth between. */
export const LEVELS = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];
export const MEDIAN = 5;

/** Vote share by constituency at the 2024 general election, five parties. */
export const responseTimes: ChannelTimes[] = [
  {
    channel: "Labour",
    q: [7.7, 13.1, 23.4, 30.3, 34.7, 38.5, 41.2, 44.1, 47.1, 50.5, 53.7],
  },
  {
    channel: "Conservative",
    q: [5.2, 7.6, 11.9, 16.3, 21.5, 25.6, 28.7, 30.9, 33.4, 36.4, 38.5],
  },
  {
    channel: "Reform UK",
    q: [4.9, 6.3, 8.8, 11.9, 13.6, 15.5, 17, 18.9, 20.9, 23.7, 25.9],
  },
  {
    channel: "Liberal Democrat",
    q: [2.6, 3.1, 3.7, 4.5, 5.3, 6.4, 7.8, 10, 14.1, 37.9, 45.5],
  },
  {
    channel: "Green Party",
    q: [3.1, 3.5, 4.2, 4.7, 5.1, 5.7, 6.5, 7.3, 9.1, 13, 17.1],
  },
];
