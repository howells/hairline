---
"@howells/hairline": minor
---

Small multiples on one scale, and a legend that is one glyph.

`Facets` (from `@howells/hairline/kit`) lays out the same chart once per panel in a responsive grid, one column on a phone. Every panel shares one value scale by default, so equal heights mean equal values; free it and each panel fills its own box and a note says so. Each header carries the panel's name and current value, the hero panel is in ink and the rest on the ramp, and the shared scale's values print once, in a margin left of the first column (`axis`), so every plot is the same width and no panel carries a blank gutter. `HairlineArea` and `HairlineLine` take a `domain` to share a scale, `valueAxis` (`right` by default, `left` in a margin of its own, `none` for the rules alone), and `emphasis: null` for a panel with no hero. The board's Vitals grid is now `Facets`, each cell on its own scale and labelled so.

The glyph charts (Coffee growers, Autumn tides, Solar flares, Year in the round, New woodland) open with a key that is one real record drawn large, its parts named where they are by thin leaders that never cross (the key tries every order of the labels). The flare key zooms to the flare so it fills the key. `glyphKey={false}` turns it off. `GlyphKey` (from `@howells/hairline/kit`) is the shared part: pass your glyph and the points to label.

`HairlineArea` now puts month ticks on the first reading of each month and thins labels that would touch, so weekly readings and narrow panels read cleanly.
