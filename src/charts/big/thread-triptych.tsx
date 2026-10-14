import { useEffect, useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { rndSigned } from "../../lib/random";
import { Plot } from "../core";
import { PlotNote } from "../plot-note";
import { DottedLine } from "../texture";
import { noteSpace, sansWidth, stagger } from "../util";
import { threadTriptychDemo } from "./thread-triptych.data";
import type { ThreadPath, TriptychData } from "./thread-triptych.data";

interface ThreadTriptychProps {
  data?: TriptychData;
  height?: number;
  /** Column titles, left to right. */
  headings?: [string, string, string];
  note?: string;
}

type Column = "destination" | "processor" | "source";

type Focus =
  | { column: Column; kind: "node"; name: string }
  | { id: string; kind: "thread" };

/** A thread as drawn: its path through the three columns. */
interface Thread {
  d: string;
  path: ThreadPath;
}

/** A labelled stop in one column. */
interface Stop {
  column: Column;
  /** Position in its column, top to bottom. */
  index: number;
  key: string;
  name: string;
  y: number;
}

interface Triptych {
  dx: number;
  /** Processor labels shown at rest: every nth, so they never crowd. */
  every: number;
  /** The destination most threads reach: the one mark in ink. */
  hero: string;
  /** Height of each column's pointer rows: the stop spacing, up to 44px. */
  pitch: Record<Column, number>;
  px: number;
  stops: Stop[];
  sx: number;
  threads: Thread[];
  wide: boolean;
}

const HEADER_Y = 12;
/** Smallest vertical gap between processor labels at rest. */
const LABEL_GAP = 22;
const TOP = 46;
/** Gap between a source or destination mark and its label. */
const LABEL_INSET = 14;
const COLUMNS: Column[] = ["source", "processor", "destination"];
/** Tallest pointer row a stop needs. */
const ROW_MAX = 44;

const pitchOf = (count: number, top: number, bottom: number) =>
  Math.min(ROW_MAX, (bottom - top) / Math.max(1, count - 1));

const busiest = (paths: ThreadPath[]) => {
  const counts = new Map<string, number>();
  for (const p of paths) {
    counts.set(p.destination, (counts.get(p.destination) ?? 0) + 1);
  }
  return [...counts].toSorted((a, b) => b[1] - a[1])[0]?.[0] ?? "";
};

const spread = (names: string[], top: number, bottom: number) =>
  new Map(
    names.map((n, i) => [
      n,
      names.length === 1
        ? (top + bottom) / 2
        : top + ((bottom - top) * i) / (names.length - 1),
    ])
  );

/** Width of the longest label in a column, so label columns never clip. */
const widest = (names: string[]) =>
  Math.ceil(Math.max(0, ...names.map((n) => sansWidth(n, 12))));

const layoutTriptych = (
  data: TriptychData,
  width: number,
  floor: number
): Triptych => {
  const wide = width >= 640;
  const sx = Math.max(widest(data.sources) + LABEL_INSET + 2, width * 0.17);
  const dx = Math.min(
    width - widest(data.destinations) - LABEL_INSET - 2,
    width * 0.8
  );
  const px = (sx + dx) / 2;
  const ys: Record<Column, Map<string, number>> = {
    destination: spread(data.destinations, TOP + 26, floor - 30),
    processor: spread(data.processors, TOP - 6, floor + 2),
    source: spread(data.sources, TOP, floor),
  };
  const stops = COLUMNS.flatMap((column) =>
    [...ys[column]].map(([name, y], index): Stop => ({
      column,
      index,
      key: `${column}:${name}`,
      name,
      y,
    }))
  );
  const m1 = (sx + px) / 2;
  const m2 = (px + dx) / 2;
  const threads = data.paths.map((path, i): Thread => {
    const y0 = ys.source.get(path.source) ?? TOP;
    const y1 = ys.processor.get(path.processor) ?? TOP;
    const y2 = ys.destination.get(path.destination) ?? TOP;
    // A little play in each curve's waist so a bundle reads as many threads.
    const j = rndSigned(i, 5) * Math.min(18, width * 0.012);
    const k = rndSigned(i, 9) * Math.min(18, width * 0.012);
    return {
      d: `M${sx + 4},${y0}C${m1 + j},${y0} ${m1 + j},${y1} ${px},${y1}C${m2 + k},${y1} ${m2 + k},${y2} ${dx},${y2}`,
      path,
    };
  });
  const pitch: Record<Column, number> = {
    destination: pitchOf(data.destinations.length, TOP + 26, floor - 30),
    processor: pitchOf(data.processors.length, TOP - 6, floor + 2),
    source: pitchOf(data.sources.length, TOP, floor),
  };
  // Processor labels thin out when their column is tight; a traced bundle still lights its own.
  const every = Math.max(1, Math.ceil(LABEL_GAP / pitch.processor));
  return {
    dx,
    every,
    hero: busiest(data.paths),
    pitch,
    px,
    stops,
    sx,
    threads,
    wide,
  };
};

const touches = (path: ThreadPath, focus: Focus) => {
  if (focus.kind === "thread") {
    return path.id === focus.id;
  }
  return path[focus.column] === focus.name;
};

const sameFocus = (a: Focus | null, b: Focus | null) => {
  if (a === null || b === null) {
    return a === b;
  }
  if (a.kind === "thread" && b.kind === "thread") {
    return a.id === b.id;
  }
  return (
    a.kind === "node" &&
    b.kind === "node" &&
    a.column === b.column &&
    a.name === b.name
  );
};

/** One tone at one opacity: bundles build up where threads share a route. */
const THREAD_OPACITY = 0.16;

/** Every thread at rest plus wide invisible hit paths, built once per size. */
const ThreadBase = (props: { threads: Thread[] }) => (
  <g
    className="transition-opacity group-data-[focus=true]/threads:opacity-25"
    fill="none"
  >
    {props.threads.map((t, i) => (
      <path
        className="draw stroke-ink cap-round"
        d={t.d}
        key={t.path.id}
        pathLength={1}
        strokeOpacity={THREAD_OPACITY}
        strokeWidth={1.5}
        style={stagger(i * 0.5, "dense")}
      />
    ))}
    {props.threads.map((t) => (
      <path
        className="cursor-pointer stroke-transparent"
        d={t.d}
        data-thread={t.path.id}
        key={`hit-${t.path.id}`}
        strokeWidth={7}
      />
    ))}
  </g>
);

/** Ink when lit, otherwise the stop's resting tone. */
const textTone = (bright: boolean, rest: string) =>
  bright ? "fill-ink" : rest;

const DestinationMark = (props: {
  bright: boolean;
  hero: boolean;
  stop: Stop;
  x: number;
}) => {
  const { stop, x } = props;
  return (
    <>
      {props.hero ? (
        <circle className="fill-ink" cx={x} cy={stop.y} r={4.5} />
      ) : (
        <circle
          className={`fill-paper transition-tone ${props.bright ? "stroke-ink" : "stroke-l3"}`}
          cx={x}
          cy={stop.y}
          r={4.5}
          strokeWidth={1}
        />
      )}
      <text
        className={`t-label ${textTone(props.bright || props.hero, "fill-text")}`}
        dy="0.35em"
        x={x + LABEL_INSET}
        y={stop.y}
      >
        {stop.name}
      </text>
    </>
  );
};

const StopMark = (props: {
  lit: boolean | null;
  stop: Stop;
  triptych: Triptych;
}) => {
  const { stop, triptych } = props;
  const tone = props.lit === false ? "opacity-30" : "";
  const bright = props.lit === true;
  // 2px ticks on whole pixels.
  const tickY = Math.round(stop.y) - 1;
  if (stop.column === "source") {
    return (
      <g className={`transition-opacity ${tone}`}>
        <rect
          className={textTone(bright, "fill-l3")}
          height={2}
          width={5}
          x={Math.round(triptych.sx) - 7}
          y={tickY}
        />
        <text
          className={`t-name ${textTone(bright, "fill-text")}`}
          dy="0.35em"
          textAnchor="end"
          x={triptych.sx - LABEL_INSET}
          y={stop.y}
        >
          {stop.name}
        </text>
      </g>
    );
  }
  if (stop.column === "processor") {
    return (
      <g className={`transition-opacity ${tone}`}>
        <rect
          className={textTone(bright, "fill-l3")}
          height={2}
          width={6}
          x={Math.round(triptych.px) - 3}
          y={tickY}
        />
        {((triptych.wide && stop.index % triptych.every === 0) || bright) && (
          <text
            className={`t-axis t-halo ${textTone(bright, "fill-muted")}`}
            dy="0.35em"
            x={triptych.px + 9}
            y={stop.y}
          >
            {stop.name}
          </text>
        )}
      </g>
    );
  }
  return (
    <g className={`transition-opacity ${tone}`}>
      <DestinationMark
        bright={bright}
        hero={stop.name === triptych.hero}
        stop={stop}
        x={triptych.dx}
      />
    </g>
  );
};

const hitBox = (stop: Stop, triptych: Triptych) => {
  if (stop.column === "source") {
    return { width: triptych.sx - 4, x: 0 };
  }
  if (stop.column === "processor") {
    return { width: 70, x: triptych.px - 6 };
  }
  return { width: 110, x: triptych.dx - 8 };
};

const StopLayer = (props: { lit: Set<string> | null; triptych: Triptych }) => {
  const { lit, triptych } = props;
  return (
    <g>
      {triptych.stops.map((stop) => (
        <g className="cursor-pointer" key={stop.key}>
          <rect
            className="fill-transparent"
            data-stop={stop.key}
            height={triptych.pitch[stop.column]}
            y={stop.y - triptych.pitch[stop.column] / 2}
            {...hitBox(stop, triptych)}
          />
          <g className="pointer-events-none">
            <StopMark
              lit={lit === null ? null : lit.has(stop.key)}
              stop={stop}
              triptych={triptych}
            />
          </g>
        </g>
      ))}
    </g>
  );
};

const countOf = (paths: ThreadPath[], column: Column) =>
  new Set(paths.map((p) => p[column])).size;

/** A column heading and its count: every stop at rest, the lit stops under focus. */
const Heading = (props: {
  anchor: "end" | "middle" | "start";
  count: number;
  label: string;
  x: number;
}) => (
  <text
    className="fade t-label fill-muted"
    textAnchor={props.anchor}
    x={props.x}
    y={HEADER_Y}
  >
    <tspan>{props.label}</tspan>{" "}
    <tspan className="t-value">{props.count}</tspan>
  </text>
);

const Headings = (props: {
  headings: [string, string, string];
  paths: ThreadPath[];
  triptych: Triptych;
  width: number;
}) => {
  const { dx, px, sx, wide } = props.triptych;
  const last = countOf(props.paths, "destination");
  // The last heading slides left when it would run past the plot's edge.
  const lastW = Math.ceil(sansWidth(`${props.headings[2]} ${last}`, 12)) + 2;
  // Each heading sits on its column's label edge; narrow plots hide processor labels, so that heading centres on its ticks.
  return (
    <g aria-live="polite">
      <Heading
        anchor="end"
        count={countOf(props.paths, "source")}
        label={props.headings[0]}
        x={sx - LABEL_INSET}
      />
      <Heading
        anchor={wide ? "start" : "middle"}
        count={countOf(props.paths, "processor")}
        label={props.headings[1]}
        x={wide ? px + 9 : px}
      />
      <Heading
        anchor="start"
        count={last}
        label={props.headings[2]}
        x={Math.min(dx + LABEL_INSET, props.width - lastW)}
      />
    </g>
  );
};

const targetFocus = (
  e: PointerEvent<SVGSVGElement>,
  triptych: Triptych
): Focus | null => {
  const { target } = e;
  if (!(target instanceof SVGElement)) {
    return null;
  }
  const { thread } = target.dataset;
  if (thread !== undefined) {
    return { id: thread, kind: "thread" };
  }
  const stop = triptych.stops.find((s) => s.key === target.dataset.stop);
  return stop === undefined
    ? null
    : { column: stop.column, kind: "node", name: stop.name };
};

const useEscape = (active: boolean, release: () => void) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        release();
      }
    };
    if (active) {
      window.addEventListener("keydown", onKey);
    }
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [active, release]);
};

const TriptychSvg = (props: {
  data: TriptychData;
  focus: Focus | null;
  headings: [string, string, string];
  height: number;
  note?: string;
  onHover: (f: Focus | null) => void;
  onPin: (f: Focus | null) => void;
  width: number;
}) => {
  const { data, focus, height, note, width } = props;
  const floor = height - 16 - noteSpace(note, width - 16, 18);
  const triptych = useMemo(
    () => layoutTriptych(data, width, floor),
    [data, width, floor]
  );
  // Same element between renders: hovering redraws only the lit threads on top.
  const base = useMemo(
    () => <ThreadBase threads={triptych.threads} />,
    [triptych]
  );
  const litThreads =
    focus === null
      ? []
      : triptych.threads.filter((t) => touches(t.path, focus));
  const litStops =
    focus === null
      ? null
      : new Set(
          litThreads.flatMap((t) => [
            `source:${t.path.source}`,
            `processor:${t.path.processor}`,
            `destination:${t.path.destination}`,
          ])
        );
  const label = `Data paths: ${data.paths.length} paths from ${data.sources.length} sources through ${data.processors.length} processors to ${data.destinations.length} destinations`;

  return (
    <svg
      aria-label={label}
      className="group/threads"
      data-focus={focus !== null}
      height={height}
      onPointerLeave={() => {
        props.onHover(null);
      }}
      onPointerMove={(e) => {
        props.onHover(targetFocus(e, triptych));
      }}
      onPointerUp={(e) => {
        props.onPin(targetFocus(e, triptych));
      }}
      width={width}
    >
      <title>{label}</title>
      <rect className="fill-transparent" height={height} width={width} />
      <Headings
        headings={props.headings}
        paths={focus === null ? data.paths : litThreads.map((t) => t.path)}
        triptych={triptych}
        width={width}
      />
      <g className="fade">
        <DottedLine
          tone="fill-l5"
          x0={triptych.px}
          x1={triptych.px}
          y0={TOP - 6}
          y1={floor + 2}
        />
      </g>
      {base}
      <g
        className="stroke-ink cap-round pointer-events-none"
        fill="none"
        strokeWidth={1.5}
      >
        {litThreads.map((t) => (
          <path d={t.d} key={t.path.id} />
        ))}
      </g>
      <StopLayer lit={litStops} triptych={triptych} />
      <PlotNote text={note} width={width - 16} x={width / 2} y={height - 6} />
    </svg>
  );
};

/**
 * B3 Data paths. Three columns (source → processor → destination), one
 * thread per data path. Hover a thread to trace its route or a label to pull
 * its whole bundle; click to pin, Escape or click empty space to release.
 * Each column heading carries its count: all stops at rest, the lit ones
 * under focus.
 */
export const ThreadTriptych = (props: ThreadTriptychProps) => {
  const data = props.data ?? threadTriptychDemo;
  const [hover, setHover] = useState<Focus | null>(null);
  const [pinned, setPinned] = useState<Focus | null>(null);
  const focus = pinned ?? hover;
  const release = useMemo(
    () => () => {
      setPinned(null);
    },
    []
  );
  useEscape(pinned !== null, release);

  return (
    <Plot>
      {(width) => (
        <TriptychSvg
          data={data}
          focus={focus}
          headings={props.headings ?? ["Inputs", "Steps", "Stores"]}
          height={props.height ?? 560}
          note={props.note}
          onHover={(f) => {
            setHover((h) => (sameFocus(h, f) ? h : f));
          }}
          onPin={(f) => {
            setPinned((p) => (f === null || sameFocus(p, f) ? null : f));
          }}
          width={width}
        />
      )}
    </Plot>
  );
};
