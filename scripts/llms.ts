// Writes public/llms.txt from the built registry. Run `pnpm llms` after
// `pnpm build:lib` when the registry changes; tests/docs.test.ts fails while
// the committed file is stale.
import { writeFileSync } from "node:fs";

import { llmsTxt } from "./llms-text.ts";
import type { Entry } from "./llms-text.ts";

// The built file does not exist when this script is type-checked.
const builtUrl = new URL("../lib/schema.js", import.meta.url).href;
// oxlint-disable-next-line howells/no-runtime-dynamic-imports -- loads the artefact the build just wrote
const built = (await import(builtUrl)) as { registry: readonly Entry[] };

writeFileSync(
  new URL("../public/llms.txt", import.meta.url),
  llmsTxt(built.registry)
);
console.log("public/llms.txt");
