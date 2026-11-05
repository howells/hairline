# Hairline chart coverage gaps against the leading taxonomies and libraries

Method note. Hairline facts come from the repo at /Users/danielhowells/Sites/hairline (src/index.ts, src/charts/*, src/gallery/about.json, src/schema/registry.ts, README.md), read 2026-11-03, not modified. Peer-library facts come from the fetched pages cited inline. Several peer sites refused or returned only navigation (Datawrapper marketing pages, Observable Plot docs site 429, Flourish, RAWGraphs home, visx gallery); where so, I used secondary pages or GitHub directory listings and say so. Rankings of "how often needed" are my inference, not measured; no source gives usage frequency for chart types.

## 1. Which chart types do the leading taxonomies and libraries cover (the union)?

### Takeaway

The union is about 110 distinct forms, but most collapse into roughly 15 families. The taxonomies agree on a core (bar/column, line, area, scatter/bubble, histogram, box, pie/donut, treemap, heatmap, choropleth, Sankey, network) and the libraries add a second ring (bump, marimekko, sunburst/icicle, beeswarm, hexbin, horizon, gantt, alluvial, funnel, radar, gauge, waffle, arrow/range plots, error bars/bands).

### Cited Findings

- FT Visual Vocabulary, by job. Deviation: diverging bar, diverging stacked bar, spine chart, surplus/deficit filled line. Correlation: scatterplot, line+column, connected scatterplot, bubble, XY heatmap. Ranking: ordered bar/column, ordered proportional symbol, dot strip plot, slope, lollipop. Distribution: histogram, boxplot, violin, population pyramid, dot strip, dot plot, barcode plot, cumulative curve. Change over time: line, column, line+column, stock price, slope, area, fan chart (projection), connected scatterplot, calendar heatmap, Priestley timeline, circle timeline, seismogram. Magnitude: column, bar, paired column/bar, proportional stacked bar, proportional symbol, isotype, lollipop, radar, parallel coordinates. Part-to-whole: stacked column, proportional stacked bar, pie, donut, treemap, voronoi, arc, gridplot (waffle), venn, waterfall. Spatial: choropleth, proportional symbol map, flow map, contour map, equalised cartogram, scaled cartogram, dot density, heat map. Flow: Sankey, waterfall, chord, network. The README's Uncertainty, Animation, Interactivity, Map projections and Colour headings are to-do reading lists, with no chart types. — [FT Visual Vocabulary README](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md)
- Data Viz Catalogue indexes 60 types, including ones not in the FT list: bullet graph, radial bar/column, span chart, error bars, marimekko, proportional area, sunburst, nightingale rose, dot matrix, venn, stream graph, spiral plot, timeline, timetable, calendar, gantt, candlestick, OHLC, kagi, point & figure, density plot, stem & leaf, tally chart, parallel sets, arc diagram, non-ribbon chord, tree diagram, flow chart, bubble map, connection map, dot map, flow map, word cloud. — [Data Viz Catalogue index](https://datavizcatalogue.com/)
- Datawrapper chart IDs (developer docs, "updated about 19 days ago" per search snippet): bars (`d3-bars`), split bars, stacked bars, grouped bars, bullet bars, dot plot, range plot, arrow plot, column, grouped column, stacked column, multiple columns, area, line, multiple lines, dual axis, waterfall, pie, donut, multiple pies, multiple donuts, election donut, scatter, table, choropleth, symbol map, locator map. Annotations (text, range and line highlights) were later added to bar, stacked, grouped, split and bullet bars, dot plots, range plots and arrow plots. — [Datawrapper visualization types](https://www.datawrapper.de/developer/visualization-types) (as summarised in search results); [Arrow and range plots](https://www.datawrapper.de/blog/new-arrow-and-range-plots); [Annotations in bar, range and dot charts](https://www.datawrapper.de/blog/annotations-in-bar-charts). The Datawrapper marketing pages named only seven categories and "23 chart types" without listing them ([chart types page](https://www.datawrapper.de/charts/chart-types)); the count conflicts with the "20 chart types" figure in an older search snippet.
- Flourish templates (50+ claimed): line/bar/pie, bar chart race, hierarchy, survey, line chart race ("horserace"), bubble, parliament chart, Sankey (classic and alluvial), sports race, network graph, marimekko (classic and "bar mekko"), gauge, scatter, treemap, radar. I could not retrieve the full template index; this list is partial. — [Flourish help centre via search](https://helpcenter.flourish.studio/hc/en-us/categories/8636109131791-Charts); [Flourish marimekko](https://flourish.studio/visualisations/marimekko-charts/); [template IDs in Canva Flourish changelog](https://www.canva.dev/opensource/flourish-charts/changelog/)
- Observable Plot marks (GitHub docs/marks): area, arrow, auto, axis, bar, bollinger, box, cell, contour, delaunay, density, difference, dot, frame, geo, grid, hexgrid, image, line, linear-regression, link, raster, rect, rule, text, tick, tip, tree, vector, waffle. Transforms: bin, centroid, dodge, filter, group, hexbin, interval, map, normalize, select, shift, sort, stack, tree, window. — [Plot docs/marks](https://github.com/observablehq/plot/tree/main/docs/marks); [Plot docs/transforms](https://github.com/observablehq/plot/tree/main/docs/transforms). Faceting is a core Plot feature, but I did not retrieve the facet page (docs site returned 429).
- Vega-Lite primitive marks: area, bar, circle, line, point, rect, rule, square, text, tick, geoshape; composite marks: boxplot, errorband, errorbar; arc, image, trail appear in the sidebar. Faceting, layering, concatenation and repetition are part of the grammar (not retrieved from the page; known from the spec). — [Vega-Lite mark docs](https://vega.github.io/vega-lite/docs/mark.html)
- ECharts core series: line, bar, pie, scatter, effectScatter, radar, tree, treemap, sunburst, boxplot, candlestick, heatmap, map, parallel, lines, graph, sankey, funnel, gauge, pictorialBar, themeRiver, chord, custom; GL adds bar3D, line3D, lines3D, scatter3D, scatterGL, surface, map3D, polygons3D, graphGL, flowGL. — [ECharts llms.txt index](https://echarts.apache.org/en/llms.txt)
- Nivo (19 components on the front page, possibly a featured subset): area bump, bar, bump, calendar, chord, choropleth, circle packing, icicle, line, marimekko, pie, radar, radial bar, Sankey, stream, sunburst, swarm plot, treemap, voronoi. — [nivo.rocks](https://nivo.rocks/)
- visx packages (barrel file and npm): a11y, annotation, axis, brush, chart, chord, curve, delaunay, drag, geo, glyph, gradient, grid, heatmap, hierarchy, kernel, legend, marker, network, pattern, sankey, shape, stats, text, threshold, tooltip, voronoi, wordcloud, xychart. visx is primitives, so it has few named charts. — [visx barrel file and npm listing via search](https://github.com/airbnb/visx/blob/master/packages/visx-visx/src/index.ts)
- RAWGraphs, current list assembled from the wiki and tutorials: alluvial, beeswarm, bump, hexbin, horizon, streamgraph, sunburst, boxplot, pie, bar/multiset bar, Sankey, radar, line, matrix plot, linear dendrogram, circular dendrogram, gantt, convex hull, contour, voronoi, treemap, circle packing, parallel coordinates, scatter, area. The 1.x list had 21 charts. — [RAWGraphs wiki, Available Charts](https://github.com/rawgraphs/rawgraphs-app/wiki/Available-Charts) (via search result); [RAWGraphs learning](https://rawgraphs.github.io/learning/). I could not fetch the current app's chart picker.

### Inferences

- Forms that appear in three or more independent sources are the safest "comprehensive kit" members: bump (Nivo, RAWGraphs, FT as slope/ranking), marimekko (Catalogue, Flourish, Nivo), sunburst/icicle (Catalogue, ECharts, Nivo, RAWGraphs), beeswarm (Nivo, RAWGraphs, Plot dodge), hexbin (Plot, RAWGraphs), horizon (RAWGraphs; FT does not list it), gantt (Catalogue, RAWGraphs), funnel (ECharts; Flourish via templates), gauge (ECharts, Flourish; Catalogue has bullet), radar (FT, Catalogue, ECharts, Nivo, RAWGraphs, Flourish), error bars/bands (Catalogue, Vega-Lite, Plot), waffle (FT gridplot, Plot, Catalogue dot matrix), arrow/range (Datawrapper, Plot arrow).
- The FT list is the editorial reference and Hairline already carries its nine jobs in the registry, so FT-listed forms are the gap list that most matters to Hairline's positioning.

### Gaps

- Complete Flourish and RAWGraphs current template lists, the Plot facet docs, and the Vega-Lite example gallery were not retrieved (site blocks or navigation-only responses).
- No source gives measured usage frequency of chart types.

## 2. What does Hairline already cover, partly cover, or not cover?

### Takeaway

Hairline's roughly 90 gallery charts (19 lupi, 17 basics, 20 glance, 3 big, 19 board, 10 forms, 4 originals, 2 maps, plus palette sheets) cover most of the FT Visual Vocabulary under idiosyncratic names. Only six charts are schema-validated packaged charts with subpaths; every gallery chart except the board dashboards (other than Slope) is exported from src/index.ts. Weakest areas: dedicated flow/geo variants, hierarchy-radial forms, time-interval forms, density 2D, and uncertainty.

### Cited Findings

Hairline inventory (all local source; chart ids from src/gallery/about.json, components from src/charts/_/entries-_.tsx):

- Public surface: src/index.ts exports all lupi, basics, glance, big and forms charts and the four originals, plus only `Slope` from board; maps via `@howells/hairline/maps` (`USChoropleth`, `WorldChoropleth`, src/maps.ts). Only six charts have zod schemas and subpath entries (RungBars, HairlineLine, HairlineArea, DumbbellQueue, PlumbScatter, Slope) — /Users/danielhowells/Sites/hairline/README.md. The nineteen board dashboards (D1 to D19: time-lines, stacked-area, h-bars, heatmap, sankey, scatter, spark-grid, station-strip, monthly-bars, dumbbell) are gallery presets in src/charts/board/presets.tsx, not exported.
- Registry uses the FT nine jobs (`Job` type) — src/schema/registry.ts.

Coverage map (taxonomy form -> Hairline):

- Bar/column, ordered bar -> RungBars (bar of stacked ticks), TickRows (F5), ChunkyBars (G3), board h-bars. Covered.
- Paired/grouped bars -> PairedRungs (F6). Covered.
- Stacked / proportional stacked -> StackedRungs (F7), HatchedStack (O10 land cover by nation). Covered.
- Diverging bar -> DivergingBar (G10). Covered. Diverging stacked / spine / population pyramid -> not found. Partly (population pyramid is a back-to-back variant of diverging bar; no pyramid API seen).
- Lollipop -> BarcodeLollipop (L3, high/low water per day, partly a range lollipop). Covered.
- Dumbbell / range / arrow -> DumbbellQueue (F12), board dumbbell, StationStrip. Range and dumbbell covered; arrow plot not found.
- Slope -> Slope. Covered. Bump / rank over time -> FeatureRank (O3, ranked bands across five years), RankStrip (G21), BarRace (G16, animated). Covered in three idioms, no plain bump line chart.
- Line, multi-line -> HairlineLine (F2), board time-lines. Covered. Area -> HairlineArea (F3). Stacked area -> board stacked-area. Streamgraph -> StreamRibbon (F16), DynamicStream (G17 live rolling line, invented data). Area difference / surplus-deficit filled line -> AreaDifference (O5). Covered.
- Line + column -> RainfallDualArea (G8, rain hung from top, river from floor), board dual-series. Partly; no generic dual-axis.
- Candlestick -> Candlestick (F17; OHLC variant presumably same). Covered. Kagi, point & figure: not found.
- Waterfall -> RungWaterfall (F9). Covered.
- Cumulative curve -> DrawIn (G18, running total animated), HourglassStream (L13, reverse cumulative). Partly.
- Histogram -> RungHistogram (F14). Boxplot -> TickBox (F15, five-number plus outliers). Violin -> Violin (G19). Density / ridgeline -> Ridgeline (L19). Barcode plot -> BarcodeLollipop. Dot strip / strip -> SingleAxis (G14), JitterStrip (G15, Easter dates), StationStrip. Dot plot -> DotCascade (L2). Beeswarm -> JitterStrip appears to be a jittered strip (per brief it is strip/beeswarm; not verified whether it packs). Covered or partly.
- Scatter -> PlumbScatter (F8), ScatterMorph (G9, animated bubble), board scatter. Bubble -> ScatterMorph, BubbleAlmanac (L9, size plus core plus ring). Covered. Connected scatter: not found.
- Heatmap / XY heatmap -> DotHeat (F10), MatrixHeat (L16), MatrixHeatGlance (G20), board heatmap, ArcMatrix (L4, bubble grid). Covered. Calendar heatmap -> CalendarHeat (L17). Covered. Radial calendar -> RadialYear (O7), BrushedOverview (O8).
- Pie/donut -> TickDonut (F4). Polar area / nightingale-like -> BigSlice (G13: angle=share, radius=intensity). Covered.
- Treemap -> NestedTreemap (F13). Circle packing -> CirclePack (O9?, forms). Tree / dendrogram -> TreeLR (G7), ThreadTriptych (B3). Covered. Sunburst/icicle: not found.
- Waffle / gridplot / dot matrix / isotype -> DotWaffle (G4), HundredField (L14), DottyMatrix (L8), PictorialBar (G5), BallotTally (L15). Covered (5 variants).
- Parallel coordinates -> ParallelCoordinates (L20). Covered. Radar: not found (BrandSpectrum L7 compares positions on six measures, a spectrum rather than radar).
- Sankey -> AggregateSankey (G22), board sankey (D9). Chord -> ChordRing (O6). Network -> ForceGraph (G11), ForceGalaxy (B2), CircularGraph (B1, G6), RadialConvergence (L5), ClusterField (L6), LinkBundle helper, TypeColonnade (L12). Covered. Alluvial (multi-stage flow with reordering) -> AggregateSankey partly. Arc diagram -> ArcMatrix is a bubble matrix, not an arc diagram; not found.
- Gauge / progress / bullet -> TickGauge (F11, value against a target). Partly bullet.
- Timeline / lifespan -> TrendLineage (L11, add/rename/drop life lines, a gantt-like lifespan chart). Priestley timeline: partly. Gantt: not found as a general interval chart. Circle timeline: not found. Seismogram: BarcodeLollipop/StaggerWave are near but not the form.
- Spatial: USChoropleth, WorldChoropleth only. Proportional symbol map, dot density, flow map, cartogram, tile-grid map, contour map: not found.
- Small multiples -> board SparkGrid (3x3 fixed grid of nine cells sharing a cursor; src/charts/board/spark-grid.tsx line 9-70). Partly; fixed 3x3 and internal to board.
- Funnel: HourglassStream is a stepped distribution-to-distribution fan, not a conversion funnel. Funnel not found. Marimekko, venn, voronoi, horizon, hexbin, 2D contour/density, error bars, fan chart, word cloud, stem and leaf, tally (BallotTally is a different form, tally by ballot): not found.

### Inferences

- Hairline's non-obvious names mask good coverage: roughly 35 of ~60 FT/Catalogue forms are present in some idiom. The genuinely absent set is on the order of 25 forms.
- Chart names such as ArcMatrix, TypeColonnade, ClusterField and RadialPatchwork are bespoke editorial forms with no taxonomy equivalent; they do not cover any standard gap.
- Because only six charts have schemas and the registry drives the MCP/agent surface, "covered" in the gallery overstates what an agent or app consumer can reach from a typed `data` contract.

### Gaps

- I did not open each chart's props, so statements about variants (e.g. whether RungBars handles negative values, whether JitterStrip packs beeswarm-style, whether Candlestick has an OHLC bar mode) are inferred from names and doc comments.
- Mapping of a few ids (CirclePack's id, DotCascade's exact form) is from component names, not rendered pages.

## 3. Which missing forms are commonly needed, ranked?

### Takeaway

Ranked by my judgement of editorial and product frequency (not measured): (1) small multiples/faceting as a wrapper, (2) annotated reference lines and bands on existing charts, (3) range/error bars and CI band, (4) arrow plot and range plot, (5) population pyramid / diverging stacked, (6) marimekko/mosaic, (7) connected scatter, (8) bump chart (plain line form), (9) funnel, (10) Gantt/timeline, (11) proportional symbol map, (12) radar, then the long tail. Items 1 to 3 are cross-cutting capabilities rather than chart types and have the highest return.

### Cited Findings

- Datawrapper treated arrow and range plots as new first-class types, and later added annotations across seven chart types, which signals newsroom demand for change-between-two-values and annotation. — [Datawrapper arrow and range](https://www.datawrapper.de/blog/new-arrow-and-range-plots); [annotations](https://www.datawrapper.de/blog/annotations-in-bar-charts)
- Datawrapper ships multiple-column/line/pie/donut variants as separate types, i.e. small multiples are a standard newsroom request. — [Datawrapper visualization types](https://www.datawrapper.de/developer/visualization-types)
- FT Visual Vocabulary lists fan chart, connected scatterplot, population pyramid, surplus/deficit filled line, Priestley timeline, proportional symbol, flow map, equalised/scaled cartogram, dot density, contour map, and voronoi, most of which Hairline lacks. — [FT Visual Vocabulary](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md)
- Three independent libraries ship bump (Nivo, RAWGraphs, Nivo area bump), marimekko (Nivo, Flourish, Catalogue), sunburst (Nivo, ECharts, RAWGraphs, Catalogue), swarm (Nivo, RAWGraphs), funnel and gauge (ECharts) — [nivo.rocks](https://nivo.rocks/), [ECharts index](https://echarts.apache.org/en/llms.txt), [RAWGraphs wiki](https://github.com/rawgraphs/rawgraphs-app/wiki/Available-Charts)
- Plot treats waffle, hexgrid/hexbin, density, contour, arrow, difference, bollinger, linear-regression and tree as first-class marks. — [Plot marks](https://github.com/observablehq/plot/tree/main/docs/marks)

Ranked gap list (missing or only partly covered). Tiers: A = commonly needed in editorial/product, B = regular, C = niche. "Fit" is how well it suits Hairline's engraved, tick-and-hatch idiom.

1. Tier A. Small multiples / faceting as a reusable wrapper (not a chart, a capability). Partly present as SparkGrid only. Fit: excellent; shared scales and hairline frames suit it.
2. Tier A. Range / interval bars and error bars plus confidence band on line/area (uncertainty). Missing. Fit: good.
3. Tier A. Arrow plot (change between two points per category). Missing; closest is DumbbellQueue. Fit: excellent, a one-prop variant of the dumbbell.
4. Tier A. Population pyramid / diverging stacked bar / spine chart. Partly (DivergingBar). Fit: good.
5. Tier A. Plain bump chart (rank lines across periods). Partly via FeatureRank, RankStrip, BarRace. Fit: good.
6. Tier A. Connected scatterplot (path through time in x/y). Missing. Fit: good.
7. Tier A. Funnel (conversion steps), mostly product dashboards. Missing. Fit: medium; tick-bar rendering works.
8. Tier A. Bullet chart / target-vs-actual bar. Partly via TickGauge. Fit: excellent.
9. Tier A/B. Marimekko / mosaic (both dims encode). Missing. Fit: good with HatchedStack.
10. Tier B. Gantt / generic interval timeline (project schedules, term lengths, Priestley). Partly via TrendLineage. Fit: good.
11. Tier B. Proportional symbol map, tile-grid or equalised cartogram, dot-density map. Only two choropleths exist. Fit: medium; needs geometry assets.
12. Tier B. Radar. Missing; the FT lists it, though the FT's own guidance treats it cautiously. Fit: poor-to-medium; low priority by Hairline's editorial stance (inference).
13. Tier B. Fan chart / projection with bands (FT lists it). Missing. Fit: excellent with AreaDifference primitives.
14. Tier B. Sunburst / icicle. Missing; CirclePack and NestedTreemap cover hierarchy. Fit: medium.
15. Tier B. True alluvial (stage-ordered flows). Partly via AggregateSankey. Fit: good.
16. Tier B. Hexbin and 2D density/contour for dense scatters. Missing. Fit: medium (halftone/stipple textures suit it).
17. Tier B. Horizon chart (compact many-series time series). Missing. Fit: excellent for hatch density ladders, but niche.
18. Tier C. Beeswarm as a packed layout (if JitterStrip is purely jittered). Possibly partly covered.
19. Tier C. Flow map / connection map. Missing. Fit: heritage fit (Minard, Cheysson plates exist in repo research_notes), but costly.
20. Tier C. Venn/euler, voronoi, word cloud, stem and leaf, spiral plot, kagi, point and figure, 3D/WebGL series. Missing; niche.

### Inferences

- The ordering follows (a) presence in the newsroom-centred taxonomies (FT, Datawrapper) over generic BI libraries, (b) whether Hairline can build it as a thin variant of an existing chart, and (c) the fact that product work (Wiredeck consumers, per earlier notes) leans on funnel/bullet/target forms that editorial taxonomies underweight. These weights are my judgement.
- Arrow plot, bullet, range/error bars, pyramid and fan chart are cheap wins because they reuse DumbbellQueue, TickGauge, DivergingBar and AreaDifference geometry.

### Gaps

- No usage-frequency data (e.g. Datawrapper or Flourish chart-creation counts) was found, so the tiering is judgement, not evidence.
- Newsroom practice evidence beyond FT and Datawrapper (e.g. NYT, Economist, Reuters toolkits) was not examined.

## 4. Which cross-cutting capabilities are missing?

### Takeaway

Hairline has strong systemic features (themeing, export/scale mode, server rendering, fills, brush overview, shared cursor) but no general-purpose annotation layer, faceting wrapper, log/non-linear scale option, or uncertainty display. Reference lines and bands exist only inside specific board charts.

### Cited Findings

- Scale options on the public schemas are only layout scale (`fit`, `scale`, `strokes`) — not axis scale types (log, sqrt, symlog). — /Users/danielhowells/Sites/hairline/src/schema/scale.ts. A grep for log scale finds only src/charts/lupi/radial-patchwork.tsx and its data file, so log scale is a one-off, not a feature.
- Annotation/reference: a grep for annotation, callout, reference line and goal finds only src/gallery/about.json, calendar-heat.tsx, draw-in.* (goal data), and entries-b.tsx; none is a reusable layer. Season bands exist as `bands` on the board time-lines (src/charts/board/time-lines.tsx, SeasonBands), and board presets draw a plan line (D13) and a statutory limit (D18, per src/gallery/about.json). Charts "draw only the plot and take no title or source" and carry no prose inside charts, per the README, which is deliberate. — /Users/danielhowells/Sites/hairline/README.md
- Faceting: grep for "facet" and "small multiple" finds only control.tsx, hooks.ts and board spark-grid.* (the nine-cell grid with a shared cursor); no generic Facet wrapper or shared-scale primitive. The README's kit exports `Plot`, `ChartSvg`, `Label`, rules, marks and textures (`@howells/hairline/kit`), so a facet wrapper could be built outside, but none is shipped.
- Uncertainty: no error bar, confidence band or fan component found; Ridgeline/Violin show distributions, not uncertainty. The grep hits for "interval/band/confidence" were in unrelated charts (ridgeline, brand-spectrum, barcode-lollipop data, single-axis data, dynamic-stream, playback.ts).
- Brushing/linking: BrushedOverview (O8) and BrushStrip/brush-math give one brush-and-overview pair; the board SparkGrid shares a cursor across cells. No cross-chart linking primitive found.
- Legends / dual encoding: Key and SeriesKey components, a choropleth key row (src/charts/maps/legend.tsx), and BubbleAlmanac encodes three variables in one mark (size, core, dotted ring); the legend is bespoke per chart, not a reusable dual-encoding (size plus colour) legend.
- Competitors for comparison: visx ships separate annotation, brush, legend, threshold and glyph packages ([visx barrel file](https://github.com/airbnb/visx/blob/master/packages/visx-visx/src/index.ts)); Plot has `tip`, `rule`, `frame`, facets, and `difference`/`bollinger`/`linear-regression` marks ([Plot marks](https://github.com/observablehq/plot/tree/main/docs/marks)); Vega-Lite has `errorbar`, `errorband`, `boxplot` composite marks ([Vega-Lite marks](https://vega.github.io/vega-lite/docs/mark.html)); Datawrapper has annotations on seven chart types ([blog](https://www.datawrapper.de/blog/annotations-in-bar-charts)).

### Inferences

- Missing, in priority order: (1) a reference line/band/target prop shared across line, area, bar and dumbbell charts (the FT convention is a labelled zero or target line; Hairline's rule ladder already has the primitives); (2) facet/small-multiple wrapper with shared scales; (3) interval/uncertainty marks (error bar, band, fan); (4) text/arrow annotations anchored to data, which would need a decision against the "no prose inside charts" stance; (5) log and sqrt axis scales (important for product metrics and long-tailed editorial data); (6) a reusable size-and-colour legend; (7) cross-chart brushing/linking (lowest, since the library favours static and server-renderable output).
- Annotation conflicts with the stated stance; treat it as a design decision, not just a missing feature.

### Gaps

- I did not read each public chart's full prop list, so a reference line or log option might exist on one of the six schema charts (HairlineLine, HairlineArea, RungBars, DumbbellQueue, PlumbScatter, Slope) that grep did not surface. Worth a targeted check of src/schema/*.ts before acting.
- Accessibility of any new capability (the README mentions screen-reader summaries and data tables) was not assessed.
