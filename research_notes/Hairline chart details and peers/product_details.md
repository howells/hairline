# Interaction and finish details in chart products and React chart kits (for Hairline)

Scope note: about 16 tool calls. Library and Apple findings are well sourced. Product-level findings (Stripe, Linear, Vercel, Plausible, PostHog, Amplitude, Datadog, GitHub, Arc, Figma, Things/Fantastical) were NOT reached: searches returned nothing usable for them, and nothing is claimed about them below. They are listed under Gaps. Observable's own docs site returned HTTP 429, so Plot findings come from the docs markdown in the GitHub repo (same text). Hairline context: I read only `hover.tsx` and `motion.ts` (hover is group dimming plus transparent hit shapes, `DimGroup`/`HitRect`/`HitCircle`/`HitPath`; motion tokens are hover 150 ms, change 400, enter 600, grow 800, long 1200, easing ease-in-out-quart). I did not read `core.tsx` or `data-table.tsx`.

## What do the best products do for scrubbing, crosshairs, tooltips, number animation, sparklines, colour, skeletons, range switching, selection, touch, keyboard and reduced motion?

### Takeaway

Only Apple (Stocks, Weather, Swift Charts, Audio Graphs) and Robinhood were documented well enough to cite. Their shared pattern is: press-and-hold to scrub (so scrolling is not hijacked), a thin rule plus a dot, a header value that switches to the scrubbed value, two-finger or range selection for comparison, and a non-pointer equivalent for every interaction. No documented source for number-roll timings, skeletons, or value-change colouring in the named products was found.

### Cited Findings

- Apple Stocks: touch and hold the chart with one finger to see the value at a date or time; touch and hold with two fingers to see the difference in value over time (a range comparison gesture). — [Apple Support, Stocks on iPhone](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios), via search summary
- Apple HIG-adjacent guidance (WWDC22 "Design an effective chart"): for touch, use an interactive tooltip that lets people touch the chart to highlight and read specific values; do not size touch targets to the marks, add padding and stretch targets to the full height of the chart. — [WWDC22 Design an effective chart](https://developer.apple.com/videos/play/wwdc2022/110340/) (as summarised by search; I did not read the transcript)
- Same session: every interaction designed for touch or mouse must be designed equally for keyboard, Voice Control, Switch Control and VoiceOver. — [WWDC22 Design an effective chart](https://developer.apple.com/videos/play/wwdc2022/110340/)
- Apple Weather: text above the precipitation chart states the main takeaway; WWDC22 "Design app experiences with charts" recommends progressive revelation of complexity (30-day and 1-year views, touch states, tappable summary statistics). — [WWDC22 Design app experiences with charts](https://developer.apple.com/videos/play/wwdc2022/110342/)
- Swift Charts selection (iOS 17): `chartXSelection(value:)` binds the selected x; the idiom is a `RuleMark` drawn only `if let selectedValue`, with an `.annotation(position: .top, overflowResolution: .init(x: .fit, y: .disabled))` popover. A range variant of `chartXSelection` exists (two-finger tap on iOS, drag on macOS); `chartGesture` allows a custom gesture. — [WWDC23 notes: pie charts and interactivity](https://wwdcnotes.com/documentation/wwdc23-10037-explore-pie-charts-and-interactivity-in-swift-charts/); [Swift with Majid on selection](https://swiftwithmajid.com/2023/07/18/mastering-charts-in-swiftui-selection/)
- Swift Charts annotation overflow is an explicit per-axis strategy: `.fit(to: .plot | .chart)`, `.fit`, `.disabled`, `.padScale` (grow the scale to make room), `.automatic`. — [Apple docs, annotation(position:alignment:spacing:overflowResolution:content:)](<https://developer.apple.com/documentation/charts/chartcontent/annotation(position:alignment:spacing:overflowresolution:content:)-1kiow.md>)
- Known Swift Charts failure: with `chartScrollableAxes`, y `.disabled` is ignored and the annotation gets pushed back inside the plot; also the y axis can jump while a RuleMark annotation shows unless domains are fixed with `chartYScale(domain:)`. — [Apple Developer Forums 737244](https://developer.apple.com/forums/thread/737244); [Apple Developer Forums 724770](https://developer.apple.com/forums/thread/724770)
- Robinhood advanced charts: long press to scrub for detail at a point in time; pinch to zoom; swipe to pan; drag the y axis to scale it; double-tap resets to auto-scaled y. — [Robinhood support, Using advanced charts](https://robinhood.com/gb/en/support/articles/using-advanced-charts/)
- Robinhood's open-source Android sparkline `spark` exposes scrubbing as an opt-in with a themeable scrub line (`spark_scrubEnabled`, `spark_scrubLineColor`, `spark_scrubLineWidth`), described as "tap and drag along the sparkline" to show detail for the scrubbed point. — [robinhood/spark](https://github.com/robinhood/spark)
- A third-party app copying Stocks' pattern: a thin rule and a dot mark the place, the line under the chart switches to the scrubbed value as in Stocks; haptics are a light tick per slot (capped around 25 per second), a firmer one at "now" and at the day's high and low, none on data updates. This is one app's design, not Apple's. — [srcfl/ftw-app PR 22](https://github.com/srcfl/ftw-app/pull/22)
- Apple's only documented haptic use in charts: grid lines are represented in the audio graph as haptic feedback during playback and interaction. — [WWDC21 Bring accessibility to charts](https://developer.apple.com/videos/play/wwdc2021/10122/) (via search summary)
- Number rolling: NumberFlow (`@number-flow/react`, MIT, about 7.8k stars) animates automatically when `value` changes, and a `<NumberFlowGroup>` syncs transitions when one component's width shifts another. Its timings, easing and reduced-motion behaviour were not on the pages I could read. — [barvian/number-flow](https://github.com/barvian/number-flow)

### Inferences

- Scrub-on-long-press (Stocks, Robinhood) is the established answer to "scrubbing vs page scroll" on touch; a Hairline touch mode should not capture a bare horizontal drag on a chart in a scrolling page.
- Stretching the touch target to the full plot height (Apple) is equivalent to Hairline picking the nearest x column instead of requiring the pointer to land on a mark; Hairline's `HitRect` could be a full-height column per datum.
- Two-finger "difference over time" is a cheap, editorial-fitting comparison feature (a delta label between two rules) that matches Hairline's restraint better than brush zoom.
- A Hairline number-roll would be a dependency decision: NumberFlow exists and is accessible-tagged; verify its reduced-motion handling before adopting (not verified here).

### Gaps

- Stripe Dashboard, Linear Insights, Vercel Analytics/Observability, Plausible, PostHog, Amplitude, Datadog, GitHub contribution graph, Arc, Figma, Things/Fantastical: no usable source retrieved; no claims made. These are proprietary UIs, best studied by direct inspection in a browser, not by search.
- Apple Stocks/Weather haptic details, exact scrub rule styling, and exact number-roll timings: not documented in anything reached.
- Skeleton, empty-state and range-switch transition specifics: not found in any source.
- Value-change colouring conventions (up/down colours, neutral at zero): not found.
- NumberFlow docs site (number-flow.barvian.me) and Emil Kowalski / Rauno Freiberg writing: not fetched.

## What do the libraries provide out of the box, and which are praised?

### Takeaway

Observable Plot has the most principled, documented pointer and tip model (distance-weighted nearest point, pooling, click-to-stick, auto-anchoring). Recharts 3 ships keyboard arrow navigation by default but has live bugs around it. Highcharts has the deepest accessibility and sonification stack. Swift Charts is the benchmark for annotation overflow strategy and automatic audio graphs. Tremor, shadcn/ui charts, visx, Nivo, Unovis, ECharts, Victory, react-financial-charts and AG Charts were not reached.

### Cited Findings

- Plot pointer transform: filters a mark so only the point nearest the pointer renders; `maxRadius` default is 40 px; it reasons about points, not mark geometry, so overlapping points may be unreachable (issue 1621). — [Plot pointer docs (repo markdown)](https://github.com/observablehq/plot/blob/main/docs/interactions/pointer.md)
- Plot `pointerX`/`pointerY` still use both dimensions, but distance along the non-dominant axis is divided by 100, so it acts as a tie-breaker: on a multi-series line chart, moving vertically switches series while x dominates. Plain `pointer` uses 2D distance (scatterplots); with it small rects only trigger near the centroid. — same source
- Plot click-to-stick: click locks the focused point, click again unlocks, so text in the tip can be selected and copied; with several pointer transforms, one click locks all. Focus change fires an `input` event and sets `plot.value`. — same source
- Plot target position precedence: `px`, then midpoint of `x1`/`x2`, then `x`, then `x1`, then `frameAnchor` (default middle); the midpoint rule lets bars, rects and areas work. — same source
- Plot `pool` (0.6.18+) defaults true for tip: at most one tip visible across pooled pointer transforms; faceting is always exclusive. — same source; [tip docs](https://github.com/observablehq/plot/blob/main/docs/marks/tip.md)
- Plot tip defaults: nine anchors (four sides, four corners, middle); automatic anchor choice uses `preferredAnchor` (default `bottom`, `left` for pointerY) "if it fits"; `pointerSize` 12 px; `textPadding` 8 px; `lineHeight` 1 em; `lineWidth` 20 em wrap with `title`; font size 10 px, `system-ui`; box has a drop shadow (`pathFilter`). Color/opacity channels get a swatch; paired channels show as a range (x1/x2 "64-66") or length. Flip algorithm is not documented; if it still cannot fit, docs suggest `overflow: visible` on the plot. — [tip docs](https://github.com/observablehq/plot/blob/main/docs/marks/tip.md)
- Plot `format` option (0.6.11) per channel: string, function, `true`, or `null`/`false` to hide; channel order follows the format object. — same source
- Recharts 3.0 (June 23, 2025): `accessibilityLayer` is on by default for polar and cartesian charts; the chart is one tab stop and arrow keys move between data points; screen readers need QuickNav off in VoiceOver because the layer uses keydown. — [Recharts wiki, accessibility](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility); [v3.0.0 discussion](https://github.com/recharts/recharts/discussions/5984)
- Recharts open bugs in 3.x: arrow keys move the tooltip but are not `preventDefault`ed, so Safari scrolls the page (issue 8047, PR 8049 blocks ArrowLeft, ArrowRight and Enter only while the layer is on); keyboard does not move the tooltip while the mouse rests over the chart because hover state has priority (issue 7905, PR 7906). — [issue 8047](https://github.com/recharts/recharts/issues/8047); [issue 7905](https://github.com/recharts/recharts/issues/7905)
- Highcharts accessibility module keys: Tab between chart elements, arrows within an element, space to activate. Screen reader mode: information region first (title, type, axes, description), series as landmarks/regions by default, optional data table view, announced dynamic updates with developer-controlled rate, series markers with different shapes, high-contrast and pattern fills. — [Highcharts accessibility feature overview](https://www.highcharts.com/docs/accessibility/accessibility-module-feature-overview)
- Highcharts sonification demo keys: Space play/pause, arrows step and move between lines, Home/End jump to start or end of a series, Esc silences and resets. API: `chart.sonification.playAdjacent(next, onEnd, filter)`, `playAdjacentSeries`, and `playSegment` for drag-scrubbing that sets both speed and position. — [Highcharts sonification demo](https://www.highcharts.com/samples/embed/highcharts/demo/sonification-navigation); [navigation docs](https://www.highcharts.com/docs/sonification/navigation)
- Swift Charts builds an accessibility tree and audio graph automatically (grouped by data, with summary); a custom `AXChartDescriptor` (axes, series, `AXDataPoint`, summary) can replace it. — [WWDC22 Design an effective chart](https://developer.apple.com/videos/play/wwdc2022/110340/); [Apple, representing chart data as an audio graph](https://developer.apple.com/tutorials/data/documentation/accessibility/representing-chart-data-as-an-audio-graph.md)
- Data Navigator (Elavsky, Nadolskis, Moritz): models a chart as a graph of nodes and edges, with named navigation rules (e.g. `left: {key: 'ArrowLeft', direction: 'source'}`, `exit: {key: 'Escape'}`); input is modality-agnostic (keyboard, touch, voice); it renders a semantic HTML layer over SVG/Canvas. — [Data Navigator](https://www.frank.computer/data-navigator/); [cmudig/data-navigator](https://github.com/cmudig/data-navigator)
- Chartability (accessibility heuristics): "Interaction modality only has one input type" is rated critical; also "No interaction cues or instructions" (keyboard controls must be explained), "Keyboard focus indicator missing, obscured, or low contrast", and "Navigation and interaction is tedious", which warns that a 1:1 translation of mouse hover to keyboard can be tedious. — [Chartability workbook](https://chartability.github.io/POUR-CAF/)

### Inferences

- Plot's x-dominant distance (divide the other axis by 100) is a precise, reproducible rule for Hairline multi-series lines: snap by x, break ties by y. It also answers the "x-band vs nearest-point" question with a hybrid.
- Recharts' two bugs are a checklist for Hairline's missing keyboard scrub: call `preventDefault` on handled keys, and let a key press override a resting pointer.
- Chartability's "tedious" warning plus Highcharts Home/End and Data Navigator's hierarchy suggest keyboard scrub should offer Home/End and maybe PageUp/Down jumps, not only left/right one point at a time.
- "Best in class" opinions were not found in any source I read; my ranking above is inference from documentation depth, not from community praise.

### Gaps

- Tremor, shadcn/ui charts, visx (`@visx/tooltip`, `useTooltip`, `localPoint`), Nivo, Unovis, ECharts (`axisPointer.snap`, `triggerOn`, `tooltip.confine`; ECharts docs page returned only a nav shell), Victory, react-financial-charts, AG Charts: not retrieved. Do not assume their behaviour.
- Community praise or ranking for any library: no source found.
- Highcharts sonification pitch mapping and timing defaults: not on the pages read.
- Audio Graphs pitch mapping, play control, and live audio graph: Orange's summary did not cover them; WWDC21 session 10122 transcript not read.

## What are the design rules behind good tooltips and crosshairs (snapping, nearest-point vs x-band, hysteresis, offset, edge collision, pinning on tap)?

### Takeaway

Documented rules: snap to data via a distance-weighted nearest point (Plot) or a full-height column (Apple); use an explicit per-axis overflow strategy near edges (Swift Charts) or automatic anchor with a preferred side (Plot); pin by click (Plot) or on a selection binding (Swift Charts); keep focus on the trigger and make the tooltip dismissible, hoverable and persistent per WCAG 1.4.13. Hysteresis was not documented anywhere I reached.

### Cited Findings

- Nearest point with reach limit: Plot ignores the pointer beyond 40 px, so the tip disappears when the pointer is far from any data (avoids a tip stuck on a distant point). — [Plot pointer docs](https://github.com/observablehq/plot/blob/main/docs/interactions/pointer.md)
- Dominant-axis snapping: x-dominant for time series, 2D for scatter, per the Plot rule above. — same source
- One tip at a time: pooled tips (Plot default); a tip shows all channels by default, with formatting per channel. — [Plot tip docs](https://github.com/observablehq/plot/blob/main/docs/marks/tip.md)
- Offset and arrow: Plot's arrow is 12 px, internal padding 8 px, anchored on one of nine positions, preferring below the point. — same source
- Edge handling: Swift Charts lets x and y differ (typical: `x: .fit, y: .disabled`, so the popover slides horizontally inside the chart but may rise above the plot); `.padScale` is the alternative of making room by growing the scale. — [Apple docs](<https://developer.apple.com/documentation/charts/chartcontent/annotation(position:alignment:spacing:overflowresolution:content:)-1kiow.md>)
- Pinning/stick: Plot click-to-stick (click again to release, enabling text selection). — [Plot pointer docs](https://github.com/observablehq/plot/blob/main/docs/interactions/pointer.md). Stocks keeps touch value display only while the finger is down (touch and hold). — [Apple Support](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios)
- WCAG 1.4.13 (Content on Hover or Focus): show on keyboard focus as well as hover, dismissible with Esc, hoverable (pointer can move onto it without it closing), persistent; keyboard focus stays on the trigger and the tooltip does not take focus. Adobe's React Spectrum Charts states chart tooltips should be plain HTML with no interactive elements. — [mgifford tooltip best practices](https://github.com/mgifford/ACCESSIBILITY.md/blob/main/examples/TOOLTIP_ACCESSIBILITY_BEST_PRACTICES.md) (secondary source); [Adobe React Spectrum Charts ChartTooltip](https://opensource.adobe.com/react-spectrum-charts/PR-787-docs/docs/api/interactivity/ChartTooltip)
- Reset behaviour: Robinhood double-tap restores the auto-scaled axis; Highcharts Esc silences and resets. — [Robinhood](https://robinhood.com/gb/en/support/articles/using-advanced-charts/); [Highcharts demo](https://www.highcharts.com/samples/embed/highcharts/demo/sonification-navigation)

### Inferences

- A concrete Hairline spec assembled from the above: x-dominant nearest datum with a reach limit; one tooltip globally; per-axis edge policy (clamp horizontally, flip vertically); tooltip text is plain; Esc dismisses; arrows scrub with `preventDefault`; a key press overrides a resting pointer; optional click or tap pins.
- Hairline's `<output>` tooltips could carry keyboard parity by driving the same state from `focus` and `keydown` on the chart; `<output>` is already a live region, which suits announcing the scrubbed value, though announcement rate (Highcharts exposes developer control) must be throttled.
- Hysteresis (holding the current datum until the pointer moves beyond a margin of the next) is not documented by any source I found; if wanted it is an original design choice, not a cited convention.

### Gaps

- Hysteresis, tooltip follow easing (spring vs instant), show/hide delays, and tooltip transition timings: no source found for any product or library.
- Flip algorithm in Plot: documented as automatic but not specified; would need reading `src/marks/tip.js`.
- Visx, ECharts, Recharts tooltip positioning rules (`confine`, `reverseDirection`, `useTooltipInPortal`): not retrieved.
- Reduced-motion behaviour in any library or product: only noted as absent from Highcharts' feature overview page; nothing positive found.
