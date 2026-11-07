import { glyphBox } from "../glyph-box";
import { GlyphKey } from "../glyph-key";
import type { ArcMatrixData } from "./arc-matrix.data";

interface ArcKeyProps {
  data: ArcMatrixData;
  format: (v: number) => string;
  noun: string;
  width: number;
}

/** The largest cell, with the row and column it sits in. */
const largestOf = (data: ArcMatrixData) => {
  let best: { c: number; r: number; v: number } | null = null;

  for (const [r, row] of data.values.entries()) {
    for (const [c, v] of row.entries()) {
      if (best === null || v > best.v) {
        best = { c, r, v };
      }
    }
  }

  return best;
};

/** The row bows like a horizon: its ends sit this share of the box below its middle. */
const BOW = 0.2;

/** The bubble's radius, as a share of the box. */
const RADIUS = 0.22;

/** One real cell drawn large: the bubble on its bowed row, its area and row named. */
export const ArcKey = (props: ArcKeyProps) => {
  const cell = largestOf(props.data);

  if (cell === null) {
    return null;
  }

  const row = props.data.rows[cell.r];
  const col = props.data.cols[cell.c];
  const box = glyphBox(props.width);
  const r = box.size * RADIUS;
  const rim = r * Math.SQRT1_2;
  const dy = box.size * BOW;
  const left = box.cx - box.size / 2;
  const right = box.cx + box.size / 2;
  // The row's curve a little in from its left end.
  const t = 6 / box.size;

  const rowY =
    (1 - t) ** 2 * (box.cy + dy) +
    2 * t * (1 - t) * (box.cy - dy) +
    t ** 2 * (box.cy + dy);

  return (
    <GlyphKey
      box={box}
      label={`How to read one bubble: ${row}, ${col}, ${props.format(cell.v)} ${props.noun}`}
      parts={[
        {
          at: [box.cx + rim, box.cy - rim],
          detail: `${props.format(cell.v)} ${props.noun}`,
          name: "Bubble area",
        },
        {
          at: [left + 6, rowY],
          detail: `${row}, bowed like a horizon`,
          name: "Row",
        },
        {
          at: [box.cx + rim, box.cy + rim],
          detail: "The largest cell is inked",
          name: "Ink",
        },
      ]}
      record={`${row}, ${col}`}
      width={props.width}
    >
      <path
        className="rule shape-smooth fill-none"
        d={`M${left},${box.cy + dy} Q${box.cx},${box.cy - dy} ${right},${box.cy + dy}`}
      />
      <circle className="fill-hero" cx={box.cx} cy={box.cy} r={r} />
    </GlyphKey>
  );
};
