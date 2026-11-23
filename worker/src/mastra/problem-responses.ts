// Every failure on Mastra's tool routes leaves as one problem document
// (application/problem+json) with a status that says it failed. Mastra itself
// answers a schema mismatch with 200 and its own body, an unknown tool with
// 404 { error }, and a thrown error with 500 { error }.
import type { MiddlewareHandler } from "hono";
import { z } from "zod";

import { isFailed, pointerOfPath, problem } from "./problem";
import type { InvalidField, Problem } from "./problem";

/** Mastra's nested validation tree: { errors, fields: { name: { errors, fields } } }. */
interface ErrorTree {
  errors?: string[];
  fields?: Record<string, ErrorTree>;
}

const errorTreeSchema: z.ZodType<ErrorTree> = z.object({
  errors: z.array(z.string()).optional(),
  fields: z
    .record(
      z.string(),
      z.lazy(() => errorTreeSchema)
    )
    .optional(),
});

/** Any JSON object body; the fields the middleware reads are checked where they are used. */
const bodySchema = z.looseObject({
  error: z.unknown().optional(),
  validationErrors: z.unknown().optional(),
});

const flatten = (tree: ErrorTree, path: string[]): InvalidField[] => [
  ...(tree.errors ?? []).map((message) => ({
    code: "invalid_input",
    message,
    pointer: pointerOfPath(path),
  })),
  ...Object.entries(tree.fields ?? {}).flatMap(([name, child]) =>
    flatten(child, [...path, name])
  ),
];

/** A problem document as an HTTP response. */
export const respond = (details: Problem) =>
  Response.json(details, {
    headers: { "content-type": "application/problem+json" },
    status: details.status,
  });

const asProblem = (
  status: number,
  body: z.infer<typeof bodySchema>
): Problem | undefined => {
  if (isFailed(body)) {
    return body.problem;
  }

  const tree = errorTreeSchema.safeParse(body.validationErrors);

  if (body.error === true && tree.success) {
    const fields = flatten(tree.data, []);

    return problem("invalid-input", {
      detail: fields.map((f) => `${f.pointer} ${f.message}`).join("; "),
      invalid_fields: fields,
      is_retriable: false,
      suggestions: [
        "Fix the fields in invalid_fields and call again. GET /api/tools/<id> returns the tool's input schema.",
      ],
    });
  }

  if (status === 404) {
    const message = z.string().safeParse(body.error);

    return problem("not-found", {
      detail: message.success ? message.data : "Not found.",
      is_retriable: false,
      suggestions: ["GET /api/tools lists the tools."],
    });
  }

  if (status >= 500) {
    const failure = problem("internal-error", {
      detail: "The Worker failed while handling the request.",
      is_retriable: true,
      suggestions: ["Retry once; if it fails again, report the trace_id."],
    });

    console.error(failure.trace_id, body.error);

    return failure;
  }

  return undefined;
};

export const problemResponses: MiddlewareHandler = async (c, proceed) => {
  await proceed();

  if (!(c.res.headers.get("content-type") ?? "").includes("application/json")) {
    return;
  }

  const body = bodySchema.safeParse(await c.res.clone().json());

  if (!body.success) {
    return;
  }

  const details = asProblem(c.res.status, body.data);

  if (details !== undefined) {
    c.res = respond(details);
  }
};
