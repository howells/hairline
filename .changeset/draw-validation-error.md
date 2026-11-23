---
"@howells/hairline": minor
---

`drawers[kind](payload)` from `@howells/hairline/draw` now throws a `ChartValidationError` carrying the payload's `issues` (path, pointer, code and message for each), instead of a plain `Error` with the issues joined into its message. The message text is unchanged.
