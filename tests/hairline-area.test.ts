import { readFileSync } from "node:fs";

import { HairlineArea } from "@howells/hairline";
import type { DailyDatum, HairlineAreaProps } from "@howells/hairline";
// Seam 1: HairlineArea through the built package, the way a consumer uses it.
// Look the chart up in the registry by kind, validate a JSON payload, render
// on the server. Run with `pnpm test`, which builds lib/ first.
import type { Payload } from "@howells/hairline/schema";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

// Monday 4 March to Sunday 17 March 2024.
const fortnight: DailyDatum[] = [
  3, 4, 6, 5, 7, 9, 8, 6, 5, 11, 10, 8, 7, 6,
].map((value, i) => ({
  date: `2024-03-${String(4 + i).padStart(2, "0")}`,
  value,
}));
const sized = { height: 320, width: 480 };

const render = (props: HairlineAreaProps) =>
  renderToString(createElement(HairlineArea, props));

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
/** A stem is one rect of class grow-y. */
const stems = (html: string) => count(html, /class="[^"]*\bgrow-y\b/gu);
/** The hero prints its value in the value voice: that value, or "none". */
const hero = (props: Partial<HairlineAreaProps>) =>
  /class="[^"]*t-value"[^>]*>(?<value>[^<]*)</u.exec(
    render({ data: fortnight, ...sized, ...props })
  )?.groups?.value ?? "none";
/** The line is one path of class draw: one M for each unbroken run. */
const runs = (data: DailyDatum[]) =>
  count(
    /class="draw[^"]*" d="(?<d>[^"]*)"/u.exec(render({ data, ...sized }))
      ?.groups?.d ?? "",
    /M/gu
  );
/** Every id a page defines. */
const ids = (html: string) =>
  [...html.matchAll(/ id="(?<id>[^"]+)"/gu)].map((m) => m.groups?.id);

/** The issue pointers of a failed validation; empty when it passed. */
const pointers = (payload: Payload) => {
  const checked = getChart("hairline-area").validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders HairlineArea through the registry", () => {
  const chart = getChart("hairline-area");

  it("a validated payload renders a complete svg with area, stems and labels", () => {
    const checked = chart.validate({ data: fortnight, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="320"');
    expect(html).toContain("</svg>");
    expect(html).toContain('fill="url(#');
    // Mondays 4 and 11 March, plus the peak on the 13th.
    expect(stems(html)).toBe(3);
  });

  it("an invalid payload returns path-specific issues", () => {
    expect(
      pointers({
        data: [
          { date: "2024-13-45", value: 1 },
          { date: "2024-03-05", value: "12" },
        ],
        ticks: [0],
      }).toSorted()
    ).toStrictEqual(["data[0].date", "data[1].value", "ticks"]);
  });

  it("emphasis is checked against the readings once the rest is sound", () => {
    expect(pointers({ data: fortnight, emphasis: "nope" })).toStrictEqual([
      "emphasis",
    ]);
  });

  it("missing data is the only issue", () => {
    expect(pointers(sized)).toStrictEqual(["data"]);
  });

  it("missing data never renders demo data", () => {
    // @ts-expect-error -- a JavaScript caller can leave data out
    const html = render({ height: 300, width: 400 });
    expect(stems(html)).toBe(0);
    expect(html).not.toContain("Jan");
  });
});

describe("the registry", () => {
  it("lists hairline-area with its job, shape, limits and guidance", () => {
    const entry = getChart("hairline-area");
    expect(entry.jobs[0]).toBe("change-over-time");
    expect(entry.component).toBe("HairlineArea");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(entry.limits.categories?.max).toBeGreaterThan(1);
    expect(registry.map((c) => c.kind)).toContain("hairline-area");
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
            new URL("../lib/json-schema/hairline-area.json", import.meta.url),
            "utf-8"
          )
        )
      );
    expect(json.required).toStrictEqual(["data"]);
    expect(Object.keys(json.properties).toSorted()).toStrictEqual([
      "animate",
      "data",
      "dateFormat",
      "emphasis",
      "fit",
      "format",
      "height",
      "idPrefix",
      "initialWidth",
      "maxWidth",
      "metrics",
      "note",
      "replayKey",
      "scale",
      "strokes",
      "table",
      "ticks",
      "title",
      "unitNote",
      "width",
    ]);
  });
});

describe("formatters are data", () => {
  const one = { data: [{ date: "2024-03-04", value: 0.5 }], ...sized };

  it("a number preset", () => {
    expect(render({ ...one, format: "percent" })).toContain(">50%<");
  });

  it("Intl number-format options", () => {
    const html = render({
      data: [{ date: "2024-03-04", value: 1234.5 }],
      format: { currency: "USD", maximumFractionDigits: 0, style: "currency" },
      ...sized,
    });
    expect(html).toContain(">$1,235<");
  });

  it("a function, from TypeScript", () => {
    expect(render({ ...one, format: (v) => `${v} h` })).toContain(">0.5 h<");
  });

  it("a date function, from TypeScript, names the day in the description", () => {
    const html = render({
      data: fortnight,
      dateFormat: (d) => `day ${d.getUTCDate()}`,
      ...sized,
    });
    expect(html).toContain("day 4 to day 17");
  });

  it("a date preset", () => {
    const html = render({
      data: fortnight,
      dateFormat: "day-month-year",
      ...sized,
    });
    expect(html).toContain("4 Mar 2024 to 17 Mar 2024");
  });

  it("an unknown preset is rejected", () => {
    expect(pointers({ data: fortnight, format: "bogus" })).not.toHaveLength(0);
    expect(pointers({ data: fortnight, dateFormat: "bogus" })).not.toHaveLength(
      0
    );
  });
});

describe("emphasis", () => {
  it("defaults to the peak", () => {
    expect(hero({})).toBe("11");
  });

  it("follows its key when the data is reordered", () => {
    expect([
      hero({ emphasis: "2024-03-07" }),
      hero({ data: fortnight.toReversed(), emphasis: "2024-03-07" }),
    ]).toStrictEqual(["5", "5"]);
  });

  it("lets an id tell apart readings on the same day", () => {
    const twins: DailyDatum[] = [
      { date: "2024-03-04", id: "a", value: 3 },
      { date: "2024-03-04", id: "b", value: 5 },
      { date: "2024-03-05", value: 4 },
    ];
    expect([
      hero({ data: twins, emphasis: "a" }),
      hero({ data: twins.toReversed(), emphasis: "a" }),
      hero({ data: twins, emphasis: "b" }),
    ]).toStrictEqual(["3", "3", "5"]);
  });

  it("a key that names a gap emphasises none", () => {
    const gappy: DailyDatum[] = [
      { date: "2024-03-04", value: 1 },
      { date: "2024-03-05", value: null },
    ];
    expect(hero({ data: gappy, emphasis: "2024-03-05" })).toBe("none");
  });
});

describe("degenerate data", () => {
  const cases = {
    "all gaps": [
      { date: "2024-03-04", value: null },
      { date: "2024-03-05", value: Number.NaN },
    ],
    empty: [],
    flat: [
      { date: "2024-03-04", value: 5 },
      { date: "2024-03-05", value: 5 },
    ],
    infinite: [
      { date: "2024-03-04", value: Number.POSITIVE_INFINITY },
      { date: "2024-03-05", value: 2 },
    ],
    negative: [
      { date: "2024-03-04", value: -4 },
      { date: "2024-03-05", value: 2 },
    ],
    nulls: [
      { date: "2024-03-04", value: 1 },
      { date: "2024-03-05", value: null },
      { date: "2024-03-06", value: 3 },
    ],
    "only negative": [{ date: "2024-03-04", value: -4 }],
    "same day twice": [
      { date: "2024-03-04", value: 1 },
      { date: "2024-03-04", value: 3 },
    ],
    single: [{ date: "2024-03-04", value: 5 }],
    unsorted: fortnight.toReversed(),
    zero: [{ date: "2024-03-04", value: 0 }],
  } satisfies Record<string, DailyDatum[]>;

  it.each(Object.entries(cases))(
    "%s renders without throwing",
    (_name, data) => {
      for (const size of [sized, { initialWidth: 480 }]) {
        const html = render({ data, ...size });
        expect(html).toContain("<svg");
        expect(html).toContain("</svg>");
        expect(html).not.toContain("NaN");
        expect(html).not.toContain("Infinity");
        expect(html).not.toContain("undefined");
      }
    }
  );

  it("a gap breaks the line in two", () => {
    expect([runs(cases.nulls), runs(fortnight)]).toStrictEqual([2, 1]);
  });

  it("nothing to draw says so", () => {
    expect(render({ data: [], ...sized })).toContain("No data");
    expect(render({ data: cases["all gaps"], ...sized })).toContain("No data");
  });

  it("null is a valid reading to the schema, NaN is not", () => {
    expect(pointers({ data: cases.nulls })).toStrictEqual([]);
    expect(
      pointers({ data: [{ date: "2024-03-04", value: Number.NaN }] })
    ).toStrictEqual(["data[0].value"]);
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    expect(render({ data: fortnight, ...sized })).toContain('height="320"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ data: fortnight, initialWidth: 600 });
    expect(html).toContain('width="600"');
    expect(html).toContain("</svg>");
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ data: fortnight })).not.toContain("<svg");
  });
});

describe("two charts on one page", () => {
  it("do not share a texture id", () => {
    const page = renderToString(
      createElement("div", null, [
        createElement(HairlineArea, { data: fortnight, key: "a", ...sized }),
        createElement(HairlineArea, { data: fortnight, key: "b", ...sized }),
      ])
    );
    // Every id is unique, and the two charts each define one texture.
    const all = ids(page);
    expect(new Set(all).size).toBe(all.length);
    expect(all.filter((id) => id?.startsWith("desc-") !== true)).toHaveLength(
      2
    );
  });
});

const axisLabels = (html: string) =>
  [
    ...html.matchAll(
      /<text class="t-axis" text-anchor="end" x="\d+" y="\d+">(?<text>[^<]*)<\/text>/gu
    ),
  ].map((m) => m.groups?.text ?? "");

/** Values below one: the scale runs 0 to 1, a step of 0.2. */
const small = fortnight.map((d) => ({ ...d, value: (d.value ?? 0) / 20 }));

describe("value-axis labels", () => {
  it("are distinct when a narrow range meets the default integer format", () => {
    const labels = axisLabels(render({ data: small, ...sized }));
    expect(labels.length).toBeGreaterThan(2);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("are distinct on consumer ticks finer than one", () => {
    const labels = axisLabels(
      render({ data: small, ticks: [0, 0.25, 0.5, 0.75, 1], ...sized })
    );
    expect(labels).toStrictEqual(["0.00", "0.25", "0.50", "0.75", "1.00"]);
  });

  it("stay whole numbers over a wide range, as before", () => {
    const labels = axisLabels(render({ data: fortnight, ...sized }));
    expect(labels.length).toBeGreaterThan(2);
    expect(labels.every((label) => /^\d+$/u.test(label))).toBe(true);
  });

  it("follow an explicit format untouched", () => {
    const labels = axisLabels(
      render({ data: small, format: "integer", ...sized })
    );
    expect(new Set(labels).size).toBeLessThan(labels.length);
  });
});
