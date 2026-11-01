// Pixel comparison against committed baselines. Chromium draws text and
// antialiasing differently per OS, so the baselines are Linux's (made in the
// official Playwright image) and the comparison runs only there.
import { expect, test } from "@playwright/test";

import { SLIDE_COUNT, SLIDE_IDS } from "./slides.ts";

// Off Linux there is nothing to compare against, so no test is defined.
const ANIMATES =
  process.platform === "linux" ? (["off", "mount"] as const) : [];

// A settled "mount" page is not pixel-identical to "off" (the texture tiles and
// glyph edges are rasterised differently once the entry animations have run),
// so it keeps baselines of its own: still a fixed, checked picture.
const BASELINE = { mount: "-mount", off: "" } as const;

for (const animate of ANIMATES) {
  test(`animate ${animate}: every slide matches its baseline`, async ({
    page,
  }) => {
    await page.goto(`/${animate}.html`);
    await page.evaluate(async () => await document.fonts.ready);
    await expect(page.locator('[data-hl-ready="true"]')).toHaveCount(
      SLIDE_COUNT
    );
    for (const id of SLIDE_IDS) {
      await expect(page.locator(`[data-slide="${id}"]`)).toHaveScreenshot(
        `${id}${BASELINE[animate]}.png`
      );
    }
  });
}
