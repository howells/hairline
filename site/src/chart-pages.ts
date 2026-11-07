// A Blume content source with one page per chart, written from the package's
// registry, its zod schemas and its published JSON Schemas. A chart added to
// the registry gets a page here with no edit; nothing on these pages is
// typed by hand except the order of the sections.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import { registry } from "@howells/hairline/schema";
import type { ChartEntry } from "@howells/hairline/schema";
import type { ContentSource, SourceEntry } from "blume/sources";

import { exampleCode } from "./examples";
import { propsOf } from "./props";

const require = createRequire(import.meta.url);

/** The JSON Schema the package publishes for a kind, as a consumer reads it. */
const publishedSchema = (kind: string) =>
  readFileSync(
    require.resolve(`@howells/hairline/json-schema/${kind}.json`),
    "utf-8"
  ).trim();

/**
 * Registry prose as MDX text: code spans stay as written, and outside them
 * the characters MDX would read as JSX or an expression are escaped.
 */
export const prose = (text: string) =>
  text
    .split(/(?<code>`[^`]*`)/u)
    .map((part) =>
      part.startsWith("`") ? part : part.replaceAll(/[{}<>]/gu, (c) => `\\${c}`)
    )
    .join("");

const WORDS = ["no", "one", "two", "three", "four", "five", "six"];

const count = (n: number) => WORDS[n] ?? String(n);

const range = ({ max, min }: { max: number; min: number }) =>
  min === max ? count(max) : `${count(min)} to ${count(max)}`;

const jobs = (chart: ChartEntry) => {
  const [first, ...rest] = chart.jobs.map((job) => job.replaceAll("-", " "));

  return rest.length === 0 ? first : `${first}, then ${rest.join(", ")}`;
};

/** Plain-words limits: "It takes one to 24 items and one series." */
const limits = (chart: ChartEntry) => {
  const { categories, series } = chart.limits;

  return categories === undefined
    ? `It takes ${range(series)} series.`
    : `It takes ${range(categories)} items and ${range(series)} series.`;
};

const fence = (language: string, code: string) =>
  [`\`\`\`${language}`, code, "```"].join("\n");

const validation = (kind: string) =>
  fence(
    "ts",
    [
      'import { getChart } from "@howells/hairline/schema";',
      "",
      `const result = getChart("${kind}").validate(payload);`,
      "// { ok: true, value } or { ok: false, issues: [{ pointer, message }] }",
    ].join("\n")
  );

/** The page's MDX body, below the title and the lede. */
export const chartBody = (chart: ChartEntry) =>
  [
    `<ChartExample kind="${chart.kind}" />`,
    "## Code",
    fence("tsx", exampleCode(chart.component, chart.kind)),
    "The figures are rounded, for illustration.",
    "## When not to use it",
    prose(chart.whenNotToUse),
    "## Data",
    prose(chart.dataShape),
    `${limits(chart)} Its jobs in the FT Visual Vocabulary: ${jobs(chart)}.`,
    "Check a payload before you draw it:",
    validation(chart.kind),
    "## Props",
    `<Props rows={${JSON.stringify(propsOf(chart.schema))}} />`,
    "## JSON Schema",
    `The package publishes it as \`@howells/hairline/json-schema/${chart.kind}.json\`.`,
    `<Expandable title="Show the schema">\n\n${fence("json", publishedSchema(chart.kind))}\n\n</Expandable>`,
    "",
  ].join("\n\n");

const frontmatter = (chart: ChartEntry, order: number) =>
  [
    "---",
    `title: ${chart.component}`,
    `description: ${JSON.stringify(chart.whenToUse)}`,
    "sidebar:",
    `  order: ${order}`,
    "---",
    "",
  ].join("\n");

const page = (chart: ChartEntry, order: number): SourceEntry => {
  const body = chartBody(chart);

  return {
    body: { format: "mdx", text: body },
    data: {
      description: chart.whenToUse,
      sidebar: { order },
      title: chart.component,
    },
    raw: `${frontmatter(chart, order)}${body}`,
    ref: `${chart.kind}.mdx`,
    slug: chart.kind,
  };
};

/** The source: the six charts in the registry's order, under /charts. */
export const chartPages: ContentSource = {
  load: async () => ({
    diagnostics: [],
    entries: registry.map((chart, index) => page(chart, index + 1)),
    folderMeta: { charts: { order: 4, title: "Charts" } },
  }),
  name: "charts",
  prefix: "charts",
  staged: true,
};
