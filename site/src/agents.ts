// What agents read, from the registry: the details block at the top of
// llms.txt, and the Markdown form of the site's own components, so the .md
// mirror and llms-full.txt carry each props table as a table.
import type { ChartEntry } from "@howells/hairline/schema";
import type { ComponentMarkdown } from "blume";
import { z } from "zod";

/** The llms.txt details: when to reach for Hairline, and every kind with its JSON Schema. */
export const agentDetails = (registry: readonly ChartEntry[]) =>
  [
    "Hairline (`@howells/hairline`) is an engraved chart library for React. Reach for it when a page, a slide or an export needs one of the charts below in a fixed house style, drawn from validated JSON. The package is not yet on npm.",
    "Pick a chart by its job, write the payload to its JSON Schema, and check it with `getChart(kind).validate(payload)` from `@howells/hairline/schema`, which is React-free, before you render. Data is required: the package never draws demo data. `@howells/hairline/json-schema/index.json` lists every kind and its schema file.",
    "Every chart in the registry:",
    registry
      .map(
        (chart) =>
          `- \`${chart.kind}\` (${chart.component}): import \`@howells/hairline/${chart.kind}\`, JSON Schema \`@howells/hairline/json-schema/${chart.kind}.json\`. Jobs: ${chart.jobs.join(", ")}. ${chart.whenToUse}`
      )
      .join("\n"),
  ].join("\n\n");

const Rows = z.array(
  z.object({
    deprecated: z.boolean(),
    description: z.string(),
    name: z.string(),
    required: z.boolean(),
    type: z.string(),
  })
);

/** A table cell: pipes escaped, so a union type stays in its column. */
const cell = (text: string) => text.replaceAll("|", String.raw`\|`);

/** <Props rows={…}> as a Markdown table. */
const props: ComponentMarkdown = (context) => {
  const rows = Rows.parse(context.props.rows);

  return [
    "| Prop | Type | Required | Description |",
    "| --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| \`${row.name}\` | \`${cell(row.type)}\` | ${row.required ? "yes" : "no"} | ${cell(row.deprecated ? `Deprecated. ${row.description}` : row.description)} |`
    ),
  ].join("\n");
};

/** The live chart has no Markdown form; the code under it is the example. */
const chartExample: ComponentMarkdown = () => "";

export const markdownComponents = {
  ChartExample: chartExample,
  Props: props,
};
