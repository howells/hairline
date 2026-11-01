# Data: the contract every payload follows

A packaged chart takes one plain object. A zod schema in `src/schema/` is the source of truth for it; the types, the JSON Schemas (`@howells/hairline/json-schema/<kind>.json`) and the props tables on `#/docs/<kind>` are all generated from that schema. This page is the part that is the same for every chart. The part that differs is the chart's data shape, in the registry (`getChart(kind).dataShape`) and on its docs route.

## Required, never demo

`data` (or `rows`, for `Slope`) is required and the package never fills in missing data. A chart given a payload its schema rejects is a type error in TypeScript, and `validate` returns issues rather than a fake chart:

```ts
import { getChart } from "@howells/hairline/schema";

const result = getChart("rung-bars").validate(payload);
// { ok: true, value } or { ok: false, issues: [{ pointer: "data[2].value", code, message, path }] }
```

Unknown keys are errors, so a misspelt option is caught, not ignored.

## Plain data

- **Dates** are ISO strings: a day (`"2025-12-08"`) or an instant (`"2025-12-08T09:00:00Z"`), never a `Date`.
- **Gaps** in a daily series are `null` (or, from TypeScript, `NaN`). The chart draws a gap there, not a zero.
- **Formats** are descriptors: `"integer"`, `"decimal"`, `"compact"`, `"percent"` (a fraction, so `0.12` prints `12%`), or Intl number-format options with an optional `locale`. They print in en-US unless the descriptor says otherwise, so the server and the browser agree. A function also works from TypeScript, but cannot cross the server-to-client boundary.
- **Keys.** A datum is addressed by its `id`, else its label (`name` in `Slope`, `date` in the daily charts). `emphasis` and `labelled` name data by key, never by index. Give an `id` when labels repeat.
- **Limits** are enforced by the schema, and listed in the registry under `limits`: a chart that takes twelve rows says so, and a thirteenth is an issue.

## Choosing a chart

Each registry entry names the Visual Vocabulary job the chart does best (`jobs`), what it suits (`whenToUse`) and what it does not (`whenNotToUse`). An agent picks by job, writes `data` to `dataShape`, and checks it with `validate` before rendering.

## The gallery's data

The gallery draws real public data, credited on `#/sources` and behind each chart's (i). Data is fixed or deterministic (`src/lib/random.ts`), never `Math.random`. Docs examples in `src/docs/examples.ts` are small payloads with rounded figures, checked against the schemas by `pnpm test`.
