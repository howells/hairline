// Emits each registered chart's JSON Schema into lib/json-schema/<kind>.json,
// and an index of kinds. Runs after the library build, from the built
// React-free entry, so the files describe exactly what the package validates.
import { mkdirSync, writeFileSync } from "node:fs";

import { z } from "zod";

const Built = z.object({
  registry: z.array(
    z.object({
      jobs: z.array(z.string()),
      kind: z.string(),
      schema: z.instanceof(z.ZodType),
    })
  ),
});

// The built file does not exist when this script is type-checked, so it is
// loaded by URL and checked against the shape above.
const builtUrl = new URL("../lib/schema.js", import.meta.url).href;
// oxlint-disable-next-line howells/no-runtime-dynamic-imports -- loads the artefact the build just wrote
const loaded: unknown = await import(builtUrl);
const built = Built.parse(loaded);

const out = new URL("../lib/json-schema/", import.meta.url);
mkdirSync(out, { recursive: true });
for (const { kind, schema } of built.registry) {
  // Input side: what a caller writes (defaults optional, nothing coerced).
  const json = z.toJSONSchema(schema, { io: "input" });
  writeFileSync(
    new URL(`${kind}.json`, out),
    `${JSON.stringify(json, null, 2)}\n`
  );
}
writeFileSync(
  new URL("index.json", out),
  `${JSON.stringify(
    built.registry.map(({ jobs, kind }) => ({
      jobs,
      kind,
      schema: `${kind}.json`,
    })),
    null,
    2
  )}\n`
);
console.log(`${built.registry.length} JSON Schemas`);
