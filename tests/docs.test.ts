// Seam: the docs. The docs site (site/) has a page per chart written from the
// registry and the schemas, its llms.txt lists every kind with its JSON
// Schema, its colours come from deriveTheme, the gallery grid stays free of
// prose and of docs, and the README says only what the code does. Run with
// `pnpm test`, which builds lib/ first.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registry } from "@howells/hairline/schema";
import { deriveTheme } from "@howells/hairline/theme";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { agentDetails, markdownComponents } from "../site/src/agents";
import { chartBody, chartPages, prose } from "../site/src/chart-pages";
import { EXAMPLES } from "../site/src/examples";
import { propsOf } from "../site/src/props";
import { stylesheet } from "../site/src/theme";
import { ALL_ENTRIES } from "../src/gallery/registry";
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
/** The property names the schema itself declares, from its JSON Schema. */
const declared = (schema: z.ZodType) =>
  Object.keys(
    z
      .object({ properties: z.record(z.string(), z.unknown()) })
      .parse(z.toJSONSchema(schema, { io: "input" })).properties
  );
const kinds = registry.map((chart) => chart.kind);

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

  it("merges union members that read the same, such as two string formats", () => {
    const data = propsOf(chartFor("hairline-line").schema).find(
      (row) => row.name === "data"
    );
    expect(data?.type).toBe(
      "{ date: string; value: number | null; id?: string }[]"
    );
  });

  it("describes every prop, so no cell of the table is blank", () => {
    const blank = registry.flatMap((chart) =>
      propsOf(chart.schema)
        .filter((row) => (row.description ?? "").length === 0)
        .map((row) => `${chart.kind}.${row.name}`)
    );
    expect(blank).toStrictEqual([]);
  });

  it("describes every field of a datum in the JSON Schema", () => {
    const Items = z.object({
      properties: z.record(
        z.string(),
        z.object({ items: z.unknown().optional() })
      ),
    });
    const Fields = z.object({
      properties: z.record(
        z.string(),
        z.object({ description: z.string().optional() })
      ),
    });
    const blank = registry.flatMap((chart) => {
      const top = Items.parse(z.toJSONSchema(chart.schema, { io: "input" }));
      return Object.entries(top.properties).flatMap(([name, node]) => {
        const items = Fields.safeParse(node.items);
        if (!items.success) {
          return [];
        }
        return Object.entries(items.data.properties)
          .filter(([, field]) => (field.description ?? "").length === 0)
          .map(([field]) => `${chart.kind}.${name}[].${field}`);
      });
    });
    expect(blank).toStrictEqual([]);
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
    expect(Object.keys(EXAMPLES).toSorted()).toStrictEqual(kinds.toSorted());
  });

  it.each(Object.entries(EXAMPLES))("%s", (kind, payload) => {
    expect(chartFor(kind).validate(payload).ok).toBe(true);
  });
});

/** The chart pages the site's content source writes. */
const load = async () => {
  const result = await chartPages.load();
  return result.entries;
};

describe("the docs site has a page for every chart", () => {
  it("one page per registry kind, under /charts, in registry order", async () => {
    const entries = await load();
    expect(chartPages.prefix).toBe("charts");
    expect(entries.map((entry) => entry.slug)).toStrictEqual(kinds);
    for (const entry of entries) {
      expect(entry.body.format).toBe("mdx");
      expect(entry.raw?.endsWith(entry.body.text)).toBe(true);
    }
  });

  it.each(kinds)("%s: title, guidance and data shape", async (kind) => {
    const chart = chartFor(kind);
    const entries = await load();
    const entry = entries.find((e) => e.slug === kind);
    expect(entry?.data).toMatchObject({
      description: chart.whenToUse,
      title: chart.component,
    });
    const body = chartBody(chart);
    expect(body).toContain(prose(chart.whenNotToUse));
    expect(body).toContain(prose(chart.dataShape));
  });

  it.each(kinds)("%s: live example, code, props and JSON Schema", (kind) => {
    const chart = chartFor(kind);
    const body = chartBody(chart);
    expect(body).toContain(`<ChartExample kind="${kind}" />`);
    expect(body).toContain(
      `import { ${chart.component} } from "@howells/hairline/${kind}";`
    );
    expect(body).toContain(`getChart("${kind}").validate(payload)`);
    // The props: every declared property, from the generated rows.
    const props = /<Props rows=\{(?<rows>.*)\} \/>/u.exec(body)?.groups?.rows;
    const rows = z
      .array(z.object({ name: z.string() }))
      .parse(JSON.parse(props ?? "[]"));
    expect(rows.map((row) => row.name).toSorted()).toStrictEqual(
      declared(chart.schema).toSorted()
    );
    // The JSON Schema in full, as the package publishes it.
    expect(body).toContain(read(`lib/json-schema/${kind}.json`).trim());
  });

  it("escapes registry prose for MDX, but not inside code", () => {
    expect(prose("data: { a: number }[], or `{ b }`")).toBe(
      String.raw`data: \{ a: number \}[], or ${"`{ b }`"}`
    );
    expect(prose("a <b>")).toBe(String.raw`a \<b\>`);
  });
});

describe("what agents read", () => {
  const details = agentDetails(registry);

  it("llms.txt's details list every registry kind with its JSON Schema", () => {
    for (const chart of registry) {
      expect(details).toContain(`\`${chart.kind}\` (${chart.component})`);
      expect(details).toContain(
        `@howells/hairline/json-schema/${chart.kind}.json`
      );
      expect(details).toContain(`@howells/hairline/${chart.kind}`);
    }
    expect(details).toContain("json-schema/index.json");
  });

  it("the details carry no headings, as llms.txt reserves them", () => {
    expect(details).not.toMatch(/^#/mu);
  });

  it("a props table reaches the Markdown mirror as a table, every row", () => {
    const rows = propsOf(chartFor("rung-bars").schema);
    const table =
      markdownComponents.Props({
        childBlocks: () => [],
        childComponents: () => [],
        children: "",
        frontmatter: {},
        lossy: false,
        props: {
          rows: rows.map((row) => ({
            deprecated: row.deprecated,
            description: row.description ?? "",
            name: row.name,
            required: row.required,
            type: row.type,
          })),
        },
      }) ?? "";
    expect(table.split("\n")).toHaveLength(rows.length + 2);
    expect(table).toContain(String.raw`\| "mount" \|`);
  });
});

describe("the site's colours are deriveTheme's", () => {
  const css = stylesheet();
  const light = deriveTheme({ ink: "#1d1d1b", paper: "#fbfbf9" });
  const dark = deriveTheme({ ink: "#f0eeeb", mode: "dark", paper: "#181715" });

  const [lightBlock, darkBlock] = css.split("\n\n");

  it("sets Blume's light page and text from the light paper and ink", () => {
    expect(lightBlock).toContain(':root:root:not([data-theme="dark"])');
    expect(lightBlock).toContain(`--blume-background: ${light["--hl-paper"]}`);
    expect(lightBlock).toContain(`--blume-foreground: ${light["--hl-ink"]}`);
  });

  it("sets Blume's dark page and text from the dark paper and ink", () => {
    expect(darkBlock).toContain(':root:root[data-theme="dark"]');
    expect(darkBlock).toContain(`--blume-background: ${dark["--hl-paper"]}`);
    expect(darkBlock).toContain(`--blume-foreground: ${dark["--hl-ink"]}`);
  });

  it("gives the charts every token of each mode", () => {
    for (const [name, value] of Object.entries(dark)) {
      expect(css).toContain(`${name}: ${value};`);
    }
    for (const name of Object.keys(light)) {
      expect(css).toContain(`${name}:`);
    }
  });
});

describe("the gallery carries no prose and no docs", () => {
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

  it("has no docs route or link: the docs are the site in site/", () => {
    expect(read("src/app.tsx")).not.toContain("docs");
    expect(existsSync(path.join(root, "src/pages/docs.tsx"))).toBe(false);
  });
});

describe("the README is accurate where that can be checked", () => {
  const readme = read("README.md");

  it("points at the docs site, which exists", () => {
    expect(readme).toContain("(site)");
    expect(existsSync(path.join(root, "site/blume.config.ts"))).toBe(true);
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
    expect(read("site/docs/data.mdx")).not.toContain("Fieldnote");
  });

  it("covers theming, the server mode and the export mode", () => {
    expect(readme).toContain("deriveTheme");
    expect(readme).toContain("renderToString");
    expect(readme).toContain("scale");
  });
});
