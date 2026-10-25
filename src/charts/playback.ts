import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { useMotionPreference, useReveal } from "./hooks";

/*
 * Scripted motion: the one clock behind every chart that animates from
 * script rather than CSS (races, draw-ins, live streams, morphs). Frames are
 * paced by requestAnimationFrame with each step capped, so a tab coming back
 * from the background carries on rather than jumping; nothing runs until
 * the chart has been revealed, or while it is scrolled out of view.
 */

/** The longest step a frame may take, in ms. */
const MAX_STEP = 64;

/** Live visibility: unlike useReveal, it flips back when scrolled away. */
export const useInView = (
  ref: RefObject<HTMLElement | null>,
  threshold = 0.1
) => {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
      },
      { threshold }
    );
    if (ref.current !== null) {
      io.observe(ref.current);
    }
    return () => {
      io.disconnect();
    };
  }, [ref, threshold]);
  return inView;
};

/** True once the box has scrolled into view, and only while it stays there. */
export const useLive = (box: RefObject<HTMLElement | null>) => {
  const revealed = useReveal(box);
  const inView = useInView(box);
  return revealed && inView;
};

/** Calls `onFrame(dt)` on every animation frame while `running`; dt in ms, capped. */
export const useFrame = (running: boolean, onFrame: (dt: number) => void) => {
  const latest = useRef(onFrame);
  useLayoutEffect(() => {
    latest.current = onFrame;
  });
  useEffect(() => {
    let raf = 0;
    let prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(MAX_STEP, now - prev);
      prev = now;
      latest.current(dt);
      raf = requestAnimationFrame(tick);
    };
    if (running) {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [running]);
};

/** Calls `onBeat()` every `every` ms while `running`. */
const useBeat = (running: boolean, every: number, onBeat: () => void) => {
  const latest = useRef(onBeat);
  useLayoutEffect(() => {
    latest.current = onBeat;
  });
  useEffect(() => {
    let timer = 0;
    if (running) {
      timer = window.setInterval(() => {
        latest.current();
      }, every);
    }
    return () => {
      window.clearInterval(timer);
    };
  }, [running, every]);
};

interface PlayheadOptions {
  /** The chart's box: playback waits for it to be revealed and on screen. */
  box: RefObject<HTMLElement | null>;
  /** Where playback stops; Infinity for a loop that never ends. */
  end: number;
  /** ms of real time per unit of the playhead. */
  rate: number;
  /**
   * Under reduced motion the playhead does not glide. "end": it starts
   * finished. "step": it starts at `start` and paused, and Play moves it a
   * whole `step.unit` every `step.every` ms.
   */
  reduced: "end" | "step";
  /** Where a reduced-motion "step" playhead starts (default 0). */
  start?: number;
  step?: { every: number; unit: number };
}

const initialPlayheadTime = (o: PlayheadOptions, reduced: boolean) => {
  if (!reduced) {
    return 0;
  }
  return o.reduced === "end" ? o.end : (o.start ?? 0);
};

/**
 * A playhead from 0 to `end` that advances while playing and live. Toggle
 * plays and pauses (and restarts once finished), seek jumps and pauses,
 * replay starts again from 0.
 */
export const usePlayhead = (o: PlayheadOptions) => {
  const live = useLive(o.box);
  const preference = useMotionPreference();
  const reduced = preference ?? true;
  const [initialised, setInitialised] = useState(preference !== null);
  const [t, setT] = useState(() => initialPlayheadTime(o, reduced));
  const [playing, setPlaying] = useState(() => !reduced);
  // Hydration uses the server's still frame. Initialise playback once the
  // client's preference arrives, before committing its first live frame.
  if (!initialised && preference !== null) {
    setInitialised(true);
    setT(initialPlayheadTime(o, reduced));
    setPlaying(!reduced);
  }
  const done = t >= o.end;
  const running = playing && live && !done;
  const unit = o.step?.unit ?? 1;
  useFrame(running && !reduced, (dt) => {
    setT((cur) => Math.min(o.end, cur + dt / o.rate));
  });
  useBeat(running && reduced, o.step?.every ?? 0, () => {
    setT((cur) => Math.min(o.end, (Math.floor(cur / unit) + 1) * unit));
  });
  return {
    done,
    handleReplay: () => {
      setT(0);
      setPlaying(true);
    },
    handleSeek: (k: number) => {
      setPlaying(false);
      setT(k);
    },
    handleToggle: () => {
      if (done) {
        setT(0);
        setPlaying(true);
      } else {
        setPlaying((p) => !p);
      }
    },
    playing: playing && !done,
    reduced,
    t,
  };
};
