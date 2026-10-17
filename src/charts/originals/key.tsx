import type { ReactNode } from "react";

import { KEY } from "../marks";
import { Label } from "../text";
import { sansWidth } from "../util";

/* A right-aligned key of drawn marks, shared by the originals. */

/** Width a key mark occupies, and the gap after it. */
const MARK_W = KEY.swatch;
const MARK_GAP = KEY.gap;
const ITEM_GAP = KEY.entryGap;

export interface KeyItem {
  label: string;
  /** The mark, drawn in a 12px box centred on y = 0. */
  mark: ReactNode;
}

interface KeyProps {
  items: KeyItem[];
  /** Right edge of the key. */
  right: number;
  /** Centre line of the key. */
  y: number;
}

/** A short key of marks and names, set in `t-note`, flush to `right`. */
export const Key = (props: KeyProps) => {
  const widths = props.items.map(
    (item) => MARK_W + MARK_GAP + sansWidth(item.label, 11)
  );
  const total =
    widths.reduce((acc, w) => acc + w, 0) +
    ITEM_GAP * Math.max(0, widths.length - 1);
  const placed = props.items.map((item, k) => ({
    at:
      props.right -
      total +
      widths.slice(0, k).reduce((acc, w) => acc + w + ITEM_GAP, 0),
    item,
  }));
  return (
    <g className="fade">
      {placed.map(({ at, item }) => (
        <g
          key={item.label}
          transform={`translate(${Math.round(at)} ${props.y})`}
        >
          {item.mark}
          <Label middle voice="note" x={MARK_W + MARK_GAP}>
            {item.label}
          </Label>
        </g>
      ))}
    </g>
  );
};
