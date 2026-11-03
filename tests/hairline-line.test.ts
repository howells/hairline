import { readFileSync } from "node:fs";

import { HairlineLine } from "@howells/hairline";
import type { HairlineLineProps, DailyDatum } from "@howells/hairline";
// Seam 1: HairlineLine through the built package, the way a consumer uses it.
// Look the chart up in the registry by kind, validate a JSON payload, render
// on the server. Run with `pnpm test`, which builds lib/ first.
import type { Payload } from "@howells/hairline/schema";
import { getChart, registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const week: DailyDatum[] = [
  { date: "2024-03-04", value: 10 },
  { date: "2024-03-05", value: 14 },
  { date: "2024-03-06", value: 9 },
  { date: "2024-03-07", value: 12 },
  { date: "2024-03-08", value: 11 },
  { date: "2024-03-09", value: 8 },
  { date: "2024-03-10", value: 13 },
];
const sized = { height: 320, width: 480 };

const render = (props: HairlineLineProps) =>
  renderToString(createElement(HairlineLine, props));

const count = (html: string, pattern: RegExp) =>
  (html.match(pattern) ?? []).length;
/** Every reading is one circle of class `pop`. */
const dots = (html: string) => count(html, /class="[^"]*\bpop\b/gu);
/** The hero prints its value in the value voice: that value, or "none". */
const hero = (props: Partial<HairlineLineProps>) =>
  /class="[^"]*t-value[^"]*"[^>]*>(?<value>[^<]*)</u.exec(
    render({ data: week, ...sized, ...props })
  )?.groups?.value ?? "none";
/** The line is one path of class draw: one M for each unbroken run. */
const runs = (data: DailyDatum[]) =>
  count(
    /class="draw[^"]*" d="(?<d>[^"]*)"/u.exec(render({ data, ...sized }))
      ?.groups?.d ?? "",
    /M/gu
  );

/** The issue pointers of a failed validation; empty when it passed. */
const pointers = (payload: Payload) => {
  const checked = getChart("hairline-line").validate(payload);
  return checked.ok ? [] : checked.issues.map((i) => i.pointer);
};

describe("a consumer renders HairlineLine through the registry", () => {
  const chart = getChart("hairline-line");

  it("a validated payload renders a complete svg with marks and labels", () => {
    const checked = chart.validate({ data: week, ...sized });
    const html = checked.ok ? render(checked.value) : "";
    const svg = /<svg[^>]*>/u.exec(html)?.[0] ?? "";
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="320"');
    expect(html).toContain("</svg>");
    expect(dots(html)).toBe(7);
    expect(html).toContain(">14<");
  });

  it("an invalid payload returns path-specific issues", () => {
    expect(
      pointers({
        data: [
          { date: "next tuesday", value: 1 },
          { date: "2024-03-05", value: "12" },
        ],
        flavour: "mint",
      }).toSorted()
    ).toStrictEqual(["", "data[0].date", "data[1].value"]);
  });

  it("emphasis is checked against the readings once the rest is sound", () => {
    expect(pointers({ data: week, emphasis: "nope" })).toStrictEqual([
      "emphasis",
    ]);
  });

  it("missing data is the only issue", () => {
    expect(pointers(sized)).toStrictEqual(["data"]);
  });

  it("missing data never renders demo data", () => {
    // @ts-expect-error -- a JavaScript caller can leave data out
    const html = render({ height: 300, width: 400 });
    expect(dots(html)).toBe(0);
    expect(html).not.toContain("Sep");
  });
});

describe("the registry", () => {
  it("lists hairline-line with its job, shape, limits and guidance", () => {
    const entry = getChart("hairline-line");
    expect(entry.jobs[0]).toBe("change-over-time");
    expect(entry.component).toBe("HairlineLine");
    expect(
      [entry.dataShape, entry.whenToUse, entry.whenNotToUse].every(
        (text) => text.length > 20
      )
    ).toBe(true);
    expect(entry.limits.categories?.max).toBeGreaterThan(1);
    expect(registry.map((c) => c.kind)).toContain("hairline-line");
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
            new URL("../lib/json-schema/hairline-line.json", import.meta.url),
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
      "extreme",
      "fit",
      "format",
      "height",
      "idPrefix",
      "initialWidth",
      "metrics",
      "note",
      "notes",
      "replayKey",
      "scale",
      "strokes",
      "table",
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
    expect(render({ ...one, format: (v) => `${v} pts` })).toContain(
      ">0.5 pts<"
    );
  });

  it("a date preset names the day in the tooltip-free axis labels", () => {
    const html = render({
      data: [
        { date: "2024-03-04", value: 1 },
        { date: "2024-03-11", value: 2 },
      ],
      dateFormat: "day-month-year",
      ...sized,
    });
    expect(html).toContain("4 Mar 2024");
  });

  it("an unknown preset is rejected", () => {
    expect(pointers({ data: week, format: "bogus" })).not.toHaveLength(0);
    expect(pointers({ data: week, dateFormat: "bogus" })).not.toHaveLength(0);
  });
});

describe("emphasis", () => {
  it("defaults to the peak, or the trough when asked", () => {
    expect([hero({}), hero({ extreme: "trough" })]).toStrictEqual(["14", "8"]);
  });

  it("follows its key when the data is reordered", () => {
    expect([
      hero({ emphasis: "2024-03-06" }),
      hero({ data: week.toReversed(), emphasis: "2024-03-06" }),
    ]).toStrictEqual(["9", "9"]);
  });

  it("a key that names no live reading emphasises none", () => {
    const gappy = [...week.slice(0, 2), { date: "2024-03-06", value: null }];
    expect(hero({ data: gappy, emphasis: "2024-03-06" })).toBe("none");
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
    "same day twice": [
      { date: "2024-03-04", value: 1 },
      { date: "2024-03-04", value: 3 },
    ],
    single: [{ date: "2024-03-04", value: 5 }],
    unsorted: week.toReversed(),
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

  it("a null or non-finite reading is a gap: no dot, no value", () => {
    expect(dots(render({ data: cases.nulls, ...sized }))).toBe(2);
    expect(dots(render({ data: cases["all gaps"], ...sized }))).toBe(0);
  });

  it("a gap breaks the line in two", () => {
    expect([runs(cases.nulls), runs(week)]).toStrictEqual([2, 1]);
  });

  it("nothing to draw says so", () => {
    expect(render({ data: [], ...sized })).toContain("No data");
  });

  it("null is a valid reading to the schema, NaN is not", () => {
    expect(pointers({ data: cases.nulls })).toStrictEqual([]);
    expect(
      pointers({ data: [{ date: "2024-03-04", value: Number.NaN }] })
    ).toStrictEqual(["data[0].value"]);
  });
});

const axisLabels = (html: string) =>
  [
    ...html.matchAll(
      /<text class="t-axis t-halo" text-anchor="end" x="\d+" y="\d+">(?<text>[^<]*)<\/text>/gu
    ),
  ].map((m) => m.groups?.text ?? "");

describe("value-axis labels", () => {
  it("are distinct when a narrow range meets the default integer format", () => {
    const narrow = week.map((d, i) => ({ ...d, value: 7.2 + i * 0.2 }));
    const labels = axisLabels(render({ data: narrow, ...sized }));
    expect(labels.length).toBeGreaterThan(2);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("stay whole numbers over a wide range, as before", () => {
    const labels = axisLabels(render({ data: week, ...sized }));
    expect(labels.every((label) => /^\d+$/u.test(label))).toBe(true);
  });

  it("follow an explicit format untouched", () => {
    const narrow = week.map((d, i) => ({ ...d, value: 7.2 + i * 0.2 }));
    const labels = axisLabels(
      render({ data: narrow, format: "integer", ...sized })
    );
    expect(new Set(labels).size).toBeLessThan(labels.length);
  });
});

describe("sizing", () => {
  it("a fixed-size chart keeps exactly the height it is given", () => {
    expect(render({ data: week, ...sized })).toContain('height="320"');
  });

  it("a responsive chart draws at initialWidth before it has measured", () => {
    const html = render({ data: week, initialWidth: 600 });
    expect(html).toContain('width="600"');
    expect(html).toContain("</svg>");
  });

  it("a responsive chart with no width at all draws nothing yet", () => {
    expect(render({ data: week })).not.toContain("<svg");
  });
});
