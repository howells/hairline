import { AggregateSankey } from "@howells/hairline";
// Seam 1: the built package, rendered on the server at a fixed width, the
// way a consumer's first HTML draws it. Run with `pnpm test`.
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const data = {
  flows: [
    { from: "Searching", to: "Ordered", value: 48.1 },
    { from: "Searching", to: "Left", value: 13.2 },
    { from: "A product page", to: "Ordered", value: 1.3 },
    { from: "A product page", to: "Left", value: 4.3 },
  ],
  sources: ["Searching", "A product page"],
  targets: ["Ordered", "Left"],
};

const render = (props: Partial<ComponentProps<typeof AggregateSankey>>) =>
  renderToString(
    createElement(AggregateSankey, {
      data,
      format: (v: number) => `${v.toFixed(1)}%`,
      height: 320,
      width: 720,
      ...props,
    })
  );

describe("AggregateSankey node totals", () => {
  it("prints each node's total by default", () => {
    // Searching's ribbons sum to 61.3; Ordered's to 49.4.
    const html = render({});
    expect(html).toContain("61.3%");
    expect(html).toContain("49.4%");
  });

  it("leaves the totals out, names kept, when totals is false", () => {
    const html = render({ totals: false });
    expect(html).not.toContain("61.3%");
    expect(html).not.toContain("49.4%");

    for (const name of [...data.sources, ...data.targets]) {
      expect(html).toContain(name);
    }
  });
});
