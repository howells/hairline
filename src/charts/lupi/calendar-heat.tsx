import { utcFormat } from "d3-time-format";
import { useState } from "react";
import type { PointerEvent } from "react";

import { monthTickLabels } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { CrossHatch, DotScreen } from "../texture";
import {
  HALFTONE_R,
  TEXTURE_PITCH,
  paint,
  useTextureIds,
} from "../texture-ids";
import { dimClass, noteSpace, stagger } from "../util";
import { calendarHeatDemo } from "./calendar-heat.data";
import type { DayDatum } from "./calendar-heat.data";

interface CalendarHeatProps {
  data?: DayDatum[];
  /** Plural noun for the count, e.g. "deploys". */
  unit?: string;
  /** Ignored: the busiest-day callout text is no longer drawn. */
  annotation?: string;
  note?: string;
  /** Upper bound on the overall height; the cells shrink to fit. */
  height?: number;
}

interface Day extends DayDatum {
  t: number;
  dow: number;
  /** Months since the first day's month. */
  month: number;
  /** Which stacked band of months the day sits in. */
  band: number;
  /** Week column inside its band. */
  col: number;
}

interface Grid {
  x0: number;
  top: number;
  /** Cell pitch in whole px: the cell plus one gutter. */
  pitch: number;
  /** Cell side in whole px (odd, so the screen centres on whole pixels). */
  cell: number;
  /** Vertical distance from one band to the next. */
  bandH: number;
  narrow: boolean;
  max: number;
  /**
   * Where a cell starts inside its own pattern space, so every cell's
   * halftone sits centred with an even margin.
   */
  inset: number;
}

const DAY = 86_400_000;
/** Paper between neighbouring cells; the month contour runs down its middle pixel. */
const GUTTER = 3;
/** Months per stacked band: half-years on wide screens, thirds on narrow. */
const WIDE_MONTHS = 6;
const NARROW_MONTHS = 4;
/** Halftone dot radius per step of the day's count, quietest first: the shared ladder. */
const RADII = HALFTONE_R;
/** Smallest gap between a cell's edge and its outermost dot centre. */
const MARGIN = 2.5;
/** Where DotScreen puts its dot inside each tile. */
const SCREEN_CENTRE = Math.floor(TEXTURE_PITCH.screen / 2) + 0.5;
const dayLabel = utcFormat("%a %-d %b %Y");

const toDays = (data: DayDatum[], perBand: number): Day[] => {
  const first = new Date(
    Date.parse(`${data[0]?.date ?? "1970-01-01"}T00:00:00Z`)
  );
  const lead = (first.getUTCDay() + 6) % 7;
  const placed = data.map((d) => {
    const t = Date.parse(`${d.date}T00:00:00Z`);
    const at = new Date(t);
    const month =
      (at.getUTCFullYear() - first.getUTCFullYear()) * 12 +
      at.getUTCMonth() -
      first.getUTCMonth();
    return {
      ...d,
      band: Math.floor(month / perBand),
      col: Math.floor((Math.round((t - first.getTime()) / DAY) + lead) / 7),
      dow: (at.getUTCDay() + 6) % 7,
      month,
      t,
    };
  });
  // Each band starts at its own first week, so a week split across two
  // bands shows its first days in one and the rest in the next.
  const start = new Map<number, number>();
  for (const d of placed) {
    start.set(d.band, Math.min(start.get(d.band) ?? d.col, d.col));
  }
  return placed.map((d) => ({ ...d, col: d.col - (start.get(d.band) ?? 0) }));
};

const keyOf = (band: number, col: number, dow: number) =>
  `${band}:${col}:${dow}`;
const cellX = (g: Grid, d: Day) => g.x0 + g.pitch * d.col;
const cellY = (g: Grid, d: Day) => g.top + d.band * g.bandH + g.pitch * d.dow;
/** The gutter's middle pixel left of column `col` / above row `row`. */
const lineX = (g: Grid, col: number) => g.x0 + g.pitch * col - 2;
const lineY = (g: Grid, band: number, row: number) =>
  g.top + band * g.bandH + g.pitch * row - 2;

/** The halftone step for a day: -1 for none, RADII.length for the busiest. */
const stepOf = (g: Grid, v: number) => {
  if (v <= 0) {
    return -1;
  }
  if (v >= g.max) {
    return RADII.length;
  }
  return Math.min(RADII.length - 1, Math.floor((v / g.max) * RADII.length));
};

const screenId = (weekend: boolean, step: number) =>
  `${weekend ? "end" : "week"}-${step}`;

/** The engraved screens: one per step, quieter on weekends; the peak crosshatched. */
const Screens = ({ ids }: { ids: (name: string) => string }) => (
  <defs>
    {[false, true].flatMap((weekend) =>
      RADII.map((r, k) => (
        <DotScreen
          ground="fill-paper"
          id={ids(screenId(weekend, k))}
          key={screenId(weekend, k)}
          r={r}
          tone={weekend ? "fill-l4" : "fill-l3"}
        />
      ))
    )}
    <CrossHatch ground="fill-paper" id={ids("peak")} tone="fill-hero" />
  </defs>
);

/** Fill and rule for one day's cell; a day with none is left as paper. */
const lookOf = (g: Grid, d: Day, ids: (name: string) => string) => {
  const step = stepOf(g, d.value);
  if (step < 0) {
    return null;
  }
  if (step >= RADII.length) {
    return { fill: paint(ids("peak")), rule: "stroke-ink" };
  }
  return { fill: paint(ids(screenId(d.dow >= 5, step))), rule: "" };
};

const Cell = (props: { d: Day; g: Grid; ids: (name: string) => string }) => {
  const { d, g } = props;
  const look = lookOf(g, d, props.ids);
  if (look === null) {
    return null;
  }
  return (
    <g
      transform={`translate(${cellX(g, d) - g.inset} ${cellY(g, d) - g.inset})`}
    >
      <rect
        className={`pop shape-crisp ${look.rule}`}
        fill={look.fill}
        height={g.cell - 1}
        strokeWidth={1}
        style={stagger(d.col + d.band * 4 + d.dow * 0.3, "fine")}
        width={g.cell - 1}
        x={g.inset + 0.5}
        y={g.inset + 0.5}
      />
    </g>
  );
};

/** One 1px pixel run along a gutter, as a rectangle subpath. */
const run = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y}h${w}v${h}h${-w}z`;

/**
 * The calendar contour: every cell edge whose neighbour belongs to another
 * month (or to nothing) becomes a 1px run down the gutter's middle pixel.
 */
const contours = (days: Day[], g: Grid) => {
  const monthAt = new Map(days.map((d) => [keyOf(d.band, d.col, d.dow), d]));
  const seen = new Set<string>();
  const paths = new Map<number, string[]>();
  const edge = (d: Day, name: string, path: string) => {
    if (!seen.has(name)) {
      seen.add(name);
      paths.set(d.month, [...(paths.get(d.month) ?? []), path]);
    }
  };
  for (const d of days) {
    const differs = (col: number, dow: number) =>
      monthAt.get(keyOf(d.band, col, dow))?.month !== d.month;
    const x = (c: number) => lineX(g, c);
    const y = (r: number) => lineY(g, d.band, r);
    for (const c of [d.col, d.col + 1]) {
      if (differs(c === d.col ? c - 1 : c, d.dow)) {
        edge(
          d,
          `v${d.band}:${c}:${d.dow}`,
          run(x(c), y(d.dow), 1, g.pitch + 1)
        );
      }
    }
    for (const r of [d.dow, d.dow + 1]) {
      if (differs(d.col, r === d.dow ? r - 1 : r)) {
        edge(
          d,
          `h${d.band}:${d.col}:${r}`,
          run(x(d.col), y(r), g.pitch + 1, 1)
        );
      }
    }
  }
  return [...paths.entries()].map(([month, runs]) => ({
    d: runs.join(""),
    month,
  }));
};

const Frame = ({ days, g }: { days: Day[]; g: Grid }) => {
  // Each month is named over the top-left corner of its contour.
  const mondays = days.filter((d) => d.dow === 0);
  const heads = mondays.filter(
    (d, i) => mondays.findIndex((e) => e.month === d.month) === i
  );
  const months = monthTickLabels(heads.map((d) => new Date(d.t)));
  const bands = Math.max(...days.map((d) => d.band)) + 1;
  return (
    <g>
      {heads.map((d, k) => (
        <text
          className="fade t-axis"
          key={d.date}
          style={stagger(d.col + d.band * 4, "fine")}
          // A band's first month starts at the band's left edge: nothing
          // precedes it there, and its name gets the room the year needs.
          x={lineX(
            g,
            heads.findIndex((e) => e.band === d.band) === k ? 0 : d.col
          )}
          y={lineY(g, d.band, 0) - 9}
        >
          {months[k]}
        </text>
      ))}
      {Array.from({ length: bands }, (_, band) => band).flatMap((band) =>
        ["Mon", "Wed", "Fri", "Sun"].map((name, k) => (
          <text
            className="t-axis"
            dy="0.34em"
            key={`${band}-${name}`}
            textAnchor="end"
            x={g.x0 - (g.narrow ? 8 : 14)}
            y={lineY(g, band, k * 2) + 2 + g.cell / 2}
          >
            {name}
          </text>
        ))
      )}
    </g>
  );
};

/** The day under the pointer, or null between cells and outside the grid. */
const dayAt = (
  e: PointerEvent<SVGSVGElement>,
  g: Grid,
  index: Map<string, number>
): number | null => {
  const box = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - box.top - g.top + 2;
  const band = Math.floor(y / g.bandH);
  const col = Math.floor((e.clientX - box.left - g.x0 + 2) / g.pitch);
  const row = Math.floor((y - band * g.bandH) / g.pitch);
  return index.get(keyOf(band, col, row)) ?? null;
};

const describe = (days: Day[], unit: string, peak: Day | undefined) =>
  `Daily ${unit} across ${days.length} days${peak === undefined ? "" : `; busiest ${dayLabel(new Date(peak.t))} with ${peak.value}`}`;

/** Cell pitch, band layout and pattern inset for a given width. */
const layout = (
  width: number,
  days: Day[],
  max: number,
  extra: number,
  height: number | undefined
): Grid & { svgH: number } => {
  const narrow = width < 640;
  // Room for the weekday names, "Mon" to "Sun", beside the grid.
  const left = narrow ? 36 : 46;
  const top = 26;
  const gap = 42;
  const bands = Math.max(...days.map((d) => d.band)) + 1;
  const cols = Math.max(...days.map((d) => d.col)) + 1;
  const avail = width - left - 8;
  const target = height ?? (narrow ? Infinity : 560);
  const fit = (target - top - extra - (bands - 1) * gap) / (7 * bands);
  // An even pitch leaves an odd cell, so the screen centres on whole pixels.
  const pitch = 2 * Math.floor(Math.min(44, avail / cols, fit) / 2);
  const cell = pitch - GUTTER;
  const dots = Math.floor((cell - 2 * MARGIN) / TEXTURE_PITCH.screen) + 1;
  const margin = (cell - TEXTURE_PITCH.screen * (dots - 1)) / 2;
  return {
    bandH: pitch * 7 + gap,
    cell,
    inset: SCREEN_CENTRE - margin,
    max,
    narrow,
    pitch,
    svgH: top + bands * (pitch * 7 + gap) - gap + extra,
    top,
    x0: left + Math.max(0, Math.floor((avail - pitch * cols) / 2)),
  };
};

/**
 * L17 Daily deploys. A year as an engraved almanac: week columns × weekday
 * rows in stacked bands of months, each day a square halftone whose dot
 * steps with its count (quieter on weekends, an empty box for none), each
 * month ringed by a stepped 1px contour, the busiest day crosshatched in ink.
 */
export const CalendarHeat = (props: CalendarHeatProps) => {
  const data = props.data ?? calendarHeatDemo;
  const unit = props.unit ?? "events";
  const [hover, setHover] = useState<number | null>(null);
  const ids = useTextureIds("almanac");
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <Plot>
      {(width) => {
        const days = toDays(data, width < 640 ? NARROW_MONTHS : WIDE_MONTHS);
        const peak = days.find((d) => d.value === max);
        const extra = 6 + noteSpace(props.note, width - 16, 24);
        const g = layout(width, days, max, extra, props.height);
        const index = new Map(
          days.map((d, i) => [keyOf(d.band, d.col, d.dow), i])
        );
        const hovered = hover === null ? undefined : days[hover];
        return (
          <div className="relative">
            <svg
              aria-label={describe(days, unit, peak)}
              height={g.svgH}
              onPointerLeave={() => {
                setHover(null);
              }}
              onPointerMove={(e) => {
                setHover(dayAt(e, g, index));
              }}
              width={width}
            >
              <title>Daily {unit}</title>
              <Screens ids={ids} />
              <Frame days={days} g={g} />
              <g className={dimClass(hover !== null)}>
                {days.map((d) => (
                  <Cell d={d} g={g} ids={ids} key={d.date} />
                ))}
              </g>
              {contours(days, g).map((c) => (
                <path
                  className="fade fill-l2 shape-crisp"
                  d={c.d}
                  key={c.month}
                  style={stagger(c.month, "mark")}
                />
              ))}
              {hovered !== undefined && (
                <rect
                  className="stroke-ink shape-crisp pointer-events-none fill-none"
                  height={g.cell - 1}
                  strokeWidth={1}
                  width={g.cell - 1}
                  x={cellX(g, hovered) + 0.5}
                  y={cellY(g, hovered) + 0.5}
                />
              )}
              <PlotNote
                text={props.note}
                width={width - 16}
                x={width / 2}
                y={g.svgH - 6}
              />
            </svg>
            {hovered !== undefined && (
              <Tooltip
                x={cellX(g, hovered) + g.cell / 2}
                y={cellY(g, hovered) - 4}
              >
                <b>{dayLabel(new Date(hovered.t))}</b> · {hovered.value} {unit}
              </Tooltip>
            )}
          </div>
        );
      }}
    </Plot>
  );
};
