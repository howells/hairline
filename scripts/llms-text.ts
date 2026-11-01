// The text of public/llms.txt, built from the registry (given, so
// the script reads the built package and the test the same one) so it can
// only list what the package has. `pnpm llms` writes it; a test fails if the
// committed file is not this.
/** The parts of a registry entry the file reads. */
export interface Entry {
  component: string;
  jobs: readonly string[];
  kind: string;
  whenToUse: string;
}

const SITE = "https://hairline.danielhowells.com";
const REPO = "https://github.com/howells/hairline";

export const llmsTxt = (registry: readonly Entry[]) =>
  [
    "# Hairline",
    "",
    "> An engraved chart library for React. Each chart takes one JSON-serialisable payload that a zod schema validates, so an agent can pick a chart by the job it does, write the data to its shape and check it before rendering. The package is not yet on npm.",
    "",
    "## Choosing and checking a chart",
    "",
    "- The registry (`registry` and `getChart(kind)` from `@howells/hairline/schema`, React-free) lists every chart's `kind`, `component`, Visual Vocabulary `jobs`, `dataShape`, `limits`, `whenToUse` and `whenNotToUse`.",
    '- `getChart(kind).validate(payload)` returns the typed data or path-specific issues. Dates are ISO strings; formatters are descriptors (`"percent"` or Intl number-format options); a datum is addressed by `id`, else its label or date.',
    "- Data is required. The package never falls back to demo data.",
    '- For a server-rendered or exported chart pass `width` and `height`: a fixed-size chart is drawn and ready in the first HTML unless it asks for `animate: "scroll"` or `"mount"`.',
    "",
    "## Charts",
    "",
    ...registry.map((chart) =>
      [
        `- [${chart.component}](${SITE}/#/docs/${chart.kind}): kind \`${chart.kind}\`, import \`@howells/hairline/${chart.kind}\`, JSON Schema \`@howells/hairline/json-schema/${chart.kind}.json\`. Jobs: ${chart.jobs.join(", ")}. ${chart.whenToUse}`,
      ].join("\n")
    ),
    "",
    "## Docs",
    "",
    `- [Philosophy](${REPO}/blob/main/docs/PHILOSOPHY.md): what is fixed, what is configurable.`,
    `- [Data](${REPO}/blob/main/docs/DATA.md): the contract every payload follows.`,
    `- [README](${REPO}/blob/main/README.md): install, theming, server and export modes.`,
    "- JSON Schemas: `@howells/hairline/json-schema/index.json` lists every kind and its schema file; `pnpm build:lib` writes them into `lib/json-schema/`.",
    "",
  ].join("\n");
