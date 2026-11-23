// The three tools a calling agent needs: what charts exist, what one takes,
// and draw it. None of them calls a model.
import { getChart, registry } from "@howells/hairline/schema";
import type { Payload } from "@howells/hairline/schema";
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

export const listCharts = createTool({
  description:
    "List Hairline's charts: each one's kind, the jobs it does (FT Visual Vocabulary) and when to use it. Filter by job to narrow the list. Call describe-chart on a kind before writing its payload.",
  execute: async ({ job }) => ({
    charts: registry
      .filter((chart) => job === undefined || chart.jobs.includes(job))
      .map(({ jobs, kind, limits, whenToUse }) => ({ jobs, kind, limits, whenToUse })),
  }),
  id: "list-charts",
  inputSchema: z.object({
    job: z.enum(JOBS).optional().describe("Only charts that do this job."),
  }),
});

export const describeChart = createTool({
  description:
    "Everything needed to write one chart's payload: the JSON Schema it is validated against, the data shape in plain words, the limits on how much data it takes, and when not to use it.",
  execute: async ({ kind }) => {
    const chart = getChart(kind);

    if (chart === undefined) {
      throw new Error(`No chart of kind "${kind}". Call list-charts for the kinds.`);
    }

    return {
      component: chart.component,
      dataShape: chart.dataShape,
      jobs: chart.jobs,
      jsonSchema: z.toJSONSchema(chart.schema, { io: "input" }),
      kind: chart.kind,
      limits: chart.limits,
      whenNotToUse: chart.whenNotToUse,
      whenToUse: chart.whenToUse,
    };
  },
  id: "describe-chart",
  inputSchema: z.object({ kind: z.string().describe("A kind from list-charts.") }),
});

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "a #rrggbb colour");

export const renderChart = createTool({
  description:
    'Draw a chart from a payload that matches describe-chart\'s JSON Schema. format "document" returns a standalone HTML page with its styles inlined; "fragment" returns the chart\'s HTML and SVG and the URL of the stylesheet it needs, to place in your own page; "react" returns a component snippet and install steps. An invalid payload returns ok: false and each issue with its path: fix those fields and call again.',
  execute: async ({ format, height, kind, payload, theme, title, width }) =>
    render(
      {
        format,
        height,
        kind,
        payload: payload as Payload,
        theme: theme === "light" || theme === "dark" ? THEMES[theme] : theme,
        title,
        width,
      },
      publicOrigin()
    ),
  id: "render-chart",
  inputSchema: z.object({
    format: z.enum(["document", "fragment", "react"]).default("document"),
    height: z.number().int().min(120).max(2000).default(400),
    kind: z.string().describe("A kind from list-charts."),
    payload: z.record(z.string(), z.unknown()).describe("The chart's props, matching describe-chart's jsonSchema."),
    theme: z
      .union([
        z.enum(["light", "dark"]),
        z.object({ alert: hex.optional(), hero: hex.optional(), ink: hex, mode: z.enum(["light", "dark"]), paper: hex }),
      ])
      .default("light")
      .describe("light, dark, or your own paper, ink and optional hero colour."),
    title: z.string().max(200).optional().describe("The document's <title>."),
    width: z.number().int().min(240).max(2400).default(720),
  }),
});

export const checkChart = createTool({
  description:
    "Check a payload against a chart's schema without drawing it. Returns ok: true, or ok: false and each issue with its path.",
  execute: async ({ kind, payload }) => {
    const chart = getChart(kind);

    if (chart === undefined) {
      throw new Error(`No chart of kind "${kind}". Call list-charts for the kinds.`);
    }

    const checked = chart.validate(payload as Payload);

    return checked.ok ? { ok: true as const } : checked;
  },
  id: "check-chart",
  inputSchema: z.object({
    kind: z.string().describe("A kind from list-charts."),
    payload: z.record(z.string(), z.unknown()).describe("The chart's props, matching describe-chart's jsonSchema."),
  }),
});
