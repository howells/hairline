// Seam 1: the pointer model's arithmetic, through the built package: which
// stop a pointer snaps to, where a key goes, where the tip stands, and what a
// screen reader is told. Pure numbers, no page.
import { nearest, placeTip, spoken, stepTo } from "@howells/hairline/kit";
import { describe, expect, it } from "vitest";

describe("nearest: which stop the pointer snaps to", () => {
  const stops = [
    { x: 40, y: 10 },
    { x: 120, y: 90 },
    { x: 200, y: 20 },
  ];

  it("across an x chart finds the nearest x, whatever the height", () => {
    expect(nearest(stops, "x", { x: 110, y: 400 }, 40)).toBe(stops[1]);
    expect(nearest(stops, "x", { x: 190, y: 0 }, 40)).toBe(stops[2]);
  });

  it("gives up beyond its reach", () => {
    expect(nearest(stops, "x", { x: 80, y: 0 }, 30)).toBeNull();
    expect(nearest(stops, "x", { x: 80, y: 0 }, 40)).toBe(stops[0]);
    expect(nearest([], "x", { x: 80, y: 0 }, Infinity)).toBeNull();
  });

  it("on the plane is the plain distance, and down a column only height", () => {
    expect(nearest(stops, "xy", { x: 120, y: 20 }, 100)).toBe(stops[1]);
    expect(nearest(stops, "xy", { x: 118, y: 22 }, 10)).toBeNull();
    expect(nearest(stops, "y", { x: 0, y: 88 }, 10)).toBe(stops[1]);
  });
});

describe("stepTo: where a key goes", () => {
  it("steps by one and stops at the ends", () => {
    expect(stepTo(5, 2, "ArrowRight")).toBe(3);
    expect(stepTo(5, 2, "ArrowDown")).toBe(3);
    expect(stepTo(5, 2, "ArrowLeft")).toBe(1);
    expect(stepTo(5, 2, "ArrowUp")).toBe(1);
    expect(stepTo(5, 4, "ArrowRight")).toBe(4);
  });

  it("jumps to the ends with Home and End", () => {
    expect(stepTo(5, 2, "Home")).toBe(0);
    expect(stepTo(5, 2, "End")).toBe(4);
  });

  it("with nothing showing, lands on the first going forward and the last going back", () => {
    expect(stepTo(5, -1, "ArrowRight")).toBe(0);
    expect(stepTo(5, -1, "ArrowLeft")).toBe(4);
  });
});

describe("placeTip: where the tip stands", () => {
  const bounds = { h: 300, w: 400 };
  const tip = { h: 80, w: 120 };
  const flips = (x: number, side: "left" | "right") =>
    placeTip({ at: { x, y: 150 }, bounds, side, tip }).side;

  it("takes its preferred side, a gap off the mark, centred on it", () => {
    const placed = placeTip({ at: { x: 100, y: 150 }, bounds, tip });
    expect(placed).toStrictEqual({ left: 112, side: "right", top: 110 });
  });

  it("flips only when it would clip", () => {
    expect(flips(300, "right")).toBe("left");
    expect(flips(300, "left")).toBe("left");
    expect(flips(40, "left")).toBe("right");
    expect(flips(100, "right")).toBe("right");
  });

  it("stands beside a wide mark, not on it", () => {
    const placed = placeTip({ at: { x: 100, y: 150 }, bounds, clear: 30, tip });
    expect(placed.left).toBe(142);
  });

  it("never leaves the chart, even when it fits neither side", () => {
    const wide = { h: 400, w: 360 };
    const placed = placeTip({ at: { x: 200, y: 20 }, bounds, tip: wide });
    expect(placed.left).toBeGreaterThanOrEqual(4);
    expect(placed.left + wide.w).toBeLessThanOrEqual(bounds.w - 4);
    expect(placed.top).toBeGreaterThanOrEqual(4);
  });

  it("keeps off the hero's line where there is room", () => {
    const placed = placeTip({
      at: { x: 100, y: 150 },
      avoid: () => [[140, 160]],
      bounds,
      tip,
    });
    const covers = placed.top <= 160 && placed.top + tip.h >= 140;
    expect(covers).toBe(false);
  });

  it("a column's tip stands above it, centred, when there is room", () => {
    const placed = placeTip({ above: 28, at: { x: 100, y: 200 }, bounds, tip });
    expect(placed).toStrictEqual({ left: 40, side: "right", top: 92 });
  });

  it("with no room above a column, it stands beside it", () => {
    const placed = placeTip({ above: 28, at: { x: 100, y: 60 }, bounds, tip });
    expect(placed.left).toBe(112);
  });

  it("asks for what to avoid under the tip's own extent, once its side is chosen", () => {
    const asked: number[][] = [];
    placeTip({
      at: { x: 300, y: 150 },
      avoid: (x0, x1) => {
        asked.push([x0, x1]);
        return [[0, 10]];
      },
      bounds,
      tip,
    });
    expect(asked).toStrictEqual([[168, 288]]);
  });

  it("flips to the other side when the preferred one would cover what it must keep off", () => {
    const label = [[0, 400]] as const;
    const placed = placeTip({
      at: { x: 150, y: 150 },
      avoid: (x0) => (x0 > 150 ? label : []),
      bounds,
      tip,
    });
    expect(placed.side).toBe("left");
  });

  it("keeps off every range it is given, not only the first", () => {
    const placed = placeTip({
      at: { x: 100, y: 150 },
      avoid: () => [
        [100, 140],
        [160, 200],
      ],
      bounds,
      tip,
    });
    const covers = placed.top < 200 && placed.top + tip.h > 100;
    expect(covers).toBe(false);
  });

  it("takes the least overlap when nowhere is clear", () => {
    const placed = placeTip({
      at: { x: 100, y: 50 },
      avoid: () => [[0, 200]],
      bounds: { h: 100, w: 400 },
      tip: { h: 100, w: 120 },
    });
    expect(placed.top).toBe(4);
  });
});

describe("spoken: what a screen reader is told", () => {
  const stop = {
    lead: "19 Sep",
    rows: [{ name: "Orders", value: "44k" }, { value: "weekend" }],
  };

  it("is the lead, then each row", () => {
    expect(spoken(stop, false)).toBe("19 Sep: Orders 44k, weekend");
    expect(spoken({ lead: "Oak", rows: [] }, false)).toBe("Oak");
  });

  it("says when the tip is pinned", () => {
    expect(spoken(stop, true)).toBe("19 Sep: Orders 44k, weekend. Pinned");
  });
});
