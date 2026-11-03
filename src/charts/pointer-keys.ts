import type { KeyboardEvent } from "react";

import { STEP_KEYS, stepTo } from "./pointer-model";

/*
 * The pointer model's keyboard: the arrows, Home and End step through the
 * stops; Enter or Space pins; Esc lets go. A key the model handles is
 * consumed (preventDefault), so the page never scrolls under it; one it
 * does not (Esc with nothing showing, Tab) passes through.
 */

interface KeyContext<K> {
  cancelLeave: () => void;
  clear: () => void;
  key: K | null;
  keys: readonly K[];
  pinned: boolean;
  put: (key: K | null, pinned?: boolean) => void;
}

export const keyHandler =
  <K>(ctx: KeyContext<K>) =>
  (e: KeyboardEvent<SVGSVGElement>) => {
    const { keys } = ctx;
    const index = ctx.key === null ? -1 : keys.indexOf(ctx.key);
    if (STEP_KEYS.has(e.key)) {
      e.preventDefault();
      if (keys.length > 0) {
        ctx.cancelLeave();
        ctx.put(keys[stepTo(keys.length, index, e.key)]);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (ctx.pinned) {
        ctx.put(ctx.key, false);
      } else if (keys.length > 0) {
        ctx.put(keys[Math.max(0, index)], true);
      }
    } else if (e.key === "Escape" && (ctx.pinned || ctx.key !== null)) {
      e.preventDefault();
      ctx.clear();
    }
  };
