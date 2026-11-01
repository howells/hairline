import { bisectCenter } from "d3-array";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  RefObject,
} from "react";

/** A computed length, always resolved to "<n>px", as a number. */
const px = (length: string) => Number(length.slice(0, -2));

/** Content-box width of an element, padding excluded, as ResizeObserver reports it. */
const contentWidth = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  return Math.floor(
    el.clientWidth - px(style.paddingLeft) - px(style.paddingRight)
  );
};

/**
 * Width of an element, kept current with a ResizeObserver. The first width is
 * read during layout, so a chart is drawn at its final size in the first
 * painted frame rather than one frame later, which would shift the page.
 *
 * `initial` is the width before the first measure (0: draw nothing yet). It
 * is also what the server renders, so a responsive chart given an
 * `initialWidth` has real marks in its first HTML. `enabled: false` is fixed
 * mode: the width stays `initial` and nothing is observed.
 */
export const useMeasure = <T extends HTMLElement>(
  initial = 0,
  enabled = true
) => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(initial);
  useLayoutEffect(() => {
    const ro = enabled
      ? new ResizeObserver(([entry]) => {
          setWidth(Math.floor(entry.contentRect.width));
        })
      : null;
    if (ro !== null && ref.current !== null) {
      setWidth(contentWidth(ref.current));
      ro.observe(ref.current);
    }
    return () => {
      ro?.disconnect();
    };
  }, [enabled]);
  return [ref, width] as const;
};

/** Flips to true once the element scrolls into view; drives the entry animation. */
export const useReveal = (ref: RefObject<HTMLElement | null>) => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current !== null) {
      io.observe(ref.current);
    }
    return () => {
      io.disconnect();
    };
  }, [ref]);
  return shown;
};

const REDUCED = "(prefers-reduced-motion: reduce)";

const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
  };
};

/** The reader's live preference, or null until the client snapshot is available. */
export const useMotionPreference = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    (): boolean | null => null
  );

/** Assume reduced motion until hydration supplies the reader's preference. */
export const useReducedMotion = () => useMotionPreference() ?? true;

export type Animate = "mount" | "off" | "scroll";

interface EntryOptions {
  animate?: Animate;
  onReady?: () => void;
  replayKey?: number | string;
}

/**
 * Resolves once every CSS animation running under `el` has finished. Where
 * the browser cannot list animations (jsdom) there is nothing to wait for.
 */
const settled = async (el: HTMLElement) => {
  const running = (el.getAnimations?.({ subtree: true }) ?? []).filter(
    (a) => "animationName" in a
  );
  await Promise.all(
    running.map(async (a) => {
      try {
        await a.finished;
      } catch {
        // cancelled (replayed or removed): nothing left to wait for
      }
    })
  );
};

/** The cleanup of an effect that subscribed to nothing. */
const unsubscribe = () => {
  /* nothing to undo */
};

type Phase = "hidden" | "shown" | "still";

const phaseOf = (still: boolean, revealed: boolean): Phase => {
  if (still) {
    return "still";
  }
  return revealed ? "shown" : "hidden";
};

/**
 * The entry animation and the ready signal for a Plot.
 *
 * `phase` is the class state: "hidden" until revealed (on scroll, or at once
 * for animate="mount"), then "shown"; "still" when nothing animates (animate
 * "off", or the reader prefers reduced motion), so the chart is simply drawn.
 * The server and the first client render always agree: hidden, or still for
 * "off"; the reader's motion preference is only known after hydration.
 *
 * `ready` turns true once the entry has finished (at once when still);
 * `onReady` is called at that moment. A new `replayKey` starts a new cycle:
 * the plot is hidden again and the entry replays in place.
 */
export const useEntry = (
  ref: RefObject<HTMLElement | null>,
  options: EntryOptions
) => {
  const animate = options.animate ?? "scroll";
  const reduced = useMotionPreference() === true;
  const still = animate === "off" || reduced;
  // A cycle is one play of the entry; reveal and settle are recorded against
  // the cycle they belong to, so a replay needs no resetting.
  const [cycle, setCycle] = useState(0);
  const [seenKey, setSeenKey] = useState(options.replayKey);
  const [revealedIn, setRevealedIn] = useState(-1);
  const [settledIn, setSettledIn] = useState(-1);
  if (seenKey !== options.replayKey) {
    setSeenKey(options.replayKey);
    setCycle(cycle + 1);
  }
  const revealed = revealedIn === cycle;
  const ready = still || settledIn === cycle;

  // Reveal: on scroll (the observer reports at once if already in view), or on mount.
  useEffect(() => {
    if (still) {
      return unsubscribe;
    }
    if (animate === "mount") {
      const frame = requestAnimationFrame(() => {
        // Make the hidden state real before the shown one, so a replay restarts.
        void ref.current?.getBoundingClientRect();
        setRevealedIn(cycle);
      });
      return () => {
        cancelAnimationFrame(frame);
      };
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealedIn(cycle);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    if (ref.current !== null) {
      io.observe(ref.current);
    }
    return () => {
      io.disconnect();
    };
  }, [animate, cycle, ref, still]);

  // Settle: ready once the entry's animations have finished.
  useEffect(() => {
    if (!revealed || still) {
      return unsubscribe;
    }
    let live = true;
    const finish = async () => {
      if (ref.current !== null) {
        await settled(ref.current);
      }
      if (live) {
        setSettledIn(cycle);
      }
    };
    const frame = requestAnimationFrame(() => {
      void finish();
    });
    return () => {
      live = false;
      cancelAnimationFrame(frame);
    };
  }, [cycle, ref, revealed, still]);

  const callback = useRef(options.onReady);
  useLayoutEffect(() => {
    callback.current = options.onReady;
  });
  // One call each time the chart becomes ready: first draw, and each replay.
  useEffect(() => {
    if (ready) {
      callback.current?.();
    }
  }, [ready]);

  return { phase: phaseOf(still, revealed), ready } as const;
};

/** React's useId, made safe for url(#id) references. */
export const useSvgId = (prefix: string) =>
  `${prefix}-${useId().replaceAll(/[^\w-]/gu, "")}`;

/** Shared hover time, so small multiples scrub together. */
export interface Sync {
  setTime: (t: number | null) => void;
  time: number | null;
}

const SCRUB_KEYS = new Set(["ArrowLeft", "ArrowRight", "End", "Home"]);

/**
 * One cursor index per chart. Hover or arrow keys move it; leaving restores
 * the resting index. Marks left of the cursor read as "past", right as "future".
 */
export const useScrub = (restIndex: number, dates: Date[], sync?: Sync) => {
  const [local, setLocal] = useState<number | null>(null);
  const times = dates.map((d) => d.getTime());
  const syncedTime = sync?.time ?? null;
  const syncedIndex =
    syncedTime === null ? null : bisectCenter(times, syncedTime);
  const hover = sync === undefined ? local : syncedIndex;
  const setHover = (i: number | null) => {
    if (sync === undefined) {
      setLocal(i);
    } else {
      sync.setTime(i === null ? null : times[i]);
    }
  };
  const index = hover ?? restIndex;

  const bind = (positions: number[]) => {
    const last = positions.length - 1;
    const target = (key: string) => {
      if (key === "Home") {
        return 0;
      }
      if (key === "End") {
        return last;
      }
      return key === "ArrowLeft" ? index - 1 : index + 1;
    };
    return {
      onBlur: () => {
        setHover(null);
      },
      onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => {
        if (!SCRUB_KEYS.has(e.key)) {
          return;
        }
        e.preventDefault();
        setHover(Math.max(0, Math.min(last, target(e.key))));
      },
      onPointerLeave: () => {
        setHover(null);
      },
      onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
        const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
        setHover(bisectCenter(positions, x));
      },
      style: { touchAction: "pan-y" } satisfies CSSProperties,
      tabIndex: 0,
    };
  };

  return { bind, index, isHovering: hover !== null };
};

/** The hovered record and where its tooltip is anchored. */
export interface HoverAt<K> {
  key: K;
  x: number;
  y: number;
}

/**
 * The one hover state: a record key (an index, an id) plus a tooltip anchor.
 * `dim(key)` is true for every record but the hovered one, and only while
 * something is hovered. `enter(key, x, y)` makes the pointer handler for a
 * record, `showAt(key)` the `(x, y)` callback for a mark that finds its own
 * anchor; `set` takes a key or null, as a nearest-point search returns.
 * Re-showing the same record at the same spot does not re-render.
 */
export const useHover = <K>() => {
  const [at, setAt] = useState<HoverAt<K> | null>(null);
  const show = (key: K, x = 0, y = 0) => {
    setAt((prev) =>
      prev !== null && prev.key === key && prev.x === x && prev.y === y
        ? prev
        : { key, x, y }
    );
  };
  return {
    at,
    clear: () => {
      setAt(null);
    },
    dim: (key: K) => at !== null && at.key !== key,
    enter:
      (key: K, x = 0, y = 0) =>
      () => {
        show(key, x, y);
      },
    key: at === null ? null : at.key,
    set: (key: K | null, x = 0, y = 0) => {
      if (key === null) {
        setAt(null);
      } else {
        show(key, x, y);
      }
    },
    show,
    showAt: (key: K) => (x: number, y: number) => {
      show(key, x, y);
    },
  };
};

/** What useHover returns, for parts that take a chart's hover. */
export type Hover<K> = ReturnType<typeof useHover<K>>;
