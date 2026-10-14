# Print-era financial and economic chart conventions (c.1950s–2000s) and what carries over to screen

Scope note: the most detailed primary document found is The Economist's internal _Visual Styleguide_ v1.2 (Matt McLean, 4 May 2017), which records late print-era practice right at the print-to-screen transition. It is an internal document hosted by third parties ([IPAA copy](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf); [studylib copy](https://studylib.net/doc/27402360/chartstyleguide-20170505)). I extracted its text with `pdftotext`, which jumbles the layout, so some annotations are reconstructed from adjacent fragments. Those are flagged. Pre-1990 primary material (archived FT/WSJ/BusinessWeek pages) was not reached in this pass. No images were copied; only links are recorded.

---

## 1. How print financial charts handled the mechanics: rules, tints, patterns, axes, type, index and log scales, shading, labelling, sources

### Takeaway

The documented print vocabulary is built from fine rules (about 0.3–0.5pt), black reserved for the zero baseline, grey tint screens for grids and highlight panels, the value axis on the right for time series, condensed sans type at 6.5–9.5pt, abbreviated year labels, index lines marked at 100, and a semicolon-separated source line in a lighter tint. Hatching was the monochrome fallback, but the documented guidance treats it as weaker than tints, direct labels and fewer series.

### Cited Findings

**Rule and gridline weights (Economist 2017 guide, print specs)**

- Tick marks are specified at "0.5pt thickness". A second rule weight of "0.4pt thickness" sits next to it. In the extracted text this lands beside "Where possible, put units and date information on a second line…", so it most likely refers to gridlines (reconstructed). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Gridlines have their own neutral print colour, "GRID LINES C10 K25" (a light cool grey). The neutral "BLACK PALETTE" runs as tint steps K25 / K50 / K75 / K100. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The scatter-chart page says "use black for zero baseline only" and "Same weight/colour for x and y ticks". Bubble outlines are "0.3px stroke" with "50% opacity fill". Trend lines are a "1px stroke". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Table rules are "0.5px 100k" (full black) and "0.3px 50k" (50% black). Tables use "alternating row colours" and "3pt internal padding". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- A third-party description of the post-2017 Economist chart: a white plot area on a pale ground, light horizontal gridlines only, a black x-axis baseline with ticks below it, no y-axis rule or ticks, and the y-axis on the right. — [ggthemes theme_economist docs](https://jrnold.github.io/ggthemes/reference/theme_economist.html)
- Dona Wong's WSJ guide (2010) recommends thin rules every three to five rows in tables, and every three lines in wide tables. It also says to align decimals. — summarised in search results drawing on [Goodreads listing](https://www.goodreads.com/book/show/6542897-the-wall-street-journal-guide-to-information-graphics) and [exec-comms review](https://www.exec-comms.com/blog/2011/12/19/book-review-the-wall-street-journal-guide-to-information-graphics-by-dona-m-wong/). These are secondary summaries; I did not read the book text directly.
- Tufte's chartjunk examples include "heavy or dark grid lines", "ornamental shading" and "3-D simulations". — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk) (term from _The Visual Display of Quantitative Information_, 1983)

**Tints / percentage screens of black**

- Printing background: a halftone breaks continuous tone into equally spaced dots of varying size, printed in one ink. Typical screens were 50–85 lines per inch for newspapers and 100–120 lpi for magazines. Britannica also notes the Benday tint process. — [Britannica: Halftone process](https://www.britannica.com/technology/halftone-process); [Wikipedia: Halftone](https://en.wikipedia.org/wiki/Halftone)
- The Economist's 2017 guide still specifies tints by percentage. Source text is "75% black" (also written "75k"). Explanatory table text is "75k". Highlight panels use a "30% tint", with a grey panel option of "c15, k10". The text-box fill is "c22.5 k15 100% multiply". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Modern guidance on grey-only charts: grey shades imply more/less or earlier/later, so they confuse categories with no natural order. In practice you are limited to about four or five distinguishable greys. — [Practical Reporting (Sept 2023)](https://www.practicalreporting.com/blog/2023/9/20/the-tricky-business-of-designing-charts-that-will-be-printed-in-black-and-white)
- The Economist guide matches this ordering logic in colour: "Where categories are chronological, use light-to-dark scale", "If categories form meaningful groups, use colour to reinforce that", and "Use grey for 'other' / 'don't know' etc". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Hatching and patterns in monochrome**

- Pattern fills may not be discernible in small shapes such as short bars or thin slices. Charts that must survive photocopy or fax (pure black and white, not greyscale) need different handling from greyscale charts. — [Practical Reporting (2023)](https://www.practicalreporting.com/blog/2023/9/20/the-tricky-business-of-designing-charts-that-will-be-printed-in-black-and-white)
- For lines, the usual non-colour separators are varying thickness, dashed or dotted strokes, markers, direct labels and small multiples. — [Binghamton accessibility KB](https://binghamton.teamdynamix.com/TDClient/45/Portal/KB/Article/16247/Making-Charts-and-Graphs-Accessible); [Practical Reporting](https://www.practicalreporting.com/blog/2023/9/20/the-tricky-business-of-designing-charts-that-will-be-printed-in-black-and-white)
- Research method "Color2Hatch" (Springer) converts colour regions into hatch patterns using short segments, zigzags and waves, and reports better region separation than greyscale conversion. — [Springer, Visual Computer 2021](https://link.springer.com/article/10.1007/s00371-021-02268-2)
- The Economist guide uses dashes for non-data or reference marks: a "dashed 3px, 1px" stroke appears on the scatter/trend page, and "To distinguish from plotted data, use dotted lines for labels" (leader lines) on the timeline page. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Value axis on the right for time series**

- William Playfair's _Commercial and Political Atlas_ (1801 edition) puts y-axis labels on the right of all its time series, next to the most recent data. Nicholas Cox calls right-hand axis labels with variable information at the top "commonplaces of financial journalism", citing the _Economist_ and _Financial Times_. — [Cox, "Speaking Stata: Axis practice", Stata Journal 2012](https://journals.sagepub.com/doi/pdf/10.1177/1536867X1201200314)
- Rationale: in time series the most recent values usually matter most, so put the axis there when there are no data labels. — [EU Data Visualisation Guide: Axes, grids and legends](https://data.europa.eu/apps/data-visualisation-guide/axes-grids-and-legends); Maarten Lambrechts quoted in [Len Kiefer (Nov 2020)](http://lenkiefer.com/2020/11/20/y-axis-on-the-right-side/)
- The FT's open-source chart code (g-axis, part of the g-chartframe / Visual Vocabulary tooling) documents that the yLinear axis aligns right by default. — [ft-interactive/g-axis on GitHub](https://github.com/ft-interactive/g-axis/blob/master/)
- Counterpoint: right-side labels are "clearly not the norm" (probably because of left-to-right reading and software defaults), and they can make direct labelling at line ends harder because both compete for the right margin. — [PolicyViz, Aug 2026](https://policyviz.com/2026/08/25/right-side-y-axis-labels-fan-or-foe/); [PolicyViz 2020](https://policyviz.com/2020/09/23/on-positioning-the-vertical-axis/)
- The "Coding for Economists" guide reproduces the FT look with `ax.yaxis.tick_right()`. It notes that right-hand ticks give time series "a sense of right-ward motion". — [Coding for Economists: Narrative data vis](https://aeturrell.github.io/coding-for-economists/vis-narrative.html)

**Small type and typographic hierarchy (Economist 2017 print sizes, size/leading)**

- Standard chart: headline Econ Sans Bold 9.5/11pt; subtitle Econ Sans Cnd Regular 8/9.5; labels Cnd Medium 7.5/9; Cnd Light 7.5/9; axis labels Cnd Regular about 7/7.5 (reconstructed); source line Cnd Light 6.5pt at 75% black. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Leader/"World this Week" mini-charts: Econ Sans Bold 8pt, Cnd Reg 7pt, light and medium 6pt. "Leader blocks should be simplified as much as possible, with minimal grid lines and tick-mark labelling. Emphasis should be on showing a clear overall message, rather than identifying values for every data point." — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Role assignments for typefaces: Bold is for chart headlines and oversize numbers ("Use rarely"); Cnd Bold "Use rarely – prominent labelling only"; Cnd Medium for top-level labels, panel headings and coloured text; Cnd Regular for subtitle and standard labelling; Cnd Light for axis labels and source text. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Units and dates go on the subtitle line ("Where possible, put units and date information on a second line… smaller font size"). Examples: "Ten-year government-bond yields, %", "% increase on a year earlier". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Footnote symbol order: * † ‡ § ** †† ‡‡ §§. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Dona Wong (WSJ): leading about 2pt above type size (for example 10/12); one simple face; bold or italic only for emphasis and never both; no all caps; avoid reversed (white-on-black) type; no hyphenation. — secondary summaries of [Wong 2010](https://www.goodreads.com/book/show/6542897-the-wall-street-journal-guide-to-information-graphics) (book text not read directly; see Gaps)
- Most data-vis type, including all Economist and Bloomberg charts, is sans serif. The Economist (2022) uses Econ Sans and Econ Sans Condensed, different styles of one commissioned family. — [Datawrapper: fonts for data vis (Muth, July 2022)](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- Chart widths are tied to print columns: 1 column = 160pt, 2 columns = 332pt, 3 columns = 504pt, plus 117pt / 245pt fractional widths and 83.5pt fixed-height leader blocks. Web charts are "built at standard print widths and then exported at 179.22%" (332pt becomes 595px; 160pt becomes 290px). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Date labels**

- The guide's examples consistently abbreviate years after the first, showing the full year at the start and at the century turn: "1985 90 95 2000 05 10 16", "2007 08 09 … 15". Single-letter month ticks appear with the year beneath ("J J A S O N D J F M A M / 2015 2016"). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Index charts**

- The "Index charts" style specifies a "0.5pt red line on index line" (the 100 line) and a "5pt diameter black, 0.5pt stroke circle on index point". The base is stated in the subtitle, for example "2015=100" or "1979=100". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Indexing is the prescribed escape from double scales: "If you cannot conform to the above rules try splitting the chart into panels or indexing the variables." — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Double scales and broken scales**

- "Double scales can be good at showing correlations and are economical with space. But they can also be confusing/misleading." Things to avoid: breaking the scales without good reason; misaligned zero lines when plotting above and below zero ("make the zero lines align"); and mixing disparate measures to force visual correlation. "Always choose the axis colour order that will visually associate the labels best with the corresponding line." Coloured y-axis labels use Cnd Regular rather than Light. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Sarah Leo (The Economist, 2019) redesigns of dual-axis charts suggest choosing axis ranges so they cover the same share of the full scale. — [eagereyes, Apr 2019](https://tagteam.harvard.edu/hub_feeds/1977/feed_items/2489308/about) (summary of Leo's Medium post "Mistakes, we've drawn a few": [Medium](https://medium.com/the-economist/mistakes-weve-drawn-a-few-8cdd8a42d368))
- Broken scales: use them when breaking the y-axis on line, thermometer and scatter charts; they are "not needed on indexed, negative scale or inverted scales". "DON'T BREAK SCALE ON BAR/COLUMN CHARTS – USE THERMOMETER INSTEAD." The broken-scale symbol is drawn with a "black 0.4 stroke", "6pt width, centred between baseline and first y-axis tick". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Inverted scales are an accepted device when clearly labelled, for example "Rand per $, inverted scale". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Log scales**

- The Economist guide's timeline examples label log axes explicitly ("log scale") on long-run financial series (Mexico debt/peso crises). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The FT's 2020 COVID trajectory charts (John Burn-Murdoch) used log scales because exponential spread is natural on log. A linear version would be "less useful" and "more panic-inducing". — quoted via [FlowingData, Mar 2020](https://flowingdata.com/2020/03/12/coronavirus-process-080/)
- A 2020 _Health Economics_ study found readers shown COVID deaths on log scales understood the pandemic less accurately than readers shown linear scales. It names the FT among outlets using log scales. — [Romano et al., Health Economics 2020](https://onlinelibrary.wiley.com/doi/full/10.1002/hec.4143)

**Recession shading and highlighted periods**

- The NBER published its first business-cycle dates in 1929. The US Commerce Department's _Business Cycle Developments_ (from October 1961; renamed _Business Conditions Digest_ in 1968; folded into the _Survey of Current Business_ in 1990) carried the NBER chronology. Romer & Romer describe the "ubiquitous gray bars" that graphing software now offers. — [Romer & Romer, NBER Recession Dates](https://eml.berkeley.edu/~dromer/papers/NBER%20Recession%20Dates.pdf); [NBER dating FAQ](https://www.nber.org/research/business-cycle-dating/business-cycle-dating-procedure-frequently-asked-questions)
- FRED's convention: the whole peak and trough periods are shaded for monthly and quarterly data. For daily data, shading runs from the 15th of the peak month to the 15th of the trough month. An ongoing recession is shaded lighter until the NBER fixes its end date. — [FRED Help: recession bars](https://fredhelp.stlouisfed.org/fred/data/understanding-the-data/recession-bars/)
- The Economist's "Highlight panels" use a "30% tint" of a red (approximately c10 m70 y50) or a grey (c15 k10). "For highlights that are central to the message of the chart, use colour"; otherwise use the neutral grey. For web-only charts, use the print background colour for highlights. Highlights are labelled in Light 6.5pt UPPERCASE, as with "FORECAST" (reconstructed). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Timelines: "Use thin alternating-colour bars to mark out time periods" (for example presidential terms). Use key symbols for repeated events "to avoid duplicating text labels". Annotation text boxes are 12pt high (one line) or 23pt (two lines) with 6pt horizontal padding, set in Cnd Reg 7.5/9.5pt. Arrows are "0.5px stroke, arrowhead 21, 50%". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)

**Direct labelling, legends and emphasis**

- Coloured line labels sit next to the lines in the guide's examples. Where linking lines get too crowded, "key the labels with small colour block". For stacked bars with few categories, "consider removing tick marks and labelling each segment value." On scatters, "use explanatory labels to make the correlation clear." — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The guide's "Highlight labels" rule: "If there are only 1 or 2 points, and they are key to the chart meaning, use colour/medium font." — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Sarah Leo's 2019 fix for an over-coloured pensions chart: keep one colour for all countries, fade the unlabelled ones, set the focus country in bold and the OECD average in italic. In other words, emphasis comes from typographic weight and transparency rather than extra hues. — [Economist on Medium, "Mistakes, we've drawn a few" (2019)](https://medium.com/the-economist/mistakes-weve-drawn-a-few-8cdd8a42d368)

**Source lines**

- Format: "Source: Thomson Reuters" or "Sources: IMF; Reuters; The Economist", with sources separated by semicolons and footnote symbols on the same line ("*Preliminary estimate", "*The Economist estimate"). Set in Cnd Light 6.5pt at 75% black, bottom-left. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Wong's process step "Research" asks for current, authoritative and independent sources, and "Review" asks you to check the plot against the sources. — summaries of [Wong 2010](https://www.goodreads.com/book/show/6542897-the-wall-street-journal-guide-to-information-graphics)

### Inferences

- The pairing of a 0.4–0.5pt hairline grid with a black 0-baseline is a print-legibility hierarchy: the grid recedes as a tint while the reference line carries full ink. This maps directly to screen as low-contrast grid plus a full-contrast baseline.
- Abbreviated year labels ("2000 05 10") and condensed faces are space-saving responses to 160pt-wide single-column charts. They remain useful on narrow mobile charts.
- Recession shading was probably a pale screen of black (a tint) in monochrome print. That is inferred from the "gray bars" tradition and tint-based print practice; no primary print spec was found.

### Gaps

- **Tabular (lining, fixed-width) figures:** no source in this pass documented newspaper chart or market-table use of tabular figures, though it is standard typesetting practice for stock tables. Unverified.
- **Pre-1990 hatching practice** at specific papers (FT, WSJ, BusinessWeek): no primary or secondary source found. Tufte's 1983 critique of "moiré vibration" from cross-hatching is from memory of _VDQI_ and was not verified in this pass; the Wikipedia chartjunk page fetched does not mention it.
- **Scale labels inside the plot** (numbers sitting on top of gridlines, flush right): this is visible convention in Economist and FT charts, but the 2017 guide text as extracted does not state it explicitly. ggthemes says "y-axis on the right".
- The exact meaning of the "0.4pt" annotation is unclear because of garbled extraction.

---

## 2. Publication histories: The Economist, WSJ (hedcuts, engraved aesthetic), Fortune and BusinessWeek, FT market pages, Nigel Holmes vs Tufte

### Takeaway

The Economist's look runs from Erik Spiekermann's May 2001 redesign (colour print, Officina for graphs, red and boxed containers), through the long "blue chart" era with tinted backgrounds, to the 2017 chart restyle (white background, rotated red tag, Econ Sans, new palette) and the 2018 print redesign. The WSJ's engraved identity comes from Kevin Sprouls's 1979 stipple hedcuts, which echo banknote and certificate engraving. The Holmes-vs-Tufte argument (1983–1992) frames the poles of illustrated, popular charts versus minimalist, data-ink charts. Research since 2010 complicates Tufte's position.

### Cited Findings

**The Economist**

- In May 2001 Erik Spiekermann redesigned the paper. It moved to colour printing, used a limited red/white palette with clearly defined containers, and adopted ITC Officina Sans as the "information" face for the growing number of graphs. — [NCSU GD203: Spiekermann's 2001 redesign](https://go.distance.ncsu.edu/gd203/?p=69076); [Spiekermann blog](https://spiekermann.com/en/why-the-economist-is-thriving/)
- Corroboration: the 2017 chart guide PDF still embeds OfficinaSanITC (Book, Book Italic, Medium, Bold) alongside the new Econ Sans. This was observed in the PDF's font resources, presumably in its "old design" comparisons. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The 2017 guide's "What's changed" page, old versus new: "rotated tag", "New typeface", "White background", "24pt spacer between panels", "Marker for panels", "No margins", "Source text 75% black", "New colour palette". — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The red tag: in print, ECON RED is C0 M100 Y100 K0; on the web it is #E3120B. It is used for the top rule and the tag rectangle at top left. In the PDF the red rectangle object measures about 15 × 1.5pt (fragment). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf); [Medium: Economist-style plots in Matplotlib](https://medium.com/data-science/making-economist-style-plots-in-matplotlib-e7de6d679739)
- The 2017 web series palette: Red #DB444B, Blue #006BA2, Cyan #3EBCD2, Green #379A8B, Yellow #EBB434, Olive #B4BA39, Purple #9A607F, Gold #D1B07C, Grey #758D99. It comes with "equal lightness colour scales", a near-black #0C0C0C, nav/box greys (#E9EDF0, #B7C6CF) and text #3F5661. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The ggthemes palette order (blue, cyan, green, yellow, olive, purple, gold, grey, red) puts red last because the house style reserves it for the data the chart is making a point about. — [ggthemes economist_pal](https://jrnold.github.io/ggthemes/reference/economist_pal.html) (third-party reconstruction)
- The blue era: Economist charts with blue backgrounds were an outlier, since most designers used warm or neutral backgrounds. The current Economist background is brighter and less saturated than before. — [Datawrapper: background colour of data vis](https://www.datawrapper.de/blog/background-color-of-data-visualizations). Third-party approximations of the classic backgrounds: blue #dee9ec, beige #f1f0e9 — [Medium tutorial](https://medium.com/@matteo.larrode2/create-a-the-economist-style-chart-84193a69263e) (unofficial).
- An October 2018 Economist post says "Even our distinctive blue charts remain". It describes how the paper's early large visualisations gave way to the "smaller, more sober square charts" it is best known for. The new weekly _Graphic detail_ print page launched then. — [Economist on Medium (Oct 2018)](https://medium.com/the-economist/data-journalism-at-the-economist-gets-a-home-of-its-own-in-print-92e194c7f67e) (403 on fetch; content via search snippet)
- The 2018 print redesign was led by Phil Kenny (head of graphics) and Stephen Petch (art director), with Milo Serif and Econ Sans. Petch: "What started out as a strict set of design rules 2001 has become a bit flabby." Kenny: "The paper has always been text-heavy, so there's a constraint on data visualisation. We became attuned to getting a lot of info into a small space." — [It's Nice That (Oct 2018)](https://www.itsnicethat.com/news/the-economist-rebrand-phil-kenny-graphic-design-221018)

**The Wall Street Journal**

- The hedcut is a half-column portrait built from stippled dots and short hatched lines. It emulates woodcuts from old newspapers and engravings on certificates and currency. — [Wikipedia: Hedcut](https://en.wikipedia.org/wiki/Hedcut)
- The WSJ adopted the current form in 1979, when freelancer Kevin Sprouls brought it ink-dot drawings. The editor felt they fitted the paper's "classical tone", and the paper had long avoided photographs. — [Wikipedia: Kevin Sprouls](https://en.wikipedia.org/wiki/Kevin_Sprouls); [Sprouls blog (Oct 2012)](https://www.sprouls.com/ink-rhythm-blog/2012/10/stipple-portraits-wsj-hedcut-style)
- Sprouls became the WSJ's first full-time artist and later assistant art director and head of illustration. His stipple work won a Society of Illustrators gold medal in 1986. A hedcut takes about six hours of hand-placed dots over a traced contour "map". — [Wikipedia: Kevin Sprouls](https://en.wikipedia.org/wiki/Kevin_Sprouls); [Fast Company](https://www.fastcompany.com/1672550/what-the-wsjs-portrait-artist-can-teach-you-about-innovation)
- Noli Novak has been a WSJ senior illustrator since 1987 and continued the style. — [Lines and Colors (2010)](http://linesandcolors.com/2010/06/17/noli-novak/)
- Dona M. Wong, former WSJ graphics director, published _The Wall Street Journal Guide to Information Graphics_ (W.W. Norton, 2010, 157pp). It sets out three needs (rich content, inviting visualisation, sophisticated execution), a four-step process (research, edit, plot, review), pie charts with five or fewer slices, sizing by area, and guidance on truncated or broken axes. — [Goodreads](https://www.goodreads.com/book/show/6542897-the-wall-street-journal-guide-to-information-graphics); [Communication Arts review](https://www.commarts.com/book-reviews/the-wall-street-journal-guide-to-information-graphics); [Internet Archive record](https://archive.org/details/wallstreetjourna0000wong)

**Fortune and BusinessWeek**

- Fortune led on illustration and information graphics in the 1930s–50s, with vivid colour at a time when most business magazines were black-and-white compendiums of statistics. — [Eye Magazine: "Taking care of business"](https://eyemagazine.com/feature/article/taking-care-of-business); [The Functional Art on Fortune, March 1938](http://www.thefunctionalart.com/2014/07/gorgeous-infographics-from-fortune.html)
- Fortune went fortnightly in 1978. Marshall Loeb, managing editor from 1986, modernised it to include more charts and graphs. — [Britannica: Fortune](https://www.britannica.com/money/Fortune)
- BusinessWeek, under Stephen Shepard (1984–2005), reached six million readers or more by the late 1980s. Bloomberg bought it in 2009 and relaunched it in April 2010 with Richard Turley as creative director. Karlssonwilker built its new infographic vocabulary. — [Wikipedia: Bloomberg Businessweek](https://en.wikipedia.org/wiki/Bloomberg_Businessweek); [karlssonwilker case study](https://karlssonwilker.com/case-study/bloomberg-businessweek)
- "Info-graphics" became a widely used term after USA Today's success in the 1980s. — [HuffPost: short history of information design](https://www.huffpost.com/entry/fauxinfo-its-all-around-y_b_812397) (secondary, low authority)

**Financial Times**

- The FT has printed on pink (salmon) paper since 2 January 1893, to distinguish itself from the _Financial News_. Unbleached paper was cheaper at the time; dyed paper costs more now. The FT Origami "paper" colour is #FFF1E5 and claret is #990F3D; Quartz gave an older value of #fff1e0. — [Quartz (2015)](https://qz.com/462285/why-the-financial-times-is-pink); [Wikipedia: Financial Times](https://en.wikipedia.org/wiki/Financial_Times)
- Alan Smith (FT Head of Visual and Data Journalism, previously at ONS, OBE 2011) centralised the FT's formerly platform-split graphics teams (print, online, interactive). He writes the _Chart Doctor_ column and created the FT Visual Vocabulary, inspired by the Graphic Continuum. His book is _How Charts Work_ (2022): "there is no such thing as a neutral chart. The decision to make a chart is an editorial decision." — [Talking Biz News](https://talkingbiznews.com/they-talk-biz-news/graphics-and-data-visualization-at-the-financial-times/); [Digiday](https://digiday.com/media/financial-times-guide-data-visualization/); [Power of BI review](https://www.powerofbi.org/2023/02/05/how-charts-work-understand-and-explain-data-with-confidence-by-alan-smith/)
- Chart Doctor archive: [ft.com/chart-doctor](https://www.ft.com/chart-doctor) (paywalled; not read).

**Nigel Holmes, Tufte and the chartjunk debate**

- Tufte coined "chartjunk" in _The Visual Display of Quantitative Information_ (1983): "The interior decoration of graphics generates a lot of ink that does not tell the viewer anything new… it is all non-data-ink or redundant data-ink, and it is often chartjunk." He said graphics producers were "trained exclusively in the fine arts" and that "those who get ahead are those who beautified data, never mind statistical integrity." — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk)
- In _Envisioning Information_ (1990) Tufte attacked Holmes's Time magazine "Diamonds were a girl's best friend" chart, where the price line is a woman's leg: "Credibility vanishes in clouds of chartjunk; who would trust a chart that looks like a video game?" — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk)
- Holmes replied in the NYT (1992). He conceded some exaggeration but said Tufte was trapped in "the world of academia" and insensitive to "the world of commerce", with its need to grab an audience. Holmes says imagery lets readers pick up the message faster. — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk); [Bateman et al. 2010 PDF](https://vis.csail.mit.edu/classes/6.859/readings/pdfs/Bateman-UsefulJunk.pdf)
- Bateman et al. (CHI 2010, "Useful Junk?") used Holmes charts. They found no difference in interpretation accuracy, significantly better recall of embellished charts after 2–3 weeks, and similar eye-tracking attention to the data. Borkin et al. (2013) also found memorability gains. — [Bateman et al. 2010](https://vis.csail.mit.edu/classes/6.859/readings/pdfs/Bateman-UsefulJunk.pdf); [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk)
- Critics of minimalism: Stephen Few called Tufte's definition "too loose". Kennedy et al. (2016) argue minimalism carries "its own rhetoric and potential to bias". Parsons & Shukla (2020) observe a "corrective movement" away from minimalism. Kosara sorts chartjunk into harmful, harmless and helpful (annotations count as helpful). — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk); [EU Data Vis Guide on chart junk](https://data.europa.eu/apps/data-visualisation-guide/chart-junk-and-data-ink-minimalistic-vs-rich-design)

### Inferences

- The WSJ's stipple hedcut and the engraved, banknote-like aesthetic signal financial seriousness through association with security printing. The hedcut is portraiture rather than charting, though. No source found ties WSJ chart graphics themselves to an engraved style. Treat "engraved financial chart aesthetic" as a mood reference, not a documented chart convention.
- Holmes-style pictorial charts belong to the general-interest news magazine (Time) rather than to broadsheet financial pages. The financial pages (FT, WSJ, Economist) sat closer to the Tufte pole, because markets data was dense, daily and compared over time.

### Gaps

- No documented date was found for when the Economist's blue-tinted chart background began, or when the red box/tag first appeared (it is plausibly part of the 2001 Spiekermann container system, but that is unverified).
- No primary source was found for FT market-page chart specs from the 1970s–90s (share-price graphs, FT-SE/FT 30 index charts), nor for when the FT's right-hand axis began.
- Nigel Holmes's own writing (for example _Designer's Guide to Creating Charts and Diagrams_, 1984) was not read directly.
- Unverified recollection, not confirmed here: that Dona Wong studied under Tufte at Yale.
- The BusinessWeek and Fortune chart style of the 1980s–2000s specifically is undocumented in the sources found.

---

## 3. What makes a financial chart feel "authoritative"

### Takeaway

In the documented practice, authority comes from restraint and hierarchy rather than decoration. A message-led headline sits over a precise unit subtitle; fine rules and tints put structure below data; one emphasis colour is reserved for the point; annotation is sparing and typographically consistent; and every chart closes with an exact source and footnote line.

### Cited Findings

- The Economist's guide puts message over completeness: "Emphasis should be on showing a clear overall message, rather than identifying values for every data point." It also notes that the "sub title should summarise" (fragment). — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- Emphasis is rationed: Bold "Use rarely"; Cnd Bold "Use rarely – prominent labelling only"; colour for highlights only "central to the message"; grey for non-focus categories. Red is reserved for the key series. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf); [ggthemes economist_pal](https://jrnold.github.io/ggthemes/reference/economist_pal.html)
- Leo's "Mistakes" (2019) names "charts that conceal their point" (too many colours) as a failure. Her fixes use weight and transparency, not more hues. — [Economist on Medium](https://medium.com/the-economist/mistakes-weve-drawn-a-few-8cdd8a42d368)
- Wong's three essentials: rich content, inviting visualisation, sophisticated execution. Her review step is to check the plot against sources and read it as a reader would. — [Goodreads](https://www.goodreads.com/book/show/6542897-the-wall-street-journal-guide-to-information-graphics)
- Smith: "there is no such thing as a neutral chart". Charting is an editorial act, which implies authority comes from editorial judgement made visible (title, framing, annotation). — [Power of BI review of _How Charts Work_](https://www.powerofbi.org/2023/02/05/how-charts-work-understand-and-explain-data-with-confidence-by-alan-smith/)
- Kenny (Economist): "We became attuned to getting a lot of info into a small space". Density within a small, fixed frame is part of the identity. — [It's Nice That (2018)](https://www.itsnicethat.com/news/the-economist-rebrand-phil-kenny-graphic-design-221018)
- Tufte's credibility argument: "who would trust a chart that looks like a video game?" Decoration is cast as a credibility risk. — [Wikipedia: Chartjunk](https://en.wikipedia.org/wiki/Chartjunk)
- Counter-evidence: embellishment does not reduce accuracy and improves recall (Bateman 2010). Authority and memorability are therefore different goals. — [Bateman et al. 2010](https://vis.csail.mit.edu/classes/6.859/readings/pdfs/Bateman-UsefulJunk.pdf)

### Inferences

- The authority recipe can be read as a strict ink hierarchy. Full black goes only to the zero baseline and headline. A mid-tint (about 75%) carries source and secondary text. A light tint (about 25%) carries gridlines. A single saturated accent carries the series that makes the point. This is a synthesis of the Economist specs, not a documented "rule".
- Consistent fixed widths (160/332/504pt) and fixed type sizes across every chart create a recognisable "series" feel. Readers trust a system that never varies more than a one-off chart.
- Precise units in the subtitle ("% change on a year earlier", "2015=100", "$ per barrel") and exact, semicolon-delimited source lines with footnote daggers probably contribute more to perceived rigour than any visual flourish. This is inference; no reader study was found.

### Gaps

- No empirical study was found that measures perceived "authority" or trust as a function of rule weight, colour restraint or typography in financial charts specifically.

---

## 4. Which conventions translate to screen, and which are print artefacts

### Takeaway

Most of the logic carries over intact: right-hand value axes, a fine grid with a strong zero line, message headlines with unit subtitles, direct labels, sparing emphasis colour, index-to-100, labelled log scales, shaded periods and source lines. What does not carry over is the mechanics. Hatching, CMYK tint percentages, sub-pixel hairlines, column-locked widths and extreme small type all need re-specifying for pixels, responsive widths, dark mode and interaction.

### Cited Findings

- The Economist itself shows the translation: web charts were "built at standard print widths and then exported at 179.22%" (leader charts at 247.86%). The print column system was carried straight onto screen before the move to responsive layouts. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The 2017 guide keeps separate print (CMYK) and web (hex) palettes. Web adds "equal lightness colour scales", and "For web-only charts, use print bkgd colour for highlights". Tint percentages had to be re-expressed as specific screen colours. — [Economist Visual Styleguide 2017](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf)
- The right-hand y-axis persists in the FT's web chart code (g-axis default right alignment). — [ft-interactive/g-axis](https://github.com/ft-interactive/g-axis/blob/master/)
- Right-side axes conflict with end-of-line direct labels on screen, because both want the right margin. — [PolicyViz, Aug 2026](https://policyviz.com/2026/08/25/right-side-y-axis-labels-fan-or-foe/)
- Pattern fills fail on small marks, and dense hatching reads as noise on projectors and screens. Prefer direct labels and fewer series. — [Practical Reporting (2023)](https://www.practicalreporting.com/blog/2023/9/20/the-tricky-business-of-designing-charts-that-will-be-printed-in-black-and-white); search summary of [caitlinwatson.com](https://caitlinwatson.com/how-do-i-choose-colors-for-graphs-in-black-and-white-print/) (low authority)
- Recession bars are a native feature of screen tools (FRED, MATLAB `recessionplot` since R2012a, Stata, R, TradingView). FRED adds a screen-era nuance: lighter shading for an ongoing recession. — [FRED Help](https://fredhelp.stlouisfed.org/fred/data/understanding-the-data/recession-bars/); [MATLAB recessionplot](https://www.mathworks.com/help/econ/recessionplot.html); [Stata Blog (Feb 2020)](https://blog.stata.com/2020/02/13/adding-recession-shading-to-time-series-graphs/)
- Log scales need explicit labelling and explanation for general readers. Romano et al. found worse comprehension with log scales. — [Health Economics 2020](https://onlinelibrary.wiley.com/doi/full/10.1002/hec.4143)
- Text sizing on screen: Datawrapper advises text "big enough", high-contrast colour for most text, and sparing uppercase. These argue against copying 6–7pt print sizes literally. — [Datawrapper fonts post (2022)](https://www.datawrapper.de/blog/fonts-for-data-visualization)
- Background colour: warm or neutral backgrounds dominate, and the Economist's blue was an outlier that has since been brightened and desaturated. — [Datawrapper background colour post](https://www.datawrapper.de/blog/background-color-of-data-visualizations)

### Inferences

**Conventions that translate well**

- Value axis on the right for time series, with labels on the gridlines and no vertical axis rule.
- A hairline, low-contrast horizontal grid with only the zero baseline in full contrast. On screen, use 1 CSS px at low contrast rather than 0.4pt, since a 0.4pt rule is sub-pixel on 1x displays.
- Headline (the point) above a subtitle (series, unit, period), then the plot, then the source line. Abbreviated year ticks ("2000 05 10").
- Index charts with a marked 100 line and base-period dot. Explicit "log scale" and "inverted scale" tags.
- Shaded periods (recessions, forecasts) as pale bands with small uppercase labels.
- Direct labels in series colour instead of legends. One reserved accent colour, grey for everything else, and bold or italic for focal labels.
- A semicolon-separated source line with footnote symbols in the * † ‡ § order, set in a lighter tint.
- The double-scale discipline: align zeros, prefer panels or indexing.

**Print artefacts to re-specify or drop**

- Hatching and cross-hatching as series separators. Screens have colour; use it sparingly. Reserve pattern only for accessibility or forced-colour modes.
- CMYK tint percentages. Re-express them as tokens tested for contrast in light and dark modes. A "30% tint" on white does not invert cleanly.
- Fixed column widths (160/332/504pt) and fixed depths. Replace them with responsive breakpoints, but keep the idea of a small set of canonical sizes.
- 6–7pt type. Screens need larger minimums. Keep the condensed-face idea for density, but size for legibility.
- Stippled or engraved textures (hedcut aesthetic). These are identity and portraiture, not chart mechanics, and they fight data at small sizes.
- Static annotation boxes. On screen, keep only the essential annotations static and push the rest into hover or focus, without letting interaction replace the printed "point".

### Gaps

- No source was found that compares reader comprehension of right-axis versus left-axis time series on screen.
- No documentation was found of how the FT or WSJ formally translated print tint specs into screen colour tokens (the Economist's dual palette is the only documented case found).
