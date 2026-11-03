// Label spreading: keep stacked labels apart without reordering them.

interface LabelSlot {
  i: number;
  y: number;
}

/** Push neighbours apart until none overlap; true if anything moved. */
const spreadPass = (order: LabelSlot[], gap: number) => {
  let moved = false;
  for (let k = 1; k < order.length; k += 1) {
    const overlap = gap - (order[k].y - order[k - 1].y);
    if (overlap > 0.1) {
      order[k - 1].y -= overlap / 2;
      order[k].y += overlap / 2;
      moved = true;
    }
  }
  return moved;
};

/** Pin the ends inside the bounds, then restore spacing inward from each. */
const clampEnds = (
  order: LabelSlot[],
  gap: number,
  min: number,
  max: number
) => {
  const last = order.length - 1;
  order[last].y = Math.min(order[last].y, max);
  for (let k = last - 1; k >= 0; k -= 1) {
    order[k].y = Math.min(order[k].y, order[k + 1].y - gap);
  }
  order[0].y = Math.max(order[0].y, min);
  for (let k = 1; k <= last; k += 1) {
    order[k].y = Math.max(order[k].y, order[k - 1].y + gap);
  }
};

/**
 * Nudge label positions apart so none sit closer than `gap`, keeping order
 * and staying within [min, max].
 */
export const relax = (ys: number[], gap: number, min: number, max: number) => {
  const order = ys.map((y, i) => ({ i, y })).toSorted((a, b) => a.y - b.y);
  for (let pass = 0; pass < 40; pass += 1) {
    if (!spreadPass(order, gap)) {
      break;
    }
  }
  clampEnds(order, gap, min, max);
  const out = [...ys];
  for (const o of order) {
    out[o.i] = o.y;
  }
  return out;
};
