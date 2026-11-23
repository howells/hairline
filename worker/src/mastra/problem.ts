// The one error shape the Worker returns, over HTTP and MCP alike: RFC 9457
// problem details, plus what an agent needs to recover: whether a retry can
// help, what to call next, and each field at fault.
import type { Issue } from "@howells/hairline/schema";
import { z } from "zod";

export interface InvalidField {
  code: string;
  message: string;
  /** Where, as text: "payload.data[2].value". */
  pointer: string;
}

export interface Problem {
  detail: string;
  invalid_fields?: InvalidField[];
  is_retriable: boolean;
  status: number;
  suggestions: string[];
  title: string;
  trace_id: string;
  type: string;
}

export const PROBLEM_TYPES = {
  "chart-not-found": { status: 404, title: "No chart of that kind" },
  "internal-error": { status: 500, title: "The Worker failed" },
  "invalid-input": {
    status: 422,
    title: "The input does not match the schema",
  },
  "not-found": { status: 404, title: "Not found" },
  "suggestion-failed": {
    status: 502,
    title: "The agent did not return a usable chart",
  },
} as const;

export type ProblemType = keyof typeof PROBLEM_TYPES;

export const problem = (
  type: ProblemType,
  details: Pick<Problem, "detail" | "is_retriable" | "suggestions"> & {
    invalid_fields?: InvalidField[];
  }
): Problem => ({
  ...PROBLEM_TYPES[type],
  ...details,
  trace_id: crypto.randomUUID(),
  type: `https://hairline.danielhowells.com/docs/errors#${type}`,
});

/** A path as text: ["payload", "rows", "0", "from"] becomes "payload.rows[0].from". */
export const pointerOfPath = (path: readonly string[]) =>
  path.join(".").replaceAll(/\.(?<index>\d+)(?=\.|$)/gu, "[$<index>]");

/** Library issues, located under `prefix` (the field that holds the payload). */
export const invalidFields = (
  issues: readonly Issue[],
  prefix: string
): InvalidField[] =>
  issues.map(({ code, message, pointer }) => ({
    code,
    message,
    pointer:
      pointer === "" ? prefix : `${prefix}.${pointer}`.replace(".[", "["),
  }));

/** A tool's failure, returned as its output so MCP and HTTP both carry it intact. */
export interface Failed {
  problem: Problem;
}

export const problemSchema = z.object({
  detail: z.string(),
  invalid_fields: z
    .array(
      z.object({ code: z.string(), message: z.string(), pointer: z.string() })
    )
    .optional()
    .describe("Each field at fault, when the input did not match its schema."),
  is_retriable: z
    .boolean()
    .describe("Whether the same call can succeed if repeated."),
  status: z.number().int(),
  suggestions: z.array(z.string()).describe("What to do next."),
  title: z.string(),
  trace_id: z.string(),
  type: z.string(),
});

/** A tool's output schema with its failure case added. */
export const orProblem = <T extends z.ZodType>(schema: T) =>
  z.union([schema, z.object({ problem: problemSchema })]);

export const isFailed = (output: unknown): output is Failed =>
  typeof output === "object" && output !== null && "problem" in output;
