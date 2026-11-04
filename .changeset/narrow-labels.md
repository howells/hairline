---
"@howells/hairline": minor
---

Narrow charts no longer stagger labels onto two lines, where a label reads as its neighbour's. RungBars shortens a run of years the broadsheet way (2016, ’17, ’18) and, failing that, prints every other label, always keeping the hero's. Column headers in the matrix and rank strip wrap over their own column, breaking after a dash ("1996–" over "2010") or hyphenating a word too wide for it. The thread triptych sets each narrow heading's name over its count, leaning the middle ones away from each other. DumbbellQueue's rungs count in a round multiple of the unit when a narrow width would pack them solid, and a gap too short to space its rungs draws none. New in the kit: `fitBandLabels` and `headerLines` (`src/charts/band-labels.ts`).
