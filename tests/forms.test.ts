// Seam 1: the built package, rendered on the server at a fixed width. The
// arrow plot, the bullet, the pyramid and the back-to-front ridgeline.
// Run with `pnpm test`.
import { ArrowPlot, Bullet, Pyramid, Ridgeline } from "@howells/hairline";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;

/** The anchor and x of the text element holding exactly `text`. */
const found = (html: string, text: string) => {
  for (const m of html.matchAll(
    /text-anchor="(?<anchor>\w+)" x="(?<x>[\d.]+)"[^>]*>(?<body>[^<]*)</gu
  )) {
    if (m.groups?.body === text) {
      return { anchor: m.groups.anchor, x: Number(m.groups.x) };
    }
  }
  throw new Error(`no text "${text}"`);
};

const arrowRows = [
  { after: 10, before: 4, label: "North" },
  { after: 3, before: 8, label: "South" },
  { after: 6, before: 6, label: "East" },
];
const arrows = (props: Partial<ComponentProps<typeof ArrowPlot>> = {}) =>
  renderToString(
    createElement(ArrowPlot, {
      data: arrowRows,
      height: 220,
      width: 480,
      ...props,
    })
  );

const bullets = (props: Partial<ComponentProps<typeof Bullet>> = {}) =>
  renderToString(createElement(Bullet, { width: 480, ...props }));

const pyramid = (props: Partial<ComponentProps<typeof Pyramid>> = {}) =>
  renderToString(createElement(Pyramid, { width: 480, ...props }));

const ridges = (props: Partial<ComponentProps<typeof Ridgeline>> = {}) =>
  renderToString(
    createElement(Ridgeline, { height: 440, width: 640, ...props })
  );
/** The y of every quiet baseline. */
const baselines = (html: string) =>
  [...html.matchAll(/<line class="rule"[^>]*y1="(?<y>[\d.]+)"/gu)].map((m) =>
    Number(m.groups?.y)
  );
/** The distance between the first two quiet baselines at an overlap. */
const rowGap = (overlap: number) => {
  const ys = baselines(ridges({ overlap }));
  return ys[1] - ys[0];
};

describe("the arrow plot", () => {
  it("draws a rise as an ink head and a fall as a quiet one", () => {
    const html = arrows();
    expect(count(html, /<path class="fill-hero" d="M/gu)).toBe(1);
    expect(count(html, /<path class="fill-l3" d="M/gu)).toBe(1);
  });

  it("draws a change too small for an arrow as a pair of dots", () => {
    const html = arrows();
    // East has no change: one hollow ring and one dot, and no third head.
    expect(count(html, /<circle[^>]*fill-paper/gu)).toBe(1);
    expect(count(html, /<path class="fill-/gu)).toBe(2);
  });

  it("sets the value at the head, on the outer side", () => {
    const html = arrows();
    expect(found(html, "10%").anchor).toBe("start");
    expect(found(html, "3%").anchor).toBe("end");
  });

  it("keeps a falling head's label clear of the row names", () => {
    const html = arrows({
      data: [
        { after: 0, before: 9, label: "A long row name" },
        { after: 8, before: 2, label: "Other" },
      ],
      width: 320,
    });
    // The label ends at x and is wider than 16px, so it starts past the names.
    expect(found(html, "0%").x).toBeGreaterThan(
      found(html, "A long row name").x + 16
    );
  });

  it("names every row in the label and the data table", () => {
    const html = arrows({ format: (v: number) => `${v} pts` });
    expect(html).toContain("North: 4 pts to 10 pts");
    expect(html).toContain("<caption>Before and after</caption>");
    expect(count(html, /<tr>/gu)).toBe(4);
  });
});

describe("the bullet", () => {
  it("draws one measure bar and one target tick a row, with its words", () => {
    const html = bullets();
    expect(count(html, /class="grow-x fill-hero"/gu)).toBe(4);
    expect(html).toContain(">820 of 1000<");
    expect(html).toContain(">3100 of 3000<");
  });

  it("gives a row that overshoots its ranges a scale that holds it", () => {
    const html = bullets({
      data: [{ label: "Over", ranges: [10, 20, 30], target: 25, value: 45 }],
    });
    const bar = /<rect class="grow-x fill-hero"[^>]*width="(?<w>[\d.]+)"/u.exec(
      html
    );
    expect(Number(bar?.groups?.w)).toBeLessThanOrEqual(480);
  });

  it("rejects ranges that do not rise", () => {
    expect(() =>
      bullets({
        data: [{ label: "Bad", ranges: [20, 10, 30], target: 25, value: 5 }],
      })
    ).toThrow(/Bad.*ranges/u);
  });

  it("lists value, target and ranges in the data table", () => {
    const html = bullets();
    expect(html).toContain('<th scope="col">Ranges, to</th>');
    expect(html).toContain("600, 850, 1000");
  });
});

describe("the pyramid", () => {
  it("hatches the left side and fills the right in ink", () => {
    const html = pyramid();
    expect(count(html, /<path[^>]*fill="url\(#/gu)).toBe(6);
    expect(count(html, /<path class="grow-x fill-hero"/gu)).toBe(6);
  });

  it("names the sides under the bars and the bands between them", () => {
    const html = pyramid();
    expect(html).toContain(">Homes<");
    expect(html).toContain(">Workplaces<");
    expect(html).toContain(">25–34<");
  });

  it("puts each value at its bar's outer end", () => {
    const html = pyramid({
      data: [{ label: "All", left: 10, right: 20 }],
      format: (v: number) => `${v}%`,
    });
    // The left value ends left of the gutter, the right one starts right of it.
    const gutterL = found(html, "10%").x;
    const gutterR = Number(
      /<text[^>]*x="(?<x>[\d.]+)"[^>]*>20%</u.exec(html)?.groups?.x
    );
    expect(found(html, "10%").anchor).toBe("end");
    expect(gutterR).toBeGreaterThan(gutterL);
  });

  it("reads each band's two values in the label", () => {
    expect(pyramid()).toContain("65+: Homes 6, Workplaces 9");
  });
});

describe("the ridgeline drawn back to front", () => {
  it("fills every ridge with paper, from the back row to the front", () => {
    const html = ridges();
    const crests = [
      ...html.matchAll(/<path d="(?<d>[^"]+)" class="fill-paper"/gu),
    ].map((m) => m.groups?.d ?? "");
    expect(crests).toHaveLength(6);
    // Each crest starts on its baseline, lower down the page than the last.
    const ys = crests.map((d) => Number(/,(?<y>[\d.]+)/u.exec(d)?.groups?.y));
    expect(ys).toStrictEqual(ys.toSorted((a, b) => a - b));
  });

  it("draws the hero in ink over a quiet tint, and no hatching", () => {
    const html = ridges({ highlight: "1970s" });
    expect(count(html, /fill-l5/gu)).toBe(1);
    expect(count(html, /stroke-hero/gu)).toBeGreaterThan(0);
    expect(html).not.toContain("<pattern");
  });

  it("puts a quiet crisp baseline under every other row", () => {
    const ys = baselines(ridges({ highlight: "1970s" }));
    expect(ys).toHaveLength(5);
    expect(ys.every((y) => y % 1 === 0.5)).toBe(true);
  });

  it("overlap sets how many rows a ridge stands over", () => {
    expect(rowGap(3)).toBeLessThan(rowGap(1));
  });

  it("rejects an overlap that is not above zero", () => {
    expect(() => ridges({ overlap: 0 })).toThrow(/overlap/u);
  });
});
