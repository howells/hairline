import type { ToolsInput } from "@mastra/core/agent";
// What the MCP server lists: the index, a schema loader and one render tool,
// so a client receives one chart's schema only when it picks that chart.
import { MCPServer } from "@mastra/mcp";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";

import { isFailed } from "./problem";
import { getChartTool, renderChart } from "./tools/catalogue";
import { listCharts } from "./tools/charts";

export const catalogueTools = {
  "get-chart-tool": getChartTool,
  "list-charts": listCharts,
  "render-chart": renderChart,
};

/**
 * The server, served at /api/mcp/hairline/mcp. Call it inside `new Mastra()`:
 * MCPServer draws random bytes, which Workers forbid at module load. It takes
 * CfWorkerJsonSchemaValidator because the default (Ajv) generates code, which
 * Workers also forbid.
 */
export const hairlineServer = (tools: ToolsInput) =>
  new MCPServer({
    description:
      "Engraved charts from data: list the charts, load one chart's schema, draw it.",
    id: "hairline",
    instructions:
      "Call list-charts to find the chart for your data and the point it should make, get-chart-tool for that chart's exact input schema, then render-chart. A payload that does not match is an error naming each field at fault. Use suggest-chart only if you would rather not choose the chart yourself.",
    jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
    legacy: "stateless",
    name: "Hairline",
    // A tool that returns { problem } failed: say so, with the problem as
    // both the text and the structured content.
    toolResult: {
      transform: ({ output }) =>
        isFailed(output)
          ? {
              content: [{ text: JSON.stringify(output.problem), type: "text" }],
              isError: true,
              structuredContent: { result: output },
            }
          : undefined,
    },
    tools,
    version: "0.1.0",
  });
