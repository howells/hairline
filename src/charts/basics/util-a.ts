import { utcFormat } from "d3-time-format";
import { useState } from "react";

import { NOTE_LINE, noteLines } from "../util";

/** Where a tooltip sits and which record it describes. */
export interface TipState {
  i: number;
  x: number;
  y: number;
}

/** Hover state shared by the basics-a charts: one hovered record plus a tooltip anchor. */
export const useHoverTip = () => {
  const [tip, setTip] = useState<TipState | null>(null);
  return {
    clear: () => {
      setTip(null);
    },
    hover: tip?.i ?? null,
    show: (i: number, x: number, y: number) => {
      setTip({ i, x, y });
    },
    tip,
  };
};

/** True when another record is hovered, so this one should dim. */
export const isDim = (hover: number | null, i: number) =>
  hover !== null && hover !== i;

/** Saturday or Sunday, in UTC. */
export const isWeekend = (d: Date) =>
  d.getUTCDay() === 0 || d.getUTCDay() === 6;

const monthDay = utcFormat("%-d %b");
export const fmtMonthDay = (d: Date) => monthDay(d);

/** UTC midnight `n` days after `start` (ISO date string). */
export const dayAfter = (start: string, n: number) => {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

/** Room a right-hand value scale needs past the last datum, in px. */
export const VALUE_AXIS_ROOM = 48;

/** The baseline of a daily chart: above the axis labels and any wrapped note. */
export const dailyFloor = (
  height: number,
  note: string | undefined,
  width: number
) => {
  const notes = noteLines(note, width - 24);
  return Math.round(
    height -
      (notes.length > 0 ? 56 : 34) -
      Math.max(0, notes.length - 1) * NOTE_LINE
  );
};
