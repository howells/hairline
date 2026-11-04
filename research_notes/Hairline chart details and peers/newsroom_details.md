# Newsroom graphics-desk chart craft details (for a React SVG chart library)

Scope note: this pass was cut short at the tool-call budget. It is solid on direct labels, halos, highlight/grey context, annotation behaviour, tooltips, number formatting, the Economist's public style guide and the NYT needle. It is thin or empty on unusual forms (beeswarm, ridgeline, sankey, slopegraph, bump, waffle, radial, tile-grid, arrow, range), on The Pudding, WaPo, Guardian and FT interactive work, and on scrollytelling. Those are listed under Gaps rather than filled from memory. Most worked examples below come via Datawrapper's analyses (Lisa Charlotte Muth), which is a secondary source describing NYT/Bloomberg/Economist/WaPo charts; I did not open the outlet pages themselves.

## 1. Direct labelling, label collision, halos, units and number formats

### Takeaway

The most reproducible details are small and concrete. Label lines at their ends instead of using a key. Put a background-coloured stroke (halo) on any text that sits over marks or gridlines. Collapse crowded labels into one group label. Put units in axis labels, tooltips and annotations, and use compact number formats instead of "in millions". Datawrapper's analysis of NYT, Bloomberg and WaPo charts is the best public documentation of these.

### Cited Findings

- Datawrapper's guidance: "remove the color key and directly label your categories". Datawrapper labels line, pie and donut charts directly on desktop and moves the key to the top on mobile because space is tight. — [Datawrapper, What to consider when using text in data visualizations (Muth, 28 Sept 2022)](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Halo detail: a stroke around letters, "most often in the background color of your chart", to be used whenever text sits on other elements, "even just a subtle gridline". — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Only two annotation/label tiers, clearly different, e.g. "a 12px gray and a 14px black", with bold for emphasis inside. Text should be left- or right-aligned, avoiding centre alignment for annotations over about 10 words. Text should be larger than 12px and nearly black. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Don't shrink text to fit. Move small text into tooltips, enlarge the chart or shorten the wording. On mobile, hide the least important annotations or move them below the chart. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Units belong in axis labels, tooltips and annotations. Avoid "in millions"; use 20b/20m/20k. Trim precision (12,831 becomes 12.8k). The format `0.[0]%` shows 27.0 as 27% but keeps 22.4%. Tooltips restate the category with the number ("3.4% unemployed", "+16% revenue"). Do not rotate axis labels. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- Axis labels can be moved to the opposite side when the key data sits there. Datawrapper's example makes the last bar's value quicker to read. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- NYT, July 2022 jobs report live page: labels like "Jan. '22" and "Sept." sit directly on the line. Annotations restate what the reader sees ("152.5 million jobs in February 2020", "+32,000 jobs since Feb. 2020"). Example: https://www.nytimes.com/live/2022/08/05/business/jobs-report-july-economy — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- NYT, 2015 Arctic ice chart: annotations that add scale ("Size of Canada"), explain the chart's own element ("The dotted line represents..."), and point at an outlier ("Feb. 25: 2015 maximum"). Example: https://www.nytimes.com/interactive/2015/03/24/science/earth/arctic-ice-low-winter-maximum.html — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- NYT, 2018 "The Myth of the Criminal Immigrant": a two-tier hierarchy in which "More crime / Less crime" is bigger, bolder and higher contrast than the exact per-100,000 wording. https://www.nytimes.com/interactive/2018/03/30/upshot/crime-immigration-myth.html — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- WaPo, 2022 "Rents are rising everywhere": precise data details go in the description and in small grey notes rather than in the chart. https://www.washingtonpost.com/business/interactive/2022/rising-rent-prices/ — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- NYT, Feb 2022 US covid deaths: all lines share one colour, the right side carries direct labels, and the crowded left side is collapsed into one group label, "Other large, high-income countries". https://www.nytimes.com/interactive/2022/02/01/science/covid-deaths-united-states.html — [Datawrapper, 10 ways to use fewer colors](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- NYT, May 2021 covid vaccine inequality: lines are grouped into three colours, and each line has a white stroke (halo) so same-coloured lines stay separable where they cross. https://www.nytimes.com/interactive/2021/05/15/world/covid-inequality-vaccines.html — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- Datawrapper's scatter plot labelling: labels appear automatically only where there is space and do not overlap. — [Datawrapper Academy, scatter plot annotate](https://www.datawrapper.de/academy/customizing-your-scatter-plot-annotate) (as summarised by search result; page itself not opened)
- Bloomberg (via Junk Charts, Dec 2024): a small-multiples auto-market piece, with line charts for five markets, where the designer was careful about each placed label. Bloomberg radar chart on retirement with a "split legend": category labels are spread around the chart and each is shown the first time its category appears. — [Junk Charts, Bloomberg archive](https://junkcharts.typepad.com/junk_charts/bloomberg/) (search snippet only; the individual posts were not opened)
- Collision-avoidance techniques in open tooling, as general references rather than newsroom code: d3-annotation with a second `forceSimulation` using bbox collision (Susie Lu), and a "lane" approach where each label takes the first lane where it does not overlap an earlier label. — [d3-annotation gist](https://gist.github.com/git-ashish/f1f55d6253477fbdbacc4d009a41660c), [vayu issue #2696](https://github.com/athrvk/vayu/issues/2696) (both search snippets; low authority)

### Inferences

- A halo prop (paint-order stroke in the page background colour) is a cheap, high-value default for every SVG text element, and it should also apply to the white stroke on overlapping same-colour lines.
- A "group label for crowded series" API (collapse N lines into one end label) follows from the NYT covid example, together with end-of-line labelling with collision nudging.
- Compact number formats with trailing-zero trimming (`0.[0]%`) belong in the formatter layer, not left to users.

### Gaps

- I found no public documentation of how NYT, Bloomberg, Reuters or WaPo implement label collision (algorithm, padding, leader behaviour). Reuters' open chart modules list (awesome-charts) does not mention annotation or labels.
- No leader-line detail beyond the Economist guide (section 3). Datawrapper's text post does not discuss leader lines.

## 2. Highlighting one series against grey context, and "you are here" marks

### Takeaway

The common newsroom patterns are: context in lighter greys of varying lightness with direct labels, one saturated accent plus an annotation, opacity (not grey) to fade secondary series, and no colour at all (opacity, thickness, dotted lines). The Economist guide also specifies a small black index dot as a "you are here" mark.

### Cited Findings

- Economist, Jan 2022 "Do vaccine mandates actually work": context lines are greys of varying lightness and the lines are labelled directly. https://www.economist.com/graphic-detail/2022/01/22/do-vaccine-mandates-actually-work — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- Bloomberg, 2022 Tesla factory chart: a tiny category in red plus an annotation keeps it "still very much in the focus". https://www.bloomberg.com/graphics/2022-tesla-factory-california-texas-car-production/ — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- Bloomberg, 2020 Covid Resilience Ranking: less important categories are faded by reducing opacity instead of switching to grey. Only a few countries get direct labels (U.A.E., Saudi Arabia, Taiwan), and tooltips let readers find the rest. https://www.bloomberg.com/graphics/covid-resilience-ranking/ — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- NYT 2021 year in charts: uses no colour, "just opacity, thickness, and dotted lines". https://www.nytimes.com/interactive/2021/12/21/opinion/year-in-charts-2021.html — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- Datawrapper's general advice on faded series: lower opacity, but you may need to darken or saturate the palette so faded series don't vanish. For overlapping marks use transparency or a multiply blend, and give translucent symbols a fully opaque outline. — [Datawrapper, colors in style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)
- Economist scatter spec: "standard dot" is 4px at 50% opacity, used where the general trend matters more than individual points. A "highlight dot" is 4px at 100% opacity, used to label outliers and important points. A category dot has a 0.3px stroke and a 50% opacity fill, used for bubble charts. Black is used for the zero baseline only. — [Economist visual style guide v1.2, May 2017, p.18](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf) (read from a copy hosted at sa.ipaa.org.au; text extracted with pdftotext, layout is jumbled, so numbers are read from fragments)
- Economist "index chart" marker: a 5pt diameter black circle with a 0.5pt stroke on the index point, a 0.5pt red line on the index value, and number boxes to key multiple charts referenced in text. — [Economist style guide, p.25 "Miscellaneous styles"](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf) (same caveat on extraction)
- Economist: "Where colour categories become difficult to distinguish, consider highlighting the most significant part of the story." Also, where colour is used to categorise data, use grey for timeline labels. — [Economist style guide](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)

### Inferences

- A single `highlight` prop that swaps the rest to a context style needs two modes, because newsrooms split between grey (Economist, NYT covid) and reduced opacity (Bloomberg). Opacity mode needs an opaque-outline option.
- The Economist's dot spec (translucent context dots, opaque highlighted dots) is a ready-made default for scatter and dot plots.

### Gaps

- No newsroom documentation found on "you are here" marks beyond the Economist index dot. The Pudding, NYT Upshot and WaPo percentile or personalised-position patterns were not researched.

## 3. Annotation callouts, leader lines, timelines and mobile adaptation

### Takeaway

The Economist's public guide has the most precise annotation and timeline specs (arrow and dotted-line styles, box padding, mobile timeline options). Datawrapper documents responsive annotation behaviour that is directly portable: widths in chart-relative units, numbered markers on mobile with the text moved below.

### Cited Findings

- Datawrapper annotation width is measured "in chart width, not in absolute pixels", so an 800px chart embedded at 600px gives 25% narrower annotations that re-wrap. Multi-line text comes from resizing the text box. — [Datawrapper, responsive annotations (Muth, 2 Nov 2020)](https://www.datawrapper.de/blog/better-more-responsive-annotations-in-datawrapper-data-visualizations)
- On small screens, annotations "get numbered and move below the chart". The order is reorderable. A per-annotation switch keeps one inside the chart on mobile (their example is a "2019" label). — [Datawrapper responsive annotations](https://www.datawrapper.de/blog/better-more-responsive-annotations-in-datawrapper-data-visualizations)
- Range highlights (horizontal/vertical bands and lines) take colour, opacity, dash and width. — [Datawrapper responsive annotations](https://www.datawrapper.de/blog/better-more-responsive-annotations-in-datawrapper-data-visualizations)
- Economist timeline label rules: text blocks are Econ Sans Cnd regular 7.5/9.5pt; a one-line box is 12pt high with 6pt horizontal padding and text centred; a two-line box is 23pt high with 6pt padding; text sits at least 6pt in from the box edge. The label arrow is 0.5px stroke with a 50% arrowhead. Dotted lines distinguish labels on bar charts from plotted data. — [Economist style guide, pp.22-24](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf) (fragmentary extraction; the exact mapping of numbers to elements is my reading of jumbled layout text)
- Economist mobile timelines: "Mobile option 1" rotates the timeline and runs it vertically; "Mobile option 2" compresses horizontally, puts numbered labels on the chart and lists them below. Option 1 "works well where labels are relatively evenly spaced and where the data relates to specific labels". — [Economist style guide, p.24](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- Economist web layout details: 24pt spacer between panels; a rotated tag and a "marker for panels"; source text in 75% black; a thin alternating-colour band marks time on timelines. — [Economist style guide, pp.3, 10, 23](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- Economist house frame, per third-party descriptions: a red rule across the top with a small red tag at top left (#E3120B), horizontal gridlines only, y axis on the right, and series labels in each line's own colour. The 1px rule and 40x10px tag sizes come from an unofficial recreation, not from the Economist. — [ggthemes theme_economist](https://rdrr.io/cran/ggthemes/man/theme_economist.html), [Medium recreation](https://medium.com/@matteo.larrode2/create-a-the-economist-style-chart-84193a69263e). The official guide's own fragment shows a 15 x 1.5pt red rectangle (print), which fits the tag. — [Economist style guide](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- Economist palette notes: warm greys with less blue (RGB 135,135,113 and 207,209,195), plus a bright red for lines and a darker red for areas. Chart-type-specific colour orders are set in the 2017 guide. — [Datawrapper, colors in style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)
- FT palette logic: a fixed order (dark blue, then magenta, green as last resort), with every colour required to be darker than the pink background, a beige-ish grey that doesn't clash with it, and a less saturated colour for columns than for lines. — [Datawrapper, colors in style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides) (the post was truncated at its FT grey section in my fetch)
- NYT treemap, Nov 2021 reconciliation bill: three levels of white separation, namely thin strokes round unlabelled parts, thicker strokes round big categories, and a wide gap round the blue section. https://www.nytimes.com/interactive/2021/11/18/upshot/whats-in-democrats-reconciliation-bill.html — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)

### Inferences

- A portable annotation component: positions in data coordinates, width in fractions of chart width, a `mobile: "inline" | "key"` field that renders numbered markers plus a list under the chart.
- Library-level timeline support with a vertical (rotated) mode and a numbered-key mode would mirror the Economist's two mobile options.

### Gaps

- I did not find leader-line geometry (elbows vs straight, curvature, end caps) for NYT, Bloomberg, Reuters, WaPo, Guardian or FT.
- The Economist PDF was not read visually, only through `pdftotext -layout`. Exact pt/px values should be checked against the PDF before being used as specs. The guide also dates from 2017, outside the preferred 2022-2026 window.

## 4. Hover and scrub readouts, uncertainty (fan charts, bands, the needle), animation and scrollytelling

### Takeaway

Only the NYT needle is well documented here. Its lessons are about representing uncertainty with motion, and the later retreat from jitter is as informative as the original design. Hover readouts are documented only as tooltip wording (restate category, include units).

### Cited Findings

- 2016 NYT election needle: a radial gauge showing live data, with jitter moving the needle randomly within the 25th to 75th percentile of a couple of thousand simulated outcomes (the middle 50% of outcomes, centred on the median). The team deliberately did not pin it to the median because that would imply certainty. Banded colour regions around the needle were considered and rejected as a "mixed visual metaphor mishmash". — [Visualising Data, Gauging election reaction (Kirk, 2016)](https://visualisingdata.com/2016/11/gauging-election-reaction/)
- Co-author Gregor Aisch said the jitter was programmed to convey uncertainty. The article lists co-authors Cohn, Cox, Katz, Pearce and Quealy. — [Visualising Data](https://visualisingdata.com/2016/11/gauging-election-reaction/)
- Criticism: Quartz said most small needle movements were random variation from a prediction that updated roughly every 30 seconds, so readers could find non-existent trends. — [Quartz](https://qz.com/831944/the-new-york-times-election-result-projections-are-mostly-random-jitters)
- Later versions: a search summary states the jitter was dropped for the 2018 midterms and the 2020 Iowa caucuses, and that the needle began describing probabilities in words (e.g. "likelier than not" for 65%). I could not confirm this on a primary page, so treat it as unverified. — [Fast Company](https://www.fastcompany.com/90459366/the-most-hated-data-visualization-in-politics-is-back-to-spike-your-blood-pressure) (search result only; page not opened)
- 2024 plan: the NYT said it would publish needles (national plus seven swing states) only if confident of reliability, began each night with a pre-vote benchmark, and positioned the needle as not a race-calling tool. This is a plan, as the article ran 28 Oct 2024 before the vote. — [Reuters Institute, Moving the needle](https://reutersinstitute.politics.ox.ac.uk/news/moving-needle-how-new-york-times-aims-guide-readers-through-americas-most-uncertain-election)
- Hover wording: tooltips should repeat the category and unit, not just the number. — [Datawrapper text post](https://www.datawrapper.de/blog/text-in-data-visualizations)
- NYT "where people in each state were born" has about 100 bump charts on one page (Aisch notes it is hard to count as one visualization). https://www.nytimes.com/interactive/2014/08/13/upshot/where-people-in-each-state-were-born.html — [Datawrapper retrospective](https://www.datawrapper.de/blog/data-vis-portfolio-retrospective). This is 2014, outside the preferred window.
- Reuters data desk automates hundreds of Datawrapper charts weekly with human review before publishing, using a template for Reuters fonts, default colours and a set format for datelines and notes. — [Datawrapper, Reuters Julia Wolfe](https://www.datawrapper.de/blog/reuters-julia-wolfe), [Datawrapper, Jon McClure and Ben Welsh](https://www.datawrapper.de/blog/reuters-jon-mcclure-ben-welsh)

### Inferences

- If a library offers a "needle" or uncertainty gauge, the lesson is to make the uncertainty source explicit (interval or percentile range) and offer a static or verbal rendering alongside any motion. Random jitter is documented as controversial.
- A fan chart or gradient band implementation could not be informed by newsroom sources in this pass.

### Gaps

- No sourced detail on fan charts, gradient uncertainty bands, scrub readouts (vertical cursor lines, snapping, value stacking), animated transitions between states or scrollytelling for NYT, Bloomberg, Reuters, WaPo, Guardian, FT or The Pudding. Not found because I ran out of tool budget, not because the material doesn't exist.
- The NYT Reader Center piece on the needle (nytimes.com/2017/12/14/reader-center/nyt-needle-election.html) was cited by a search result but I did not open it.

## 5. Unusual chart forms (beeswarm, ridgeline, sankey, slopegraph, bump, waffle, radial, tile-grid, arrow, range plots)

### Takeaway

This pass found only a few form-specific newsroom details: sankey highlighting (Economist, WSJ), the NYT bump-chart wall, the Reuters tile-grid cartogram's mobile layout, and the Economist's connected-scatter and dot specs. The rest is a gap.

### Cited Findings

- Sankey: Economist's French-election forecast uses a simple sankey that highlights several categories at once. https://www.economist.com/graphic-detail/how-we-forecast-the-french-election/21807484. WSJ's "Europe's insatiable thirst for Russia's gas" has Russia in an easy-to-follow blue-grey in a busy sankey. https://www.wsj.com/articles/europes-insatiable-thirst-for-russias-gas-11643884204 — [Datawrapper, 10 ways](https://www.datawrapper.de/blog/10-ways-to-use-fewer-colors-in-your-data-visualizations)
- Tile-grid map: Reuters' US cartogram module "has option to lay out tiles as a rectangular grid for mobile". Spike-map module offers optional voronoi-based mouse-event callbacks for tooltips. Parliament chart is "houses of gov't in the round". — [reuters-graphics/awesome-charts](https://github.com/reuters-graphics/awesome-charts). Module repos and demos are linked from that page, for example https://reuters-graphics.github.io/chart-module-us-cartogram/ (not opened).
- Bump charts at scale: NYT 2014 birthplace page (see section 4). — [Datawrapper retrospective](https://www.datawrapper.de/blog/data-vis-portfolio-retrospective)
- Beeswarm mobile behaviour: the ONS beeswarm template notes that on mobile the dots cluster closer so the swarm gets taller and can spill outside the SVG. Its `mobileBreakpoint` (610) only changes the tick count. Not a newsroom example in the sense of the brief, but ONS is a statistics office with a published template. — [ONSdigital/beeswarm](https://github.com/ONSdigital/beeswarm) (search snippet)
- Beeswarm technique: a force along Y toward the middle line plus a collision force keeping node centres a fixed distance apart (9px in one tutorial). — [Martin Heinz, Towards Data Science](https://towardsdatascience.com/better-data-visualization-using-beeswarm-chart-bb46a229c56b/) (search snippet; tutorial, not newsroom)
- Economist connected scatter: 1px stroke, dashed 3px/1px trend lines, and a labelled outlier approach. — [Economist style guide, p.18](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf) (jumbled extraction)
- Economist guidance on stacked bars: for few categories or labelling problems, remove tick marks and label each segment value. — [Economist style guide, p.14](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf) (line 717 of my extraction; fragmentary)

### Inferences

- A tile-grid component should accept two layouts (geographic-ish tiles on desktop, a regular grid on mobile), as in the Reuters module.
- Beeswarm needs a height-aware layout on narrow widths, because a shrinking width grows the swarm vertically.

### Gaps

- Nothing found for ridgelines, slopegraphs, waffles, radial charts other than the needle, arrow charts or range plots from any named outlet. No sourced details on Bloomberg or Pudding beeswarms despite searching.
- Nothing found on end-label behaviour in slopegraphs or bump charts, such as label spacing and rank labels.

## 6. Which details are documented in public style guides or open-source tools

### Takeaway

Documented sources: the Economist 2017 chart style guide (PDF), Datawrapper's blog and Academy (which analyse other outlets' charts), Reuters' awesome-charts modules, and The Pudding's svelte-starter. The NYT, Bloomberg, WaPo, Guardian and FT interactive styles are not publicly documented in what I found.

### Cited Findings

- Economist visual style guide v1.2 (4 May 2017): sections on chart sizes, typefaces, print/web, leader block, panel charts, print and web palettes, chart types (bar/column, line, thermometer, scatter, table, pie/doughnut), double-scale charts, blob-heads, timelines and miscellaneous styling. — [Economist design system PDF](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- Its text uses Econ Sans (light, regular, bold, condensed variants) and OfficinaSanITC. Its Illustrator layer names include ANNOTATION, Panels, Lines, Scale, Events and Timeline. Source text is 75% black. — [Economist style guide](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- The Economist guide says leader blocks "should be simplified as much as possible, with minimal grid lines and tick-mark labelling", and gives a warning on double-scale charts: "If you cannot conform to the above rules try splitting the chart into panels or indexing the variables". — [Economist style guide](https://design-system.economist.com/documents/CHARTstyleguide_20170505.pdf)
- NYT has no fixed palette. Stuart Thompson says the only guideline is "Is it Timesian?". In 2020 election coverage one red and one blue are used at every size from thick bars to 13px text. — [Datawrapper, colors in style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides)
- Bloomberg: no apparent fixed palette; colours are consistently saturated, pure and bright. — [Datawrapper, colors in style guides](https://www.datawrapper.de/blog/colors-for-data-vis-style-guides) (Datawrapper's inference, not a Bloomberg statement)
- The Pudding GitHub: `svelte-starter` (project template, MIT, 473 stars at fetch time), `data` (open datasets) and `website`. The org shows 296 repos; story repos exist but no reusable chart library surfaced on the first page. — [the-pudding on GitHub](https://github.com/the-pudding), [svelte-starter](https://github.com/the-pudding/svelte-starter)
- Reuters graphics: reusable Svelte chart modules built from a "bluprint" template (categorical bar, line/area, parliament, US county map, US cartogram, globetrotter, spike map). — [reuters-graphics/awesome-charts](https://github.com/reuters-graphics/awesome-charts)

### Inferences

- For a spec-quality source to cite when designing defaults, the Economist guide is the only newsroom primary document found. Everything about NYT/Bloomberg/WaPo is reverse-engineered by third parties (Datawrapper, Junk Charts, Visualising Data).

### Gaps

- Did not check: Bloomberg or WaPo open source, the Guardian's dotcom-rendering or charts tooling, FT's origami/o-charts or its current graphics tooling, `ai2html` documentation, The Pudding's `svelteplot`/scrollytelling helpers, Observable Plot's newsroom-derived features, Malofiej/OpenVis/Outlier talk write-ups, Andy Kirk or Nightingale pieces. These are the next searches to run.
- Unverified leads for a follow-up pass (named from search snippets only): Jon Schwabish, "Three Ways to Annotate Your Graphs" (https://urban-institute.medium.com/three-ways-to-annotate-your-graphs-d140e04e48ec); Eugene Wei, "Remove the legend to become one" (https://www.eugenewei.com/blog/2017/11/13/remove-the-legend); Datawrapper Data Vis Dispatch (https://www.datawrapper.de/blog/category/data-vis-dispatch), which comments on individual newsroom charts weekly.
