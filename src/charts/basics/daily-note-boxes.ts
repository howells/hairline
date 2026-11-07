import {
  DISC_R,
  NUMBERED_BELOW,
  noteBoxes,
  placeDiscs,
  placeNotes,
} from "../note-layout";
import type { Box } from "../note-layout";
import type { FoundNote } from "./daily-notes";
import type { Reading } from "./daily-readings";
import { valueAt } from "./daily-readings";
import { VALUE_AXIS_ROOM } from "./util-a";

export interface NoteProps {
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

export const pointsOf = (props: NoteProps) =>
  props.notes.map((n) => ({
    detail: n.detail,
    label: n.title,
    x: props.frame.x(n.index),
    y: props.frame.y(valueAt(props.readings, n.index)),
  }));

export const roomOf = (props: NoteProps) => ({
  bottom: props.floor - 2,
  line: props.live.map((i) => ({
    x: props.frame.x(i),
    y: props.frame.y(valueAt(props.readings, i)),
  })),
  top: 4,
  x0: props.x0,
  x1: props.x1 - VALUE_AXIS_ROOM + 8,
});

/** The boxes the notes take up, as they are placed, for a tip to keep off. */
export const dailyNoteBoxes = (props: NoteProps): Box[] => {
  if (props.notes.length === 0) {
    return [];
  }

  if (props.width < NUMBERED_BELOW) {
    return placeDiscs(pointsOf(props), roomOf(props)).map((d) => ({
      x0: d.x - DISC_R,
      x1: d.x + DISC_R,
      y0: d.cy - DISC_R,
      y1: d.cy + DISC_R,
    }));
  }

  return noteBoxes(placeNotes(pointsOf(props), roomOf(props)));
};
