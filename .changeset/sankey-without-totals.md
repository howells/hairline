---
"@howells/hairline": minor
---

AggregateSankey takes `totals={false}` to leave each node's total out of its label and tooltip, for flows that are not all the flows, as when small ones are withheld, where a node's sum would be a total nobody measured. AggregateSankey also takes `width` and `initialWidth`, so it renders complete on the server.
