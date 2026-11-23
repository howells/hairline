# Hairline Worker

A Mastra app deployed to Cloudflare Workers. It gives agents the library's charts over MCP (`/api/mcp/hairline/mcp`) and over Mastra's HTTP routes (`/api/tools/<id>/execute`), and draws each chart as a page at a stateless view link. Rendering costs nothing; only `suggest-chart` calls a model (Workers AI, through the `AI` binding).

## Commands

```sh
pnpm build:lib                                   # at the root, first: the Worker imports lib/
pnpm --filter @howells/hairline-worker typecheck
pnpm --filter @howells/hairline-worker test      # MCP protocol and render tests, in Node
pnpm --filter @howells/hairline-worker dev       # build, then wrangler dev on :8787
pnpm --filter @howells/hairline-worker run deploy    # ask first
```

`dev` and `deploy` run `mastra build`, which writes `.mastra/output/` (with its `wrangler.json`) and `src/generated/hairline-css.ts`. Both are generated; don't edit them.

## Layout

- `src/mastra/index.ts`: the Mastra instance, the MCP server and the stylesheet route.
- `src/mastra/mcp.ts`: what the MCP server lists, which is the three catalogue tools, not one tool per chart.
- `src/mastra/tools/charts.ts`: `list-charts`, and one `render-<kind>` tool per registry chart whose `inputSchema` is that chart's Zod schema.
- `src/mastra/tools/catalogue.ts`: `get-chart-tool` and `render-chart`, which lazy-load a render tool's schema and call it, so MCP clients don't receive every chart's schema up front.
- `src/mastra/render.ts`: draws a chart as a document, a fragment or a React snippet.
- `src/mastra/view-link.ts` and `view.ts`: the `/view/<kind>/<token>` link every render returns. The token is the render input, deflated and base64url-encoded, so links need no storage; inputs too big for an 8000-character URL get no link.
- `src/mastra/problem.ts`: the one error shape (RFC 9457 problem details) for HTTP and MCP.
- `src/mastra/agents/chartist.ts`: the optional `suggest-chart` agent.

## Workers gotchas

- **No code generation.** Workers forbid `new Function`, which Ajv needs, so Mastra's built-in `/api/mcp` and `MCPServer`'s `ask_<agent>` tools fail. The server uses `CfWorkerJsonSchemaValidator`, and the agent is exposed as a plain tool.
- **No random values or I/O at module load.** Build anything that draws random bytes (such as `MCPServer`) inline inside `new Mastra({...})`; Mastra defers that to the first request.
- **React's edge build.** Import `react-dom/server.edge`. The browser build's `MessageChannel` makes `mastra build` hang.

## Boundaries

- The server is public with no auth, by choice. Ask before adding a tool that costs money per call.
- Ask before deploying.
