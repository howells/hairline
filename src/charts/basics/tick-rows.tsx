import { crisp } from "../axes";
import { Plot, Tooltip } from "../core";
import { PlotNote } from "../plot-note";
import {
  NOTE_LINE,
  dimClass,
  hasText,
  noteLines,
  sansWidth,
  stagger,
  wrapWords,
} from "../util";
import { tickRowsDemo } from "./tick-rows.data";
import type { CountDatum } from "./tick-rows.data";
import { isDim, useHoverTip } from "./util-a";
import { maxIndex } from "./util-b";

interface TickRowsProps {
  data?: CountDatum[];
  /** Units per tick. */
  unit?: number;
  height?: number;
  format?: (v: number) => string;
  note?: string;
  /** Index of the row drawn in the hero colour. */
  highlight?: number;
}

interface RowFrame {
  gap: number;
  labelW: number;
  pitch: number;
  pitchY: number;
  tickH: number;
  track: number;
  x0: number;
}

/** Leading of a row label that wraps. */
const LABEL_LINE = 14;

/** Width of a row label in the `t-label` role. */
const labelWidth = (s: string) => sansWidth(s, 12);

/**
 * Room for the row labels: the default column, widened to fit the longest
 * label up to about a third of the width; labels longer than that wrap.
 */
const labelColumn = (labels: string[], width: number) => {
  const base = width < 440 ? 70 : 96;
  const widest = Math.max(0, ...labels.map((l) => labelWidth(l)));
  const room = Math.min(
    Math.max(base, Math.ceil(widest)),
    Math.max(base, Math.round(width * 0.34))
  );
  const lines = labels.map((l) =>
    labelWidth(l) <= room ? [l] : wrapWords(l, room, labelWidth)
  );
  // A single word longer than the room still gets all the room it needs.
  const labelW = Math.max(
    room,
    ...lines.flat().map((l) => Math.ceil(labelWidth(l)))
  );
  return { labelW, lines };
};

interface RowProps {
  datum: CountDatum;
  dim: boolean;
  format: (v: number) => string;
  frame: RowFrame;
  hero: boolean;
  index: number;
  /** The row label, one entry per line. */
  lines: string[];
  onEnter: (x: number, y: number) => void;
  unit: number;
}

/** Rungs per bundle: the row counts off in fives, like a tally. */
const BUNDLE = 5;

/** Slots taken by `n` rungs: one per rung, plus one empty slot between bundles. */
const slotsFor = (n: number) => n + Math.floor(Math.max(0, n - 1) / BUNDLE);

/** Left edge of rung `k`, a slot further on after every complete bundle. */
const rungX = (frame: RowFrame, k: number) =>
  frame.x0 + (k + Math.floor(k / BUNDLE)) * frame.pitch;

/** One queue of 2px rungs standing on its track, the count at the end. */
const Row = ({
  datum,
  dim,
  format,
  frame,
  hero,
  index,
  lines,
  onEnter,
  unit,
}: RowProps) => {
  const n = Math.round(datum.value / unit);
  const base = Math.round(12 + (index + 0.5) * frame.pitchY + frame.tickH / 2);
  const mid = base - frame.tickH / 2;
  const end = rungX(frame, Math.max(0, n - 1)) + 2;
  const ticks = Array.from({ length: n }, (_, k) => ({
    id: `${datum.label}-tick-${k}`,
    k,
  }));

  return (
    <g
      className={dimClass(dim)}
      onPointerEnter={() => {
        onEnter(end, base - frame.tickH - 8);
      }}
    >
      <rect
        className="fill-transparent"
        height={frame.pitchY}
        width={frame.labelW + frame.gap + frame.track + 40}
        x={frame.x0 - frame.labelW - frame.gap}
        y={mid - frame.pitchY / 2}
      />
      <line
        className="rule"
        x1={frame.x0 - 3}
        x2={frame.x0 + frame.track}
        y1={crisp(base)}
        y2={crisp(base)}
      />
      {ticks.map((tick) => (
        <rect
          className={`grow-y ${hero ? "fill-hero" : "fill-l3"}`}
          height={frame.tickH}
          key={tick.id}
          style={stagger(index * 3 + tick.k, "fine")}
          width={2}
          x={rungX(frame, tick.k)}
          y={base - frame.tickH}
        />
      ))}
      <text
        className="t-label fill-muted"
        textAnchor="end"
        y={mid - ((lines.length - 1) * LABEL_LINE) / 2}
      >
        {lines.map((line, k) => (
          <tspan
            dy={k === 0 ? "0.35em" : LABEL_LINE}
            key={`${datum.label}-${line}`}
            x={frame.x0 - frame.gap}
          >
            {line}
          </tspan>
        ))}
      </text>
      <text
        className={`fade t-value ${hero ? "fill-hero" : ""}`}
        dy="0.35em"
        style={stagger(index + 2)}
        x={end + 12}
        y={mid}
      >
        {format(datum.value)}
      </text>
    </g>
  );
};

/**
 * F5 Count rows. Each row is a queue of countable 2px rungs at one pitch, one
 * per unit, bundled in fives with one empty slot between bundles, like a
 * tally, on a faint track with the count at the end. The leading row is ink.
 */
export const TickRows = (props: TickRowsProps) => {
  const data = props.data ?? tickRowsDemo;
  const unit = props.unit ?? 1;
  const format = props.format ?? String;
  const hasNote = hasText(props.note);
  const baseHeight = props.height ?? data.length * 66 + (hasNote ? 56 : 24);
  const { clear, hover, show, tip } = useHoverTip();
  const label = data.map((d) => `${d.label} ${format(d.value)}`).join(", ");

  return (
    <Plot
      overlay={
        tip === null ? null : (
          <Tooltip x={tip.x} y={tip.y}>
            <b>{data[tip.i].label}</b> · {format(data[tip.i].value)}
          </Tooltip>
        )
      }
    >
      {(width) => {
        const { labelW, lines } = labelColumn(
          data.map((d) => d.label),
          width
        );
        const gap = width < 440 ? 12 : 22;
        const maxTicks = Math.max(
          ...data.map((d) => Math.round(d.value / unit))
        );
        const slots = slotsFor(maxTicks);
        const track = Math.min(width - labelW - gap - 56, slots * 9);
        const notes = noteLines(props.note, width - 24);
        const height = baseHeight + Math.max(0, notes.length - 1) * NOTE_LINE;
        const pitchY = (baseHeight - (hasNote ? 56 : 24)) / data.length;
        const frame: RowFrame = {
          gap,
          labelW,
          pitch: Math.max(4, Math.floor(track / slots)),
          pitchY,
          tickH: Math.round(Math.min(20, pitchY * 0.3)),
          track,
          x0: Math.round(
            (width - (labelW + gap + track + 40)) / 2 + labelW + gap
          ),
        };
        const hero = props.highlight ?? maxIndex(data.map((d) => d.value));
        return (
          <svg
            aria-label={label}
            height={height}
            onPointerLeave={clear}
            width={width}
          >
            <title>{label}</title>
            {data.map((d, i) => (
              <Row
                datum={d}
                dim={isDim(hover, i)}
                format={format}
                frame={frame}
                hero={hero === i}
                index={i}
                key={d.label}
                lines={lines[i]}
                onEnter={(x, y) => {
                  show(i, x, y);
                }}
                unit={unit}
              />
            ))}
            <PlotNote
              text={props.note}
              width={width - 24}
              x={width / 2}
              y={height - 6}
            />
          </svg>
        );
      }}
    </Plot>
  );
};
