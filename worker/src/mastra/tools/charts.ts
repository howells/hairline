// The tools a calling agent needs: an index of the charts, and one render tool
// per chart whose inputSchema is that chart's own Zod schema, so every client
// sees the exact data shape and Mastra rejects a bad payload before it runs.
// None of them calls a model.
import { registry } from "@howells/hairline/schema";
import type { ChartEntry, Payload } from "@howells/hairline/schema";
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

const toolId = (chart: ChartEntry) => `render-${chart.kind}`;

export const listCharts = createTool({
  description:
    "List Hairline's charts: each one's kind, the jobs it does (FT Visual Vocabulary), when to use it, and the render tool that draws it. Filter by job to narrow the list. The render tool's input schema is the chart's data shape.",
  execute: async ({ job }) => ({
    charts: registry
      .filter((chart) => job === undefined || chart.jobs.includes(job))
      .map((chart) => ({
        jobs: chart.jobs,
        kind: chart.kind,
        limits: chart.limits,
        tool: toolId(chart),
        whenToUse: chart.whenToUse,
      })),
  }),
  id: "list-charts",
  inputSchema: z.object({
    job: z.enum(JOBS).optional().describe("Only charts that do this job."),
  }),
  mcp: { annotations: { readOnlyHint: true } },
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "a #rrggbb colour");

const outputSchema = {
  format: z
    .enum(["document", "fragment", "react"])
    .default("document")
    .describe(
      'document: a standalone HTML page with its styles inlined. fragment: the chart\'s HTML and SVG, and the URL of the stylesheet it needs, for your own page. react: a component snippet and install steps.'
    ),
  height: z.number().int().min(120).max(2000).default(400),
  theme: z
    .union([
      z.enum(["light", "dark"]),
      z.object({
        alert: hex.optional(),
        hero: hex.optional(),
        ink: hex,
        mode: z.enum(["light", "dark"]),
        paper: hex,
      }),
    ])
    .default("light")
    .describe("light, dark, or your own paper, ink and optional hero colour."),
  title: z.string().max(200).optional().describe("The document's <title>."),
  width: z.number().int().min(240).max(2400).default(720),
};

const renderTool = (chart: ChartEntry) =>
  createTool({
    description: `Draw a ${chart.component} chart. Use it for: ${chart.whenToUse} Not for: ${chart.whenNotToUse} payload: ${chart.dataShape}`,
    execute: async ({ format, height, payload, theme, title, width }) =>
      render(
        {
          chart,
          format,
          height,
          payload: payload as Payload,
          theme: typeof theme === "string" ? THEMES[theme] : theme,
          title,
          width,
        },
        publicOrigin()
      ),
    id: toolId(chart),
    inputSchema: z.object({ payload: chart.schema, ...outputSchema }),
    mcp: { annotations: { idempotentHint: true, readOnlyHint: true } },
  });

/** One render tool per registered chart, keyed by tool id. */
export const renderTools = Object.fromEntries(
  registry.map((chart) => [toolId(chart), renderTool(chart)])
);
