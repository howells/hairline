# @howells/hairline

## 0.3.0

### Minor Changes

- fd9ff9e: JitterStrip takes `mark`, a record's name: in every group that record is a solid ink dot with its value above it, so one entity can be followed across groups. `median: false` leaves the median ticks out, and `width` and `initialWidth` pass through to the plot.
- fd89769: PairedRungs lays its categories out as rows when the chart is too narrow for its columns: each row carries its name and both values on one line, the current period as rungs along a track and the earlier period hatched beneath, on one scale, and the chart grows taller instead of crowding its labels. PairedRungs also takes `width` and `initialWidth`, so it renders complete on the server like the packaged charts.
- 6014d79: RungBars takes a null value for a withheld bar, which stands as an empty column printed with `hidden` ("Hidden" by default) and is counted in the description and table; `printHidden: false` leaves the word off the column. A bar's `detail` adds a line to its tooltip, `emphasis: null` inks no bar, and `max` sizes the columns' room for a value, so charts set side by side share a scale.
- 95fe05d: AggregateSankey takes `totals={false}` to leave each node's total out of its label and tooltip, for flows that are not all the flows, as when small ones are withheld, where a node's sum would be a total nobody measured. AggregateSankey also takes `width` and `initialWidth`, so it renders complete on the server.

## 0.2.0

### Minor Changes

- 7f6e859: A scaled chart now keeps its rules at one device pixel by default. When `scale` is above 1 or `fit` is set, `strokes` defaults to `"device"`: grid lines, baselines, lines and rings stay hairlines however large the chart is shown, while type and textures still scale with the composition and filled marks such as the bars of RungBars are unaffected. Unscaled charts draw exactly as before. To keep the old behaviour on a scaled chart, pass `strokes="proportional"`.
