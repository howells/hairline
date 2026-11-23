import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

import { HAIRLINE_CSS } from "../generated/hairline-css";
import { chartist, suggestChart } from "./agents/chartist";
import { catalogueTools, hairlineServer } from "./mcp";
import { problemResponses } from "./problem-responses";
import { STYLESHEET_PATH } from "./render";
import { renderTools } from "./tools/charts";

export const mastra = new Mastra({
  agents: { chartist },
  deployer: new CloudflareDeployer({
    ai: { binding: "AI" },
    name: "hairline-mcp",
    vars: {
      HAIRLINE_PUBLIC_URL: "https://hairline-mcp.danielhowells.workers.dev",
    },
  }),
  // Built here, not at module scope: see hairlineServer.
  mcpServers: {
    hairline: hairlineServer({
      ...catalogueTools,
      "suggest-chart": suggestChart,
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
    middleware: [{ handler: problemResponses, path: "/api/tools/*" }],
  },
  // Over HTTP every chart keeps its own render tool, typed by its Zod schema.
  tools: { ...catalogueTools, ...renderTools, "suggest-chart": suggestChart },
});
