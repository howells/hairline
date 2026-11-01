// Seam 2: Wiredeck's acceptance test. A host page of twelve 1920x1080 slides
// (six charts, dark and light) goes through headless Chromium at device pixel
// ratios 1, 2 and 3. Baselines carry no platform suffix because only Linux
// compares them; acceptance/README.md says how to regenerate them.
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const root = fileURLToPath(new URL("..", import.meta.url));

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixels: 0,
      threshold: 0,
    },
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [1, 2, 3].map((ratio) => ({
    name: `dpr${ratio}`,
    use: {
      ...devices["Desktop Chrome"],
      deviceScaleFactor: ratio,
      viewport: { height: 1080, width: 1920 },
    },
  })),
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  snapshotPathTemplate: "{testDir}/baselines/{projectName}/{arg}{ext}",
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "node acceptance/build.ts && node acceptance/serve.ts",
    cwd: root,
    env: { PORT: String(PORT) },
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:${PORT}/off.html`,
  },
  workers: process.env.CI ? 2 : undefined,
});
