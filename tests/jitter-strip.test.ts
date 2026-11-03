import { JitterStrip } from "@howells/hairline";
// Seam 1: the built package, rendered on the server at a fixed width, the
// way a consumer's first HTML draws it. Run with `pnpm test`.
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const data = [
  { label: "Paint", names: ["Ada", "Bo", "Cy"], values: [12, 75, 40] },
  { label: "Tile", names: ["Ada", "Bo", "Cy"], values: [30, 9, 18] },
];

const render = (props: Partial<ComponentProps<typeof JitterStrip>>) =>
  renderToString(
    createElement(JitterStrip, {
      data,
      format: (v: number) => `${String(v)}%`,
      height: 200,
      width: 640,
      ...props,
    })
  );

describe("JitterStrip mark", () => {
  it("draws the marked record solid, with its value, in every group", () => {
    const html = render({ mark: "Bo" });
    expect(html.match(/class="fill-ink stroke-paper"/gu)).toHaveLength(2);
    expect(html).toContain(">75%<");
    expect(html).toContain(">9%<");
    expect(html).toContain("Paint, 3 records, median 40%, Bo 75%");
  });

  it("leaves the medians out when median is false", () => {
    const html = render({ mark: "Bo", median: false });
    expect(html).not.toContain("median");
    expect(html).toContain("Tile, 3 records, Bo 9%");
  });

  it("marks nothing for a name no group has", () => {
    expect(render({ mark: "Dee" })).not.toContain("fill-ink stroke-paper");
  });
});
