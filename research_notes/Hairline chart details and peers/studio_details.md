# Bespoke dataviz studio craft details: catalogue for Hairline

Scope note: the cited findings below come only from pages fetched or searched in this session. Anything from general knowledge or my own judgement is placed under Inferences or Gaps and marked "uncited". Studio sites for Pentagram, Accurat, Fathom, Density Design, Interactive Things and Truth & Beauty (other than the OECD page) gave little or nothing, so coverage is uneven: it is strongest for Nadieh Bremer / Visual Cinnamon, then Shirley Wu, Moritz Stefaner and Dear Data. Hairline chart names refer to files in /Users/danielhowells/Sites/hairline/src/charts (lupi, forms, big, glance), which I only skimmed by filename and doc comments.

## 1. What signature details do these designers and studios use, and how does each work as a reproducible detail?

### Takeaway

The reproducible details cluster into about ten moves: a per-mark gradient whose direction comes from data, glow and gooey filters, a legend drawn as one exemplar glyph, a hand-built encoding "alphabet" with a key on the reverse, constellation-style dark-mode glow with distance-faded opacity, voronoi hit areas under tiny marks, animated staged reveals, white space left deliberately empty, a single highlight mark (white dot) for exceptions, and organic or hand-drawn forms chosen to remind the reader of people. Most are cheap in SVG/React. A monochrome hairline style can keep roughly half of them: the structural, legend and hit-area ones, but not the glow and rainbow ones.

### Cited Findings

#### Nadieh Bremer (Visual Cinnamon)

- **Data-based gradient direction per chord (Avengers chord diagram).** One `linearGradient` per chord in `<defs>`, id built from source and target index (`chordGradient-0-4`), `gradientUnits="userSpaceOnUse"`. Endpoints are the midpoints of the source and target chord ends on the inner radius: `x = r*cos(mid - PI/2)`, `y = r*sin(mid - PI/2)` (d3 angles start at 12 o'clock). Two stops: `offset 0%` source colour, `offset 100%` target colour. Chord path `fill: url(#id)` with path opacity 0.8. The gradient is a straight line between the two ends, not following the arc, and the author says this is barely noticeable. Chords were re-sorted by index rather than value (a custom `customChordLayout`) to cut crossings. — [Visual Cinnamon, orientation gradient chord](https://www.visualcinnamon.com/2016/06/orientation-gradient-d3-chord-diagram/); series index at [SVGs beyond mere shapes](https://www.visualcinnamon.com/2016/04/svg-beyond-mere-shapes/)
- **Animated flow gradient to imply direction (Stretched Chord, Minard troop paths).** `linearGradient` with `x1=0% x2=100%`, `spreadMethod="reflect"`, stops from a symmetrical palette (4 colours then the first 3 reversed, 7 stops, offsets `i/(n-1)`). Two native SVG `<animate>` elements: `x1` from `0%` to `100%`, `x2` from `100%` to `200%`, `dur=7s`, `repeatCount=indefinite`. Both ends must move together, otherwise the gradient shrinks. Symmetry hides the loop seam. Caveat: Safari `reflect` was broken at the time, so repeat the colour set to fill the shape. — [Visual Cinnamon, animate gradient](https://www.visualcinnamon.com/2016/05/animate-gradient-imitate-flow-d3/)
- **Glow filter.** `feGaussianBlur stdDeviation="3.5" result="coloredBlur"` then `feMerge` with the blur first and `SourceGraphic` second. She says it has no visible effect on lines however thick, applies to rects, circles, paths, and that it is "definitely not something that will suit a business/no-nonsense chart". In the radar redesign she used it only on the axis circles and blobs. — [Visual Cinnamon, glow filter](https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization/)
- **Gooey filter.** `feGaussianBlur stdDeviation="10"` (sRGB) followed by `feColorMatrix` with alpha row `0 0 0 19 -9`, applied to the parent `<g>`, not per element. Adding `feBlend in=SourceGraphic` preserves true circle sizes; without it small circles shrink or vanish, which matters when size encodes data. Animating the last two matrix numbers (e.g. `18 -5` to `6 -5`) fades the merge in or out. — [Visual Cinnamon, gooey effect](https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect/)
- **Other filters and gradients in the same series:** motion blur that grows while an element moves, data-based radial gradients (one per data point, Exoplanets), abrupt hard-stop gradients for thresholds (Top 10 Baby Names), smooth gradient colour legends, and CSS blend-mode colour blending. — [SVGs beyond mere shapes](https://www.visualcinnamon.com/2016/04/svg-beyond-mere-shapes/). The talk was given at OpenVis 2016, Generate London 2016, Frontend United 2019 and KIKK 2019 — [Women Talk Design listing](https://womentalkdesign.com/talks/svg-beyond-mere-shapes/); [KIKK](https://2019.kikk.be/en/program/workshops-masterclasses/nadieh-bremer-1); [Creative Bloq gradient tutorial](https://www.creativebloq.com/how-to/boost-d3js-charts-with-svg-gradients)
- **Royal Constellations (force layout as constellation).** d3v4 forces tuned by trial and error. Vertical position is birth year (about 40% were estimated), 12 current royal leaders spaced evenly on one axis with a gentle sideways pull of each node toward its closest royal. Dark theme, yellow nodes, "a touch of glow". Node opacity fades with graph distance to the nearest royal, almost transparent beyond 6 steps. Hover recolours by generation distance on a star-temperature ramp (blue, white, yellow, orange, red), revealed one step at a time (an accidental animation she kept). Two clicked people get small rotating dotted rings and the Dijkstra shortest path is highlighted. Large clipped voronoi circles under each tiny node enlarge hover targets. The 12 leaders are drawn large, all others small. Layout rotated 90 degrees so readers scroll vertically. Built in SVG, slower in Firefox and Safari, and she says canvas would be next. — [Data Sketches, Royal Constellations](https://www.datasketch.es/project/royal-constellations); live piece at [royalconstellations.visualcinnamon.com](https://royalconstellations.visualcinnamon.com/)
- **Olympic Feathers (radial bar rings).** 56 disciplines split across five rings (Olympic symbol) with ring totals balanced so each has about the same width. One medal is a fixed arc length in degrees, so white gaps appear where past editions held many trial events, and she kept the gaps on purpose because they show Olympic history. Medals within each gender and edition are ranked by which continent won most (not a fixed continent order). A white dot marks events whose gold medalist set a standing Olympic or World record, added late. The white space inside feathers is filled with a light radial gradient to help read gender differences. Custom feather-tip paths were commented out on a collaborator's advice. Hover a medal gives the winner, hover the timeline highlights one edition. She calls it "a whole lot of rotated and stacked bar charts", and R did the data prep. — [Data Sketches, Olympic Feathers](https://www.datasketch.es/project/olympic-feathers); [Data Stories 83](https://datastori.es/83-olympic-feathers-with-nadieh-bremer/)
- Portfolio list for follow-up (titles and years only; the page does not describe forms): Figures in the Sky (2018, award icon), Beautiful in English (2017, award icon), Why Do Cats and Dogs... (2019), Digital Trackers for NYT (2019), Gravitational Waves for Science News (2021), 100 Tallest Buildings for Nightingale (2023), Searching for Birds for Google Trends (2026). — [Visual Cinnamon portfolio](https://www.visualcinnamon.com/portfolio/)

#### Shirley Wu

- Her method is two steps: draw the geometric shapes (custom SVG paths), then translate the data into the shape's channels. Her CODAME workshop and Frontend Masters course teach this through the film-flowers project (movies as flowers). — [Frontend Masters course](https://frontendmasters.com/courses/d3-js-custom-charts/); [Turning designs into code](https://master.dev/courses/d3-js-custom-charts/turning-designs-into-code/); [CODAME workshop](https://codame.com/events/workshop-dataviz)
- She describes adding "subtle, sometimes even flashy, touches to maximize delight" in the Hamilton piece (Pudding, Data Sketches). The Hamilton piece won an Information is Beautiful Award (2017) and a North American Digital Media Award (2018). — [Built In](https://builtin.com/data-science/data-sketches); [portfolio summary via Frontend Masters teacher page](https://frontendmasters.com/teachers/shirley-wu/)
- For Nobel women she learned Three.js to lay out crystals sized by influence. — [Built In](https://builtin.com/data-science/data-sketches)
- Data Sketches (Bremer and Wu, 24 projects over a year, each with documented sketch, data and code) is also a Routledge book (2021). — [datasketch.es](https://www.datasketch.es/); [Routledge](https://www.routledge.com/Data-Sketches-A-journey-of-imagination-exploration-and-beautiful-data/Bremer-Wu/p/book/9780367000080)

#### Moritz Stefaner (Truth & Beauty)

- **OECD Better Life Index flowers.** One flower per country, one petal per topic (11), petal length is the topic score, flower height is the summed weighted score, so strong flowers "rise to the top". The legend is a single labelled flower with the 11 petals named, and each topic keeps one hue everywhere. When the user raises a topic's weight (1 to 5 dots) its petals become broader and more saturated while the others are "taken back a bit". Twelve alternative designs (rings, sunbursts, spirals, stacked bars) were tried before flowers won on coherence, metaphor and branding. A FlowingData commenter found heights hard to compare. Topic and country pages add dense sparkline rankings. Designed and developed with Jonas Leist and Timm Kekeritz. — [Truth & Beauty, OECD Better Life Index](https://truth-and-beauty.net/projects/oecd-better-life-index); [FlowingData](https://flowingdata.com/2012/05/22/updated-oecd-better-life-index)
- The flower later became a family of star charts for the OECD Regional Well-Being project. — same Truth & Beauty page

#### Giorgia Lupi / Accurat / Pentagram, Stefanie Posavec (Dear Data)

- Dear Data: each postcard has a hand-drawn front and, on the back, a dense hand-drawn key that is the "code" for the picture. Colours, sizes, shapes and positions of symbols mean nothing without it. They were each forced to invent 52 visual languages, and the physical act of turning the card from back to front and back again was part of the intent. Lupi's keys are meticulous, Posavec's looser, with visible crossings-out. Cards are in MoMA's collection. — [Pentagram, Dear Data story](https://www.pentagram.com/work/dear-data/story); [Kairos 25.1](https://kairos.technorhetoric.net/25.1/praxis/sorapure-fauni/design.html); [Big Bang Data discussion](https://bigbangdata.somersethouse.org.uk/giorgia-lupi-and-stefanie-posavec-discuss-dear-data-a-year-long-slow-data-transmission/); [Giorgia Lupi, Dear Data](http://giorgialupi.com/dear-data)
- Data Humanism principles as summarised by the search result: embrace complexity, sketch with data instead of standard charts, always add context, remember data is imperfect. (I could not fetch the manifesto itself, as Medium returned 403.) — [Search summary of Lupi's essay](https://medium.com/@giorgialupi/data-humanism-the-revolution-will-be-visualized-31486a30dbfb); see also [Wikipedia: Giorgia Lupi](https://en.wikipedia.org/wiki/Giorgia_Lupi)
- Recent Lupi/Pentagram work to look at: _1,374 Days: My Life with Long COVID_ (NYT, Compasso d'Oro 2025) and the 2026 solo show _Data Humanism_ at Gallerie d'Italia, Vicenza (29 April to 2 August 2026). — [Pentagram: Gallerie d'Italia](https://www.pentagram.com/work/giorgia-lupi-data-humanism-at-gallerie-d-italia)

#### Federica Fragapane

- She uses organic shapes "to remind myself and hopefully the reader of the lives that are sometimes hidden behind the data", and says they invite readers in without being scary. She does not use them everywhere (not on dashboards). Process: analyse the data while collecting visual references (nature, painting, sculpture); her workshops use only data and white clay, with no colour. Tools: Excel/Sheets, Illustrator, RAWGraphs, Figma. MoMA acquired three of her works in 2023. _Shapes of Inequalities_ is a 2025 Triennale Milano installation. — [Nightingale interview (via search result)](https://medium.com/nightingale/federica-fragapane-on-visualizing-theatre-childrens-books-and-more-bcb9b5174b21); [PolicyViz #266](https://policyviz.com/podcast/episode-266-federica-fragapane/); [Designboom](https://www.designboom.com/design/data-federica-fragapane-soft-forms-hard-facts-inequalities-shapes-triennale-milano-interview-06-08-2025/); [Storybench](https://www.storybench.org/federica-fragapane-on-using-minimalistic-shapes-lines-and-tree-branches-to-convey-powerful-stories/)

#### Sonja Kuijpers, Valentina D'Efilippo, Krisztina Szucs

- Kuijpers (STUDIO TERP), _A view on despair_ (2019): a landscape where element type encodes method (buildings, waves, trees) and element height or size encodes age. — [Behance](https://www.behance.net/STUDIOTERP); [Explore Explain S1 E6](https://visualisingdata.com/2020/06/explore-explain-s1-e6-sonja-kuijpers/)
- D'Efilippo, _Poppy Field_ (design by her, D3 code by Nicolas Pigelet), the war-deaths poppy form from _The Infographic History of the World_. — [Behance](https://www.behance.net/gallery/21188105/Poppy-Field)
- Szucs: three Information is Beautiful medals (one gold, two silver, 2019/2022/2023); personal projects include animated high-jump and pole-vault finals and a "How long are the nights" print. — [krisztinaszucs.com](https://krisztinaszucs.com/); [2024 recap](https://krisztinaszucs.com/blog/20241229_recap/)

### Inferences (uncited, my own reading)

Catalogue of reproducible details, mapped to Hairline charts that already exist (filenames in `src/charts`):

1. **Legend as one exemplar glyph (Stefaner flower, Dear Data key).** Draw one oversized instance of the mark with leader lines and 6 to 8 pt labels naming each channel. Build: one `<g>` that reuses the same glyph component at 3x scale, plus `<line>` + `<text>` pairs. Fits `lupi/radial-patchwork`, `lupi/barcode-lollipop`, `forms/radial-year`. Fits hairline fully.
2. **Gradient whose axis is the data (Bremer chord).** In React, compute `x1,y1,x2,y2` from the two arc midpoints and render `<linearGradient id={`g-${s}-${t}`} gradientUnits="userSpaceOnUse">`. For a monochrome style use two stops of the same ink at different opacity (for example 0.9 to 0.15) to show direction instead of two hues. Fits `forms/chord-ring`, `glance/link-bundle`, `big/circular-graph`.
3. **Direction by animated gradient, not arrowheads (Bremer flow).** Same as above with two `<animate>` elements; use opacity stops only. Candidates: `glance/aggregate-sankey`, `lupi/hourglass-stream`. Respect `prefers-reduced-motion`.
4. **Glow (Bremer, Royal Constellations).** Clash in a hairline style. A subtle alternative is a "halo": a wider, low-opacity stroke of the paper colour behind a label or mark, which keeps legibility without bloom.
5. **Distance-faded opacity from a hero node (Royal Constellations).** `opacity = clamp(1 - d/maxD)` per node, one ink colour, no hue ramp. Works well in monochrome for `big/force-galaxy` and `glance/force-graph`. Hover reveals neighbours in staged steps (step delay about 80 ms per hop) from BFS distance.
6. **Voronoi hit targets under tiny marks (Royal Constellations).** `d3.Delaunay.from(points).voronoi()` clipped by a circle of radius r_max; render invisible `<path>` cells with the pointer handlers. Essential for `glance/jitter-strip`, `lupi/dotty-matrix`, `lupi/dot-cascade`.
7. **Big hero marks, tiny everything else (Royal Constellations: leaders big).** One size jump for the annotated entities. Matches the one-hero-colour rule.
8. **Deliberate white space as data (Olympic Feathers).** Fixed arc or cell width per unit, so gaps show missing history rather than being squeezed out. Applies to `forms/radial-year`, `lupi/arc-matrix`, `lupi/calendar-heat`.
9. **Single-dot exception flag (white record dot).** One tiny mark of the opposite tone on a mark for a notable property. For hairline, a ring or a 1.5 px paper-coloured dot. Fits `lupi/calendar-heat`, `lupi/dotty-matrix`.
10. **Ranking inside a group by data, not by fixed category (Olympic Feathers continent ordering).** Sort sub-marks per group by the winner each time. Cheap in any stacked layout.
11. **Weight animates saturation/width, not just position (OECD).** On a control change, scale unfocused marks to 0.4 opacity and thicken the focused one. Monochrome equivalent: stroke width 0.5 px to 1.5 px.
12. **Gooey merge (Bremer).** Works as a group filter only. It merges blobs and softens shapes, which clashes with hairline precision; use only in a deliberate "big" or "original" showpiece, with `feBlend` to keep sizes honest.
13. **Hand-keyed legend on the "back" (Dear Data).** A second panel or flip state listing every symbol at full size with a sentence each. In React, a `<details>` or a flip toggle on a card that swaps front and back. Fits hairline well as a typographic key.

### Gaps

- Pentagram/Accurat project pages beyond Dear Data (for example the Lupi NYT long Covid piece) were not fetched; I have no confirmed technical detail on their glyph systems.
- Fathom, Density Design and Interactive Things: searches returned only the Interactive Things homepage and no specific award-winning project pages; I have nothing citable on their craft details.
- Sonja Kuijpers, D'Efilippo and Szucs: only project-level facts, no technique write-ups fetched (Kuijpers' "How I visualized data on suicide" process piece exists per search but was not read).
- Stefaner's other projects (Emoto, Elevation, Max Planck "Cloud of Genes", etc.) and Posavec's Writing Without Words / Literary Organism were not verified, so are omitted.
- Information is Beautiful Awards winners 2022 to 2026: not systematically reviewed.
- Marble Butterflies and Familiar Faces (Data Sketches) were not found.
- Nightingale Fragapane article returned 403 when fetched directly; its content here comes from the search result summary.

## 2. How are these built technically (SVG filters, gradients along paths, d3-force, canvas vs SVG, textPath, rough.js, noise)?

### Takeaway

Bremer's own write-ups show that her effects are plain SVG primitives (linearGradient with `userSpaceOnUse`, `feGaussianBlur` + `feMerge`, `feColorMatrix` alpha threshold, native `<animate>`) driven from data, and her force-layout pieces are SVG with d3v4 forces, voronoi hit areas and key-value maps for speed, with canvas named as the upgrade when SVG gets slow. I found no fetched source for textPath, rough.js or noise, so those are listed as uncited guidance.

### Cited Findings

- Gradients in Bremer's chord work are straight linear gradients per path, set from `chord.chords()` data with `gradientUnits="userSpaceOnUse"` so coordinates are in the centred group's space. Default `objectBoundingBox` units would use percentages of each path's bounding box. — [Visual Cinnamon](https://www.visualcinnamon.com/2016/06/orientation-gradient-d3-chord-diagram/); gist [nbremer/4de6f0a9...](https://gist.github.com/nbremer/4de6f0a9d9d06373fc639e32e9c346cc); a derivative uses ids like `chordGradient-source-target` — [gcalmettes gist](https://gist.github.com/gcalmettes/b76c4567fbe050291a1edb07960546ae)
- She did not find a true gradient following the curve; the search result notes that none of the sources cover curve-following gradients. — [search result summary above](https://www.visualcinnamon.com/2016/06/orientation-gradient-d3-chord-diagram/)
- Filters apply to the parent `<g>` for gooey and to elements for glow; glow does nothing on lines. — [glow](https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization/); [gooey](https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect/)
- Native SVG `<animate>` on gradient `x1`/`x2` was chosen over d3 transitions or `attrTween` for flow; gooey strength is animated with `attrTween` + `interpolateString` on the `feColorMatrix` values. — [animate gradient](https://www.visualcinnamon.com/2016/05/animate-gradient-imitate-flow-d3/); [gooey](https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect/)
- Royal Constellations: d3v4 forces tuned manually, SVG-only, Dijkstra for shortest path across ~3000 nodes, key-value maps instead of repeated passes, mouse handlers gated so only deliberate hovers trigger animation. Slower in Firefox and Safari. — [Data Sketches](https://www.datasketch.es/project/royal-constellations)
- Olympic Feathers: data prep in R, then a nested JSON of 5,146 medal winners; she mixed up degrees (CSS rotate) and radians (Math.sin/cos) while rotating disciplines, a common radial pitfall. — [Data Sketches](https://www.datasketch.es/project/olympic-feathers)
- Wu's shape-first workflow: build the geometry as SVG paths first, then map data to channels. — [Frontend Masters](https://frontendmasters.com/courses/d3-js-custom-charts/)
- Fragapane designs in Illustrator/Figma after analysis in spreadsheets and RAWGraphs, which means her organic forms are hand-finished rather than generated. — [PolicyViz #266](https://policyviz.com/podcast/episode-266-federica-fragapane/)

### Inferences (uncited, general web-graphics knowledge to verify before building)

- **Text on curves:** `<path id="arc-n" d="M ... A ...">` plus `<text><textPath href="#arc-n" startOffset="50%" text-anchor="middle">`. For labels on the bottom half of a ring, reverse the path direction so text is not upside down. Measure with `getComputedTextLength` or use a fixed arc length to avoid overflow; Safari handles `href` on `textPath` but check `xlink:href` fallbacks if targeting older versions. This suits `forms/radial-year` month labels and `forms/chord-ring` group names (the repo currently notes horizontal group names).
- **Hand-drawn marks:** rough.js produces sketchy SVG paths with a seed; fix the seed per datum (for example hash of id) so marks do not change on re-render, and render in `useMemo`. For a restrained look, a cheaper option is jitter on path control points by a seeded noise of about 0.3 px, not full roughness.
- **Hatching and engraved texture:** `<pattern patternUnits="userSpaceOnUse" patternTransform="rotate(45)">` with a 0.5 px line; vary spacing for tone (the repo already has `hatched-stack`, `texture-ids.ts`, `fills.ts`). Use one angle per series, 45 and 135 degrees to distinguish.
- **Organic jitter / beeswarm:** deterministic placement by `d3.forceSimulation` with `forceX`, `forceCollide`, run to convergence with `simulation.tick(300)` outside React (no per-frame state), then render static SVG. For jitter strips use a seeded PRNG rather than `Math.random` to avoid hydration mismatch in Next.js.
- **Ridgelines:** draw back-to-front with paper-coloured fill and a 1 px ink stroke so the overlap occludes; kernel density from `d3.contourDensity` or a custom KDE (the repo's `lupi/ridgeline` exposes a bandwidth parameter).
- **Canvas vs SVG:** keep SVG below roughly 2 to 3k nodes (Bremer's 3k-node network worked in Chrome only), and use canvas for large force layouts, hit-tested through a quadtree/Delaunay `find`. Canvas loses CSS filters per element but supports `ctx.filter = "blur()"` and globalCompositeOperation in modern browsers.
- **Staged reveal:** stagger by rank or distance, 400 to 700 ms eased, one property at a time (stroke-dashoffset to draw lines, `r` from 0 for dots). Use CSS variables and `animation-delay: calc(var(--i) * 12ms)` to keep React renders cheap.
- **Gradients that truly follow a path:** split the path into N short segments, each stroked with an interpolated colour/opacity; or use a `<mask>` with a linear gradient and a dasharray. Both heavier than the straight gradient Bremer used.

### Gaps

- I did not fetch Bremer's posts on motion blur, data-based radial gradients, abrupt gradients, or colour blending, so have no parameters for them.
- No source fetched on textPath, rough.js, noise functions, Perlin/simplex, or Poisson-disc usage by any of these designers.
- No fetched confirmation of which pieces by Wu, Fragapane or Stefaner use canvas vs SVG.
- The Data Sketches book sample PDF and the Nightingale article "Drawing Out Data Sketches" were identified in search but not read.
- OpenVis, Eyeo and Outlier talk transcripts beyond the SVG-beyond-mere-shapes listings were not found.

## 3. Which details are tasteful in a restrained, monochrome-first "hairline" style, and which would clash?

### Takeaway

The structural details (exemplar-glyph legends, hit-area helpers, white space as data, one-hero highlights, opacity fading by distance, single-ink gradients that show direction, hand-keyed legends) suit hairline. The atmospheric ones (glow, gooey, rainbow gradients, temperature colour ramps, soft organic blobs) clash and Bremer herself says glow does not suit a no-nonsense chart.

### Cited Findings

- Bremer says glow is "definitely not something that will suit a business/no-nonsense chart" and calls the radar change "Not a major difference". — [Visual Cinnamon glow](https://www.visualcinnamon.com/2016/06/glow-filter-d3-visualization/)
- Gooey without `feBlend` distorts sizes that encode data and is CPU heavy in interactive demos. — [Visual Cinnamon gooey](https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect/)
- Fragapane herself says organic shapes are not right for dashboards. — [Nightingale interview summary](https://medium.com/nightingale/federica-fragapane-on-visualizing-theatre-childrens-books-and-more-bcb9b5174b21)
- A reader of OECD flowers found height hard to compare, a reminder that petal shapes trade accuracy for charm. — [FlowingData](https://flowingdata.com/2012/05/22/updated-oecd-better-life-index)
- Bremer's Royal Constellations colour ramp (blue to red) mirrors star temperature; she admits it is not intuitive. — [Data Sketches](https://www.datasketch.es/project/royal-constellations)
- Dear Data's legends are the thing that makes custom glyphs readable; without them the symbols mean nothing. — [Kairos 25.1](https://kairos.technorhetoric.net/25.1/praxis/sorapure-fauni/design.html)

### Inferences (uncited, judgement)

Fits hairline (use):

- Exemplar-glyph legend with leader lines, set in the same small type as axis labels.
- Voronoi hit areas, distance-faded opacity, staged hover reveal in one ink.
- Gradient direction using a single ink fading in opacity (chord, sankey ribbons), so the gradient is a tonal ramp, not a hue pair.
- Fixed unit width leaving visible gaps; single hero mark; tiny ring or paper dot as exception flag.
- Hatching and engraved patterns, seeded line wobble of under 0.5 px.
- Back-of-card key with a sentence per symbol.
- Animated gradient flow for direction, used once per page and disabled under reduced motion.

Clashes (avoid or confine to "big"/"original" showpieces):

- Glow and neon on dark backgrounds; gooey merging; rainbow or multi-hue gradients; star-temperature ramps.
- Soft blob forms and fully organic petals unless the subject is people; Fragapane and Wu use them to carry human subjects, which a hairline house style does not need by default.
- Full rough.js sketch roughness, which fights the hairline's precision. A subtle seeded wobble is the only tolerable version.
- Hover effects that recolour many marks at once (Royal Constellations colours the entire generation spread); in hairline, change opacity and stroke width only.

### Gaps

- I did not review Hairline's existing source in depth (only filenames and doc comments), so mapping suggestions are by form type rather than verified against implementations.
- No evidence found on how readers rate hairline-style versions of any of these details; the taste calls above are my judgement.
