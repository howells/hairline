import { NOTE_LINE, noteLines, stagger } from "./util";

interface PlotNoteProps {
  /** Text alignment at `x`. Defaults to "middle". */
  anchor?: "end" | "middle" | "start";
  /** Entry-stagger slot for the fade-in. Defaults to 6, after most marks. */
  order?: number;
  /** The footnote; " · " separates the segments it may wrap at. */
  text?: string;
  /** Room available for one line. */
  width: number;
  x: number;
  /** Baseline of the last line; extra lines stack upward from it. */
  y: number;
}

/**
 * The in-plot unit footnote ("ONE DOT = ONE DAY"), fading in with the
 * labels. Wraps at " · " to fit `width` and renders nothing when even one
 * segment can't fit. Reserve room for it with `noteSpace` from ./util,
 * using the same width.
 */
export const PlotNote = (props: PlotNoteProps) => {
  const lines = noteLines(props.text, props.width);
  if (lines.length === 0) {
    return null;
  }
  return (
    <g className="fade" style={stagger(props.order ?? 6)}>
      {lines.map((line, k) => (
        <text
          className="t-note"
          key={line}
          textAnchor={props.anchor ?? "middle"}
          x={props.x}
          y={props.y - (lines.length - 1 - k) * NOTE_LINE}
        >
          {line}
        </text>
      ))}
    </g>
  );
};

/**
 * The footnote in its usual place: centred under the plot, 6px off the
 * bottom of a chart `width` wide and `height` tall, `gutter` px clear of
 * either side (8 by default; the daily charts keep 12).
 */
export const FootNote = (props: {
  gutter?: number;
  height: number;
  order?: number;
  text?: string;
  width: number;
}) => (
  <PlotNote
    order={props.order}
    text={props.text}
    width={props.width - 2 * (props.gutter ?? 8)}
    x={props.width / 2}
    y={props.height - 6}
  />
);
