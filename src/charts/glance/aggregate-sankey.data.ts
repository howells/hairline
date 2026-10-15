export interface SankeyFlow {
  from: string;
  to: string;
  value: number;
}

export interface AggregateSankeyData {
  flows: SankeyFlow[];
  /** Left column, top to bottom. */
  sources: string[];
  /** Right column, top to bottom. */
  targets: string[];
}

/**
 * Free vote: how the MPs of each party voted in the House of Commons on the
 * second reading of the Terminally Ill Adults (End of Life) Bill, 29 November
 * 2024, a free vote on which parties split (330 ayes, 275 noes).
 *
 * Source: UK Parliament Commons Votes API, division 1877 (Open Parliament
 * Licence v3.0):
 * https://commonsvotes-api.parliament.uk/data/division/1877.json
 * (found with https://commonsvotes-api.parliament.uk/data/divisions.json/search?queryParameters.searchTerm=Terminally%20Ill%20Adults)
 * Fetched 2026-10-15.
 *
 * Transform: each member in the lists Ayes, Noes and NoVoteRecorded counted by
 * their Party: Labour, Conservative and Liberal Democrat kept apart, every
 * other party and independent as Other. "Did not vote" is the NoVoteRecorded
 * list, which also holds the Speaker and three deputies and the seven Sinn
 * Fein MPs who do not take their seats.
 * Sanity: ayes 330 and noes 275 match the division's counts; Labour split 234
 * to 147, the Conservatives 23 to 92.
 */
export const aggregateSankeyDemo: AggregateSankeyData = {
  flows: [
    { from: "Labour", to: "Aye", value: 234 },
    { from: "Labour", to: "No", value: 147 },
    { from: "Labour", to: "Did not vote", value: 18 },
    { from: "Conservative", to: "Aye", value: 23 },
    { from: "Conservative", to: "No", value: 92 },
    { from: "Conservative", to: "Did not vote", value: 3 },
    { from: "Liberal Democrat", to: "Aye", value: 61 },
    { from: "Liberal Democrat", to: "No", value: 11 },
    { from: "Other", to: "Aye", value: 12 },
    { from: "Other", to: "No", value: 25 },
    { from: "Other", to: "Did not vote", value: 21 },
  ],
  sources: ["Labour", "Conservative", "Liberal Democrat", "Other"],
  targets: ["Aye", "No", "Did not vote"],
};
