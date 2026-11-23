import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
import { MCPServer } from "@mastra/mcp";
import { CfWorkerJsonSchemaValidator } from "@modelcontextprotocol/server/validators/cf-worker";

import { HAIRLINE_CSS } from "../generated/hairline-css";
import { chartist, suggestChart } from "./agents/chartist";
import { STYLESHEET_PATH } from "./render";
import { listCharts, renderTools } from "./tools/charts";

const tools = { "list-charts": listCharts, ...renderTools, "suggest-chart": suggestChart };

export const mastra = new Mastra({
  agents: { chartist },
  deployer: new CloudflareDeployer({
    ai: { binding: "AI" },
    name: "hairline-mcp",
    vars: { HAIRLINE_PUBLIC_URL: "https://hairline-mcp.danielhowells.workers.dev" },
  }),
  // Served at /api/mcp/hairline/mcp. A registered server rather than Mastra's
  // built-in /api/mcp, because only a registered one takes a validator, and
  // Workers forbid the code generation the default (Ajv) relies on. Built
  // inline: Mastra defers what is inside new Mastra() to the first request,
  // and MCPServer draws random bytes, which Workers forbid at module load.
  mcpServers: {
    hairline: new MCPServer({
      description: "Engraved charts from data: list the charts, then call a chart's render tool with a payload in its schema.",
      id: "hairline",
      instructions:
        "Call list-charts to find the chart for your data and point, then call its render tool. Each render tool's input schema is that chart's data shape; a payload that does not match is rejected with the fields at fault. Use suggest-chart only if you would rather not choose the chart yourself.",
      jsonSchemaValidator: new CfWorkerJsonSchemaValidator(),
      legacy: "stateless",
      name: "Hairline",
      tools,
      version: "0.1.0",
    }),
  },
  server: {
    apiRoutes: [
      registerApiRoute(STYLESHEET_PATH, {
        handler: async (c) =>
          c.body(HAIRLINE_CSS, 200, {
            "access-control-allow-origin": "*",
            "cache-control": "public, max-age=3600",
            "content-type": "text/css; charset=utf-8",
          }),
        method: "GET",
        requiresAuth: false,
      }),
    ],
    mcp: { enabled: false },
  },
  tools,
});
