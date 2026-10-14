import { KeySwatch } from "../texture";
import { sansWidth } from "../util";

/** One key entry: a swatch (pattern fill or solid tone) and its name. */
export interface KeyItem {
  /** Pattern fill (`paint(id)`) for a textured swatch. */
  fill?: string;
  name: string;
  /** Fill class for a solid swatch, e.g. "fill-ink". */
  tone?: string;
}

/** The swatch's side, the gap to its name, and the gap between entries. */
const SWATCH = 12;
const TO_NAME = 6;
const BETWEEN = 16;

const itemWidth = (item: KeyItem) =>
  SWATCH + TO_NAME + Math.ceil(sansWidth(item.name, 11));

/** Total width of a key row, so it can be set flush right. */
const keyWidth = (items: readonly KeyItem[]) =>
  items.reduce((w, item, i) => w + itemWidth(item) + (i > 0 ? BETWEEN : 0), 0);

interface SeriesKeyProps {
  /** Which edge `x` is: the row's left edge (default) or its right edge. */
  align?: "end" | "start";
  items: readonly KeyItem[];
  x: number;
  /** Baseline of the names; swatches centre on their x-height. */
  y: number;
}

/** A one-row key: 12px swatches, each named in the note voice. */
export const SeriesKey = (props: SeriesKeyProps) => {
  const left =
    props.align === "end" ? props.x - keyWidth(props.items) : props.x;
  const starts = props.items.map(
    (_, i) =>
      left +
      props.items
        .slice(0, i)
        .reduce((w, item) => w + itemWidth(item) + BETWEEN, 0)
  );
  return (
    <g className="fade">
      {props.items.map((item, i) => (
        <g key={item.name}>
          <KeySwatch
            fill={item.fill}
            tone={item.tone}
            x={starts[i]}
            y={props.y - 10}
          />
          <text className="t-note" x={starts[i] + SWATCH + TO_NAME} y={props.y}>
            {item.name}
          </text>
        </g>
      ))}
    </g>
  );
};
