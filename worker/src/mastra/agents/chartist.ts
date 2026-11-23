// The optional helper: hand it raw data and what you want to show, and it
// picks a chart and writes a payload that passes. It runs on Workers AI through
// the Worker's AI binding. It never draws; the caller renders what it returns.
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createAI } from "agents/models/ai-sdk";
import { env } from "cloudflare:workers";
import { z } from "zod";

import { listCharts, renderTools } from "../tools/charts";

export const MODEL = "@cf/zai-org/glm-4.7-flash";

export const chartist = new Agent({
  description:
    "Optional. Give it raw data (CSV, JSON or prose) and what the chart should show; it picks a Hairline chart and writes a payload that passes validation. Returns JSON with tool, payload and why: pass the payload to that render tool. Agents that can reason for themselves should use list-charts and the render tools directly instead.",
  id: "chartist",
  instructions: `You turn data into a Hairline chart payload.

1. Call list-charts and pick the one chart whose whenToUse fits the data and the point the user wants to make. Respect its limits.
2. Write a payload that matches that chart's render tool input schema exactly. Use only the data you were given: never invent, round away or pad values.
3. Call the render tool with your payload and format "react" to check it. If the call fails validation, fix the fields it names and call again until it succeeds.
4. Reply with JSON only, no prose around it: {"tool": string, "payload": object, "why": string}. "why" is one sentence on why this chart fits.

If no chart fits, reply {"tool": null, "payload": null, "why": "<what would be needed>"}.`,
  model: () => createAI({ binding: env.AI })(MODEL),
  name: "Chartist",
  tools: { "list-charts": listCharts, ...renderTools },
});

/**
 * The agent as an MCP tool. MCPServer's own agent tools (ask_<id>) validate
 * with Ajv whatever jsonSchemaValidator says, and Ajv cannot run on Workers.
 */
export const suggestChart = createTool({
  description: chartist.getDescription(),
  execute: async ({ data, point }) => {
    const result = await chartist.generate(`Data:\n${data}\n\nWhat the chart should show: ${point}`);

    return { reply: result.text };
  },
  id: "suggest-chart",
  inputSchema: z.object({
    data: z.string().min(1).max(20000).describe("The data, as CSV, JSON or prose."),
    point: z.string().min(1).max(1000).describe("What the chart should show."),
  }),
});
