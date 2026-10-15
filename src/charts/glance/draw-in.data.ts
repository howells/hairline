import goals from "./draw-in.goals.json";

export interface DrawInDatum {
  date: Date;
  /** Running total up to and including this date. */
  value: number;
}

const START = Date.UTC(2024, 7, 16);
const DAY = 86_400_000;

/**
 * Premier League goals: the running total of goals scored in the 2024-25
 * English Premier League, one value a day from the opening match on 16 August
 * 2024 to the last on 25 May 2025. The goals scored each day are in
 * draw-in.goals.json.
 *
 * Source: openfootball/england, "English Premier League 2024/25", dedicated
 * to the public domain (CC0 1.0 Universal), file 2024-25/1-premierleague.txt:
 * https://github.com/openfootball/england/blob/master/2024-25/1-premierleague.txt
 * raw https://raw.githubusercontent.com/openfootball/england/master/2024-25/1-premierleague.txt
 * Fetched 2026-10-15.
 *
 * Transform: every match line gives a full-time score "H-A" (a 0-0 draw has no
 * half-time score after it); the two numbers were added and the goals summed
 * by match date. Date lines without a year carry the last year seen, which
 * rolls from 2024 to 2025 when the month goes back to January. Days without a
 * match count 0, so the series has 283 values and the running total is
 * rounded to whole goals by construction.
 * Sanity: 380 matches, 1,115 goals in total; the busiest day is 4 December
 * 2024 with 25 goals.
 */
let running = 0;
export const drawInDemo: DrawInDatum[] = goals.map((n, i) => {
  running += n;
  return { date: new Date(START + i * DAY), value: running };
});
