import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { SLIDE_COUNT, SLIDE_IDS } from "./slides.ts";

declare global {
  interface Window {
    /** Layout shift the page has suffered so far, summed by the init script. */
    shift: number;
  }
}

const boxes = async (page: Page) =>
  await Promise.all(
    SLIDE_IDS.map(async (id) => ({
      chart: await page
        .locator(`[data-slide="${id}"] svg[role="img"]`)
        .boundingBox(),
      id,
      slide: await page.locator(`[data-slide="${id}"]`).boundingBox(),
    }))
  );

for (const animate of ["off", "mount"]) {
  test(`animate ${animate}: the settled page sits where the server HTML did`, async ({
    browser,
    page,
  }, testInfo) => {
    // The server HTML alone: scripts off, so nothing hydrates.
    const bare = await browser.newContext({
      deviceScaleFactor: testInfo.project.use.deviceScaleFactor ?? 1,
      javaScriptEnabled: false,
      viewport: { height: 1080, width: 1920 },
    });
    const server = await bare.newPage();
    await server.goto(`/${animate}.html`);
    const before = await boxes(server);
    await bare.close();

    await page.addInitScript(() => {
      window.shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            "value" in entry &&
            "hadRecentInput" in entry &&
            entry.hadRecentInput === false
          ) {
            window.shift += Number(entry.value);
          }
        }
      }).observe({ buffered: true, type: "layout-shift" });
    });
    await page.goto(`/${animate}.html`);
    await page.evaluate(async () => await document.fonts.ready);
    await expect(page.locator('[data-hl-ready="true"]')).toHaveCount(
      SLIDE_COUNT
    );
    const after = await boxes(page);

    expect(after).toStrictEqual(before);
    expect(await page.evaluate(() => window.shift)).toBe(0);
  });
}
