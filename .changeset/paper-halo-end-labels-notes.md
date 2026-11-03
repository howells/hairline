---
"@howells/hairline": minor
---

Labels sit on a paper halo by default, so lines and gridlines stop short of the text; `Label` takes `halo={false}` for text on a plate of its own. Multi-line time charts can name their lines where they end (the hero with its value, the highest and lowest, the rest folded into "7 other regions") instead of a key, nudged apart with short leaders, and the slope chart's nudged labels now carry leaders too. `HairlineLine` and `HairlineArea` take an opt-in `notes` prop: a few words tied to a reading, drawn beside its point on a leader, or numbered on a phone with the words listed under the chart; notes appear in the data table and the chart's description. On both, a right-hand scale value that would print beside the latest or peak value label is dropped (its rule stays).
