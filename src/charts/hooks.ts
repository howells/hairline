import { bisectCenter } from "d3-array";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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

/** True when the reader asks for reduced motion; follows changes live. */
export const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia(REDUCED).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(REDUCED);
    const onChange = () => {
      setReduced(mq.matches);
    };
    mq.addEventListener("change", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
    };
  }, []);
  return reduced;
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
