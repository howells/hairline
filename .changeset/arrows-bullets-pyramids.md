---
"@howells/hairline": minor
---

Three forms the library lacked: ArrowPlot (each row a change from a before to an after, with the new value at the arrowhead; rises in ink, falls quieter, tiny changes as a pair of dots), Bullet (a measure bar against a target tick over three ranges, one row per metric) and Pyramid (two sides of bars back to back around a column of band names, one side engraved and the other ink). Ridgeline now draws back to front, each ridge filled with paper so a nearer one hides what is behind it, with a quiet baseline under every row, the hero in ink over a quiet tint, and a new `overlap` option for how many rows a ridge stands over. The hatching on Ridgeline is gone.
