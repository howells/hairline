// Mastra's tool routes answer failures in three shapes; the middleware turns
// each into one problem document with a failing status.
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

import { problem } from "../src/mastra/problem";
import { problemResponses } from "../src/mastra/problem-responses";

const app = new Hono();

app.use("/api/tools/*", problemResponses);

app.post("/api/tools/schema/execute", (c) =>
  c.json({
    error: true,
    message: "Tool input validation failed",
    validationErrors: {
      errors: [],
      fields: {
        payload: {
          errors: [],
          fields: {
            rows: {
              errors: [],
              fields: {
                0: {
                  errors: [],
                  fields: {
                    from: {
                      errors: ["Invalid input: expected number"],
                      fields: {},
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
);

app.post("/api/tools/returned/execute", (c) =>
  c.json({
    problem: problem("invalid-input", {
      detail: "bad",
      is_retriable: false,
      suggestions: [],
    }),
  })
);

app.post("/api/tools/missing/execute", (c) =>
  c.json({ error: "Tool not found" }, 404)
);

app.post("/api/tools/fine/execute", (c) => c.json({ format: "react" }));

const post = async (tool: string) =>
  await app.request(`/api/tools/${tool}/execute`, { method: "POST" });

describe(problemResponses, () => {
  it("turns Mastra's 200 validation failure into a 422 with each field", async () => {
    const response = await post("schema");

    expect(response.status).toBe(422);
    expect(response.headers.get("content-type")).toBe(
      "application/problem+json"
    );
    await expect(response.json()).resolves.toMatchObject({
      invalid_fields: [{ pointer: "payload.rows[0].from" }],
      type: "https://hairline.danielhowells.com/docs/errors#invalid-input",
    });
  });

  it("gives a problem a tool returned its own status", async () => {
    const response = await post("returned");

    expect(response.status).toBe(422);
  });

  it("answers an unknown tool with a not-found problem", async () => {
    const response = await post("missing");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      suggestions: ["GET /api/tools lists the tools."],
    });
  });

  it("leaves a successful result alone", async () => {
    const response = await post("fine");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({ format: "react" });
  });
});
