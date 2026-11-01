// Writes public/llms.txt from the built registry. Run `pnpm llms` after
// `pnpm build:lib` when the registry changes; tests/docs.test.ts fails while
// the committed file is stale.
import { writeFileSync } from "node:fs";

import { registry } from "@howells/hairline/schema";

import { llmsTxt } from "./llms-text.ts";

writeFileSync(
  new URL("../public/llms.txt", import.meta.url),
  llmsTxt(registry)
);
console.log("public/llms.txt");
