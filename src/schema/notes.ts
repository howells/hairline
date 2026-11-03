// React-free. A note on a daily chart: a few words tied to one reading.
import { z } from "zod";

/** One note: its title, an optional second line, and the reading it explains. */
export const dailyNoteSchema = z.strictObject({
  /** The reading it explains, by key: a datum's `id`, else its date. */
  at: z
    .string()
    .min(1)
    .describe("The reading it explains, by key: a datum's id, else its date."),
  /** An optional second line, under the title. */
  detail: z
    .string()
    .min(1)
    .max(60)
    .optional()
    .describe("An optional second line, under the title."),
  /** The note's few words. */
  title: z.string().min(1).max(32).describe("The note's few words."),
});

/** The notes a daily chart may carry, at most eight. */
export const dailyNotesSchema = z
  .array(dailyNoteSchema)
  .max(8)
  .describe(
    "Notes tied to readings, drawn beside their points; on a narrow chart they become numbered marks with the words listed below. Off by default."
  );

/** Every note names a datum: its `at` must equal a datum's id or date. */
export const notesNameData = (props: {
  data: { date: string; id?: string }[];
  notes?: { at: string }[];
}) =>
  (props.notes ?? []).every((n) =>
    props.data.some((d) => (d.id ?? d.date) === n.at)
  );

/** The refinement's failure: where and why. */
export const NOTES_NAME_DATA = {
  message: "a note's at names no reading: it must equal a datum's id or date",
  path: ["notes"],
};

/** One note. */
export type DailyNote = z.infer<typeof dailyNoteSchema>;
