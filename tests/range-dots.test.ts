// Seam 1: RangeDots through the built package and its registry entry.
import { RangeDots } from "@howells/hairline";
import type { RangeDotsProps } from "@howells/hairline";
import { charts } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const data = [
  { estimate: 42, high: 46, label: "Paint", low: 38 },
  { estimate: 31, high: 40, label: "Flooring", low: 22 },
  { estimate: 19, high: 30, label: "Stone", low: 8 },
  { estimate: 20, high: 30, label: "Lopsided", low: 15 },
];
const sized = { height: 320, width: 520 };
const render = (props: Partial<RangeDotsProps> = {}) =>
  renderToString(createElement(RangeDots, { data, ...sized, ...props }));
const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;

describe("error bars", () => {
  it("draws a dot, a whisker and two caps for each row, labelled with its margin", () => {
    const html = render();
    expect(count(html, /<circle/gu)).toBe(4);
    expect(html).toContain(">42 ± 4<");
    expect(html).toContain(">31 ± 9<");
    // an interval that is not symmetric prints its ends instead
    expect(html).toContain(">20, 15 to 30<");
  });

  it("draws rows too wide to rank as open dots in a quieter tone", () => {
    const html = render({ wide: 15 });
    // Stone (22) and Flooring (18) are wide; Paint (8) and Lopsided (15) rank
    expect(count(html, /class="[^"]*fill-hero/gu)).toBe(2);
    expect(count(html, /class="fill-paper[^"]*stroke-l3/gu)).toBe(2);
    expect(html).toContain("Too wide to rank");
    expect(html).toMatch(/<desc[^>]*>[^<]*Too wide to rank: Flooring, Stone/u);
  });

  it("without a threshold every row ranks", () => {
    const html = render();
    expect(count(html, /class="[^"]*fill-hero/gu)).toBe(4);
    expect(html).not.toContain("Too wide to rank");
  });

  it("formats the margin on its own", () => {
    const html = render({
      format: (v: number) => `${v}%`,
      formatMargin: (v: number) => `${v} pts`,
    });
    expect(html).toContain(">42% ± 4 pts<");
  });

  it("lists every row in the data table, with the coverage named", () => {
    const html = render({ coverage: 0.9 });
    expect(html).toContain("Low, 90% interval");
    expect(html).toContain("<td>Stone</td>");
    expect(html).toMatch(/<desc[^>]*>[^<]*a 90% interval/u);
  });

  it("is registered, and its schema checks the interval holds the estimate", () => {
    const chart = charts["range-dots"];
    expect(chart.validate({ data }).ok).toBe(true);
    const bad = chart.validate({
      data: [{ estimate: 50, high: 46, label: "Paint", low: 38 }],
    });
    expect(bad.ok ? [] : bad.issues.map((i) => i.pointer)).toStrictEqual([
      "data[0].estimate",
    ]);
    expect(chart.validate({ data, domain: [5, 1] }).ok).toBe(false);
  });

  it("draws a quiet empty axis with no data", () => {
    expect(render({ data: [] })).toContain("</svg>");
  });
});
