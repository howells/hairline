import { utcFormat } from "d3-time-format";

import type { ValueAxis } from "../../schema/daily";
import type { FontMetrics } from "../../schema/metrics";
import { NOTE_LINE, noteLines } from "../util";

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

/** Room a left-hand value scale takes in front of the plot, px: the gutter Facets leaves its first column. */
export const VALUE_AXIS_LEFT = 40;

/** Room kept past the last datum when the numbers are not on the right, px. */
const END_ROOM = 12;

/** The room a value axis takes either side of the data, px. */
export const axisRoom = (axis: ValueAxis) => ({
  left: axis === "left" ? VALUE_AXIS_LEFT : 0,
  right: axis === "right" ? VALUE_AXIS_ROOM : END_ROOM,
});

/** The baseline of a daily chart: above the axis labels and any wrapped note. */
export const dailyFloor = (
  height: number,
  note: string | undefined,
  width: number,
  metrics?: FontMetrics
) => {
  const notes = noteLines(note, width - 24, metrics);

  return Math.round(
    height -
      (notes.length > 0 ? 56 : 34) -
      Math.max(0, notes.length - 1) * NOTE_LINE
  );
};
