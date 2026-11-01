import { expect, test } from "@playwright/test";

import { SLIDE_COUNT, SLIDE_IDS } from "./slides.ts";

for (const animate of ["off", "mount"]) {
  test(`animate ${animate}: all twelve slides reach ready`, async ({
    page,
  }) => {
    const problems: string[] = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") {
        problems.push(message.text());
      }
    });

    await page.goto(`/${animate}.html`);
    await page.evaluate(async () => await document.fonts.ready);

    await expect(page.locator('[data-hl-ready="true"]')).toHaveCount(
      SLIDE_COUNT
    );
    await Promise.all(
      SLIDE_IDS.map(async (id) => {
        await expect(
          page.locator(`[data-slide="${id}"] [data-hl-ready="true"]`)
        ).toHaveCount(1);
      })
    );
    expect(problems).toStrictEqual([]);
  });
}
