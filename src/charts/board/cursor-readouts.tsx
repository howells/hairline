// What a time chart shows at its cursor: a lone value, one big figure, or a
// name-and-value tag beside each dot.

import { TICK, VALUE, VALUE_LG } from "../roles";
import { PlateLabel } from "../texture";
import { relax } from "./spread";

/** The lone value over the cursor. */
export const ValueReadout = (props: { text: string; x: number; y: number }) => (
  <text x={props.x} y={props.y} textAnchor="middle" className={VALUE}>
    {props.text}
  </text>
);

/** The one big figure at the top left, with its date beneath. */
export const FigureReadout = (props: {
  date: string;
  value: string;
  x: number;
}) => (
  <g>
    <text className={VALUE_LG} x={props.x} y={30}>
      {props.value}
    </text>
    <text className={TICK} x={props.x} y={50}>
      {props.date}
    </text>
  </g>
);

/** Gap between a tag and its dot, px. */
const TAG_GAP = 10;
/** Tags flip to the left of the cursor within this distance of the edge. */
const TAG_ROOM = 120;

interface Tag {
  id: string;
  name?: string;
  value: string;
  /** The dot's y. */
  y: number;
}

/** Name and value beside each cursor dot, nudged apart where lines meet. */
export const CursorTags = (props: {
  cx: number;
  /** The plot's right edge: near it, tags sit left of the cursor. */
  right: number;
  max: number;
  min: number;
  /** The chart is engraved under its lines: each tag sits on a plate. */
  plate?: boolean;
  tags: Tag[];
}) => {
  const ys = relax(
    props.tags.map((t) => t.y),
    16,
    props.min,
    props.max
  );
  const flip = props.cx > props.right - TAG_ROOM;
  if (props.plate === true) {
    return props.tags.map((t, i) => (
      <PlateLabel
        anchor={flip ? "end" : "start"}
        className={VALUE}
        key={t.id}
        lead={t.name}
        text={t.value}
        x={flip ? props.cx - TAG_GAP : props.cx + TAG_GAP}
        y={ys[i] ?? t.y}
      />
    ));
  }
  return props.tags.map((t, i) => (
    <text
      key={t.id}
      className={`${TICK} t-halo`}
      x={flip ? props.cx - TAG_GAP : props.cx + TAG_GAP}
      y={ys[i]}
      dy="0.34em"
      textAnchor={flip ? "end" : "start"}
    >
      {t.name === undefined ? "" : `${t.name} `}
      <tspan className={VALUE}>{t.value}</tspan>
    </text>
  ));
};
