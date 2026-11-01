// Seam 1: the built package, for a host with no Tailwind. One precompiled
// stylesheet (hairline.css) carries the tokens, text roles, rules, textures and
// motion; nothing here compiles anything with Tailwind. The visual comparison
// with the gallery is HAI-16's.
import { readFileSync } from "node:fs";

import {
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  RungBars,
  Slope,
} from "@howells/hairline";
import { Frame } from "@howells/hairline/frame";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const lib = (name: string) =>
  readFileSync(new URL(`../lib/${name}`, import.meta.url), "utf-8");
const sheet = lib("hairline.css");
const bare = sheet.replaceAll(/\/\*[\s\S]*?\*\//gu, "");

const sized = { height: 320, width: 480 };
const charts = {
  DumbbellQueue: renderToString(
    createElement(DumbbellQueue, {
      data: [
        { after: 10, before: 4, label: "North" },
        { after: 3, before: 8, label: "South" },
      ],
      ...sized,
    })
  ),
  Frame: renderToString(
    createElement(Frame, {
      // oxlint-disable-next-line react/no-children-prop -- createElement's children argument does not satisfy the required prop
      children: createElement(RungBars, {
        data: [
          { label: "2021", value: 19 },
          { label: "2022", value: 11 },
        ],
        ...sized,
      }),
      footnote: "A footnote",
      name: "Name",
      note: "A note",
      source: "A source",
    })
  ),
  HairlineArea: renderToString(
    createElement(HairlineArea, {
      data: [
        { date: "2024-03-04", value: 3 },
        { date: "2024-03-05", value: 6 },
        { date: "2024-03-06", value: 5 },
      ],
      ...sized,
    })
  ),
  HairlineLine: renderToString(
    createElement(HairlineLine, {
      data: [
        { date: "2024-03-04", value: 10 },
        { date: "2024-03-05", value: 14 },
        { date: "2024-03-06", value: 9 },
      ],
      ...sized,
    })
  ),
  PlumbScatter: renderToString(
    createElement(PlumbScatter, {
      data: [
        { label: "Alder", x: 10, y: 30 },
        { label: "Birch", x: 40, y: 12 },
      ],
      emphasis: "Birch",
      ...sized,
    })
  ),
  RungBars: renderToString(
    createElement(RungBars, {
      data: [
        { label: "2021", value: 19 },
        { label: "2022", value: 11 },
      ],
      ...sized,
    })
  ),
  Slope: renderToString(
    createElement(Slope, {
      labels: ["2023", "2024"],
      rows: [
        { from: 280, name: "North", to: 120 },
        { from: 200, name: "South", to: 240 },
      ],
      ...sized,
    })
  ),
};

/** Every class a chart prints, split from its class attributes. */
const classesOf = (html: string) =>
  new Set(
    [...html.matchAll(/class="(?<value>[^"]*)"/gu)].flatMap(
      (m) =>
        m.groups?.value
          ?.replaceAll("&amp;", "&")
          .split(/\s+/u)
          .filter(Boolean) ?? []
    )
  );

/** Every class the stylesheet's selectors mention. */
const styled = new Set(
  [...bare.matchAll(/\.(?<name>(?:\\.|[\w-])+)/gu)].map((m) =>
    (m.groups?.name ?? "").replaceAll(/\\(?<char>.)/gu, "$<char>")
  )
);

describe("the precompiled stylesheet covers the six charts", () => {
  it.each(Object.entries(charts))(
    "%s: every class it emits has a rule",
    (_name, html) => {
      const classes = [...classesOf(html)];
      expect(classes.length).toBeGreaterThan(3);
      const missing = classes.filter((c) => !styled.has(c));
      expect(missing).toStrictEqual([]);
    }
  );

  it("carries the motion keyframes, the text roles and the rules", () => {
    for (const needle of [
      "@keyframes hl-grow-x",
      "@keyframes hl-draw",
      ".hl-root .t-axis",
      ".hl-root .t-value",
      ".hl-root .hairline",
      ".hl-root .grid-line",
      ".hl-root .fill-hero",
      "--hl-paper: ",
    ]) {
      expect(sheet).toContain(needle);
    }
  });
});

describe("the precompiled stylesheet stays inside the Hairline root", () => {
  const rules = bare
    .replaceAll(
      /@(?:keyframes|property)[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/gu,
      ""
    )
    .split("{")
    .slice(0, -1)
    .map((chunk) => chunk.split(/[};]/u).pop()?.trim() ?? "")
    .filter(
      (s) => s !== "" && !s.startsWith("@") && !/^(?:from|to|\d+%)/u.test(s)
    );

  it("every selector sits under .hl-root", () => {
    const loose = rules
      .flatMap((s) => s.split(","))
      .map((s) => s.trim())
      .filter((s) => !s.includes(".hl-root"));
    expect(rules.length).toBeGreaterThan(100);
    expect(loose).toStrictEqual([]);
  });

  it("sets nothing on :root, html or body, and has no layers", () => {
    expect(bare).not.toMatch(/:root|:host|(?:^|[\s,])(?:html|body)\b|@layer/u);
  });

  it("reads and declares only hl-prefixed custom properties", () => {
    const names = [...bare.matchAll(/--[\w-]+/gu)].map((m) => m[0]);
    expect(names.length).toBeGreaterThan(200);
    expect(names.filter((n) => !n.startsWith("--hl-"))).toStrictEqual([]);
  });

  it("names its keyframes with the prefix, and Tailwind's internals too", () => {
    const keyframes = [...bare.matchAll(/@keyframes\s+(?<name>[\w-]+)/gu)].map(
      (m) => m.groups?.name
    );
    expect(keyframes.length).toBeGreaterThan(0);
    expect(
      keyframes.filter((k) => k?.startsWith("hl-") !== true)
    ).toStrictEqual([]);
  });

  it("falls back to a literal font stack when the host sets no --hl-font", () => {
    expect(bare).toMatch(/font-family:\s*var\(--hl-font,\s*[^)]*sans-serif/u);
    expect(bare).not.toContain("--font-sans");
  });

  it("hides unrevealed plots on screens only", () => {
    expect(bare).toMatch(
      /@media screen and \(prefers-reduced-motion: no-preference\)\s*\{[^@]*is-hidden/u
    );
  });
});
