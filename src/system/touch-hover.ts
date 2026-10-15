/**
 * Hover for fingers. Every chart reads hover from React's onPointerEnter,
 * onPointerLeave and onPointerMove, which a tap fires and then undoes at
 * once: the finger lifts, the pointer leaves, and the tooltip goes with it.
 *
 * Installed once, this makes a tap behave like resting the mouse there:
 * - the leave a lifting finger sends is held back, so the tapped mark stays
 *   lit until the next tap, which first sends the held leave and then lands;
 * - a tap also sends one pointermove at its point, so charts that find the
 *   nearest datum from the pointer (scrubbers, maps) answer a tap too;
 * - a touch the browser takes over for scrolling lets its leave through, so
 *   no tooltip stays behind on a chart scrolled past.
 *
 * It relies on React handling pointer events by delegation at its root:
 * listeners here capture on window, so they run before React sees the event.
 * Mouse and pen are left alone.
 */

/** The element a lifted finger last left, whose leave is held back. */
let held: Element | null = null;
/** True from a touch's pointercancel until its pointerout passes. */
let scrolling = false;

const isTouch = (e: PointerEvent) => e.isTrusted && e.pointerType === "touch";

/** Sends the held leave, as if the pointer moved off the page. */
const release = (e: PointerEvent) => {
  const target = held;
  held = null;
  if (target?.isConnected !== true) {
    return;
  }
  target.dispatchEvent(
    new PointerEvent("pointerout", {
      bubbles: true,
      clientX: e.clientX,
      clientY: e.clientY,
      pointerId: e.pointerId,
      pointerType: "touch",
    })
  );
};

const onOut = (e: PointerEvent) => {
  if (!isTouch(e)) {
    return;
  }
  if (scrolling) {
    scrolling = false;
    held = null;
    return;
  }
  if (e.target instanceof Element) {
    held = e.target;
    e.stopPropagation();
  }
};

const onOver = (e: PointerEvent) => {
  if (isTouch(e)) {
    release(e);
  }
};

const onDown = (e: PointerEvent) => {
  if (!isTouch(e) || !(e.target instanceof Element)) {
    return;
  }
  e.target.dispatchEvent(
    new PointerEvent("pointermove", {
      bubbles: true,
      clientX: e.clientX,
      clientY: e.clientY,
      pointerId: e.pointerId,
      pointerType: "touch",
    })
  );
};

const onCancel = (e: PointerEvent) => {
  if (isTouch(e)) {
    scrolling = true;
  }
};

/** Call once, before the app renders. */
export const installTouchHover = () => {
  const capture = { capture: true };
  window.addEventListener("pointerout", onOut, capture);
  window.addEventListener("pointerover", onOver, capture);
  window.addEventListener("pointerdown", onDown, capture);
  window.addEventListener("pointercancel", onCancel, capture);
};
