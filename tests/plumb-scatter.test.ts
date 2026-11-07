import { readFileSync } from "node:fs";

import { PlumbScatter } from "@howells/hairline";
import type { PlumbDatum, PlumbScatterProps } from "@howells/hairline";
// Seam 1 for PlumbScatter: the built package, used the way a consumer uses it.
// Same contract as RungBars (tests/rung-bars.test.ts). Run with `pnpm test`.
import type { Payload } from "@howells/hairline/schema";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const points: PlumbDatum[] = [
  { label: "Alder", x: 10, y: 30 },
  { label: "Birch", x: 40, y: 12 },
  { label: "Cedar", x: 70, y: 22 },
];

const sized = { height: 400, width: 560 };
const keyed = { hero: ["Cedar"], labelled: ["Cedar"], ...sized };

/** React puts a comment between adjacent text nodes; drop them so labels read whole. */
const render = (props: PlumbScatterProps) =>
  renderToString(createElement(PlumbScatter, props)).replaceAll("<!-- -->", "");

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;

/** Every point is one circle; the hero's is fill-hero on a paper ring. */
const dots = (html: string) => count(html, /<circle/gu);

const heroDots = (html: string) =>
  count(html, /class="fill-hero stroke-paper pop"/gu);

const pointers = (payload: Payload) => {
  const checked = getChart("plumb-scatter").validate(payload);

  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders PlumbScatter through the registry", () => {
  const chart = getChart("plumb-scatter");

  it("a validated payload renders a complete svg with marks and labels", () => {
    const checked = chart.validate({ data: points, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('height="400" width="560"');
    expect(dots(html)).toBe(3);
    // The highest and lowest are named by default.
    expect(html).toContain(">Alder · 30<");
    expect(html).toContain(">Birch · 12<");
  });

  it("an invalid payload returns path-specific issues", () => {
    const bad = chart.validate({
      data: [
        { label: "a", x: "1", y: 2 },
        { label: "b", x: 1 },
      ],
      flavour: "mint",
    });

    const issues = bad.ok ? [] : bad.issues;
    expect(issues.map((i) => i.pointer).toSorted()).toStrictEqual([
      "",
      "data[0].x",
      "data[1].y",
    ]);
  });

  it("hero and labelled are checked against the points", () => {
    expect(
      pointers({ data: points, hero: ["nope"], labelled: ["Alder", "zzz"] })
    ).toStrictEqual(["hero[0]", "labelled[1]"]);
  });

  it("a reversed domain is rejected", () => {
    expect(pointers({ data: points, xDomain: [10, 0] })).toStrictEqual([
      "xDomain",
    ]);
  });

  it("missing data is the only issue", () => {
    expect(pointers(sized)).toStrictEqual(["data"]);
  });

  it("missing data never renders demo data", () => {
    // @ts-expect-error -- a JavaScript caller can leave data out
    const html = render({ height: 300, width: 400 });
    expect(dots(html)).toBe(0);
    expect(html).not.toContain("Chile");
  });
});

describe("the registry", () => {
  it("lists plumb-scatter as a relation chart", () => {
    const entry = getChart("plumb-scatter");
    expect(entry.jobs[0]).toBe("correlation");
    expect(entry.component).toBe("PlumbScatter");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(registry.map((c) => c.kind)).toContain("plumb-scatter");
  });

  it("a JSON Schema is emitted at build", () => {
    const json = z
      .object({
        properties: z.record(z.string(), z.unknown()),
        required: z.array(z.string()),
      })
      .parse(
        JSON.parse(
          readFileSync(
            new URL("../lib/json-schema/plumb-scatter.json", import.meta.url),
            "utf-8"
          )
        )
      );

    expect(json.required).toStrictEqual(["data"]);
    expect(Object.keys(json.properties)).toContain("labelled");
  });
});

describe("formatters are data", () => {
  it("y and x take descriptors", () => {
    const html = render({
      data: points,
      format: "percent",
      formatX: "compact",
      ...sized,
    });

    expect(html).toContain(">Alder · 3,000%<");
  });

  it("a function, from TypeScript", () => {
    const html = render({ data: points, format: (v) => `${v} t`, ...sized });
    expect(html).toContain(">Alder · 30 t<");
  });
});

describe("hero and labelling by key", () => {
  it("the hero follows its key when the data is reordered", () => {
    const forward = render({ data: points, ...keyed });
    const reversed = render({ data: points.toReversed(), ...keyed });
    expect(heroDots(forward)).toBe(1);
    expect(heroDots(reversed)).toBe(1);
    expect(reversed).toContain(">Cedar · 22<");
    expect(forward).not.toContain(">Alder · 30<");
  });

  it("an id tells apart points that share a label", () => {
    const twins: PlumbDatum[] = [
      { id: "a", label: "Same", x: 10, y: 5 },
      { id: "b", label: "Same", x: 50, y: 9 },
    ];

    const html = render({ data: twins, hero: ["a"], ...sized });
    expect(dots(html)).toBe(2);
    expect(heroDots(html)).toBe(1);
  });

  it("defaults to the highest point", () => {
    expect(heroDots(render({ data: points, ...sized }))).toBe(1);
  });
});

describe("degenerate data", () => {
  const cases = {
    coincident: [
      { label: "x", x: 5, y: 5 },
      { label: "y", x: 5, y: 5 },
    ],
    empty: [],
    infinite: [
      { label: "x", x: Number.POSITIVE_INFINITY, y: 1 },
      { label: "y", x: 2, y: 2 },
    ],
    nan: [
      { label: "x", x: Number.NaN, y: 1 },
      { label: "y", x: 2, y: Number.NaN },
      { label: "z", x: 3, y: 3 },
    ],
    negative: [
      { label: "x", x: -4, y: -9 },
      { label: "y", x: 2, y: 2 },
    ],
    single: [{ label: "x", x: 5, y: 5 }],
    zero: [{ label: "x", x: 0, y: 0 }],
  } satisfies Record<string, PlumbDatum[]>;

  it.each(Object.entries(cases))(
    "%s renders without throwing",
    (_name, data) => {
      for (const size of [sized, { initialWidth: 560 }]) {
        const html = render({ data, ...size });
        expect(html).toContain("<svg");
        expect(html).toContain("</svg>");
        expect(html).not.toContain("NaN");
        expect(html).not.toContain("Infinity");
      }
    }
  );

  it("a point with a coordinate that is not finite is skipped", () => {
    expect(dots(render({ data: cases.nan, ...sized }))).toBe(1);
  });

  it("coincident points each get a dot", () => {
    expect(dots(render({ data: cases.coincident, ...sized }))).toBe(2);
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    expect(render({ data: points, ...sized })).toContain('height="400"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ data: points, initialWidth: 600 });
    expect(html).toContain('width="600"');
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ data: points })).not.toContain("<svg");
  });
});
