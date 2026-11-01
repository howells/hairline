# Acceptance suite (HAI-16)

Wiredeck's acceptance test, automated: a host page of twelve 1920x1080 slides (six charts, dark and light) built only from the published package (registry lookup by kind, schema-validated JSON, `deriveTheme`, `hairline.css`, `scale` 2.5), drawn in headless Chromium at device pixel ratios 1, 2 and 3.

- `pnpm e2e` runs the whole suite, screenshots included, in the official Playwright image (needs Docker). It builds the package inside the image.
- `pnpm exec playwright test -c acceptance/playwright.config.ts` runs it on the host. Needs `pnpm build:lib` first and Playwright's Chromium (`pnpm exec playwright install chromium`). Off Linux the screenshot comparison does not run; ready, layout shift and PDF checks do.
- `pnpm generate:baselines` regenerates the baselines in the Playwright image, for `visual.spec.ts` alone. Commit `acceptance/baselines/`. The comparison runs in the same image, so never update them from macOS.
- `pnpm generate:artefacts` writes `artefacts/strokes-2x.png`: the six charts at 2x with `strokes="proportional"` beside `strokes="device"`.

Baselines for `animate="mount"` are separate from `"off"`: the settled pages are not pixel-identical.

`tailwind.spec.ts` (Linux only) draws the "off" slides under the stylesheet Tailwind compiles from `src/system/app.css`, the gallery's own, and compares each to the baseline made from the `hairline.css` page, within 0.2% of the pixels. It shares the baselines, which is why `pnpm generate:baselines` updates through `visual.spec.ts` alone: an update that included the Tailwind spec would overwrite the baselines with the Tailwind picture.
