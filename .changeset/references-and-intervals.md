---
"@howells/hairline": minor
---

Charts can mark targets and ranges, and say what an interval covers. HairlineLine, HairlineArea, RungBars, DumbbellQueue and PlumbScatter take `references`: dashed target lines named on the line (which can keep the marks that clear them in ink while the rest step back) and quiet bands named inside. PlumbScatter takes `xReferences` too. HairlineLine and HairlineArea take `intervals`, one or two nested bands named by how much of the outcomes they cover ("Half", "9 in 10 outcomes"), and `forecast`, which dashes the line after a rule. New chart RangeDots draws estimates with intervals as error bars, with rows too wide to rank as open dots. References and intervals are in each chart's data table and description.
