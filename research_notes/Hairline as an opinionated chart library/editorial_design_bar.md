# Design-capability bar for an opinionated editorial chart library (Hairline)

Scope note: the FT history report (reports/Old school FT chart craft.md) was read for headings only and is not repeated. Hairline context taken from README.md and docs/BRIEF.md: Inter only (labels measured for Inter), sentence case, three strokes, hatch/stipple/halftone textures, single --hero ink, Pink/Paper/Dark modes, labels on marks, no prose inside charts, host sets --paper and --hero.

Coverage caveat: about 17 searches/fetches were run. Reuters Graphics, Bloomberg, ONS, Nightingale/Elijah Meeks, Tremor and shadcn charts, moiré/DPR research and label-thinning algorithms for dense series were not reached and are listed as gaps. Nothing below is drawn from memory without a link unless marked as inference.

## 1. What newsroom and style-guide systems require, and what a library must automate

### Takeaway

Across Datawrapper, the Economist, Urban, BBC and IBCS, the converging rules are: label directly instead of using a legend, keep one emphasis colour on grey, put annotation in a two-level text hierarchy, state units in several places, avoid rotated labels, and keep scales consistent across charts. Libraries should automate geometry and defaults (label collision, tick choice, number abbreviation, responsive degradation); authors should supply words (annotations, headlines, source) and the choice of emphasis.

### Cited Findings

- Datawrapper: "Place the words that explain your chart elements as close to those elements as possible"; replace the colour key with direct labels. Datawrapper does this automatically on desktop for line, pie and donut charts. — [Datawrapper, text in data visualizations](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper annotate three things: design elements that need explaining, data to be noticed (outliers), and context for why values look as they do (e.g. a recession). — [same](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper annotation typography: only two clearly different hierarchy levels (example 12px grey and 14px black); left-align notes longer than about 10 words; add a background-coloured text outline where text sits over gridlines. — [same](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper units rule: repeat units in axis labels, tooltips and annotations, not only the description; write 20k/20m/20b instead of "in millions"; name the category in tooltips ("3.4% unemployed"). — [same](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper number formatting: no unnecessary precision, abbreviate (12,831 to 12.8k), drop trailing zeros with a format like `0.[0]%`, and put exact figures elsewhere (tooltip, download, text). — [same](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper axis rule: never rotate axis labels; shorten them, or change chart type (column to bar). Do not shrink or condense text to fit; move small text to tooltips or shorten wording. — [same](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper mobile behaviour: the colour key returns at the top on small screens; least important annotations can be hidden or moved below the chart. A newer feature numbers annotations on small screens and moves them below the chart, and scales annotation width relative to the chart. — [text post](https://www.datawrapper.de/blog/text-in-data-visualizations); [responsive annotations](https://www.datawrapper.de/blog/better-more-responsive-annotations-in-datawrapper-data-visualizations)
- Datawrapper had to build an algorithm to show as many line-chart value labels as wanted while avoiding overlap with other labels and annotations; multiple-lines charts let annotations and range highlights repeat across panels and be dragged between panels. — [Datawrapper 2024 recap](https://www.datawrapper.de/blog/feature-recap-2024)
- Datawrapper map-annotation advice: remove extra city labels because they steal attention from annotations; reuse data colours for annotations so they sit back into the chart. — [Fix my chart: map annotations](https://www.datawrapper.de/blog/fix-my-chart-map-annotations)
- Economist chart guide (2017, v1.2): top rule and red tag rectangle; y-axis on the right with no ticks, only major gridlines, tick labels sitting on the gridlines; direct labels at line ends in each series' colour with the main series bold; source bottom-left at reduced opacity; short title above a plain subtitle naming the measure. Summarised from secondary write-ups of the guide. — [Economist chart style guide PDF (hosted copy)](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf); [ggthemes theme_economist](https://rdrr.io/cran/ggthemes/man/theme_economist.html); [Display Studies](https://displaystudies.medium.com/visual-credibility-how-to-make-an-economist-style-chart-with-simple-tools-b08f2f8cfdb7)
- Urban Institute style guide: sentence-style capitalisation for all in-figure text; when bar data labels sit at bar ends, omit y-axis labels and gridlines; circles for line-chart markers; 1pt black rule under table headings and last row, no other borders by default. Updated in 2024 with branding, best practice and accessibility. — [Urban guide](http://urbaninstitute.github.io/graphics-styleguide/); [PolicyViz on the update](https://policyviz.com/2024/11/05/introducing-the-urban-institute-data-visualization-style-guides-open-source-excel-add-in/)
- Urban "Do No Harm" guides: order labels by sample size or magnitude, people-first language, a separate accessibility guide. — [Urban Do No Harm](https://www.urban.org/research/publication/do-no-harm-guide-applying-equity-awareness-data-visualization)
- BBC bbplot: `bbc_style()` is meant to get you "90% of the way" and leave tweaks to the author; `finalise_plot()` handles logo and export dimensions; font sizes are deliberately bumped up for mobile legibility; left-aligned titles; horizontal gridlines only (the last two from third-party summaries). — [BBC R cookbook](https://bbc.github.io/rcookbook/); [BBC V&DJ Medium](https://medium.com/bbc-visual-and-data-journalism/how-the-bbc-visual-and-data-journalism-team-works-with-graphics-in-r-ed0b35693535)
- IBCS: consistent scales for same units ("Use the same scales", rule CH 4), do not cut axes, scaling lines when scales must differ across charts; time on the horizontal axis; integrate series and value labels and avoid value axes and gridlines; scenario notation is solid for actual, outlined for plan, hatched for forecast; unify good/bad variance colours; titles name unit, measure and period. ISO 24896:2026 now covers the notation part. — [IBCS](https://www.ibcs.com/IBCS/); [IBCS standards](https://www.ibcs.com/standards/page/3/)
- FT Visual Vocabulary: nine relationship categories (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow); each type lists common misreadings; D3 templates exist. — [FT chart-doctor](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md); [GIJN](https://gijn.org/resource/document-of-the-day-visual-vocabulary/)
- Responsive annotation pattern from research: on small screens move title/subtitle outside the chart, keep only the biggest items labelled, and push other annotations to a space below. — [EU Data Visualisation Guide](https://data.europa.eu/apps/data-visualisation-guide/responsiveness-adapting-annotations-axes-and-legends)

### Inferences

- Automate (library): collision-free direct labels, tick density and tick format, number abbreviation with trailing-zero trimming, unit repetition via one `unit` prop that feeds axis, labels and accessible text, same-scale enforcement across small multiples, responsive degradation of annotations, source/note line placement, text halo on gridlines (Hairline already has `t-halo`).
- Leave to author: annotation wording, which series is the hero, headline/subtitle, what counts as an outlier worth a note. A library should make these one-line props, not free-form layout.
- Hairline's "no prose inside charts" rule departs from the Datawrapper/Economist/Cox consensus that annotation is the editorial core. This is a deliberate gallery-level stance; for a library used with other people's data it will need an answer (see section 6).
- Hairline's existing choices (sentence case, direct labels, zero line distinct from faint grid, one frame) already match Urban, Datawrapper and Economist rules. The gaps are source/note line, units propagation and annotation primitives.

### Gaps

- Reuters Graphics, Bloomberg and NYT Upshot published style rules: no primary guide found in these searches (only the Economist, Urban, BBC, FT vocabulary and Datawrapper).
- ONS guidance not searched.
- Economist guide content here comes from secondary summaries of the 2017 PDF; the PDF itself was not opened.

## 2. Robustness under arbitrary data

### Takeaway

Opinionated libraries stay presentable by degrading by rule (hide, thin, move, switch chart type) instead of squeezing: Datawrapper shortens or switches type instead of rotating, relocates annotations, and runs a collision algorithm for labels. Observable Plot's lesson is that great defaults are the product, but polish (tooltips, legends, responsiveness) often falls to the host.

### Cited Findings

- Datawrapper's rule set (no rotation, no condensing, switch chart type, move text to tooltips) is a degradation ladder rather than a resize. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Datawrapper: if you need more than seven colours consider another chart type or grouping categories. — [Datawrapper, colors](https://www.datawrapper.de/blog/colors)
- Observable Plot's selling point is defaults: specify data and encodings and Plot works out the rest. Its weaknesses (Gregor Aisch's review): comic-like fixed tooltips and limited legend customisation. — [Why Plot?](https://observablehq.github.io/plot/why-plot); [vis4.net review](https://www.vis4.net/blog/2023/09/observable-plot-review/)
- TanStack's comparison lists Plot's interaction, theming and responsiveness as host-owned; Recharts is React-native SVG; Chart.js is canvas with plugins. Bundle sizes (gzip) roughly: Chart.js 46-60 kB, Plot 85-94 kB, Recharts 157-172 kB. — [TanStack comparison](https://tanstack.com/charts/latest/docs/comparison)
- Label placement algorithms: simulated annealing (D3-Labeler; label-locator in TypeScript, non-mutating, configurable bounds; avoid-overlap with a "choices" mode that tries author-given positions), vertical-only relaxation for line-end labels, force layout with attraction/repulsion, and a drop/shrink approach (d3.labeling). — [D3-Labeler](https://github.com/tinker10/D3-Labeler); [label-locator](https://www.npmjs.com/package/label-locator); [avoid-overlap](https://github.com/kevinschaul/avoid-overlap)
- Recharts is praised for fast React integration but criticised for limited deep look-and-feel customisation; SVG libraries degrade at large point counts while canvas holds up. — [Kyle Gill](https://www.kylegill.com/essays/react-chart-libraries/); [PkgPulse 2026](https://www.pkgpulse.com/guides/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026)

### Inferences

- A priority-ordered label system (hero first, then extremes, then rest, dropping losers rather than overlapping) fits Hairline better than annealing, and "choices" mode matches the pixel-snapped hairline idea (few candidate slots, no free float).
- Engraved textures add a robustness risk the incumbents lack: texture pitch is fixed in pixels, so thin bars (many categories, dense series) cannot hold a hatch. The library needs a minimum-mark-size rule that falls back from texture to solid or to rule-only, automatically.
- Long labels: measure-then-decide among truncate with leader, wrap to two lines, or switch orientation (column to bar) following Datawrapper.
- Outliers and negatives: the zero-line-sharply-distinct convention already helps; need an explicit axis-break policy (IBCS says do not cut axes).

### Gaps

- No source found on automatic tick selection algorithms (d3 ticks, Wilkinson/Extended) or dense-time-series thinning; this is inference territory.
- No published test of how engraved/hatched marks fail at small sizes.

## 3. Pattern and texture fills

### Takeaway

Practitioner consensus supports patterns as a redundant second channel for colour-blind readers, but I found no user study measuring chart-reading accuracy with textures versus colour. The documented risks are visual noise, cognitive load and patterns altering perceived lightness.

### Cited Findings

- Highcharts pattern-fill module (since v6.1.0): ten predefined patterns, usable wherever a colour option is, via `patternIndex`, or custom SVG paths/images. — [Highcharts pattern fills docs](https://www.highcharts.com/docs/chart-design-and-style/pattern-fills)
- Highcharts' own accessibility guidance warns patterns can be distracting and add cognitive load; recommends subtle patterns. Cites 8% of men and 0.5% of women as colour-blind (Color Blind Awareness). — [Highcharts accessibility best practices](https://www.highcharts.com/blog/best-practices/best-chart-accessibility-practices/)
- Datawrapper: "Using patterns well is hard, but getting it right can be worth it"; patterns change perceived brightness (thin white lines made green look lighter). — [Datawrapper, colorblindness part 2](https://www.datawrapper.de/blog/colorblindness-part2)
- Same post: get it right in black and white (vary lightness); remove colour keys in favour of direct labels; simulators "give you an impression, but that's it", so add a second encoding (position, shape, pattern); too many shapes look like confetti; separate overlapping similar-colour lines with dashes or widths. — [same](https://www.datawrapper.de/blog/colorblindness-part2)
- WCAG 2.1 level A requires something other than colour to convey meaning; Smashing Magazine warns careless patterns invite Tufte's "chartjunk". — [Smashing, 2024](https://www.smashingmagazine.com/2024/02/accessibility-standards-empower-better-chart-visual-design/)
- Texture-for-CVD study exists (Computers in Human Behavior, c.2018) that derived texture composition principles and ran discrimination tests with CVD and normal viewers; numeric results were not visible in the excerpt. — [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0747563218300864)
- Texture count limits: a 2025 study found two vs three texture contrasts easily distinguished but performance falls rapidly as set size grows. — [PubMed 40793547](https://pubmed.ncbi.nlm.nih.gov/40793547/)
- IBCS already encodes meaning with fill style: solid actual, outlined plan, hatched forecast. — [IBCS](https://www.ibcs.com/IBCS/)
- Colorblind.io claims about 40% of default library palettes fail basic CVD tests with no source; treat as unverified. — [Colorblind.io](https://colorblind.io/guides/data-visualization)

### Inferences

- Hairline's design (density/angle encodes value on one of two ladders; tone family for categories) is stronger than the pattern-index approach of Highcharts, which assigns arbitrary patterns. Ordered ladders let texture carry magnitude, the way halftone does in print, so it is a first channel for ordinal data, not just decoration.
- Limit categorical textures to roughly four to five distinguishable families per chart (consistent with the set-size result and Datawrapper's "three or four" for shapes); beyond that, group or switch chart type.
- Must test: lightness balance across ladder steps (patterns shift perceived tone), pitches that alias at fractional DPR or browser zoom (Hairline's pixel-staircase diagonals are a good defence, but only at integer DPR), and print/PDF export. Moiré between adjacent patterns of near-equal pitch is a known risk for halftone-like screens; I found no source, so this is untested reasoning.
- Hairline's rule of thumb from the FT report (hatch never the only channel) is consistent with all sources here.

### Gaps

- No accuracy study of texture vs colour in charts for CVD readers found.
- No source on moiré, vibration, zoom or DPR artefacts in SVG patterns; Bertin, Brinton and Du Bois precedents were not searched here (history excluded by brief).

## 4. Typography and text measurement

### Takeaway

Measuring for one face is a legitimate trade for pixel-exact label placement, but it should be explicit: expose a font-ready gate and re-measure after fonts load, and treat Inter variants as the supported range. Pretext shows the current canvas-based approach and its sharp edges.

### Cited Findings

- Pretext (Cheng Lou): `prepare(text, font)` measures segments via canvas `measureText` once; `layout(prepared, maxWidth, lineHeight)` is pure arithmetic. `prepareWithSegments`, `layoutWithLines`, `measureNaturalWidth`, `walkLineRanges` support manual rendering to canvas, SVG, WebGL. — [Pretext README](https://github.com/chenglou/pretext)
- Limits: `system-ui`/`-apple-system` unsafe on macOS; variable-font weight works only via the canvas font string, while `font-variation-settings`, `font-feature-settings`, `font-variant-numeric` and `font-optical-sizing` are unsupported; letterSpacing must be a pixel number; px sizes only, whole pixels preferred (Firefox rounds); prepare only after the font loads; call `clearCache()` after font load or zoom change; user minimum-font-size can enlarge painted text; Node and jsdom throw without an `OffscreenCanvas` shim. — [Pretext README](https://github.com/chenglou/pretext)
- TanStack Virtual's integration guide recommends caching prepared text and clearing caches after `document.fonts.ready`. — [TanStack Virtual](https://tanstack.com/virtual/v3/docs/pretext)
- Datawrapper's rule: never condense text to fit. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)

### Inferences

- Critical for Hairline: tabular figures are `font-variant-numeric`/feature settings, which Pretext-style canvas measurement ignores. Because tabular figures have fixed advance widths, number labels can be measured with canvas using a fonts that already defaults to tabular in the canvas font string, or by a per-digit width table for Inter's tnum; label widths for numbers should be computed from a digit-width constant, not measured. This must be verified against Inter's actual feature behaviour.
- Server rendering: the README already notes charts measure width in the browser; a precomputed Inter width table (per glyph, per size, tnum) gives deterministic SSR with no canvas and no layout shift. This is the main argument for staying single-face.
- Offering other faces: a `measure` adapter hook (default Inter table, optional canvas measurer) is a middle path; document that other faces may crowd, as the README already says.

### Gaps

- Variable-font optical sizing in Inter (opsz axis) and its effect on measured widths: not researched.

## 5. Colour systems

### Takeaway

The one-hero-on-grey model Hairline uses is the mainstream editorial emphasis model (Datawrapper, Bloomberg example, Economist main series bold). The hard cases are categorical needs beyond ~5-7, and dark mode, where Datawrapper's approach is automatic lightness inversion with equal contrast.

### Cited Findings

- Datawrapper: grey as the most important colour, reserve highlight colour for the key data; more than seven colours means change chart type or group; style-guide palettes of 3-10 colours with a defined order; CVD-filtered palettes tend to cap at about four. — [Datawrapper, colors](https://www.datawrapper.de/blog/colors); [10 ways to use fewer colors](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations); [palette guide](https://www.datawrapper.de/blog/create-good-color-palettes); [style-guide colours](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)
- Datawrapper automatic dark mode: finds colours for chart elements, gridlines, text, keys and annotations; very dark colours on white become very bright on black; keeps contrast equal between modes; dark mode allows highly saturated bright hues; custom themes can define per-colour dark counterparts. — [Datawrapper dark mode](https://www.datawrapper.de/blog/dark-mode-for-embedded-visualizations); [colour style-guide post](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)
- Research on dark-mode palette adaptation that preserves semantic mappings exists (Chameleon, arXiv 2512.00516). — [arXiv](https://arxiv.org/html/2512.00516v2)
- Economist categorical series colours: red #DB444B, blue #006BA2, cyan #3EBCD2, green #379A8B, plus more. — [ggthemes economist](https://rdrr.io/cran/ggthemes/man/theme_economist.html)

### Inferences

- Hairline's even OKLCH ramp `--l0..--l6` between paper and ink is the right structure: lightness-ordered tones are CVD-safe by construction (Datawrapper: "get it right in black and white"). For many series, use ramp step plus texture family plus direct label rather than new hues; this is the engraved answer to the categorical-palette problem.
- A library-level contract for hosts who override `--paper` and `--hero`: regenerate `--l*` from those two (OKLCH interpolation) and run a contrast check; flag a hero that is too close in lightness to the ramp. Dark mode should be a rebuilt ramp, as Hairline already does.
- Alert colour should stay a single exceptional mark (IBCS: unify good/bad colours).

### Gaps

- No CVD-simulation tooling or OKLCH-specific literature gathered.

## 6. Annotation and storytelling

### Takeaway

Annotation is treated as the core of editorial charting (Amanda Cox's often-quoted line), and Datawrapper invests in responsive, draggable, repeatable annotations. A newsroom-grade library needs annotation primitives even if the gallery shows none.

### Cited Findings

- Amanda Cox: "The annotation layer is the most important thing we do… otherwise it's a case of here it is, you go figure it out" (original venue unsourced in the EU guide); at Columbia 2015 she framed work as Scale, Context, Pattern, Annotation layer, with annotation kept minimal; "graphs are stronger when they say something". — [EU guide](https://data.europa.eu/apps/data-visualisation-guide/visual-annotations-introduction); [Columbia recap](https://www.ambriente.com/blog/2015/02/24/amanda-cox-at-columbia-university/)
- Cox at Datawrapper 2024: use verbs in headlines; Datawrapper's annotation was designed for serious charts. — [Datawrapper keynote](https://www.datawrapper.de/blog/amanda-cox-bloomberg)
- Datawrapper small multiples: annotations and range highlights can repeat across panels. — [2024 recap](https://www.datawrapper.de/blog/feature-recap-2024)
- Datawrapper line charts: direct labels on the right with optional connector lines or line-coloured labels. — [Datawrapper academy](https://www.datawrapper.de/academy/customizing-your-line-chart)

### Inferences

- Minimum annotation set: point note, range highlight, reference line (with label), connector/leader, and an "annotation group" that follows responsive rules (numbered, moved below). Notes should take data coordinates, not pixels, and be resolved by the same collision system as labels.
- Reconciling "no prose in charts": make annotations a distinct, optional layer rendered in the same type roles, off in the gallery but available to hosts; keep titles/sources in an adjacent frame component (title, subtitle, source, note), as BBC does with `finalise_plot()`.
- Highlight states (hover/focus/scroll step) can reuse the hero model: step sets one series to hero, others to grey ramp. Scrollytelling support likely means a controlled `highlight` prop plus animated transitions; no source consulted on d3-annotation or Flourish.

### Gaps

- d3-annotation, Flourish and scrollytelling libraries not examined.
- Reuters and Bloomberg annotation practice not found.

## 7. Incumbent defaults and what designers praise

### Takeaway

Evidence found is thin on "dashboard look" critiques as such; what exists praises Plot's defaults and Datawrapper's judgement, and notes Recharts/Chart.js trade customisation for speed.

### Cited Findings

- See section 2 for Plot, Recharts, Chart.js findings. Chart.js is often credited with attractive defaults but limited flexibility for advanced users. — [Open Visualization Academy](https://openvisualizationacademy.beehiiv.com/p/observable-plot-simplicity-meets-expressiveness-in-charts)
- Datawrapper's decision process for features (annotation upgrade case study) is documented by its visualization lead. — [Elana Levin Schtulberg](https://www.datawrapper.de/blog/elana-levin-schtulberg-how-we-decide-which-features-to-add)
- Fewer-colours and direct-label defaults are Datawrapper's answer to default-legend charts. — [Datawrapper colour key post](https://www.datawrapper.de/blog/color-keys-for-data-visualizations)

### Inferences

- The default-look distinction Hairline can claim: legend-free, grid-quiet, hero-on-grey, annotation-ready, text-measured. Incumbent defaults (legend boxes, rainbow palettes, rounded tooltips, entrance animation on every load) are exactly what newsroom guides remove.
- Tremor and shadcn charts (Recharts wrappers) were not researched; I cannot cite designer praise or critique for them.

### Gaps

- Tremor, shadcn charts, ECharts critiques: not found in these searches.
- No source quantifying how often default dashboard looks are criticised; claims about "dashboard look" are the commissioning brief's framing, not verified here.

## Suggested capability bar (synthesis, inference)

1. Direct labels with deterministic collision handling and a drop-by-priority fallback.
2. A degradation ladder per chart: label, thin ticks, shorten, switch orientation, drop texture to solid below a minimum mark size.
3. One `unit` and one number-format contract that flows through axes, labels, annotations, accessible text.
4. Same-scale guarantees for small multiples (IBCS CH 4) and visible scale breaks.
5. Hero-on-ramp emphasis, at most about five texture families per chart, ordered ladders for ordinal data.
6. Annotation layer (data-coordinate note, range, reference line, leader) with responsive rules.
7. Frame component: title, subtitle, source, note, as separate from the chart SVG.
8. Font readiness and re-measure hook; deterministic width table for SSR.
9. Accessible text alternative, and a texture-versus-solid test at DPR 1, 2, 3 and zoom steps.
