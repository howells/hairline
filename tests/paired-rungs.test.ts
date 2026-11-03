import { PairedRungs } from "@howells/hairline";
// Seam 1: the built package, rendered on the server at a fixed width, the
// way a consumer's first HTML draws it. Run with `pnpm test`.
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const data = [
  { current: 88, label: "Residential", previous: 39.2 },
  { current: 2.3, label: "Hospitality", previous: 10.5 },
  { current: 2.2, label: "Workplace", previous: 20.1 },
  { current: 1.6, label: "Multi-unit housing", previous: 5.5 },
  { current: 0.5, label: "Healthcare", previous: 7.4 },
  { current: 0.5, label: "Education and public", previous: 7.5 },
];

const render = (props: ComponentProps<typeof PairedRungs>) =>
  renderToString(createElement(PairedRungs, { data, unit: 2, ...props }));

const svgHeight = (html: string) =>
  Number(
    /<svg[^>]*height="(?<height>\d+)"/u.exec(html)?.groups?.height ??
      Number.NaN
  );

describe("PairedRungs at a given width", () => {
  it("stands the categories as columns where they fit", () => {
    const html = render({ height: 360, width: 860 });
    expect(svgHeight(html)).toBe(360);
    // Columns grow up from the floor; rows grow along a track.
    expect(html).not.toContain('height="5"');
  });

  it("lays them out as rows, one line of values each, when columns would crowd", () => {
    const html = render({ height: 360, width: 340 });
    // One hatched bar of the earlier period per row, all six.
    expect(html.match(/height="5"/gu) ?? []).toHaveLength(data.length);
    // The chart grows to hold its rows rather than keeping the column height.
    expect(svgHeight(html)).toBeGreaterThan(360);
    for (const { label } of data) {
      expect(html).toContain(label);
    }
  });
});
