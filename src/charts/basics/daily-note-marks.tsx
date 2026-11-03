import { NUMBERED_BELOW } from "../note-layout";
import { NoteList, NoteMarks } from "../notes";
import { pointsOf, roomOf } from "./daily-note-boxes";
import type { NoteProps as Props } from "./daily-note-boxes";
import type { FoundNote } from "./daily-notes";

/** The notes of a daily chart: beside their points, or numbered below the breakpoint. */
export const DailyNoteMarks = (props: Props) => (
  <NoteMarks
    notes={pointsOf(props)}
    numbered={props.width < NUMBERED_BELOW}
    room={roomOf(props)}
  />
);

/** The numbered words under a narrow chart; nothing when the notes sit on the chart. */
export const DailyNoteList = (props: { notes: FoundNote[]; width: number }) =>
  props.width < NUMBERED_BELOW && props.notes.length > 0 ? (
    <NoteList
      notes={props.notes.map((n) => ({ detail: n.detail, label: n.title }))}
    />
  ) : null;
