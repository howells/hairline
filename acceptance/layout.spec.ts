import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { SLIDE_COUNT, SLIDE_IDS } from "./slides.ts";

interface Shifting {
  shift: number;
}
interface ShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

const boxes = async (page: Page) => {
  const found: Record<string, unknown> = {};
  for (const id of SLIDE_IDS) {
    found[id] = {
      chart: await page
        .locator(`[data-slide="${id}"] svg[role="img"]`)
        .boundingBox(),
      slide: await page.locator(`[data-slide="${id}"]`).boundingBox(),
    };
  }
  return found;
};

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
      const state = window as unknown as Shifting;
      state.shift = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as ShiftEntry[]) {
          if (!entry.hadRecentInput) {
            state.shift += entry.value;
          }
        }
      }).observe({ buffered: true, type: "layout-shift" });
    });
    await page.goto(`/${animate}.html`);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('[data-hl-ready="true"]')).toHaveCount(
      SLIDE_COUNT
    );
    const after = await boxes(page);

    expect(after).toStrictEqual(before);
    expect(await page.evaluate(() => (window as unknown as Shifting).shift)).toBe(
      0
    );
  });
}
