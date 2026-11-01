// Seam 1: many charts on one page, as a deck viewer or print view renders
// them. Every texture, clip, mask and gradient id must be unique across the
// page, including across separate React roots told apart by an id prefix.
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  AreaDifference,
  Candlestick,
  HairlineArea,
  PairedRungs,
  RungBars,
  StackedRungs,
  StreamRibbon,
  TickBox,
} from "@howells/hairline";
import type { RungDatum } from "@howells/hairline";
import { IdScope } from "@howells/hairline/kit";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const bars: RungDatum[] = [
  { label: "2021", value: 19 },
  { label: "2022", value: 11 },
  { label: "2023", value: 7 },
];
const days = [
  { date: "2024-03-04", value: 3 },
  { date: "2024-03-05", value: 5 },
  { date: "2024-03-06", value: 4 },
];
const sized = { height: 320, width: 480 };

const ids = (html: string) =>
  [...html.matchAll(/\sid="(?<id>[^"]*)"/gu)].map((m) => m.groups?.id ?? "");
const duplicates = (list: string[]) => [
  ...new Set(list.filter((id, i) => list.indexOf(id) !== i)),
];
/** Every url(#x) reference in the html. */
const references = (html: string) =>
  [...html.matchAll(/url\(#(?<id>[^)]+)\)/gu)].map((m) => m.groups?.id ?? "");

// One React root holding charts with textures and clips, several of the same.
// A root's prefix comes from the IdScope provider, which works for every chart.
const root = (idPrefix?: string): string => {
  const charts = [
    createElement(RungBars, { data: bars, key: "a", ...sized }),
    createElement(RungBars, { data: bars, key: "b", ...sized }),
    createElement(RungBars, { data: bars, key: "c", ...sized }),
    createElement(HairlineArea, { data: days, key: "d", ...sized }),
    createElement(HairlineArea, { data: days, key: "e", ...sized }),
    createElement(AreaDifference, { key: "f" }),
    createElement(Candlestick, { key: "g" }),
    createElement(PairedRungs, { key: "h" }),
    createElement(StackedRungs, { key: "i" }),
    createElement(StreamRibbon, { key: "j" }),
    createElement(TickBox, { key: "k" }),
  ];
  const page = createElement("div", null, ...charts);
  return renderToString(
    idPrefix === undefined
      ? page
      : createElement(IdScope, { prefix: idPrefix }, page)
  );
};

describe("charts sharing a page", () => {
  it("several charts, several of the same, share no id", () => {
    const all = ids(root());
    // Three drawn bar charts, two textures each; the responsive charts have
    // no width on the server yet and add theirs once measured.
    expect(all.length).toBeGreaterThanOrEqual(6);
    expect(duplicates(all)).toStrictEqual([]);
  });

  it("every texture or clip reference resolves to an id on the page", () => {
    const html = root();
    const own = new Set(ids(html));
    expect(references(html).length).toBeGreaterThanOrEqual(6);
    expect(references(html).filter((r) => !own.has(r))).toStrictEqual([]);
  });

  it("two roots with different prefixes share no id", () => {
    expect(
      duplicates([...ids(root("deck-a")), ...ids(root("deck-b"))])
    ).toStrictEqual([]);
  });

  it("without a prefix two roots collide, the prefix is what separates them", () => {
    const a = new Set(ids(root()));
    expect(ids(root()).some((id) => a.has(id))).toBe(true);
  });

  it("a chart's idPrefix leads every id it draws", () => {
    const html = renderToString(
      createElement(RungBars, { data: bars, idPrefix: "slide-7", ...sized })
    );
    const all = ids(html);
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((id) => id.startsWith("slide-7-"))).toBe(true);
  });
});

const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]
  );

describe("chart source", () => {
  it("has no literal svg id", () => {
    const base = path.join(import.meta.dirname, "..", "src", "charts");
    const tag =
      /<(?:clipPath|mask|pattern|linearGradient|radialGradient|filter)\b[^>]*\sid="/u;
    const literal = files(base)
      .filter((f) => f.endsWith(".tsx"))
      .filter((f) => tag.test(readFileSync(f, "utf-8")));
    expect(literal).toStrictEqual([]);
  });
});
