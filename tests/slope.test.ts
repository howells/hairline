// Seam 1 for Slope: the built package, used the way a consumer uses it. Look
// the chart up in the registry by kind, validate a JSON payload, render on the
// server. Run with `pnpm test`, which builds lib/ first.
import { readFileSync } from "node:fs";

import { Slope } from "@howells/hairline";
import type { SlopeProps, SlopeRow } from "@howells/hairline";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const rows: SlopeRow[] = [
  { from: 280, name: "North", to: 120 },
  { from: 200, name: "South", to: 240 },
  { from: 150, name: "East", to: 140 },
];
const labels: [string, string] = ["2023", "2024"];
const sized = { height: 320, width: 560 };

/** The drawing alone: the data table after it always carries the full format. */
const drawn = (html: string) => html.slice(0, html.indexOf("<table"));

const render = (props: SlopeProps) =>
  renderToString(createElement(Slope, props));

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
/** The hero tone appears on one ring and one dot per emphasised row. */
const heroMarks = (html: string) => count(html, /(?:fill|stroke)-hero/gu);

const emphasised = (data: SlopeRow[]) =>
  render({ emphasis: "East", labels, rows: data, ...sized });
/** Whether the first hero-toned group also names East. */
const heroText = (html: string) =>
  /fill-hero[^]*?<\/g>/u.exec(html)?.[0].includes("East");

/** The issue pointers of a failed validation; empty when it passed. */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- the payload is the raw input under test
const pointers = (payload: unknown) => {
  const checked = getChart("slope").validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders Slope through the registry", () => {
  const chart = getChart("slope");

  it("a validated payload renders a complete bare svg", () => {
    const checked = chart.validate({ labels, rows, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('width="560"');
    expect(svg).toContain('height="320"');
    expect(html).toContain("</svg>");
    expect(
      ["2023", "2024", "North", "East"].map((t) => html.includes(t))
    ).toStrictEqual([true, true, true, true]);
  });

  it("renders only the plot, with no figure or caption around it", () => {
    const html = render({ labels, rows, ...sized });
    expect(html).not.toContain("<figure");
    expect(html).not.toContain("figcaption");
  });

  it("an invalid payload returns path-specific issues", () => {
    const bad = chart.validate({
      flavour: "mint",
      labels,
      rows: [{ from: "1", name: "a", to: 2 }, { name: "b" }],
    });
    const issues = bad.ok ? [] : bad.issues;
    expect(issues.map((i) => i.pointer).toSorted()).toStrictEqual([
      "",
      "rows[0].from",
      "rows[1].from",
      "rows[1].to",
    ]);
    expect(
      issues.find((i) => i.pointer === "rows[0].from")?.path
    ).toStrictEqual(["rows", 0, "from"]);
  });

  it("emphasis and domain are checked", () => {
    expect(pointers({ emphasis: "nope", labels, rows })).toStrictEqual([
      "emphasis",
    ]);
    expect(pointers({ domain: [5, 1], labels, rows })).toStrictEqual([
      "domain",
    ]);
  });

  it("missing rows is the only issue", () => {
    expect(pointers({ labels })).toStrictEqual(["rows"]);
  });

  it("missing rows never renders demo data", () => {
    // @ts-expect-error -- a JavaScript caller can leave rows out
    const html = render({ labels, ...sized });
    expect(html).not.toContain("Jan 2023");
    expect(html).not.toContain("g/kWh");
  });
});

describe("the registry", () => {
  it("lists slope with its job, shape, limits and guidance", () => {
    const entry = getChart("slope");
    expect(entry.jobs[0]).toBe("change-over-time");
    expect(entry.component).toBe("Slope");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(registry.map((c) => c.kind)).toContain("slope");
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
            new URL("../lib/json-schema/slope.json", import.meta.url),
            "utf-8"
          )
        )
      );
    expect(json.required.toSorted()).toStrictEqual(["labels", "rows"]);
    expect(Object.keys(json.properties).toSorted()).toStrictEqual([
      "animate",
      "domain",
      "emphasis",
      "fit",
      "format",
      "height",
      "idPrefix",
      "initialWidth",
      "label",
      "labels",
      "metrics",
      "narrowFormat",
      "replayKey",
      "rows",
      "scale",
      "strokes",
      "table",
      "title",
      "width",
    ]);
  });
});

describe("formatters are data", () => {
  it("a preset", () => {
    const html = render({
      format: "percent",
      labels,
      rows: [{ from: 0.5, name: "a", to: 0.25 }],
      ...sized,
    });
    expect(html).toContain(">50%<");
    expect(html).toContain(">25%<");
  });

  it("a function, from TypeScript", () => {
    const html = render({ format: (v) => `${v} g`, labels, rows, ...sized });
    expect(html).toContain(">280 g<");
  });

  it("the narrow format takes over below 520px", () => {
    const props = {
      format: (v: number) => `${v} g`,
      height: 320,
      labels,
      narrowFormat: "integer" as const,
      rows,
    };
    // The data table always carries the full format; the drawing narrows.
    expect(drawn(render({ ...props, width: 400 }))).not.toContain(">280 g<");
    expect(drawn(render({ ...props, width: 600 }))).toContain(">280 g<");
  });
});

describe("emphasis", () => {
  it("defaults to the biggest fall", () => {
    expect(heroMarks(render({ labels, rows, ...sized }))).toBeGreaterThan(0);
  });

  it("follows its key when the rows are reordered", () => {
    const first = emphasised(rows);
    const reversed = emphasised(rows.toReversed());
    expect(heroMarks(first)).toBe(heroMarks(reversed));
    expect([heroText(first), heroText(reversed)]).toStrictEqual([true, true]);
  });

  it("lets an id tell apart rows that share a name", () => {
    const twins: SlopeRow[] = [
      { from: 5, id: "a", name: "Same", to: 1 },
      { from: 5, id: "b", name: "Same", to: 9 },
    ];
    expect(pointers({ emphasis: "b", labels, rows: twins })).toStrictEqual([]);
  });
});

describe("degenerate data", () => {
  const cases = {
    duplicates: [
      { from: 1, name: "x", to: 2 },
      { from: 3, name: "x", to: 1 },
    ],
    empty: [],
    flat: [{ from: 4, name: "x", to: 4 }],
    infinite: [
      { from: Number.POSITIVE_INFINITY, name: "x", to: 1 },
      { from: 2, name: "y", to: 3 },
    ],
    nan: [
      { from: Number.NaN, name: "x", to: 1 },
      { from: 2, name: "y", to: 3 },
    ],
    negative: [
      { from: -4, name: "x", to: 2 },
      { from: 2, name: "y", to: -6 },
    ],
    single: [{ from: 5, name: "x", to: 1 }],
  } satisfies Record<string, SlopeRow[]>;

  it.each(Object.entries(cases))(
    "%s renders without throwing",
    (_name, data) => {
      for (const size of [sized, { initialWidth: 560 }]) {
        const html = render({ labels, rows: data, ...size });
        expect(html).toContain("<svg");
        expect(html).toContain("</svg>");
        expect(html).not.toContain("NaN");
        expect(html).not.toContain("Infinity");
      }
    }
  );

  it("a row that is not a finite number is skipped", () => {
    const html = render({ labels, rows: cases.nan, ...sized });
    expect(html).toContain(">y");
    expect(html).not.toContain("x ");
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    expect(render({ labels, rows, ...sized })).toContain('height="320"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ initialWidth: 600, labels, rows });
    expect(html).toContain('width="600"');
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ labels, rows })).not.toContain("<svg");
  });
});
