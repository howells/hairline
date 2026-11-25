// The optional helper: hand it raw data and what you want to show, and it
// picks a chart and writes a payload that passes. It runs on Workers AI through
// the Worker's AI binding. It never draws; the caller renders what it returns.
import { getChart } from "@howells/hairline/schema";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createAI } from "agents/models/ai-sdk";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { invalidFields, orProblem, problem } from "../problem";
import { getChartTool, renderChart } from "../tools/catalogue";
import { kindSchema, listCharts } from "../tools/charts";

export const MODEL = "@cf/zai-org/glm-4.7-flash";

export const chartist = new Agent({
  description:
    "Picks a Hairline chart for raw data and writes a payload that passes validation.",
  id: "chartist",
  instructions: `You turn data into a Hairline chart payload.

1. Call list-charts and pick the one chart whose whenToUse fits the data and the point the user wants to make. Respect its limits and its whenNotToUse.
2. Call get-chart-tool for that kind and write a payload that matches the inputSchema's payload field exactly. Use only the data you were given: never invent, round away or pad values.
3. Call render-chart with { kind, input: { payload, format: "react" } } to check it. If it fails, fix the fields it names and call again until it succeeds.
4. Answer with the kind, the payload that passed, and one sentence on why this chart fits.`,
  model: () => createAI({ binding: env.AI })(MODEL),
  name: "Chartist",
  tools: {
    "get-chart-tool": getChartTool,
    "list-charts": listCharts,
    "render-chart": renderChart,
  },
});

const suggestionSchema = z.object({
  kind: kindSchema,
  payload: z
    .record(z.string(), z.unknown())
    .describe("The chart's payload; pass it as input.payload to render-chart."),
  why: z.string().describe("Why this chart fits, in one sentence."),
});

/**
 * The agent as an MCP tool. MCPServer's own agent tools (ask_<id>) validate
 * with Ajv whatever jsonSchemaValidator says, and Ajv cannot run on Workers.
 */
export const suggestChart = createTool({
  description:
    "Optional and slow (about a minute): give it raw data (CSV, JSON or prose) and what the chart should show, and a small model picks a Hairline chart and writes a payload that passes validation. Pass the result to render-chart as { kind, input: { payload } }. If you can reason about the data yourself, use list-charts and get-chart-tool instead.",
  execute: async ({ data, point }) => {
    let suggestion: z.infer<typeof suggestionSchema> | undefined;

    try {
      const result = await chartist.generate(
        `Data:\n${data}\n\nWhat the chart should show: ${point}`,
        {
          structuredOutput: {
            jsonPromptInjection: "auto",
            schema: suggestionSchema,
          },
        }
      );

      suggestion = result.object;
    } catch {
      return {
        problem: problem("suggestion-failed", {
          detail: "The agent could not produce a valid structured suggestion.",
          is_retriable: true,
          suggestions: [
            "Call suggest-chart again, or choose the chart yourself with list-charts and get-chart-tool.",
          ],
        }),
      };
    }

    if (suggestion === undefined) {
      return {
        problem: problem("suggestion-failed", {
          detail: "The agent returned no structured suggestion.",
          is_retriable: true,
          suggestions: [
            "Call suggest-chart again, or choose the chart yourself with list-charts and get-chart-tool.",
          ],
        }),
      };
    }

    const payload = z.json().safeParse(suggestion.payload);

    const checked = payload.success
      ? getChart(suggestion.kind)?.validate(payload.data)
      : undefined;

    if (checked === undefined || !checked.ok) {
      return {
        problem: problem("suggestion-failed", {
          detail: `The agent suggested a ${suggestion.kind} payload that does not validate.`,
          invalid_fields:
            checked === undefined
              ? undefined
              : invalidFields(checked.issues, "payload"),
          is_retriable: true,
          suggestions: [
            "Call suggest-chart again, or choose the chart yourself with list-charts and get-chart-tool.",
          ],
        }),
      };
    }

    return suggestion;
  },
  id: "suggest-chart",
  inputSchema: z.object({
    data: z
      .string()
      .min(1)
      .max(20_000)
      .describe("The data, as CSV, JSON or prose."),
    point: z.string().min(1).max(1000).describe("What the chart should show."),
  }),
  mcp: {
    annotations: {
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
      readOnlyHint: true,
      title: "Suggest a chart",
    },
  },
  outputSchema: orProblem(suggestionSchema),
});
