import { ALL_ENTRIES, entryById } from "../gallery/registry";
import type { GalleryEntry } from "../gallery/types";

// "Rung Bars" → "Rung bars"; all-caps words such as "US" or "LR" stay as they are.
const sentenceCase = (name: string) =>
  name
    .split(" ")
    .map((word, i) => {
      if (i === 0 || word === word.toUpperCase()) {
        return word;
      }
      return word.toLowerCase();
    })
    .join(" ");

const ground = (entry: GalleryEntry) => {
  if (entry.dark === true) {
    return "surface-dark";
  }
  // Board charts draw their own panel; inside a cell the cell is the panel.
  return entry.family === "board"
    ? "surface-board [&_figure]:bg-transparent"
    : "bg-paper grain";
};

/**
 * One chart in the house frame: its name, then the chart centred in the room
 * left. Every cell is set the same way, so the grid reads as one desk's work.
 */
const Cell = (props: { entry: GalleryEntry }) => (
  <figure
    id={props.entry.id}
    className={`m-0 flex min-w-0 flex-col gap-8 p-6 md:p-10 ${ground(props.entry)} ${props.entry.span === "full" ? "col-span-full" : ""}`}
  >
    <figcaption className="text-small text-text">
      {sentenceCase(props.entry.name)}
    </figcaption>
    <div className="flex min-w-0 flex-1 flex-col justify-center">
      {props.entry.render()}
    </div>
  </figure>
);

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
    return <main className="text-muted p-10">No chart called {props.id}</main>;
  }
  return (
    <main
      className={`mx-auto ${entry.span === "full" ? "max-w-[1400px]" : "max-w-[760px]"}`}
    >
      <Cell entry={entry} />
    </main>
  );
};
