import { scaleSqrt } from "d3-scale";
import { useState } from "react";

import { fmtKInt, fmtMonth, monthTickLabels } from "../../lib/format";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { PixelLine } from "../texture";
import { dimClass, noteSpace, sansWidth, stagger } from "../util";
import {
  LAUNCH_MONTHS,
  launchFanDemo,
  launchMonthDate,
} from "./launch-fan.data";
import type { LaunchFanDatum } from "./launch-fan.data";
import { arcPath, clock } from "./util-a";
import { argMax } from "./util-b";

/** The time unit of a fan: launches, readings and rings count these. */
export type FanUnit = "month" | "week";

interface LaunchFanProps {
  data?: LaunchFanDatum[];
  /** The current week: where every spoke ends. Same as `periods`. */
  weeks?: number;
  /**
   * The current period, in `unit`s: where every spoke ends. Defaults to
   * `weeks`, else 20 weeks or 24 months.
   */
  periods?: number;
  /**
   * What `launch`, `weekly` and `periods` count. "month" (the default)
   * spaces rings every 3, 6 or 12 months by span; "week" every five weeks.
   */
  unit?: FanUnit;
  /**
   * The calendar month of a period, for month fans: rings then read in the
   * broadsheet style ("Jun 2025 · Dec · Jun 2026") and tooltips name the
   * month. Without it periods read "W14" or "M14".
   */
  periodDate?: (period: number) => Date;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Name of the spoke drawn in ink. Defaults to the largest. */
  highlight?: string;
}

interface FanTip {
  i: number;
  /** Periods since launch for a small dot; undefined for the launch dot. */
  week?: number;
  x: number;
  y: number;
}

interface FanLayout {
  a0: number;
  a1: number;
  angle: (i: number) => number;
  /** Lowest point of the fan's marks, just above its centre. */
  bottom: number;
  cx: number;
  cy: number;
  ringR: (w: number) => number;
  sizeR: (v: number) => number;
  /** Half-length of a weekly rung, by that week's reading. */
  rungR: (v: number) => number;
}

/** How far a spoke's name runs out from the last ring: its gap, then its text. */
const nameRun = (d: LaunchFanDatum) => 10 + sansWidth(d.name, 11);

const fanLayout = (
  width: number,
  height: number,
  data: LaunchFanDatum[],
  weeks: number,
  /** Widest ring label: the fan's centre keeps this much room on its left. */
  ringLabelW: number,
  /** Room kept below the fan for a footnote. */
  noteH: number
): FanLayout => {
  const a0 = 4;
  const a1 = 82;
  const angleOf = (i: number) =>
    data.length === 1
      ? (a0 + a1) / 2
      : a0 + ((a1 - a0) * i) / (data.length - 1);
  // Room above the last ring for the near-upright spoke names.
  const top = Math.max(
    58,
    ...data.map(
      (d, i) =>
        16 + sansWidth(d.name, 12) * Math.cos((angleOf(i) * Math.PI) / 180)
    )
  );
  // Radius of the last ring: fit the quarter fan plus its outer labels. The
  // fan spans `top` of labels above the last ring down to 0.04 R above centre.
  // The ring labels reach left of the centre; each name runs out along its
  // spoke, so the width allows a radius per name and the tightest one binds.
  const leftEdge = ringLabelW + 2;
  const reachOf = (R: number, i: number) => {
    const rad = (angleOf(i) * Math.PI) / 180;
    return (R + nameRun(data[i])) * Math.sin(rad) + 7 * Math.cos(rad);
  };
  const fitR = Math.min(
    ...data.map((d, i) => {
      const rad = (angleOf(i) * Math.PI) / 180;
      return (
        (width - leftEdge - 7 * Math.cos(rad)) / Math.sin(rad) - nameRun(d)
      );
    })
  );
  const R = Math.max(150, Math.min((height - top - 6 - noteH) / 0.96, fitR));
  const right = Math.max(...data.map((_, i) => reachOf(R, i)));
  const r0 = R * 0.2;
  const sizeR = scaleSqrt()
    .domain([0, Math.max(...data.map((d) => d.size))])
    .range([0, Math.min(11, R / 30)]);
  const weeklyMax = Math.max(1, ...data.flatMap((d) => d.weekly ?? [0]));
  return {
    a0,
    a1,
    angle: angleOf,
    bottom: R * 0.96 + top,
    cx: leftEdge + Math.max(0, (width - leftEdge - right) / 2),
    cy: R + top,
    ringR: (w) => r0 + ((R - r0) * w) / weeks,
    rungR: (v) => 1.5 + 3.5 * Math.sqrt(v / weeklyMax),
    sizeR: (v) => sizeR(v),
  };
};

/** Periods between rings: five weeks, or 3, 6 or 12 months by span. */
const ringStep = (unit: FanUnit, periods: number) => {
  if (unit === "week") {
    return 5;
  }
  if (periods <= 18) {
    return 3;
  }
  return periods <= 48 ? 6 : 12;
};

const ringsOf = (unit: FanUnit, periods: number) => {
  const step = ringStep(unit, periods);
  return Array.from(
    { length: Math.floor(periods / step) },
    (_, k) => (k + 1) * step
  );
};

interface RingsProps {
  labels: string[];
  layout: FanLayout;
  rings: number[];
}

const Rings = (props: RingsProps) => {
  const { a0, a1, cx, cy, ringR } = props.layout;
  const { rings } = props;
  return (
    <g>
      {rings.map((w, k) => {
        const r = ringR(w);
        const [lx, ly] = clock(cx, cy, r, a0 - 4);
        return (
          <g className="fade" key={`ring-${w}`} style={{ "--i": k }}>
            <path
              className="grid-line shape-smooth"
              d={arcPath(cx, cy, r, a0 - 3, a1 + 2)}
              fill="none"
            />
            <text
              className="t-note"
              dy="0.34em"
              textAnchor="end"
              x={lx - 2}
              y={ly}
            >
              {props.labels[k]}
            </text>
          </g>
        );
      })}
    </g>
  );
};

interface SpokeProps {
  datum: LaunchFanDatum;
  dim: boolean;
  hero: boolean;
  i: number;
  layout: FanLayout;
  onTip: (tip: FanTip) => void;
  weeks: number;
}

const Spoke = ({ datum, dim, hero, i, layout, onTip, weeks }: SpokeProps) => {
  const { angle, cx, cy, ringR, rungR, sizeR } = layout;
  const a = angle(i);
  const start = Math.max(0, datum.launch);
  const [bx, by] = clock(cx, cy, ringR(start), a);
  const [ex, ey] = clock(cx, cy, ringR(weeks), a);
  const [tx, ty] = clock(cx, cy, ringR(weeks) + 10, a);
  const since = Array.from(
    { length: Math.max(0, weeks - start) },
    (_, w) => w + 1
  );
  const fallback = Math.max(...(datum.weekly ?? [1])) * 0.3;
  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onTip({ i, x: bx, y: by - sizeR(datum.size) - 4 });
      }}
    >
      <line
        stroke="transparent"
        strokeWidth={14}
        x1={bx}
        x2={ex}
        y1={by}
        y2={ey}
      />
      <line
        className="draw stroke-rule"
        pathLength={1}
        strokeWidth={1}
        style={stagger(i, "mark")}
        x1={bx}
        x2={ex}
        y1={by}
        y2={ey}
      />
      {since.map((w) => {
        const [x, y] = clock(cx, cy, ringR(start + w), a);
        // A rung across the spoke: perpendicular, as long as the reading.
        const half = rungR(datum.weekly?.[w] ?? fallback);
        const ux = Math.cos((a * Math.PI) / 180);
        const uy = Math.sin((a * Math.PI) / 180);
        return (
          <g
            className="fade"
            key={`${datum.name}-w${w}`}
            onPointerEnter={() => {
              onTip({ i, week: w, x, y: y - 6 });
            }}
            style={stagger(i * 3 + w, "dense")}
          >
            <circle cx={x} cy={y} fill="transparent" r={5} />
            <PixelLine
              tone="fill-l3"
              x0={x - ux * half}
              x1={x + ux * half}
              y0={y - uy * half}
              y1={y + uy * half}
            />
          </g>
        );
      })}
      <circle
        className={`pop ${hero ? "fill-hero stroke-hero" : "fill-paper stroke-l3"}`}
        cx={bx}
        cy={by}
        r={sizeR(datum.size)}
        strokeWidth={1.5}
        style={stagger(i, "mark")}
      />
      <text
        className={`fade t-name ${hero ? "" : "fill-muted"}`}
        dy="0.34em"
        style={stagger(i, "mark")}
        transform={`translate(${tx},${ty}) rotate(${a - 90})`}
      >
        {datum.name}
      </text>
    </g>
  );
};

const UNIT_WORD = { month: "month", week: "week" } as const;
const UNIT_TAG = { month: "M", week: "W" } as const;

/**
 * L1 Integration launches. One spoke per entity, fanned through a quarter turn and
 * ordered by launch. Distance along the spoke is time: the big dot sits at the
 * launch week or month (area = size today), and a 1px rung crosses the spoke
 * at every one since, as long as that period's reading.
 */
export const LaunchFan = (props: LaunchFanProps) => {
  const data = (props.data ?? launchFanDemo).toSorted(
    (a, b) => a.launch - b.launch
  );
  const demo = props.data === undefined;
  const unit = props.unit ?? "month";
  const weeks =
    props.periods ?? props.weeks ?? (unit === "week" ? 20 : LAUNCH_MONTHS);
  const height = props.height ?? 460;
  const format = props.format ?? ((v: number) => `${fmtKInt(v)} connected`);
  const word = UNIT_WORD[unit];
  const periodDate = props.periodDate ?? (demo ? launchMonthDate : undefined);
  const name = (n: number) =>
    periodDate === undefined
      ? `${UNIT_TAG[unit]}${n}`
      : fmtMonth(periodDate(n));
  const rings = ringsOf(unit, weeks);
  const ringLabels =
    periodDate === undefined
      ? rings.map(name)
      : monthTickLabels(rings.map(periodDate));
  const ringLabelW = Math.max(0, ...ringLabels.map((l) => sansWidth(l, 11)));
  const [tip, setTip] = useState<FanTip | null>(null);
  const hero =
    props.highlight ?? data.at(argMax(data.map((d) => d.size)))?.name;

  const tipText = (t: FanTip) => {
    const d = data[t.i];
    if (t.week === undefined) {
      return `${format(d.size)} today`;
    }
    return `${name(d.launch + t.week)} · ${format(d.weekly?.[t.week] ?? 0)}`;
  };

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].name}</b> · launched {name(data[tip.i].launch)} ·{" "}
            {tipText(tip)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const noteH = noteSpace(props.note, width - 16, 30);
        const layout = fanLayout(width, height, data, weeks, ringLabelW, noteH);
        // On narrow screens the fan is width-bound: drop the unused height.
        const svgH = Math.min(height, Math.round(layout.bottom + 6 + noteH));
        return (
          <svg
            aria-label={`Launch fan: ${data.map((d) => `${d.name} launched ${name(d.launch)}, ${format(d.size)}`).join("; ")}`}
            height={svgH}
            onPointerLeave={() => {
              setTip(null);
            }}
            width={width}
          >
            <title>
              Launch {word} and size of each integration, one spoke each
            </title>
            <Rings labels={ringLabels} layout={layout} rings={rings} />
            {data.map((d, i) => (
              <Spoke
                datum={d}
                dim={tip !== null && tip.i !== i}
                hero={hero === d.name}
                i={i}
                key={d.name}
                layout={layout}
                onTip={setTip}
                weeks={weeks}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 16}
              x={width / 2}
              y={svgH - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
