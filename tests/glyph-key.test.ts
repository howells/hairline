import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { signupMonthsDemo } from "../src/charts/forms/radial-year.data";
import { YearKey } from "../src/charts/forms/year-key";
import { glyphBox } from "../src/charts/glyph-box";
import { GlyphKey } from "../src/charts/glyph-key";
import { leaderOrder } from "../src/charts/glyph-leaders";
import { ArcKey } from "../src/charts/lupi/arc-key";
import { arcMatrixDemo } from "../src/charts/lupi/arc-matrix.data";
import { barcodeLollipopDemo } from "../src/charts/lupi/barcode-lollipop.data";
import { bubbleAlmanacDemo } from "../src/charts/lupi/bubble-almanac.data";
import { BubbleKey } from "../src/charts/lupi/bubble-mark";
import { FlareKey } from "../src/charts/lupi/flare-key";
import { zoomFlare } from "../src/charts/lupi/flare-zoom";
import { radialPatchworkDemo } from "../src/charts/lupi/radial-patchwork.data";
import { TideKey } from "../src/charts/lupi/tide-key";
import { sansWidth } from "../src/charts/util";

const PHONE = 390;

const text = (html: string) => html.replaceAll(/<[^>]*>/gu, "|");
/** Every label in the key's svg: its x and its words. */
const labels = (html: string) =>
  [
    ...html.matchAll(
      /<text[^>]*?\sx="(?<x>[\d.]+)"[^>]*>(?<words>[^<]+)<\/text>/gu
    ),
  ].map((m) => ({ words: m.groups?.words ?? "", x: Number(m.groups?.x) }));
const words = (html: string) => labels(html).map((l) => l.words);
const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;

const box = glyphBox(480);
/** GlyphKey on the server; a function, so the glyph travels as a plain prop. */
const keyed = (props: ComponentProps<typeof GlyphKey>) =>
  renderToString(createElement(GlyphKey, props));
const demo = keyed({
  box,
  children: createElement("circle", { cx: box.cx, cy: box.cy, r: 20 }),
  label: "How to read one dot: Jan",
  parts: [
    { at: [box.cx, box.cy + 20], detail: "Second", name: "Lower" },
    { at: [box.cx, box.cy - 20], detail: "First", name: "Upper" },
  ],
  record: "Jan",
  width: 480,
});

describe("GlyphKey is one glyph with its parts named where they are", () => {
  it("draws the glyph once, and a dot for each part", () => {
    expect(count(demo, /<circle/gu)).toBe(3);
  });

  it("runs a thin leader to each part's label", () => {
    expect(count(demo, /class="rule shape-smooth"/gu)).toBe(2);
  });

  it("orders the labels top to bottom by where their parts sit, so leaders do not cross", () => {
    expect(words(demo).indexOf("Upper")).toBeLessThan(
      words(demo).indexOf("Lower")
    );
  });

  it("names the record it draws, in the label voice on a halo", () => {
    expect(demo).toContain('class="t-axis t-halo"');
    expect(words(demo)).toContain("Jan");
  });

  it("gives screen readers the name, the parts as a description and as a table", () => {
    expect(demo).toContain('aria-label="How to read one dot: Jan"');
    expect(demo).toContain("Upper: First. Lower: Second.");
    expect(text(demo.slice(demo.indexOf("<table")))).toContain("Second");
  });
});

const keys = {
  arc: renderToString(
    createElement(ArcKey, {
      data: arcMatrixDemo,
      format: (v: number) => `${v} ha`,
      noun: "of new woodland",
      width: PHONE,
    })
  ),
  bubble: renderToString(
    createElement(BubbleKey, {
      data: bubbleAlmanacDemo,
      format: (v: number) => v.toFixed(2),
      noun: "Mt of green coffee",
      width: PHONE,
    })
  ),
  flare: renderToString(
    createElement(FlareKey, {
      data: radialPatchworkDemo,
      outlined: "class M or stronger",
      width: PHONE,
    })
  ),
  tide: renderToString(
    createElement(TideKey, {
      data: barcodeLollipopDemo,
      day: (d: Date) => d.toISOString().slice(0, 10),
      format: (v: number) => `${v.toFixed(2)} m`,
      width: PHONE,
    })
  ),
  year: renderToString(
    createElement(YearKey, { data: signupMonthsDemo, width: PHONE })
  ),
};

describe("each glyph chart's key names the parts of its own glyph", () => {
  it.each([
    ["bubble", ["Circle area", "Dark core", "Dotted ring"]],
    ["tide", ["High water", "Low water", "Day"]],
    ["flare", ["Start time", "Width", "Reach", "Crosshatch"]],
    ["year", ["Distance from centre", "Angle", "Dotted ring"]],
    ["arc", ["Bubble area", "Row", "Ink"]],
  ] as const)("the %s key", (kind, parts) => {
    expect(words(keys[kind])).toStrictEqual(expect.arrayContaining([...parts]));
  });
});

describe("the key draws a real record, never an invented one", () => {
  it("the almanac's is the largest cell that fell on the year before", () => {
    const flagged = bubbleAlmanacDemo.filter(
      (d) => d.flag === true && d.core > 0
    );
    const [largest] = flagged.toSorted((a, b) => b.value - a.value);
    expect(words(keys.bubble)).toContain(
      `${largest.category}, ${largest.year}`
    );
  });

  it("the flare's is the longest flagged flare, its minutes and class as recorded", () => {
    const flagged = radialPatchworkDemo.filter((d) => d.flagged === true);
    const [longest] = flagged.toSorted((a, b) => b.minutes - a.minutes);
    expect(keys.flare).toContain(`${longest.minutes} minutes`);
    expect(keys.flare).toContain(`Peak ${longest.label}`);
  });

  it("the year's is its warmest month", () => {
    const warmest = Math.max(...signupMonthsDemo.map((d) => d.value));
    expect(keys.year).toContain(`${warmest.toFixed(1)} °C`);
  });
});

describe("the key fits a 390px phone", () => {
  it.each(Object.entries(keys))(
    "every label of the %s key ends inside the svg",
    (_kind, html) => {
      const ends = labels(html).map((l) => l.x + sansWidth(l.words, 11));
      expect(Math.max(...ends)).toBeLessThanOrEqual(PHONE);
    }
  );
});

const side = (o: number[], a: number[], b: number[]) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Whether any two leaders, anchor to label end, cross. */
const anyCross = (
  anchors: [number, number][],
  ends: [number, number][],
  order: number[]
) =>
  order.some((a, row) =>
    order.some((b, other) => {
      const [p1, p2, q1, q2] = [anchors[a], ends[row], anchors[b], ends[other]];
      return (
        other > row &&
        side(p1, p2, q1) * side(p1, p2, q2) < 0 &&
        side(q1, q2, p1) * side(q1, q2, p2) < 0
      );
    })
  );

describe("leaders never cross", () => {
  it("even where sorting the anchors by y alone would cross them", () => {
    // Sorted by y, the nearer anchor takes the top label and its leader cuts the other's.
    const anchors: [number, number][] = [
      [100, 60],
      [20, 62],
    ];
    const ends: [number, number][] = [
      [200, 20],
      [200, 40],
    ];
    expect(anyCross(anchors, ends, [0, 1])).toBe(true);
    expect(anyCross(anchors, ends, leaderOrder(anchors, ends))).toBe(false);
  });

  it("whatever the order the parts come in", () => {
    const ends: [number, number][] = [
      [200, 30],
      [200, 70],
      [200, 110],
      [200, 150],
    ];
    const anchors: [number, number][] = [
      [90, 120],
      [30, 40],
      [60, 140],
      [120, 80],
    ];
    expect(anyCross(anchors, ends, leaderOrder(anchors, ends))).toBe(false);
  });

  it("refuses more parts than it can set", () => {
    const seven: [number, number][] = Array.from({ length: 7 }, (_, k) => [
      k,
      k,
    ]);
    expect(() => leaderOrder(seven, seven)).toThrow("at most");
  });
});

describe("the flare key zooms to the flare", () => {
  const flare = { hour: 14.33, minutes: 40, size: 2 };

  it("fills the box, however small the flare is beside the biggest", () => {
    const { dial, span } = zoomFlare(box, flare, 100);
    const wide = box.size;
    expect(dial.R).toBeGreaterThan(wide / 2);
    expect(span.reach - dial.r0).toBeGreaterThan(wide / 4);
  });

  it("keeps the flare's own angles and its reach as a share of the dial", () => {
    const { dial, span } = zoomFlare(box, flare, 100);
    expect(span.a0).toBeCloseTo(14.33 * 15);
    expect((span.reach - dial.r0) / (dial.R - dial.r0)).toBeCloseTo(0.02);
  });
});
