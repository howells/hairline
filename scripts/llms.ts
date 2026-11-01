// Writes public/llms.txt from the built registry. Run `pnpm llms` after
// `pnpm build:lib` when the registry changes; tests/docs.test.ts fails while
// the committed file is stale.
import { writeFileSync } from "node:fs";

import { z } from "zod";

import { llmsTxt } from "./llms-text.ts";

const Built = z.object({
  registry: z.array(
    z.object({
      component: z.string(),
      jobs: z.array(z.string()),
      kind: z.string(),
      whenToUse: z.string(),
    })
  ),
});

// The built file does not exist when this script is type-checked, so it is
// loaded by URL and checked against the shape above.
const builtUrl = new URL("../lib/schema.js", import.meta.url).href;
// oxlint-disable-next-line howells/no-runtime-dynamic-imports -- loads the artefact the build just wrote
const loaded: unknown = await import(builtUrl);
const built = Built.parse(loaded);

writeFileSync(
  new URL("../public/llms.txt", import.meta.url),
  llmsTxt(built.registry)
);
console.log("public/llms.txt");
