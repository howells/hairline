import { readFileSync } from "node:fs";
import path from "node:path";

// @vitest-environment jsdom
// Seam 1: the options every chart shares, run against all six through the
// registry the way a consumer meets them. Each option is one test over every
// chart, so a chart that misses one fails by name. Run with `pnpm test`.
import {
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  RangeDots,
  RungBars,
  Slope,
} from "@howells/hairline";
import type {
  DumbbellQueueProps,
  HairlineAreaProps,
  HairlineLineProps,
  PlumbScatterProps,
  RangeDotsProps,
  RungBarsProps,
  SlopeProps,
} from "@howells/hairline";
import { Plot, Tooltip } from "@howells/hairline/kit";
import { charts } from "@howells/hairline/schema";
import type { ChartKind, Payload, sharedShape } from "@howells/hairline/schema";
import { act, createElement } from "react";
import type { ComponentProps, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
vi.stubGlobal("matchMedia", (media: string) => ({
  addEventListener: vi.fn<() => void>(),
  matches: false,
  media,
  removeEventListener: vi.fn<() => void>(),
}));

/** The shared options, as a consumer passes them. */
type Extra = Partial<z.input<z.ZodObject<typeof sharedShape>>> & {
  onReady?: () => void;
  unitNote?: string;
};

/** What a builder takes: the shared options, and the size. */
type Own = Extra & { height?: number; width?: number };

const sized = { height: 320, width: 480 };
const days = [
  { date: "2024-03-04", value: 3 },
  { date: "2024-03-05", value: 5 },
  { date: "2024-03-06", value: 4 },
  { date: "2024-03-07", value: 6 },
];

const payloads = {
  "dumbbell-queue": {
    data: [
      { after: 9, before: 4, label: "Oak" },
      { after: 3, before: 7, label: "Ash" },
    ],
  },
  "hairline-area": { data: days },
  "hairline-line": { data: days },
  "plumb-scatter": {
    data: [
      { label: "Oak", x: 1, y: 4 },
      { label: "Ash", x: 3, y: 2 },
      { label: "Elm", x: 5, y: 6 },
    ],
  },
  "range-dots": {
    data: [
      { estimate: 40, high: 46, label: "Oak", low: 34 },
      { estimate: 20, high: 30, label: "Ash", low: 10 },
    ],
  },
  "rung-bars": {
    data: [
      { label: "Oak", value: 19 },
      { label: "Ash", value: 11 },
    ],
  },
  slope: {
    labels: ["2023", "2024"],
    rows: [
      { from: 280, name: "Oak", to: 120 },
      { from: 200, name: "Ash", to: 240 },
    ],
  },
} satisfies {
  "dumbbell-queue": DumbbellQueueProps;
  "hairline-area": HairlineAreaProps;
  "hairline-line": HairlineLineProps;
  "plumb-scatter": PlumbScatterProps;
  "range-dots": RangeDotsProps;
  "rung-bars": RungBarsProps;
  slope: SlopeProps;
};

/** What each chart's data table must list: a name from its data, as printed. */
const named = {
  "dumbbell-queue": "Oak",
  "hairline-area": "5 Mar",
  "hairline-line": "5 Mar",
  "plumb-scatter": "Oak",
  "range-dots": "Oak",
  "rung-bars": "Oak",
  slope: "Oak",
} satisfies Record<ChartKind, string>;

const kinds = [
  "dumbbell-queue",
  "hairline-area",
  "hairline-line",
  "plumb-scatter",
  "range-dots",
  "rung-bars",
  "slope",
] as const satisfies readonly ChartKind[];
/** The five with an in-plot footnote; Slope has none. */
const noted = kinds.filter((kind) => kind !== "slope");
const NOTE = "One mark = one reading";

/** Every chart's element for the payload and options, by kind. */
const builders = {
  "dumbbell-queue": (own: Own) =>
    createElement(DumbbellQueue, { ...payloads["dumbbell-queue"], ...own }),
  "hairline-area": (own: Own) =>
    createElement(HairlineArea, { ...payloads["hairline-area"], ...own }),
  "hairline-line": (own: Own) =>
    createElement(HairlineLine, { ...payloads["hairline-line"], ...own }),
  "plumb-scatter": (own: Own) =>
    createElement(PlumbScatter, { ...payloads["plumb-scatter"], ...own }),
  "range-dots": (own: Own) =>
    createElement(RangeDots, { ...payloads["range-dots"], ...own }),
  "rung-bars": (own: Own) =>
    createElement(RungBars, { ...payloads["rung-bars"], ...own }),
  slope: ({ unitNote: _note, ...own }: Own) =>
    createElement(Slope, { ...payloads.slope, ...own }),
} satisfies Record<ChartKind, (own: Own) => ReactElement>;

/** A chart by kind, in fixed size unless `fixed` is false. */
const element = (kind: ChartKind, extra: Extra, fixed = true): ReactElement =>
  builders[kind]({
    ...extra,
    height: fixed ? sized.height : undefined,
    width: fixed ? sized.width : undefined,
  });

const render = (kind: ChartKind, extra: Extra = {}) =>
  renderToString(element(kind, extra));
const tag = (html: string, name: string) =>
  new RegExp(`<${name}[^>]*>`, "u").exec(html)?.[0] ?? "";
const ids = (html: string) =>
  [...html.matchAll(/\sid="(?<id>[^"]*)"/gu)].map((m) => m.groups?.id ?? "");

/** The issue pointers of a payload the registry rejects; empty when it passes. */
const pointers = (kind: ChartKind, payload: Payload) => {
  const checked = charts[kind].validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

/** A chart mounted in a real root, torn down by `done`. */
const mount = async (kind: ChartKind, extra: Extra) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(element(kind, extra));
    await Promise.resolve();
  });
  return {
    done: async () => {
      await act(async () => {
        root.unmount();
        await Promise.resolve();
      });
      host.remove();
    },
    host,
  };
};

describe.each(kinds)("%s shares the options", (kind) => {
  it("takes every shared option through the registry, and refuses bad ones", () => {
    expect(
      pointers(kind, {
        ...payloads[kind],
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
      pointers(kind, {
        ...payloads[kind],
        animate: "sometimes",
        idPrefix: "1 bad",
        scale: -1,
        strokes: "thick",
        title: "",
      }).toSorted()
    ).toStrictEqual(["animate", "idPrefix", "scale", "strokes", "title"]);
  });

  it("lists them in its emitted JSON Schema", () => {
    const json = z
      .object({ properties: z.record(z.string(), z.object({})) })
      .parse(
        JSON.parse(
          readFileSync(
            path.join(process.cwd(), "lib", "json-schema", `${kind}.json`),
            "utf-8"
          )
        )
      );
    expect(Object.keys(json.properties)).toStrictEqual(
      expect.arrayContaining([
        "animate",
        "fit",
        "idPrefix",
        "metrics",
        "replayKey",
        "scale",
        "strokes",
        "table",
        "title",
      ])
    );
  });

  it("draws its plot in fixed size on the server", () => {
    const html = render(kind);
    expect(html).toContain("<svg");
    expect(html).toContain("</svg>");
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
    expect(
      tag(render(kind, { scale: 2, strokes: "proportional" }), "svg")
    ).not.toContain("data-hl-strokes");
  });

  it("a scaled chart defaults to device strokes; an unscaled one carries no mark", () => {
    expect(tag(render(kind, { scale: 2 }), "svg")).toContain(
      'data-hl-strokes="device"'
    );
    expect(tag(render(kind, { fit: true }), "svg")).toContain(
      'data-hl-strokes="device"'
    );
    expect(tag(render(kind), "svg")).not.toContain("data-hl-strokes");
  });

  it("idPrefix leads every id", () => {
    const own = ids(render(kind, { idPrefix: "deck1" }));
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((id) => id.startsWith("deck1"))).toBe(true);
    expect(ids(render(kind)).some((id) => id.startsWith("deck1"))).toBe(false);
  });

  it("title is the accessible name; without one the chart still has one", () => {
    expect(tag(render(kind, { title: "Trees by count" }), "svg")).toContain(
      'aria-label="Trees by count"'
    );
    expect(tag(render(kind), "svg")).toMatch(/aria-label="[^"]+"/u);
  });

  it("describes the payload in a desc the svg points at", () => {
    const html = render(kind);
    const target = /aria-describedby="(?<id>[^"]+)"/u.exec(tag(html, "svg"))
      ?.groups?.id;
    expect(target).toBeDefined();
    expect(html).toMatch(new RegExp(`<desc id="${target}">[^<]+</desc>`, "u"));
  });

  it("carries a hidden data table in the first HTML that table: true shows", () => {
    const hidden = render(kind);
    expect(hidden).toContain('<div class="sr-only"><table>');
    expect(hidden).toContain(`>${named[kind]}<`);
    const shown = tag(render(kind, { table: true }), "table");
    expect(shown).toContain("<table");
    expect(shown).not.toContain("sr-only");
  });

  it("has the table before a width is known, in responsive mode", () => {
    const html = renderToString(element(kind, {}, false));
    expect(html).toContain('<div class="sr-only"><table>');
    expect(html).toContain(`>${named[kind]}<`);
    expect(html).not.toContain("<svg");
  });

  it('animate="off" is drawn and ready in the first HTML, and so is a fixed-size chart by default', () => {
    expect(render(kind, { animate: "off" })).toContain('data-hl-ready="true"');
    expect(render(kind)).toContain('data-hl-ready="true"');
  });

  it("asking a fixed-size chart to animate starts it hidden and not ready", () => {
    for (const animate of ["scroll", "mount"] as const) {
      const html = render(kind, { animate });
      expect(html).toContain("is-hidden");
      expect(html).not.toContain('data-hl-ready="true"');
    }
  });

  it("sets its text through the roles, so --hl-font reaches every label", () => {
    const html = render(kind, { unitNote: NOTE });
    expect(html).toMatch(/\bt-(?:axis|label|value)\b/u);
    expect(html).not.toMatch(/\btext-tick\b|\bfont-(?:medium|semibold)\b/u);
  });

  it("metrics for another face change the layout", () => {
    const wide = { advances: {}, fallback: 3 };
    expect(render(kind, { metrics: wide, unitNote: NOTE })).not.toBe(
      render(kind, { unitNote: NOTE })
    );
  });

  it("onReady is called once when an off chart mounts", async () => {
    const onReady = vi.fn<() => void>();
    const { done, host } = await mount(kind, { animate: "off", onReady });
    expect(onReady).toHaveBeenCalledOnce();
    expect(host.querySelector('[data-hl-ready="true"]')).not.toBeNull();
    await done();
  });
});

describe.each(noted)("%s reserves room for a note in another face", (kind) => {
  it("shows the note, which a very wide face has no room for", () => {
    const wide = { advances: {}, fallback: 3 };
    expect(render(kind, { unitNote: NOTE })).toContain(NOTE);
    expect(render(kind, { metrics: wide, unitNote: NOTE })).not.toContain(NOTE);
  });
});

const tipProps = (): ComponentProps<typeof Tooltip> => ({
  children: "tip",
  x: 100,
  y: 40,
});
const plotProps = (scaling: {
  fit?: boolean;
  scale?: number;
}): ComponentProps<typeof Plot> => ({
  children: () => null,
  overlay: createElement(Tooltip, tipProps()),
  scaling,
  width: 480,
});

const tipStyle = (scaling: { fit?: boolean; scale?: number }) => {
  const html = renderToString(createElement(Plot, plotProps(scaling)));
  return /<output[^>]*style="(?<style>[^"]*)"/u.exec(html)?.groups?.style;
};

/**
 * Where a daily chart anchors its tip: the pointer sweeps the drawing, a
 * pixel step at a time (in screen pixels, `scale` times as many), until it
 * is near enough a reading to show one.
 */
const tipLeft = async (
  kind: "hairline-area" | "hairline-line",
  scale: number
) => {
  const { done, host } = await mount(kind, { animate: "off", scale });
  const svg = host.querySelector("svg");
  if (svg === null) {
    throw new Error("the chart drew no svg");
  }
  svg.getBoundingClientRect = () => new DOMRect(0, 0, 480 * scale, 320 * scale);
  const sweep = async (x: number): Promise<void> => {
    await act(async () => {
      svg.dispatchEvent(
        new MouseEvent("pointermove", { bubbles: true, clientX: x * scale })
      );
      await Promise.resolve();
    });
    if (host.querySelector("[data-hl-tip]") === null && x < 480) {
      await sweep(x + 4);
    }
  };
  await sweep(0);
  const style =
    host.querySelector("[data-hl-tip]")?.getAttribute("style") ?? "";
  await done();
  return Number(/left:\s*(?<px>[\d.]+)px/u.exec(style)?.groups?.px);
};

describe("tooltips sit on their marks when scaled", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("an overlay anchor given in chart pixels is placed scale times further", () => {
    expect(tipStyle({})).toContain("left:100px;top:40px");
    expect(tipStyle({ scale: 2.5 })).toContain("left:250px;top:100px");
  });

  it("fit already draws at the container's size, so nothing moves", () => {
    expect(tipStyle({ fit: true, scale: 2.5 })).toContain(
      "left:100px;top:40px"
    );
  });

  it.each(["hairline-line", "hairline-area"] as const)(
    "%s finds the nearest reading from a scaled pointer and anchors on it",
    async (kind) => {
      const unscaled = await tipLeft(kind, 1);
      const scaled = await tipLeft(kind, 2);
      expect(unscaled).toBeGreaterThan(0);
      // The tip stands a fixed 12px off its mark; the mark itself moves with the scale.
      expect(scaled - 12).toBeCloseTo((unscaled - 12) * 2, 5);
    }
  );
});
