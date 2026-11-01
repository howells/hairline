# Acceptance suite (HAI-16)

Wiredeck's acceptance test, automated: a host page of twelve 1920x1080 slides (six charts, dark and light) built only from the published package (registry lookup by kind, schema-validated JSON, `deriveTheme`, `hairline.css`, `scale` 2.5), drawn in headless Chromium at device pixel ratios 1, 2 and 3.

- `pnpm acceptance` runs it. Needs `pnpm build:lib` first and Playwright's Chromium (`pnpm exec playwright install chromium`). On macOS the screenshot comparison does not run; ready, layout shift and PDF checks do.
- `pnpm acceptance:linux` runs the whole suite, screenshots included, in the official Playwright image.
- `pnpm acceptance:update` regenerates the baselines in that image. Commit `acceptance/baselines/`. CI compares in the same image, so never update them from macOS.
- `pnpm acceptance:artefacts` writes `artefacts/strokes-2x.png`: the six charts at 2x with `strokes="proportional"` beside `strokes="device"`.

Baselines for `animate="mount"` are separate from `"off"`: the settled pages are not pixel-identical.
