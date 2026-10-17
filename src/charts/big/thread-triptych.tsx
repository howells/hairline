import { useEffect, useMemo, useState } from "react";
import type { PointerEvent } from "react";

import { rndSigned } from "../../lib/random";
import { Plot } from "../core";
import { HitRect } from "../hover";
import { Dot, Ring } from "../markers";
import { LABEL_TICK } from "../marks";
import { FootNote } from "../plot-note";
import { ChartSvg } from "../svg";
import { Label } from "../text";
import { DottedLine } from "../texture";
import { noteSpace, sansWidth, stagger } from "../util";
import { threadTriptychDemo } from "./thread-triptych.data";
import type { ThreadPath, TriptychData } from "./thread-triptych.data";

interface ThreadTriptychProps {
  data?: TriptychData;
  height?: number;
  /** Column titles, left to right, one per column. */
  headings?: string[];
  note?: string;
}

type Focus =
  | { column: number; kind: "node"; name: string }
  | { id: string; kind: "thread" };

/** A thread as drawn: its path through every column. */
interface Thread {
  d: string;
  path: ThreadPath;
}

/** A labelled stop in one column. */
interface Stop {
  column: number;
  /** Position in its column, top to bottom. */
  index: number;
  key: string;
  name: string;
  y: number;
}

interface Triptych {
  /** Processor labels shown at rest, per column: every nth, so they never crowd. */
  every: number[];
  /** The last-column stop most threads reach: the one mark in ink. */
  hero: string;
  /** Height of each column's pointer rows: the stop spacing, up to 44px. */
  pitch: number[];
  stops: Stop[];
  threads: Thread[];
  wide: boolean;
  /** Each column's x: the first and last are their label edges. */
  xs: number[];
}

const HEADER_Y = 12;
/** A second heading row, for middle columns too close to share one. */
const HEADER_Y2 = 29;
/** Smallest vertical gap between middle-column labels at rest. */
const LABEL_GAP = 18;
const TOP = 46;
/** Gap between a first or last column mark and its label. */
const LABEL_INSET = 14;
/** Tallest pointer row a stop needs. */
const ROW_MAX = 44;

const stopKey = (column: number, name: string) => `${column}:${name}`;

const busiest = (paths: ThreadPath[], column: number) => {
  const counts = new Map<string, number>();
  for (const p of paths) {
    const name = p.stops[column] ?? "";
    counts.set(name, (counts.get(name) ?? 0) + 1);
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

/**
 * Each stop after the first column sits at the mean height of the stops that
 * feed it, so every parent centres on its own children, as in a tidy tree.
 */
const parentYs = (
  names: string[],
  paths: ThreadPath[],
  column: number,
  prev: Map<string, number>
) =>
  new Map(
    names.map((name) => {
      const kids = [
        ...new Set(
          paths.flatMap((p) =>
            p.stops[column] === name ? [p.stops[column - 1] ?? ""] : []
          )
        ),
      ];
      const ys = kids.map((k) => prev.get(k) ?? TOP);
      return [name, ys.reduce((a, b) => a + b, 0) / Math.max(1, ys.length)];
    })
  );

/** Smallest gap between neighbouring stops in a column, up to ROW_MAX. */
const pitchOf = (ys: number[]) =>
  Math.min(ROW_MAX, ...ys.slice(1).map((y, i) => Math.abs(y - (ys[i] ?? y))));

/** Width of the longest label in a column, so label columns never clip. */
const widest = (names: string[]) =>
  Math.ceil(Math.max(0, ...names.map((n) => sansWidth(n, 12))));

const layoutTriptych = (
  data: TriptychData,
  width: number,
  floor: number
): Triptych => {
  const n = data.columns.length;
  const last = n - 1;
  // The label columns sit flush with both edges, so the composition is
  // centred on its ink at any width. The estimate runs a little wide on the
  // long genus names, so both move left by half the difference measured in
  // the browser.
  const sx = widest(data.columns[0] ?? []) + LABEL_INSET - 0.5;
  const dx = width - widest(data.columns[last] ?? []) - LABEL_INSET + 1.5;
  const xs = data.columns.map((_, c) => sx + ((dx - sx) * c) / last);
  const ys: Map<string, number>[] = [];
  for (const [c, names] of data.columns.entries()) {
    ys.push(
      c === 0
        ? spread(names, TOP, floor)
        : parentYs(names, data.paths, c, ys[c - 1] ?? new Map())
    );
  }
  const stops = ys.flatMap((column, c) =>
    [...column].map(([name, y], index): Stop => ({
      column: c,
      index,
      key: stopKey(c, name),
      name,
      y,
    }))
  );
  const wobble = Math.min(18, width * 0.012);
  const threads = data.paths.map((path, i): Thread => {
    const at = (c: number) => ys[c]?.get(path.stops[c] ?? "") ?? TOP;
    const segments = xs.slice(1).map((x1, s) => {
      const x0 = xs[s] ?? sx;
      // A little play in each curve's waist so a bundle reads as many threads.
      const m = (x0 + x1) / 2 + rndSigned(i, 5 + s * 4) * wobble;
      return `C${m},${at(s)} ${m},${at(s + 1)} ${x1},${at(s + 1)}`;
    });
    return { d: `M${sx + 4},${at(0)}${segments.join("")}`, path };
  });
  const pitch = ys.map((column) => pitchOf([...column.values()]));
  return {
    // Middle labels thin out when their column is tight; a traced bundle still lights its own.
    every: pitch.map((p) => Math.max(1, Math.ceil(LABEL_GAP / p))),
    hero: busiest(data.paths, last),
    pitch,
    stops,
    threads,
    wide: width >= 640,
    xs,
  };
};

const touches = (path: ThreadPath, focus: Focus) => {
  if (focus.kind === "thread") {
    return path.id === focus.id;
  }
  return path.stops[focus.column] === focus.name;
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
    className="transition-opacity group-data-[focus=true]/threads:opacity-30"
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
        <Dot className="fill-hero" cx={x} cy={stop.y} size="md" />
      ) : (
        <Ring
          className={`transition-tone ${props.bright ? "stroke-ink" : "stroke-l3"}`}
          cx={x}
          cy={stop.y}
          size="md"
        />
      )}
      <Label
        className={textTone(props.bright || props.hero, "fill-text")}
        dy="0.35em"
        voice="label"
        x={x + LABEL_INSET}
        y={stop.y}
      >
        {stop.name}
      </Label>
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
  const x = triptych.xs[stop.column] ?? 0;
  // 2px ticks on whole pixels.
  const tickY = Math.round(stop.y) - 1;
  if (stop.column === 0) {
    return (
      <g className={`transition-opacity ${tone}`}>
        <rect
          className={textTone(bright, "fill-l3")}
          height={LABEL_TICK.h}
          width={LABEL_TICK.w}
          x={Math.round(x) - 2 - LABEL_TICK.w}
          y={tickY}
        />
        <Label
          anchor="end"
          className={textTone(bright, "fill-text")}
          dy="0.35em"
          voice="name"
          x={x - LABEL_INSET}
          y={stop.y}
        >
          {stop.name}
        </Label>
      </g>
    );
  }
  if (stop.column < triptych.xs.length - 1) {
    const every = triptych.every[stop.column] ?? 1;
    return (
      <g className={`transition-opacity ${tone}`}>
        <rect
          className={textTone(bright, "fill-l3")}
          height={LABEL_TICK.h}
          width={LABEL_TICK.w}
          x={Math.round(x) - LABEL_TICK.w / 2}
          y={tickY}
        />
        {((triptych.wide && stop.index % every === 0) || bright) && (
          <Label
            className={textTone(bright, "fill-muted")}
            dy="0.35em"
            halo
            voice="axis"
            x={x + 9}
            y={stop.y}
          >
            {stop.name}
          </Label>
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
        x={x}
      />
    </g>
  );
};

const hitBox = (stop: Stop, triptych: Triptych) => {
  const x = triptych.xs[stop.column] ?? 0;
  if (stop.column === 0) {
    return { width: x - 4, x: 0 };
  }
  if (stop.column < triptych.xs.length - 1) {
    return { width: 70, x: x - 6 };
  }
  return { width: 110, x: x - 8 };
};

const StopLayer = (props: { lit: Set<string> | null; triptych: Triptych }) => {
  const { lit, triptych } = props;
  return (
    <g>
      {triptych.stops.map((stop) => {
        const pitch = triptych.pitch[stop.column] ?? ROW_MAX;
        return (
          <g className="cursor-pointer" key={stop.key}>
            <HitRect
              data-stop={stop.key}
              height={pitch}
              y={stop.y - pitch / 2}
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
        );
      })}
    </g>
  );
};

const countOf = (paths: ThreadPath[], column: number) =>
  new Set(paths.map((p) => p.stops[column])).size;

/** A column heading and its count: every stop at rest, the lit stops under focus. */
const Heading = (props: {
  anchor: "end" | "middle" | "start";
  count: number;
  label: string;
  x: number;
  y: number;
}) => (
  <Label
    anchor={props.anchor}
    className="fade"
    muted
    voice="label"
    x={props.x}
    y={props.y}
  >
    <tspan>{props.label}</tspan>{" "}
    <tspan className="t-value">{props.count}</tspan>
  </Label>
);

const Headings = (props: {
  headings: string[];
  paths: ThreadPath[];
  triptych: Triptych;
  width: number;
}) => {
  const { wide, xs } = props.triptych;
  const last = xs.length - 1;
  // Each heading sits on its column's label edge; narrow plots hide middle
  // labels, so those headings centre on their ticks, alternating between two
  // rows so neighbours never collide. The last slides left when it would run
  // past the plot's edge.
  const place = (c: number, label: string) => {
    const x = xs[c] ?? 0;
    if (c === 0) {
      return { anchor: "end" as const, x: x - LABEL_INSET, y: HEADER_Y };
    }
    if (c < last) {
      return wide
        ? { anchor: "start" as const, x: x + 9, y: HEADER_Y }
        : {
            anchor: "middle" as const,
            x,
            y: c % 2 === 0 ? HEADER_Y2 : HEADER_Y,
          };
    }
    const w = Math.ceil(sansWidth(`${label} ${countOf(props.paths, c)}`, 12));
    return {
      anchor: "start" as const,
      x: Math.min(x + LABEL_INSET, props.width - w - 2),
      y: HEADER_Y,
    };
  };
  return (
    <g aria-live="polite">
      {xs.map((_, c) => {
        const label = props.headings[c] ?? "";
        return (
          <Heading
            count={countOf(props.paths, c)}
            key={label}
            label={label}
            {...place(c, label)}
          />
        );
      })}
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

/** A faint dotted rule down each middle column. */
const ColumnRules = (props: { floor: number; triptych: Triptych }) => (
  <g className="fade">
    {props.triptych.xs.slice(1, -1).map((x) => (
      <DottedLine
        key={x}
        tone="fill-l5"
        x0={x}
        x1={x}
        y0={TOP - 6}
        y1={props.floor + 2}
      />
    ))}
  </g>
);

const TriptychSvg = (props: {
  data: TriptychData;
  focus: Focus | null;
  headings: string[];
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
          litThreads.flatMap((t) =>
            t.path.stops.map((name, c) => stopKey(c, name))
          )
        );
  const label = `Mammal tree: ${data.columns
    .map(
      (names, c) => `${names.length} ${(props.headings[c] ?? "").toLowerCase()}`
    )
    .join(" in ")}`;

  return (
    <ChartSvg
      className="group/threads"
      data-focus={focus !== null}
      height={height}
      label={label}
      leave={() => {
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
      <HitRect height={height} width={width} />
      <Headings
        headings={props.headings}
        paths={focus === null ? data.paths : litThreads.map((t) => t.path)}
        triptych={triptych}
        width={width}
      />
      <ColumnRules floor={floor} triptych={triptych} />
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
      <FootNote height={height} text={note} width={width} />
    </ChartSvg>
  );
};

/**
 * B3 Mammal tree. Columns from genus to superorder, one thread per genus;
 * each stop after the first centres on the stops that feed it. Hover a
 * thread to trace its route or a label to pull its whole bundle; click to
 * pin, Escape or click empty space to release. Each column heading carries
 * its count: all stops at rest, the lit ones under focus.
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
          headings={
            props.headings ?? ["Genera", "Families", "Orders", "Superorders"]
          }
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
