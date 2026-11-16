# @howells/hairline

## 0.5.1

### Patch Changes

- 9329208: Internal: linted with @howells/lint 3.10.2. Settle and playback timers keep their state in refs rather than reassigning render-time locals; no change to what charts draw.

## 0.5.0

### Minor Changes

- 47a0248: Narrow charts no longer stagger labels onto two lines, where a label reads as its neighbour's. RungBars shortens a run of years the broadsheet way (2016, ’17, ’18) and, failing that, prints every other label, always keeping the hero's. Column headers in the matrix and rank strip wrap over their own column, breaking after a dash ("1996–" over "2010") or hyphenating a word too wide for it. The thread triptych sets each narrow heading's name over its count, leaning the middle ones away from each other. DumbbellQueue's rungs count in a round multiple of the unit when a narrow width would pack them solid, and a gap too short to space its rungs draws none. New in the kit: `fitBandLabels` and `headerLines` (`src/charts/band-labels.ts`).
- 48d2b10: Every chart's hover now shows the one tip: the same paper card the pointer charts use, wrapped at a readable measure instead of one long dark pill. Tooltips are placed by the pointer model, so they never clip the chart. A tip that has no room above its mark stands beside it, and row charts (arrow plot, bullet, pyramid, bar race) put the tip beside their row's end instead of over the row above. `Tooltip` swaps its `below` boolean for `place` ("above", "below" or "beside") and gains `clear`. `placeTip` gains a `below` option.

### Patch Changes

- 3a8e3b7: A reference line's name that would sit on a mark at both ends of its line now looks along the line for a clear stretch, and RungBars counts its bars' bodies as marks to keep clear of, so "15 a year" no longer prints over a bar. CircularBeadGraph rings the selected bead a gap off its edge, so the selection reads apart from its ink neighbours. In the gallery, the coffee grid's column names slant shallow only where neighbours have two lines of air and its heads keep clear of the key at 390, the lighthouse owners' names stand at least 15px apart, and "From Germany" follows the page's palette instead of always going dark.
- ff67a66: Numbers that read as round: a change that rounds to nothing prints "0%", never "−0%" (`fmtSignedPct`); the ridgeline's temperatures all carry one decimal so a column of them aligns; the calendar's tip groups thousands ("1,933 births"). PlumbScatter's tip drops its "X" and "Y" names (its values carry their units) and keeps off the names the chart prints, so it no longer sits on the hero's name plate.

## 0.4.1

### Patch Changes

- 666c16c: The pointer tip wraps long facts at 18rem instead of running across the chart, and its quiet rows are set at normal weight. The tip no longer catches the pointer, so moving onto the next column under it moves the tip.

## 0.4.0

### Minor Changes

- f3f8d34: Three forms the library lacked: ArrowPlot (each row a change from a before to an after, with the new value at the arrowhead; rises in ink, falls quieter, tiny changes as a pair of dots), Bullet (a measure bar against a target tick over three ranges, one row per metric) and Pyramid (two sides of bars back to back around a column of band names, one side engraved and the other ink). Ridgeline now draws back to front, each ridge filled with paper so a nearer one hides what is behind it, with a quiet baseline under every row, the hero in ink over a quiet tint, and a new `overlap` option for how many rows a ridge stands over. The hatching on Ridgeline is gone.
- 6f4ae5b: DumbbellQueue takes `alert: "none"` for rows that change with no direction to warn about, and its scale ends round to whole steps. RungBars keeps reference names clear of the printed bar values.
- 19d5bd5: A hero group stands against its context. PlumbScatter, HairlineLine, JitterStrip and DotCascade take `hero`, a list of the names (or dates, or columns) to single out, and `context`, `"grey"` or `"opacity"`, for how the rest recedes; hero marks sit on a paper ring above the context. PlumbScatter and HairlineLine's `emphasis`, JitterStrip's `mark` and DotCascade's `highlight` are gone, replaced by `hero`. PlumbScatter takes `heroLabel` to name the group directly with a leader. ChordRing, AggregateSankey and HourglassStream fill each ribbon with one gradient of the ink, dark at its source. ForceGraph, ForceGalaxy and both CircularGraphs fade out from the selected node by links, name it with its reach, and take `selected` to open on a node; tiny nodes are found by their nearest neighbour, so a finger can hit them.
- f784ad2: HairlineLine, HairlineArea, RungBars, PlumbScatter, RangeDots, PairedRungs and StackedRungs now share one pointer and one tip. The pointer snaps to the nearest point, and the tip lists every series at it: the date or name in bold, then a row for each series with its swatch and value, the leading series first. A crosshair and ringed dots mark the spot, and the tip stands beside it, flips only if it would clip, and stays inside the chart. It keeps off the line, the printed value labels, notes, reference names and interval names, and the column's band leaves a printed label readable. Its corners are on the radius scale, and the focus ring shows for the keyboard only, never after a click or tap.

  A click, tap, Enter or Space pins the tip; Esc, a second click or a press outside lets it go. Each chart is now focusable: the arrow keys step through its points, Home and End jump to the ends, and the tip is read out politely for keys and pins but not for a passing mouse (RungBars and the others had no keyboard path before). On a touchscreen, press and hold scrubs, and a swipe that starts moving first is left to the page, so these charts no longer take over scrolling. The tip eases between points only when the reader has not asked for reduced motion.

  The board's time charts (TimeLines, StackedArea, MonthlyBars, DailyUsers) keep their cursor readouts but now run on the same pointer: nearest-point snapping, keys, pinning with a click, and press-and-hold on touch.

  For people drawing their own charts, the kit gains `Pointer`, `usePointer` and the arithmetic behind them (`nearest`, `stepTo`, `placeTip`, `spoken`). `useScrub` now takes the drawing's size as well as the positions: `scrub.bind(positions, { height, width })`.

- 086458a: Labels sit on a paper halo by default, so lines and gridlines stop short of the text; `Label` takes `halo={false}` for text on a plate of its own. Multi-line time charts can name their lines where they end (the hero with its value, the highest and lowest, the rest folded into "7 other regions") instead of a key, nudged apart with short leaders, and the slope chart's nudged labels now carry leaders too. `HairlineLine` and `HairlineArea` take an opt-in `notes` prop: a few words tied to a reading, drawn beside its point on a leader, or numbered on a phone with the words listed under the chart; notes appear in the data table and the chart's description. On both, a right-hand scale value that would print beside the latest or peak value label is dropped (its rule stays).
- c87837d: Charts can mark targets and ranges, and say what an interval covers. HairlineLine, HairlineArea, RungBars, DumbbellQueue and PlumbScatter take `references`: dashed target lines named on the line (which can keep the marks that clear them in ink while the rest step back) and quiet bands named inside. PlumbScatter takes `xReferences` too. HairlineLine and HairlineArea take `intervals`, one or two nested bands named by how much of the outcomes they cover ("Half", "9 in 10 outcomes"), and `forecast`, which dashes the line after a rule. New chart RangeDots draws estimates with intervals as error bars, with rows too wide to rank as open dots. References and intervals are in each chart's data table and description.
- a83ed23: Small multiples on one scale, and a legend that is one glyph.

  `Facets` (from `@howells/hairline/kit`) lays out the same chart once per panel in a responsive grid, one column on a phone. Every panel shares one value scale by default, so equal heights mean equal values; free it and each panel fills its own box and a note says so. Each header carries the panel's name and current value, the hero panel is in ink and the rest on the ramp, and the shared scale's values print once, in a margin left of the first column (`axis`), so every plot is the same width and no panel carries a blank gutter. `HairlineArea` and `HairlineLine` take a `domain` to share a scale, `valueAxis` (`right` by default, `left` in a margin of its own, `none` for the rules alone), and `emphasis: null` for a panel with no hero. The board's Vitals grid is now `Facets`, each cell on its own scale and labelled so.

  The glyph charts (Coffee growers, Autumn tides, Solar flares, Year in the round, New woodland) open with a key that is one real record drawn large, its parts named where they are by thin leaders that never cross (the key tries every order of the labels). The flare key zooms to the flare so it fills the key. `glyphKey={false}` turns it off. `GlyphKey` (from `@howells/hairline/kit`) is the shared part: pass your glyph and the points to label.

  `HairlineArea` now puts month ticks on the first reading of each month and thins labels that would touch, so weekly readings and narrow panels read cleanly.

## 0.3.0

### Minor Changes

- fd9ff9e: JitterStrip takes `mark`, a record's name: in every group that record is a solid ink dot with its value above it, so one entity can be followed across groups. `median: false` leaves the median ticks out, and `width` and `initialWidth` pass through to the plot.
- fd89769: PairedRungs lays its categories out as rows when the chart is too narrow for its columns: each row carries its name and both values on one line, the current period as rungs along a track and the earlier period hatched beneath, on one scale, and the chart grows taller instead of crowding its labels. PairedRungs also takes `width` and `initialWidth`, so it renders complete on the server like the packaged charts.
- 6014d79: RungBars takes a null value for a withheld bar, which stands as an empty column printed with `hidden` ("Hidden" by default) and is counted in the description and table; `printHidden: false` leaves the word off the column. A bar's `detail` adds a line to its tooltip, `emphasis: null` inks no bar, and `max` sizes the columns' room for a value, so charts set side by side share a scale.
- 95fe05d: AggregateSankey takes `totals={false}` to leave each node's total out of its label and tooltip, for flows that are not all the flows, as when small ones are withheld, where a node's sum would be a total nobody measured. AggregateSankey also takes `width` and `initialWidth`, so it renders complete on the server.

## 0.2.0

### Minor Changes

- 7f6e859: A scaled chart now keeps its rules at one device pixel by default. When `scale` is above 1 or `fit` is set, `strokes` defaults to `"device"`: grid lines, baselines, lines and rings stay hairlines however large the chart is shown, while type and textures still scale with the composition and filled marks such as the bars of RungBars are unaffected. Unscaled charts draw exactly as before. To keep the old behaviour on a scaled chart, pass `strokes="proportional"`.
