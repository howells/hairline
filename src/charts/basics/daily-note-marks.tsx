import { NUMBERED_BELOW } from "../note-layout";
import { NoteList, NoteMarks } from "../notes";
import type { FoundNote } from "./daily-notes";
import type { Reading } from "./daily-readings";
import { valueAt } from "./daily-readings";
import { VALUE_AXIS_ROOM } from "./util-a";

interface Props {
  floor: number;
  /** Where reading `i` stands, and where a value does, in px. */
  frame: { x: (i: number) => number; y: (v: number) => number };
  /** The indexes of the readings that have a value: the line the notes keep off. */
  live: number[];
  notes: FoundNote[];
  readings: Reading[];
  /** The frame's left and right edges, px. */
  x0: number;
  x1: number;
  width: number;
}

/** The notes of a daily chart: beside their points, or numbered below the breakpoint. */
export const DailyNoteMarks = (props: Props) => {
  const { frame, readings } = props;
  return (
    <NoteMarks
      notes={props.notes.map((n) => ({
        detail: n.detail,
        label: n.title,
        x: frame.x(n.index),
        y: frame.y(valueAt(readings, n.index)),
      }))}
      numbered={props.width < NUMBERED_BELOW}
      room={{
        bottom: props.floor - 2,
        line: props.live.map((i) => ({
          x: frame.x(i),
          y: frame.y(valueAt(readings, i)),
        })),
        top: 4,
        x0: props.x0,
        x1: props.x1 - VALUE_AXIS_ROOM + 8,
      }}
    />
  );
};

/** The numbered words under a narrow chart; nothing when the notes sit on the chart. */
export const DailyNoteList = (props: { notes: FoundNote[]; width: number }) =>
  props.width < NUMBERED_BELOW && props.notes.length > 0 ? (
    <NoteList
      notes={props.notes.map((n) => ({ detail: n.detail, label: n.title }))}
    />
  ) : null;
