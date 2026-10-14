export interface Margin {
  bottom: number;
  left: number;
  right: number;
  top: number;
}

export interface TickMark {
  label: string;
  x: number;
}

/** Where a mark sits relative to the scrub cursor. */
export const phase = (i: number, cursor: number) => {
  if (i < cursor) {
    return "past";
  }
  return i === cursor ? "active" : "future";
};

/** Jan 1 and Jul 1 of every year in the domain. */
export const halfYearTicks = (from: Date, to: Date) => {
  const ticks: Date[] = [];
  for (let y = from.getUTCFullYear(); y <= to.getUTCFullYear(); y += 1) {
    for (const m of [0, 6]) {
      const d = new Date(Date.UTC(y, m, 1));
      if (d >= from && d <= to) {
        ticks.push(d);
      }
    }
  }
  return ticks;
};

/** For monthly bars: indices of January and July. */
export const halfYearIndices = (months: Date[]) =>
  months.flatMap((d, i) => (d.getUTCMonth() % 6 === 0 ? [i] : []));

/** Snap a coordinate to the pixel grid for crisp 1px lines. */
export const crisp = (v: number) => Math.round(v) + 0.5;
