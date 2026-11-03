import type { DailyNote } from "../../schema/notes";
import type { Reading } from "./daily-readings";

/** A note and the live reading it is tied to. */
export interface FoundNote extends DailyNote {
  /** Index of the reading. */
  index: number;
}

/**
 * The notes whose reading exists and has a value, left to right (so the
 * numbers on a narrow chart run that way too). A note that names a gap or
 * no reading is left out, as `emphasis` is.
 */
export const foundNotes = (
  notes: DailyNote[] | undefined,
  readings: Reading[]
): FoundNote[] =>
  (notes ?? [])
    .flatMap((n) => {
      const index = readings.findIndex(
        (r) => r.key === n.at && r.value !== null
      );
      return index === -1 ? [] : [{ ...n, index }];
    })
    .toSorted((a, b) => a.index - b.index);

const wordsOf = (n: DailyNote) =>
  n.detail === undefined ? n.title : `${n.title}. ${n.detail}`;

/** The data table with a Note column, when there are notes. */
export const withNotes = (
  columns: string[],
  rows: string[][],
  found: FoundNote[]
) =>
  found.length === 0
    ? { columns, rows }
    : {
        columns: [...columns, "Note"],
        rows: rows.map((row, i) => [
          ...row,
          found.flatMap((n) => (n.index === i ? [wordsOf(n)] : [])).join("; "),
        ]),
      };

/** The notes in words, for the chart's description. */
export const notesDesc = (
  found: FoundNote[],
  readings: Reading[],
  fmtDate: (d: Date) => string
) =>
  found.length === 0
    ? ""
    : ` Notes: ${found.map((n) => `${wordsOf(n)}, on ${fmtDate(readings[n.index].date)}`).join("; ")}.`;
