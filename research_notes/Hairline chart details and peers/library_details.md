# Finish and interaction details in chart libraries (gap-fill for Hairline)

Scope note: about 20 tool calls. Read directly from source or docs: NumberFlow (`lite.ts`, docs page), visx (`xychart/Tooltip.tsx`, `TooltipWithBounds.tsx`), shadcn/ui `chart.tsx`, Tremor `LineChart.tsx` (v1.0.0 as served from main), ECharts `axisPointer/globalListener.ts`. From search summaries only (not opened): ECharts universalTransition, emphasis/blur, labelLayout, Unovis Crosshair, Nivo motion, AG Charts, visx annotation. NOT reached, no claims made: Victory, Plotly, Unovis Crosshair defaults, Nivo preset numbers (verified), ECharts tooltip `confine`/`axisPointer.snap` defaults, AG Charts tooltip/crosshair defaults. Several guessed raw GitHub paths returned 404 (Nivo core motion, Unovis crosshair config, ECharts doc partials), so those were not read. Today is 2026-11-03; Unovis PRs cited below are dated Sep/Oct 2026 per the search summary.

## What does NumberFlow do exactly for digit-roll animation (timings, easing, reduced motion)?

### Takeaway

Defaults are a 900 ms spring-shaped `linear()` curve for movement and digit spin, a 450 ms `ease-out` fade for characters entering or leaving, and `respectMotionPreference: true`, which turns animation off entirely under `prefers-reduced-motion`. Animations are composited with `accumulate`, so interrupted updates add smoothly rather than restart.

### Cited Findings

- `transformTiming` default: `duration: 900`, easing a `linear()` list of 90 stops rising 0 to 1 with no overshoot (starts `linear(0,.005,.019,.039,.066,.096,...` and ends `...,.9987,.9988,.9989,1)`), approximating a spring. Source comment says to keep it minified. — [number-flow lite.ts](https://raw.githubusercontent.com/barvian/number-flow/main/packages/number-flow/src/lite.ts)
- `spinTiming` default is `undefined`; digit spins fall back to `transformTiming`. — same source; [docs](https://number-flow.barvian.me/vanilla)
- `opacityTiming` default: `{ duration: 450, easing: 'ease-out' }`, used for fading characters in and out. — same source. (The docs page shows example values of 700 ms and 350 ms `ease-out`; these are examples, not defaults, and differ from the source.)
- Other defaults: `animated: true`, `respectMotionPreference: true`, `plugins` and `digits` undefined, `trend: (oldValue, value) => Math.sign(value - oldValue)`. Trend `+1` always rolls up, `-1` always down, `0` lets each digit follow its own direction. — [lite.ts](https://raw.githubusercontent.com/barvian/number-flow/main/packages/number-flow/src/lite.ts); [docs](https://number-flow.barvian.me/vanilla)
- Reduced motion: an update animates only if `canAnimate` (browser supports the needed CSS: `linear()` easing, `@property`, and a modifier feature), `animated` is on, `!respectMotionPreference || !prefersReducedMotion.matches`, the element is visible, and `document.visibilityState === 'visible'`. So hidden tabs and off-screen elements also skip animation. The `prefersReducedMotion` MediaQueryList is exported. — [lite.ts](https://raw.githubusercontent.com/barvian/number-flow/main/packages/number-flow/src/lite.ts); [docs](https://number-flow.barvian.me/vanilla)
- No delay or stagger values exist in the code. — same source
- Compositing: every animation uses `composite: 'accumulate'`; movement is `translateX(dx)` animating back to `none`; width changes become pixel deltas via CSS variables so width and translation stay in sync. — same source
- Enter and exit opacity animate a custom delta variable from `[-0.9999, 0]` (in) and `[0.999, 0]` (out), because accumulating directly onto `opacity` failed in Firefox and Safari. — same source
- Interruption: setting `animated` false finishes (not cancels) running animations (`getAnimations().forEach(a => a.finish())`) because cancel does not fire finish events. A new update mid-animation aborts the pending `animationsfinish`. — same source
- Removed characters are marked `inert`, positioned absolutely, and deleted on `animationsfinish`. — same source
- Digit wrap: digits wrap using a per-position max (default 9) when the trend opposes the raw difference. Plugin `continuous` makes a transition pass through intermediate numbers; no effect if `trend` is 0. — [lite.ts](https://raw.githubusercontent.com/barvian/number-flow/main/packages/number-flow/src/lite.ts); [docs](https://number-flow.barvian.me/vanilla)
- Mask: `--number-flow-mask-height` default `.25em` and `--number-flow-mask-width` default `.5em`; the mask height doubles as top and bottom padding. `line-height` defaults to 1. `font-variant-numeric: tabular-nums` is recommended, not default. `data-will-change` opt-in (memory cost). — [docs](https://number-flow.barvian.me/vanilla)
- `NumberFlowGroup` syncs transitions of sibling components (from the earlier pass). `digits` is not reactive. Accessibility is claimed ("Accessible") but no ARIA details are documented. — [docs](https://number-flow.barvian.me/vanilla)

### Inferences

- For Hairline's tooltip or header value, a 900 ms spring is long for a scrub, where values change per pixel. NumberFlow's accumulate compositing is what makes that tolerable; a Hairline roll should either use the same technique or be restricted to discrete changes (range switch, data update), with scrub values updating instantly.
- NumberFlow's reduced-motion rule is a full off-switch, not a shorter duration. It also skips animation when the tab is hidden, which Hairline's motion tokens do not currently consider.
- Hairline's own tokens (change 400 ms, enter 600 ms, ease-in-out-quart) are all far shorter than 900 ms; if NumberFlow is adopted its timings should be overridden to match.

### Gaps

- The `styles.ts` file (mask and CSS) and `group.ts` were not read, so mask gradient details and group sync mechanics are unconfirmed.
- Screen reader output (aria-label / live-region use) not verified.

## Which details from visx (tooltip, xychart, annotation) are worth adopting?

### Takeaway

visx has the clearest published flip algorithm (compare clipping on each side and flip only when the preferred side clips and clips more than the opposite), per-axis snapping flags, band-centre snapping, and a small, restrained default glyph and crosshair. Its annotation kit separates subject, connector and label with dx/dy offsets.

### Cited Findings

- `TooltipWithBounds` defaults `offsetLeft = 10`, `offsetTop = 10`. Horizontal: compute `rightPlacementClippedPx = left + offsetLeft + ownWidth - parentWidth` and `leftPlacementClippedPx = ownWidth - left - offsetLeft`; place left only if right clipping is greater than 0 and greater than left clipping. Vertical is analogous against parent height; with no parent height it falls back to `top + offsetTop + height > window.innerHeight`. Final position is rounded and applied as `transform: translate(x px, y px)`. — [TooltipWithBounds.tsx](https://raw.githubusercontent.com/airbnb/visx/master/packages/visx-tooltip/src/tooltips/TooltipWithBounds.tsx)
- XYChart `Tooltip`: snapping is per axis (`snapTooltipToDatumX`, `snapTooltipToDatumY`, both default false); there is no single `snapCrosshair`. With snapping, band scales get half the bandwidth added so the position lands at band centre. — [xychart Tooltip.tsx](https://raw.githubusercontent.com/airbnb/visx/master/packages/visx-xychart/src/components/Tooltip.tsx)
- Crosshairs are off by default (`showVerticalCrosshair`, `showHorizontalCrosshair` false), stroke width 1.5, colour falls back `theme.gridStyles.stroke`, then `theme.htmlLabel.color`, then `#222`. Vertical spans `innerHeight` from `margin.top`. — same source
- Glyphs: radius default 4, circle with the theme background as stroke, `strokeWidth` 1.5, `paintOrder="fill"`. They always sit on the datum even when the tooltip does not snap. `showSeriesGlyphs` draws one per series and flags the nearest (`isNearestDatum`); `showDatumGlyph` draws one for the nearest datum only. Default both false. — same source
- Each glyph and crosshair line lives in its own portal with `fontSize: 0; lineHeight: 0`, because inherited text styles broke exact placement. — same source
- Tooltip bounds are force-refreshed on hidden to visible, to handle containers that moved through animation or drag. The wrapper returns `null` when closed to avoid scroll listeners and many resize observers. — same source
- `scroll` default true. `renderTooltip` returning null or undefined renders nothing. — same source
- Annotation kit (`@visx/annotation`, since v1.2.0): three optional parts, Subject (`CircleSubject`, `LineSubject`), Connector, Label (title and subtitle, SVG text wrapping via `@visx/text`, anchors and alignment, uses ResizeObserver). `Annotation` takes `x, y, dx, dy` and passes them via context; `EditableAnnotation` adds dragging with `canEditLabel`/`canEditSubject` and `onDragEnd({x, y, dx, dy})`. `CircleSubject` defaults: radius 16, stroke `#222`, transparent fill, `pointerEvents="none"`. Inspired by Susie Lu's react-annotation. — [npm @visx/annotation](https://npmjs.com/package/@visx/annotation); [PR 907](https://github.com/airbnb/visx/pull/907); [PR 919](https://github.com/airbnb/visx/pull/919); [CircleSubject.tsx](https://github.com/airbnb/visx/blob/master/packages/visx-annotation/src/components/CircleSubject.tsx)

### Inferences

- The "flip only if preferred side clips and clips more than the other side" rule is a stable, flicker-resistant rule to copy: it never flips when both sides fit, and picks the lesser evil when neither fits. A 10 px offset is a defensible default.
- Per-axis snap plus "glyphs always on datum" is a neat split: a crosshair can follow the pointer smoothly while the dot stays honest to the data.
- Annotation subject/connector/label split with dx/dy offsets is a good model for Hairline's editorial callouts. Connector and label-subject shape details (elbow, curve, rectangular subjects) were not read.

### Gaps

- `Connector` and `LineSubject`/`RectSubject` source not read; connector style options (elbow vs line, endpoint markers) unconfirmed.
- `useTooltipInPortal` / `TooltipInPortal` `detectBounds` logic and `debounce` default not read.
- `visx-tooltip` `defaultStyles` values not read.

## What do Tremor and shadcn/ui charts do (legend isolate, hover, empty state, formatting, tooltip anatomy)?

### Takeaway

Both wrap Recharts. Tremor's distinctive behaviour is legend click-to-isolate with a 0.3 stroke dim and invisible fat hit-lines; shadcn's is a CSS-variable colour system, tooltip indicator variants, and tabular mono numerals. Tremor ships no empty state and turns series animation off.

### Cited Findings

- Tremor isolate: clicking a legend item sets `activeLegend` only if `onValueChange` is supplied; inactive lines go to `strokeOpacity` 0.3 and inactive legend items to `opacity-40`; clicking the active item again, or empty chart space, resets and calls `onValueChange(null)`. — [Tremor LineChart.tsx](https://raw.githubusercontent.com/tremorlabs/tremor/main/src/components/LineChart/LineChart.tsx)
- Tremor draws invisible duplicate lines 12 px wide as hit targets when clickable, excluded from legend and tooltip (`legendType="none"`, `tooltipType="none"`). — same source
- Tremor dot selection: clicking a dot sets `activeDot` and dims every line, including the selected one, to 0.3; clicking again clears. Hover dot is radius 5 with a white (dark: gray-950) ring. Static dots show only for single-value series. — same source
- Tremor tooltip: cursor `#d1d5db` width 1; tooltip pinned with `position={{ y: 0 }}` and `offset={20}`; the tooltip animates for 100 ms; lines are hard-coded `isAnimationActive={false}`. `connectNulls` default false. — same source
- Tremor has no empty state: no `noDataText` in this version; `data` defaults to `[]`, and `startEndOnly` with empty data would throw. — same source
- Tremor legend slider (`enableLegendSlider`, default false): horizontal scroller with arrow buttons, scroll step is container width minus button width, hold-to-repeat every 300 ms, ArrowLeft/ArrowRight on the focusable container. Overflow is not re-checked on resize. — same source
- shadcn tooltip: `indicator` of `dot` (default, 2.5 square swatch), `line` (narrow bar stretching to row height), or `dashed` (zero-width dashed border). With one payload item and a non-dot indicator, the label moves inside the row. — [shadcn chart.tsx](https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/chart.tsx)
- shadcn numbers: `item.value.toLocaleString()` in `font-mono font-medium tabular-nums`; null and undefined values are skipped. — same source
- shadcn resets Recharts defaults by CSS: cursor line `stroke-border`, bar cursor `fill-muted`, active-dot white ring removed (`stroke-transparent`), grid lines 50% opacity, focus outlines hidden on layers and sectors. — same source
- shadcn colour system: per-series `--color-<key>` CSS variables written to a scoped `<style>` for `[data-chart=id]`, light and `.dark` themes, from a config with either `color` or a `theme` map. Id from `useId()` with colons stripped. `ResponsiveContainer` initial size 320x200. — same source
- shadcn legend: bottom by default, 2x2 swatch, label only from config (a series with no config shows no label); no click behaviour in the legend component. — same source

### Inferences

- Dimming to 0.3 on isolate matches Hairline's existing `DimGroup` idea; the 12 px invisible hit-line is exactly Hairline's `HitPath` pattern, and 12 px is a reasonable minimum hit width.
- shadcn's `dashed` and `line` indicators suit an editorial style better than filled swatches, particularly for line charts where a swatch is a different mark from the series.
- Tremor's weakness (no empty state, throws on empty) is a checklist item: Hairline should specify empty and loading states explicitly.
- shadcn removing the Recharts active-dot white ring shows that default hover marks are a common point of friction.

### Gaps

- Tremor's current repo layout may differ (the fetch returned v1.0.0 text from main); other Tremor charts (Bar, Donut) not read.
- shadcn/ui `chart` docs page (ui.shadcn.com/charts) not opened; accessibility-layer usage not checked.

## What do ECharts, Nivo, Unovis and AG Charts do for emphasis/blur, morphing, label collisions, crosshairs and motion?

### Takeaway

ECharts is the outlier: it has a whole state model (emphasis, blur, select), `universalTransition` shape morphing between chart types, and `labelLayout` post-placement collision handling. AG Charts documents its label collision rule and a three-phase data-update animation. Nivo uses named react-spring presets with `gentle` as the default. Unovis' crosshair has snap modes and pinning, but defaults were not read.

### Cited Findings

- ECharts 5.0 added `select` and `blur` states alongside `emphasis`, sharing the same options; `highlightPolicy`/`hoverOffset`/`focusNodeAdjacency` were folded into `emphasis.focus`, `blurScope` and `scale`. `labelLayout` lets developers adjust label positions after the chart places them. — [ECharts changelog](https://echarts.apache.org/en/changelog.html); [PR 12911](https://github.com/apache/echarts/pull/12911)
- `emphasis.focus: 'series'` combines with `blurScope` `'series'`, `'global'` or `'coordinateSystem'` (seen in test pages). — [hoverFocus.html test](https://app.unpkg.com/di-echarts@1.0.9/files/test/hoverFocus.html) (search summary)
- `labelLayout.moveOverlap` shifts overlapping labels (`shift-x`/`shift-y` per the PR; later code uses camel case), then `hideOverlap: true` hides ones that still overlap. — [PR 12911](https://github.com/apache/echarts/pull/12911)
- Known limits: with `hideOverlap` and `focus: 'series'`, hovering the legend re-shows all labels (issue 17600); `moveOverlap` does nothing when `labelLayout.x` is unset (issue 17937, closed not planned). v6.0.0 added `axisLabel.nameMoveOverlap` to stop axis labels and axis names overlapping. — [issue 17600](https://github.com/apache/echarts/issues/17600); [issue 17937](https://github.com/apache/echarts/issues/17937); [changelog](https://echarts.apache.org/en/changelog.html)
- ECharts `universalTransition` (5.2.0): `{ enabled, seriesKey, divideShape: 'clone' | 'split' }`. Series are matched by `id`, or by shared `seriesKey` (a string or array; arrays are sorted and joined; one old series can feed several new ones). The 5.2 example morphs between pie and bar sharing `id`, with `setOption(option, true)` so axes are removed. Based on zrender `morphPath`. Array `seriesKey` crash fixed in PR 21788 (merge state unconfirmed). — [PR 15208](https://github.com/apache/echarts/pull/15208); [5.2 handbook](https://echarts.apache.org/handbook/en/basics/release-note/5-2-0/); [PR 21788](https://github.com/apache/echarts/pull/21788)
- ECharts axisPointer global listener: events `click`, `mousemove`, `mousewheel` (so highlight can be cleared when dataZoom changes layout) and `globalout`; no throttle, no hide delay, no numeric constants. Show and hide tooltip actions are queued per event and only the last `showTip` (or else last `hideTip`) is dispatched, so show wins over hide in the same event. — [globalListener.ts](https://raw.githubusercontent.com/apache/echarts/master/src/component/axisPointer/globalListener.ts)
- AG Charts animation: one `duration` option; on a data update, the duration is the total across three phases (remove, update, add); initial load is just the duration. Zoom, crosshair and animation modules are Enterprise (`ag-charts-enterprise`). — [AG Charts animation](https://www.ag-grid.com/charts/react/animation/); [zoom](https://www.ag-grid.com/charts/javascript/zoom/)
- AG Charts axis labels: `avoidCollisions`, `autoRotate`, `rotation`, `truncate`, `wrapping`; a collision is labels within 10 px of each other; auto-rotate is attempted before skipping labels. Crosshair label takes a `renderer(value, fractionDigits)` callback. — [AG axis labels](https://www.ag-grid.com/charts/react/axes-labels/); [crosshairs](https://www.ag-grid.com/charts/javascript/axes-crosshairs/)
- Nivo: motion uses react-spring (bar moved from react-motion, dropping `motionStiffness: 90, motionDamping: 15`); `motionConfig` accepts a preset name or a custom spring config; options in the website are `default`, `gentle`, `wobbly`, `stiff`, `slow`, `molasses`; bar default is `gentle`. A `useMotionConfig()` hook returns `animate`, `config`, `springConfig`. — [nivo commit 457ebfa](https://github.com/plouc/nivo/commit/457ebfa490e6809f567155eb8789fb45d03cc05c); [commit abef1fa](https://github.com/plouc/nivo/commit/abef1faece7bea96c8da3bfc4dd9a2e7342f10a5)
- Unovis Crosshair: `snapToData` and a `snapMode` of `'x'` (default per one fork PR) or `'xy'`; in `xy` mode a swarm of points snapped to the wrong neighbour (bug fixed there). `forceShowAt` pins the crosshair; in f5/unovis its visibility depends only on the forced position being in the X range. Tooltip is hidden whenever the crosshair hides (out of range, mouseout, wheel). Recent PRs: crosshair no longer clipped, so circles outside a fixed Y domain are hidden (PR 981, Oct 2026); `setData()` skips `crosshair.hide()` before first render (PR 936). — [ExaForce/unovis PR 142](https://github.com/ExaForce/unovis/pull/142); [f5/unovis PR 898](https://github.com/f5/unovis/pull/898); [PR 981](https://github.com/f5/unovis/pull/981); [PR 936](https://github.com/f5/unovis/pull/936)

### Inferences

- ECharts' "last showTip wins over hideTip in the same event" is a small, copyable rule: when two chart layers (crosshair, legend hover) both react to one pointer event, resolve in a single dispatch to avoid flicker.
- ECharts' own issue 17600 warns that legend hover and label collision hiding interact; if Hairline hides colliding labels and also supports legend highlight, both must read one source of truth.
- Morphing between chart types is the most distinctive thing in this set, but it needs stable ids and a shape-division strategy (clone vs split). For a restrained editorial kit, a simpler analogue is stable-key enter/update/exit within one chart type, which Hairline presumably already has; cross-type morph is optional and large.
- AG's total-duration-across-three-phases model is a clean way to describe update choreography (exit, move, enter) with one number; Hairline's tokens (change 400, enter 600) could be set in sequence rather than overlapping.
- Nivo's presets are named by feel not number; Hairline's single ease-in-out-quart token set is simpler and is the better fit for the restrained style.

### Gaps

- Nivo spring numbers (tension, friction) were not verified; one search summary gave values "from memory" and they must not be treated as sourced. Nivo legend interactions (`onClick`, `effects` on hover) and annotation options (the nivo.rocks annotations page returned 404) were not read.
- Unovis `Crosshair` default values (`hideWhenFarFromPointerDistance`, etc.) were not found; the search could not confirm those option names exist.
- ECharts tooltip options (`confine`, `hideDelay`, `showDelay`, `transitionDuration`, `axisPointer.snap`, `triggerOn`), `animationDurationUpdate` and `animationEasing` defaults, and `aria` decal settings were not retrieved.
- AG Charts tooltip, crosshair snapping, animation easing and reduced-motion behaviour were not read; only summary-level docs.
- Victory and Plotly: not researched (no tool calls spent on them); nothing is claimed.
- Reduced-motion handling in visx, Tremor, shadcn, Nivo, Unovis, ECharts, AG Charts: no source found. Only NumberFlow was verified (see first section).
- Empty/loading states: only Tremor's absence was verified; no other library's empty state or skeleton was read.
- Number formatting defaults beyond shadcn's `toLocaleString()` and AG's `fractionDigits` crosshair callback: not found.
