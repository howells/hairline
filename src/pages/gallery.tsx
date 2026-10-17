import { useEffect, useRef, useState } from "react";

import { ALL_ENTRIES, entryById } from "../gallery/registry";
import type { GalleryEntry } from "../gallery/types";

const ground = (entry: GalleryEntry) => {
  if (entry.dark === true) {
    return "surface-dark";
  }
  // Board charts draw their own panel; inside a cell the cell is the panel,
  // so its fill and side padding give way to the cell's.
  return entry.family === "board"
    ? "surface-board [&_figure]:bg-transparent [&_figure]:px-0"
    : "bg-paper grain";
};

/** How far ahead of the viewport a chart mounts, so it is drawn before it is seen. */
const AHEAD = "1200px 0px";

/**
 * False until the element first comes within AHEAD of the viewport, then true
 * for good: a chart mounts once, as it nears, and stays mounted.
 */
const useNear = () => {
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: AHEAD }
    );
    if (ref.current !== null) {
      io.observe(ref.current);
    }
    return () => {
      io.disconnect();
    };
  }, []);
  return [ref, near] as const;
};

/**
 * One chart in the house frame: its name, then the chart centred in the room
 * left. Every cell is set the same way, so the grid reads as one desk's work.
 * The chart itself mounts as the cell nears the viewport; until then the cell
 * holds a chart's usual height.
 */
const Cell = (props: { entry: GalleryEntry }) => {
  const [ref, near] = useNear();
  return (
    <figure
      id={props.entry.id}
      ref={ref}
      className={`m-0 flex min-w-0 flex-col gap-8 p-6 md:p-10 ${ground(props.entry)} ${props.entry.span === "full" ? "col-span-full" : ""}`}
    >
      <figcaption className="text-small text-text">
        {props.entry.name}
      </figcaption>
      <div
        className={`flex min-w-0 flex-1 flex-col justify-center ${near ? "" : "min-h-[440px]"}`}
      >
        {near ? props.entry.render() : null}
      </div>
    </figure>
  );
};

/** Every chart in one grid, separated by hairline rules. */
export const ChartGrid = () => (
  <main className="bg-rule border-rule grid grid-flow-dense grid-cols-1 gap-px border-b md:grid-cols-2 2xl:grid-cols-3">
    {ALL_ENTRIES.map((entry) => (
      <Cell key={entry.id} entry={entry} />
    ))}
  </main>
);

/** One chart on its own: `#/chart/L13`. */
export const SingleChart = (props: { id: string }) => {
  const entry = entryById(props.id);
  if (entry === undefined) {
    return (
      <main className="text-small text-muted p-10">
        No chart called {props.id}
      </main>
    );
  }
  return (
    <main
      className={`mx-auto ${entry.span === "full" ? "max-w-[1400px]" : "max-w-[760px]"}`}
    >
      <Cell entry={entry} />
    </main>
  );
};
