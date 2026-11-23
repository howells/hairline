// The MCP contract, over real Streamable HTTP: what the server lists, one
// successful call per tool, and the problem a bad call returns. suggest-chart
// is left out: it needs the Workers AI binding.
import { createServer } from "node:http";
import type { Server } from "node:net";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { catalogueTools, hairlineServer } from "../src/mastra/mcp";

const json = z.json();

type Json = z.infer<typeof json>;

interface JsonObject {
  [key: string]: Json;
}

const addressSchema = z.object({ port: z.number() });

const rpcSchema = z.object({ result: z.unknown() });

const toolsSchema = z.object({
  tools: z.array(
    z.object({
      annotations: z.looseObject({}),
      name: z.string(),
      outputSchema: z.unknown(),
    })
  ),
});

const callSchema = z.object({
  content: z.array(z.object({ text: z.string() })),
  isError: z.boolean().optional(),
  structuredContent: z.looseObject({}).optional(),
});

const chartsSchema = z.object({
  charts: z.array(z.object({ kind: z.string() })),
});

const inputSchemaResultSchema = z.object({
  result: z.object({
    inputSchema: z.object({ properties: z.looseObject({}) }),
  }),
});

const htmlResultSchema = z.object({ result: z.object({ html: z.string() }) });

describe("hairline MCP server", () => {
  let http: Server;
  let endpoint: string;
  let id = 0;

  beforeAll(async () => {
    const server = hairlineServer(catalogueTools);

    http = createServer((req, res) => {
      void server.startHTTP({
        httpPath: "/mcp",
        req,
        res,
        url: new URL(req.url ?? "/", endpoint),
      });
    });
    await new Promise<void>((resolve) => {
      http.listen(0, resolve);
    });
    endpoint = `http://localhost:${addressSchema.parse(http.address()).port}/mcp`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      http.close(() => {
        resolve();
      });
    });
  });

  /** One JSON-RPC call as a 2025-era stateless client sends it. */
  const rpc = async (method: string, params: JsonObject = {}) => {
    id += 1;

    const response = await fetch(endpoint, {
      body: JSON.stringify({ id, jsonrpc: "2.0", method, params }),
      headers: {
        accept: "application/json, text/event-stream",
        "content-type": "application/json",
      },
      method: "POST",
    });

    const text = await response.text();
    const line = text.split("\n").find((l) => l.startsWith("data: "));
    const body: unknown = JSON.parse(line === undefined ? text : line.slice(6));

    return rpcSchema.parse(body).result;
  };

  const call = async (name: string, args: JsonObject) =>
    callSchema.parse(await rpc("tools/call", { arguments: args, name }));

  it("lists the three catalogue tools, each with annotations and an output schema", async () => {
    const { tools } = toolsSchema.parse(await rpc("tools/list"));

    expect(tools).toHaveLength(3);
    expect(tools.map((t) => t.name)).toStrictEqual(
      expect.arrayContaining(["get-chart-tool", "list-charts", "render-chart"])
    );

    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({
        destructiveHint: false,
        readOnlyHint: true,
      });
      expect(tool.outputSchema).toBeDefined();
    }
  });

  it("lists every registered chart", async () => {
    const result = await call("list-charts", {});
    const { charts } = chartsSchema.parse(result.structuredContent);

    expect(charts.map((c) => c.kind)).toContain("rung-bars");
    expect(result.isError).toBeFalsy();
  });

  it("hands over one chart's input schema", async () => {
    const result = await call("get-chart-tool", { kind: "rung-bars" });
    const parsed = inputSchemaResultSchema.parse(result.structuredContent);
    const { properties } = parsed.result.inputSchema;

    expect(Object.keys(properties)).toStrictEqual(
      expect.arrayContaining(["payload", "format", "theme"])
    );
  });

  it("draws a fragment that links its stylesheet", async () => {
    const result = await call("render-chart", {
      input: { payload: { data: [{ label: "Mars", value: 2 }] } },
      kind: "rung-bars",
    });

    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toMatchObject({
      result: {
        format: "fragment",
        stylesheet: "https://hairline.test/hairline.css",
      },
    });
    expect(
      htmlResultSchema.parse(result.structuredContent).result.html
    ).toContain("<svg");
  });

  it("returns a problem naming each field at fault", async () => {
    const result = await call("render-chart", {
      input: { payload: { data: [{ label: "A", value: "x" }] } },
      kind: "rung-bars",
    });

    const details: unknown = JSON.parse(result.content[0]?.text ?? "{}");

    expect(result.isError).toBe(true);
    expect(details).toMatchObject({
      invalid_fields: [
        { code: "invalid_type", pointer: "input.payload.data[0].value" },
      ],
      is_retriable: false,
      status: 422,
    });
  });

  it("rejects a kind that is not registered", async () => {
    const result = await call("render-chart", { input: {}, kind: "pie" });

    expect(result.isError).toBe(true);
  });
});
