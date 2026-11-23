// The chart index, and one render tool per registered chart whose inputSchema
// is that chart's own Zod schema, so a caller sees the exact data shape and a
// bad payload is rejected before anything is drawn. None of them calls a model.
import { registry } from "@howells/hairline/schema";
import type { ChartEntry } from "@howells/hairline/schema";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { publicOrigin } from "../origin";
import { render, THEMES } from "../render";

const JOBS = [
  "change-over-time",
  "correlation",
  "deviation",
  "distribution",
  "flow",
  "magnitude",
  "part-to-whole",
  "ranking",
  "spatial",
] as const;

export const renderToolId = (chart: ChartEntry) => `render-${chart.kind}`;

/** Every registered kind, as a Zod enum. */
export const kindSchema = z
  .enum(registry.map((chart) => chart.kind))
  .describe("A chart kind from list-charts.");

const limitsSchema = z.object({
  categories: z.object({ max: z.number(), min: z.number() }).optional(),
  series: z.object({ max: z.number(), min: z.number() }),
});

export const listCharts = createTool({
  description:
    "List Hairline's charts: each one's kind, the jobs it does (FT Visual Vocabulary), when to use it and when not to, and how much data it takes. Filter by job to narrow the list. Then call get-chart-tool with a kind for its exact input schema, and render-chart to draw it.",
  execute: async ({ job }) => ({
    charts: registry.flatMap((chart) =>
      job === undefined || chart.jobs.includes(job)
        ? [
            {
              jobs: [...chart.jobs],
              kind: chart.kind,
              limits: chart.limits,
              whenNotToUse: chart.whenNotToUse,
              whenToUse: chart.whenToUse,
            },
          ]
        : []
    ),
  }),
  id: "list-charts",
  inputSchema: z.object({
    job: z.enum(JOBS).optional().describe("Only charts that do this job."),
  }),
  mcp: {
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: true,
      title: "List charts",
    },
  },
  outputSchema: z.object({
    charts: z.array(
      z.object({
        jobs: z.array(z.enum(JOBS)),
        kind: z.string(),
        limits: limitsSchema,
        whenNotToUse: z.string(),
        whenToUse: z.string(),
      })
    ),
  }),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/u, "a #rrggbb colour");

const renderOptions = {
  format: z
    .enum(["fragment", "document", "react"])
    .default("fragment")
    .describe(
      "fragment (default): the chart's HTML and SVG, and the URL of the stylesheet it needs, to place in your own page. document: a standalone HTML page with the stylesheet inlined (about 35 KB more). react: a component snippet and install steps."
    ),
  height: z
    .number()
    .int()
    .min(120)
    .max(2000)
    .default(400)
    .describe("Height in CSS pixels, 120 to 2000. Default 400."),
  theme: z
    .union([
      z.enum(["light", "dark"]),
      z.object({
        alert: hex
          .optional()
          .describe(
            "Colour for thresholds and regressions, e.g. #c05951. Optional."
          ),
        hero: hex
          .optional()
          .describe(
            "Colour of the one highlighted element, e.g. #b4532f. Optional; defaults to the ink."
          ),
        ink: hex.describe("The strongest mark and text colour, e.g. #1d1b18."),
        mode: z
          .enum(["light", "dark"])
          .describe("Whether the paper is light or dark."),
        paper: hex.describe("The background colour, e.g. #fbfbf9."),
      }),
    ])
    .default("light")
    .describe(
      '"light", "dark", or your own paper, ink and optional hero and alert colours.'
    ),
  title: z
    .string()
    .max(200)
    .optional()
    .describe("The document's <title>; used by format document only."),
  width: z
    .number()
    .int()
    .min(240)
    .max(2400)
    .default(720)
    .describe("Width in CSS pixels, 240 to 2400. Default 720."),
};

/** What a render tool takes: the chart's own payload schema, and how to draw it. */
export const renderInputSchema = (chart: ChartEntry) =>
  z.object({
    payload: chart.schema.describe(
      `The ${chart.component} chart's data and options. ${chart.dataShape}`
    ),
    ...renderOptions,
  });

export type RenderInput = z.infer<ReturnType<typeof renderInputSchema>>;

export const renderedSchema = z.discriminatedUnion("format", [
  z.object({
    format: z.literal("fragment"),
    html: z
      .string()
      .describe("The chart: a div.hl-root holding its SVG and labels."),
    stylesheet: z
      .string()
      .describe("The URL of the stylesheet the fragment needs, once per page."),
  }),
  z.object({
    format: z.literal("document"),
    html: z.string().describe("A standalone HTML page."),
  }),
  z.object({
    code: z.string().describe("A React component that draws the chart."),
    format: z.literal("react"),
    install: z.string().describe("How to install and set up the package."),
  }),
]);

/** Draw a validated render input. */
export const drawChart = (chart: ChartEntry, input: RenderInput) => {
  // The chart's schema already accepted it; this proves it is JSON, which the drawer takes.
  const payload = z.json().parse(input.payload);

  return render(
    {
      chart,
      format: input.format,
      height: input.height,
      payload,
      theme:
        input.theme === "light" || input.theme === "dark"
          ? THEMES[input.theme]
          : input.theme,
      title: input.title,
      width: input.width,
    },
    publicOrigin()
  );
};

const renderTool = (chart: ChartEntry) =>
  createTool({
    description: `Draw a ${chart.component} chart. Use it for: ${chart.whenToUse} Not for: ${chart.whenNotToUse} For other data, call list-charts to find a better chart.`,
    execute: async (input) => drawChart(chart, input),
    id: renderToolId(chart),
    inputSchema: renderInputSchema(chart),
    mcp: {
      annotations: {
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
        title: `Draw a ${chart.component}`,
      },
    },
    outputSchema: renderedSchema,
  });

/** One render tool per registered chart, keyed by tool id: Mastra's HTTP routes serve each. */
export const renderTools = Object.fromEntries(
  registry.map((chart) => [renderToolId(chart), renderTool(chart)])
);
