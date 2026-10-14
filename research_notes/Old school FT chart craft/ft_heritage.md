# The FT's graphic voice in charts: heritage, house style, and what a traditional FT editor values

Research date: 2026-10-13. No FT images were copied; examples are recorded as links only.

How to read these notes. "Documented" means an FT primary source: FT code, FT design-system files, or named FT staff speaking on the record. "Third-party" means commentary or imitation by outsiders. Everything under "Inferences" is my reasoning and is not documented.

The most important primary sources found, all inspected directly on 2026-10-13:

- FT `g-chartframe` v5.3.3 (npm). This is the FT's D3 frame for web, print, social and video charts. It sets exact font sizes, colours, rules and margins. Contributors include Steve Bernard and Bob Haslett. — [unpkg build](https://unpkg.com/g-chartframe/build/g-chartframe.js)
- FT `visual-vocabulary-templates` global stylesheet (`styles.css`). It sets exact gridline, baseline, line, annotation and type values. Repo last pushed 2025-06-20. — [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- FT `g-chartcolour` v0.8.26 (npm), the FT chart palettes. — [unpkg index](https://unpkg.com/g-chartcolour/index.js)
- FT `g-axis` (npm), axis defaults. — [README](https://unpkg.com/g-axis/README.md)
- FT Origami `o-colors` v6.7.1 (npm), the brand palette. — [_palette.scss](https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss)
- These code repos date from roughly 2017–2021. They reflect the Visual & Data Journalism desk's templated house style in that period, not necessarily every chart published today.

---

## 1. Pink paper and typography: history, and how they shaped chart appearance

### Takeaway

The salmon ground (since 2 January 1893) and Klim's Metric sans for graphics (adopted with the 2014 redesign, alongside the Financier serif) are the two fixed things in an FT chart. Online, charts sit on the paper colour rather than on white. In print they are drawn without a background fill, so the newsprint itself is the ground. FT staff call the pink a contrast handicap, and also the reason "anyone can spot an FT chart a mile off".

### Cited Findings

**Pink paper**

- The FT launched as the _London Financial Guide_ on 9 January 1888 and was renamed the _Financial Times_ a month later. — [Wikipedia: Financial Times](https://en.wikipedia.org/wiki/Financial_Times)
- It first printed on light pink paper on 2 January 1893, to set itself apart from the similarly named _Financial News_. The paper's own announcement said "the paper will be slightly tinted". — [Quartz](https://qz.com/462285/why-the-financial-times-is-pink)
- Two different explanations for the pink exist. One says the newsprint was simply bleached less, which made it cheaper ([Quartz](https://qz.com/462285/why-the-financial-times-is-pink)). Wikipedia instead credits the colour of the China clay bought from the Bodelva pit in Cornwall ([Wikipedia](https://en.wikipedia.org/wiki/Financial_Times)). Neither is a primary source, so treat both with care.
- The _Sporting Times_ ("The Pink 'Un") had already gone pink years earlier to stand out from rivals. — [Quartz](https://qz.com/462285/why-the-financial-times-is-pink)
- The FT merged with the _Financial News_ in 1945. — [Wikipedia](https://en.wikipedia.org/wiki/Financial_Times)
- The 4 January 1993 issue was printed on white paper to mark the centenary of the first pink issue. — [Wikipedia](https://en.wikipedia.org/wiki/Financial_Times) (via search summary)
- The pink is now deliberately dyed, which costs more than white. The paper is made to order at Holmen's Braviken mill in Norrköping, Sweden. — [Quartz](https://qz.com/462285/why-the-financial-times-is-pink) / search summary of [Wikipedia](https://en.wikipedia.org/wiki/Financial_Times)
- The Pantone Color Institute describes the modern colour as a "bisque" hue. — [Quartz](https://qz.com/462285/why-the-financial-times-is-pink)

**Digital paper colours (exact values)**

- In Origami `o-colors` (the core brand palette), `paper` is `#fff1e5` and `ft-pink` is `#fcd0b1`. `wheat` (`#f2dfce`) is a darker paper-family tone. — [o-colors _palette.scss](https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss)
- The `g-chartframe` web presets (S/M/L) fill the chart background with `#FFF1E0`, an older paper value that differs slightly from `#fff1e5`. The print preset fills with `#FFF`. — [g-chartframe build](https://unpkg.com/g-chartframe/build/g-chartframe.js)
- `g-chartcolour` lists background colours as web `#FFF1e5`, print `#FEE`, social `#333`, video `#335`, clean `#FFF`. — [g-chartcolour/src/backgrounds.js](https://unpkg.com/g-chartcolour/src/backgrounds.js)
- John Burn-Murdoch (Eye no. 101, Summer 2021): "it would be easier for us to have a white background – because of the range of colours that have a sufficient contrast", and also "the fact that anyone can spot an FT chart a mile off is a huge benefit." — [Eye Magazine](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)

**Typography over time**

- Until 2014 the text face was Miller (Matthew Carter, Font Bureau, 1997, a Scotch Roman). The evidence is indirect: consultant Mark Leeds told Kris Sowersby the FT needed "to move away from Miller", toward "something sharper at small sizes", and suggested trying a design without ball terminals. — [García Media, 15 Sep 2014](https://garciamedia.com/blog/financial_times_a_classic_redesign_for_the_digital_age/); [Klim: Financier design information](https://klim.co.nz/blog/financier-design-information/)
- The 23 April 2007 relaunch brought "a new typeface", but I found no primary source naming it. — [New World Encyclopedia](https://www.newworldencyclopedia.org/entry/Financial_Times)
- Financier, a custom serif by Kris Sowersby at Klim (not Commercial Type), launched with the September 2014 redesign and went on general release in July 2016. Its models were Eric Gill's faces: Solus and Joanna for Text, Perpetua for Display. Head of design Kevin Wilson's brief was "an elegant, authoritative serif with the versatility to handle news and features stories", with British heritage. — [García Media](https://garciamedia.com/blog/financial_times_a_classic_redesign_for_the_digital_age/); [AIGA Eye on Design](https://eyeondesign.aiga.org/new-financier-font-gives-the-financial-times-a-smart-luxurious-update/)
- Metric is Sowersby's geometric-humanist sans from 2011, inspired by West Berlin street signs. In Metric, strokes on letters such as a, e and s end vertically. García's account of the 2014 redesign calls it "his sans that we are using for graphics". — [Klim: Metric & Calibre](https://klim.co.nz/blog/metric-and-calibre-design-information/); [García Media](https://garciamedia.com/blog/financial_times_a_classic_redesign_for_the_digital_age/)
- In the code, every `g-chartframe` preset sets `font-family: MetricWeb,sans-serif`, and the template CSS uses `metric, MetricWeb` for axis text, legends and annotations. — [g-chartframe](https://unpkg.com/g-chartframe/build/g-chartframe.js); [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- All SVG text in the templates uses tabular numerals: `svg text { font-feature-settings: 'tnum' }`. — [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- The 2014 redesign: graphics were "restyled" by in-house artist Christopher Campbell in "style, colours, scale and base formats" to ease web-to-print conversion, and a script automated much of that conversion. Kevin Wilson: "Reader research confirmed how important and valued FT infographics are." The redesign also added _Datawatch_, a daily front-page data point. The grid went from 8 columns to 6, with a 12-column variant. — [García Media, 15 Sep 2014](https://garciamedia.com/blog/financial_times_a_classic_redesign_for_the_digital_age/)
- 2014 colour coding: analysis pieces use "a warm red colour" with centred headlines, and news uses "a slate blue colour palette" with left-ranged headlines. — [García Media](https://garciamedia.com/blog/financial_times_a_classic_redesign_for_the_digital_age/)

### Inferences

- Because the print frame has a white or no fill and black rules at 0.3pt, a printed FT chart is likely black ink plus spot or process colour directly on salmon newsprint. The pink "tint" of print charts is the paper itself. A white box on pink would read as foreign.
- Metric's vertical terminals and slightly condensed geometry give FT chart labels a crisp, engineered look that contrasts with Financier headlines in the article. That serif/sans split (serif for prose, sans for data) is a defining feature to keep.
- Charts set in Metric (sans) while the page around them uses Financier (serif) mirrors the classic newspaper convention that graphics use a different, more utilitarian voice than body text.

### Gaps

- I found no primary source on FT chart typography before 2014: which sans the graphics desk used under Miller (2007–2014) or earlier, for example in hot-metal or phototype eras.
- I found no exact date for the FT's first colour ink printing. Trade press from the late 1980s/1990s would be needed. The East India Dock print works (Grimshaw, 1987–88) is a candidate milestone ([Historic England](https://historicengland.org.uk/listing/the-list/list-entry/1430114)), but colour capability is not confirmed.
- I could not verify the exact Pantone or ink spec of today's printed pink.

---

## 2. FT chart conventions in print and online (Visual Vocabulary, Chart Doctor, house style, palettes, Lex, market data)

### Takeaway

The FT's house style is documented in code. Online it is: a short 60×4px black bar top-left, a Metric title in regular weight (not bold), a grey subtitle carrying the units, horizontal gridlines only in a pale paper tone, right-aligned y labels, no axis lines, 3px data lines, direct labels and a grey source line. Print uses a black-and-white, hairline-ruled "goalpost" frame at about 0.3pt, titles in Metric semibold, and type down to 7.2pt. Colour is led by oxford blue (`#0f5499`) plus a pink/claret family, set against teal and wheat neutrals.

### Cited Findings

**Visual Vocabulary and Chart Doctor**

- The Visual Vocabulary was created by the FT Visual Journalism Team "to assist designers and journalists to select the optimal symbology for data visualisations", and credits the Graphic Continuum (Schwabish & Ribecca) as inspiration. It sits at the core of a newsroom chart-literacy training session. It has nine categories: Deviation, Correlation, Ranking, Distribution, Change over Time, Part-to-whole, Magnitude, Spatial and Flow. — [chart-doctor/visual-vocabulary](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary) (repo last pushed 2024-03-12)
- Principles stated in the Visual Vocabulary: columns "Must always start at 0 on the axis"; "Don't be afraid to highlight the points of interest"; "Choosing the correct time period is important"; choropleths "should always be rates rather than totals"; pictograms: "do not slice off an arm to represent a decimal"; pie charts: "it's difficult to accurately compare the size of the segments"; area charts: "Use with care". Columns work for change over time "usually best with only one series of data at a time". — [Visual Vocabulary README](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/README.md)
- Alan Smith is Head of Visual and Data Journalism at the FT, formerly at the ONS, and received an OBE in 2011. He writes Chart Doctor (archive at ft.com/chart-doctor, paywalled) and wrote _How Charts Work_ (FT Publishing, October 2022). The book's chapters include "Scales of justice, axes of evil", "The best charts are well written" and "Designing for charts". — [Pearson](https://www.pearson.com/en-us/subject-catalog/p/how-charts-work-understand-and-explain-data-with-confidence/P200000007243/9781292342795); [Amazon](https://www.amazon.com/How-Charts-Work-Alan-Smith/dp/129234279X)
- The FT archived a public repo, `Financial-Times/graphics-style-guide` ("How to make charts and other graphics - guidance for editorial practitioners"). It appeared in search results ([GitHub](https://github.com/Financial-Times/graphics-style-guide)), but returned 404 when fetched on 2026-10-13, so I could not read its contents.

**Web frame: exact values from FT code (`g-chartframe` presets)**

| Preset    | Width    | Title                | Subtitle | Source |
| --------- | -------- | -------------------- | -------- | ------ |
| webFrameS | 300px    | 20px, line height 24 | 18px     | 12px   |
| webFrameM | 700×500  | 24px, line height 28 | 18px     | 14px   |
| webFrameL | 1180×700 | 28px                 | 18px     | 16px   |

- Every web title is Metric, `font-weight: 400`, fill `#000`. Subtitle and source fill is `#66605C`. A copyright line ("© FT") is set in italic `#66605C`.
- Every web preset draws a black bar, 60px wide and 4px high, at the top-left ("the short black bar above web graphics"). The background is `#FFF1E0`. The left margin is tight (1px in the base frame). The title sits at y=32, and the subtitle at y=64.
- Defaults reveal intent: the placeholder title text is "Title: A description of the charts purpose", the placeholder subtitle is "some supporting information, units perhaps", and the placeholder source is "Source: research".
- Source: [g-chartframe build](https://unpkg.com/g-chartframe/build/g-chartframe.js)

**Print frame: exact values (`printFrame`)**

- The unit is mm. Width is 112.25mm and height 68mm. Margins are top 40, left 15, bottom 35, right 7, in px-equivalents after conversion at 2.8346 per mm, which is points.
- Background is `#FFF`. Title: Metric 12px, weight 600, black. Subtitle: 9.6px, weight 400, black. Source: 7.2px, black. Title and subtitle are inset at x=7.
- "Goalposts" ("the bit at the top and bottom of print charts"): a 0.3-weight black rule runs across the full width at the bottom. At the top there is a full-width rule with 15-unit vertical drops at both ends, like a goalpost.
- Source: [g-chartframe build](https://unpkg.com/g-chartframe/build/g-chartframe.js)

**Gridlines, axes, lines and annotation: exact values (`styles.css`)**

| Element | Web | Print |
| --- | --- | --- |
| y-axis gridlines | `#e6d9ce`, 1px | `#000000`, 0.3px |
| x-axis tick lines | `#CCC1B7`, 1px | `#000000`, 0.3px |
| Baseline / highlight line | `#999189`, 1px | black, 0.6px (x-axis baseline 0.3px) |
| Data lines | 3px, `stroke-linecap: square`, `stroke-linejoin: round` | 2px, round caps |
| Annotation lines and paths | `#66605c`, 1px | black, 0.5px |
| Highlight bands (shading) | `#fffcfa`, slightly lighter than paper | `#95bfc5` at 0.3 opacity |
| Axis text | `#4d4845`, 14/16/18px by frame size; y labels `text-anchor: end` | 9.6px black |

- The axis domain (spine) is switched off on all frames (`stroke-width: 0px`).
- Annotation text is `#4d4845` on web and 9.6px black in print.
- Social and video frames reverse to a dark slate `#262a33` ground with a 60×4 _white_ bar, grid `#47494d` and text `#8e9095`.
- Source: [visual-vocabulary-templates styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)

**Axis behaviour (`g-axis`)**

- "yLinear default alignment is right." Ticks normally extend across the full plot width (`tickSize = frame width`), so they act as gridlines.
- Optional `banding` "adds shaded bands between alternative major axis ticks".
- A `divisor` option scales numbers down, for example 2,000,000 → 2.0. The README warns: "It is very important to make the appropriate addition to the subtitle of the chart when the divisor has a value other that 1 e.g. adding the text 'million'". In other words, units belong in the subtitle, not in an axis title.
- Source: [g-axis README](https://unpkg.com/g-axis/README.md)

**Colour: brand palette (`o-colors` v6.7.1)**

- Primary: black `#000000`, white `#ffffff`, ft-pink `#fcd0b1`, ft-grey `#333333`.
- Secondary: claret `#990f3d`, teal `#0d7680`, oxford `#0f5499`, slate `#262a33`, paper `#fff1e5`.
- Tertiary: mandarin `#ff8833`, light-blue `#00a0dd`, crimson `#cc0000`, graphics-dark-blue `#006f9b`, wheat `#f2dfce`, candy `#ff7faa`, wasabi `#96cc28`, jade `#00994d`, velvet `#593380`, lemon `#ffec1a`, sky `#cce6ff`; partner content uses matisse `#355778`.
- Claret, oxford and teal allow tones 30–100 (teal from 20). Colours can be mixed with black (5–90%) or white (10–80%).
- Source: [o-colors _palette.scss](https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss)

**Colour: chart palettes (`g-chartcolour`)**

| Palette | Values |
| --- | --- |
| lineWeb | `#0f5499` (oxford), `#EB5E8D` (pink), `#70DCE6`, `#9dbf57`, `#208fce`, `#7f062e` (claret-dark), `#c2b7af` (warm grey) |
| basicLineWeb | `['#EB5E8D','#0f5499']`, commented "the first colour is neutral / background, the second colour primary/ highlight" |
| mutedFirstLineWeb | starts with a muted warm grey `#B3A9A0`, then `#0f5499`, `#EB5E8D`… |
| linePrint | `#006a93`, `#ddb831`, `#aad1d1`, `#ad1c21`, `#55a2c7`, `#0083b3` |
| barPrint | `#0083b3`, `#95bfc5`, `#004d6d`, `#64a2c1`, `#c6d6cc` |
| categorical_bar | `#1E558C`, `#94d2e6`, `#1E8FCC`, `#B3325D`, `#FF75A3`, `#D9CCC3`, `#AECC70`, `#F34D5B` |
| diverging | claret-red `#b31147` → `#f3dec8` (paper-cream midpoint) → blue `#1162b3` |
| sequentialSingle | `#d6d3ea` → `#0a3866` (navy) |

- There are also named political-party palettes for the UK, US and Germany.
- Source: [g-chartcolour src](https://unpkg.com/g-chartcolour/index.js)

**Workflow**

- "We build all of our charts using the JavaScript library D3 … we only code one chart but the output of that is a mobile phone-sized version, a desktop-sized version, a print version", plus social and video versions. Most charts are "heavily templated". — Burn-Murdoch, [Eye no. 101, 2021](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)
- Team structure: in 2016 Smith merged 14 graphics staff, previously split by print, online and interactive, into one central team: "When you have teams aligned by platform, you very often work to the lowest common denominator." — [Digiday, 15 Jun 2016](https://digiday.com/media/financial-times-guide-data-visualization/). By 2021 the team was "about twenty of us". — [Eye](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)
- Steve Bernard joined the FT graphics department in 1996, worked in print graphics until 1999, then moved to FT.com. The interactive desk was formed in 2007, and the team moved from Flash to HTML/JS in 2012. — [maps4news](https://maps4news.com/blog/newsroom-life-1/)

**Third-party observations (not FT statements)**

- Rebuilds of FT charts note: major y gridlines only, no x gridlines, no axis titles (units go in the subtitle), and the x-axis sometimes placed at the top. — [Daniel Roelfs](https://danielroelfs.com/posts/financial-times-data-viz/); [Plotly tutorial](https://medium.com/@romandogadin/style-your-visuals-like-the-financial-times-using-plotly-3e7f1d6e293d)
- A _Stata Journal_ article (2012) notes that right-hand y-axis labels and information at the top are "commonplaces of financial journalism", naming the _Economist_, _FT_ and _WSJ_, and traces the practice to Playfair's 1801 atlas. — [Stata Journal](https://journals.sagepub.com/doi/pdf/10.1177/1536867X1201200314)

**Lex and market data**

- Market data: the FT's "London Share Service" runs in the Companies & Markets section and gives the previous day's LSE prices. ICAEW calls it the largest collection of UK listings available to the general public. — [ICAEW Library](https://www.icaew.com/library/research-guides/share-prices/current-and-historical-uk-share-prices)
- The FT 30 (FT Ordinary Index) was devised in 1935 by Maurice Green and Otto Clarke at the _Financial News_ (base 100), and became an FT index after the 1945 merger. — [Wikipedia: FT 30](https://en.wikipedia.org/wiki/FT_30). Some other sources credit the FT directly ([Stock Market Almanac](https://stockmarketalmanac.co.uk/2015/12/ft30-index-1935-where-are-they-now/)), which conflicts with Wikipedia's account.

### Inferences

- Several defaults together say "considered and quiet, not shouty": a regular-weight (400) web title, a muted warm grey (`#66605C`) for everything secondary, gridlines in a darker version of the paper colour (`#e6d9ce` on `#fff1e0`), and no axis spines. The one strong black element is the 60×4 bar, a masthead-like signature.
- All the web neutrals are warm, brown-greys (`#66605C`, `#4d4845`, `#999189`, `#CCC1B7`, `#e6d9ce`, `#c2b7af`). They come from the paper, not from a cool slate. This is probably the single most transferable "FT-ness" device after the background colour.
- In print, every rule (gridlines, ticks, goalposts) is pure black at 0.3pt, which is a hairline. The baseline doubles to 0.6pt and data lines are 2pt. That 0.3 / 0.6 / 2pt hierarchy is a classic letterpress-era newspaper rule system.
- The basicLineWeb comment reveals a deliberate two-tone grammar: one neutral/background colour and one highlight colour. This is the code form of "highlight the points of interest".

### Gaps

- Lex column chart conventions: I found no source, so this remains unknown. FT.com is not fetchable from this tool and is paywalled.
- Market data page typography (table faces, rules, sizes, history of cuts to the printed listings): no reliable source found.
- The contents of the archived `graphics-style-guide` repo and current internal guidance (the FT reportedly uses an internal tool for house-styled charts, per a [third-party summary](https://danielroelfs.com/posts/financial-times-data-viz/)) are unverified.
- The current Origami data-viz palette may differ from `g-chartcolour`. I could not fetch registry.origami.ft.com.

---

## 3. Historical FT market and economics charts (mid-century to 1990s print)

### Takeaway

I found no reliable, specific documentation of how FT print charts looked between the 1940s and 1990s (rules, hatching, tints, type). The only documented print-era survivals are in the current print frame: black hairline "goalposts", 0.3pt black gridlines and black type. These are consistent with a long monochrome tradition, but that link is inference.

### Cited Findings

- The current FT print chart frame: a white/no fill, black 0.3-weight goalpost rules top and bottom, black text throughout (title 12pt semibold, subtitle 9.6pt, source 7.2pt), black 0.3pt gridlines, and a 0.6pt black baseline. — [g-chartframe printFrame](https://unpkg.com/g-chartframe/build/g-chartframe.js); [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- The print bar palette is a restricted set of blues and blue-greys (`#0083b3`, `#95bfc5`, `#004d6d`, `#64a2c1`, `#c6d6cc`). Print highlight bands use `#95bfc5` at 30% opacity, a pale tint. — [g-chartcolour bar-print](https://unpkg.com/g-chartcolour/src/bar-print.js); [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- For most of the 20th century the FT's typography "evolved incrementally through successive hot-metal and cold-type technologies but retained a fundamentally conservative broadsheet character — dense serif columns, minimal white space". Third-party, low authority. — [designbycurio](https://designbycurio.com/learn/financial-times-pink-paper)
- A New York Times study of comparable US newspapers found an average of only 2 charts per edition in 1950–75, most in the business section, rising to over 10 per edition in 1980–2005. Graphics terminals preceded PCs. — [Priceonomics](https://priceonomics.com/when-did-charts-become-popular/)
- British comparison: Peter Sullivan's information graphics at the _Sunday Times_ from the early 1970s (with colleagues including Nigel Holmes and John Grimwade). His 1987 book _Newspaper Graphics_ is one of the few on the subject. — [Wikipedia: Peter Sullivan](<https://en.wikipedia.org/wiki/Peter_Sullivan_(designer)>)
- The FT began foreign printing in Frankfurt in 1979 and in the US in 1985. The East India Dock print works was built 1987–88, and the FT moved out in 1995. — search summaries of [Wikipedia](https://en.wikipedia.org/wiki/Financial_Times) and [Historic England](https://historicengland.org.uk/listing/the-list/list-entry/1430114)

### Inferences (not documented)

- Before colour presses (date unknown, likely late 1980s–1990s), FT charts would have been monochrome black on pink. Series would have been distinguished by line weight, dashes, hatching or mechanical tints (Ben-Day / halftone screens). This is general newspaper practice of the period, not confirmed for the FT.
- The modern print frame's goalposts, black hairline grids and black-only type look like a direct descendant of that monochrome practice. A designer wanting "old-school FT" can lean on them legitimately, because they are in current FT code.
- Pink paper absorbs some contrast, so fine rules in black rather than grey would have been necessary to survive newsprint. That may explain why print rules are black 0.3pt while web rules are pale `#e6d9ce`.

### Gaps

- I found no scans, case studies or interviews describing FT market charts or the Lex chart before 2000. The primary route is the FT Historical Archive (Gale, needs library access). It was mentioned in search summaries, but I did not verify the URL. The Guildhall Library in London also holds the FT from 1888 ([ICAEW](https://www.icaew.com/library/research-guides/share-prices/current-and-historical-uk-share-prices)).
- Whether the FT used two-colour printing (black plus a spot colour) for charts, and when, is unknown.
- I found no sources on hatching or tint conventions specific to the FT.

---

## 4. What FT editors and graphics editors (and comparable broadsheets) say about restraint, annotation, "one idea per chart", headlines, craft

### Takeaway

FT practice is "restraint without minimalism": cut chartjunk, but keep explanatory text. The title should state the finding, as a headline does, and annotation is treated as essential. The Economist and WSJ codify similar rules: light horizontal grids, a right-hand axis, direct labels, a thicker zero line, few series and one clear message.

### Cited Findings

**FT**

- Burn-Murdoch (Eye, Summer 2021): "We have a clear style guide for all our charts, which is constantly refined"; "we try to ensure that our charts contain no more information than they need to. We're opposed to 'chartjunk'"; "we are not afraid to do a story which just has five line charts in it"; "when you're using charts to communicate, the text is critical"; "if you give it a title that makes a point, you're going to get a stronger reaction"; "print headlines and chart titles serve the same purpose in trying to be concise and clear and maybe even funny". The team brought in "subeditors and headline specialists" to help write chart titles. — [Eye Magazine](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)
- Burn-Murdoch on text-first reading: "this is something you can read. This is for you. Here's the key message. And now that you've seen that, here's what that looks like in a chart." Example title in sentence form: "Italy and Spain's daily death tolls are falling. In the U.K. and U.S., daily deaths may be plateauing." — [NPR, The Indicator](https://www.npr.org/transcripts/1099577985)
- He cites research showing minimalist charts ranked lowest with general readers, while a strong narrative title plus annotations performed best and was remembered better. — summarised in [GIJN](https://gijn.org/stories/data-visualization-storytelling-tips-john-burn-murdoch/) (search snippet; the page returned 403 on fetch)
- On his excess-deaths animation: "the key was highlighting a difference between the normal and the abnormal", which "can be done perfectly well in static form by simply labelling the lines". — [Flourish, 19 Jan 2021](https://flourish.studio/blog/masters-reveal-line-john-burn-murdoch/)
- On animation: "Animation is something we try to be sparing with … You can't template an effective animation." — [Eye](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)
- Alan Smith (Digiday, June 2016): charts "should be appearing in the first few paragraphs"; "We can use these graphics to help carry some of the narrative so that it's not duplicative"; "Eventually we will be making fewer charts, but they will be better focused." His first Chart Doctor column challenged the belief that every chart should be readable in five seconds (Digiday's paraphrase). — [Digiday](https://digiday.com/media/financial-times-guide-data-visualization/)
- _How Charts Work_ is pitched as "Don't value design over information – present data persuasively"; one chapter title is "The best charts are well written". — [Amazon](https://www.amazon.com/How-Charts-Work-Alan-Smith/dp/129234279X); [Pearson](https://www.pearson.com/en-us/subject-catalog/p/how-charts-work-understand-and-explain-data-with-confidence/P200000007243/9781292342795)

**The Economist**

- Visual style guide v1.2 (4 May 2017): chart blocks "simplified as much as possible, with minimal grid lines and tick-mark labelling", with emphasis on "a clear overall message, rather than identifying values for every data point".
- Its signature is a red rule along the top and a red "tag" rectangle at top-left (Econ red `#E3120B`). Gridlines are horizontal only, with no y ticks, labels sit on the gridlines, and the y-axis is on the right.
- Type: Econ Sans bold 8pt / condensed 7pt / light 6pt. Titles are short and "occasionally amusing".
- Source: [Economist style guide PDF](https://sa.ipaa.org.au/wp-content/uploads/2026/02/Economist-CHARTstyleguide_20170505.pdf) (third-party-hosted copy); [ggthemes](https://jrnold.github.io/ggthemes/reference/theme_economist.html)
- Sarah Leo, "Mistakes, we've drawn a few" (28 Mar 2019): she groups errors as misleading, confusing, or "failing to make a point". On truncated line charts, keep at least about a third of the plot area clear below the line. — [Medium/Economist](https://medium.economist.com/mistakes-weve-drawn-a-few-8cdd8a42d368)

**Wall Street Journal**

- Dona Wong, _WSJ Guide to Information Graphics_ (2010). Wong was graphics director from 2001.
- Keep grid lines thin and the zero baseline slightly thicker. The data line should stand out against the grid but stay thin enough to show its turns.
- Line charts ("fever lines") need not start at zero.
- No more than 4 lines on a line chart.
- Label data directly rather than using a legend.
- Bar width should be about twice the gap between bars.
- Colour charts should be legible in black and white.
- Source: [search summary of the book/reviews](https://www.goodreads.com/en/book/show/6542897-the-wall-street-journal-guide-to-information-graphics). Wording is partly second-hand, so verify against the book.

### Inferences

- An "ambitious, traditional FT editor" would likely value five things:
  1. A title that is a sub-edited headline stating the finding.
  2. A subtitle that carries the units and a plain description.
  3. A source line, always.
  4. One highlighted series against neutral context.
  5. Annotation in the chart rather than in a legend.

  They would distrust decoration, 3D, gratuitous animation and unlabelled colour. This is a synthesis of the Burn-Murdoch and Smith quotes and the code defaults.

- "One idea per chart" is not an FT phrase I could document verbatim. The closest documented FT statements are "make a point", "fewer charts, but … better focused" and the basicLineWeb neutral-plus-highlight convention. The Economist's "a clear overall message" is the nearest codified wording.

### Gaps

- I could not read the Chart Doctor columns themselves (ft.com is unfetchable and paywalled), so I have no verbatim Smith rules on titles, axis-starting or annotation from those columns.
- Malofiej or OpenVisConf talks by FT staff were not located in this pass.

---

## 5. Concrete devices that read as "FT-like" if borrowed carefully

### Takeaway

The most authentic, documented devices:

- the warm paper ground with warm-grey neutrals;
- a 60×4 black bar at the top-left;
- a regular-weight sans title in a sentence-style headline, with a grey subtitle carrying the units;
- right-aligned y labels sitting on full-width pale gridlines, with no spines;
- a darker baseline;
- a single oxford-blue series, or a claret/pink highlight over a warm-grey context;
- direct labels, and a small grey "Source:" line.

For a print or "old-school" feel, use the black hairline goalpost frame and 0.3/0.6/2pt rule hierarchy.

### Cited Findings (exact values; all from FT code unless noted)

**1. Ground**

- Paper `#fff1e5` (Origami) or `#FFF1E0` (chart frame). — [o-colors](https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss); [g-chartframe](https://unpkg.com/g-chartframe/build/g-chartframe.js)
- Highlight band slightly _lighter_ than paper: `#fffcfa`. — [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)

**2. Signature bar**

- A black rect, 60×4px, flush top-left above the title (web). On dark grounds, the same in white. — [g-chartframe](https://unpkg.com/g-chartframe/build/g-chartframe.js)

**3. Title stack (web M, 700px wide)**

| Line      | Font          | Size / line height | Colour    | Position   |
| --------- | ------------- | ------------------ | --------- | ---------- |
| Title     | Metric 400    | 24px / 28          | `#000`    | y=32       |
| Subtitle  | Metric        | 18px / 20          | `#66605C` | y=64       |
| Source    | Metric        | 14px               | `#66605C` | below plot |
| Copyright | Metric italic | 14px               | `#66605C` | —          |

- Title, subtitle and source are flush-left at x≈1. — [g-chartframe](https://unpkg.com/g-chartframe/build/g-chartframe.js)

**4. Grid and axes**

| Element     | Value                                                   |
| ----------- | ------------------------------------------------------- |
| y gridlines | `#e6d9ce`, 1px, full width; no domain lines             |
| y labels    | right-aligned by default, `text-anchor: end`, `#4d4845` |
| x ticks     | `#CCC1B7`, 1px                                          |
| baseline    | `#999189`, 1px                                          |
| numerals    | tabular (`tnum`)                                        |

- Sources: [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css); [g-axis](https://unpkg.com/g-axis/README.md)

**5. Data marks**

- Web lines 3px, square caps, round joins. Print lines 2pt, round caps. — [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)
- Primary series oxford `#0f5499`; contrasting series FT pink `#EB5E8D` or claret `#990f3d`/`#7f062e`; context series warm grey `#B3A9A0` or `#c2b7af`. — [g-chartcolour](https://unpkg.com/g-chartcolour/index.js); [o-colors](https://unpkg.com/@financial-times/o-colors/src/scss/_palette.scss)

**6. Annotation**

- Leader lines `#66605c`, 1px (print: black 0.5pt). Text `#4d4845` at axis size. — [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)

**7. Print / "old school" frame**

| Element | Value |
| --- | --- |
| Top rule | black 0.3pt, full width, with 15-unit downstrokes at each end ("goalposts") |
| Bottom rule | black 0.3pt, full width |
| Title | Metric semibold 12pt |
| Subtitle | 9.6pt |
| Axis and annotation text | 9.6pt |
| Source | 7.2pt |
| Gridlines | black 0.3pt |
| Baseline | 0.6pt |

- All text in the print frame is black. Print highlight bands are `#95bfc5` at 30%.
- Sources: [g-chartframe printFrame](https://unpkg.com/g-chartframe/build/g-chartframe.js); [styles.css](https://raw.githubusercontent.com/ft-interactive/visual-vocabulary-templates/master/styles.css)

**8. Diverging scale**

- Claret-red `#b31147` → paper-cream `#f3dec8` midpoint → blue `#1162b3`, so the neutral midpoint matches the paper. — [g-chartcolour diverging](https://unpkg.com/g-chartcolour/src/diverging.js)

**9. Text conventions**

- Units go in the subtitle (e.g. "million") when numbers are divided, and there are no axis titles. — [g-axis README](https://unpkg.com/g-axis/README.md)
- Titles make a point. — [Eye](https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch)

**Example links (view only; do not copy images)**

- Visual Vocabulary poster/README — https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary
- Visual Vocabulary interactive — https://ft-interactive.github.io/visual-vocabulary/
- Chart Doctor archive (paywalled) — https://www.ft.com/chart-doctor
- FT Data on X — https://x.com/ftdata
- Burn-Murdoch interview with chart examples — https://www.eyemagazine.com/feature/article/conversation-with-john-burn-murdoch

### Inferences (design guidance, not documented FT rules)

- **Pushing a minimal system "slightly FT":** the cheapest high-signal moves, in order:
  1. Warm the neutrals. Gridlines are a darkened paper tone and text is a warm grey-brown, never cool grey.
  2. Add the short black top-left bar.
  3. Set the title in regular weight, sentence case, stating the finding.
  4. Put units in a grey subtitle, not on the axis.
  5. Use right-aligned y labels, no spines, and a slightly darker baseline.
  6. Make one oxford-blue (or claret) highlight against warm-grey context.
  7. Add a small "Source: …" line at the foot.
- **Keeping clarity:** the paper ground narrows the usable palette (Burn-Murdoch admits this). Check contrast of light series (for example `#70DCE6`, `#9dbf57`) against `#fff1e5`, or reserve them for fills.
- **For a "traditional print" flavour:** use black hairline rules (0.3pt-equivalent, about 0.5–0.75px on screen at 1×) instead of pale gridlines, the goalpost frame, a semibold small title, and very small source type (about 60% of axis size, as the 7.2/9.6 ratio = 0.75 suggests).
- **Don't over-borrow:** the pink ground, the black bar and Metric together amount to a pastiche of the FT brand. Pick devices that are about craft (warm neutrals, headline titles, rule hierarchy, units in subtitle, right-aligned labels) rather than trademarks (exact `#fff1e5`, the FT bar plus logo, the copyright line).

### Gaps

- I could not verify how closely current (2024–2026) published FT charts still follow these 2017–2021 template values. The FT may have revised its gridline colours, weights or palettes since then.
- No exact current print rule weights or paper colours were found beyond the code.
