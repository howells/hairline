// HAI-14: the package's precompiled hairline.css (no Tailwind) must draw what
// the gallery's Tailwind build draws. tailwind.html is the "off" slides under
// the stylesheet Tailwind compiles from src/system/app.css; each slide is
// compared with the baseline made from the hairline.css page, so the two
// stylesheets are held to one picture. A little difference is allowed (Tailwind's
// preflight resets a few defaults the precompiled sheet leaves alone); a
// missing utility moves far more than the tolerance. Linux only, like the
// other pixel comparisons: Chromium rasterises differently per OS.
import { expect, test } from "@playwright/test";

import { SLIDE_IDS } from "./slides.ts";

/** The share of a slide's pixels that may differ. */
const TOLERANCE = 0.002;

if (process.platform === "linux") {
  test("the Tailwind gallery build draws every slide as hairline.css does", async ({
    page,
  }) => {
    await page.goto("/tailwind.html");
    await page.evaluate(async () => await document.fonts.ready);
    for (const id of SLIDE_IDS) {
      await expect(page.locator(`[data-slide="${id}"]`)).toHaveScreenshot(
        `${id}.png`,
        { maxDiffPixelRatio: TOLERANCE }
      );
    }
  });
}
