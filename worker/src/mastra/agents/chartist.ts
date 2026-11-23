// The optional helper: hand it raw data and what you want to show, and it
// picks a chart and writes a payload that passes. It runs on Workers AI through
// the Worker's AI binding. It never draws; the caller renders what it returns.
import { Agent } from "@mastra/core/agent";
import { createAI } from "agents/models/ai-sdk";
import { env } from "cloudflare:workers";

import { checkChart, describeChart, listCharts } from "../tools/charts";

export const MODEL = "@cf/zai-org/glm-4.7-flash";

export const chartist = new Agent({
  description:
    "Optional. Give it raw data (CSV, JSON or prose) and what the chart should show; it picks a Hairline chart and writes a payload that passes validation. Returns JSON with kind, payload and why. Pass the result to render-chart. Agents that can reason for themselves should use list-charts and describe-chart directly instead.",
  id: "chartist",
  instructions: `You turn data into a Hairline chart payload.

1. Call list-charts and pick the one chart whose whenToUse fits the data and the point the user wants to make. Respect its limits.
2. Call describe-chart for that kind and write a payload that matches its jsonSchema exactly. Use only the data you were given: never invent, round away or pad values.
3. Call check-chart. If it returns issues, fix those fields and check again until ok is true.
4. Reply with JSON only, no prose around it: {"kind": string, "payload": object, "why": string}. "why" is one sentence on why this chart fits.

If no chart fits, reply {"kind": null, "payload": null, "why": "<what would be needed>"}.`,
  model: () => createAI({ binding: env.AI })(MODEL),
  name: "Chartist",
  tools: { checkChart, describeChart, listCharts },
});
