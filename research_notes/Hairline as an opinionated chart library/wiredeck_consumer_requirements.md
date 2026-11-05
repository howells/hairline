# Wiredeck as Hairline's first outside consumer: requirements verified against the code and against incumbent chart libraries

Scope and method. Code evidence is cited as file:line against /Users/danielhowells/Sites/hairline at commit f5444ab (read-only; one empirical SSR probe was run from /tmp against the built `lib/`). Incumbent evidence comes from web searches run 2026-11-01. "Inferences" sections hold my recommended designs (c) and effort/risk (d); they are design proposals, not sourced facts. Code paths are linked as file URLs.

Cross-cutting facts found while reading the code (they affect several items):

- The library's "slope" chart is `Slope` in `src/charts/board/slope.tsx`, and it is NOT exported. `src/index.ts` lists basics/big/forms/glance/lupi/maps/originals charts only. Empirically, the built `lib/index.js` exports 71 names and `"Slope" in m` is false. Wiredeck's six (bars, line, area, scatter, slope, dumbbell) map to `RungBars`, `HairlineLine`, `HairlineArea`, `PlumbScatter`, and (no exported slope; closest exported are `PairedRungs` or `DumbbellQueue`), `DumbbellQueue`. — [src/index.ts](file:///Users/danielhowells/Sites/hairline/src/index.ts); [board/slope.tsx:163](file:///Users/danielhowells/Sites/hairline/src/charts/board/slope.tsx); [scripts/library-index.ts:1-60](file:///Users/danielhowells/Sites/hairline/scripts/library-index.ts)
- Styling is Tailwind v4 utility classes written inside chart JSX (e.g. `fill-hero`, `fill-l4`) that the host's Tailwind build must generate by scanning the package (`@source "./charts"` is prepended to `lib/theme.css`). A host without Tailwind v4 gets no styling. — [scripts/library-css.ts:12](file:///Users/danielhowells/Sites/hairline/scripts/library-css.ts); [rung-bars.tsx:119](file:///Users/danielhowells/Sites/hairline/src/charts/basics/rung-bars.tsx); [README.md:29](file:///Users/danielhowells/Sites/hairline/README.md)

## 1. Distribution: npm/public GitHub, semver, changelog, per-chart entry points, tree-shaking

### Takeaway

Package is `private: true` with two exports (`.` and `./kit`) plus two CSS files; no changelog, no tags, no per-chart subpaths, version 0.1.0. The build is already `preserveModules`, so deep-import splitting is mostly an `exports` map and a generator change, but `lib/` bundles 1.1 MB of atlas JSON and 2.3 MB of sourcemaps, and ships a `lib/node_modules/.pnpm/...` tree that should not be published. Incumbents split by subpath (ECharts `echarts/core` + `echarts/charts`) or by package (visx, Nivo).

### Cited Findings

- `"private": true`, `"version": "0.1.0"`, `files: ["lib"]`, `sideEffects: ["*.css"]`, `exports` only `.`, `./kit`, `./tokens.css`, `./theme.css`. — [package.json:3-4,11,15,18](file:///Users/danielhowells/Sites/hairline/package.json)
- README documents install as `file:../charts` and says a `file:` install is a copy needing rebuild. — [README.md:29](file:///Users/danielhowells/Sites/hairline/README.md)
- No CHANGELOG file and no git tags in the repo (`ls CHANGELOG*` no match; `git tag` empty); 40 commits.
- Library build: ES modules, `preserveModules: true` with `preserveModulesRoot: "src"`, a `"use client"` banner on every chunk, externals for react, react-dom, `d3-*`, topojson-client. Entry points are only `index` and `kit`. — [vite.lib.config.ts:11-28](file:///Users/danielhowells/Sites/hairline/vite.lib.config.ts)
- `lib/` is 4.4 MB total: ~1.4 MB .js, ~2.3 MB .map, ~760 KB .d.ts; `lib/node_modules` is 540 KB and holds `us-atlas` (170 KB) and `world-atlas` (146 KB) JSON bundled in (checked with `du`/`ls`). Maps are only used by two charts.
- Dependencies (runtime) are 17 d3/topojson/atlas packages; `us-atlas` and `world-atlas` are listed as dependencies though bundled (`package.json` dependencies list).
- `d3-*` are externals, so tree-shaking of d3 is the host bundler's job; every `index.js` re-exports all charts, and each chart module is a separate file, so named imports from `.` tree-shake only if the host bundler honours `sideEffects` and the barrel is analysable (`sideEffects` is `["*.css"]`, which allows it).
- ECharts: official tree-shakeable API `import * as echarts from 'echarts/core'`, charts from `echarts/charts`, a renderer from `echarts/renderers`, registered with `echarts.use([...])`; a third-party wrapper estimates ~1 MB full vs ~150 KB tree-shaken (that library's own estimate). — [ECharts handbook: import](https://echarts.apache.org/handbook/en/basics/import); [react-echarts-library README via search](https://github.com/yerzhansa/react-echarts-library)
- Tree-shaking is not automatic: apache/echarts#15138 reports an Angular bundle growing (1.2 MB to 1.3 MB) when using the tree-shakable API, with a common cause being the full package imported elsewhere. — [apache/echarts#15138](https://github.com/apache/echarts/issues/15138)
- visx and Nivo are published as many per-chart packages (e.g. Nivo `@nivo/bar` with `ResponsiveBar` in `packages/bar/src/ResponsiveBar.tsx`). — [nivo ResponsiveBar.tsx](https://github.com/plouc/nivo/blob/master/packages/bar/src/ResponsiveBar.tsx); [visx docs](https://visx.airbnb.tech/docs/responsive)

### Inferences

- (c) Design: keep one package; generate `exports` subpaths from `scripts/library-index.ts` (it already enumerates every chart file): `"./rung-bars": {types, default: "./lib/charts/basics/rung-bars.js"}` plus `"./kit"`, `"./css/*"`. Give kebab-case names matching the registry id (item 6). Add `"./theme"` (item 5) and `"./schema"`, `"./registry"` (item 6) as separate subpaths so agent tooling never loads React. Move atlas JSON to a `@howells/hairline/maps` subpath so the other 69 charts carry no 316 KB of atlases; set `files` to exclude `*.map` (or ship maps but exclude `lib/node_modules`).
- (c) Release: npm public under `@howells/hairline` with `npm publish --provenance`, Changesets for semver plus CHANGELOG, prop types exported by name (`RungBarsProps`) since README:57 admits they are not. 0.x semver with the charts' prop shapes marked experimental until the schemas (item 6) are stable; the zod schemas become the semver contract.
- (c) Confirm tree-shaking in CI: a size-limit or esbuild-metafile test that imports `RungBars` alone and asserts no `world-atlas`, `d3-force`, `d3-sankey`, `d3-chord` in the output.
- Wiredeck's Vercel build failure follows directly from `file:../charts` pointing outside the repo; publishing (or a git dependency with a `prepare` build) resolves it.
- (d) Effort: low to medium (2-3 days: exports generator, publish pipeline, size test). Risk: low; the one design risk is the Tailwind-scanning CSS (cross-cutting note above): per-chart subpaths mean the host's `@source` must still cover `node_modules/@howells/hairline/lib` or the CSS must be precompiled (see item 5).

### Gaps

- Did not verify the actual published layout of visx (per-package) beyond docs; did not measure real tree-shaken sizes of Hairline (no bundle analysis was run, only `du` of `lib/`).
- Did not check whether `lib/node_modules/.pnpm/...` resolves correctly when published (it is an artifact of bundling JSON from pnpm paths; it works with `file:` because the copy includes it).

## 2. Server rendering and deterministic output (fixed-size mode)

### Takeaway

Confirmed and verified empirically: every chart renders an empty `<div class="... is-hidden">` on the server because `useMeasure` starts at 0 and `Plot`/`Chart` gate children on `width > 0`. Hairline has no `width` prop on any of the six charts. Incumbents all have a fixed-size path (Recharts `initialDimension`, visx `initialSize`, Nivo non-responsive `Bar`, ECharts `ssr: true` with width/height, Vega headless, Plot jsdom); Hairline is currently behind them, not ahead.

### Cited Findings

- `useMeasure` initial state `useState(0)`; sets width in a layout effect from `contentWidth(ref.current)` and a `ResizeObserver`. — [hooks.ts:33-49](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- `Plot` renders `{width > 0 && props.children(width)}`; `Chart` does the same inside a `<figure>`. — [core.tsx:58](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx); [core.tsx:30](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx)
- Empirical probe (`renderToString(<RungBars/>)` against built `lib/index.js` under Node): output is only `<div class="[&_svg:focus-visible]:outline-muted relative min-w-0 ... is-hidden "></div>`, no `<svg>`. Two instances in one tree also render empty.
- README acknowledges: "Charts measure their width in the browser, and the first render assumes reduced motion, so the server and client agree." — [README.md:59](file:///Users/danielhowells/Sites/hairline/README.md)
- The six target charts take `height?` but no `width` prop (`RungBarsProps`, `HairlineLineProps`, `PlumbScatterProps`, `DumbbellQueueProps`; `HairlineAreaProps` has `maxWidth`). — [rung-bars.tsx:17-28](file:///Users/danielhowells/Sites/hairline/src/charts/basics/rung-bars.tsx); [hairline-line.tsx:25-37](file:///Users/danielhowells/Sites/hairline/src/charts/basics/hairline-line.tsx); [dumbbell-queue.tsx:17-31](file:///Users/danielhowells/Sites/hairline/src/charts/basics/dumbbell-queue.tsx); [hairline-area.tsx:26-43](file:///Users/danielhowells/Sites/hairline/src/charts/basics/hairline-area.tsx)
- Server and client text measurement differ: `textWidth` falls back to an Inter-bucket estimate (`sansWidth`) when `document` is undefined or `document.fonts.status !== "loaded"`, and otherwise measures a hidden SVG `<text>` with `getComputedTextLength`. Layout of charts using it (18 files use `textWidth`/`labelRoom`; 54 use `sansWidth`/`inkWidth`) can therefore differ between server, first paint and font-loaded states. — [glance/util-a.ts:14-34](file:///Users/danielhowells/Sites/hairline/src/charts/glance/util-a.ts); [util.ts:107-134](file:///Users/danielhowells/Sites/hairline/src/charts/util.ts)
- Other chart modules use `window`/`performance` only in effects or the client-only `useMotionPreference` (server snapshot `null` mapped to reduced motion), so the SSR path itself is hydration-safe. — [hooks.ts:84-93](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- Recharts: `ResponsiveContainer` starts at `{width:-1,height:-1}` and renders null on server; maintainers say it can't render on server since it doesn't know the screen size, but renders with fixed width/height; PR #3596 added `initialDimension={{width,height}}` (set both or neither). Recharts 3.3+ adds a `responsive` prop on the chart. — [recharts#3595](https://github.com/recharts/recharts/issues/3595); [recharts PR #3596](https://github.com/recharts/recharts/pull/3596); [Recharts sizes guide](https://recharts.github.io/guide/sizes)
- visx `useParentSize`/`ParentSize` accept `initialSize` (defaults `{width:0,height:0,...}`), use ResizeObserver, `debounceTime` default 300 ms; visx 4 ParentSize can clip to 0 height without an explicit height. — [visx responsive docs](https://visx.airbnb.tech/docs/responsive); [useParentSize.ts](https://github.com/airbnb/visx/blob/master/packages/visx-responsive/src/hooks/useParentSize.ts); [cadence-web PR #1649](https://github.com/cadence-workflow/cadence-web/pull/1649)
- Nivo: use non-responsive `Bar` with numeric `width`/`height`; `ResponsiveBar` wraps `ResponsiveWrapper` with `defaultWidth`/`defaultHeight`. Known bugs: first render of bar chart is in the animated state even with `animate={false}` (empty chart in static PDF output, #2127), `gridXValues` and `theme` ignored in SSR (#2368). — [nivo#2368](https://github.com/plouc/nivo/issues/2368); [nivo#2127](https://github.com/plouc/nivo/issues/2127)
- ECharts 5.3+: zero-dependency string SVG SSR: `echarts.init(null,null,{renderer:'svg',ssr:true,width,height})` then `chart.renderToSVGString()`; supports initial animation; 5.5 adds `echarts-ssr-client` hydration. SSR is SVG-only, and PNG/PDF still needs rasterising. — [ECharts SSR handbook](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/); [PR #15880](https://github.com/apache/echarts/pull/15880)
- Vega: `new vega.View(vega.parse(spec), {renderer:'none'})` then `await view.runAsync()`, `await view.toSVG()`; vega-cli ships vg2svg/vg2png/vg2pdf. A deterministic Vega-Lite-to-SVG service sets `TZ=UTC` and seeds Vega's RNG for byte-reproducible output. — [Vega usage](https://vega.github.io/vega/usage/); [red-cup-engineering service](https://github.com/red-cup-engineering/chart-specification-rendering-service)
- Observable Plot: pass a JSDOM `document` option and serialise with `outerHTML`; docs caution SSR is only practical for simple plots with small data; also a virtual-document route (`toHyperScript`) for React. — [Plot getting started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md); [Plot discussion #2158](https://github.com/observablehq/plot/discussions/2158)
- AG Charts 13.2+: `ag-charts-server-side` renders PNG/JPEG with no browser, Node 20+, requires an Enterprise licence, `loadFonts` for custom fonts, no remote font fetching. — [AG Charts SSR docs](https://www.ag-grid.com/charts/javascript/server-side-rendering/)
- Highcharts: image export is by the Node export server or `export.highcharts.com`; size precedence is export options, then `sourceWidth/sourceHeight/scale`, then chart `width/height`. — [highcharts/node-export-server](https://github.com/highcharts/node-export-server)

### Inferences

- (c) Design. Add a shared `size` prop on every chart, implemented once in `Plot`/`Chart`:
  ```ts
  interface Sized {
    width?: number;
    height?: number;
  } // width present => fixed mode
  // Plot: const [ref, measured] = useMeasure();  const w = props.width ?? measured;
  // if (props.width !== undefined) skip ResizeObserver, render children(width) on the server.
  ```
  Fixed mode: no `useMeasure` effect, no `IntersectionObserver`, `width` is truth, so `renderToString` yields full SVG. Keep responsive mode default. Also expose `initialWidth` (Recharts/visx pattern) so a responsive chart can SSR at a guessed width then correct on mount, with `suppressHydrationWarning` not needed because content is data-driven.
- (c) Text determinism: add `fontMetrics?: "estimate" | "measure"`; fixed mode defaults to `"estimate"` (the `sansWidth` table) so server, headless Chromium and client produce identical SVG regardless of font load state. The cost is that labels are laid out for Inter widths; `measure` stays available for responsive mode. Alternatively bake a per-font width table through the theme API (item 5).
- (c) Add a test: `renderToString` golden snapshots per chart at fixed sizes in CI (also guards item 9).
- Wiredeck-specific: with fixed mode, the SSR HTML contains the finished SVG; for PNG/PDF via headless Chromium the page needs no ResizeObserver tick.
- (d) Effort: low for the prop and fixed path (two components: `Plot`, `Chart`; 73 files use `<Plot`, 10 `<Chart`), medium to verify each of ~71 charts lays out correctly at arbitrary widths since the six target charts have only been checked at 1440/390 (README:"Adding a chart" step 4). Risk: medium; label-width estimation errors become visible clipping in fixed mode.
- Claim check: "most chart libs are poor at SSR" is only partly true; see the claim-test section.

### Gaps

- Did not run Hairline under a real browser to compare server estimate vs client measured widths, so the size of the layout difference is unquantified.
- Did not verify the Recharts 3.3 `responsive` prop behaviour on the server beyond the docs page snippet.

## 3. Motion control and a readiness signal

### Takeaway

Entry animation is gated by a one-shot `IntersectionObserver` (threshold 0.2) that toggles `.is-hidden`/`.is-shown` classes; there is no off switch, no replay, and no ready signal. In a headless export the chart stays at `scaleY(0)`/`opacity:0` (grow/pop/sweep/fade/draw all key off `.is-hidden`) unless the plot is scrolled into view, so unscrolled slides in an all-slides print page export blank. Incumbents mostly rely on disabling animation plus an ad-hoc flag; ECharts `finished` and Chart.js `onComplete` exist but have documented edge-case bugs. A first-class `animate` prop plus a deterministic `data-hl-ready` attribute would be better than all of them.

### Cited Findings

- `useReveal`: creates an `IntersectionObserver` with `{threshold: 0.2}`, sets `shown` true once and disconnects; never false again. — [hooks.ts:52-72](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- `Plot` adds `is-shown`/`is-hidden` from `useReveal`; `Chart` does the same on the `<figure>`. — [core.tsx:7,23,27,51,55](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx)
- CSS: `grow-y`, `grow-x`, `pop`, `sweep`, `fade`, `draw` set the hidden state under `:where(.is-hidden)` (scale 0, opacity 0, dash offset) only inside `@media (prefers-reduced-motion: no-preference)`, then animate under `.is-shown`; under `prefers-reduced-motion: reduce`, `.is-hidden {opacity:0}` and `.is-shown` runs a `fade-in`. Either way, an unrevealed plot is invisible. — [hairline.css:277-372](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css); [hairline.css:374-381](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css)
- Durations: 400/600/800/1200 ms tokens plus stagger of 8-80 ms per mark index; a bar chart with many marks can take well over 1.2 s to settle. — [tokens.css:286-299](file:///Users/danielhowells/Sites/hairline/src/system/tokens.css); [motion.ts:12-18](file:///Users/danielhowells/Sites/hairline/src/charts/motion.ts)
- Script-driven charts (race, morph, draw-in) use `useLive` = `useReveal` AND live `useInView`, and `usePlayhead` already exposes `done`, `handleReplay`, `handleSeek`, `handleToggle`, `playing`, `reduced`; reduced motion starts the playhead at `end` or `start`. So a replay/settled concept exists for a subset of charts, not for CSS-driven ones. — [playback.ts:41-45,120-165](file:///Users/danielhowells/Sites/hairline/src/charts/playback.ts)
- No `data-hl-ready`/`onReady`/`animate` anywhere in `src` (grep for `data-hl` and `--hl-` found nothing).
- Reduced motion: `useMotionPreference` returns null on server, `useReducedMotion` treats null as true. — [hooks.ts:84-93](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- ECharts: `finished` fires when rendering and animation finish; `rendered` fires after each frame and does not mean animation ended; the handbook says without animation you can call `getDataURL` synchronously, otherwise wait or listen to `rendered`; `finished` was not fired when `animation:false` (#14101) and when registered after `setOption` with animation off (#17500, workaround: register before `setOption`). — [ECharts transition handbook](https://echarts.apache.org/handbook/en/how-to/animation/transition/); [#14101](https://github.com/apache/echarts/issues/14101); [#17500](https://github.com/apache/echarts/issues/17500)
- Highcharts: `chart.animation:false` does not affect the initial series animation, which needs `plotOptions.series.animation` (false or `duration:0`); `chart.events.load` fires once (since 4.2.2 it waits for images), `render` fires after load and after each redraw. The results did not say whether `load` waits for the initial series animation, nor how the export server handles animation. — [chart.animation API](https://api.highcharts.com/highcharts/chart.animation); [Highcharts common events](https://www.highcharts.com/docs/chart-concepts/common-events)
- Chart.js: `options.animation.onComplete` fires after animations, `context.initial` distinguishes first render; issue #8897 asks for a proper "first render finished" hook and notes tooltip activity re-triggers `onComplete`; QuickChart: blank exports come from async animation, fix by calling `toBase64Image()` in `onComplete`. — [Chart.js animations docs](https://www.chartjs.org/docs/latest/configuration/animations.html); [Chart.js#8897](https://github.com/chartjs/Chart.js/issues/8897); [QuickChart image export](https://quickchart.io/documentation/chart-js/image-export/)
- Vega: `await view.runAsync()` evaluates the dataflow and renders; `toSVG()` returns a Promise of the SVG string. — [Vega View API](https://vega.github.io/vega/docs/api/view/)
- Observable Plot: returns a static SVG element synchronously; no animation (so no readiness problem); server-side use is via the `document` option. — [Plot getting started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md)
- Screenshot/PDF practice: disable animation, set a flag (`window.__renderDone = true`, or a DOM attribute such as `[data-screenshot-ready="true"]`), wait with `page.waitForFunction`/`waitForSelector`, then `page.pdf()`; wait a `requestAnimationFrame` after sync DOM updates; current Puppeteer `page.pdf()` waits for `document.fonts.ready` by default; fixed delays are bad practice and `waitForTimeout` was removed from newer Puppeteer; Playwright's screenshot animation handling does not freeze JS/canvas animation. — [Anvil: charts missing in PDF](https://www.useanvil.com/ask-anvil/pdfs/charts-images-missing-html-to-pdf-output/); [HTMLCSStoImage](https://htmlcsstoimage.com/blog/wait-for-page-before-screenshot); [ScreenshotOne: Playwright](https://screenshotone.com/blog/playwright-wait-for-page-to-load/)

### Inferences

- (c) Design:
  ```ts
  type Animate =
    | "scroll"
    | "mount"
    | "off"
    | { when: "scroll" | "mount" | "off"; replayKey?: string | number };
  interface MotionProps {
    animate?: Animate; // default "scroll" (today's behaviour)
    onReady?: () => void; // fires once settled (after last transition end)
  }
  // Root element: data-hl-state="idle|animating|ready", data-hl-ready="true" once settled.
  ```
  `off` renders `.is-shown` on first paint and adds a root attribute that zeroes durations (`[data-hl-motion="off"] * { animation: none !important; transition: none !important }`), `mount` skips the IntersectionObserver and flips on first layout effect, `scroll` is the present behaviour. Replay: bump `replayKey` (the host sets it when a slide becomes current); the component removes `is-shown` for one frame and re-adds it (state flip in a layout effect plus `requestAnimationFrame`), so no remount is needed and fixed-mode SSR output is unaffected.
- (c) Settled signal: compute from tokens, not from guessing: `settleMs = DURATION.grow + maxIndex * stagger + fadeLag` (use `DURATION`, stagger tiers in motion.ts) or, better, count `animationend` events for elements with animation, falling back to the timeout. Set `data-hl-ready="true"` on the chart root and expose a document-level aggregate (`window.__hairlineReady` count of mounted vs ready charts, or the host can query `document.querySelectorAll('[data-hl-ready="false"]').length === 0`). In `off` and SSR fixed mode, ready is true in the very first HTML, which is the strongest guarantee for exports.
- (c) Exports: Wiredeck's exporter should render with `animate="off"` plus fixed size (item 2), then `page.waitForSelector('[data-hl-ready="true"]')` (and `document.fonts.ready`) for each chart. A `?export=1` host flag or `[data-hl-export]` ancestor attribute could force `off` globally via CSS so unscrolled slides in a print view are not blank.
- Fix for print views with many slides: the IntersectionObserver gate is the cause of blank offscreen charts; `animate="mount"` or `"off"` removes it.
- (d) Effort: medium (state machine in `Plot`/`Chart`, CSS override block, `usePlayhead` charts need `animate="off"` to start at `end`, tests). Risk: medium; replay correctness across ~71 charts, plus ensuring script-driven charts (BarRace, ScatterMorph) honour `off` (they use `useLive`, not just `useReveal`).
- Differentiation: incumbents' ad-hoc flags show the gap; a documented, attribute-based, SSR-true ready state is genuinely uncommon (see claim test).

### Gaps

- Could not confirm whether Highcharts `chart.events.load` waits for the initial series animation, nor Highcharts export server animation handling (search results silent).
- Did not measure real settle times of the six charts; the `settleMs` formula is my estimate from tokens.
- Did not test Playwright/Puppeteer against Hairline in a browser.

## 4. Scale: slide-sized type, and whether strokes and textures scale

### Takeaway

Type sizes are single constants (`--text-tick: 11px`, `--text-figure: 30px`), but layout is computed in JS assuming 11-12 px Inter glyph widths in at least 54 chart files, and 59 files hard-code stroke widths (102 occurrences), with 1 px lines snapped by `crisp()`. A CSS font-size variable alone will break layout. The sound approach is to render the chart at a smaller logical width and scale the whole SVG uniformly (viewBox), with `vector-effect: non-scaling-stroke` for hairlines the owner wants to stay 1 px. Precedent (Datawrapper zoom, Highcharts scale/sourceWidth) scales everything together.

### Cited Findings

- Text roles are `font-size: --theme(--text-tick)` (11 px) for `t-axis`, `t-label`, `t-value`; `t-figure` uses `--text-figure` (30 px). — [hairline.css:87-88,112-146](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css)
- Label widths are estimated at fixed pixel sizes: `sansWidth(text, size = 11)` buckets Inter glyph advances; `noteLines` fixes `NOTE_SIZE = 11`; individual charts pass 10.4 or 12. — [util.ts:107-141](file:///Users/danielhowells/Sites/hairline/src/charts/util.ts); [type-colonnade.tsx:72](file:///Users/danielhowells/Sites/hairline/src/charts/lupi/type-colonnade.tsx); [tick-donut.tsx:44](file:///Users/danielhowells/Sites/hairline/src/charts/basics/tick-donut.tsx)
- 1 px rules and snapping: `hairline`, `rule`, `grid-line` utilities fix `stroke-width: 1` with `shape-rendering: crispEdges`; `crisp(v) = Math.round(v) + 0.5`; 102 `strokeWidth` occurrences across 59 chart files. — [hairline.css:181-215](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css); [axes.ts:22](file:///Users/danielhowells/Sites/hairline/src/charts/axes.ts)
- Texture pitches are whole-pixel constants (`cross: 6, dense: 3, hatch: 4, screen: 4`) and diagonals are drawn as 1 px staircases so they stay crisp. — [texture-ids.ts:4-13](file:///Users/danielhowells/Sites/hairline/src/charts/texture-ids.ts); [README.md "Texture"](file:///Users/danielhowells/Sites/hairline/README.md)
- Other hard-coded px: tooltip insets, dot sizes, `t-halo` stroke 3 px, shadows 10 px, etc. (e.g. `SHADOW = 10` in rung-bars; stream-ribbon comments on 10 px edges). — [rung-bars.tsx](file:///Users/danielhowells/Sites/hairline/src/charts/basics/rung-bars.tsx); [hairline.css:164-169](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css)
- Datawrapper: making an export wider only enlarges the chart, not the text; the scale factor / `zoom` (PNG) and `scale` (PDF) enlarge everything evenly, including title and symbols; API `GET /v3/charts/{id}/export/{format}` has `width`, `height`, `zoom`, `scale`, `plain`, `borderWidth`. — [Datawrapper: resize visualizations](https://www.datawrapper.de/academy/how-to-change-the-size-of-your-visualizations); [Datawrapper export API](https://developer.datawrapper.de/reference/getchartsidexportformat)
- Highcharts: exported chart is first rendered at `exporting.sourceWidth/sourceHeight` with text sized to match; `exporting.scale` (default 2) then sets raster resolution; "if we used a scale of 1 and just set the sourceWidth to 1200 and sourceHeight to 800, all the text would become too small". Node export server restricts scale 0.1-5.0; PDF scale did not apply in offline exporting (#19762). — [Highcharts export module overview](https://www.highcharts.com/docs/export-module/export-module-overview); [node-export-server](https://github.com/highcharts/node-export-server); [highcharts#19762](https://github.com/highcharts/highcharts/issues/19762)
- Observable Plot: sizing is by `width`/`height` options with fixed default font sizes; no result on a text-scale option (not researched deeply).

### Inferences

- (c) Design, in order of recommendation:
  1. Wiredeck path (no library change beyond item 2): render the chart at a logical width and scale via `viewBox`. Slide 1920 wide, labels need ~28 px: logical width = 1920 / 2.5 = 768, giving 11 px x 2.5 = 27.5 px. Expose `<Hairline.Plot width={768} height={432} fit="contain">` which sets `viewBox="0 0 768 432"` and `width="100%"`; no per-chart edits because all geometry is already in logical px. Add `scale?: number` as sugar: `scale={2.5}` => logical width = container / 2.5, then CSS scale of the svg to the container.
  2. Stroke policy: add `strokes?: "scaled" | "hairline"`. `hairline` applies `vector-effect: non-scaling-stroke` to `.hairline,.rule,.grid-line` so rules stay 1 device px (what the brand is named for); `scaled` lets them grow 2.5x. Textures (patterns) are `patternUnits` in user space, so they scale with the viewBox: pitch 4 becomes 10 px, staircase pixels become 2.5 px blocks, losing the engraved fineness. Offer `texture: "scaled" | "device"` only if a device-pixel pattern approach is feasible (`patternUnits="userSpaceOnUse"` with `patternTransform="scale(1/k)"`), otherwise keep textures scaled and document it.
  3. Variables route (`--hl-text-label` etc.) only changes glyph size, not layout reservations. Add it for themers but wire `sansWidth` to read a `scale`/`fontSize` from context so room reservations stay correct. Do not offer as the primary slide path.
- Taste decision recommendation (opinion): default `strokes="hairline"` and `texture="scaled"` is wrong for a banknote-engraved identity, since a 2.5x hatch looks like a coarse woodcut; a better default for slides is "composition scales, hairlines stay 1 device px, texture pitch is re-derived at the target density". Because textures are the identity, Wiredeck's six chart set (bars use `Hatch`/`CrossHatch`, area uses `Stipple`) will show the difference immediately; decide by rendering the six at 2.5x both ways. Print/screen precedent: Datawrapper and Highcharts both scale everything together and treat resolution as a separate multiplier (pixel ratio), which is the "device pixel" analogue: render at logical size with `deviceScaleFactor: 2.5` in Puppeteer, and everything including 1 px hairlines is crisp at native resolution, with no `scale` API at all. That is the cheapest exact answer for PNG/PDF export, but not for the live web slide at 1920.
- (d) Effort: low for the viewBox/`scale` mode (one component), medium for stroke/texture policy, high if per-chart typographic scaling is attempted (54 files hand-tune sizes). Risk: medium-high; pixel-snapping (`crisp()` assumes integer logical px = device px) fails at non-integer scales (2.5x makes a snapped 0.5 offset land on a half-device pixel), so use integer scale factors (2x, 3x) where possible.

### Gaps

- No rendering of the six charts at 2x/2.5x was done; claims about visual quality are judgement.
- Did not verify how d3-axis-free tick density responds to a smaller logical width (could drop ticks).
- Did not research Observable Plot's font-size/`style` options or print-vs-screen typographic conventions beyond the Datawrapper/Highcharts precedent.

## 5. Theming: prefixed, scoped tokens, theme API, fonts

### Takeaway

Confirmed: tokens are unprefixed globals on `:root`/`[data-palette]`/`.surface-dark`, are also exported as Tailwind colours (`--color-paper: var(--paper)`), and a dark mode exists as parallel `--dk-*` variables. A scoped, prefixed token set derived from three inputs (paper, ink, hero) is feasible because the ramp is already a OKLCH-style interpolation, but the derivation currently exists only as hand-written hex values. The font is `var(--font-sans)`, defined only in the demo app's `app.css`, not shipped in `lib/`. Incumbent precedent: shadcn charts read `--chart-1..5` and inject per-chart `--color-<key>` variables.

### Cited Findings

- Tokens: `--paper`, `--ink`, `--text`, `--muted`, `--faint`, `--grid`, `--rule`, `--l0..--l6`, `--hero`, `--alert`, `--cat-1..4`, `--heat-1..5`, `--grain`, set on `:root, [data-palette="paper"]`, then `[data-palette="pink"]`, `[data-palette="dark"]`, `.surface-dark`. — [tokens.css:19-213](file:///Users/danielhowells/Sites/hairline/src/system/tokens.css)
- The ramp is stored as literal hex per palette (comment: "the ramp steps evenly between them in OKLCH"), not computed. Derived tones use `color-mix(in oklab, ...)` (`--alert-soft`, `--hero-soft`, `--panel`). — [tokens.css:21,204-213](file:///Users/danielhowells/Sites/hairline/src/system/tokens.css)
- Palette selection is `data-palette` on `<html>` and `.surface-dark` class; `.surface-dark` remaps from `--dk-*`. — [tokens.css:14-17,179-202](file:///Users/danielhowells/Sites/hairline/src/system/tokens.css)
- `@theme inline` exposes these as Tailwind colours (`--color-paper: var(--paper)` ...), so generated utilities hard-reference the unprefixed names. — [hairline.css:17-83](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css)
- The only prefix in use: none; grep for `--hl-` and `data-hl` in `src` returns nothing.
- Font: `font-family: var(--font-sans)` in the text roles; `--font-sans: "Inter", ui-sans-serif, ...` defined in `src/system/app.css` (demo site), not in tokens.css/hairline.css, so it is not in the published CSS. README: "The host's `--font-sans` sets the charts' face; label widths are measured for Inter, so another face may crowd." — [hairline.css:114](file:///Users/danielhowells/Sites/hairline/src/system/hairline.css); [app.css:11](file:///Users/danielhowells/Sites/hairline/src/system/app.css); [README.md:56](file:///Users/danielhowells/Sites/hairline/README.md)
- `grain` background on `.surface-dark`/`.surface-board` uses an inline SVG data-URI noise filter; each palette has its own tint. — [tokens.css:53,199-200,270](file:///Users/danielhowells/Sites/hairline/src/system/tokens.css)
- shadcn/ui charts (Recharts): theme variables `--chart-1..--chart-5` for light and dark in `globals.css`; `ChartContainer` reads a `chartConfig` and creates a per-chart CSS variable for each key (e.g. `--color-desktop`) scoped to the chart; each config entry has a `color` or a `theme: {light, dark}`; v3 uses `var(--chart-1)` directly and oklch values. — [shadcn chart docs](https://ui.shadcn.com/docs/components/chart)
- Tremor: not found in search results (only noted as shadcn-adjacent); not verified.

### Inferences

- (c) Design:
  ```ts
  // @howells/hairline/theme  (no React)
  interface ThemeInput { paper: string; ink: string; hero?: string; alert?: string; font?: string; mode?: "light" | "dark" }
  function deriveTheme(i: ThemeInput): Record<`--hl-${string}`, string>  // ramp l0-l6 via OKLCH (culori/colorjs), heat-1..5, grid/rule/muted/faint, hero-soft...
  function themeStyle(i: ThemeInput): CSSProperties      // for the wrapper
  // React
  <HairlineTheme theme={...}>{children}</HairlineTheme>    // sets vars on a wrapper div, data-hl-theme
  ```
  Prefix every token `--hl-paper`, `--hl-ink`, `--hl-l0..6`, `--hl-hero`, `--hl-grid`, `--hl-rule`, `--hl-font`, `--hl-text-label`; scope selectors under `.hl-root` instead of `:root`; keep unprefixed names as a deprecated alias layer (`--paper: var(--hl-paper)`) in a legacy CSS file so the demo app continues to work. Wiredeck mapping from the brief: ground -> `paper`, ink -> `ink`, clay accent -> `hero`, hairline colour -> `grid`/`rule` (those two can be derived from paper and ink by `color-mix` unless overridden). Derive in JS at SSR so the output is plain CSS custom properties on the wrapper, which works in headless Chromium without runtime colour maths.
- (c) Tailwind coupling: the compiled utility classes reference `--color-*` theme variables. Either keep the `@theme inline` mapping onto `--hl-*` names, or (better for non-Tailwind hosts like a deck viewer) ship precompiled `hairline.css` generated at build time so no host Tailwind scan is required. This also removes the `@source` fragility noted in the cross-cutting facts.
- (c) Font: define `--hl-font` default `ui-sans-serif, system-ui, "Inter"`; add `ThemeInput.font` and a `metrics?: "inter" | {avgEm:number}` width scale for `sansWidth` so a different face reserves correct room. Wiredeck's fonts may not be Inter, so the fixed-mode estimator (item 2) needs this.
- Highcharts/Plot style: both let the consumer own the palette; Hairline's differentiator is the derived ramp (one hero, lightness-as-data) with only three inputs, which no incumbent offers (shadcn gives 5 categorical colours; Hairline's ladder encodes importance). This is my characterisation from the sources, not a cited claim.
- (d) Effort: medium (rename ~3 CSS files and ~30 token usages, write `deriveTheme`, legacy alias layer, tests for contrast). Risk: medium; renaming touches every utility (`@theme inline`), and derived light/dark ramps must keep the "contrast rebuilt, not inverted" property (tokens.css:125).

### Gaps

- Did not research Tremor, Nivo `theme` or Highcharts/ECharts theme objects in detail.
- Did not verify OKLCH ramp parameters: the actual lightness curve used to produce `--l0..--l6` is not documented in the code; a `deriveTheme` would have to be fitted to the existing hex values.
- No contrast audit (WCAG) of `--faint` (#9f9e9a on #fbfbf9) was done.

## 6. Agent-usable data contract: schemas and a machine-readable registry

### Takeaway

Confirmed: `data` is optional with silent demo fallback, props differ per chart, formatters are functions (non-serialisable), `data` uses `Date` objects, prop types are not exported, and the "registry" (`GalleryEntry`) is a list of render closures with a catalogue code and name, not a data contract. No schema exists. Incumbent precedents show the pattern that works: a per-chart zod/JSON Schema tool definition (AntV MCP, AI SDK tools), validate-after-generation for large specs (Vega-Lite), and zod 4's native `z.toJSONSchema`. This is where Hairline can lead.

### Cited Findings

- Missing data falls back to demo data: `const data = props.data ?? hairlineLineDemo;` and `props.data ?? rungBarsDemo`. — [hairline-line.tsx:295](file:///Users/danielhowells/Sites/hairline/src/charts/basics/hairline-line.tsx); [rung-bars.tsx:159](file:///Users/danielhowells/Sites/hairline/src/charts/basics/rung-bars.tsx)
- Data shapes differ per chart: `RungDatum[]`, `DailyDatum[]` (with `date: Date`, used via `.toISOString()`/`getUTCDay()`), `PairDatum[]` (`previous`, `current`), `PlumbDatum[]`, `DumbbellDatum[]` (`before`, `after`, `label`); the board `Slope` takes `rows`, `format`, `height`, `labels`, `domain`, `label` all required. — [hairline-line.tsx:25-37,60](file:///Users/danielhowells/Sites/hairline/src/charts/basics/hairline-line.tsx); [paired-rungs.tsx:23-37](file:///Users/danielhowells/Sites/hairline/src/charts/basics/paired-rungs.tsx); [dumbbell-queue.tsx:17-31](file:///Users/danielhowells/Sites/hairline/src/charts/basics/dumbbell-queue.tsx); [slope.tsx:163-174](file:///Users/danielhowells/Sites/hairline/src/charts/board/slope.tsx)
- Function-valued props: `format?: (v:number)=>string`, `formatDate`, `formatX`, and README says a chart that takes a formatter must be wrapped in a client component since functions cannot cross the server-client boundary. — [README.md:55](file:///Users/danielhowells/Sites/hairline/README.md)
- Prop types not exported by name: "use `ComponentProps<typeof PairedRungs>`". — [README.md:57](file:///Users/danielhowells/Sites/hairline/README.md)
- Registry shape: `GalleryEntry { id, family, name, span?, dark?, render: () => ReactNode }`, with a `ALL_ENTRIES` list; `Family` is an implementation grouping ("lupi","basics","glance"...), not an analytical job. — [gallery/types.ts](file:///Users/danielhowells/Sites/hairline/src/gallery/types.ts); [gallery/registry.ts:18-33](file:///Users/danielhowells/Sites/hairline/src/gallery/registry.ts)
- Required accessible label: `ChartSvg` takes `label: string` (required); this is the only text summary a chart carries. — [svg.tsx:3-13](file:///Users/danielhowells/Sites/hairline/src/charts/svg.tsx)
- Zod 4: `z.toJSONSchema()` native conversion; supports targets `draft-07`, `draft-2020-12` (default), `draft-04`, `openapi-3.0`; `.describe()`/`.meta()` metadata flows into output (title, examples); `reused:"ref"`, `override` callback, throws on unrepresentable types (e.g. `bigint`); `z.fromJSONSchema()` reverse exists. Third-party `zod-to-json-schema` is no longer needed. — [Zod JSON Schema docs](https://zod.dev/json-schema); [Zod v4 release notes](https://zod.dev/v4?id=json-schema-conversion)
- Vercel AI SDK: tools use `inputSchema` (renamed from `parameters` in AI SDK 5) taking a Zod or JSON schema that the LLM consumes and that validates tool calls; AI SDK 6 adds per-tool `strict: true`; generative UI renders components from typed tool parts; Vercel's `json-render` lets developers define a catalog of permitted components with Zod schemas and has an LLM emit a constrained JSON spec. — [AI SDK generative UI](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces); [AI SDK 6](https://vercel.com/blog/ai-sdk-6); [json-render summary](https://daily.dev/posts/vercel-releases-json-render-a-generative-ui-framework-for-ai-driven-interface-composition-msfa6nj8a)
- AntV `mcp-server-chart`: 25+ chart tools (e.g. `generate_bar_chart`, `generate_column_chart`), validates arguments with zod, returns an image URL rendered by default through a remote `VIS_REQUEST_SERVER`; `DISABLED_TOOLS` env var disables tools. The exact bar-chart schema was not confirmed. — [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart)
- Vega-Lite ships an official JSON Schema (versioned URLs like `https://vega.github.io/schema/vega-lite/v6.json`); an early copy was 6284 lines/238 KB (draft-04), large for LLM structured-output; common pattern is LLM free-form JSON then schema validation and code-side fixes; VegaChat (arXiv, Jan 2026) lists grammar-constrained generation as future work. — [VegaChat arXiv 2601.15385](https://arxiv.org/html/2601.15385v1); [Altair internals](https://altair-viz.github.io/user_guide/internals.html)
- FT Visual Vocabulary: nine categories (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow); some copies list eight, omitting flow; the official PDF is in `Financial-Times/chart-doctor`. — [FT chart-doctor visual vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/Visual-vocabulary.pdf); [Tableau blog](https://www.tableau.com/blog/what-i-learned-recreating-financial-times-visual-vocabulary-tableau-94516)
- Highcharts accessibility docs show it also exposes per-series/point description hooks; Plot has `ariaLabel`/`ariaDescription` at plot, scale, and mark level (relevant to schema field design). — [Highcharts accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module); [Plot accessibility](https://observablehq.com/plot/features/accessibility)

### Inferences

- (c) Design: one schema file per chart, authored in zod 4, exported as both zod and JSON Schema:
  ```ts
  // @howells/hairline/schema/rung-bars
  export const RungBarsSpec = z
    .object({
      data: z
        .array(
          z.object({
            label: z.string().max(24),
            value: z.number().nonnegative(),
          })
        )
        .min(2)
        .max(12),
      unit: z.number().positive().optional().describe("Units per rung"),
      highlight: z.number().int().optional(),
      valueFormat: ValueFormat.optional(), // data, not a function
      note: z.string().max(80).optional(),
    })
    .strict();
  // formatters as data: { style: "number"|"percent"|"currency", decimals, prefix, suffix, compact }
  // dates as ISO strings: z.iso.date(); renderer parses to Date
  ```
  Key moves: (1) replace function props with serialisable `ValueFormat` descriptors resolved to functions inside a thin `<HairlineChart spec>` adapter; (2) dates as ISO strings; (3) `.strict()` and no demo fallback in the adapter (throw/return a typed error listing issues, which an MCP tool can hand back to the agent); (4) `demo` data moves behind an explicit `demo` prop or an `examples` field in the schema (examples become `.meta({examples})`).
- (c) Registry (generated from the schemas, JSON, no React):
  ```ts
  interface ChartEntry {
    id: "rung-bars"; name: string;
    job: "magnitude" | "change-over-time" | "composition" | "distribution" | "relation" | "ranking" | "deviation" | ...;  // FT categories
    summary: string; whenToUse: string[]; whenNotToUse: string[];
    data: { shape: string; minRows: number; maxRows: number; maxSeries: number; example: unknown };
    schema: JSONSchema; hero: string; sizes: { minWidth: number; aspect: number };
    a11y: { summaryTemplate: string };
  }
  ```
  Then one discriminated union `ChartSlide = z.discriminatedUnion("kind", [...])` for Wiredeck's `kind` + `data`, `z.toJSONSchema(ChartSlide)` for the MCP tool `inputSchema`, and a `chooseChart(job, shape)` helper. FT Visual Vocabulary supplies the `job` taxonomy; note Hairline's current `Family` (lupi, glance, big...) is not usable for this. Series and row limits come from the layout code (label rooms, dot sizes); derive them by test: fuzz each chart at max rows and assert no clipping.
- (c) Avoid giant schemas: Vega-Lite's size is its weakness for LLM use; Hairline's per-chart schemas (a dozen fields) are small enough for strict structured outputs (AI SDK `strict: true`, OpenAI-style strict JSON schema with no unsupported keywords; this last point is my assumption, validate against the target model provider's supported subset).
- (c) Return a validated text summary in the same call (feeds item 8).
- Wiredeck's six `kind`s then become: `bars` -> `rung-bars`, `line` -> `hairline-line`, `area` -> `hairline-area`, `scatter` -> `plumb-scatter`, `slope` -> needs an exported slope (see cross-cutting note: board `Slope` is not in `index.ts`), `dumbbell` -> `dumbbell-queue`.
- (d) Effort: medium-high for the first six (about 1 day per chart for schema, adapter, formatter descriptor, golden fixture; the formatter-descriptor and date handling are done once), then roughly half a day per added chart; the registry generator is small. Risk: medium; schemas freeze prop shapes (semver contract), and agent-written data will expose layout failures at the limits. Low risk of technical blockers since zod 4 is stable.

### Gaps

- Did not read the AntV tool schemas (only confirmed zod use); LIDA and Data Formulator were not researched at all.
- Did not verify that Wiredeck's MCP tooling accepts JSON Schema 2020-12; AI SDK and MCP SDK accept zod/JSON Schema, but target provider subset limits were not checked.
- AG Charts' options typing and Vega-Lite's current schema size were not measured.

## 7. Frame belongs to the host: name, source, footnote, (i) note

### Takeaway

Largely already true for the basics charts: they render only `<Plot>` with no name, source or (i); the frame lives in the gallery grid. The one in-plot piece of furniture is an optional `note` string drawn inside the SVG (`FootNote`/`PlotNote`), which is hidden if it does not fit. Board charts (including `Slope`) use `<Chart>`, which renders a `<figure>` with `PANEL` styling and `top`/`bottom` slots, so they carry a frame. The remaining work is consistency and a slot API.

### Cited Findings

- README: "Render only the plot, inside `<Plot>`; the grid supplies the frame and the name." and "Frame. Every cell carries a short ink bar and the chart's name above the chart. Nothing else: no prose inside charts." — [README.md "Adding a chart" and "The system"](file:///Users/danielhowells/Sites/hairline/README.md)
- `Plot` doc comment: "No chrome; titles and sources belong to <Card>." It accepts `overlay` (for tooltips) and `className`/`style`. — [core.tsx:43-62](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx)
- `Chart` (used by 10 files) renders `<figure class="m-0 ${PANEL} ...">` with `top` and `bottom` ReactNode slots. — [core.tsx:9-34](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx); [roles.ts:9](file:///Users/danielhowells/Sites/hairline/src/charts/roles.ts)
- Per-chart `note?: string` renders a footnote in the SVG; `noteLines` hides it entirely if any " · " segment is wider than the plot: "a clipped footnote is worse than none". — [plot-note.tsx](file:///Users/danielhowells/Sites/hairline/src/charts/plot-note.tsx); [util.ts:143-160](file:///Users/danielhowells/Sites/hairline/src/charts/util.ts)
- Tooltips are HTML overlays positioned against the Plot (`Tooltip` uses `offsetParent`). — [core.tsx:75-102](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx)
- Memory note from the owner: "No prose in charts: grid shows only charts and their names; never add titles or explanatory text" (project memory), so any frame slot must stay a host concern, not a chart concern.
- Incumbents: Plot has `title`/`subtitle`/`caption` options at plot level (figure wrapper); Datawrapper's export has `plain=true` to export only the chart without header and footer (so the frame is a separable layer). — [Datawrapper export API](https://developer.datawrapper.de/reference/getchartsidexportformat). (Plot's `caption` option: duck-tested in 0.6.6 per [Plot changelog](https://github.com/tannerlinsley/observable-plot/blob/main/CHANGELOG.md); full title/subtitle API not fetched.)

### Inferences

- (c) Design: formalise two layers. `<Hairline.Chart kind spec>` returns a bare `<figure>`-less plot (current `Plot`) by default, with an optional wrapper `<Hairline.Frame name source note info>` composed by the host. Slots as props only where an HTML slot is needed: `overlay`, `tooltip`. Do not add `title`/`source` props to charts; make `note` a host-side concern too, or keep the in-SVG footnote but rename to `unitNote` (it is a unit key such as "one dot = one day", not a source line). Fix `Slope`/board charts to separate the `<figure>` frame (`Chart`) from the plot so they match the basics contract.
- (d) Effort: low (docs and a small `Frame`; migrating board charts to a bare plot is medium and only needed for `Slope`). Risk: low, with the caveat that the "no prose" rule is a stated owner preference; slots must not tempt in titles.

### Gaps

- Did not check whether other board charts embed titles/legends outside the SVG.
- Plot's title/subtitle/caption API and Highcharts title/credits options were not fetched in detail.

## 8. Accessibility: accessible summary and table view

### Takeaway

Partial. Every chart svg gets a required `aria-label` and a `<title>`, and some charts are keyboard-scrubbable (`useScrub` binds `tabIndex: 0`, arrow/Home/End keys). There is no `role="img"`, no longer description, no data-table view, and `sr-only` is used in only two places. Incumbents: Highcharts has the richest module (screen-reader section, data table, point descriptions, sonification); Recharts v3 turns on keyboard-only `accessibilityLayer` by default but screen reader support is thin; Plot has `ariaLabel`/`ariaDescription`.

### Cited Findings

- `ChartSvg`: `aria-label={label}` plus `<title>{title ?? label}</title>`; `label` is a required prop that is "read out by screen readers". No `role`. — [svg.tsx:3-13,26-37](file:///Users/danielhowells/Sites/hairline/src/charts/svg.tsx)
- Keyboard: `useScrub().bind` returns `tabIndex: 0` and handles `ArrowLeft/ArrowRight/Home/End` only for time-scrub charts. — [hooks.ts:105-162](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- `sr-only` appears only at `forms/brush-strip.tsx:215` and `glance/scatter-morph.tsx:446` (a legend); one `aria-live="polite"` group and one `aria-valuetext`; no `<table>`. (grep of `src/charts` for `role=`, `aria-`, `<table`, `sr-only`, `tabIndex`.) — [brush-strip.tsx:215](file:///Users/danielhowells/Sites/hairline/src/charts/forms/brush-strip.tsx); [scatter-morph.tsx:446](file:///Users/danielhowells/Sites/hairline/src/charts/glance/scatter-morph.tsx)
- Tooltips are mouse-hover driven (`HitRect`, `useHover`); the hovered facts are not available to AT except via scrub charts.
- Recharts: `accessibilityLayer` default `false` in 2.x, `true` in 3.0+; adds aria labels, roles and arrow-key navigation; screen readers need forms mode/QuickNav off for keydown; reviews of shadcn charts (built on Recharts) found screen reader support lacking, and recent issues recommend `role="img"` + aria-label, a hidden summary (first/last/min/max) and a hidden data table. — [Recharts a11y wiki](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility); [Recharts 3.0 migration](https://github.com/recharts/recharts/wiki/3.0-migration-guide/1527f6a84d65aef644c63ba909f3327e73c2161c); [Ashlee Boyer's review](https://ashleemboyer.com/blog/a-quick-ish-accessibility-review-shadcn-ui-charts/)
- Highcharts: accessibility module (keyboard navigation, screen-reader descriptions, data table view, sonification); `accessibility.description` is visually hidden; point/series descriptions and formatter hooks; for many points, individual points are not exposed by default. — [Highcharts accessibility module](https://www.highcharts.com/docs/accessibility/accessibility-module); [Highcharts configure](https://www.highcharts.com/docs/accessibility/configure-the-accessibility-module)
- Observable Plot: `ariaLabel`, `ariaDescription` on plot, scale and marks; `ariaHidden` on marks; marks auto-generate `aria-label` on `<g>`. — [Plot accessibility](https://observablehq.com/plot/features/accessibility)

### Inferences

- (c) Design: generate a text summary and a table from the same validated spec (item 6), not from the SVG:
  ```ts
  interface A11yProps {
    summary?: string | "auto";
    table?: "off" | "sr-only" | "toggle";
  }
  // Renders: <svg role="img" aria-labelledby=title aria-describedby=desc> ... </svg>
  //          <table class="sr-only"> caption=name, rows from spec </table>   // identical data in DOM, available in SSR/PDF
  ```
  The registry (item 6) carries `summaryTemplate` per chart, e.g. "Bar chart, 6 categories. Highest: {max.label} {max.value}. Lowest: ..."; `"auto"` fills it from data using the formatter descriptor. In fixed/SSR mode the table is in the first HTML, so tagged PDF export (Chromium `page.pdf({tagged:true})`) gets real structure. A `toggle` mode adds the visible table view for sighted keyboard users, mirroring Highcharts' data table. Keep tooltip content reachable by keyboard for non-scrub charts (focusable marks or a roving-tabindex list).
- (d) Effort: medium (a shared `ChartA11y` component plus per-chart summary templates, about 30 min each once schema exists). Risk: low-medium; correctness of auto-summaries (units, rounding) depends on the format descriptors.

### Gaps

- Did not audit contrast or focus indicator sizes (`[&_svg:focus-visible]:outline-1` in Plot class) against WCAG.
- Did not check whether Chromium's tagged PDF output carries the SVG `<title>`/table structure in practice.

## 9. Multiple charts per page: unique pattern/texture ids, including server output

### Takeaway

Largely satisfied already. `useSvgId` builds ids from React `useId()` with non-word characters stripped, `useTextureIds` derives all pattern ids from one base, and at least 25 chart files use it, so ids are unique across instances in one React tree and equal on server and client. Remaining risks: charts that hard-code ids if any, separate React roots (island-style deck viewers) producing colliding ids, and the stripping format assumption across React versions.

### Cited Findings

- `useSvgId = (prefix) => \`${prefix}-${useId().replaceAll(/[^\w-]/gu, "")}\``. — [hooks.ts:95-97](file:///Users/danielhowells/Sites/hairline/src/charts/hooks.ts)
- `useTextureIds(prefix)` returns `(name) => \`${base}-${name}\``from a single`useSvgId`; `paint(id)`yields`url(#id)`. Used by roughly 25 chart files (grep: stacked-rungs, rung-waterfall, choropleth, paired-rungs, rung-bars, candlestick, area, tick-box, etc.). — [texture-ids.ts:22-32](file:///Users/danielhowells/Sites/hairline/src/charts/texture-ids.ts)
- `SplitClips` takes an `id` prop from the caller and defines `${id}-past|future|sweep` clip paths, so uniqueness depends on callers passing `useSvgId`. Stream ribbon calls `useSvgId("stream")`. — [core.tsx:111-146](file:///Users/danielhowells/Sites/hairline/src/charts/core.tsx); [stream-ribbon.tsx:481](file:///Users/danielhowells/Sites/hairline/src/charts/basics/stream-ribbon.tsx)
- A grep for literal `id="` in `src/charts` (excluding hooks/texture-ids) found no hard-coded ids in the lines printed (output was dominated by `useTextureIds` calls); a full audit of every `<pattern id=`/`<clipPath id=` was not completed.
- React `useId` is derived from tree position so server and client match; module counters and `Math.random()` cause hydration mismatches; React 18 ids look like `:r1:`; React 19.2 changed the default prefix (a commenter reports hydration errors; the exact new format was not shown in the results). Real-world fixed-id bug: duplicate gradient ids made `url(#id)` resolve into a hidden instance and render nothing. — [useId guide](https://react.wiki/hooks/use-id/); [Radix #3700](https://github.com/radix-ui/primitives/issues/3700); [decentraland/ui2 PR #487](https://github.com/decentraland/ui2/pull/487); [techpotions SVG gradient trap](https://techpotions.com/lab/next-js-hydration-mismatch-svg-gradient-trap)
- Expo Router case: `useId` differs between server render (app and html in one tree) and browser (hydrating `#root` only). — [reelist#3](https://github.com/raajnadar/reelist/issues/3)

### Inferences

- (c) Design: keep `useSvgId`; (1) add a CI test that SSRs two instances of every chart (once item 2 lands) and asserts all `id` attributes are unique and every `url(#...)` resolves; (2) run it against React 19.0-19.3 given the 19.2 prefix change (the stripping regex keeps `_` and `-`, so the new format is probably fine, unverified); (3) for multi-root pages (a deck viewer that hydrates each slide as its own root, or `renderToString` per slide into one HTML page), expose `idPrefix` on the provider (`<HairlineProvider idPrefix={slideId}>`) and recommend `identifierPrefix` on `createRoot`/`hydrateRoot`, since each root restarts the counter; (4) audit `SplitClips` callers.
- (d) Effort: low (test plus prefix). Risk: low. Wiredeck's "all slides on one page" in a single React tree is already safe; separate-roots is the only failure path.

### Gaps

- Did not complete a literal-id audit of all ~71 charts; did not run a two-instance SSR uniqueness check (blocked by item 2: server output is empty today, so the check is vacuous).
- Did not verify the exact `useId` format in React 19.3 (the repo's react version) by running it.

## Claim test: do 2, 3, 5 and 6 let Hairline beat incumbents?

### Takeaway

Wiredeck's premise that "most chart libs are poor at SSR, screenshot-ready output and agent-readable schemas" holds only partially. SSR/static output is available in nearly every major library (ECharts, Vega, Plot, AG Charts Enterprise, Recharts with a size, Nivo/visx with sizes), and Hairline is currently worse than all of them (empty server HTML). The defensible advantages are: (6) typed per-chart schemas plus a registry with chart-choice guidance, which no incumbent ships as a first-class library artifact, (3) a first-class, SSR-true ready signal and an `animate` mode, which incumbents handle ad hoc, and (5) a three-input derived theme, which is a design differentiator rather than a technical gap.

### Cited Findings

- SSR/static exists elsewhere: ECharts (string SVG SSR, 5.3+), Vega (`renderer:'none'`, `toSVG`), Plot (jsdom `document` option), AG Charts (server-side package, Enterprise licence), Recharts (`initialDimension`), visx (`initialSize`), Nivo (non-responsive `Bar`). — sources in item 2.
- Static output has caveats that are real gaps: Nivo bar first-render animated-state bug (#2127), Plot SSR practical only for small plots, ECharts SSR SVG-only and rasterisation separate, AG SSR paid. — [nivo#2127](https://github.com/plouc/nivo/issues/2127); [Plot getting started](https://github.com/observablehq/plot/blob/main/docs/getting-started.md); [ECharts SSR](https://echarts.apache.org/handbook/en/how-to/cross-platform/server/); [AG Charts SSR](https://www.ag-grid.com/charts/javascript/server-side-rendering/)
- Readiness is ad hoc: Chart.js `onComplete` (re-fires, #8897), ECharts `finished` (not fired in some animation-off cases, #14101/#17500), Highcharts `load`/`render` events, and exporter-side flags (`window.__renderDone`, `data-screenshot-ready`). No source found documents a declarative DOM readiness contract in a chart library. — sources in item 3.
- Agent/schema: AntV `mcp-server-chart` uses zod for tool arguments but renders remotely to an image URL by default; Vega-Lite has an official JSON Schema but it is very large and the field's pattern is generate then validate; AI SDK and `json-render` use zod schemas as the component/tool contract. No source found of a chart _rendering_ library that ships per-chart schemas plus a "when to choose" registry. — [antvis/mcp-server-chart](https://github.com/antvis/mcp-server-chart); [VegaChat](https://arxiv.org/html/2601.15385v1); [AI SDK tools](https://ai-sdk.dev/docs/foundations/tools); [json-render summary](https://daily.dev/posts/vercel-releases-json-render-a-generative-ui-framework-for-ai-driven-interface-composition-msfa6nj8a)

### Inferences

- Verdict by item: 2 (SSR): claim false as a market statement; Hairline must catch up, then can differentiate by producing real hydratable React DOM (ECharts SSR and Vega output strings, not React trees; Recharts/visx do produce React DOM). 3 (ready/animation): claim mostly true; best opportunity for a clean, documented contract. 5 (theming): not a competitive gap, but a distinctive 3-input derived palette is on-brand. 6 (agent schemas + registry): claim holds on the evidence found, and is Hairline's strongest differentiator; Hairline's small bespoke charts make small strict schemas feasible, unlike Vega-Lite.
- Absence of evidence caveat: "no incumbent ships X" is based on the searches run here (about 25 queries, mostly search-snippet level), not an exhaustive survey; Tremor, LIDA and Data Formulator were not examined.
- Sequencing for Wiredeck's test plan (six charts, dark and light, PDF): items 2, 3 (`off` + ready), 5 (scoped theme, no Tailwind scan), and 6 (kind+data schema and an exported slope) are the minimum; 1 (publish) unblocks Vercel; 4 can be met by `deviceScaleFactor` or the viewBox path; 7-9 are mostly docs/tests.

### Gaps

- Tremor, LIDA, Data Formulator, Nivo's `theme`, ECharts theme objects, and the visx/Nivo per-package publishing details were not researched or were only touched at snippet level.
- No browser-run verification of exported PDFs from Hairline; findings about blank exports follow from the IntersectionObserver and CSS code, not an actual Chromium run.
