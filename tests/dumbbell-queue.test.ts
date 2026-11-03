import { readFileSync } from "node:fs";

import { DumbbellQueue } from "@howells/hairline";
import type { DumbbellDatum, DumbbellQueueProps } from "@howells/hairline";
// Seam 1: the built package, used the way a consumer uses it. Look a chart up
// in the registry by kind, validate a JSON payload, render on the server.
// Run with `pnpm test`, which builds lib/ first.
import type { Payload } from "@howells/hairline/schema";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const rows: DumbbellDatum[] = [
  { after: 10, before: 4, label: "North" },
  { after: 3, before: 8, label: "South" },
  { after: 6, before: 6, label: "East" },
];
const sized = { height: 320, width: 480 };

const render = (props: DumbbellQueueProps) =>
  renderToString(createElement(DumbbellQueue, props));

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
/** Every change rung is a rect of class grow-y. */
const rungs = (html: string) => count(html, /class="grow-y/gu);
/** The x centre of the hero dot: where emphasis landed. */
const heroX = (data: DumbbellDatum[], emphasis?: string) => {
  const html = render({ data, emphasis, ...sized });
  const dot = /<circle[^>]*fill-hero[^>]*>/u.exec(html)?.[0] ?? "";
  return /cx="(?<x>[\d.]+)"/u.exec(dot)?.groups?.x;
};

/** The issue pointers of a failed validation; empty when it passed. */
const pointers = (payload: Payload) => {
  const checked = getChart("dumbbell-queue").validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders DumbbellQueue through the registry", () => {
  const chart = getChart("dumbbell-queue");

  it("a validated payload renders a complete svg with marks and labels", () => {
    const checked = chart.validate({ data: rows, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="320"');
    expect(html).toContain("</svg>");
    expect(
      ["North", "South", "East", "10", "3"].map((t) => html.includes(`>${t}<`))
    ).toStrictEqual([true, true, true, true, true]);
    // 6 + 5 + 0 units of change, one rung each.
    expect(rungs(html)).toBe(11);
  });

  it("alert none draws no rung in the alert colour; the default marks the rise", () => {
    expect(render({ data: rows, ...sized })).toContain("fill-alert");
    expect(render({ alert: "none", data: rows, ...sized })).not.toContain(
      "fill-alert"
    );
  });

  it("the scale ends are whole steps, not the padded maximum", () => {
    const html = render({
      data: [{ after: 5.99, before: 8.85, label: "Tate" }],
      format: (v) => `${v}m`,
      ...sized,
    });
    expect(html).toContain(">10m<");
    expect(html).not.toContain("9.204m");
  });

  it("an invalid payload returns path-specific issues", () => {
    const bad = chart.validate({
      data: [{ after: "12", before: 1, label: "a" }, { label: "b" }],
      flavour: "mint",
    });
    const issues = bad.ok ? [] : bad.issues;
    expect(issues.map((i) => i.pointer).toSorted()).toStrictEqual([
      "",
      "data[0].after",
      "data[1].after",
      "data[1].before",
    ]);
    expect(
      issues.find((i) => i.pointer === "data[0].after")?.path
    ).toStrictEqual(["data", 0, "after"]);
  });

  it("emphasis is checked against the rows once the rest is sound", () => {
    expect(pointers({ data: rows, emphasis: "nope" })).toStrictEqual([
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
    expect(html).not.toContain("Tate");
  });
});

describe("the registry", () => {
  it("lists dumbbell-queue with its job, shape, limits and guidance", () => {
    const entry = getChart("dumbbell-queue");
    expect(entry.jobs).toStrictEqual(["deviation", "change-over-time"]);
    expect(entry.component).toBe("DumbbellQueue");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(entry.limits.categories?.max).toBeGreaterThan(1);
    expect(registry.map((c) => c.kind)).toContain("dumbbell-queue");
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
            new URL("../lib/json-schema/dumbbell-queue.json", import.meta.url),
            "utf-8"
          )
        )
      );
    expect(json.required).toStrictEqual(["data"]);
    expect(Object.keys(json.properties).toSorted()).toStrictEqual([
      "alert",
      "animate",
      "data",
      "emphasis",
      "ends",
      "fit",
      "format",
      "height",
      "idPrefix",
      "initialWidth",
      "metrics",
      "note",
      "references",
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
      data: [{ after: 0.5, before: 0.25, label: "a" }],
      format: "percent",
      ...sized,
    });
    expect(html).toContain(">50%<");
    expect(html).toContain(">25%<");
  });

  it("Intl number-format options", () => {
    const html = render({
      data: [{ after: 1234.5, before: 10, label: "a" }],
      format: { currency: "USD", maximumFractionDigits: 0, style: "currency" },
      ...sized,
    });
    expect(html).toContain(">$1,235<");
  });

  it("a function, from TypeScript", () => {
    const html = render({
      data: rows,
      format: (v) => `${v} visits`,
      ...sized,
    });
    expect(html).toContain(">10 visits<");
  });

  it("an unknown preset is rejected", () => {
    expect(pointers({ data: rows, format: "bogus" })).not.toHaveLength(0);
  });
});

describe("emphasis", () => {
  it("follows its key when the data is reordered", () => {
    const reversed = rows.toReversed();
    expect(heroX(rows, "South")).toBeDefined();
    expect(heroX(reversed, "South")).toBe(heroX(rows, "South"));
    expect(heroX(rows, "North")).not.toBe(heroX(rows, "South"));
  });

  it("lets an id tell apart rows that share a label", () => {
    const twins: DumbbellDatum[] = [
      { after: 9, before: 1, id: "a", label: "Same" },
      { after: 3, before: 1, id: "b", label: "Same" },
    ];
    expect(heroX(twins, "b")).toBe(heroX(twins.toReversed(), "b"));
    expect(heroX(twins, "b")).not.toBe(heroX(twins, "a"));
  });

  it("defaults to the biggest change", () => {
    expect(heroX(rows)).toBe(heroX(rows, "North"));
  });
});

describe("degenerate data", () => {
  const cases = {
    duplicates: [
      { after: 2, before: 1, label: "x" },
      { after: 3, before: 1, label: "x" },
    ],
    empty: [],
    "equal ends": [
      { after: 5, before: 5, label: "x" },
      { after: 5, before: 5, label: "y" },
    ],
    infinite: [
      { after: Number.POSITIVE_INFINITY, before: 1, label: "x" },
      { after: 2, before: 1, label: "y" },
    ],
    nan: [
      { after: Number.NaN, before: 1, label: "x" },
      { after: 2, before: 1, label: "y" },
    ],
    negative: [
      { after: -4, before: 3, label: "x" },
      { after: 2, before: -1, label: "y" },
    ],
    "only negative": [{ after: -4, before: -2, label: "x" }],
    single: [{ after: 5, before: 2, label: "x" }],
    zero: [{ after: 0, before: 0, label: "x" }],
  } satisfies Record<string, DumbbellDatum[]>;

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

  it("a row that is not a finite number is skipped", () => {
    // Only y survives: one unit of change.
    expect(rungs(render({ data: cases.nan, ...sized }))).toBe(1);
  });

  it("equal ends draw no rungs", () => {
    expect(rungs(render({ data: cases["equal ends"], ...sized }))).toBe(0);
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    const html = render({ data: rows, ...sized });
    expect(html).toContain('height="320"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ data: rows, initialWidth: 600 });
    expect(html).toContain('width="600"');
    expect(html).toContain("</svg>");
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ data: rows })).not.toContain("<svg");
  });
});
