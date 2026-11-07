// @vitest-environment jsdom
// Seam 1: ribbons that show direction. Each ribbon of a chord ring, a sankey
// and a funnel paints with one gradient of the ink from its source to its
// target, dark at the start; the flows that lead are drawn as they are and the
// rest pushed back; and no gradient id is shared between charts on a page.
import { AggregateSankey, ChordRing, HourglassStream } from "@howells/hairline";
import { chord } from "d3-chord";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { sharedWorkDemo } from "../src/charts/forms/chord-ring.data";
import { mount, stubBrowser } from "./measured";

stubBrowser();

const sankeyData = {
  flows: [
    { from: "Searching", to: "Ordered", value: 48.1 },
    { from: "Searching", to: "Left", value: 13.2 },
    { from: "A product page", to: "Ordered", value: 1.3 },
    { from: "A product page", to: "Left", value: 4.3 },
  ],
  sources: ["Searching", "A product page"],
  targets: ["Ordered", "Left"],
};

const sankey = () =>
  createElement(AggregateSankey, {
    data: sankeyData,
    height: 320,
    highlight: "Searching",
    width: 720,
  });

interface Gradient {
  from: [number, number];
  id: string;
  opacities: number[];
  tones: string[];
  to: [number, number];
  units: string;
}

/** Every linearGradient in the markup, read back. */
const gradients = (root: ParentNode): Gradient[] =>
  [...root.querySelectorAll("linearGradient")].map((g) => ({
    from: [Number(g.getAttribute("x1")), Number(g.getAttribute("y1"))],
    id: g.id,
    opacities: [...g.querySelectorAll("stop")].map((s) =>
      Number(s.getAttribute("stop-opacity"))
    ),
    to: [Number(g.getAttribute("x2")), Number(g.getAttribute("y2"))],
    tones: [...g.querySelectorAll("stop")].map(
      (s) => s.getAttribute("stop-color") ?? ""
    ),
    units: g.getAttribute("gradientUnits") ?? "",
  }));

/** The gradient ids a chart's shapes paint with. */
const painted = (root: ParentNode) =>
  [...root.querySelectorAll("[fill],[stroke]")].flatMap((el) =>
    [el.getAttribute("fill"), el.getAttribute("stroke")].flatMap((v) => {
      const id = /^url\(#(?<id>[^)]+)\)$/u.exec(v ?? "")?.groups?.id;

      return id === undefined ? [] : [id];
    })
  );

const markup = (html: string) => {
  const host = document.createElement("div");
  host.innerHTML = html;

  return host;
};

const checkAll = (list: Gradient[]) => {
  for (const g of list) {
    expect(g.units).toBe("userSpaceOnUse");
    expect(g.tones).toStrictEqual(["var(--hl-ink)", "var(--hl-ink)"]);
    expect(g.opacities[0]).toBeGreaterThan(g.opacities[1]);
    expect(g.opacities[1]).toBeGreaterThan(0);
  }
};

describe("every ribbon is one gradient of the ink, dark at the source", () => {
  it("sankey: one per flow, running left to right, each painted by a ribbon", () => {
    const host = markup(renderToString(sankey()));
    const list = gradients(host);
    expect(list).toHaveLength(sankeyData.flows.length);
    checkAll(list);

    for (const g of list) {
      expect(g.to[0]).toBeGreaterThan(g.from[0]);
    }

    expect(painted(host).toSorted()).toStrictEqual(
      list.map((g) => g.id).toSorted()
    );
  });

  it("sankey: the hero source's flows lead and the rest sit pale", () => {
    const paths = [
      ...markup(renderToString(sankey())).querySelectorAll("path"),
    ].filter((p) => p.getAttribute("stroke")?.startsWith("url(#") === true);

    const pale = paths.filter(
      (p) => p.getAttribute("class")?.includes("opacity-40") === true
    );

    expect(paths).toHaveLength(4);
    expect(pale).toHaveLength(2);
  });

  it("funnel: one vertical gradient per step, the hero step led", async () => {
    const host = await mount(createElement(HourglassStream, {}));
    const list = gradients(host);
    expect(list.length).toBeGreaterThan(1);
    checkAll(list);

    for (const g of list) {
      expect(g.to[0]).toBe(g.from[0]);
      expect(g.to[1]).toBeGreaterThan(g.from[1]);
    }

    expect([...new Set(painted(host))].toSorted()).toStrictEqual(
      list.map((g) => g.id).toSorted()
    );

    const threads = [...host.querySelectorAll("path")].filter(
      (p) => p.getAttribute("stroke")?.startsWith("url(#") === true
    );

    const lastStep = list.at(-1)?.id ?? "";

    const led = threads.filter(
      (p) => !(p.getAttribute("class") ?? "").includes("opacity-40")
    );

    expect(led.length).toBeGreaterThan(0);
    expect(
      led.every((p) => p.getAttribute("stroke") === `url(#${lastStep})`)
    ).toBe(true);
  });

  it("chord ring: the focused group's ribbons are gradients, and a ribbon runs from the goods to the partner that bought them", async () => {
    const host = await mount(createElement(ChordRing, {}));
    const list = gradients(host);
    const pairs = chord()(sharedWorkDemo.matrix).length;
    expect(list).toHaveLength(pairs);
    checkAll(list);
    expect(new Set(painted(host)).size).toBe(pairs);

    // The first five groups are the kinds of goods: every chord starts at one.
    for (const c of chord()(sharedWorkDemo.matrix)) {
      expect(c.source.index).toBeLessThan(5);
      expect(c.target.index).toBeGreaterThanOrEqual(5);
    }
  });
});

const idsOf = (host: ParentNode) => gradients(host).map((g) => g.id);

describe("gradient ids are unique per chart instance", () => {
  it("two of the same chart on one page share no gradient id", async () => {
    const host = await mount(
      createElement(
        "div",
        null,
        createElement(ChordRing, { key: "a" }),
        createElement(ChordRing, { key: "b" })
      )
    );

    const ids = idsOf(host);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("charts of different kinds share none either", async () => {
    const host = await mount(
      createElement(
        "div",
        null,
        createElement(HourglassStream, { key: "a" }),
        createElement(ChordRing, { key: "b" }),
        createElement(HourglassStream, { key: "c" })
      )
    );

    const ids = idsOf(host);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every ribbon's paint resolves to a gradient on the page", async () => {
    const host = await mount(createElement(ChordRing, {}));
    const own = new Set(idsOf(host));
    expect(painted(host).every((id) => own.has(id))).toBe(true);
  });
});
