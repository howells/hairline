import { Label } from "./text";
import { sansWidth } from "./util";

interface CaptionProps {
  /** Under the name: what the node reaches. */
  note: string;
  name: string;
  /** The node's radius, so the caption clears it. */
  r: number;
  /** Which side of the node it sits: 1 to the right, -1 to the left; by default the right, turning left when it would overrun. */
  side?: 1 | -1;
  /** The svg's width: the caption turns to the left when it would overrun. */
  width: number;
  x: number;
  y: number;
}

/** The selected node's name and reach, on a halo beside it. */
/** Paper between a selected node and its ring, px. */
const SELECTED_GAP = 4;

export const NodeCaption = ({
  name,
  note,
  r,
  side,
  width,
  x,
  y,
}: CaptionProps) => {
  const run = Math.max(sansWidth(name, 11), sansWidth(note, 11)) + r + 8;
  const turn = side ?? (x + run > width ? -1 : 1);

  return (
    <g className="pointer-events-none">
      <Label
        anchor={turn === 1 ? "start" : "end"}
        voice="label"
        x={x + turn * (r + 6)}
        y={y - 1}
      >
        {name}
      </Label>
      <Label
        anchor={turn === 1 ? "start" : "end"}
        muted
        voice="axis"
        x={x + turn * (r + 6)}
        y={y + 12}
      >
        {note}
      </Label>
    </g>
  );
};

/** The selected node's name and reach, centred on a spot chosen clear of nodes and links. */
export const PlacedCaption = (props: {
  name: string;
  note: string;
  x: number;
  y: number;
}) => (
  <g className="pointer-events-none">
    <Label anchor="middle" voice="label" x={props.x} y={props.y - 1}>
      {props.name}
    </Label>
    <Label anchor="middle" muted voice="axis" x={props.x} y={props.y + 12}>
      {props.note}
    </Label>
  </g>
);

/** The selection, said aloud: the chart is one image to a screen reader, so this is how it hears the change. */
export const NetworkLive = (props: { text: string }) => (
  <span aria-live="polite" className="sr-only">
    {props.text}
  </span>
);

/**
 * The selected node's outline: a 2px ink ring with paper between it and the
 * node, so the selection reads apart from its ink neighbours.
 */
export const SelectedRing = (props: { cx: number; cy: number; r: number }) => (
  <circle
    className="stroke-ink fill-none"
    cx={props.cx}
    cy={props.cy}
    r={props.r + SELECTED_GAP}
    strokeWidth={2}
  />
);
