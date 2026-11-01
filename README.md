# Hairline

An engraved chart library for React. Ninety charts, one hand: pixel-snapped hairlines, a single ink hero per chart, and texture made the way a banknote is made, with crosshatch, hatching, stipple and halftone screens laid on exact pixels over warm paper.

See it at [hairline.danielhowells.com](https://hairline.danielhowells.com).

The temperament is an old-fashioned broadsheet chart desk with modern tools: authority from hierarchy rather than ornament, the zero line sharply distinct from a faint grid, labels set on the marks, exact figures, and every chart in the same frame.

## Running it

```sh
pnpm install
pnpm dev           # http://localhost:5173
pnpm build
pnpm lint          # @howells/lint (oxlint + oxfmt), kept at zero findings
pnpm lint:fix
pnpm build:lib     # the package, into lib/
pnpm test          # builds lib/, then tests it the way a consumer imports it
pnpm e2e           # the acceptance suite in the Playwright image (acceptance/README.md)
```

The docs site is its own workspace package in `site/`, built with [Blume](https://github.com/haydenbleasel/blume). Both commands build `lib/` first, since the site draws its examples with the package:

```sh
pnpm --filter @howells/hairline-site dev     # http://localhost:4321
pnpm --filter @howells/hairline-site build   # static HTML in site/dist
```

| Route | What |
| --- | --- |
| `#/` | The grid: every chart, each in the house frame, with nothing else |
| `#/chart/<ID>` | One chart on its own, for example `#/chart/L13` |
| `#/kit` | The fills, marks and type the charts are drawn from |
| `#/sources` | Where each chart's numbers come from |

Three modes, Pink (the default, after the salmon broadsheet), Paper and Dark, set the same ink on three papers. The switcher recolours everything with a cross-fade and is remembered between visits.

## Docs

How to use the package lives on the docs site in [`site/`](site): getting started, the payload contract, the philosophy, and a page per chart. The chart pages are generated from the registry and the zod schemas (`site/src/chart-pages.ts`), so a chart's props table and JSON Schema cannot drift from what it validates. The site's `llms.txt` lists every registry kind with its JSON Schema, for agents.

## Using it in an app

`@howells/hairline` is MIT licensed and not yet published to npm. Once it is, the install will be `npm install @howells/hairline`. Until then, build it locally. Clone the repository, then:

```sh
pnpm install
pnpm build:lib     # writes lib/
```

and install it into the app from a path (`"@howells/hairline": "file:../hairline"`). A `file:` install is a copy, so rebuild and reinstall after any change. The host needs React 19.

Every packaged chart is also its own subpath (`@howells/hairline/rung-bars`, `/hairline-line`, `/hairline-area`, `/dumbbell-queue`, `/plumb-scatter`, `/slope`), so a bundle takes only what it draws. The map charts are behind `@howells/hairline/maps`.

```tsx
import "@howells/hairline/hairline.css";
import { RungBars } from "@howells/hairline/rung-bars";

<div className="hl-root">
  <RungBars
    data={[
      { label: "Everest", value: 8849 },
      { label: "K2", value: 8611 },
      { label: "Kangchenjunga", value: 8586 },
    ]}
    unit={500}
    unitNote="One rung = 500 m"
  />
</div>;
```

`hairline.css` is precompiled: the tokens, text roles, rules, textures and motion in one file, with no Tailwind in the host. Its selectors sit under `.hl-root` and its custom properties are prefixed `--hl-`, so nothing meets the host's own. A host that builds with Tailwind v4 can instead import `@howells/hairline/tokens.css` and `@howells/hairline/theme.css` after `@import "tailwindcss"`.

- **Theming.** `deriveTheme` from `@howells/hairline/theme` is React-free. Give it a paper and an ink, and if you like a hero, an alert, a font and a mode, and it returns every `--hl-*` property the charts draw with, ready as a `style` on the `hl-root` element. The ramp is derived, not inverted, so dark mode keeps its contrast. Setting the `--hl-*` variables yourself works too. The library sets nothing on `:root`.

  ```tsx
  import { deriveTheme } from "@howells/hairline/theme";

  const theme = deriveTheme({
    paper: "#faf9f6",
    ink: "#1d1d1b",
    hero: "#a3402b",
  });

  <div className="hl-root" style={theme}>
    {/* charts */}
  </div>;
  ```

- **Data is required.** The package never falls back to demo data. The six charts with schemas take a `data` (or, for `Slope`, `rows`) prop that a zod 4 schema validates; see the chart's page on the docs site.
- **The schema contract.** `@howells/hairline/schema` is React-free: one schema per chart, the types inferred from it, `validate` returning path-specific issues, formatter descriptors (`"percent"`, or Intl number-format options; functions still work from TypeScript), and a `registry` of each chart's `kind`, Visual Vocabulary job, data shape, limits and guidance. The JSON Schemas are emitted at build to `lib/json-schema/<kind>.json` (`@howells/hairline/json-schema/<kind>.json`), with an `index.json`.
- **Server mode.** Pass `width` and `height` for a fixed-size chart that is complete in the server's first HTML (`renderToString` returns the drawn chart), and it is drawn and ready (`data-hl-ready="true"`) with no client: a fixed-size chart defaults to `animate="off"`, while `animate="scroll"` or `"mount"` asks for the entry animation (then it starts hidden). The responsive chart defaults to `"scroll"`. Omit `width` for the measured, responsive chart, and give it `initialWidth` so its first render is real. A summary and a data table are in the markup for screen readers; `table` shows the table to everyone. Every module starts with `"use client"`, so a server component can render a chart whose props are plain data. A formatter function cannot cross that boundary, so use a descriptor, or wrap the chart in a client component of your own.
- **Export mode.** For slides and rendered images, draw at the logical `width` and set `scale` to show the whole composition larger through the viewBox, type and textures with it. `fit` fills the container at the chart's aspect ratio. A scaled chart (`scale` or `fit`) keeps every stroke at one device pixel however large it is shown: `strokes="device"` is its default, and `strokes="proportional"` lets strokes grow with the composition. An unscaled chart is unchanged. The policy acts on stroked geometry only (rules, lines, rings, outlines); filled marks such as RungBars' bars scale with the composition either way, so there it changes just the baseline rule. `animate="off"` and `onReady` tell a renderer when the chart has settled.
- **Several roots on one page.** `idPrefix` leads every SVG id, so charts rendered in separate React roots do not collide.
- **Fonts.** `deriveTheme`'s `font`, or `--hl-font`, sets the charts' face. Label widths are measured for Inter, so another face may crowd; pass `metrics` with its glyph widths.
- **Emphasis.** The hero is chosen by a datum's key (`id`, else its label or date), never by index.
- **Size.** One chart costs a host, minified and gzipped with React left out and every other dependency bundled: DumbbellQueue 52 KB, HairlineArea 55 KB, HairlineLine 55 KB, PlumbScatter 52 KB, RungBars 47 KB, Slope 51 KB (1 KB = 1,000 bytes). `tests/bundle-size.test.ts` bundles each subpath and fails a chart that outgrows its budget; raising one is a reviewed edit to the test and to this line.
- **Types.** Each packaged chart exports its props and datum types by name (`RungBarsProps`, `RungDatum`); for the rest use `ComponentProps<typeof Chart>`.
- **The kit.** `@howells/hairline/kit` exports the parts the charts are drawn from (`Plot`, `ChartSvg`, `Label`, the rules, marks and textures), for a new chart drawn in the same hand.
- **The frame.** Charts draw only the plot and take no title or source. The host composes those, or sets `Frame` from `@howells/hairline/frame` round any chart: `<Frame name source footnote note>` is the gallery cell (the name, an (i) opening `note`, the chart, then the source and footnote). The in-plot unit key is the chart's `unitNote` prop; `note` is its deprecated old name.

## The system

- **Type.** Inter only, in sentence case, with tabular figures wherever numbers line up. Three sizes and five roles: `t-axis`, `t-label`, `t-value` and `t-figure` in the charts, `text-small` around them. No capitals, no tracking, no mono; a lint rule holds the case.
- **Line.** Three stroke widths: 1px hairlines (snapped to the pixel grid with `crisp()` and `shape-crisp`), 1.5px for data lines and curves, 2px for emphasis. A ladder of rules: `grid-line` (faint), `rule` (quiet structure: leaders, tracks, connectors), `hairline` (baselines and zero lines, full ink).
- **Texture.** One shared module, `src/charts/texture.tsx`: `Hatch`, `CrossHatch`, `Rules`, `Stipple`, `DotScreen`, `Beads`, `DottedLine`, `DotRing`, `DottedPath`, `PixelLine` and `KeySwatch`. Pitches are named in `TEXTURE_PITCH` (hatch 4, crosshatch 6, dot screen 4, dense 3); diagonals are drawn as 1px pixel staircases, so they stay crisp. Textures sit on paper inside a 1px rule, and density or angle encodes a value.
- **Fills.** Every fill comes from one taxonomy, `src/charts/fills.ts`: a family (solid, hatch, crosshatch, rules, upright rules, stipple, dense stipple, broken rungs) in a tone (ink, strong, mid, quiet, faint, alert), or a step on one of two value ladders (halftone, hatch density) when the fill encodes a quantity. The Fills sheet on the Kit page (`#/kit`, beside Marks and Type) draws the whole taxonomy, so drift shows at a glance.
- **Colour.** Each mode is a set of CSS variables (`src/system/tokens.css`): paper, ink, an even warm ramp `--hl-l0`…`--hl-l6` drawn in OKLCH between them, `--hl-hero` for the one emphasised element, and `--hl-alert` for a single exceptional mark. Charts never use hex. Paper is built on patternmode's paper and ink; Pink is a greyed broadsheet rose; Dark rebuilds contrast on a warm near-black rather than inverting.
- **Grain.** Every surface carries a very faint noise in its own ink's colour (`--grain`), behind the marks and never over them, so the page feels like paper while ink and hairlines stay crisp.
- **Motion.** One set of tokens (`--ease-enter`, `--ease-travel`, five durations, four stagger tiers) shared by CSS and by the script-driven charts (`src/charts/motion.ts`). Charts reveal once as they scroll into view; under reduced motion nothing travels or fades, and the stylesheet draws the plot in the first paint (`data-hl-ready` turns "true" once hydration has read the preference).
- **Frame.** Every cell carries a short ink bar and the chart's name above the chart. Nothing else: no prose inside charts.
- **Data.** The gallery draws real public data, credited on `#/sources` and behind each chart's (i). A chart takes its data through props; the package carries none.

## Layout

```
src/
  system/      tokens.css (modes, grain, motion), hairline.css (what the charts need: text roles, rules, motion utilities), app.css (the site's own theme), palette, router
  index.ts     every chart, generated by scripts/library-index.ts; kit.ts, the parts
  charts/
    core.tsx     Plot, Chart, Tooltip, grids and ticks
    texture.tsx  engraved patterns and guides; texture-ids.ts for pitches and ids
    control.tsx  the one pill control (Play, Pause, Replay, view pickers)
    motion.ts    motion tokens for script-driven charts
    hooks.ts     useMeasure, useReveal, useSvgId, useScrub, useReducedMotion
    axes.ts      tick helpers and crisp()
    lupi/ basics/ glance/ big/ maps/ board/ originals/ forms/   one kebab-case file per chart + <chart>.data.ts
  schema/      one zod schema per packaged chart, and the registry (React-free)
  gallery/     the registry of every chart (GalleryEntry)
  pages/       the grid and the single-chart page
docs/
  REFINE.md    the design rules (the amendments are the current word)
  BRIEF.md     the original build brief and the reference mapping
site/          the docs site (Blume): hand-written pages in docs/, a page per chart from src/chart-pages.ts
reference/     (local only, git-ignored) the screenshots the first versions were rebuilt from
reports/ and research_notes/   research on broadsheet chart craft, with public-domain example plates
```

## Adding a chart

1. Create `src/charts/<family>/<name>.tsx`. Render only the plot, inside `<Plot>`; the grid supplies the frame and the name.
2. Take data through props, required; never default to demo data. Use the text roles, the rule ladder, the shared textures and theme colours only.
3. Register it as a `GalleryEntry` with a plain, sentence-case name, and add its numbers to `src/gallery/sources.json` and `about.json`. Pick every fill from the Fills sheet; if a chart needs one that isn't there, add it to `fills.ts` so the sheet shows it.
4. To package it, add `src/schema/<kind>.ts` following `rung-bars.ts`, an entry in `src/schema/registry.ts`, and an example in `site/src/examples.ts`. The chart's docs page, its JSON Schema and its line in the site's `llms.txt` follow from those.
5. `pnpm typecheck`, `pnpm lint` and `pnpm test` must be clean, and the chart must be looked at in the browser at 1440 and 390.

## Provenance

The first versions were rebuilt from two references: a set of dashboard charts shared publicly by @wheresryan22, and screenshots of the [Lieflat Charts](https://github.com/larashero3-dotcom/lieflat-charts) catalogue. Lieflat Charts is published under the PolyForm Noncommercial licence; none of its code was ever read or used here, and every chart has since been redesigned, renamed and given its own data. Ten charts (O1–O10) are original to Hairline.
