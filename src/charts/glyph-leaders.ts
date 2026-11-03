type Point = readonly [number, number];

/** Most parts a key can label; every order of them is tried. */
const MOST_PARTS = 6;

/** Which side of the line o→a the point b lies on. */
const side = (o: Point, a: Point, b: Point) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Whether the segments p1–p2 and q1–q2 cross. */
const crosses = (p1: Point, p2: Point, q1: Point, q2: Point) =>
  side(p1, p2, q1) * side(p1, p2, q2) < 0 &&
  side(q1, q2, p1) * side(q1, q2, p2) < 0;

/** Every order of 0..n-1. */
const orders = (n: number): number[][] => {
  if (n === 0) {
    return [[]];
  }
  return orders(n - 1).flatMap((rest) =>
    Array.from({ length: n }, (_, at) => rest.toSpliced(at, 0, n - 1))
  );
};

/** How bad an order is: each crossing outweighs any length, then the total leader length. */
const costOf = (anchors: Point[], ends: Point[], order: number[]) => {
  let cost = 0;
  for (const [row, a] of order.entries()) {
    cost += Math.hypot(
      anchors[a][0] - ends[row][0],
      anchors[a][1] - ends[row][1]
    );
    for (const [other, b] of order.entries()) {
      if (
        other > row &&
        crosses(anchors[a], ends[row], anchors[b], ends[other])
      ) {
        cost += 1e6;
      }
    }
  }
  return cost;
};

/**
 * Which anchor each label row takes, so that no two leaders cross: of every
 * order of the parts, the one with no crossings and the shortest leaders.
 * `ends[row]` is where the leader meets that row's label; the result lists,
 * row by row, the index of the anchor that row labels.
 */
export const leaderOrder = (anchors: Point[], ends: Point[]) => {
  if (anchors.length > MOST_PARTS) {
    throw new Error(
      `A glyph key labels at most ${MOST_PARTS} parts, not ${anchors.length}`
    );
  }
  let best: number[] = [];
  let bestCost = Infinity;
  for (const order of orders(anchors.length)) {
    const cost = costOf(anchors, ends, order);
    if (cost < bestCost) {
      best = order;
      bestCost = cost;
    }
  }
  return best;
};
