---
"@howells/hairline": minor
---

Every chart's hover now shows the one tip: the same paper card the pointer charts use, wrapped at a readable measure instead of one long dark pill. Tooltips are placed by the pointer model, so they never clip the chart. A tip that has no room above its mark stands beside it, and row charts (arrow plot, bullet, pyramid, bar race) put the tip beside their row's end instead of over the row above. `Tooltip` swaps its `below` boolean for `place` ("above", "below" or "beside") and gains `clear`. `placeTip` gains a `below` option.
