---
"@howells/hairline": patch
---

HairlineLine and HairlineArea print values to the precision of their value axis when no `format` is given. On an axis labelled 7.5, 7.75, 8, a reading of 7.81 now prints "7.81" beside its dot and in the description and table, where it printed "8". The internal daily grid's `wholeNumbers` prop is gone; the grid takes the chart's format.

HairlineArea staggers its entry stem by stem rather than by day, so a year of monthly stems settles in about 1.5 seconds instead of 6.
