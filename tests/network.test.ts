// @vitest-environment jsdom
// Seam 1: fading out from one node. Select a node (hover, tap, arrow keys or
// the `selected` prop) and the network is toned by its links: the node and its
// direct links in ink, two steps in a mid tone, the rest near the paper, with
// the node's name and a count beside it. Tiny nodes still have a target a
// finger can hit.
import {
  CircularBeadGraph,
  CircularGraph,
  ForceGalaxy,
  ForceGraph,
} from "@howells/hairline";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import { captionSpot, touchesDisc } from "../src/charts/big/caption-spot";
import type { Cubic } from "../src/charts/big/caption-spot";
import { circularGraphDemo } from "../src/charts/big/circular-graph.data";
import { forceGalaxyDemo } from "../src/charts/big/force-galaxy.data";
import {
  REACH,
  adjacencyOf,
  linkStepOf,
  nextByKey,
  pickNode,
  reachText,
  stepsFrom,
} from "../src/charts/network-steps";
import { sansWidth } from "../src/charts/util";
import { mount, pointerAt, press, stubBrowser, svgOf } from "./measured";

stubBrowser();

// a - b - c - d - e - f in a line, and g on its own.
const ids = ["a", "b", "c", "d", "e", "f", "g"];
const path = [
  { source: "a", target: "b" },
  { source: "b", target: "c" },
  { source: "c", target: "d" },
  { source: "d", target: "e" },
  { source: "e", target: "f" },
];

describe("steps out from a node", () => {
  const steps = stepsFrom(adjacencyOf(ids, path), "c");

  it("counts links, by breadth-first search, out to two steps", () => {
    expect([...steps]).toStrictEqual([
      ["c", 0],
      ["b", 1],
      ["d", 1],
      ["a", 2],
      ["e", 2],
    ]);
    expect(reachText(steps)).toBe("2 direct, 2 at two steps");
  });

  it("a node three steps away, or on its own, is not reached", () => {
    expect(steps.has("f")).toBe(false);
    expect(steps.has("g")).toBe(false);
    expect(reachText(stepsFrom(adjacencyOf(ids, path), "g"))).toBe("No links");
    expect(reachText(stepsFrom(adjacencyOf(ids, path), "a"))).toBe(
      "1 direct, 1 at two steps"
    );
    expect(
      reachText(
        stepsFrom(adjacencyOf(["x", "y"], [{ source: "x", target: "y" }]), "x")
      )
    ).toBe("1 direct");
  });

  it("a link is direct if it leaves the node, two steps if it leaves a neighbour, else the rest", () => {
    expect(linkStepOf(steps, "b", "c")).toBe(1);
    expect(linkStepOf(steps, "a", "b")).toBe(2);
    expect(linkStepOf(steps, "d", "e")).toBe(2);
    expect(linkStepOf(steps, "e", "f")).toBe(3);
    expect(linkStepOf(null, "a", "b")).toBe(0);
  });
});

describe("a target for tiny nodes", () => {
  const tiny = [
    { r: 2, x: 10, y: 10 },
    { r: 2, x: 50, y: 10 },
  ];

  it("a mouse reaches 14px past a node's edge, a finger 22px, and no further", () => {
    expect(pickNode(tiny, 10, 10 + 2 + REACH.mouse, REACH.mouse)).toBe(0);
    expect(pickNode(tiny, 10, 10 + 2 + REACH.mouse + 2, REACH.mouse)).toBe(-1);
    expect(pickNode(tiny, 10, 10 + 2 + REACH.touch, REACH.touch)).toBe(0);
    expect(pickNode(tiny, 10, 10 + 2 + REACH.touch + 2, REACH.touch)).toBe(-1);
  });

  it("between two nodes the nearer wins", () => {
    expect(pickNode(tiny, 28, 10, REACH.touch)).toBe(0);
    expect(pickNode(tiny, 32, 10, REACH.touch)).toBe(1);
  });

  it("a big node under the pointer beats a small one nearer its middle", () => {
    const mixed = [
      { r: 30, x: 0, y: 0 },
      { r: 2, x: 33, y: 0 },
    ];
    expect(pickNode(mixed, 29, 0, REACH.mouse)).toBe(0);
  });

  it("nothing to pick", () => {
    expect(pickNode([], 0, 0, REACH.touch)).toBe(-1);
  });
});

describe("keys", () => {
  const list = ["a", "b", "c"];

  it("arrows step through the nodes and wrap", () => {
    expect(nextByKey("ArrowRight", list, null)).toBe("a");
    expect(nextByKey("ArrowDown", list, "c")).toBe("a");
    expect(nextByKey("ArrowLeft", list, null)).toBe("c");
    expect(nextByKey("ArrowUp", list, "a")).toBe("c");
  });

  it("Home and End jump, Escape clears and other keys are left alone", () => {
    expect(nextByKey("Home", list, "b")).toBe("a");
    expect(nextByKey("End", list, "b")).toBe("c");
    expect(nextByKey("Escape", list, "b")).toBeNull();
    expect(nextByKey("Tab", list, "b")).toBeUndefined();
  });
});

const circleNodes = ids.map((id, i) => ({ id, value: 10 + i }));
const circleLinks = path.map((l) => ({ ...l, value: 5 }));
const ring = (props: { selected?: string } = {}) =>
  createElement(CircularGraph, {
    links: circleLinks,
    nodes: circleNodes,
    ...props,
  });

/** The text inside the chart's svg. */
const words = (host: Element) =>
  [...host.querySelectorAll("svg text")].map((t) => t.textContent);
/** The classes of each link bundle, in link order. */
const bundles = (host: Element) =>
  [...host.querySelectorAll('svg g[fill="none"]')].map(
    (g) => g.getAttribute("class") ?? ""
  );

describe(CircularGraph, () => {
  it("rests as it was: nothing selected, no count", async () => {
    const host = await mount(ring());
    expect(words(host).some((w) => w?.includes("direct"))).toBe(false);
    expect(host.querySelector('svg[tabindex="0"]')).not.toBeNull();
  });

  it("a preselected node fades the rest out from it, and names it with its reach", async () => {
    const host = await mount(ring({ selected: "c" }));
    expect(words(host)).toContain("2 direct, 2 at two steps");
    const [ab, bc, cd, de, ef] = bundles(host);
    expect([bc, cd].every((c) => c.includes("stroke-ink"))).toBe(true);
    expect([ab, de].every((c) => c.includes("stroke-l3"))).toBe(true);
    expect(ef).toContain("stroke-l5 opacity-40");
  });

  it("the selected node alone is solid", async () => {
    const host = await mount(ring({ selected: "c" }));
    expect(host.querySelectorAll("circle.fill-hero")).toHaveLength(1);
  });

  it("hovering a node selects it; the preselected node comes back when the pointer leaves", async () => {
    const host = await mount(ring({ selected: "a" }));
    const svg = svgOf(host);
    expect(words(host)).toContain("1 direct, 1 at two steps");
    const circles = [...svg.querySelectorAll("circle")];
    const at = (i: number) => ({
      x: Number(circles[i].getAttribute("cx")) + 1,
      y: Number(circles[i].getAttribute("cy")),
    });
    await pointerAt(svg, "pointermove", at(2));
    expect(words(host)).toContain("2 direct, 2 at two steps");
    expect(host.textContent).toContain("most with");
    await pointerAt(svg, "pointermove", { x: 0, y: 0 });
    expect(words(host)).toContain("1 direct, 1 at two steps");
  });

  it("a tap holds a node; a tap on empty space lets go", async () => {
    const host = await mount(ring());
    const svg = svgOf(host);
    const dot = svg.querySelectorAll("circle").item(4);
    await pointerAt(
      svg,
      "pointerdown",
      { x: Number(dot.getAttribute("cx")), y: Number(dot.getAttribute("cy")) },
      "touch"
    );
    expect(words(host)).toContain("2 direct, 1 at two steps");
    await pointerAt(svg, "pointerdown", { x: 1, y: 1 }, "touch");
    expect(words(host).some((w) => w?.includes("direct"))).toBe(false);
  });

  it("the arrow keys step through the nodes and Escape clears", async () => {
    const host = await mount(ring());
    const svg = svgOf(host);
    await press(svg, "ArrowRight");
    expect(words(host)).toContain("1 direct, 1 at two steps");
    await press(svg, "ArrowRight");
    await press(svg, "ArrowRight");
    expect(words(host)).toContain("2 direct, 2 at two steps");
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "c: 2 direct, 2 at two steps"
    );
    await press(svg, "Escape");
    expect(words(host).some((w) => w?.includes("direct"))).toBe(false);
  });
});

describe(CircularBeadGraph, () => {
  const data = {
    links: path.map((l) => ({ ...l, weight: 2 })),
    nodes: ids.map((id, i) => ({
      group: i < 4 ? "North" : "South",
      id,
      size: 3 + i,
    })),
  };

  /** How many ringed beads the chart draws. */
  const ringed = async (selected?: string) => {
    const host = await mount(
      createElement(CircularBeadGraph, { data, selected })
    );
    return svgOf(host).querySelectorAll("circle.fill-none.stroke-ink").length;
  };

  it("a preselected node's direct borders are ink, two steps mid, and its reach is named", async () => {
    const host = await mount(
      createElement(CircularBeadGraph, { data, selected: "c" })
    );
    expect(words(host)).toContain("2 direct, 2 at two steps");
    const focus = svgOf(host).querySelector("g.pointer-events-none");
    expect(focus?.querySelectorAll("g.stroke-ink path")).toHaveLength(2);
    expect(focus?.querySelectorAll("g.stroke-l3 path")).toHaveLength(2);
    expect(svgOf(host).dataset.focus).toBe("true");
  });

  it("the selected bead wears a ring a gap off its edge, and nothing else does", async () => {
    await expect(ringed("c")).resolves.toBe(1);
    await expect(ringed()).resolves.toBe(0);
  });

  it("a hover reaches a bead a few pixels wide from beside it", async () => {
    const host = await mount(createElement(CircularBeadGraph, { data }));
    const svg = svgOf(host);
    const [, bead] = svg.querySelectorAll("circle.pop");
    await pointerAt(svg, "pointermove", {
      x: Number(bead.getAttribute("cx")) + 10,
      y: Number(bead.getAttribute("cy")),
    });
    expect(words(host).some((w) => w?.includes("direct"))).toBe(true);
  });
});

describe(ForceGraph, () => {
  const nodes = [
    { id: "Hub", value: 40 },
    { id: "One", value: 10 },
    { id: "Two", value: 8 },
    { id: "Three", value: 6 },
    { id: "Far", value: 3 },
  ];
  const links = [
    { source: "Hub", target: "One", value: 5 },
    { source: "Hub", target: "Two", value: 4 },
    { source: "Hub", target: "Three", value: 3 },
    { source: "One", target: "Far", value: 1 },
  ];

  it("a preselected node is named with its reach and everything else fades by links", async () => {
    const host = await mount(
      createElement(ForceGraph, { links, nodes, selected: "Hub" })
    );
    expect(words(host)).toContain("3 direct, 1 at two steps");
    const classes = [...host.querySelectorAll('svg g[fill="none"]')].map(
      (g) => g.getAttribute("class") ?? ""
    );
    expect(classes.filter((c) => c.includes("stroke-ink"))).toHaveLength(3);
    expect(classes.filter((c) => c.includes("stroke-l3"))).toHaveLength(1);
  });

  it("hovering a satellite selects it", async () => {
    const host = await mount(createElement(ForceGraph, { links, nodes }));
    const svg = svgOf(host);
    const one = svg.querySelectorAll("circle").item(3);
    await pointerAt(svg, "pointermove", {
      x: Number(one.getAttribute("cx")),
      y: Number(one.getAttribute("cy")),
    });
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toMatch(
      /^[A-Za-z]+: \d+ direct/u
    );
  });
});

describe(ForceGalaxy, () => {
  const start = forceGalaxyDemo.nodes[0].id;

  it("a preselected star lights itself, what it reaches, and the rest fades", async () => {
    const host = await mount(createElement(ForceGalaxy, { selected: start }));
    const svg = svgOf(host);
    expect(svg.dataset.focus).toBe("true");
    expect(svg.querySelectorAll('[data-step="0"]').length).toBeGreaterThan(0);
    expect(svg.querySelectorAll('[data-step="1"]').length).toBeGreaterThan(0);
    expect(host.querySelector('[aria-live="polite"]')?.textContent).toMatch(
      new RegExp(`^${start}: \\d+ direct`, "u")
    );
    const caption = [...svg.querySelectorAll("g[data-id]")].find(
      (g) => g.getAttribute("visibility") === "visible"
    );
    expect(caption?.textContent).toContain(start);
  });

  it("with nothing selected nothing is lit; the arrow keys select, Escape clears", async () => {
    const host = await mount(createElement(ForceGalaxy, {}));
    const svg = svgOf(host);
    expect(svg.dataset.focus).not.toBe("true");
    await press(svg, "ArrowRight");
    expect(svg.dataset.focus).toBe("true");
    await press(svg, "Escape");
    expect(svg.dataset.focus).toBe("false");
    expect(svg.querySelectorAll("[data-step]")).toHaveLength(0);
  });
});

const nameAndNote = async (selected: string) => {
  const host = await mount(
    createElement(CircularBeadGraph, { data: circularGraphDemo, selected })
  );
  const svg = svgOf(host);
  const note = [...svg.querySelectorAll("text")].find((t) =>
    t.textContent?.includes("direct")
  );
  const name = note?.previousElementSibling;
  if (note === undefined || name?.textContent !== selected) {
    throw new Error("The caption was not drawn");
  }
  return { discs: svg.querySelectorAll("circle"), name, note };
};

describe("the ring's selection caption", () => {
  it.each(["Germany", "France", "Brazil", "Austria"])(
    "%s: sits inside the ring and touches no node",
    async (selected) => {
      const { discs, name, note } = await nameAndNote(selected);
      const spot = {
        x: Number(name.getAttribute("x")),
        y:
          (Number(name.getAttribute("y")) + Number(note.getAttribute("y"))) / 2,
      };
      const w = Math.max(
        sansWidth(selected, 11),
        sansWidth(note.textContent ?? "", 11)
      );
      const touching = [...discs].filter((c) =>
        touchesDisc(spot, w, 26, {
          r: Number(c.getAttribute("r")),
          x: Number(c.getAttribute("cx")),
          y: Number(c.getAttribute("cy")),
        })
      );
      expect(touching).toHaveLength(0);
    }
  );

  it("is centred, not beside the node", async () => {
    const { name } = await nameAndNote("Germany");
    expect(name.getAttribute("text-anchor")).toBe("middle");
  });
});

describe(captionSpot, () => {
  const frame = { R: 100, cx: 0, cy: 0 };

  it("avoids a node and prefers the spot the fewest links cross", () => {
    const wall: Cubic = [
      { x: -60, y: -60 },
      { x: -60, y: -20 },
      { x: -60, y: 20 },
      { x: -60, y: 60 },
    ];
    const spot = captionSpot(
      frame,
      { h: 26, w: 60 },
      [{ r: 8, x: 0, y: 0 }],
      [wall]
    );
    expect(touchesDisc(spot, 60, 26, { r: 8, x: 0, y: 0 })).toBe(false);
    expect(Math.hypot(spot.x, spot.y)).toBeLessThan(90);
  });

  it("falls back to the centre when the ring is too small for the box", () => {
    expect(
      captionSpot({ R: 20, cx: 5, cy: 5 }, { h: 26, w: 60 }, [], [])
    ).toStrictEqual({ x: 5, y: 5 });
  });
});
