// @vitest-environment jsdom
// Seam 1: the options every chart shares, run against all six through the
// registry the way a consumer meets them. Each option is one test over every
// chart, so a chart that misses one fails by name. Run with `pnpm test`.
import * as hairline from "@howells/hairline";
import { Plot, Tooltip } from "@howells/hairline/kit";
import { charts } from "@howells/hairline/schema";
import { act, createElement } from "react";
import type { ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

const sized = { height: 320, width: 480 };
const days = [
  { date: "2024-03-04", value: 3 },
  { date: "2024-03-05", value: 5 },
  { date: "2024-03-06", value: 4 },
  { date: "2024-03-07", value: 6 },
];

interface Case {
  /** A name that must appear in the data table. */
  name: string;
  payload: Record<string, unknown>;
}

const cases = {
  "dumbbell-queue": {
    name: "Oak",
    payload: {
      data: [
        { after: 9, before: 4, label: "Oak" },
        { after: 3, before: 7, label: "Ash" },
      ],
    },
  },
  "hairline-area": { name: "2024-03-05", payload: { data: days } },
  "hairline-line": { name: "2024-03-05", payload: { data: days } },
  "plumb-scatter": {
    name: "Oak",
    payload: {
      data: [
        { label: "Oak", x: 1, y: 4 },
        { label: "Ash", x: 3, y: 2 },
        { label: "Elm", x: 5, y: 6 },
      ],
    },
  },
  "rung-bars": {
    name: "Oak",
    payload: {
      data: [
        { label: "Oak", value: 19 },
        { label: "Ash", value: 11 },
      ],
    },
  },
  slope: {
    name: "Oak",
    payload: {
      labels: ["2023", "2024"],
      rows: [
        { from: 280, name: "Oak", to: 120 },
        { from: 200, name: "Ash", to: 240 },
      ],
    },
  },
} satisfies Record<keyof typeof charts, Case>;

const kinds = Object.keys(cases) as (keyof typeof cases)[];
/**
 * A chart by its component name, taking the loose payloads this test builds.
 * The cast is the I/O boundary: payloads are checked by the registry's schema.
 */
const component = (
  name: string
): ComponentType<Record<string, unknown>> =>
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- payloads are validated by the schema, not the component's static props
  Reflect.get(hairline, name) as ComponentType<Record<string, unknown>>;

const render = (kind: keyof typeof cases, extra: Record<string, unknown>) =>
  renderToString(
    createElement(component(charts[kind].component), {
      ...cases[kind].payload,
      ...sized,
      ...extra,
    })
  );
const tag = (html: string, name: string) =>
  new RegExp(`<${name}[^>]*>`, "u").exec(html)?.[0] ?? "";
const ids = (html: string) =>
  [...html.matchAll(/\sid="(?<id>[^"]*)"/gu)].map((m) => m.groups?.id ?? "");
/** The fixed note every chart with a footnote is given for the metrics test. */
const NOTE = "One mark = one reading";

const issues = (kind: keyof typeof cases, payload: Record<string, unknown>) => {
  const checked = charts[kind].validate({ ...cases[kind].payload, ...payload });
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe.each(kinds)("%s shares the options", (kind) => {
  it("takes every shared option through the registry, and refuses bad ones", () => {
    expect(
      issues(kind, {
        animate: "mount",
        fit: false,
        idPrefix: "deck1",
        metrics: { advances: { a: 0.5 }, fallback: 0.6 },
        replayKey: 2,
        scale: 2.5,
        strokes: "device",
        table: true,
        title: "A title",
      })
    ).toStrictEqual([]);
    expect(
      issues(kind, {
        animate: "sometimes",
        idPrefix: "1 bad",
        scale: -1,
        strokes: "thick",
        title: "",
      }).toSorted()
    ).toStrictEqual(["animate", "idPrefix", "scale", "strokes", "title"]);
  });

  it("lists them in its emitted JSON Schema", async () => {
    const { readFileSync } = await import("node:fs");
    const json = z
      .object({ properties: z.record(z.string(), z.unknown()) })
      .parse(
        JSON.parse(
          readFileSync(
            new URL(`../lib/json-schema/${kind}.json`, import.meta.url),
            "utf-8"
          )
        )
      );
    for (const option of [
      "animate",
      "fit",
      "idPrefix",
      "metrics",
      "replayKey",
      "scale",
      "strokes",
      "table",
      "title",
    ]) {
      expect(Object.keys(json.properties)).toContain(option);
    }
  });

  it("scale draws at the logical width and shows it larger through the viewBox", () => {
    const svg = tag(render(kind, { scale: 2.5 }), "svg");
    expect(svg).toContain('width="1200"');
    expect(svg).toContain('height="800"');
    expect(svg).toContain('viewBox="0 0 480 320"');
  });

  it("fit fills the container at the chart's aspect ratio", () => {
    const svg = tag(render(kind, { fit: true }), "svg");
    expect(svg).toContain('width="100%"');
    expect(svg).toContain("aspect-ratio:480 / 320");
  });

  it("strokes device marks every stroke as one device pixel", () => {
    expect(tag(render(kind, { scale: 2, strokes: "device" }), "svg")).toContain(
      'data-hl-strokes="device"'
    );
    expect(tag(render(kind, { scale: 2 }), "svg")).not.toContain(
      "data-hl-strokes"
    );
  });

  it("idPrefix leads every id", () => {
    const own = ids(render(kind, { idPrefix: "deck1" }));
    expect(own.length).toBeGreaterThan(0);
    for (const id of own) {
      expect(id.startsWith("deck1")).toBe(true);
    }
    expect(ids(render(kind, {})).some((id) => id.startsWith("deck1"))).toBe(
      false
    );
  });

  it("title is the accessible name; without one the chart still has one", () => {
    expect(tag(render(kind, { title: "Trees by count" }), "svg")).toContain(
      'aria-label="Trees by count"'
    );
    expect(tag(render(kind, {}), "svg")).toMatch(/aria-label="[^"]+"/u);
  });

  it("describes the payload in a desc the svg points at", () => {
    const html = render(kind, {});
    const svg = tag(html, "svg");
    const target = /aria-describedby="(?<id>[^"]+)"/u.exec(svg)?.groups?.id;
    expect(target).toBeDefined();
    expect(html).toMatch(new RegExp(`<desc id="${target}">[^<]+</desc>`, "u"));
  });

  it("carries a hidden data table, in the first HTML, that table: true shows", () => {
    const hidden = render(kind, {});
    expect(tag(hidden, "table")).toContain("sr-only");
    expect(hidden).toContain(cases[kind].name);
    const shown = tag(render(kind, { table: true }), "table");
    expect(shown).toContain("<table");
    expect(shown).not.toContain("sr-only");
  });

  it("has the table before a width is known, in responsive mode", () => {
    const html = renderToString(
      createElement(component(charts[kind].component), {
        ...cases[kind].payload,
      })
    );
    expect(tag(html, "table")).toContain("sr-only");
    expect(html).not.toContain("<svg");
  });

  it('animate="off" is drawn and ready in the first HTML; the default is not', () => {
    expect(render(kind, { animate: "off" })).toContain('data-hl-ready="true"');
    expect(render(kind, {})).not.toContain('data-hl-ready="true"');
  });

  it("metrics for another face change the layout", () => {
    const wide = { advances: {}, fallback: 3 };
    const plain = render(kind, { unitNote: NOTE });
    const measured = render(kind, { metrics: wide, unitNote: NOTE });
    expect(measured).not.toBe(plain);
    if (kind !== "slope") {
      expect(plain).toContain(NOTE);
      expect(measured).not.toContain(NOTE);
    }
  });

  it("onReady is called when an off chart mounts", async () => {
    const onReady = vi.fn();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(component(charts[kind].component), {
          ...cases[kind].payload,
          ...sized,
          animate: "off",
          onReady,
        })
      );
    });
    expect(onReady).toHaveBeenCalledTimes(1);
    expect(host.querySelector('[data-hl-ready="true"]')).not.toBeNull();
    await act(async () => {
      root.unmount();
    });
    host.remove();
  });
});

describe("tooltips sit on their marks when scaled", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  const tipAt = (scaling: Record<string, unknown>) => {
    const html = renderToString(
      createElement(Plot, {
        children: () => null,
        overlay: createElement(Tooltip, { children: "tip", x: 100, y: 40 }),
        scaling,
        width: 480,
      })
    );
    return /<output[^>]*style="(?<style>[^"]*)"/u.exec(html)?.groups?.style;
  };

  it("an overlay anchor given in chart pixels is placed scale times further", () => {
    expect(tipAt({})).toContain("left:100px;top:40px");
    expect(tipAt({ scale: 2.5 })).toContain("left:250px;top:100px");
  });

  it("fit already draws at the container's size, so nothing moves", () => {
    expect(tipAt({ fit: true, scale: 2.5 })).toContain("left:100px;top:40px");
  });

  const leftAfterMove = async (
    kind: "hairline-area" | "hairline-line",
    scale: number | undefined,
    clientX: number
  ) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(
        createElement(component(charts[kind].component), {
          ...cases[kind].payload,
          ...sized,
          animate: "off",
          scale,
        })
      );
    });
    const svg = host.querySelector("svg");
    if (svg === null) {
      throw new Error("no svg");
    }
    svg.getBoundingClientRect = () =>
      new DOMRect(0, 0, 480 * (scale ?? 1), 320 * (scale ?? 1));
    await act(async () => {
      svg.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX })
      );
    });
    const style = host.querySelector("output")?.getAttribute("style") ?? "";
    await act(async () => {
      root.unmount();
    });
    return Number.parseFloat(/left:\s*([\d.]+)px/u.exec(style)?.[1] ?? "NaN");
  };

  it.each(["hairline-line", "hairline-area"] as const)(
    "%s finds the nearest reading from a scaled pointer and anchors on it",
    async (kind) => {
      const unscaled = await leftAfterMove(kind, undefined, 240);
      const scaled = await leftAfterMove(kind, 2, 480);
      expect(unscaled).toBeGreaterThan(0);
      expect(scaled).toBeCloseTo(unscaled * 2, 5);
    }
  );
});
