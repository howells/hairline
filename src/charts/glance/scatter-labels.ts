import { sansWidth } from "../util";

/** A name set beside one mark. */
export interface PlacedName {
  id: string;
  x: number;
  y: number;
  text: string;
  anchor: "end" | "middle" | "start";
  kind: "name";
}

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Spot {
  anchor: PlacedName["anchor"];
  x0: number;
  yc: number;
}

const overlaps = (a: Box, b: Box) =>
  a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

const anchorX = (spot: Spot, box: Box) => {
  if (spot.anchor === "start") {
    return box.x0;
  }
  return spot.anchor === "end" ? box.x1 : (box.x0 + box.x1) / 2;
};

/**
 * Names for the circles of a scatter, largest first. Each goes right of its
 * circle, else left, above or below, taking the first spot that is clear of
 * every circle and every name already set; failing that, the first spot clear
 * of the other names (over a smaller circle); failing that, it is left out
 * (the tooltip still names it). `at` gives a datum's centre and radius.
 */
export const placeNames = <T extends { label: string; value: number }>(
  data: T[],
  bounds: { left: number; right: number },
  at: (d: T) => [number, number, number]
): PlacedName[] => {
  const circles = data.map((d): Box => {
    const [x, y, r] = at(d);
    return { x0: x - r, x1: x + r, y0: y - r, y1: y + r };
  });
  const taken: Box[] = [];
  const placed = new Map<number, PlacedName>();
  const bySize = data
    .map((_, i) => i)
    .toSorted((a, b) => data[b].value - data[a].value);
  for (const i of bySize) {
    const d = data[i];
    const [x, y, r] = at(d);
    const w = sansWidth(d.label, 12);
    const spots: Spot[] = [
      { anchor: "start", x0: x + r + 5, yc: y },
      { anchor: "end", x0: x - r - 5 - w, yc: y },
      { anchor: "middle", x0: x - w / 2, yc: y - r - 9 },
      { anchor: "middle", x0: x - w / 2, yc: y + r + 9 },
    ];
    // A name above or below must sit nearer its own circle than any other.
    const nearest = (spot: Spot) =>
      spot.anchor !== "middle" ||
      data.every((o, j) => {
        const [ox, oy] = at(o);
        return (
          j === i ||
          Math.hypot(ox - (spot.x0 + w / 2), oy - spot.yc) >
            Math.hypot(x - (spot.x0 + w / 2), y - spot.yc)
        );
      });
    const free = (box: Box, overCircles: boolean) =>
      box.x0 >= bounds.left &&
      box.x1 <= bounds.right &&
      box.y0 >= 0 &&
      !taken.some((t) => overlaps(box, t)) &&
      (overCircles || !circles.some((k, j) => j !== i && overlaps(box, k)));
    // Only the largest may sit over a neighbouring circle; the rest need a clear spot.
    for (const overCircles of i === bySize[0] ? [false, true] : [false]) {
      for (const spot of spots) {
        const box: Box = {
          x0: spot.x0,
          x1: spot.x0 + w,
          y0: spot.yc - 6,
          y1: spot.yc + 6,
        };
        if (!placed.has(i) && nearest(spot) && free(box, overCircles)) {
          taken.push(box);
          placed.set(i, {
            anchor: spot.anchor,
            id: d.label,
            kind: "name",
            text: d.label,
            x: anchorX(spot, box),
            y: spot.yc,
          });
        }
      }
    }
  }
  return data.flatMap((_, i) => placed.get(i) ?? []);
};
