import { defineConfig } from "vitest/config";

// Tests run against the built package (lib/), the way a consumer imports it:
// "@howells/hairline" resolves through package.json exports. `pnpm test`
// builds first.
export default defineConfig({
  test: { include: ["tests/*.test.ts"] },
});
