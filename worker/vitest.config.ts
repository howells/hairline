import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

// `cloudflare:workers` only exists inside the Workers runtime. In Node the
// tests resolve it to a module that holds the Worker's vars.
export default defineConfig({
  test: {
    alias: {
      "cloudflare:workers": fileURLToPath(
        new URL("tests/cloudflare-workers.ts", import.meta.url)
      ),
    },
    include: ["tests/*.test.ts"],
  },
});
