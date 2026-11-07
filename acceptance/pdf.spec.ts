// Printing the all-slides page: every page of the PDF must carry a drawn chart.
// A chart that is hidden, or never drew, leaves a page of one background fill
// and no text; a drawn one has hundreds of path operations and its labels.
import { expect, test } from "@playwright/test";
import { OPS, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { SLIDE_COUNT } from "./slides.ts";

const PATH_OPS = new Set<number>([OPS.constructPath, OPS.stroke, OPS.fill]);
const TEXT_OPS = new Set<number>([OPS.showText, OPS.showSpacedText]);

// "scroll" is the default and the hard case: nothing scrolls, so no chart ever
// reaches ready, and the print rules alone must show them.
for (const animate of ["off", "scroll"]) {
  test(`animate ${animate}: every PDF page has a drawn chart`, async ({
    page,
  }) => {
    await page.goto(`/${animate}.html`);
    await page.evaluate(async () => await document.fonts.ready);

    const bytes = await page.pdf({
      height: "1080px",
      preferCSSPageSize: true,
      printBackground: true,
      width: "1920px",
    });

    const pdf = await getDocument({ data: new Uint8Array(bytes) }).promise;
    expect(pdf.numPages).toBe(SLIDE_COUNT);

    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const drawn = await pdf.getPage(index + 1);
        const { fnArray } = await drawn.getOperatorList();

        return fnArray;
      })
    );

    for (const [index, fnArray] of pages.entries()) {
      const paths = fnArray.filter((op) => PATH_OPS.has(op)).length;
      const text = fnArray.filter((op) => TEXT_OPS.has(op)).length;
      expect(paths, `page ${index + 1} paths`).toBeGreaterThan(20);
      expect(text, `page ${index + 1} text`).toBeGreaterThan(4);
    }
  });
}
