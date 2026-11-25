import { Mastra } from "@mastra/core";
import { registerApiRoute } from "@mastra/core/server";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

import { HAIRLINE_CSS } from "../generated/hairline-css";
import { chartist, suggestChart } from "./agents/chartist";
import { catalogueTools, hairlineServer } from "./mcp";
import { problemResponses, respond } from "./problem-responses";
import { STYLESHEET_PATH } from "./render";
import { drawDocument, renderTools } from "./tools/charts";
import { readView } from "./view";
import { VIEW_PATH } from "./view-link";

export const mastra = new Mastra({
  agents: { chartist },
  deployer: new CloudflareDeployer({
    ai: { binding: "AI" },
    name: "hairline-mcp",
    vars: {
      HAIRLINE_PUBLIC_URL: "https://hairline-mcp.daniel-0c0.workers.dev",
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
      registerApiRoute(`${VIEW_PATH}/:kind/:token`, {
        handler: async (c) => {
          const view = await readView(
            c.req.param("kind"),
            c.req.param("token")
          );

          if ("problem" in view) {
            return respond(view.problem);
          }

          const html = drawDocument(view.chart, view.input);

          return c.html(html, 200, {
            "cache-control": "public, max-age=86400, immutable",
          });
        },
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
