# Hairline

An engraved chart library for React. Ninety charts, one hand: pixel-snapped hairlines, a single ink hero per chart, and texture made the way a banknote is made, with crosshatch, hatching, stipple and halftone screens laid on exact pixels over warm paper.

See it at [hairline.danielhowells.com](https://hairline.danielhowells.com).

The temperament is an old-fashioned broadsheet chart desk with modern tools: authority from hierarchy rather than ornament, the zero line sharply distinct from a faint grid, labels set on the marks, exact figures, and every chart in the same frame.

## Running it

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm build
pnpm lint         # @howells/lint (oxlint + oxfmt), kept at zero findings
pnpm lint:fix
```

| Route          | What                                            |
| -------------- | ----------------------------------------------- |
| `#/`           | The grid: every chart, each in the house frame  |
| `#/chart/<ID>` | One chart on its own, for example `#/chart/L13` |

Three modes, Pink (the default, after the salmon broadsheet), Paper and Dark, set the same ink on three papers. The switcher recolours everything with a cross-fade and is remembered between visits.

## The system

- **Type.** Inter only, in sentence case, with tabular figures wherever numbers line up. Five roles as Tailwind utilities: `t-axis`, `t-label` (and `t-name`), `t-value`, `t-value-lg` and `t-note`. No capitals, no tracking, no mono.
- **Line.** Three stroke widths: 1px hairlines (snapped to the pixel grid with `crisp()` and `shape-crisp`), 1.5px for data lines and curves, 2px for emphasis. A ladder of rules: `grid-line` (faint), `rule` (quiet structure: leaders, tracks, connectors), `hairline` (baselines and zero lines, full ink).
- **Texture.** One shared module, `src/charts/texture.tsx`: `Hatch`, `CrossHatch`, `Rules`, `Stipple`, `DotScreen`, `Beads`, `DottedLine`, `DotRing`, `DottedPath`, `PixelLine` and `KeySwatch`. Pitches are named in `TEXTURE_PITCH` (hatch 4, crosshatch 6, dot screen 4, dense 3); diagonals are drawn as 1px pixel staircases, so they stay crisp. Textures sit on paper inside a 1px rule, and density or angle encodes a value.
- **Fills.** Every fill comes from one taxonomy, `src/charts/fills.ts`: a family (solid, hatch, crosshatch, rules, upright rules, stipple, dense stipple, broken rungs) in a tone (ink, strong, mid, quiet, faint, alert), or a step on one of two value ladders (halftone, hatch density) when the fill encodes a quantity. The Fills sheet (`#/chart/P1`, the last cell of the grid) draws the whole taxonomy, so drift shows at a glance.
- **Colour.** Each mode is a set of CSS variables (`src/system/tokens.css`): paper, ink, an even warm ramp `--l0`…`--l6` drawn in OKLCH between them, `--hero` for the one emphasised element, and `--alert` for a single exceptional mark. Charts never use hex. Paper is built on patternmode's paper and ink; Pink is a greyed broadsheet rose; Dark rebuilds contrast on a warm near-black rather than inverting.
- **Grain.** Every surface carries a very faint noise in its own ink's colour (`--grain`), behind the marks and never over them, so the page feels like paper while ink and hairlines stay crisp.
- **Motion.** One set of tokens (`--ease-enter`, `--ease-travel`, five durations, four stagger tiers) shared by CSS and by the script-driven charts (`src/charts/motion.ts`). Charts reveal once as they scroll into view; under reduced motion nothing travels and each chart simply fades in.
- **Frame.** Every cell carries a short ink bar and the chart's name above the chart. Nothing else: no prose inside charts.
- **Data.** Every chart describes one fictional company, Fieldnote (`docs/DATA.md`). Data is deterministic: fixed values or seeded randomness (`src/lib/random.ts`).

## Layout

```
src/
  system/      tokens.css (modes, grain, motion), app.css (Tailwind theme, text roles, rules, motion utilities), palette, router
  charts/
    core.tsx     Plot, Chart, Tooltip, grids and ticks
    texture.tsx  engraved patterns and guides; texture-ids.ts for pitches and ids
    control.tsx  the one pill control (Play, Pause, Replay, view pickers)
    motion.ts    motion tokens for script-driven charts
    hooks.ts     useMeasure, useReveal, useSvgId, useScrub, useReducedMotion
    axes.ts      tick helpers and crisp()
    lupi/ basics/ glance/ big/ maps/ board/ originals/ forms/   one kebab-case file per chart + <chart>.data.ts
  gallery/     the registry of every chart (GalleryEntry)
  pages/       the grid and the single-chart page
docs/
  REFINE.md    the design rules (the amendments are the current word)
  DATA.md      Fieldnote: the names and scale every chart's data uses
  BRIEF.md     the original build brief and the reference mapping
reference/     (local only, git-ignored) the screenshots the first versions were rebuilt from
reports/ and research_notes/   research on broadsheet chart craft, with public-domain example plates
```

## Adding a chart

1. Create `src/charts/<family>/<name>.tsx` and `<name>.data.ts`. Render only the plot, inside `<Plot>`; the grid supplies the frame and the name.
2. Take data through props, with Fieldnote demo data as the default. Use the text roles, the rule ladder, the shared textures and theme colours only.
3. Register it as a `GalleryEntry` with a plain, sentence-case name. Pick every fill from the Fills sheet; if a chart needs one that isn't there, add it to `fills.ts` so the sheet shows it.
4. `pnpm lint` and `npx tsc -b` must both be clean, and the chart must be looked at in the browser at 1440 and 390.

## Provenance

The first versions were rebuilt from two references: a set of dashboard charts shared publicly by @wheresryan22, and screenshots of the [Lieflat Charts](https://github.com/larashero3-dotcom/lieflat-charts) catalogue. Lieflat Charts is published under the PolyForm Noncommercial licence; none of its code was ever read or used here, and every chart has since been redesigned, renamed and given its own data. Ten charts (O1–O10) are original to Hairline.
