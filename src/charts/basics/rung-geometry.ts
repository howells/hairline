/** Thickness of one rung: the family's mark, a solid 2px bar on whole pixels. */
export const RUNG = 2;

/** Whole-pixel pitch for `count` rungs in `room` px, between 4 and `max`. */
export const rungPitch = (room: number, count: number, max = 12) =>
  Math.max(RUNG + 2, Math.min(max, Math.floor(room / Math.max(1, count))));

/** Top edge of rung `k` (0 = lowest) above a whole-pixel `floor`. */
export const rungY = (floor: number, k: number, pitch: number) =>
  Math.round(floor) - (k + 1) * pitch + Math.floor((pitch - RUNG) / 2);
