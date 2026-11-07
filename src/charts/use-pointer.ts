import { useEffect, useEffectEvent, useId, useRef, useState } from "react";
import type {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
} from "react";

import { keyHandler } from "./pointer-keys";
import { nearest } from "./pointer-model";
import type { Axis, Spot } from "./pointer-model";
import { clientOf, releaseHold, touchHandlers } from "./pointer-touch";
import type { HeldRef } from "./pointer-touch";

/*
 * The one pointer model. A chart calls usePointer once for the state, then
 * spreads `bind(...)` on its <ChartSvg> with its stops (the places a reader
 * can land: a day, a bar, a point). What it gives back is the key showing and
 * whether the reader pinned it.
 *
 *   mouse     moves snap to the nearest stop; a click pins, a second click lets go
 *   keyboard  the focused svg steps with the arrows, Home and End; Enter or
 *             Space pins; Esc lets go
 *   touch     press and hold to scrub; a bare swipe is left to the page, so
 *             vertical or horizontal scrolling never gets hijacked
 *
 * A pinned stop stays until Esc, a second click or a press outside the chart
 * (WCAG 1.4.13: dismissable, hoverable, persistent).
 */

/** How long the tip stays after the pointer leaves, so it can be reached, ms. */
const LEAVE_MS = 160;

export interface PointerStop<K> extends Spot {
  key: K;
}

/** How a stop came to be showing: announced aloud only when it was asked for. */
export type Via = "key" | "pointer" | "touch";

/** The key shown elsewhere too (small multiples scrub together). Pinning stays local. */
export interface PointerLink<K> {
  set: (key: K | null) => void;
  value: K | null;
}

export interface BindOptions<K> {
  axis: Axis;
  /** Drawing height, to turn the pointer's screen position into the chart's. */
  height: number;
  /** Keep the stop showing a moment after the pointer leaves, so a tip can be reached. */
  hoverable?: boolean;
  /** The furthest a pointer may be from a stop and still snap to it, px. */
  reach?: number;
  /** In reading order: the keys step through them. */
  stops: readonly PointerStop<K>[];
  width: number;
}

interface State<K> {
  key: K | null;
  pinned: boolean;
  via: Via;
}

/** A client position in the chart's own pixels, whatever size the svg is shown at. */
const spotOf = (
  client: Spot,
  el: SVGSVGElement,
  width: number,
  height: number
): Spot => {
  const box = el.getBoundingClientRect();
  const sx = box.width > 0 ? width / box.width : 1;
  const sy = box.height > 0 ? height / box.height : 1;

  return { x: (client.x - box.left) * sx, y: (client.y - box.top) * sy };
};

/** Esc anywhere, or a press outside the chart, lets a pinned tip go. */
const useDismissWhenPinned = (
  pinned: boolean,
  id: string,
  dismiss: () => void
) => {
  const onDismiss = useEffectEvent(dismiss);
  useEffect(() => {
    if (!pinned) {
      return () => {
        // nothing is listening
      };
    }

    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    const onDown = (e: globalThis.PointerEvent) => {
      const owner =
        e.target instanceof Element
          ? e.target.closest("[data-hl-pointer]")
          : null;

      const ownerId =
        owner instanceof HTMLElement || owner instanceof SVGElement
          ? owner.dataset.hlPointer
          : undefined;

      if (ownerId !== id) {
        onDismiss();
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [pinned, id]);
};

/** The showing key, whether it is pinned, and the ways to move and drop it. */
const usePointerState = <K>(link?: PointerLink<K>) => {
  const id = useId();

  const [state, setState] = useState<State<K>>({
    key: null,
    pinned: false,
    via: "pointer",
  });

  const linked = link?.value ?? null;
  const key = link === undefined ? state.key : linked;
  const held: HeldRef<K> = useRef(null);
  const leaving = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** A touch scrub ends in a click the browser sends anyway: let it pass. */
  const swallow = useRef(false);

  const put = (next: K | null, via: Via, pinned?: boolean) => {
    setState({ key: next, pinned: pinned ?? state.pinned, via });
    link?.set(next);
  };

  const cancelLeave = () => {
    if (leaving.current !== null) {
      clearTimeout(leaving.current);
      leaving.current = null;
    }
  };

  const clear = () => {
    cancelLeave();
    put(null, "pointer", false);
  };

  const leave = () => {
    cancelLeave();

    if (!state.pinned) {
      leaving.current = setTimeout(clear, LEAVE_MS);
    }
  };

  useEffect(
    () => () => {
      releaseHold(held);

      if (leaving.current !== null) {
        clearTimeout(leaving.current);
      }
    },
    []
  );
  useDismissWhenPinned(state.pinned, id, clear);

  return {
    cancelLeave,
    clear,
    held,
    id,
    key,
    leave,
    put,
    state,
    swallow,
  };
};

export const usePointer = <K>(link?: PointerLink<K>) => {
  const { cancelLeave, clear, held, id, key, leave, put, state, swallow } =
    usePointerState(link);

  const bind = (options: BindOptions<K>) => {
    const { axis, height, stops, width } = options;
    const reach = options.reach ?? 40;

    const pick = (client: Spot, el: SVGSVGElement, limit: number) =>
      nearest(stops, axis, spotOf(client, el, width, height), limit);

    const touch = touchHandlers<K>({
      held,
      keyAt: (client, el) => pick(client, el, Infinity)?.key ?? null,
      pinned: state.pinned,
      put: (next, pinned) => {
        put(next, "touch", pinned);
      },
      swallow,
    });

    const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "touch") {
        touch.onPointerMove(e);

        return;
      }

      if (state.pinned) {
        return;
      }

      cancelLeave();
      const stop = pick(clientOf(e), e.currentTarget, reach);

      if (stop === null) {
        if (key !== null) {
          put(null, "pointer");
        }
      } else if (stop.key !== key || state.via !== "pointer") {
        put(stop.key, "pointer");
      }
    };

    const onPointerLeave = (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === "touch" || state.pinned) {
        return;
      }

      if (options.hoverable === true) {
        leave();
      } else {
        clear();
      }
    };

    const onClick = (e: MouseEvent<SVGSVGElement>) => {
      if (swallow.current) {
        swallow.current = false;
      } else if (state.pinned) {
        // A second click lets go; the pointer is still over the chart.
        put(key, "pointer", false);
      } else {
        const stop = pick(clientOf(e), e.currentTarget, reach);

        if (stop !== null) {
          put(stop.key, "pointer", true);
        }
      }
    };

    const onKeyDown = keyHandler<K>({
      cancelLeave,
      clear,
      key,
      keys: stops.map((s) => s.key),
      pinned: state.pinned,
      put: (next, pinned) => {
        put(next, "key", pinned);
      },
    });

    return {
      "data-hl-pointer": id,
      onBlur: (e: FocusEvent<SVGSVGElement>) => {
        // The next focus is the keyboard's unless a pointer says otherwise.
        delete e.currentTarget.dataset.hlInput;

        if (!state.pinned && state.via === "key") {
          clear();
        }
      },
      onClick,
      onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => {
        delete e.currentTarget.dataset.hlInput;
        onKeyDown(e);
      },
      onPointerCancel: touch.onPointerCancel,
      onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
        // A click or tap focuses the chart without asking for its ring.
        e.currentTarget.dataset.hlInput = "pointer";
        touch.onPointerDown(e);
      },
      onPointerLeave,
      onPointerMove,
      onPointerUp: touch.onPointerUp,
      tabIndex: 0,
    };
  };

  return {
    bind,
    cancelLeave,
    id,
    key,
    leave,
    pinned: state.pinned && key !== null,
    via: state.via,
  };
};

export type PointerState<K> = ReturnType<typeof usePointer<K>>;
