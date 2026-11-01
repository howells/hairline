import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { RungBars } from "@howells/hairline";
import type { RungBarsProps, RungDatum } from "@howells/hairline";
// Seam 1: the built package, used the way a consumer uses it. Look a chart up
// in the registry by kind, validate a JSON payload, render on the server.
// Run with `pnpm test`, which builds lib/ first.
import type { Payload } from "@howells/hairline/schema";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

const bars: RungDatum[] = [
  { label: "2021", value: 19 },
  { label: "2022", value: 11 },
  { label: "2023", value: 7 },
];
const sized = { height: 320, width: 480 };

const render = (props: RungBarsProps) =>
  renderToString(createElement(RungBars, props));

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
/** Every rung is one rect of class grow-x; the hero column's are fill-hero. */
const rungs = (html: string) => count(html, /class="grow-x/gu);
const heroRungs = (html: string) => count(html, /class="grow-x fill-hero"/gu);
const noteLineCount = (html: string) => count(html, /class="t-axis"/gu);
const hero = (data: RungDatum[], emphasis?: string) =>
  heroRungs(render({ data, emphasis, ...sized }));

/** The issue pointers of a failed validation; empty when it passed. */
const pointers = (payload: Payload) => {
  const checked = getChart("rung-bars").validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders RungBars through the registry", () => {
  const chart = getChart("rung-bars");

  it("a validated payload renders a complete svg with marks and labels", () => {
    const checked = chart.validate({ data: bars, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="320"');
    expect(html).toContain("</svg>");
    expect(
      ["2021", "2022", "2023", "19"].map((t) => html.includes(`>${t}<`))
    ).toStrictEqual([true, true, true, true]);
    expect(rungs(html)).toBe(37);
  });

  it("an invalid payload returns path-specific issues", () => {
    const bad = chart.validate({
      data: [{ label: "a", value: "12" }, { label: "b" }],
      flavour: "mint",
    });
    const issues = bad.ok ? [] : bad.issues;
    expect(issues.map((i) => i.pointer).toSorted()).toStrictEqual([
      "",
      "data[0].value",
      "data[1].value",
    ]);
    expect(
      issues.find((i) => i.pointer === "data[0].value")?.path
    ).toStrictEqual(["data", 0, "value"]);
  });

  it("emphasis is checked against the bars once the rest is sound", () => {
    expect(pointers({ data: bars, emphasis: "nope" })).toStrictEqual([
      "emphasis",
    ]);
  });

  it("missing data is the only issue", () => {
    expect(pointers(sized)).toStrictEqual(["data"]);
  });

  it("missing data never renders demo data", () => {
    // @ts-expect-error -- a JavaScript caller can leave data out
    const html = render({ height: 300, width: 400 });
    expect(rungs(html)).toBe(0);
    expect(html).not.toContain("2016");
  });
});

describe("the registry", () => {
  it("lists rung-bars with its job, shape, limits and guidance", () => {
    const entry = getChart("rung-bars");
    expect(entry.jobs[0]).toBe("magnitude");
    expect(entry.component).toBe("RungBars");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(entry.limits.categories?.max).toBeGreaterThan(1);
    expect(registry.map((c) => c.kind)).toContain("rung-bars");
  });

  it("an unknown kind is undefined", () => {
    expect(getChart("no-such-chart")).toBeUndefined();
  });

  it("the schema entry imports without React", () => {
    // A resolve hook that fails on any React specifier, then the schema entry.
    const script = `import { registerHooks } from "node:module";
      registerHooks({ resolve(s, c, next) {
        if (/^react(?:-dom)?(?:\\/|$)/u.test(s)) throw new Error("React imported: " + s);
        return next(s, c);
      } });
      await import("@howells/hairline/schema");`;
    expect(() =>
      execFileSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: new URL("..", import.meta.url),
        stdio: "pipe",
      })
    ).not.toThrow();
    const entry = readFileSync(
      new URL("../lib/schema.js", import.meta.url),
      "utf-8"
    );
    expect(entry.startsWith('"use client"')).toBe(false);
  });

  it("a JSON Schema is emitted at build", () => {
    const json = z
      .object({
        additionalProperties: z.literal(false),
        properties: z.record(z.string(), z.unknown()),
        required: z.array(z.string()),
      })
      .parse(
        JSON.parse(
          readFileSync(
            new URL("../lib/json-schema/rung-bars.json", import.meta.url),
            "utf-8"
          )
        )
      );
    expect(json.required).toStrictEqual(["data"]);
    expect(Object.keys(json.properties).toSorted()).toStrictEqual([
      "animate",
      "data",
      "emphasis",
      "fit",
      "format",
      "height",
      "idPrefix",
      "initialWidth",
      "metrics",
      "note",
      "replayKey",
      "scale",
      "strokes",
      "table",
      "title",
      "unit",
      "unitNote",
      "width",
    ]);
  });
});

describe("formatters are data", () => {
  it("a preset", () => {
    const html = render({
      data: [{ label: "a", value: 0.5 }],
      format: "percent",
      ...sized,
    });
    expect(html).toContain(">50%<");
  });

  it("Intl number-format options", () => {
    const html = render({
      data: [{ label: "a", value: 1234.5 }],
      format: { currency: "USD", maximumFractionDigits: 0, style: "currency" },
      ...sized,
    });
    expect(html).toContain(">$1,235<");
  });

  it("a function, from TypeScript", () => {
    const html = render({
      data: bars,
      format: (v) => `${v} quakes`,
      ...sized,
    });
    expect(html).toContain(">19 quakes<");
  });

  it("an unknown preset is rejected", () => {
    expect(pointers({ data: bars, format: "bogus" })).not.toHaveLength(0);
  });
});

describe("emphasis", () => {
  it("follows its key when the data is sorted", () => {
    const sorted = bars.toSorted((a, b) => a.value - b.value);
    expect([
      hero(bars, "2023"),
      hero(sorted, "2023"),
      hero(sorted, "2022"),
    ]).toStrictEqual([7, 7, 11]);
  });

  it("lets an id tell apart bars that share a label", () => {
    const twins: RungDatum[] = [
      { id: "a", label: "Same", value: 3 },
      { id: "b", label: "Same", value: 5 },
    ];
    expect([hero(twins, "a"), hero(twins.toReversed(), "a")]).toStrictEqual([
      3, 3,
    ]);
  });

  it("defaults to the largest bar", () => {
    expect(hero(bars)).toBe(19);
  });
});

describe("degenerate data", () => {
  const cases = {
    duplicates: [
      { label: "x", value: 2 },
      { label: "x", value: 3 },
    ],
    empty: [],
    infinite: [
      { label: "x", value: Number.POSITIVE_INFINITY },
      { label: "y", value: 2 },
    ],
    nan: [
      { label: "x", value: Number.NaN },
      { label: "y", value: 2 },
    ],
    negative: [
      { label: "x", value: -4 },
      { label: "y", value: 2 },
    ],
    "only negative": [{ label: "x", value: -4 }],
    single: [{ label: "x", value: 5 }],
    zero: [{ label: "x", value: 0 }],
  } satisfies Record<string, RungDatum[]>;

  it.each(Object.entries(cases))(
    "%s renders without throwing",
    (_name, data) => {
      for (const size of [sized, { initialWidth: 480 }]) {
        const html = render({ data, ...size });
        expect(html).toContain("<svg");
        expect(html).toContain("</svg>");
        expect(html).not.toContain("NaN");
        expect(html).not.toContain("Infinity");
      }
    }
  );

  it("a datum that is not a finite number is skipped", () => {
    expect(rungs(render({ data: cases.nan, ...sized }))).toBe(2);
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    const html = render({ data: [{ label: "a", value: 2 }], ...sized });
    expect(html).toContain('height="320"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ data: bars, initialWidth: 600 });
    expect(html).toContain('width="600"');
    expect(html).toContain("</svg>");
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ data: bars })).not.toContain("<svg");
  });
});

const svgOf = (props: RungBarsProps) =>
  /<svg[^>]*>/u.exec(render(props))?.[0] ?? "";

describe("scale for slides", () => {
  const slide = { data: bars, height: 320, width: 768 };

  it("scale={2.5} on a 768 px chart fills a 1920 px box, type scaled with it", () => {
    const svg = svgOf({ ...slide, scale: 2.5 });
    expect(svg).toContain('width="1920"');
    expect(svg).toContain('height="800"');
    // Labels are 11 units in a 768-unit viewBox shown at 1920 px: 27.5 px.
    expect(svg).toContain('viewBox="0 0 768 320"');
  });

  it("fit fills the container at the chart's aspect ratio", () => {
    const svg = svgOf({ ...slide, fit: true });
    expect(svg).toContain('viewBox="0 0 768 320"');
    expect(svg).toContain('width="100%"');
    expect(svg).toMatch(/aspect-ratio:\s*768\s*\/\s*320/u);
    expect(svg).not.toContain('width="768"');
  });

  it("proportional strokes are the default and carry no policy mark", () => {
    expect(svgOf({ ...slide, scale: 2 })).not.toContain("data-hl-strokes");
  });

  it("the one-device-pixel policy marks the chart, and the stylesheet keeps rules at a device pixel", () => {
    expect(svgOf({ ...slide, scale: 2, strokes: "device" })).toContain(
      'data-hl-strokes="device"'
    );
    const css = readFileSync(
      new URL("../lib/theme.css", import.meta.url),
      "utf-8"
    );
    expect(css).toMatch(
      /data-hl-strokes=.device.[^{]*\{[^}]*vector-effect:\s*non-scaling-stroke/u
    );
  });

  it("unscaled output is unchanged", () => {
    const svg = svgOf(slide);
    expect(svg).toContain('width="768"');
    expect(svg).toContain('height="320"');
    expect(svg).not.toContain("viewBox");
    expect(svg).not.toContain("data-hl-strokes");
  });

  it("scale, fit and strokes validate through the registry", () => {
    const chart = getChart("rung-bars");
    expect(chart.validate({ ...slide, scale: 2.5, strokes: "device" }).ok).toBe(
      true
    );
    expect(
      pointers({ ...slide, scale: -1, strokes: "thick" }).toSorted()
    ).toStrictEqual(["scale", "strokes"]);
  });
});

describe("text measurement is deterministic in fixed-size mode", () => {
  const note = "One rung = 100 rings · Source: the county survey · Rounded";
  const noted = { data: bars, note, ...sized };

  it("never touches the document, so loaded fonts cannot change the output", () => {
    const plain = render(noted);
    const touched: string[] = [];
    const trap = new Proxy(
      {},
      {
        get: (_target, key) => {
          touched.push(String(key));
          throw new Error("the DOM was measured");
        },
      }
    );
    vi.stubGlobal("document", trap);
    vi.stubGlobal("OffscreenCanvas", trap);
    try {
      expect(render(noted)).toBe(plain);
    } finally {
      vi.unstubAllGlobals();
    }
    expect(touched).toStrictEqual([]);
  });

  it("a metrics table changes how much room the note reserves", () => {
    const normal = render(noted);
    const crowded = render({
      ...noted,
      metrics: { advances: {}, fallback: 1.5 },
    });
    expect(noteLineCount(normal)).toBe(1);
    expect(noteLineCount(crowded)).toBeGreaterThan(1);
    expect(crowded).not.toBe(normal);
  });

  it("a face with a narrower alphabet fits the note on fewer lines", () => {
    const tight = { ...noted, width: 300 };
    const narrow = render({
      ...tight,
      metrics: { advances: {}, fallback: 0.3 },
    });
    expect(noteLineCount(narrow)).toBeLessThan(noteLineCount(render(tight)));
  });

  it("metrics are validated like the rest of the payload", () => {
    expect(
      pointers({
        data: bars,
        metrics: { advances: { a: -1 }, fallback: 0 },
      }).toSorted()
    ).toStrictEqual(["metrics.advances.a", "metrics.fallback"]);
    expect(
      pointers({
        data: bars,
        metrics: { advances: { a: 0.5 }, fallback: 0.6 },
      })
    ).toStrictEqual([]);
  });

  it("the chart face is the --hl-font variable", () => {
    const css = readFileSync(
      new URL("../lib/theme.css", import.meta.url),
      "utf-8"
    );
    expect(css).toContain("font-family: var(--hl-font, var(--font-sans))");
    expect(css).not.toMatch(/font-family: var\(--font-sans\);/u);
  });
});
