// Seam 2: Wiredeck's acceptance test. A host page of twelve 1920x1080 slides
// (six charts, dark and light) goes through headless Chromium at device pixel
// ratios 1, 2 and 3. Baselines carry no platform suffix because only Linux
// compares them; acceptance/README.md says how to regenerate them. The stroke
// picture is not a check and has a config of its own (artefacts.config.ts).
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

import { PORT } from "./port.ts";

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
  forbidOnly: true,
  fullyParallel: true,
  projects: [1, 2, 3].map((ratio) => ({
    name: `dpr${ratio}`,
    // Paper has no pixel ratio.
    testIgnore: [
      "**/artefacts.spec.ts",
      ...(ratio === 1 ? [] : ["**/pdf.spec.ts"]),
    ],
    use: {
      ...devices["Desktop Chrome"],
      deviceScaleFactor: ratio,
      viewport: { height: 1080, width: 1920 },
    },
  })),
  reporter: "list",
  snapshotPathTemplate: "{testDir}/baselines/{projectName}/{arg}{ext}",
  testDir: ".",
  testMatch: "*.spec.ts",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "node acceptance/build.ts && node acceptance/serve.ts",
    cwd: root,
    reuseExistingServer: true,
    url: `http://localhost:${PORT}/off.html`,
  },
});
