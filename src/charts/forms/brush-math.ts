import { clamp } from "../util";

/** The brushed window: first and last day index, inclusive. */
export interface Span {
  a: number;
  b: number;
}

/** What the pointer took hold of; "outside" recentres the window first. */
export type Grip = "body" | "end" | "outside" | "start";

/** A drag in progress: the window it started from, in day units. */
export interface Drag {
  from: Span;
  grip: Exclude<Grip, "outside">;
  origin: number;
}

/** The narrowest window, in days. */
const MIN_DAYS = 6;

/** Where the window lands after a drag of `delta` days. */
export const dragTo = (d: Drag, delta: number, last: number): Span => {
  if (d.grip === "start") {
    return { a: clamp(d.from.a + delta, 0, d.from.b - MIN_DAYS), b: d.from.b };
  }
  if (d.grip === "end") {
    return {
      a: d.from.a,
      b: clamp(d.from.b + delta, d.from.a + MIN_DAYS, last),
    };
  }
  const shift = clamp(delta, -d.from.a, last - d.from.b);
  return { a: d.from.a + shift, b: d.from.b + shift };
};

/** The same window, centred as near `day` as the year allows. */
export const centreOn = (s: Span, day: number, last: number): Span => {
  const len = s.b - s.a;
  const a = clamp(Math.round(day - len / 2), 0, last - len);
  return { a, b: a + len };
};

/** Arrow keys move the window a week; Home and End send it to either end. */
export const keyTo = (key: string, s: Span, last: number): Span | null => {
  const len = s.b - s.a;
  if (key === "Home") {
    return { a: 0, b: len };
  }
  if (key === "End") {
    return { a: last - len, b: last };
  }
  if (key !== "ArrowLeft" && key !== "ArrowRight") {
    return null;
  }
  const shift = clamp(key === "ArrowLeft" ? -7 : 7, -s.a, last - s.b);
  return { a: s.a + shift, b: s.b + shift };
};
