import { arc as d3arc } from "d3-shape";

import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import { DotRing } from "../texture";
import {
  NOTE_LINE,
  dimClass,
  noteLines,
  ranks,
  sansWidth,
  stagger,
  wrapWords,
} from "../util";
import { tickDonutDemo } from "./tick-donut.data";
import type { ShareDatum } from "./tick-donut.data";
import { isDim, useHoverTip } from "./util-a";
import { inkWidth } from "./util-b";

interface TickDonutProps {
  data?: ShareDatum[];
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Big centre number and the caption under it. Defaults to the total over "total". */
  center?: { caption: string; value: string };
  /** Index of the source to draw in the hero colour. */
  highlight?: number;
  /** What the total counts, captioned under it, e.g. "a year". */
  unit?: string;
}

const TICKS = 100;
/** Rung tones for the sources after the hero, by rank: one step lighter each. */
const TICK_TONES = ["stroke-l3", "stroke-l4", "stroke-l5", "stroke-l6"];

/** Width of a label in the `t-label` role. */
const labelWidth = (s: string) => sansWidth(s, 12);

/** Split 100 ticks across the values by largest remainder, so they always sum to 100. */
const apportion = (values: number[]) => {
  const total = values.reduce((a, b) => a + b, 0);
  const exact = values.map((v) => (total > 0 ? (v / total) * TICKS : 0));
  const counts = exact.map((e) => Math.floor(e));
  let left = TICKS - counts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((e, i) => ({ i, rem: e - Math.floor(e) }))
    .toSorted((a, b) => b.rem - a.rem);
  for (const { i } of byRemainder) {
    if (left <= 0) {
      break;
    }
    counts[i] += 1;
    left -= 1;
  }
  return counts;
};

interface Dial {
  cx: number;
  cy: number;
  rIn: number;
  rOut: number;
  tickLen: number;
}

/** Point at `deg` degrees clockwise from twelve o'clock. */
const polar = (dial: Dial, deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: dial.cx + r * Math.cos(a), y: dial.cy + r * Math.sin(a) };
};
const angle = (t: number) => (t / TICKS) * 360;

interface Placement {
  anchor: "end" | "middle" | "start";
  dy: number;
}

/** Rim to label anchor, label leading, and the margin kept at the svg edge. */
const LABEL_GAP = 14;
const LABEL_LINE = 14;
const EDGE = 4;

/** Placement of a label block of `lines` lines at clock angle `mid`. */
const labelPlacement = (mid: number, lines: number): Placement => {
  const s = Math.sin((mid * Math.PI) / 180);
  const c = Math.cos((mid * Math.PI) / 180);
  const extra = (lines - 1) * LABEL_LINE;
  if (s > 0.25) {
    return { anchor: "start", dy: 3.5 - extra / 2 };
  }
  if (s < -0.25) {
    return { anchor: "end", dy: 3.5 - extra / 2 };
  }
  return { anchor: "middle", dy: c > 0 ? -4 - extra : 10 };
};

/** Horizontal room for a label at clock angle `mid` on a dial of radius `r` centred at `cx`. */
const labelRoom = (width: number, cx: number, mid: number, r: number) => {
  const s = Math.sin((mid * Math.PI) / 180);
  const x = cx + (r + LABEL_GAP) * s;
  if (s > 0.25) {
    return width - EDGE - x;
  }
  if (s < -0.25) {
    return x - EDGE;
  }
  return 2 * Math.min(x, width - x) - 2 * EDGE;
};

/** How far above or below the centre a label of `lines` lines reaches. */
const labelReach = (mid: number, lines: number, r: number) => {
  const rad = (mid * Math.PI) / 180;
  const extra = (lines - 1) * LABEL_LINE;
  if (Math.abs(Math.sin(rad)) > 0.25) {
    return Math.abs(Math.cos(rad)) * (r + LABEL_GAP) + extra / 2 + 12;
  }
  return r + LABEL_GAP + 14 + extra;
};

/** Largest dial radius at which a label `w` px wide fits at angle `mid`. */
const radiusFor = (width: number, mid: number, w: number) => {
  const s = Math.abs(Math.sin((mid * Math.PI) / 180));
  return s > 0.25 ? (width / 2 - EDGE - w) / s - LABEL_GAP : Infinity;
};

interface SourceLabel {
  mid: number;
  name: string;
  value: string;
}

/** A label's lines: "Name · value" if it fits, else the name (wrapped) over the value. */
const labelLines = (label: SourceLabel, room: number) => {
  const full = `${label.name} · ${label.value}`;
  if (labelWidth(full) <= room) {
    return [full];
  }
  return [...wrapWords(label.name, room, labelWidth), label.value];
};

/**
 * The dial radius that lets every label fit: shrink the dial a little to keep
 * labels on one line, then as far as needed (down to 56) with names stacked
 * over values. Labels that still don't fit word-wrap their names.
 */
const fitRadius = (width: number, r0: number, labels: SourceLabel[]) => {
  const oneLine = Math.min(
    ...labels.map((l) =>
      radiusFor(width, l.mid, labelWidth(`${l.name} · ${l.value}`))
    )
  );
  const r1 = Math.min(r0, Math.max(Math.max(56, r0 * 0.85), oneLine));
  const stacked = Math.min(
    ...labels.map((l) =>
      labelLines(l, labelRoom(width, width / 2, l.mid, r1)).length === 1
        ? Infinity
        : radiusFor(
            width,
            l.mid,
            Math.max(labelWidth(l.name), labelWidth(l.value))
          )
    )
  );
  return Math.max(56, Math.min(r1, stacked));
};

/** Left and right edge of the dial and its labels, with the dial centred at `cx`. */
const spread = (
  cx: number,
  rOut: number,
  labels: SourceLabel[],
  lines: string[][]
) => {
  // The every-tenth rungs reach 4px past the rim.
  let lo = cx - rOut - 4;
  let hi = cx + rOut + 4;
  for (const [i, l] of labels.entries()) {
    const x = cx + (rOut + LABEL_GAP) * Math.sin((l.mid * Math.PI) / 180);
    const w = Math.max(...(lines[i] ?? []).map((line) => inkWidth(line)));
    const { anchor } = labelPlacement(l.mid, lines[i]?.length ?? 1);
    lo = Math.min(
      lo,
      anchor === "start" ? x : x - (anchor === "end" ? w : w / 2)
    );
    hi = Math.max(
      hi,
      anchor === "end" ? x : x + (anchor === "start" ? w : w / 2)
    );
  }
  return [lo, hi] as const;
};

interface SourceProps {
  count: number;
  datum: ShareDatum;
  dial: Dial;
  dim: boolean;
  hero: boolean;
  /** The label, one entry per line. */
  lines: string[];
  onEnter: (x: number, y: number) => void;
  rank: number;
  start: number;
}

/** One source: its run of 2px rungs and its name outside the rim. */
const Source = ({
  count,
  datum,
  dial,
  dim,
  hero,
  lines,
  onEnter,
  rank,
  start,
}: SourceProps) => {
  const tone = hero
    ? "stroke-hero"
    : TICK_TONES[Math.max(0, Math.min(rank, TICK_TONES.length) - 1)];
  const a0 = angle(start);
  const a1 = angle(start + count);
  const mid = (a0 + a1) / 2;
  const text = polar(dial, mid, dial.rOut + LABEL_GAP);
  const place = labelPlacement(mid, lines.length);
  // Keep a stacked label's first line inside the top of the svg.
  const textY = Math.max(text.y, 11 - place.dy);
  const hit =
    d3arc<{ endAngle: number; startAngle: number }>()
      .innerRadius(dial.rIn - 14)
      .outerRadius(dial.rOut + 10)({
      endAngle: (a1 * Math.PI) / 180,
      startAngle: (a0 * Math.PI) / 180,
    }) ?? "";
  const ticks = Array.from({ length: count }, (_, k) => ({
    id: `tick-${start + k}`,
    t: start + k,
  }));
  const anchorPt = polar(dial, mid, dial.rOut);

  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(anchorPt.x, anchorPt.y - 8);
      }}
    >
      <path
        className="fill-transparent"
        d={hit}
        transform={`translate(${dial.cx},${dial.cy})`}
      />
      {ticks.map((tick) => (
        <g
          key={tick.id}
          transform={`rotate(${angle(tick.t)} ${dial.cx} ${dial.cy})`}
        >
          <line
            className={`grow-y ${tone}`}
            strokeWidth={2}
            style={stagger(tick.t, "dense")}
            x1={dial.cx}
            x2={dial.cx}
            y1={dial.cy - dial.rIn}
            // Every tenth percent reaches a little further: an engraved scale.
            y2={dial.cy - dial.rOut - (tick.t % 10 === 0 ? 4 : 0)}
          />
        </g>
      ))}
      <text
        className={`fade t-label ${hero ? "" : "fill-muted"}`}
        style={stagger(4 + rank)}
        textAnchor={place.anchor}
      >
        {lines.map((line, k) => (
          <tspan
            dy={k === 0 ? place.dy : LABEL_LINE}
            key={`${datum.label}-${line}`}
            x={text.x}
            y={k === 0 ? textY : undefined}
          >
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};

interface SvgProps {
  center: { caption: string; value: string };
  clear: () => void;
  data: ShareDatum[];
  format: (v: number) => string;
  height: number;
  highlight: number | undefined;
  hover: number | null;
  note: string | undefined;
  show: (i: number, x: number, y: number) => void;
  width: number;
}

const TickDonutSvg = ({
  center,
  clear,
  data,
  format,
  height,
  highlight,
  hover,
  note,
  show,
  width,
}: SvgProps) => {
  const values = data.map((d) => d.value);
  const counts = apportion(values);
  const order = ranks(values);
  const notes = noteLines(note, width - 24);
  const noteH = notes.length > 0 ? 18 + notes.length * NOTE_LINE : 0;
  const side = width < 440 ? 72 : 128;
  const starts = counts.map((_, i) =>
    counts.slice(0, i).reduce((a, b) => a + b, 0)
  );
  // One rung is one percent, so each source is labelled with its rung count.
  const labels: SourceLabel[] = data.map((d, i) => ({
    mid: angle(starts[i] + counts[i] / 2),
    name: d.label,
    value: `${counts[i]}%`,
  }));
  const rOut = fitRadius(
    width,
    Math.max(
      56,
      Math.min(148, (height - noteH) / 2 - 40, (width - side * 2) / 2)
    ),
    labels
  );
  const tickLen = Math.max(12, rOut * 0.17);
  // Centre the dial and its labels together: the labels are rarely the same
  // width on both sides.
  const linesAt = (cx: number) =>
    labels.map((l) => labelLines(l, labelRoom(width, cx, l.mid, rOut)));
  const recentre = (cx: number, ls: string[][]) => {
    const [lo, hi] = spread(cx, rOut, labels, ls);
    return cx + (width - lo - hi) / 2;
  };
  const cx0 = width / 2;
  const cx1 = recentre(cx0, linesAt(cx0));
  const lines = linesAt(cx1);
  const cx = recentre(cx1, lines);
  const reach = Math.max(
    rOut + 8,
    ...labels.map((l, i) => labelReach(l.mid, lines[i].length, rOut))
  );
  // A width-bound dial gives back the height it can't use.
  const plotH = Math.min(height - noteH, Math.ceil(2 * reach + 24));
  const dial: Dial = {
    cx,
    cy: plotH / 2 + 4,
    rIn: rOut - tickLen,
    rOut,
    tickLen,
  };
  const label = `Shares of the whole: ${data.map((d) => `${d.label} ${format(d.value)}`).join(", ")}`;

  return (
    <svg
      aria-label={label}
      height={plotH + noteH}
      onPointerLeave={clear}
      width={width}
    >
      <title>{label}</title>
      <DotRing
        className="fade"
        tone="fill-l4"
        cx={dial.cx}
        cy={dial.cy}
        r={dial.rIn - 7}
      />
      {data.map((d, i) => (
        <Source
          count={counts[i]}
          datum={d}
          dial={dial}
          dim={isDim(hover, i)}
          hero={(highlight ?? order.indexOf(0)) === i}
          key={d.label}
          lines={lines[i]}
          onEnter={(x, y) => {
            show(i, x, y);
          }}
          rank={order[i]}
          start={starts[i]}
        />
      ))}
      <text
        className="fade t-value-lg"
        textAnchor="middle"
        x={dial.cx}
        y={dial.cy + 6}
      >
        {center.value}
      </text>
      {noteLines(dial.rIn < 56 ? "" : center.caption, dial.rIn * 1.7).map(
        (line, k) => (
          <text
            className="fade t-note"
            key={line}
            textAnchor="middle"
            x={dial.cx}
            y={dial.cy + 24 + k * NOTE_LINE}
          >
            {line}
          </text>
        )
      )}
      <PlotNote
        text={note}
        width={width - 24}
        x={width / 2}
        y={plotH + noteH - 6}
      />
    </svg>
  );
};

/**
 * F4 Share ring. A dial of 100 radial 2px rungs, one per percent, read
 * clockwise from twelve o'clock, every tenth a little longer, inside an
 * evenly dotted ring. The largest source is in ink, the rest one grey each;
 * the total sits in the middle, every source named outside the rim.
 */
export const TickDonut = (props: TickDonutProps) => {
  const data = props.data ?? tickDonutDemo;
  const format = props.format ?? String;
  const { clear, hover, show, tip } = useHoverTip();
  const total = data.reduce((a, d) => a + d.value, 0);
  const pct = (v: number) =>
    `${total > 0 ? Math.round((v / total) * 100) : 0}%`;

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)} ·{" "}
            {pct(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => (
        <TickDonutSvg
          center={
            props.center ?? {
              caption: props.unit ?? "total",
              value: format(total),
            }
          }
          clear={clear}
          data={data}
          format={format}
          height={props.height ?? 420}
          highlight={props.highlight}
          hover={hover}
          note={props.note}
          show={show}
          width={width}
        />
      )}
    </Plot>
  );
};
