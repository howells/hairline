// Emits each registered chart's JSON Schema into lib/json-schema/<kind>.json,
// and an index of kinds. Runs after the library build, from the built
// React-free entry, so the files describe exactly what the package validates.
import { mkdirSync, writeFileSync } from "node:fs";

import { registry } from "@howells/hairline/schema";
import { z } from "zod";

const out = new URL("../lib/json-schema/", import.meta.url);

mkdirSync(out, { recursive: true });

for (const { kind, schema } of registry) {
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
    registry.map(({ jobs, kind }) => ({
      jobs,
      kind,
      schema: `${kind}.json`,
    })),
    null,
    2
  )}\n`
);

console.log(`${registry.length} JSON Schemas`);
