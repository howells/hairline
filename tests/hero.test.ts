// Seam 1: one hero group against context in the point and line charts, through
// the built package, rendered on the server at a fixed width. Run with
// `pnpm test`, which builds lib/ first.
import { HairlineLine, JitterStrip, PlumbScatter } from "@howells/hairline";
import type { DailyDatum, PlumbDatum } from "@howells/hairline";
import { getChart } from "@howells/hairline/schema";
import type { Payload } from "@howells/hairline/schema";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const points: PlumbDatum[] = [
  { label: "Alder", x: 10, y: 30 },
  { label: "Birch", x: 40, y: 12 },
  { label: "Cedar", x: 70, y: 22 },
  { label: "Elm", x: 90, y: 18 },
];
const sized = { height: 400, width: 560 };

const scatter = (props: Partial<ComponentProps<typeof PlumbScatter>>) =>
  renderToString(
    createElement(PlumbScatter, { data: points, ...sized, ...props })
  ).replaceAll("<!-- -->", "");

/** Every circle's class, in drawing order. */
const circles = (html: string) =>
  [...html.matchAll(/<circle[^>]*?class="(?<cls>[^"]*)"/gu)].map(
    (m) => m.groups?.cls ?? ""
  );

describe("PlumbScatter hero and context", () => {
  it("draws every hero dot, on a paper ring, above every context dot", () => {
    const list = circles(scatter({ hero: ["Alder", "Elm"] }));
    const hero = list.flatMap((c, i) => (c.includes("fill-hero") ? [i] : []));
    const context = list.flatMap((c, i) => (c.includes("fill-l5") ? [i] : []));
    expect(hero).toHaveLength(2);
    expect(context).toHaveLength(2);
    expect(Math.min(...hero)).toBeGreaterThan(Math.max(...context));
    expect(list[hero[0]]).toContain("stroke-paper");
    expect(scatter({ hero: ["Alder"] })).toContain('paint-order="stroke"');
  });

  it("keeps the hero above the context whatever order the data is in", () => {
    const list = circles(
      scatter({ data: points.toReversed(), hero: ["Alder"] })
    );
    expect(list.at(-1)).toContain("fill-hero");
  });

  it("grey is a pale solid tone, opacity is the ink at low opacity", () => {
    const grey = circles(scatter({ hero: ["Alder"] }));
    const opacity = circles(scatter({ context: "opacity", hero: ["Alder"] }));
    expect(grey.filter((c) => c === "pop fill-l5")).toHaveLength(3);
    expect(opacity.filter((c) => c === "pop fill-ink opacity-25")).toHaveLength(
      3
    );
    expect(opacity.some((c) => c.includes("fill-l5"))).toBe(false);
  });

  it("an empty hero list draws no hero; no list picks the highest", () => {
    expect(
      circles(scatter({ hero: [] })).some((c) => c.includes("fill-hero"))
    ).toBe(false);
    const list = circles(scatter({}));
    expect(list.filter((c) => c.includes("fill-hero"))).toHaveLength(1);
  });

  it("names the hero group directly, with a leader and a count, and in the data table", () => {
    const html = scatter({
      hero: ["Alder", "Cedar"],
      heroLabel: "Contract studios",
      table: true,
    });
    expect(html).toContain(">Contract studios<");
    expect(html).toContain(">2 points<");
    expect(html).toContain('class="stroke-rule"');
    expect(html).toContain("Contract studios: 2 points.");
  });

  it("the data table says which rows are the hero group", () => {
    const html = scatter({
      hero: ["Alder", "Cedar"],
      heroLabel: "A",
      table: true,
    });
    expect(html.match(/<td>Yes<\/td>/gu)).toHaveLength(2);
    expect(html.match(/<td>No<\/td>/gu)).toHaveLength(2);
  });

  it("without heroLabel there is no leader, and the hero is named as before", () => {
    const html = scatter({ hero: ["Alder"] });
    expect(html).not.toContain('class="stroke-rule"');
    expect(html).toContain(">Alder · 30<");
  });

  it("checks hero keys and context against the schema", () => {
    const chart = getChart("plumb-scatter");
    const pointers = (payload: Payload) => {
      const checked = chart.validate(payload);
      return checked.ok ? [] : checked.issues.map((i) => i.pointer);
    };
    expect(pointers({ data: points, hero: ["Alder", "nope"] })).toStrictEqual([
      "hero[1]",
    ]);
    expect(pointers({ context: "dim", data: points })).toStrictEqual([
      "context",
    ]);
    expect(
      pointers({
        context: "opacity",
        data: points,
        hero: ["Alder"],
        heroLabel: "A",
      })
    ).toStrictEqual([]);
  });
});

const week: DailyDatum[] = [
  { date: "2024-03-04", value: 10 },
  { date: "2024-03-05", value: 14 },
  { date: "2024-03-06", value: 9 },
  { date: "2024-03-07", value: 12 },
  { date: "2024-03-08", value: 11 },
  { date: "2024-03-09", value: 8 },
  { date: "2024-03-10", value: 13 },
];

const line = (props: Partial<ComponentProps<typeof HairlineLine>>) =>
  renderToString(
    createElement(HairlineLine, { data: week, ...sized, ...props })
  );

const peak = (props: Partial<ComponentProps<typeof HairlineLine>>) =>
  /class="[^"]*t-value"[^>]*>(?<v>[^<]*)</u.exec(line(props))?.groups?.v;

describe("HairlineLine hero and context", () => {
  it("draws several heroes in ink on a paper ring, above the rest", () => {
    const list = circles(line({ hero: ["2024-03-05", "2024-03-07"] }));
    const hero = list.flatMap((c, i) => (c.includes("fill-hero") ? [i] : []));
    expect(hero).toHaveLength(2);
    expect(hero.at(0)).toBeGreaterThan(list.length - 3);
    expect(list[hero[0]]).toContain("stroke-paper");
  });

  it("context sets the line and the dots", () => {
    expect(line({})).toContain("stroke-l4");
    const html = line({ context: "opacity" });
    expect(html).toContain("stroke-ink opacity-25");
    expect(html).toContain("fill-ink opacity-25");
    expect(html).not.toContain("stroke-l4");
  });

  it("with no hero given it is the peak, or the trough when asked", () => {
    expect([peak({}), peak({ extreme: "trough" })]).toStrictEqual(["14", "8"]);
  });

  it("checks hero against the readings", () => {
    const chart = getChart("hairline-line");
    const checked = chart.validate({
      data: week,
      hero: ["2024-03-05", "nope"],
    });
    expect(
      checked.ok ? [] : checked.issues.map((i) => i.pointer)
    ).toStrictEqual(["hero[1]"]);
  });
});

const groups = [
  { label: "Paint", names: ["Ada", "Bo", "Cy"], values: [12, 75, 40] },
  { label: "Tile", names: ["Ada", "Bo", "Cy"], values: [30, 9, 18] },
];

const strip = (props: Partial<ComponentProps<typeof JitterStrip>>) =>
  renderToString(
    createElement(JitterStrip, {
      data: groups,
      format: (v: number) => `${String(v)}%`,
      height: 200,
      width: 640,
      ...props,
    })
  );

describe("JitterStrip hero and context", () => {
  it("draws every named record solid, in every group", () => {
    const html = strip({ hero: ["Ada", "Bo"] });
    expect(html.match(/class="fill-hero stroke-paper"/gu)).toHaveLength(4);
    expect(html).toContain("Paint, 3 records, median 40%, Ada 12%, Bo 75%");
  });

  it("grey rings are l4; opacity rings are the ink at low opacity", () => {
    expect(strip({ hero: ["Bo"] })).toContain("stroke-l4");
    const html = strip({ context: "opacity", hero: ["Bo"] });
    expect(html).toContain("stroke-ink opacity-25");
    expect(html).not.toContain("stroke-l4");
  });
});
