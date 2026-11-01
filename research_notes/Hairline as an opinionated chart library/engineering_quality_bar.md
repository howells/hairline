# Engineering quality bar for a production-grade chart library (Hairline), as of Nov 2026

Method note: evidence comes from web searches only (snippets plus summaries, not full-page fetches), about 15 tool calls. Several topics had no direct sources; see each Gaps section. Vendor benchmarks are flagged as interested parties.

## Accessibility

### Takeaway

The credible bar is: a named, described SVG with a real data-table alternative, keyboard-navigable data points, 3:1 mark contrast and non-colour cues (Hairline's textures are a genuine edge here), and a Chartability audit. Highcharts is the reference implementation, ECharts offers auto-description and decals, and Data Navigator is the best-documented toolkit for custom navigation.

### Cited Findings

- Chartability (Elavsky, Bennett, Moritz; EuroVis 2022) is a set of testable heuristics. v2 has 50 heuristics under POUR (Perceivable, Operable, Understandable, Robust) plus three extensions (Compromising, Assistive, Flexible). 36 of the 50 relate to visual access. — [Frank Elavsky, Chartability v2](https://www.frank.computer/blog/2022/05/chartability-v2.html); [Digital Government Hub](https://digitalgovernmenthub.org/library/chartability-for-accessible-data-visualizations-and-interfaces/)
- Data Navigator (Elavsky, Nadolskis, Moritz; IEEE VIS/TVCG 2023, not CHI) has three modules: Structure (a graph of nodes and edges), Input (keyboard, touch, voice, gesture) and Rendering (semantic HTML overlaid on the visual). It works over SVG, Canvas, images or WebGL. — [CMU Data Navigator](https://dig.cmu.edu/data-navigator/); [GitHub](https://github.com/cmudig/data-navigator); [paper PDF](https://www.domoritz.de/papers/2023-DataNavigator-VIS.pdf)
- Highcharts accessibility module: text description, keyboard navigation (Tab between elements, arrows within, Space to click), ARIA roles, low-vision features, voice input, and sonification via a separate module. Series are marked up as regions/landmarks. Its options include `keyboardNavigation`, `announceNewData`, `highContrastMode` and `landmarkVerbosity`. Screen-reader users can view the chart as a data table via the export-data module. — [Highcharts docs](https://www.highcharts.com/docs/accessibility/accessibility-module); [API](https://api.highcharts.com/highcharts/accessibility); [feature overview](https://www.highcharts.com/docs/accessibility/accessibility-module-feature-overview)
- A support-forum report said the Highcharts data table steals focus on load. The thread is about 4 years old and may be fixed. It is a reminder that focus management is a bug source. — [Highcharts forum](https://www.highcharts.com/forum/viewtopic.php?t=49240)
- ECharts: accessibility is off by default. With `aria` enabled, it auto-generates an `aria-label` description from the title, series and data. Since v5 it has decal patterns (`aria.decal`) so series differ by pattern as well as colour. The handbook uses `aria.show` and the API docs use `aria.enabled`. — [ECharts handbook](https://echarts.apache.org/handbook/en/best-practices/aria/)
- Observable Plot has root `ariaLabel` and `ariaDescription` options, auto `aria-label` on mark groups, a per-datum `ariaLabel` channel, and `ariaHidden` for decorative marks. A user reported an axe error: "aria-label cannot be used on a g with no valid role". — [Plot accessibility docs](https://observablehq.com/plot/features/accessibility); [Observable forum](https://talk.observablehq.com/t/is-observable-plot-wcag-compliant/8103)
- SVG semantics: MDN says the implicit role of `<svg>` is graphics-document. Use `aria-hidden="true"` for decorative graphics, and `role="img"` plus an accessible name for graphics without meaningful internal structure. Browser support for graphics-document is inconsistent, and the W3C ACT rule says adding `role="img"` significantly improves support. TPGI recommends `role="img"` with `aria-labelledby` pointing at `<title>` and `<desc>` ids. With `role="img"`, children are ignored by AT. For navigable charts, `role="group"` is the older fallback. — [MDN graphics-document](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/graphics-document_role); [W3C ACT rule](https://www.w3.org/WAI/standards-guidelines/act/rules/7d6734/proposed); [TPGI](https://www.tpgi.com/using-aria-enhance-svg-accessibility/); [CSS-Tricks, ~10 years old](https://css-tricks.com/accessible-svgs/)
- The W3C wiki chart-role taxonomy is only a draft proposal, so there is no standard chart role. — [W3C wiki](https://www.w3.org/wiki/SVG_Accessibility/ARIA_roles_for_charts)
- WCAG 2.2: 1.4.11 Non-text Contrast needs 3:1 for graphical objects required to understand content (bars, lines, focus indicators). 1.4.3 needs 4.5:1 for text. A colour-blind-safe palette can still fail 3:1 (pale bars on white, adjacent segments a shade apart). 2.5.8 Target Size (Minimum) needs 24x24 CSS px (legend toggles, buttons), and W3C's Understanding doc treats necessarily dense data-viz targets as an "Essential" exception. 1.1.1 needs a text alternative carrying the data. 1.4.1 covers colour as the only cue. — [Accessibility.build guide](https://accessibility.build/guides/accessible-charts); [fcharts WCAG guide](https://fcharts.dev/guides/wcag-chart-requirements); [W3C 1.4.3 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Secondary sources, except the W3C page.
- European Accessibility Act: applies from 28 June 2025 to consumer-facing services such as e-commerce, banking and transport. Presumption of conformity comes via EN 301 549 v3.2.1, which uses WCAG 2.1 AA for web content. EN 301 549 v4.1.1 (WCAG 2.2) was published in Sept 2026 but was not yet cited in the Official Journal as of mid-Oct 2026, per AudioEye. — [AudioEye](https://www.audioeye.com/post/what-is-en-301-549/); [Level Access](https://www.levelaccess.com/blog/eu-accessibility-requirements-and-eaa-compliance/). Vendor blogs, not the legal text.
- Disability World's 2026 review picked Plot for editorial charts because per-mark ARIA labels come free. — [Disability World](https://www.disabilityworld.org/articles/accessible-data-viz-tooling-2026/). Secondary source.

### Inferences

- Checklist for Hairline:
  - Root `<svg role="img">` with `<title>` and `<desc>` wired via `aria-labelledby`, plus an auto-generated summary sentence (trend, range, extremes).
  - A visually hidden or toggleable `<table>` of the data.
  - Roving-tabindex keyboard model: one Tab stop, arrows move between points, Home/End jump, Esc leaves.
  - Because `role="img"` hides children, interactive charts need a parallel semantic layer (the Data Navigator approach: HTML overlay) or `role="group"` with labelled children.
  - 3:1 contrast checked automatically on ink and texture against the background, including dark and print themes.
  - Hairline-specific risk: 1px hairlines in light ink may fail 1.4.11. Adding a contrast check or dev warning is advisable.
  - Textures as a non-colour cue satisfy 1.4.1 and match ECharts decals. They should be assigned per series by default.
  - 24px hit targets (invisible padded hit areas) for legend and toggles, with a `prefers-reduced-motion` path.
  - `aria-live` announcements for data updates, as in Highcharts `announceNewData`.
  - Run a Chartability self-audit and publish it.
- The EAA is mostly a driver for customers' sites, not the library itself. Libraries are expected to enable WCAG 2.1 AA conformance (2.2 is where the standard is heading). Shipping an accessibility conformance statement or VPAT-style doc would be a differentiator.

### Gaps

- No source found on sonification beyond Highcharts' module. Nothing found on Apple or Microsoft chart guidance (Audio Graphs, Swift Charts, Fluent) in these searches.
- Did not verify screen-reader behaviour (VoiceOver, NVDA, JAWS) on `role="img"` SVG with a data table. It needs hands-on testing.
- No W3C primary page for 1.4.11 or 2.5.8 was retrieved. Thresholds above are from secondary guides, though they match my understanding of the spec.
- No chart-specific EAA guidance found.

## Performance

### Takeaway

SVG is fine up to roughly 1-5k interactive elements. Beyond that, Canvas, then WebGL. Line and time-series libraries beat DOM-based ones on large data (uPlot). For an SVG library the practical answer is to downsample (LTTB or similar), cap element counts, and offer a Canvas fallback for dense marks.

### Cited Findings

- Rule-of-thumb thresholds from several guides: SVG under about 1-2k nodes (up to 2-5k when per-element interactivity and a11y matter), Canvas from about 2-5k, WebGL for tens of thousands and up. Filters, many strokes and dash patterns on thousands of paths hurt more, as does animation. Canvas hit-testing must be hand-written. — [interactive-data-visualization.com](https://www.interactive-data-visualization.com/core-rendering-engines-tradeoffs/svg-vs-canvas-architecture/); [DEV Community](https://dev.to/vitalf/svg-vs-canvas-vs-webgl-for-diagram-viewers-tradeoffs-bottlenecks-and-how-to-measure-34n7); [EU Data Visualisation Guide](https://data.europa.eu/apps/data-visualisation-guide/canvas). Blog-level sources and approximate.
- uPlot's own benchmark (166,650 points): uPlot 47.9 KB, 34 ms; Chart.js 4.2.1 254 KB, 38 ms; ECharts 5.4.1 1000 KB, 55 ms. Streaming 3,600 points at 60 fps: uPlot 10% CPU and 12 MB, Chart.js 40% and 77 MB, ECharts 70% and 85 MB. — [uPlot README](https://github.com/leeoniya/uplot). Author's own benchmark.
- ApexCharts 2026 benchmark (a competitor's): uPlot 9 ms for lines at 100k, Chart.js best on scatter (89 ms at 50k), ECharts 1,923 ms on the largest scatter. — [ApexCharts benchmark](https://apexcharts.com/blog/javascript-chart-library-benchmark/). Interested party.
- SciChart test suite: Chart.js and Plotly stopped at 100k points, ECharts errored at 200k, uPlot stopped at 500k. — [ABTSoftware suite](https://github.com/abtsoftware/javascript-chart-performance-test-suite). Vendor of a WebGL chart library.
- LTTB (Steinarsson, University of Iceland MSc thesis) downsamples by picking, per bucket, the point forming the largest triangle with the previous chosen point and the next bucket's average. Every output point is a real input point. It keeps first and last points. Ports exist in many languages, including a Chart.js plugin. — [flot-downsample](https://github.com/sveinn-steinarsson/flot-downsample); [thesis PDF](http://skemman.is/stream/get/1946/15343/37285/3/SS_MSthesis.pdf); [pingec/downsample-lttb](https://github.com/pingec/downsample-lttb)
- `shape-rendering: crispEdges` turns off anti-aliasing for crisp lines, and the CSS property overrides the attribute. It applies to basic shapes and paths. — [MDN](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering)

### Inferences

- Bar for Hairline:
  - Publish a measured element-count budget per chart type.
  - Add LTTB, or min/max per pixel column, as an opt-in `decimate` for lines.
  - Warn in dev when SVG nodes exceed a threshold (suggest about 2-3k).
  - Memoise scales and paths with a stable data identity.
  - Avoid per-point React components for large series (render one `<path>`).
  - Animate only transform and opacity. Skip animation when the data set is large.
  - Share one `<pattern>` def per texture, not one per mark.
- A Canvas or WebGL renderer is probably out of scope. Say so plainly in the docs, and point to uPlot or ECharts for more than 10k points.
- LTTB can drop the true min and max in a bucket, so it needs a caveat for charts where extremes matter. This is my reasoning, not from a source.

### Gaps

- No source found on the render cost of many pattern fills in Safari or WebKit, or whether `crispEdges` affects pattern contents. This needs a first-party benchmark: N rects times pattern fill, in Chrome, Safari and Firefox.
- No React-specific re-render benchmarks found (React 19 and Compiler versus visx or Recharts).
- Few independent benchmarks. Most numbers come from library authors or competitors.

## Responsiveness

### Takeaway

Measure the container with ResizeObserver, size to the container (not the window), and fix label collisions deterministically. Recharts' ResponsiveContainer shows the failure mode: it renders nothing until measured.

### Cited Findings

- Recharts `ResponsiveContainer` starts at `{width:-1,height:-1}`, uses ResizeObserver, and renders nothing until measured, so server HTML is empty and layout shifts after hydration. `initialDimension` (PR #3596, about v2.7) fixes the first render, but both values must be provided. — [Recharts #2736](https://github.com/recharts/recharts/issues/2736); [PR #3596](https://github.com/recharts/recharts/pull/3596); [API docs](https://recharts.github.io/en-US/api/ResponsiveContainer)
- WCAG 2.5.8 sets a 24x24 CSS px target minimum (see Accessibility). — [fcharts](https://fcharts.dev/guides/wcag-chart-requirements)

### Inferences

- Bar:
  - Accept an `aspectRatio`, or a width and height, as the SSR-time size. Hydrate to the measured size without a visual jump.
  - Use CSS container queries or width breakpoints to change tick count, label rotation and legend placement.
  - Run a deterministic label-collision pass (greedy placement by priority, drop or abbreviate on overlap) and test it at 320, 390 and 768 px.
  - Touch: tap to pin the tooltip, tooltip positioned away from the finger, and `touch-action` set so page scroll still works.

### Gaps

- No sources retrieved on label collision algorithms, container queries in charts, or mobile tooltip patterns. The bullets above are inference and common practice, not evidence.

## SSR, RSC and static export

### Takeaway

SVG is the best format here: it renders to a string on the server with no measurement needed, if the size is known. Determinism (stable ids, no random values, no `Date.now`) is the main requirement. Verify the rasteriser (resvg/Satori) handles your textures.

### Cited Findings

- Recharts: hydration mismatches from generated ids (issue #2272) were fixed in userland by passing a stable `id` from `useId`. A maintainer said then that Recharts had no explicit Next.js or SSR support. — [Recharts #2272](https://github.com/recharts/recharts/issues/2272)
- Observable Plot can render SVG or PNG on the server through JSDOM (`document` option, then `outerHTML`). Docs warn SSR is only practical for simple plots of small data. A React virtual DOM can be passed as `document`. v0.6.6 improved SSR and assumes high pixel density when headless. — [Plot getting started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md)
- Satori converts to SVG with its own layout engine based on SVG 1.1 and a limited CSS subset, and PNG output goes through resvg. Nuxt OG Image (Oct 2026) recommends Takumi for new projects, 2-10x faster with fuller CSS. — [Nuxt OG Image](https://nuxtseo.com/docs/og-image/renderers/satori); [vercel/satori](https://github.com/vercel/satori)
- Satori inline `<svg>` support (issue #86): JSX form only, with `currentColor` possible via resvg, and `<text>` needs resvg or conversion to paths. — [satori #86](https://github.com/vercel/satori/issues/86)

### Inferences

- Bar for Hairline:
  - Charts render identically in a Server Component with no `useEffect`, `window` or `ResizeObserver` required for first paint.
  - Ids from `useId` only (patterns, clip paths, titles).
  - Fixed or aspect-ratio box so there is no CLS.
  - A `renderToStaticMarkup` recipe producing a standalone SVG that carries inline styles, with no CSS variables or external CSS (resvg and email clients do not resolve them reliably; the CSS-variable claim is my assumption, unverified).
  - Test the PNG path through resvg for crisp 1px lines and `<pattern>` fills.
  - Print styles: `@media print` with ink-only colours, and patterns that survive greyscale.
  - Document font handling for server rasterisation, since fonts must be supplied to Satori and resvg.

### Gaps

- Could not confirm resvg or Satori support for SVG `<pattern>` fills; search found nothing. This is a critical test for Hairline since its textures are patterns. Check the resvg test suite or try it directly.
- No sources on email client SVG support (Gmail and Outlook strip or ignore inline SVG; commonly known but not verified here), PDF export, or print CSS.
- Nothing found on RSC-specific chart pitfalls beyond the `"use client"` boundary for interactivity.

## Bundle size and tree-shaking

### Takeaway

Published numbers conflict depending on whether the full package or a tree-shaken import is measured. Hairline should publish its own per-chart numbers, measured with a stated tool, and have ESM, `sideEffects: false` and per-chart entry points.

### Cited Findings

- Bundlephobia main-export gzip snapshot, 7 July 2026: D3 about 90 KB; ECharts about 359 KB (ApexCharts post) or 157-177 KB in TanStack's controlled suite; Recharts 157-172 KB, or 97-113 KB with React externalised; @visx/xychart about 49 KB. — [TanStack Charts comparison](https://tanstack.com/charts/latest/docs/comparison); [ApexCharts State of JS Charting 2026](https://apexcharts.com/blog/state-of-javascript-charting-2026/). ApexCharts is a competitor.
- Other measurements disagree: Recharts about 150 KB full or about 70 KB tree-shaken, and visx core about 25 KB (gist); Recharts 136 KB and D3 89.8 KB (PkgPulse); PkgPulse guides contradict each other (about 50 KB versus about 370 KB for Recharts). — [gist](https://gist.github.com/kevinnft/8e2313a2c43d05be37c374ae6249a475); [PkgPulse](https://www.pkgpulse.com/compare/d3-vs-recharts); [PkgPulse guide](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026). Treat as low reliability.
- ECharts tree-shaking: `echarts/core` with `echarts.use(...)` cuts it to about 80-130 KB for a bar chart with tooltip, grid and dataZoom (blog estimate). — [Chen Guangliang](https://chenguangliang.com/en/posts/blog152_react-chart-libraries-comparison/)
- uPlot is about 48 KB min. — [uPlot README](https://github.com/leeoniya/uplot)

### Inferences

- Bar:
  - Per-chart subpath exports.
  - ESM-first with `sideEffects: false`.
  - Import d3 submodules (`d3-scale`, `d3-shape`), not the `d3` umbrella.
  - A CI size budget, for example size-limit per entry.
  - A published table of gzip size per chart, with React externalised and the tool named.
  - Textures and CSS shipped without a global stylesheet side effect.
- Because incumbents are 50-170 KB gzip depending on method, a chart at under about 15-20 KB gzip would stand out. That target is my suggestion, not a sourced figure.

### Gaps

- Did not fetch bundlephobia or pkg-size directly; all numbers are second-hand. Recharts, Nivo, Victory and AG Charts numbers were not found. Hairline's own sizes were not measured. Check the repo's package.json for `exports` and `sideEffects`.

## Internationalisation

### Takeaway

No sources retrieved. The expected bar is `Intl.NumberFormat` and `Intl.DateTimeFormat` with a `locale` prop, formatters injectable, and RTL support, but this is from general knowledge and is not evidenced here.

### Cited Findings

- None found in this research pass.

### Inferences

- Bar:
  - Default formatting via `Intl` with an explicit locale prop (no reliance on the server's default locale, which would break SSR determinism and hydration).
  - Compact notation, currency and unit support.
  - Time zone as an explicit prop for date axes.
  - RTL: mirror axes and legends when `dir="rtl"`, while keeping numerals and plots in their conventional direction. Test with Arabic or Hebrew labels, plus CJK, for text measurement.
  - Measure text with a real font or canvas `measureText`, not character-count heuristics. This is the main source of SSR and client mismatch.

### Gaps

- All of i18n: no search was done on Intl in charts, RTL charts or text measurement.

## Testing

### Takeaway

Use Playwright screenshots per browser and OS on one pinned CI image, plus DOM or SVG-string snapshot tests that are not rasteriser dependent, property or fuzz tests on edge-case data, and axe checks. Hairline's 1px pixel-snapped lines need an explicit cross-browser and DPR test matrix.

### Cited Findings

- Playwright `toHaveScreenshot()` stores baselines per browser and platform. It defaults to `scale: 'css'` (one output pixel per CSS pixel), retries until two consecutive captures match, and uses pixelmatch with `threshold`, `maxDiffPixels` and `maxDiffPixelRatio`. Docs warn rendering varies with OS, version, settings, hardware and headless mode. Suggested settings are `animations: 'disabled'` and a tolerance around 0.2-2%. — [Bug0 guide](https://bug0.com/knowledge-base/playwright-visual-regression-testing); [QA Skills](https://qaskills.sh/blog/playwright-visual-regression-testing-guide); [TestGrid](https://testgrid.io/blog/playwright-visual-regression-testing/). Secondary guides.
- macOS and Linux differ in anti-aliasing and fonts, so CI should run on a single fixed environment. — [Testing Academy](https://app.thetestingacademy.com/blog/playwright-screenshot-font-rendering-differences)

### Inferences

- Bar:
  - Layer 1: serialised SVG snapshot tests (deterministic, fast, catch geometry regressions).
  - Layer 2: Playwright screenshots in Chromium, Firefox and WebKit at DPR 1, 2 and 3, tolerance near zero for hairlines. A 1px line that lands on a half pixel is a failure that a high tolerance would hide.
  - Layer 3: a hosted review tool (Chromatic, Argos or Lost Pixel) if needed. These were not researched here.
  - Fuzz and property tests (fast-check) over data: empty, single point, all equal, negative, NaN or null or Infinity, duplicate x, unsorted dates, huge or tiny ranges, very long labels. Invariants: no NaN in the output SVG, no throw, domain always finite.
  - Type tests (tsd or expect-type) for public props.
  - axe-core on every story, plus a manual screen-reader pass.
  - A bundle-size gate.

### Gaps

- Nothing retrieved on Chromatic, Argos or Lost Pixel specifically, on Safari or Firefox sub-pixel behaviour for 1px SVG strokes, or on fast-check usage in chart libraries. No evidence how incumbents test (Recharts, visx and Plot test setups were not checked).

## Robustness

### Takeaway

No direct sources. Expected behaviour is that bad data never throws or emits `NaN` into path attributes. Failures should degrade to an empty or placeholder state with a dev-only warning.

### Cited Findings

- None directly. Related: the Recharts `ResponsiveContainer` rendering null on negative size is an example of silent empty output that confuses users. — [Recharts #2736](https://github.com/recharts/recharts/issues/2736)

### Inferences

- Bar:
  - Explicit empty, loading and error states with accessible text (not a blank box).
  - Dev-only warnings (stripped in production) for NaN, unsorted domains, too many nodes, missing `title` or alt text, and contrast failures.
  - Never emit `NaN` or `Infinity` into SVG attributes.
  - Clamp or skip invalid points, and document whether gaps break lines.
  - An exported error boundary recipe.
  - Zero-width and zero-height guards.
  - Domain padding for a single value.

### Gaps

- No evidence gathered about how incumbents handle edge cases or what warnings they emit. Worth reading Recharts' and Plot's issue trackers for NaN and empty-data bugs.

## Suggested next steps (research debt)

- Hands-on tests: resvg and Satori with `<pattern>`; Safari performance with many pattern fills; 1px stroke crispness at fractional DPR in the three engines.
- Fetch primary pages: W3C Understanding for 1.4.11 and 2.5.8, the EAA text, Data Navigator docs, Chartability checklist.
- Measure Hairline's per-chart gzip size against visx, Recharts and Plot with one tool.
