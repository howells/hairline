import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

import { HAIRLINE_CSS } from "../generated/hairline-css";
import { chartist } from "./agents/chartist";
import { STYLESHEET_PATH } from "./render";
import { checkChart, describeChart, listCharts, renderChart } from "./tools/charts";

export const mastra = new Mastra({
  agents: { chartist },
  deployer: new CloudflareDeployer({
    ai: { binding: "AI" },
    name: "hairline-mcp",
    vars: { HAIRLINE_PUBLIC_URL: "https://hairline-mcp.danielhowells.workers.dev" },
  }),
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
    mcp: {
      enabled: true,
      featured: { agents: ["chartist"] },
      toolsets: ["agents", "tools"],
    },
  },
  tools: { checkChart, describeChart, listCharts, renderChart },
});
