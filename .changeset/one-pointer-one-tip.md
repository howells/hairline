---
"@howells/hairline": minor
---

HairlineLine, HairlineArea, RungBars, PlumbScatter, RangeDots, PairedRungs and StackedRungs now share one pointer and one tip. The pointer snaps to the nearest point, and the tip lists every series at it: the date or name in bold, then a row for each series with its swatch and value, the leading series first. A crosshair and ringed dots mark the spot, and the tip stands beside it, flips only if it would clip, and stays inside the chart. It keeps off the line, the printed value labels, notes, reference names and interval names, and the column's band leaves a printed label readable. Its corners are on the radius scale, and the focus ring shows for the keyboard only, never after a click or tap.

A click, tap, Enter or Space pins the tip; Esc, a second click or a press outside lets it go. Each chart is now focusable: the arrow keys step through its points, Home and End jump to the ends, and the tip is read out politely for keys and pins but not for a passing mouse (RungBars and the others had no keyboard path before). On a touchscreen, press and hold scrubs, and a swipe that starts moving first is left to the page, so these charts no longer take over scrolling. The tip eases between points only when the reader has not asked for reduced motion.

The board's time charts (TimeLines, StackedArea, MonthlyBars, DailyUsers) keep their cursor readouts but now run on the same pointer: nearest-point snapping, keys, pinning with a click, and press-and-hold on touch.

For people drawing their own charts, the kit gains `Pointer`, `usePointer` and the arithmetic behind them (`nearest`, `stepTo`, `placeTip`, `spoken`). `useScrub` now takes the drawing's size as well as the positions: `scrub.bind(positions, { height, width })`.
