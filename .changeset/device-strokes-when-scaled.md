---
"@howells/hairline": minor
---

A scaled chart now keeps its rules at one device pixel by default. When `scale` is above 1 or `fit` is set, `strokes` defaults to `"device"`: grid lines, baselines, lines and rings stay hairlines however large the chart is shown, while type and textures still scale with the composition and filled marks such as the bars of RungBars are unaffected. Unscaled charts draw exactly as before. To keep the old behaviour on a scaled chart, pass `strokes="proportional"`.
