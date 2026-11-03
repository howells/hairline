// Line-end labels: which lines are named, and where the labels stand.
import { describe, expect, it } from "vitest";

import {
  chooseNamed,
  groupText,
  nudge,
  placeEndLabels,
} from "../src/charts/line-ends";
import type { EndSeries } from "../src/charts/line-ends";

/** Eleven lines: `North` the hero, ends spread over 100 px, four crowded at one y. */
const lines = (): EndSeries[] => [
  { display: "97", hero: true, name: "North", value: 97, y: 10 },
  { name: "West", value: 82, y: 40 },
  { name: "South", value: 68, y: 55 },
  { name: "East", value: 34, y: 120 },
  { name: "Midlands", value: 66, y: 60 },
  { name: "Coast", value: 52, y: 80 },
  { name: "Highlands", value: 41, y: 100 },
  { name: "Islands", value: 31, y: 123 },
  { name: "Valley", value: 40, y: 101 },
  { name: "Border", value: 42, y: 99 },
  { name: "Capital", value: 29, y: 125 },
];

const options = { max: 200, min: 0, others: "regions" };

describe("which lines are named", () => {
  it("names the hero first, then the highest and the lowest in turn", () => {
    const { named } = chooseNamed(lines(), 4);
    expect(named.map((s) => s.name)).toStrictEqual([
      "North",
      "West",
      "South",
      "Capital",
    ]);
  });

  it("folds the rest", () => {
    const { folded, named } = chooseNamed(lines(), 4);
    expect(named).toHaveLength(4);
    expect(folded).toHaveLength(7);
  });

  it("names a lone leftover rather than folding one line", () => {
    const three = lines().slice(0, 3);
    const { folded, named } = chooseNamed(three, 2);
    expect(folded).toHaveLength(0);
    expect(named).toHaveLength(3);
  });

  it("words the group as a count and a plural", () => {
    expect(groupText(7, "regions")).toBe("7 other regions");
  });
});

describe("where the labels stand", () => {
  it("keeps every label, the group included, a gap apart and inside the plot", () => {
    const { group, labels } = placeEndLabels(lines(), {
      ...options,
      gap: 15,
      max: 130,
      min: 8,
    });
    const ys = [...labels.map((l) => l.y), group?.y ?? 0].toSorted(
      (a, b) => a - b
    );
    for (let k = 1; k < ys.length; k += 1) {
      expect(ys[k] - ys[k - 1]).toBeGreaterThanOrEqual(15 - 1e-6);
    }
    expect(ys[0]).toBeGreaterThanOrEqual(8);
    expect(ys.at(-1)).toBeLessThanOrEqual(130);
  });

  it("marks only the labels that moved as nudged", () => {
    // West (40) and South (55) are 15 apart: a 30 gap pushes them apart.
    const { labels } = placeEndLabels(lines(), { ...options, gap: 30 });
    const west = labels.find((l) => l.name === "West");
    const south = labels.find((l) => l.name === "South");
    expect(west?.nudged).toBe(true);
    expect(south?.nudged).toBe(true);
    expect((south?.y ?? 0) - (west?.y ?? 0)).toBeGreaterThanOrEqual(30 - 1e-6);
  });

  it("leaves a label where its line ends when nothing crowds it", () => {
    const { labels } = placeEndLabels(lines(), options);
    const north = labels.find((l) => l.name === "North");
    expect(north?.nudged).toBe(false);
    expect(north?.y).toBe(10);
  });

  it("sets the group at the middle of the lines it folds", () => {
    const { group } = placeEndLabels(lines(), { ...options, gap: 0 });
    const { folded } = chooseNamed(lines(), 4);
    const mean = folded.reduce((sum, s) => sum + s.y, 0) / folded.length;
    expect(group?.y).toBeCloseTo(mean, 5);
    expect(group?.text).toBe("7 other regions");
  });

  it("has no group when every line is named", () => {
    expect(placeEndLabels(lines().slice(0, 3), options).group).toBeNull();
  });

  it("nudges a column of labels, telling which moved", () => {
    const out = nudge([10, 12, 50], 15, 0, 100);
    expect(out[2]).toStrictEqual({ moved: false, y: 50 });
    expect(out[0].moved).toBe(true);
    expect(out[1].y - out[0].y).toBeGreaterThanOrEqual(15 - 1e-6);
    expect(nudge([], 15, 0, 100)).toStrictEqual([]);
  });
});
