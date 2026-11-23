// Lazy loading for MCP clients. Sending every chart's render tool up front
// costs 7-12 KB of schema per chart, so MCP lists these two instead: one hands
// over a single chart's exact input schema, the other validates against that
// same Zod schema and draws.
import { getChart } from "@howells/hairline/schema";
import type { ChartEntry } from "@howells/hairline/schema";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { orProblem, pointerOfPath, problem } from "../problem";
import type { Failed, InvalidField } from "../problem";
import {
  drawChart,
  kindSchema,
  renderedSchema,
  renderInputSchema,
  renderToolId,
} from "./charts";

// kindSchema already limits `kind` to registered charts; this covers a
// registry that changes under a running Worker.
const chartOf = (kind: string): ChartEntry | Failed =>
  getChart(kind) ?? {
    problem: problem("chart-not-found", {
      detail: `No chart of kind "${kind}".`,
      is_retriable: false,
      suggestions: ["Call list-charts for the kinds."],
    }),
  };

export const getChartTool = createTool({
  description:
    "Get one chart's render input schema: the exact JSON Schema render-chart validates `input` against, with every field described. Call it after list-charts, before writing a payload.",
  execute: async ({ kind }) => {
    const chart = chartOf(kind);

    if ("problem" in chart) {
      return chart;
    }

    return {
      description: `Draw a ${chart.component} chart. Use it for: ${chart.whenToUse} Not for: ${chart.whenNotToUse}`,
      inputSchema: z.toJSONSchema(renderInputSchema(chart), { io: "input" }),
      kind: chart.kind,
      tool: renderToolId(chart),
    };
  },
  id: "get-chart-tool",
  inputSchema: z.object({ kind: kindSchema }),
  mcp: {
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: true,
      title: "Get a chart's input schema",
    },
  },
  outputSchema: orProblem(
    z.object({
      description: z.string(),
      inputSchema: z
        .record(z.string(), z.unknown())
        .describe("JSON Schema for render-chart's `input`."),
      kind: z.string(),
      tool: z
        .string()
        .describe(
          "The same chart's own render tool over HTTP: POST /api/tools/<tool>/execute."
        ),
    })
  ),
});

export const renderChart = createTool({
  description:
    "Draw a chart. `input` must match the schema get-chart-tool returns for `kind`: { payload, format?, theme?, width?, height?, title? }. A mismatch is an error naming each field at fault; fix those and call again. The result includes url, a link to the chart as a web page: to show a person the chart, give them url rather than copying the HTML.",
  execute: async ({ input, kind }) => {
    const chart = chartOf(kind);

    if ("problem" in chart) {
      return chart;
    }

    const parsed = renderInputSchema(chart).safeParse(input);

    if (!parsed.success) {
      const fields: InvalidField[] = parsed.error.issues.map((issue) => ({
        code: issue.code,
        message: issue.message,
        pointer: pointerOfPath(["input", ...issue.path.map(String)]),
      }));

      return {
        problem: problem("invalid-input", {
          detail: `The input does not match the ${kind} schema: ${fields.map((f) => `${f.pointer} ${f.message}`).join("; ")}`,
          invalid_fields: fields,
          is_retriable: false,
          suggestions: [
            `Fix the fields in invalid_fields and call render-chart again; get-chart-tool returns the ${kind} schema.`,
          ],
        }),
      };
    }

    return await drawChart(chart, parsed.data);
  },
  id: "render-chart",
  inputSchema: z.object({
    input: z
      .record(z.string(), z.unknown())
      .describe(
        "The render input, matching get-chart-tool's inputSchema for this kind."
      ),
    kind: kindSchema,
  }),
  mcp: {
    annotations: {
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      readOnlyHint: true,
      title: "Draw a chart",
    },
  },
  outputSchema: orProblem(renderedSchema),
});
