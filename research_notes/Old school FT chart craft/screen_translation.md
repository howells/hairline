# Translating print and engraved chart craft into crisp, minimal screen graphics (for Hairline)

Scope: concrete moves that give a minimal SVG chart system (Inter, sentence case, paper #fbfbf9, warm grey ramp, one ink hero, 1px pixel-snapped hairlines, engraved pattern fills) an editorial, engraved, broadsheet character without losing clarity. "Cited Findings" are sourced. "Inferences" are my reasoning, or values I computed, and are labelled as such.

---

## 1. Typography that reads as editorial and authoritative (serif vs sans, figure styles, italics, specific families)

### Takeaway

Across newsroom practice, labels and numbers inside the plot are almost always in a sans with tabular lining figures. The serif shows up in the title (sometimes the subtitle or description), where it ties the chart to the publication's headline face. Serif labels and numbers inside the plot are rare and read as literary or bespoke (Fragapane, Guardian 2018). For Hairline the safest editorial move is: Inter with `tnum` (plus optionally `ss01`, `cv11` and others) for every value and tick, and a single optical-size serif (Newsreader or Source Serif 4) only for the chart title and perhaps an italic note line. Do not use oldstyle figures on axes or in tooltips.

### Cited Findings

- **Default for charts is sans.** Datawrapper (Lisa Charlotte Muth, Sept 2022) says sans-serifs look "cleaner" and are often "easier to skim" than serifs, "especially when it comes to numbers". Its baseline rule: when unsure, use sans of normal width, regular weight, sentence case, a readable size, near-black. — [Datawrapper: Which fonts to use for your charts and tables](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Serif for effect, mostly in headlines.** Serifs read as "classy", "traditional" and "serious/professional" and usually appear only in chart headlines. Advice: if your organisation uses a lot of serif text, use that serif for chart titles. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Serif title + sans body is a documented newsroom pattern:**
  - Guardian (2022): Guardian Headline titles with Guardian Text Sans
  - Our World in Data: Playfair Display with Lato
  - Washington Post: Postoni (high contrast, large sizes only) with Franklin
  - SPIEGEL: SPIEGEL Slab with SPIEGEL Sans
  - Pew Research: Georgia _Italic_ for the description only, Franklin Gothic everywhere else
  - WaPo maps: Georgia for water labels

  — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)

- **Serif for labels and numbers is rare.** The Guardian 2018 (Guardian Text Egyptian + Guardian Figures) is called "One of the rare news projects that uses a serif typeface for all labels and numbers". Most of Federica Fragapane's work uses serifs, which give a "map-explorative" and literary vibe. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **All-sans newsrooms:**
  - Economist: Econ Sans and Econ Sans Condensed
  - Bloomberg: Neue Haas Grotesk
  - NYT: NYT Franklin
  - Reuters and Le Figaro: Source Sans Pro
  - WSJ: Retina and Retina Narrow
  - FiveThirtyEight: Atlas Grotesk and Decima Mono

  The article does not mention the FT. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)

- **Figures.** Use lining over oldstyle: oldstyle figures are "hard to read in tables, tooltips, and axis ticks". Use tabular over proportional so digit counts compare. Oldstyle figures are nearly always proportional, and tabular figures are always lining. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Weights and sizes.**
  - Bold is for titles and highlights. Regular or medium is for notes and annotations.
  - Thin weights only work large and at high contrast.
  - Condensed type is harder to read: "normal-width text in a smaller size is as or even more readable than bigger text in a narrow typeface".
  - Datawrapper annotations default to 14px. Below 12px is "probably too small".
  - WaPo example: key numbers bold and black, secondary values regular and grey.

  — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)

- **FT type system.**
  - Financier (Klim, Kris Sowersby) was drawn for the FT; Metric is its sans companion.
  - The ft.com Origami o3 tokens use "financier display VF" (200–800) and "metric 2 VF" (300–800). Headlines are Financier Display at 20px; navigation, labels and standfirsts are Metric.

  This is a third-party token breakdown, not an FT chart spec. — [oh-my-design FT tokens](https://oh-my-design.kr/design-systems/ft); [Klim: Financial Times in use](https://klim.co.nz/in-use/financial-times/)

- **Financier figures.**
  - "Numbers are very important to the FT."
  - Distinguishing digit traits come from Gill: "the flat-top 3, dynamic 5, three-quarter-height old-style 2, and the graceful sweep of the 6 and 9". The stated rationale is that "numbers are 'read' differently to words".
  - Financier has both lining and oldstyle numerals. Lining is the default in Text, where it harmonises because the ascenders rise above cap-height.
  - Display styles were designed to work at 18pt minimum.

  — [Klim: Financier design information](https://klim.co.nz/blog/financier-design-information/)

- **Economist chart type spec (2017 internal style guide v1.2, text extracted from the PDF):**
  - Headline: Econ Sans Bold 9.5/11pt
  - Subtitle: Econ Sans Cnd Regular 8/9.5
  - Axis labels: Cnd Reg 7/7.5
  - Sources: Cnd Light 6.5pt at 75% black ("75k")
  - Guidance: "Where possible, put units and date information on a second line at smaller font size"
  - Web charts are built at print width (332pt) and exported at 179.22% (595px)
  - The embedded Econ Sans digits all share one advance width (533 units in Light, 574 in Bold), so the figures are tabular.

  — [Economist chart style guide PDF (hosted copy)](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

- **Inter features.**
  - `tnum`: dedicated fixed-width digits that keep the same width across weights.
  - `ss01`: open digits ("3469").
  - `ss02`: disambiguation, with a serifed I and a tailed l.
  - `cv01`–`cv13`: character variants, e.g. `cv09` flat-top 3, `cv03` open 6, `cv04` open 9, `cv05` tailed l, `cv08` serifed I, `cv11` single-storey a.
  - Also available: `zero` (slashed zero) and `pnum`.
  - Google Fonts copies may lack features; self-host from rsms.me for the full set.

  — [Inter (rsms.me)](https://rsms.me/inter/); [Lexington Themes on Inter stylistic sets](https://lexingtonthemes.com/blog/inter-stylistic-sets-css-tailwind); [Blender PR using ss01/ss02/tnum](https://projects.blender.org/blender/blender/pulls/112795)

- **CSS mechanics.**
  - `font-variant-numeric: tabular-nums` maps to `tnum` and `oldstyle-nums` maps to `onum`. Prefer these over `font-feature-settings`.
  - An inherited `font-feature-settings: "tnum" 0` on an ancestor will override `font-variant-numeric`.
  - Inter-specific `ss`/`cv` features still need `font-feature-settings`.

  — [RWT: Facts about figures](https://www.rwt.io/typography-tips/facts-about-figures-numeric-styles-with-opentype-features/); [MDN font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric)

- **Newsreader** (Production Type): an editorial serif for digital news.
  - opsz axis 6–72 (default 16). Weight 200–800 per CSS Type Studio; FontAlternatives says 100–900, so the sources conflict.
  - Its listed features include tabular and proportional figures, case-sensitive forms, ordinals and superscript. No oldstyle set is listed.

  — [Production Type: Newsreader](https://productiontype.com/font/newsreader/newsreader-display); [CSS Type Studio: Newsreader](https://www.csstypestudio.com/library/font/newsreader); [FontAlternatives: Newsreader](https://fontalternatives.com/fonts/newsreader/)

- **Source Serif 4** (Frank Grießhammer, Adobe): variable, opsz 8–60 and wght 200–900. Version 4.004 added five optical sizes (60 styles). Loading the variable font with opsz makes large headings use the display cut instead of the stubby text cut. — [Wikipedia: Source Serif 4](https://en.wikipedia.org/wiki/Source_Serif_4); [adobe-fonts/source-serif releases](https://github.com/adobe-fonts/source-serif/releases); [GitHub PR example](https://github.com/Kuperman-Ventures/jasonos/pull/465)
- **Fraunces** (Undercase Type, Google Fonts 2020): axes are weight, opsz, softness and "wonk". A reviewer notes it lacks tabular figures, and Google-hosted and GitHub builds differ in features. — [FontAlternatives: Fraunces](https://fontalternatives.com/fonts/fraunces/); [Beautiful Web Type: Fraunces](https://www.beautifulwebtype.com/fraunces/)
- **Hairline's uppercase ban.** Datawrapper accepts uppercase plus letter-spacing for short group, axis and map labels (WSJ 0.08em, Reuters 0.1–0.3em, Bloomberg 0.2em). This is a common "old map" move that Hairline forbids, so it should not be imported. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)

### Inferences

- **Recommended Hairline stack:**
  - Inter for all labels, ticks and values with `font-variant-numeric: tabular-nums lining-nums`. Optionally add `font-feature-settings: "ss01","cv09"` (open digits plus flat-top 3) for an engraved-numeral feel echoing Financier's flat-top 3, while staying sans.
  - One serif (Newsreader at opsz around 20–36 for titles, or Source Serif 4 with `font-optical-sizing: auto`) for the chart title only.
  - Serif italic, if used at all, only for the source or note line, or a single in-plot annotation, following Pew's Georgia Italic description.
- **Avoid Fraunces for chart text.** It has no tabular figures, and its wonk and softness are decorative rather than authoritative.
- **Serif-numbers-plus-sans-labels inside the plot** is documented only in bespoke work (Guardian 2018, Fragapane). It works when the serif has tabular lining figures and a caption optical size, but it fights the "one system" clarity of tick labels. If tried, limit it to the hero value callout, e.g. Newsreader at opsz 6–12 with `tnum lnum`, not axes.
- **Oldstyle figures** are acceptable only in running prose around the chart (the dek or standfirst), never in ticks, tooltips or tables.
- **Units on a second line at a smaller size** (the Economist rule) is a clean way to add broadsheet hierarchy without uppercase. Set units in the same sans or a serif italic, in grey.

### Gaps

- I did not find an official FT chart typography spec (sizes and weights for chart titles, ticks and sources); the FT style CSS at ig.ft.com could not be fetched.
- Whether Newsreader or Source Serif 4 ship `onum` and `lnum` was not confirmed. Check the shipped font in Wakamai Fondue or with `ttx -t GSUB`.
- I found no user-testing evidence comparing serif and sans tick legibility on screen.

---

## 2. Rules and frames (top rules, thick-thin, baseline weight contrast, ticks)

### Takeaway

The broadsheet look comes from **weight contrast between a few rules** rather than from more rules: a heavier zero baseline against very light gridlines and ticks, an optional top rule or tag above the title, and ticks only where needed. Economist print specs give concrete ratios: ticks at 0.4–0.5pt, a black zero baseline only, an x baseline that ends at the last tick, and gridlines as the lightest element. The FT's g-axis code formalises a thin "axis" style versus a thicker "baseline" style for the zero or index line.

### Cited Findings

- **FT g-axis.** `yAxisHighlight(Number)` "changes the style of the tick specified from the normal thin 'axis' style to the thicker 'baseline'". It is used for the 100 line on index charts or when values go below zero. — [ft-interactive/g-axis](https://github.com/ft-interactive/g-axis)
- **FT tooling.** The Visual Vocabulary templates produce SVG starting points refined in Illustrator. They share the stylesheet `ig.ft.com/visual-vocabulary/styles.css` and expose `numTicksy` for scale lines. — [ft-interactive/visual-vocabulary-templates](https://github.com/ft-interactive/visual-vocabulary-templates); [Financial-Times/chart-doctor visual-vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)
- **Economist 2017 guide (text extracted from the PDF; layout extraction is lossy, so callout-to-element mapping is partly inferred):**
  - Tickmarks: "0.5pt thickness" and "0.4pt thickness" (two tick types)
  - Scatter: "Same weight/colour for x and y ticks, use black for zero baseline only", with trend lines annotated "0.3px stroke" and "1px stroke"
  - Index charts: "0.5pt red line on index line" and a "5pt diameter black circle on index point"
  - "x axis baseline ends at last tick mark"
  - Leader (small) charts: "minimal grid lines and tick-mark labelling"
  - "For stacked bars ... consider removing tick marks and labelling each segment value"
  - "axis lines can be broken" to avoid obscuring connecting lines and labels

  — [Economist chart style guide PDF](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

- **Economist top rule and tag.** A full-width "Economist red" (#E3120B) horizontal line runs along the top of the chart, with a small rectangle "tag" at top left. The source line sits bottom left at 75% opacity, and the y axis is on the right. The PDF contains red rectangles drawn 15pt × 1.5pt, plausibly the tag sample. One homage draws a 1px rule plus a 40×10px tag; those are homage values, not official. — [Towards Data Science: Economist-style plots in Matplotlib](https://medium.com/data-science/making-economist-style-plots-in-matplotlib-e7de6d679739); [AECharts: Economist-style charts](https://aecharts.com/blog/posts/how-to-create-charts-like-the-economist/); [ggthemes theme_economist](https://jrnold.github.io/ggthemes/reference/theme_economist.html)
- **Economist gridline greys.** Sources conflict: #758D99 (2017-guide-based article) versus #b7c6cf (recent homage). — [TDS article](https://medium.com/data-science/making-economist-style-plots-in-matplotlib-e7de6d679739); [AECharts](https://aecharts.com/blog/posts/how-to-create-charts-like-the-economist/)
- **crispEdges in SVG.** `shape-rendering: crispEdges` asks the user agent to emphasise clean edges. It "might turn off anti-aliasing for all lines and curves or possibly just for straight lines which are close to vertical or horizontal" and may adjust line positions and widths to align with device pixels. It applies to circle, ellipse, line, path, polygon, polyline and rect, and CSS beats the presentation attribute. — [MDN shape-rendering](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering)

### Inferences

- **Translating print points to screen.** Economist web = print × 1.79 (332pt to 595px), so a 0.5pt tick is about 0.9 CSS px and a 0.4pt tick is about 0.7px. Hairline's 1px solid hairline is therefore the screen equivalent of the Economist tick or grid weight. A heavier baseline at 1.5–2px (or 1px in full ink against grey gridlines) recreates the print weight contrast.
- **Proposed rule ladder:**
  - Gridlines: 1px in light warm grey
  - Ticks: 1px, 4–5px long, _outside_ the plot, in mid grey
  - Zero or index baseline: 1px full ink, or 2px for emphasis
  - Optional title rule: 1px ink full width, or a thick-thin pair (2px ink, a 2px gap, then 1px ink) above the title
- **Snap rule positions.** For 1px strokes, draw at y = n + 0.5 in user units (with viewBox units = CSS px). For 2px strokes, draw at integer y.
- **Use crispEdges selectively.** Apply it only to axis-aligned rules and ticks, never to data lines, diagonals or curves.
- **Double rules at 1x.** The gap must be at least 1px, and preferably 2px, or the two lines fuse into a grey smear. At 2x a 1px gap survives, but it collapses at 1x.
- **Echo the Economist without uppercase.** Hairline can borrow the tag-plus-rule idea: a short heavy ink bar (e.g. 24×4px) above a sentence-case serif title, in the hero ink rather than red.
- **Economist moves compatible with Hairline's minimalism:** end the x baseline at the last tick, break axis lines around labels, and drop ticks when segments carry their own values.

### Gaps

- I found no FT published stroke weights for "axis" versus "baseline"; the g-axis CSS was not retrieved, and ig.ft.com could not be fetched.
- Which Economist element uses the 0.5pt versus 0.4pt tick weight is ambiguous in the extracted text.
- I found no source on thick-thin "Oxford rule" usage in contemporary screen charts. That recommendation is inference from print convention.

---

## 3. Engraving and stipple on screen (hatch angles, pitch at 1x and 2x, moiré, halftone dot sizes, paper and ink pairs)

### Takeaway

Screen-safe engraving depends on **pitch landing on whole device pixels** and on **few, well-separated angles**. Use horizontal or vertical hatches (which can be pixel-snapped) for the crispest fills and 45° for character, but leave diagonals anti-aliased. Keep halftone coverage (dot ÷ pitch) under about 0.25, and retune pitch _and_ dot together at 2x. Multiple dot or hatch screens should sit about 30° apart (e.g. 15°/75°) to avoid moiré. Use `patternUnits="userSpaceOnUse"` so pitch is constant across shapes.

### Cited Findings

- **Halftone values (CodeFronts CSS demo):**
  - Default dot 1.15px at 6px pitch. At 2dppx: pitch 5px, dot 0.95px. Both give coverage ≈0.19.
  - "keep it under about 0.25 or the image fills in."
  - Soft edge: `radial-gradient(circle, ink 0 var(--dot), transparent calc(var(--dot) + 0.45px))`.
  - Named pitches: 4px "magazine", 7px "newsprint", 11px "pop".
  - Two-ink screens at 15° and 75° ("the safe pairing"). Similar angles produce moiré "that looks like a rendering bug".
  - Retune pitch and dot "together, not one". Without a 2dppx rule, "your newsprint becomes a mezzotint on phones".
  - Don't put coarse screens behind text.
  - Rotated gradients rasterise differently in Safari and Chrome, so check both.

  — [CodeFronts: Static halftone dot print effect](https://codefronts.com/design-styles/tailwind-css-grain-texture/tailwind-static-halftone-dot-print-effect/)

- **Paper and ink pairs from that demo:**
  - Paper #f2efe8 (oklch 0.95 0.012 85)
  - Surface #fbfaf6
  - Ink #14110e (oklch 0.2 0.008 70)
  - Muted #5d574d
  - Line #d8d2c5
  - Red ink #d2231f

  — [CodeFronts](https://codefronts.com/design-styles/tailwind-css-grain-texture/tailwind-static-halftone-dot-print-effect/)

- **CSS halftone.** A `radial-gradient` dot tiled with `background-size` gives hard edges via hard stops. — [CSS { In Real Life }: CSS halftone patterns](https://css-irl.info/css-halftone-patterns/)
- **Moiré in print.** It comes from overlapping screens and is reduced by rotating them relative to each other. — [Wikipedia: Halftone](https://en.wikipedia.org/wiki/Halftone)
- **SVG hatch technique.**
  - Draw one horizontal line in a small pattern tile and rotate it with `patternTransform` ([Paul Murray: Simple SVG Hatching](https://observablehq.com/@plmrry/simple-svg-hatching)).
  - For plotter or true-geometry hatching, clip real line geometry instead of using `<pattern>` (AxiDraw software doesn't support patterns) ([Paul Murray: SVG Hatching Without Using pattern](https://observablehq.com/@plmrry/diy-svg-hatching)).
  - Textures.js builds `<pattern>` elements for d3 (lines, circles, paths) and is designed for data viz ([riccardoscalco/textures](https://github.com/riccardoscalco/textures)).
  - svg-patterns is a framework-free alternative ([derhuerst/svg-patterns](https://github.com/derhuerst/svg-patterns)).
  - A tiled-fill tutorial: [Roeland Schoukens: SVG tiled pattern fills](https://observablehq.com/@roelandschoukens/svg-tiled-pattern-fills).
- **Patterns for colour-blind readers.** Patterns help people who struggle to distinguish colours (maps example). — [Joe Davies: Mapping with Textures.js](https://observablehq.com/@joewdavies/textures-js)
- **Nadieh Bremer** has an Observable notebook titled "Hatched patterns" among her SVG gradient and filter notebooks. — [Nadieh Bremer on Observable](https://observablehq.com/@nbremer)
- **WSJ hedcut convention.** It uses stipple (dots) and hatching (lines) "to emulate the look of woodcuts from old-style newspapers, and engravings on certificates and currency". Each is hand-drawn over a photo, taking 3–5 hours. — [Wikipedia: Hedcut](https://en.wikipedia.org/wiki/Hedcut)
- **crispEdges caveat.** It may only affect near-vertical or near-horizontal lines, so it is not a fix for diagonal hatches. — [MDN shape-rendering](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/shape-rendering)

### Inferences

- **Pitch rule.** Choose pitches that are whole device pixels at 1x and 2x: 4, 5, 6 or 8 CSS px with a 1px stroke. At fractional DPRs (1.25, 1.5) these become 5, 7.5 or 9 device px. Either accept slight beating, or compute `tile = round(pitchCss × dpr) / dpr` from `window.devicePixelRatio` and recompute on zoom and DPR change.
- **Axis-aligned hatches.** Horizontal or vertical hatches at integer pitch with odd-width strokes offset by 0.5 are the only truly crisp hatch on screen. They read as "ruled" engraving (banknote or ledger), a good fit for a broadsheet look.
- **45° hatches.** These read as engraving but will always anti-alias. Pitch on the diagonal is pitch_tile ÷ √2, so a 6px tile gives about 4.24px line spacing. For a 45° hatch with perpendicular spacing s, use tile = s·√2 (or rotate a horizontal-line tile with `patternTransform="rotate(45)"` so s is exact). Use a stroke of at least 1px, since sub-pixel diagonals vanish into grey.
- **Angle conventions (from print and engraving, inferred):**
  - Single hatch at 45°.
  - Crosshatch at 45°/135° (90° apart, the most stable on screen) or 0°/90° (crispest).
  - For two hatched series, separate them by angle (45° versus 135°, or 0° versus 45°) and by pitch (e.g. 4px versus 6px), not just angle.
  - Avoid near-coincident angles (e.g. 30° next to 45°).
- **Stipple and halftone values for Hairline.** Fixed-pitch dots with coverage of 0.12–0.25:
  - 1x: pitch 4px, dot r 0.6–0.8px; pitch 6px, dot r 1–1.2px.
  - 2x: halve the pitch only if you want the same physical texture. Otherwise keep the CSS pitch and shrink r slightly (e.g. 1.15 to 0.95px per CodeFronts) so the dots stay distinct.
  - Rotating the dot grid by 15° adds a print character, but at the cost of slight shimmer. Unrotated grids are crisper.
- **Random stipple.** Prefer blue-noise or Poisson-disc stipple over pure random for "engraved stipple". It avoids clumps that read as dirt. Precompute it once per pattern tile so the texture is deterministic.
- **Paper and ink.** Hairline's #fbfbf9 is lighter and cooler than CodeFronts' #f2efe8. Warmer engraved inks that still pass text contrast on #fbfbf9 (my WCAG calculations):

  | Ink                   | Contrast on #fbfbf9 |
  | --------------------- | ------------------- |
  | #14110e               | 18.2:1              |
  | #2b2620               | 14.5:1              |
  | #3b2f25 (sepia-black) | 12.5:1              |
  | #704214 (sepia)       | 8.2:1               |

  These are computed values, not sourced recommendations.

- **Fill opacity.** Avoid `opacity` or `fill-opacity` on pattern fills over other textures. Two semi-transparent patterns overlapping create unintended moiré. Use solid ink lines on paper, and vary density by pitch or stroke instead.

### Gaps

- I found no authoritative source (browser vendor or W3C) giving exact moiré-free pitch rules for SVG patterns at fractional DPR. The integer-pitch reasoning is inference.
- I found no newsroom (FT, Economist, Bloomberg, Reuters) documentation of engraved or stipple fills in charts. The search turned up nothing showing Bloomberg or Reuters using engraving styles in data charts.
- The Safari and Chrome pattern-rasterisation differences were not quantified.

---

## 4. Contemporary practitioners and projects doing this well

### Takeaway

Documented exemplars split into three groups:

- **Newsroom rule-and-type systems:** the Economist's red rule and tag with tabular sans, FT g-axis baseline styling and Financier/Metric, and Guardian 2018 serif figures.
- **Literary or serif-led bespoke work:** Fragapane.
- **Code-driven texture:** Bremer's SVG notebooks, Textures.js, and Paul Murray's plotter-ready hatching.

I found no source showing FT, Economist, Bloomberg or Reuters charts with engraved fills; that territory is occupied by illustration (WSJ hedcuts) and generative or plotter art.

### Cited Findings

- **Economist:** the 2017 visual style guide (PDF), with the red top rule, tag, tabular Econ Sans, 0.4–0.5pt ticks and a black zero baseline only. — [PDF](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf); [TDS recreation](https://medium.com/data-science/making-economist-style-plots-in-matplotlib-e7de6d679739)
- **FT:**
  - The Visual Vocabulary poster is inspired by Schwabish and Ribecca's Graphic Continuum ([chart-doctor](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md)).
  - g-axis provides the thin-axis versus thick-baseline convention ([g-axis](https://github.com/ft-interactive/g-axis)).
  - The type is Financier, with numerals designed for distinguishability ([Klim](https://klim.co.nz/blog/financier-design-information/)).
- **Guardian 2018:** a serif for all labels and numbers (Guardian Text Egyptian + Guardian Figures). — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Federica Fragapane:** serif-led, literary data visualisation. Her process is analysis, then structure sketches, with inspiration from "forms, natural elements, landscapes, paintings". — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization); [Design Decode interview](https://www.designdecode.org/federica-fragapane/); [Nightingale interview](https://medium.com/nightingale/federica-fragapane-on-visualizing-theatre-childrens-books-and-more-bcb9b5174b21); [PolicyViz #266](https://policyviz.com/podcast/episode-266-federica-fragapane/)
- **Nadieh Bremer:**
  - Her KIKK masterclass "SVGs beyond mere shapes" covered gradients and filters ([KIKK](https://2019.kikk.be/en/program/workshops-masterclasses/nadieh-bremer-1)).
  - Her Observable notebooks include "Hatched patterns" ([Observable](https://observablehq.com/@nbremer)).
  - She says she works "directly with data, without adding anything graphical or hand drawn". This quote came from a search snippet; I didn't confirm which interview page it is on, but [Pixel Pioneers](https://pixelpioneers.co/blog/designing-data-visualisations-an-interview-with-nadieh-bremer) or [Storybench](https://www.storybench.org/nadieh-bremer-on-thinking-outside-the-lines/) is likely.
  - Her blog is [Visual Cinnamon](https://www.visualcinnamon.com/about/).
- **The Pudding:** used the handwritten face Walter Turncoat in one piece. This is a handmade register, not an engraved one. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Pew Research:** Georgia Italic description line with a sans chart. — [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Code resources:**
  - [Textures.js](https://github.com/riccardoscalco/textures)
  - [Paul Murray: Simple SVG Hatching](https://observablehq.com/@plmrry/simple-svg-hatching)
  - [Paul Murray: DIY hatching for plotters](https://observablehq.com/@plmrry/diy-svg-hatching)
  - [svg-patterns](https://github.com/derhuerst/svg-patterns)
  - [Joe Davies: Mapping with Textures.js](https://observablehq.com/@joewdavies/textures-js)
- **WSJ hedcuts:** the canonical newspaper stipple and hatch illustration style. — [Wikipedia: Hedcut](https://en.wikipedia.org/wiki/Hedcut)

### Inferences

- **The closest model for Hairline** is FT and Economist rule discipline combined with Guardian-2018 or Fragapane typographic warmth, used sparingly (a serif title), plus Textures.js or Murray-style fixed-pitch hatches that act as engraved print-tint substitutes. Each of these is documented separately. I found no single source that combines them.
- **Giorgia Lupi and Dear Data** (hand-drawn, idiosyncratic glyphs) conflict with Hairline's "no decorative" rules. The transferable lesson is dense, small, consistent mark vocabularies, but this was not researched in depth here.

### Gaps

- I could not retrieve specific links for FT, Reuters or Bloomberg pieces using engraved or hatched fills, or for Giorgia Lupi or Dear Data, within budget.
- Generative plotter-art practitioners (e.g. people publishing on engraving-style line shading) were not surveyed beyond Paul Murray's notebooks.
- Bremer's "Hatched patterns" notebook contents (pitch and angle values) were not read.

---

## 5. Accessibility: fine rules, small type, legible patterns, not relying on texture alone

### Takeaway

WCAG 1.4.11 requires 3:1 against adjacent colours for graphical objects needed to understand the content. Gridlines count when readers need them to read values, and thin anti-aliased lines render fainter than their CSS colour, so W3C advises avoiding particularly thin lines or exceeding 3:1. Text (ticks, labels, sources) falls under 1.4.3 (4.5:1, or 3:1 for large text). Direct labels _with values_ can exempt a graphic, and patterns have no specific W3C guidance. So texture should be redundant with labels, never the sole channel.

### Cited Findings

- **The 3:1 requirement.** SC 1.4.11 requires 3:1 for "parts of graphics required to understand the content". "Not every graphical object needs to contrast with its surroundings." Decorative graphics, information given elsewhere (a data table) and essential presentations (heat-map gradients) are exempt. — [W3C Understanding SC 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Gridlines are in scope** when needed. Figure 20 says: "To perceive the values of each line along the chart you need to discern the grey lines marking the graduated 100 value increments." — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Line graphs.** Each line needs 3:1 against the background, but lines with little overlap needn't contrast with each other or with the gridlines. — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Labels can substitute only with values.** Text conveying the same information ("labels _and_ values on a chart") removes the requirement; labels alone do not (the pie-chart Figure 46 fails). Pie slices can pass with white gaps or a darker border. — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Thin lines.** Anti-aliasing makes thin lines appear fainter than their colour. Testing uses the specified colour, but the advice is to "avoid particularly thin lines and shapes, or to use a combination of colors that exceeds" 3:1. — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **No pattern guidance.** The W3C page has no examples or guidance on patterns or textures. — [W3C](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Text sizes.** Text contrast is 1.4.3 (4.5:1 normal, 3:1 large). WCAG sets no minimum font size. Datawrapper suggests 12px is about the floor. — [Knowbility on 1.4.11](https://knowbility.org/blog/2018/wcag21-1411contrast); [Datawrapper](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- **Patterns as a colour-blindness aid.** Patterns help readers who struggle to distinguish colours. — [Joe Davies: Mapping with Textures.js](https://observablehq.com/@joewdavies/textures-js)

### Inferences

- **Computed contrast against Hairline paper #fbfbf9** (my WCAG calculations, not sourced):

  | Grey    | Contrast | Use                     |
  | ------- | -------- | ----------------------- |
  | #d8d2c5 | 1.45:1   | Decorative only         |
  | #b7b3aa | 2.0:1    | Decorative only         |
  | #9a958c | 2.87:1   | Just fails 3:1          |
  | #8a857c | 3.54:1   | Passes 3:1, fails 4.5:1 |
  | #7a756c | 4.42:1   | Just fails 4.5:1        |
  | #6b665e | 5.5:1    | Passes 4.5:1            |
  | #5d574d | 6.9:1    | Passes 4.5:1            |

  Economist-style grids: #758D99 is 3.36:1 and #b7c6cf is 1.69:1.

- **Practical ladder:**
  - Purely orientational gridlines (with values labelled directly or ticks present) can sit around 1.3–2:1 as "decorative support". This is defensible only if values are recoverable from labels.
  - Gridlines readers must use to read values, ticks, and the baseline should be at least 3:1 (≈#8a857c or darker).
  - Tick and label text should be at least 4.5:1 (≈#6b665e or darker) at 12–13px+.
  - The "75k" Economist source line is roughly 75% ink. On #fbfbf9 a warm grey around #5d574d to #6b665e keeps that look and passes 4.5:1.
- **Pattern fills:**
  - The _ink lines_ of a hatch should be at least 3:1 against paper (e.g. #5d574d or darker).
  - The _perceived tone_ of a sparse hatch is much lighter than the ink. A 1px line at 6px pitch covers about 17% of the area.
  - So outline hatched regions with a solid 1px ink border (as W3C's darker-border pie example does) so the region boundary passes 3:1 independently of the texture's average tone.
- **Don't rely on texture alone:**
  - Pair each pattern with a direct label (the series name, plus a value where the chart is exempt-by-labels).
  - Keep the hero series as solid ink, not texture.
  - Use at most 3–4 distinct patterns distinguished by both angle and density.
  - Avoid pitches below 3px at 1x; they visually merge into flat grey and lose their distinguishing power.
  - Respect `forced-colors` mode: patterns using `currentColor` survive high-contrast modes better than hard-coded fills.
- **Hairline 1px lines.** Pixel snapping (0.5 offsets, crispEdges on axis-aligned rules) keeps them at their full specified colour rather than a fainter anti-aliased two-pixel smear. This directly addresses W3C's thin-line caveat.

### Gaps

- I found no W3C or academic guidance on the minimum hatch pitch or line weight for pattern legibility, or on treating a pattern's average tone versus its line colour for contrast purposes.
- The `forced-colors` behaviour of SVG `<pattern>` fills across browsers was not verified.
