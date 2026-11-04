# Newsroom craft details on unusual chart forms, scrub/hover readouts, transitions and scrollytelling

Scope note: this second pass ran about 16 tool calls against a brief that was far wider than that. It found solid, citable material on scrollytelling mechanics (The Pudding, Scrollama), ridgeline construction (Datawrapper), bump charts (Datawrapper, CBC), FT animated line reveal (Flourish rebuild), and the NYT jittery gauge reasoning. It found very little primary material on arrow/range/dot plots, waffles, radial charts, fan charts, WaPo, Guardian, Reuters, Bloomberg or NYT per-form specs. Those are listed as Gaps rather than filled from memory. The search tool returns summaries, so figures below come from fetched pages unless marked "search snippet".

## 1. Ridgelines, slopegraphs, bump charts, waffles, arrow/range/dot plots, beeswarms, radial charts: what outlets do

### Takeaway

Reproducible construction detail exists for the ridgeline (running-maximum masking) and the bump chart (line chart with curved lines, or scatter with symbols sized by value). A Pudding-derived beeswarm uses d3-force. For slopegraphs, dot plots, arrow charts, waffles and radial charts no newsroom spec was found; only the FT Visual Vocabulary definitions and generic guidance surfaced.

### Cited Findings

- Ridgeline construction (Datawrapper Weekly Chart, built on the Unknown Pleasures pulsar image): reverse the rows so the chart is built bottom to top; add a vertical gap so each line sits above the previous one; then, for each line in turn, record the running maximum at every x position and where the current line falls below that maximum, use the maximum instead. This masking makes nearer peaks hide the lines behind. A bigger gap gives lower-looking peaks, a smaller gap taller ones. Rendered as an area chart with "Stack areas" off (a line chart with fill between lines would also work); all labels and ticks removed. No numeric gap, fill, stroke or opacity is given. The author's Node.js script is at https://github.com/datawrapper/snippets/tree/master/2020-09-10-ridgeline-plot — [Datawrapper, A post-punk chart](https://www.datawrapper.de/blog/weekly-ridgeline-plot/)
- Ridgeline in newsroom use: a Datawrapper Data Vis Dispatch promoted "ridgeline plots on climate", including one showing Arctic sea-ice extent for every day from 1980 to 2024. The outlet and URL of that chart were not in the snippet. Datawrapper says ridgelines are "somewhat niche" and not supported out of the box. — [Datawrapper on X, Dec 2024](https://x.com/Datawrapper/status/1866523470076538885) (search snippet only); [A post-punk chart](https://www.datawrapper.de/blog/weekly-ridgeline-plot/)
- Naming note: Claus Wilke's argument for "ridgeline plot" over "joyplot" and the ggridges package are the standard references. — [Wilke, Goodbye joyplots](https://clauswilke.com/blog/2017/09/15/goodbye-joyplots/) (link taken from the Datawrapper page; not opened)
- Bump charts: Datawrapper recommends building them as a line chart with curved lines (curves help the eye follow each series; lines are hover-interactive) when ranking is all you want to show. Method 2 is a scatter plot on long-format data, where symbols can also encode the underlying quantity and tooltips are richer, but lines are not interactive. Warning: ranks hide magnitude; in their example locator maps held the same rank from 2019 to 2020 while use rose 60%. — [Datawrapper, Your favorite chart type is more flexible than you think (Tanikawa, 7 Oct 2021)](https://www.datawrapper.de/blog/favorite-popular-chart-types)
- Newsroom bump chart example: Roberto Rocha, CBC News, in the Datawrapper Weekly Chart "rank chart". — [Datawrapper, weeklychart-rankchart](https://www.datawrapper.de/blog/weeklychart-rankchart/) (link taken from the page above; not opened)
- FT definitions: the Visual Vocabulary poster (Alan Smith and others, ft.com/vocabulary) describes a dot plot as "a simple way of showing the change or range (min/max) of data across multiple categories", and the dot strip plot as best for showing all values and highlighting individual ones. — [Visual Vocabulary PDF](https://journalismcourses.org/wp-content/uploads/2020/07/Visual-vocabulary.pdf) (via search summary)
- FT slope chart definition in Alan Smith's book _How Charts Work_ (Pearson, 2022), chapter 9: a slope chart lets us see "at a single glance, magnitude, change over time and ranking relationships in the data." — [dokumen.pub preview of How Charts Work](https://dokumen.pub/how-charts-work-understand-and-explain-data-with-confidence-1nbsped-129234279x-9781292342795-1292342803-9781292342801-1292342811-9781292342818.html) (search snippet)
- Dumbbell versus arrow: a 2026 Plotly guide recommends sorting dumbbell rows by the gap, and arrows because direction survives grayscale and colour-blindness. Generic guidance, not a newsroom practice. — [Plotly, Dumbbell charts guide](https://plotly.com/blog/dumbbell-chart-guide/) (search snippet)
- Beeswarm: Sawyer Click's "Is Punk Dead?" (Pudding Cup 2019 honorable mention, inspired by The Pudding's punk piece) built the swarm with d3-force and triggered steps with enter-view. This is a reader entry, not a Pudding staff build. — [Is Punk Dead?](https://sawyerclick.github.io/punk/) (search snippet)
- Pudding "The Unlikely Odds of Making It Big": a pinned circular visualization on the right with text steps scrolling on the left; 7,000 bands shown first as a sea of dots and finally as a wall of names. — [Scrollytell.ing write-up](https://scrollytell.ing/the-pudding-series-the-unlikely-odds-of-making-it-big/) (search snippet; third party)
- Waffle: The Times (UK) graphics lead Matilda Davies says "Waffle charts aren't just for politics"; her team built a waffle from a Datawrapper scatter plot and automated recurring charts with R scripts. — [Datawrapper, Matilda Davies](https://www.datawrapper.de/blog/the-times-matilda-davies) (search snippet)
- The Pudding's svelte-starter ships `checkOverlap.js`, an action that detects overlapping labels and adds a class to the overlapping ones, and LayerCake chart templates. — [the-pudding/svelte-starter](https://github.com/the-pudding/svelte-starter)

### Inferences

- A ridgeline helper should take an overlap parameter (the gap) and implement the running-maximum mask or, more simply in SVG, paint rows back to front with an opaque page-colour fill so nearer rows occlude farther ones. The Datawrapper masking is a workaround for a tool without z-ordered fills; a React SVG library does not need it.
- Bump charts: offer curved lines and an optional symbol-size encoding, and show the underlying value in the tooltip, because the Datawrapper and Flerlage warning is that rank alone can mislead.
- Label-overlap detection that toggles a class (Pudding) is a lighter alternative to a force-based label solver for dot and beeswarm labels.

### Gaps

- No newsroom spec found for slopegraph end labels, rank labels or label spacing. No Chart Doctor column on slope, dot or arrow charts surfaced; the search tool returned none, and I did not open ft.com (paywalled).
- Arrow charts: no WaPo, FT or Guardian example found. A "how we made" post on WaPo arrow or dumbbell charts was searched for and not found.
- Waffles: no Guardian waffle or Guardian chart-component write-up found. The dotcom-rendering README only confirms the stack (TypeScript, React/Preact, Emotion, Storybook with Chromatic visual regression).
- Radial charts: only a Bloomberg radar "split legend" mention from the earlier pass. Nothing new.
- Beeswarm: no force parameters (strength, radius padding, iterations) from The Pudding, Bloomberg or Reuters.
- Reuters, Bloomberg: nothing new on these forms.

## 2. Fan charts, uncertainty bands and live uncertainty displays

### Takeaway

The best documented newsroom reasoning is the NYT's 2016 jittery gauge (Aisch), which the earlier pass already holds. New here: research on election-forecast displays (quantile dotplots with about 50-100 dots, "Plinko" animated dotplots) and the NHC cone's construction, which NYT and others reproduce. No fan-chart band specs from FT, Bloomberg or the Economist were found.

### Cited Findings

- Aisch said letting the dial fluctuate slightly "was more successful at conveying the uncertainty around our forecast than simply listing what those percentiles were." — [FlowingData, Showing uncertainty during the live election forecast (15 Nov 2016)](https://flowingdata.com/2016/11/15/showing-uncertainty-during-the-live-election-forecast/) (quote via search snippet; direct fetch returned 403)
- Quantile dotplots for election forecasts: a Northwestern study of the 2022 midterms tested single and dual quantile dotplots, dual histogram intervals and an animated "Plinko" dotplot; the model generated 20,000 equally likely outcomes and the dotplots used 100 dots. — [Swaying the Public? (Northwestern MU Collective)](https://mucollective.northwestern.edu/files/2023-US_midterm.pdf) (search snippet)
- CHI 2024 "In Dice We Trust" compared histogram intervals, text summary, quantile dotplot and Plinko dotplot, citing earlier work that Plinko improved understanding of uncertainty but slightly lowered trust in forecasts. — [ACM CHI 2024](https://dl.acm.org/doi/fullHtml/10.1145/3613904.3642371) (search snippet)
- Wilke's rule: use a small to moderate number of dots in a quantile dotplot, or they read as a continuum; his election example shows 50-dot and 10-dot versions. — [Fundamentals of Data Visualization, ch. 16](https://clauswilke.com/dataviz/visualizing-uncertainty.html) (search snippet)
- Hurricane cone: the NHC sizes the cone to capture about 67% of the past five years' forecast errors, so the storm centre should leave it about one-third of the time. For 2026 the revised graphic shades the whole cone grey instead of only the first three days, and an experimental version uses ellipses so uncertainty can stretch more in one direction. — [Skeptical Science summary of NHC changes](https://skepticalscience.com/hurricane-cone-uncertainty-graphics.html) (search snippet; secondary)
- NYT 2019 motion graphic by Alberto Cairo and Tala Schlossberg, "This Hurricane Map Doesn't Mean What You Think It Means", argues people near the cone edge prepare less although the edge is one possible track. A search summary says NYT's 2017 Irma page showed a cleaner cone beside individual ensemble traces (credited to the eagereyes blog). — [Maproom blog](https://www.maproomblog.com/2019/09/the-dangers-of-hurricane-maps-cone-of-uncertainty/) (search snippet)

### Inferences

- Where a library offers a band, the stated probability coverage (for example 67%, 50%/90%) should be a required label, because the NHC cone case shows readers assume 100%.
- For a discrete-outcome uncertainty readout, a quantile dotplot of about 20-100 dots is the evidence-backed form; it should be offered beside, not instead of, a band.

### Gaps

- No fan-chart spec from the FT, Bank of England-style charts, Bloomberg or the Economist (band count, opacity ramp, median line weight). Nothing found for NYT Upshot forecast fans.
- No primary NYT page on the cone or Upshot forecast was opened.

## 3. Scrub/hover readouts

### Takeaway

No newsroom documentation of scrub readouts (snapping, vertical cursor, stacked values) was found in this pass. The only reproducible items are the Datawrapper tooltip rules from the earlier pass and Reuters' Voronoi-based hover for spike maps.

### Cited Findings

- Reuters' spike-map module offers optional Voronoi-based mouse-event callbacks for tooltips. — [reuters-graphics/awesome-charts](https://github.com/reuters-graphics/awesome-charts) (from the earlier pass)
- Burn-Murdoch's step-by-step line chart carries a dynamic year label in the header with a "nice subtle animation on the text". — [Flourish, Masters series](https://flourish.studio/blog/masters-reveal-line-john-burn-murdoch/)

### Inferences

- Voronoi hit-testing is the documented way to make sparse points hoverable without small targets.

### Gaps

- Everything else on scrub readouts: snapping rules, readout position, mobile touch-drag behaviour, and what NYT, Bloomberg, FT or WaPo do. Not found.

## 4. Animated transitions and scrollytelling

### Takeaway

The scrollytelling mechanics are well documented. Position sticky for the pinned graphic, a trigger library only for steps, trigger line at mid-viewport (Scrollama default offset 0.5), and pixel offsets on mobile. No newsroom durations or easings were found anywhere; the sources explicitly omit them.

### Cited Findings

- The Pudding (June 2018): `position: sticky` with `top: 0` handles pinning "entirely" in CSS; JavaScript handles only step triggers (enter-view.js; Waypoints and Scrollama named as alternatives). Sticky elements stick and unstick only within their parent's bounds, so the parent sets the scroll length. Two layouts: graphic beside steps, and steps scrolling over the graphic. Scroll listeners are avoided because they are janky and can drift out of sync. Fallback: `@supports (position: sticky)`; without support the element stays static in source order. Repo: github.com/the-pudding/blog_scrollytelling-sticky. — [The Pudding, Easier scrollytelling with position sticky](https://pudding.cool/process/scrollytelling-sticky/)
- The Pudding's earlier six-library comparison: all implementations fire steps at mid-viewport (Waypoints `offset: '50%'`, ScrollStory `triggerOffset: halfViewportHeight`, ScrollMagic `triggerHook: 'onCenter'`). The roll-your-own version throttles the handler with `throttle(handleScroll, 50)`, renders in a `requestAnimationFrame` loop, and computes the step as `Math.abs(bbTop - halfViewportHeight) / height * numSteps`, floored and clamped to 0..numSteps-1. All chart changes go through one `graphic.update(step)`. The post excludes responsive solutions ("If you have the audacity to resize your browser, refresh the page") and gives no durations or easings. — [The Pudding, How to implement scrollytelling with six different libraries](https://pudding.cool/process/how-to-implement-scrollytelling/)
- Scrollama v3.2.0: default `offset` 0.5 (0 top, 1 bottom, or a pixel string such as "200px"); per-step `data-offset` since 3.0; `progress` option and `onStepProgress` report 0..1 through a step; `threshold` default 4 (px interval, smaller is finer); built-in ResizeObserver since 3.0; its mobile pattern sets the offset in pixels "so it doesn't jump around on scroll direction change"; avoid `vh` units because mobile viewport height changes during scroll and fires resizes; `onContainerEnter/Exit` deprecated in favour of `position: sticky`. — [Scrollama README](https://github.com/russellgoldenberg/scrollama)
- The Pudding's svelte-starter has `Scrolly.svelte`, `inView.js`, `checkScrollDir.js`, a custom `transformSvg.js` SVG-transform transition, `move.js`/`translate.js`, and `MotionToggle.svelte` to let readers turn motion off. No durations or easings are documented in it. — [the-pudding/svelte-starter](https://github.com/the-pudding/svelte-starter)
- Burn-Murdoch's animated excess-deaths/ICU line chart: each year's line is added one at a time so past years set an expectation, then the 2020-21 line enters as an outlier; the y axis rescales dynamically as data arrives. Flourish's rebuild: one chart per step as slides of the same template so Flourish tweens between them; earlier years faded to light grey `#ececec`, highlighted line dark red `#9c303d`; header text auto-coloured so the series name in the subtitle matches the line; final slide shades between 2020 and the five-year average. Slide durations were shortened "to avoid a long pause between animations"; no seconds or easing given. — [Flourish, Masters series: Burn-Murdoch](https://flourish.studio/blog/masters-reveal-line-john-burn-murdoch/)
- WaPo "simulitis" (14 Mar 2020): 200 dots bounce in a town; four scenarios; deaths left out so it did not feel "needlessly grim"; a scrollytelling version was one of three major drafts and was dropped because text and graphics appearing and disappearing made the graphics hard to see. About two weeks and 40-50 hours of work. Built on custom JavaScript; no mobile or rendering detail. — [Poynter](https://www.poynter.org/reporting-editing/2020/how-a-blockbuster-washington-post-story-made-social-distancing-easy-to-understand/)

### Inferences

- A step-driven chart should be a pure function of a step index (the Pudding's `update(step)` pattern), with the sticky parent doing the pinning, so it can be driven by scroll, buttons or keyboard.
- Mobile rule from Scrollama: pixel trigger offset, no `vh`, ResizeObserver rather than window resize.
- A reduced-motion switch is part of the Pudding starter; a library should honour `prefers-reduced-motion` the same way.
- The Burn-Murdoch pattern, add series one at a time, fade the earlier ones to a near-white grey, and keep the highlighted one saturated, is reproducible with an enter animation on one series and a context style on the rest.

### Gaps

- No documented durations, delays, stagger offsets or easing curves from any outlet. The Pudding and Flourish sources both omit them. FT, NYT, Bloomberg and Reuters transitions between chart types (morphing) were not found.
- Burn-Murdoch's own code or talk notes were not found; the Flourish piece is a rebuild, not his documentation. The GIJN tipsheet and Nightingale profile surfaced but were not opened.

## 5. Documented mobile adaptations for these forms

### Takeaway

Only generic items were found: Scrollama's pixel-offset pattern, the earlier pass's Datawrapper numbered annotations and Reuters tile-grid. Nothing form-specific for ridgelines, bump charts, slopegraphs, waffles or arrow charts.

### Cited Findings

- Scrollama mobile pattern and `vh` warning (section 4). — [Scrollama README](https://github.com/russellgoldenberg/scrollama)
- The Pudding's `MotionToggle` and sticky `@supports` fallback (section 4). — [svelte-starter](https://github.com/the-pudding/svelte-starter), [Pudding sticky post](https://pudding.cool/process/scrollytelling-sticky/)

### Inferences

- No evidence either way on how outlets shrink ridgelines or slopegraphs; design decisions here would be our own.

### Gaps

- Mobile behaviour of beeswarm (see earlier note: ONS template swarm grows taller), bump chart label lanes, slopegraph label stacking, waffle cell count at narrow widths. None found for a named newsroom.

## Suggested next searches (not run)

- pudding.cool/process posts on specific story builds and the-pudding GitHub story repos (grep for `forceSimulation`, `forceCollide`) to get beeswarm parameters.
- Guardian: github.com/guardian/interactive-atoms and guardian/dotcom-rendering for chart components.
- ft.com/chart-doctor articles on slope charts; Burn-Murdoch talks (OpenVis, Outlier) transcripts.
- Reuters Graphics Svelte modules (reuters-graphics.github.io/graphics-kit docs) for chart module defaults.
- Nightingale / Source / OpenNews write-ups on WaPo and NYT election-forecast graphics.
