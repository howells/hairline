# Hairline codebase audit (read-only, 2026-11-01)

Saved by the coordinator from the auditing agent's returned text (the agent could not write files). Paths relative to /Users/danielhowells/Sites/charts. Code-reading conclusions; edge cases not executed. `tsc -b` passes; `npm pack --dry-run` run.

## 1. Inventory: general-purpose vs bespoke

Takeaway: ~90 charts but only 71 exported; ~20 bespoke at the copy level; basic type coverage good, but exported line charts are single-series only.

- Gallery has 92 entries; README says "Ninety" (README.md:3); src/gallery/about.json has 90; src/index.ts exports 71.
- The 19 board charts (D1–D19, src/charts/board/presets.tsx:124) built from TimeLines, Sankey, Scatter, Heatmap, StackedArea, Slope, Dumbbell etc. are not exported from index.ts or kit.ts.
- ~42k lines TS/TSX; 8 family folders (basics, big, board, forms, glance, lupi, maps, originals); 109 chart-level .tsx files.
- Exported types: line/area (HairlineLine, HairlineArea), bars (RungBars, ChunkyBars, TickRows, DivergingBar, PictorialBar, BarRace), stacked (StackedRungs, HatchedStack, StreamRibbon), scatter/bubble (PlumbScatter, BubbleAlmanac), histogram (RungHistogram), donut (TickDonut, BigSlice), heatmaps (DotHeat, MatrixHeat, CalendarHeat), maps (USChoropleth, WorldChoropleth), Candlestick, AggregateSankey, plus waterfall, gauge, box plot, treemap, circle pack, chord, violin, ridgeline, parallel coordinates, force graph, tree, dumbbell, slope.
- Missing/weak: no exported multi-series line (HairlineLine takes one DailyDatum[], basics/hairline-line.tsx:23-34; TimeLines is board-only); no radar, bullet, funnel; no categorical/step line.
- 62 components have optional `data?`; 74 files fall back to demo (`props.data ?? xDemo`, e.g. hairline-line.tsx:~290, rung-bars.tsx:~190). Fixed datum shape per chart (DailyDatum, RungDatum, CandleDatum).
- Hardcoded subject copy in aria labels: maps/us-choropleth.tsx:62 ("Christmas trees cut in 2022 by state"; also BREAKS, LABELLED=["OR","NC","MI"], lines 29-38); forms/chord-ring.tsx:307; originals/feature-rank.tsx:214 (+ hardcoded QUARTERS); originals/response-time.tsx:220; forms/circle-pack.tsx:128; forms/area-difference.tsx:195 (+ hardcoded "Actual"/"Plan" end labels); forms/radial-year.tsx:212; originals/daily-users.tsx:238; forms/brushed-overview.tsx:155; big/circular-graph.tsx:445; big/force-galaxy.tsx:436. reference/subjects.md:13 says the "only data and names change" promise holds for ~60 cells.
- Component names are legacy demo names (DailyUsers, RevenueByPlan, ResponseTime, FeatureRank) that now draw temperature, vote share, crops.
- README.md:71,:100 and docs/DATA.md still describe the fictional Fieldnote company; code moved to real public data (commit cca5907). Stale.
- Hardcoded layout: 57 files with literal height defaults (e.g. `props.height ?? 460` in rung-bars.tsx); caps like `data.length * 120` (rung-bars.tsx:~205), `Math.min(width - 16, 680)` (hairline-line.tsx:~203); Sankey constants (board/sankey.tsx:~85-100); choropleth aspect ratios fixed (0.7, 0.46). Inference: exported surface is a demo catalogue with props bolted on; a usable core of ~25–30 charts could ship. Board family is the most reusable and is the unexported part.

## 2. API consistency

Takeaway: de facto contract (data?, height?, format?, note?, highlight?) by convention, not types; no prop types exported.

- 190 non-exported `interface …Props` vs 1 exported; README.md:57 tells users to use ComponentProps<typeof X>. Datum types not re-exported from index.ts.
- format? ~112 places; highlight?/hero? ~110 (index, or postal code on maps, us-choropleth.tsx:17); note? 67; height? ~57. `highlight` is positional (index into data) — breaks when consumer sorts/filters. React keys from datum.label (rung-bars.tsx:240).
- Divergences: emphasis?: "peak"|"trough" only on HairlineLine; `unit` means units-per-rung in RungBars but a noun in Violin/USChoropleth; format/formatX/formatDate/formatPrice; title on BrandSpectrum (brand-spectrum.tsx:38) vs label/ariaLabel elsewhere.
- No width prop (always useMeasure, hooks.ts:33). No animation prop (OS preference only). No generics/accessors. No onSelect/onHover; hover internal (useHover, hooks.ts:~170).

## 3. Theming and styling

Takeaway: Tailwind v4 required by design; palette via CSS vars; dark mode works; effectively Inter-only.

- README.md:29 "host needs React 19 and Tailwind v4". lib/theme.css = hairline.css with `@source "./charts"` (scripts/library-css.ts:12-13); uses @theme inline, @utility, --theme() (src/system/hairline.css:~11-145, 26 directives). Markup full of Tailwind utilities/arbitrary variants (core.tsx:49; fill-hero, stroke-l3, grow-y, pop). Without Tailwind compiling lib/**, no fills or text roles.
- tokens.css (300 lines): 3 modes via [data-palette="paper|pink|dark"] + .surface-dark; vars --paper, --ink, --l0…--l6, --hero, --alert (unprefixed). Board charts need undocumented --s1…, --line1…, --area1… only inside .surface-board (hairline.css:~58-85). Pink is default; consumer imports all three palettes.
- Text roles fixed to var(--font-sans) at 11px and 30px (hairline.css:114-141). Label fit uses Inter glyph-bucket estimates (src/charts/util.ts:107-135 sansWidth); glance/util-a.ts:17-27 measures via probe SVG only when fonts loaded. README.md:56 concedes other faces may crowd. No font shipped; Inter loaded from Google Fonts only for the demo (index.html:77).
- Lint rule howells/no-raw-type-utilities locks type internally; no consumer size override. No prefers-color-scheme handling. Grain applied by demo site only (pages/gallery.tsx:~13).

## 4. Rendering, SSR, motion, performance, bundle

Takeaway: charts render nothing on the server; tree-shakeable in principle but ships atlases under lib/node_modules/.pnpm and demo data by default.

- Plot/Chart render children only when width > 0 (core.tsx:30, :58); width from useLayoutEffect + ResizeObserver (hooks.ts:33-48). No static fallback, no SSR width/aspect. Layout shift likely.
- "use client" banner on every module (vite.lib.config.ts:25). Formatter props can't cross RSC boundary (README.md:55). Reduced motion defaults true until hydration (hooks.ts:93). Commit 4ea9f80 latest SSR work.
- Motion: CSS gated by prefers-reduced-motion (hairline.css:280-374). Shared rAF clock in playback.ts:~44-70 (64ms step cap), paused off-screen via IntersectionObserver (~19-48). useReveal (hooks.ts:52, threshold 0.2) fires once; no re-animation on data change.
- Perf: Rungs (basics/rungs.tsx:~35) emits one <rect> per unit with inline stagger style — unit=1, value 100,000 ⇒ 100k rects; rungPitch clamps pitch not count. Only 6 files declare <pattern> but each chart instantiates several; DotScreen draws 9 circles per tile when spilling (texture.tsx:~160). Gallery lazily mounts near viewport (pages/gallery.tsx:~20-45, commit 98ec8f6); library has no virtualization/canvas path. d3-force on main thread.
- Bundle: rolldown preserveModules (vite.lib.config.ts:22-29), sideEffects ["_.css"] (package.json:16). Externals react, react-dom, d3-_, topojson-client. lib/ 4.4 MB incl. bundled atlases at lib/node_modules/.pnpm/us-atlas@3.0.1/…/states-10m.json.js (170 KB) and world-atlas countries-110m (146 KB); us-atlas/world-atlas still listed as dependencies (package.json:30-31). npm pack: 575 files, 972 KB tarball, 3.19 MB unpacked, 191 .map files. Atlases imported by data modules (lib/charts/maps/us-choropleth.data.js:3). Demo data shipped with components (e.g. lupi/ridgeline.data.js 14 KB; lupi .js 164 KB); `data ?? demo` pulls demo into every consumer build.
- lib/ is git-ignored; nothing in CI guarantees it matches source. build:lib runs howells-oxfmt from private @howells/lint. Inference: removing demo defaults (or moving to a /demo subpath) fixes both bloat and bespoke coupling.

## 5. Accessibility

Takeaway: good baseline label/title on every chart; thin beyond.

- ChartSvg (src/charts/svg.tsx) sets aria-label + <title>; labels are generated summaries (hairline-line.tsx:226) — English template strings, not localisable.
- No role on <svg> (only board/slope.tsx:234, palette/type-sheet.tsx:158); a lint rule forbids role="img" (per docs/BRIEF.md). No <desc>, aria-describedby or <table> fallback.
- Keyboard: only useScrub (hooks.ts:105-160, Arrow/Home/End) and forms/brush-strip.tsx:228. Most bar/scatter/map charts have no focusable elements; tooltips mouse/touch only. Focus-visible outline on Plot svg (core.tsx:49). Tooltip renders <output> (core.tsx:~85), pointer-events-none, hover only.
- Strength: texture encodes value as well as tone (greyscale/CVD-friendly). Contrast of 11px muted t-axis text unmeasured.

## 6. Quality infrastructure

Takeaway: single-author prototype — no tests, CI, license, changelog, contributing doc.

- No test/spec/vitest/playwright/storybook config; verification is manual ("pixel-identical at 390 and 1440", scripts/shot.sh).
- No .github/. No LICENSE, no license field, private: true (package.json:4). Provenance: README says first versions were rebuilt from screenshots of the PolyForm-Noncommercial lieflat-charts project; docs/BRIEF.md has a clean-room rule. Clean-room claim must be recorded and defensible before a public licence.
- No CHANGELOG, no tags, v0.1.0, 40 commits Oct 14–31 2026.
- Strict lint via @howells/lint 3.5.3 (possibly private ⇒ outside contributors can't run it). typescript ^7.0.2, vite ^8.3.4, pnpm@9.0.0.

## 7. Docs

Takeaway: gallery with a notes popover per chart is the only documentation.

- Routes: #/ grid, #/chart/<ID>, #/kit, #/sources. (i) popover per chart (pages/chart-note.tsx, gallery/about.json). No props, code snippets or examples. JSDoc only on exports/props. README has one usage example (PairedRungs).
- "No prose in charts" rule on the grid conflicts with per-chart docs on the same pages ⇒ docs need their own route.
- docs/BRIEF.md (23 KB agent build brief), docs/REFINE.md (19 KB design rules), docs/DATA.md obsolete, reference/subjects.md (42 KB plan). None user-facing.

## 8. Edge-case robustness

Takeaway: empty/one-datum mostly unguarded — ~116 Math.min/max spreads or data[0] vs 6 length checks.

- HairlineLine with [] throws (hairline-line.tsx:195-196, :209, :226). RungBars [] ⇒ -Infinity, zero-height. Candlestick partly defended (candlestick.tsx:236). Only empty checks: plot-note.tsx:25, dot-heat.tsx:300. No empty/loading states, no null/NaN handling.
- Negatives: StaggerWave handles; RungBars `Array.from({length: n})` with negative n throws RangeError.
- Many categories: RungBars bands shrink past ~10; no thinning; key={datum.label} duplicates on repeated labels (same bug class fixed in ab7d0f9).
- Long labels: sansWidth estimator (util.ts:125); noteLines hides footnote if a segment won't fit (util.ts:~145). Label fit tuned on demo labels.

## Summary of blockers (ranked)

1. Legal/packaging: no licence, private: true, clean-room provenance undocumented, atlases under lib/node_modules/.pnpm.
2. API: 0 of 190 prop types exported; demo data default; hardcoded copy in ~20 charts; 19 board charts unexported (incl. Slope, TimeLines).
3. Docs: README and DATA.md stale; no per-chart reference.
4. Quality: no tests, no CI, no degenerate-input handling.
5. Adoption: Tailwind v4 mandatory; SSR renders nothing until client measures.
6. Accessibility: no roles, no table fallback, almost no keyboard access.
