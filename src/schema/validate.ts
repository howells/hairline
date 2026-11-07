// React-free. Strict validation with errors an agent can act on. Every chart's
// schema is checked through `validate`, which never throws and never fills
// in missing data: a bad payload comes back as issues, not as a fake chart.
import type { ZodType } from "zod";

/** One thing wrong with a payload, located by its path. */
export interface Issue {
  /** Machine-readable reason, e.g. "invalid_type", "too_small", "unrecognized_keys". */
  code: string;
  message: string;
  /** Where, as segments: ["data", 2, "value"]. */
  path: (string | number)[];
  /** The same path as text: "data[2].value"; "" for the payload itself. */
  pointer: string;
}

/**
 * A payload as it arrives, before `validate` has seen it: JSON as an agent
 * writes it, plus the `undefined` of an omitted field.
 */
export type Payload =
  | boolean
  | number
  | string
  | null
  | undefined
  | readonly Payload[]
  | { readonly [key: string]: Payload };

export type Validated<T> =
  | { ok: true; value: T }
  | { issues: Issue[]; ok: false };

const segmentOf = (segment: PropertyKey) =>
  Number.isInteger(segment) ? Number(segment) : String(segment);

/** ["data", 2, "value"] as "data[2].value". */
export const pointerOf = (path: readonly (string | number)[]) => {
  let text = "";

  for (const segment of path) {
    if (Number.isInteger(segment)) {
      text += `[${segment}]`;
    } else {
      text += text === "" ? String(segment) : `.${segment}`;
    }
  }

  return text;
};

/** Check `input` against a schema: the parsed value, or path-specific issues. */
export const validate = <T>(
  schema: ZodType<T>,
  input: Payload
): Validated<T> => {
  const result = schema.safeParse(input);

  if (result.success) {
    return { ok: true, value: result.data };
  }

  return {
    issues: result.error.issues.map((issue) => {
      const path = issue.path.map(segmentOf);

      return {
        code: issue.code,
        message: issue.message,
        path,
        pointer: pointerOf(path),
      };
    }),
    ok: false,
  };
};
