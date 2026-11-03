import type { GlyphBox } from "../glyph-box";
import { clock, spanOf } from "./util-a";
import type { Dial, Span } from "./util-a";

/** The inner ring's share of the dial's radius, as the chart draws it. */
const INNER = 0.12;

/** Room kept round the zoomed wedge inside the box, px. */
const MARGIN = 10;

/** How far the ring runs past the wedge's ends, as a share of its width. */
const RING_OVERRUN = 0.5;
/** The least the ring runs past each end, degrees. */
const RING_LEAST = 6;

/** Points round the wedge and the stretch of inner ring beside it, on a unit dial at the origin. */
const outline = (span: Span, dial: Dial) => {
  const run = Math.max(RING_LEAST, (span.a1 - span.a0) * RING_OVERRUN);
  const angles = Array.from(
    { length: 9 },
    (_, k) => span.a0 - run + ((span.a1 - span.a0 + run * 2) * k) / 8
  );
  return [
    ...angles.map((a) => clock(0, 0, dial.r0, a)),
    ...angles.flatMap((a) =>
      a >= span.a0 && a <= span.a1 ? [clock(0, 0, span.reach, a)] : []
    ),
    clock(0, 0, span.reach, span.a0),
    clock(0, 0, span.reach, span.a1),
  ];
};

/** The wedge and ring ends the key draws, and the dial it draws them on. */
export interface FlareZoom {
  dial: Dial;
  /** Clock angles the inner ring runs between, degrees. */
  ring: readonly [number, number];
  span: Span;
}

/**
 * The flare drawn to fill `box`, not at the chart's scale: the dial grows
 * until the wedge and a stretch of its inner ring fill the box, and moves so
 * they sit in its middle. The flare's angles and its reach as a share of the
 * dial are the chart's own.
 */
export const zoomFlare = (
  box: GlyphBox,
  flare: { hour: number; minutes: number; size: number },
  maxSize: number
): FlareZoom => {
  const unit: Dial = { R: 1, cx: 0, cy: 0, r0: INNER };
  const span = spanOf(unit, flare, maxSize);
  const points = outline(span, unit);
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
  const scale = (box.size - MARGIN * 2) / Math.max(x1 - x0, y1 - y0);
  const dial: Dial = {
    R: scale,
    cx: box.cx - (scale * (x0 + x1)) / 2,
    cy: box.cy - (scale * (y0 + y1)) / 2,
    r0: scale * INNER,
  };
  const run = Math.max(RING_LEAST, (span.a1 - span.a0) * RING_OVERRUN);
  return {
    dial,
    ring: [span.a0 - run, span.a1 + run],
    span: spanOf(dial, flare, maxSize),
  };
};
