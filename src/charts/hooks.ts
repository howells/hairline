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
 */
export const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width));
    });
    if (ref.current !== null) {
      setWidth(contentWidth(ref.current));
      ro.observe(ref.current);
    }
    return () => {
      ro.disconnect();
    };
  }, []);
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

/**
 * True when the reader asks for reduced motion; follows changes live. On the
 * server, and in the first client render, motion is assumed reduced, so a
 * server-rendered chart never paints mid-animation.
 */
export const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => true
  );

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
