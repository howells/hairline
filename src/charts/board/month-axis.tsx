// The boards' month axis: the labels under a time plot.

import { TICK } from "../roles";
import { TICK_CHAR } from "./thin-ticks";

/** Centred, unless half the label would run past an edge of the svg. */
const edgeAnchor = (
  t: { label: string; x: number },
  width: number
): Placed["anchor"] => {
  const half = (t.label.length * TICK_CHAR) / 2;
  if (t.x - half < 0) {
    return "start";
  }
  return t.x + half > width ? "end" : "middle";
};

/**
 * The month labels under a time plot. Keyed by position: broadsheet labels
 * repeat ("Jul" every year), so a label alone is not a key.
 */
/** Clear space kept between neighbouring month labels, px. */
const LABEL_CLEAR = 10;

interface Placed {
  anchor: "end" | "middle" | "start";
  label: string;
  x: number;
}

/** A label's left and right edges for its anchor. */
const extent = (t: Placed) => {
  const w = t.label.length * TICK_CHAR;
  if (t.anchor === "start") {
    return [t.x, t.x + w];
  }
  return t.anchor === "end" ? [t.x - w, t.x] : [t.x - w / 2, t.x + w / 2];
};

/** Labels left to right, dropping any that would touch the one kept before it. */
const clearOf = (ticks: { label: string; x: number }[], width: number) => {
  const kept: Placed[] = [];
  for (const t of ticks) {
    const placed = { ...t, anchor: edgeAnchor(t, width) };
    const prev = kept.at(-1);
    if (
      prev === undefined ||
      extent(placed)[0] - extent(prev)[1] >= LABEL_CLEAR
    ) {
      kept.push(placed);
    }
  }
  return kept;
};

export const MonthAxis = (props: {
  ticks: { label: string; x: number }[];
  y: number;
  /** The svg's width: a label that would run past either edge aligns to it. */
  width: number;
}) => (
  <g>
    {clearOf(props.ticks, props.width).map((t) => (
      <text
        key={`${t.x}-${t.label}`}
        className={TICK}
        x={t.x}
        y={props.y}
        dy="0.71em"
        textAnchor={t.anchor}
      >
        {t.label}
      </text>
    ))}
  </g>
);
