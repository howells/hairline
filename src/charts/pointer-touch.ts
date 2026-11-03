import type { PointerEvent, RefObject } from "react";

import type { Spot } from "./pointer-model";

/*
 * Touch for the pointer model: press and hold to scrub. A finger that moves
 * before the hold is a swipe and belongs to the page, so a chart never
 * captures a scroll; once the hold lands, `touchmove` is blocked so the
 * scrub does not drag the page with it.
 */

/** How long a finger rests before it scrubs, ms. */
export const HOLD_MS = 280;
/** How far a finger may drift while it rests before it is a scroll, px. */
const HOLD_SLOP = 10;

export interface Held<K> {
  active: boolean;
  at: Spot;
  block: (e: Event) => void;
  el: SVGSVGElement;
  from: Spot;
  key: K | null;
  timer: ReturnType<typeof setTimeout>;
}

export type HeldRef<K> = RefObject<Held<K> | null>;

export const clientOf = (e: { clientX: number; clientY: number }): Spot => ({
  x: e.clientX,
  y: e.clientY,
});

/** Ends a hold: the timer and the scroll block both go. */
export const releaseHold = <K>(held: HeldRef<K>) => {
  const h = held.current;
  if (h !== null) {
    clearTimeout(h.timer);
    h.el.removeEventListener("touchmove", h.block);
    held.current = null;
  }
};

interface TouchContext<K> {
  held: HeldRef<K>;
  /** The key a client position snaps to, or null. */
  keyAt: (client: Spot, el: SVGSVGElement) => K | null;
  pinned: boolean;
  put: (key: K | null, pinned?: boolean) => void;
  /** Set when a scrub ends, so the click the browser sends after it is ignored. */
  swallow: RefObject<boolean>;
}

export const touchHandlers = <K>(ctx: TouchContext<K>) => ({
  onPointerCancel: () => {
    const h = ctx.held.current;
    if (h === null) {
      return;
    }
    const { active } = h;
    releaseHold(ctx.held);
    if (active && !ctx.pinned) {
      ctx.put(null);
    }
  },
  onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "touch" || ctx.pinned) {
      return;
    }
    releaseHold(ctx.held);
    const el = e.currentTarget;
    const from = clientOf(e);
    const h: Held<K> = {
      active: false,
      at: from,
      block: (event) => {
        event.preventDefault();
      },
      el,
      from,
      key: null,
      timer: setTimeout(() => {
        h.active = true;
        // The finger has not moved, so the page has not started scrolling:
        // from here a move scrubs and the page stays put.
        el.addEventListener("touchmove", h.block, { passive: false });
        h.key = ctx.keyAt(h.at, el);
        ctx.put(h.key);
      }, HOLD_MS),
    };
    ctx.held.current = h;
  },
  /** True when the move was a finger's, handled here. */
  onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
    const h = ctx.held.current;
    if (h === null) {
      return;
    }
    h.at = clientOf(e);
    if (!h.active) {
      // A drift before the hold is a swipe: the page's.
      if (Math.hypot(h.at.x - h.from.x, h.at.y - h.from.y) > HOLD_SLOP) {
        releaseHold(ctx.held);
      }
      return;
    }
    h.key = ctx.keyAt(h.at, e.currentTarget);
    ctx.put(h.key);
  },
  onPointerUp: () => {
    const h = ctx.held.current;
    if (h === null) {
      return;
    }
    const { active, key } = h;
    releaseHold(ctx.held);
    if (active) {
      ctx.swallow.current = true;
      // Lifting the finger keeps the tip: it is pinned where it was left.
      ctx.put(key, key !== null);
    }
  },
});
