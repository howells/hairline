// Pixel comparison against committed baselines. Chromium draws text and
// antialiasing differently per OS, so the baselines are Linux's (made in the
// official Playwright image) and the comparison runs only there.
import { expect, test } from "@playwright/test";

import { SLIDE_COUNT, SLIDE_IDS } from "./slides.ts";

test.skip(process.platform !== "linux", "baselines are Linux-only");

// Settled "mount" must draw exactly what "off" draws, so both compare to one baseline.
for (const animate of ["off", "mount"]) {
  test(`animate ${animate}: every slide matches its baseline`, async ({
    page,
  }) => {
    await page.goto(`/${animate}.html`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-hl-ready="true"]')).toHaveCount(
      SLIDE_COUNT
    );
    for (const id of SLIDE_IDS) {
      await expect(page.locator(`[data-slide="${id}"]`)).toHaveScreenshot(
        `${id}.png`
      );
    }
  });
}
