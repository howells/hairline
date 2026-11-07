// Not a check: makes the picture the owner decides the stroke policy from.
// The six charts at 2x, one row each, strokes="proportional" on the left and
// strokes="device" on the right, drawn at device pixel ratio 2.
// Run: pnpm generate:artefacts (artefacts.config.ts runs it at 2x only; the
// acceptance config ignores it)
import { expect, test } from "@playwright/test";

test("side-by-side of the six charts at 2x, proportional then device strokes", async ({
  page,
}) => {
  await page.goto("/compare.html");
  await page.evaluate(async () => await document.fonts.ready);

  const picture = await page.locator("main").screenshot({
    path: new URL("artefacts/strokes-2x.png", import.meta.url).pathname,
  });

  expect(picture.byteLength).toBeGreaterThan(0);
});
