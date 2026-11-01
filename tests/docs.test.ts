// Seam: the docs. Each chart has a docs route with a props table generated
// from its schema, the gallery grid stays free of prose, llms.txt lists the
// registry, and the README says only what the code does. Run with
// `pnpm test`, which builds lib/ first.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registry } from "@howells/hairline/schema";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { llmsTxt } from "../scripts/llms-text";
import { EXAMPLES } from "../src/docs/examples";
import { propsOf } from "../src/docs/props";
import { ALL_ENTRIES } from "../src/gallery/registry";
import { DocsChart, DocsIndex, Philosophy } from "../src/pages/docs";
import { ChartGrid } from "../src/pages/gallery";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file: string) => readFileSync(path.join(root, file), "utf-8");
const escaped = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
const chartFor = (kind: string) => {
  const chart = registry.find((c) => c.kind === kind);
  if (chart === undefined) {
    throw new Error(`No chart ${kind}`);
  }
  return chart;
};
const docsFor = (kind: string) =>
  renderToString(createElement(DocsChart, { kind }));
/** The property names the schema itself declares, from its JSON Schema. */
const declared = (schema: z.ZodType) =>
  Object.keys(
    z
      .object({ properties: z.record(z.string(), z.unknown()) })
      .parse(z.toJSONSchema(schema, { io: "input" })).properties
  );

describe("the props table is generated from the schema", () => {
  it("has a row for every property the schema declares", () => {
    for (const chart of registry) {
      const names = propsOf(chart.schema).map((row) => row.name);
      expect(names.toSorted()).toStrictEqual(declared(chart.schema).toSorted());
    }
  });

  it("writes types from the schema, nested data included", () => {
    const rows = propsOf(chartFor("rung-bars").schema);
    const byName = (name: string) => rows.find((row) => row.name === name);
    expect(byName("data")).toMatchObject({
      required: true,
      type: "{ label: string; value: number; id?: string }[]",
    });
    expect(byName("animate")?.type).toBe('"scroll" | "mount" | "off"');
    expect(byName("unit")).toMatchObject({ required: false, type: "number" });
  });

  it("flags a deprecated prop", () => {
    const note = propsOf(chartFor("rung-bars").schema).find(
      (row) => row.name === "note"
    );
    expect(note?.deprecated).toBe(true);
  });
});

describe("every example is a valid payload", () => {
  it("there is one for every kind in the registry", () => {
    expect(Object.keys(EXAMPLES).toSorted()).toStrictEqual(
      registry.map((chart) => chart.kind).toSorted()
    );
  });

  it.each(Object.entries(EXAMPLES))("%s", (kind, payload) => {
    expect(chartFor(kind).validate(payload).ok).toBe(true);
  });
});

describe("each chart has a docs route", () => {
  it.each(registry.map((chart) => chart.kind))("%s", (kind) => {
    const chart = chartFor(kind);
    const html = docsFor(kind);
    expect(html).toContain(chart.component);
    expect(html).toContain(escaped(chart.dataShape));
    expect(html).toContain(escaped(chart.whenToUse));
    expect(html).toContain(escaped(chart.whenNotToUse));
  });

  it.each(registry.map((chart) => chart.kind))(
    "%s: its example, schema and props table",
    (kind) => {
      const chart = chartFor(kind);
      const html = docsFor(kind);
      expect(html).toContain(`json-schema/${kind}.json`);
      expect(html).toContain(`from &quot;@howells/hairline/${kind}&quot;`);
      // The props table: one row for every declared property.
      for (const name of declared(chart.schema)) {
        expect(html).toMatch(new RegExp(`<code[^>]*>${name}</code>`, "u"));
      }
      expect(html).toContain("<table");
    }
  );

  it("says so for an unknown kind", () => {
    expect(docsFor("pie")).toContain("No chart called pie");
  });

  it("the index links to all six", () => {
    const html = renderToString(createElement(DocsIndex));
    for (const chart of registry) {
      expect(html).toContain(`href="#/docs/${chart.kind}"`);
    }
    expect(html).toContain('href="#/docs/philosophy"');
  });

  it("the philosophy says what is fixed and what is configurable", () => {
    const html = renderToString(createElement(Philosophy));
    expect(html).toContain("Fixed");
    expect(html).toContain("Configurable");
  });
});

describe("the gallery grid carries no prose", () => {
  const html = renderToString(createElement(ChartGrid));

  it("holds each chart's name and nothing from the docs", () => {
    for (const entry of ALL_ENTRIES) {
      expect(html).toContain(`aria-label="${escaped(entry.name)}"`);
    }
    for (const chart of registry) {
      expect(html).not.toContain(escaped(chart.whenToUse));
      expect(html).not.toContain(escaped(chart.dataShape));
    }
    expect(html).not.toContain("#/docs");
  });

  it("has no headings or paragraphs of its own", () => {
    const main = html.slice(0, html.indexOf("</main>"));
    // The (i) popovers are the existing per-chart notes; the grid adds none.
    const outside = main.replaceAll(/<div[^>]*popover[\s\S]*?<\/div>/gu, "");
    expect(outside).not.toMatch(/<h[1-6][\s>]/u);
    expect(outside).not.toMatch(/<p[\s>]/u);
  });
});

describe("llms.txt", () => {
  const text = read("public/llms.txt");

  it("is the generated file, not a hand edit", () => {
    expect(text).toBe(llmsTxt(registry));
  });

  it("lists every registry kind with its JSON Schema path", () => {
    for (const chart of registry) {
      expect(text).toContain(chart.kind);
      expect(text).toContain(`json-schema/${chart.kind}.json`);
      expect(text).toContain(chart.component);
    }
  });
});

describe("the README is accurate where that can be checked", () => {
  const readme = read("README.md");

  it("links llms.txt and the philosophy, which exist", () => {
    expect(readme).toContain("(public/llms.txt)");
    expect(readme).toContain("(docs/PHILOSOPHY.md)");
    expect(existsSync(path.join(root, "public/llms.txt"))).toBe(true);
    expect(existsSync(path.join(root, "docs/PHILOSOPHY.md"))).toBe(true);
  });

  it("points only at files that exist", () => {
    const links = [...readme.matchAll(/\]\((?<href>[^)#]+)\)/gu)]
      .map((m) => m.groups?.href ?? "")
      .filter((href) => !href.startsWith("http"));
    for (const href of links) {
      expect(existsSync(path.join(root, href)), href).toBe(true);
    }
  });

  it("names only package subpaths that are exported", () => {
    const { exports } = z
      .object({ exports: z.record(z.string(), z.unknown()) })
      .parse(JSON.parse(read("package.json")));
    const used = new Set(
      [...readme.matchAll(/@howells\/hairline\/(?<sub>[\w./*-]+)/gu)].map(
        (m) => `./${(m.groups?.sub ?? "").replace(/\/$/u, "")}`
      )
    );
    for (const sub of used) {
      const known = sub.startsWith("./json-schema")
        ? "./json-schema/*" in exports
        : sub in exports;
      expect(known, sub).toBe(true);
    }
  });

  it("describes the install as forthcoming and gives the local build", () => {
    expect(readme).toMatch(/not yet published to npm/iu);
    expect(readme).toContain("pnpm build:lib");
  });

  it("no longer describes Fieldnote data or the old example", () => {
    expect(readme).not.toContain("Fieldnote");
    expect(readme).not.toContain("PairedRungs");
    expect(read("docs/DATA.md")).not.toContain("Fieldnote");
  });

  it("covers theming, the server mode and the export mode", () => {
    expect(readme).toContain("deriveTheme");
    expect(readme).toContain("renderToString");
    expect(readme).toContain("scale");
  });
});
