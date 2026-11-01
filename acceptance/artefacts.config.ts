// Makes the picture the owner decides the stroke policy from; not a check.
// Runs artefacts.spec.ts alone at device pixel ratio 2: `pnpm generate:artefacts`.
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

import { PORT } from "./port.ts";

const root = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  forbidOnly: true,
  projects: [
    {
      name: "dpr2",
      use: {
        ...devices["Desktop Chrome"],
        deviceScaleFactor: 2,
        viewport: { height: 1080, width: 1920 },
      },
    },
  ],
  reporter: "list",
  testDir: ".",
  testMatch: "artefacts.spec.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "node acceptance/build.ts && node acceptance/serve.ts",
    cwd: root,
    reuseExistingServer: true,
    url: `http://localhost:${PORT}/off.html`,
  },
});
