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
        halo
        voice="label"
        x={x + turn * (r + 6)}
        y={y - 1}
      >
        {name}
      </Label>
      <Label
        anchor={turn === 1 ? "start" : "end"}
        halo
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

/** The selection, said aloud: the chart is one image to a screen reader, so this is how it hears the change. */
export const NetworkLive = (props: { text: string }) => (
  <span aria-live="polite" className="sr-only">
    {props.text}
  </span>
);
