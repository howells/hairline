# Hairline refinement pass: brief

Hairline is a React + TypeScript chart system (Vite, d3 for maths only, hand-written SVG, Tailwind v4). The site is one minimal grid of every chart (`#/`), each cell showing a chart and its name and nothing else. Each chart also renders alone at `#/chart/<ID>`.

Most charts were rebuilt from two references (a tweet of dashboard charts, and screenshots of a third-party project). They are still near-replicas. This pass makes every chart **ours**: the same chart type, changed ever so slightly toward one consistent character, with utter refinement and cleanliness. It is a refinement, not a redesign: each chart stays recognisably the same kind of chart.

## Hard rules (verbatim; they override anything else here)

1. **No small caps, tracked uppercase or decorative mono.** No eyebrows, kickers, section labels, chips or table headings in capitals. Mono is for literal code, identifiers and values whose characters need inspecting, never for labels or headings. Proper acronyms keep their capitals.
2. **No prose where interface belongs.** A paragraph explaining a screen means the screen has failed. Replace it with a label, a control, a value or nothing. Keep only consent, constraints and error recovery.
3. **Four to six type styles.** Use the product's named roles. A new size or weight needs a job no existing role does.
4. **Reuse before you build.** Find the existing component, shell, header or control that does the job, in this product and in any package or project the user has pointed to, and use it. A second version of an existing control is a defect.
5. **One of each.** One corner-radius scale with concentric nesting, one icon family at one stroke weight, one control height per density.
6. **Touch targets at least 44 by 44 CSS pixels.**
7. **Verified means used and looked at.** "Works" means you completed the path in a browser, or walked a mockup's boards in order. "Looks right" means you then viewed each whole screen as the user sees it. Report the two separately, and never claim either from static checks.

## Clean-room (mandatory)

Never open, read, copy or translate anything under `/tmp/lieflat-charts`. The screenshots in `reference/` are the only references, and in this pass you use them only to make sure a chart has moved **away** from its reference, never toward it.

## The direction: ruled, quiet, exact

**Hierarchy.** The data leads. Each chart has exactly **one** emphasised element (the hero: the leading bar, the current value, the peak, the selected series) in ink (`fill-ink` / `stroke-ink`, or `hero` tokens). Everything else sits on the grey ramp `l1`–`l6`. Text is quieter than the marks it labels.

**Type.** The foundation has already been changed: every `t-*` role is now Inter, sentence case, tabular figures. Use only these roles:

| Role | Use |
| --- | --- |
| `t-axis` | ticks, scale labels, small secondary labels (11px, muted) |
| `t-label` / `t-name` | category and series names (12px medium) |
| `t-value` | data values (12px semibold, ink, tabular) |
| `t-value-lg` | the one big figure, when a chart has one (30px semibold) |
| `t-note` | keys and units, one step quieter than axis (11px, faint) |

- Remove every `uppercase`, `font-mono`, `tracking-mono`, `tracking-label`, `tracking-caps`, `tracking-strip`, `tracking-wide*` from chart text. For any data string or format written in capitals (`"SEARCH"`, `"JAN"`, `utcFormat("%b").toUpperCase()`), make it sentence or natural case: `Search`, `Jan`, `Jan 2025`. Acronyms keep their capitals (`US`, `CA`, `API`, `DB`, `OOM`, `Q3`, `MAU`).
- Do not invent sizes. Board text uses the strings in `src/charts/board/styles.ts` (already Inter).

**Line.** Exactly three stroke widths for strokes:

- `1px`: hairlines (rules, ticks, gridlines, stems, rungs, outlines). Straight horizontal and vertical 1px lines **must sit on the pixel grid**: wrap the coordinate with `crisp()` from `src/charts/axes.ts` (`Math.round(v) + 0.5`) and add `shape-crisp`.
- `1.5px` (`stroke-medium` or `strokeWidth={1.5}`): data lines and curves (paths, arcs, links). Curves stay `shape-smooth` / default.
- `2px`: emphasis only (the hero line, a selected outline). For straight 2px lines use whole-pixel coordinates (`Math.round(v)`).
- Anything else (0.6, 0.75, 0.8, 0.9, 1.1, 1.2, 1.3, 1.4, 2.2…) is a defect. Data-driven widths (a Sankey link's thickness, a bar) are exempt: they encode value.

**Grid.** Solid 1px hairlines: the new `grid-line` utility (`stroke: var(--grid)`, crisp) for gridlines, `hairline` (`--rule`) for baselines and axes. **No dotted or dashed gridlines, rings or guides.** A dash is allowed only where it encodes meaning (forecast, target, a missing period), never as decoration. Remove `grid-dotted`, `dash-dot`, and `strokeDasharray` that are decorative.

**Tone.** Resting tones are **solid** ramp colours (`fill-l3`, `stroke-l5`, `heat-*`). Do not make tones from `opacity`, `strokeOpacity`, `fillOpacity` or `color-mix`. Opacity is only for interaction (hover dimming via `dimClass`, `opacity-25`/`30` on non-focused marks).

**Shape.** Dot radii from one small scale: 2, 3, 4.5, 6 (plus radii that encode a value). Rounded rects: `rx` 2 for small cells, 4 for large tiles; nested corners concentric. Line caps and joins round on data lines (`cap-round`).

**Texture.** None. No grain, no shadows, no gradients, no glow, no halos except `t-halo` where text genuinely crosses marks.

**Motion.** Unchanged: keep `stagger(i, tier)` and the motion utilities (`grow-y`, `grow-x`, `pop`, `fade`, `draw`). Add no new durations, curves or keyframes.

**Prose.** None. No titles, subtitles, footnotes or sentences inside charts. A short legend key (`● 2026 ○ 2025`) is fine when the chart can't be read without it.

## Amendment 1 (overrides "Grid", "Tone", "Texture" and "Shape" above where they conflict)

The first pass stripped out the texture and lost the gorgeousness. Texture is welcome, and it is where the character lives. What makes it **ours** rather than the reference's is how it is made: the reference's texture is loose and organic (jittered ticks, wobbly translucent blobs, random scatter). Ours is **engraved**: precise, regular, crisp, like an engraving, a banknote or a technical drawing.

- **Texture is in.** Use crosshatch, diagonal hatching, stipple and halftone dot screens, dotted rules and fine line fills. Build them as SVG `<pattern>`s (unique ids via `useSvgId`) or as drawn geometry, in theme colours only (`var(--l3)` etc.), responding to palettes.
- **Engraved, not organic.** Every texture sits on an exact grid: even pitch (for example 3px or 4px), 1px lines on whole pixels, dots of a fixed radius at fixed spacing. Density, angle and dot size can encode value or category: denser or darker hatch for more, crosshatch for the hero.
- **Even spacing over randomness.** Where marks are a crowd (ticks in a strip, people in a cluster, units in a tally), lay them out on a regular rhythm: equal pitch, rows, phyllotaxis (sunflower) spirals, lattices. No jitter that is only decorative.
- **Dotted lines are allowed as texture** when they are evenly spaced 1px dots on the pixel grid (a dotted guide or ring that reads as engraving). Plain solid hairlines stay the default for axes and baselines.
- **Layered translucency is allowed where overlap is the meaning** (density building where shapes overlap, an ethereal stack of forms). Keep it to one tone and one opacity per chart; never use opacity merely to make a lighter grey.
- **Paper fills for occlusion.** Overlapping forms (ridges, stacked areas) can be filled with paper so the front one cleanly covers the one behind, then textured.
- **Keep distinct from the source.** Same chart type, but never its exact look: if a chart ends up looking like its reference screenshot again, change the texture's grammar (hatch instead of translucent grey, a lattice instead of scatter).
- Everything else stands: Inter type roles in sentence case, crisp pixel-snapped rules, one ink hero, the motion tokens, no prose.

Specific feedback from the user, for the charts it names:

- **L9 bubbles (ethereal quality lost):** bring back the airy, layered feel: for example fill each bubble with a fine halftone or stipple screen whose density follows the value, or a soft single-tone translucent fill so overlaps build density, with a crisp 1px outline and the inner dot.
- **L13 funnel (messy):** the strips' ticks at one even pitch; the threads as smooth, evenly spaced bundles rather than a tangle.
- **L14 clusters (dull):** pack each cluster's dots in a phyllotaxis (sunflower) spiral or a regular lattice instead of random scatter; the hero cluster in ink; give it beauty (for example a fine dotted ring at each cluster's extent).
- **L19 ridges (needs crosshatch):** fill each ridge with hatching over a paper fill so ridges overlap like terrain; the hero ridge crosshatched in ink.

## Amendment 2: one system (overrides everything above where they conflict)

An art-director review found the set gorgeous in patches but not yet one system. These decisions are final and apply to every chart.

**Shared modules (reuse; never write your own).**

- Textures: `src/charts/texture.tsx` (`Hatch` rising/falling, `CrossHatch`, `Rules` level/upright, `Stipple`, `DotScreen` (halftone, radius), `Beads`, `DottedLine` (horizontal or vertical), `DotRing`, `KeySwatch`) and `src/charts/texture-ids.ts` (`TEXTURE_PITCH`, `paint(id)`, `useTextureIds(prefix)`). Migrate your folder onto these and **delete your folder's own texture module** (`basics/textures.tsx` + `texture-ids.ts`, `board/texture-defs.tsx`, `glance/engraving.tsx`, `lupi/texture.tsx`, `maps/halftone*.ts(x)`, `big/textures.tsx`, `forms/hatch.tsx`, `originals/stipple.tsx`). If a shared component lacks something you genuinely need, add it to `texture.tsx` in the same style rather than keeping a local copy, and say so in your report.
- Controls: `src/charts/control.tsx` (`Control`): the one pill, 28px inside a 44px hit area. Every Play/Pause/Live/Replay/view picker uses it.
- Keys: `KeySwatch` (10 × 10, 2px corners, texture on paper inside a 1px `l5` rule) for every legend or key swatch. No dots, no 10px squares, no other swatch styles.

**Pitches.** Only `TEXTURE_PITCH`: hatch 4, crosshatch 6 (second family offset half a pitch, built in), dot screen 4, dense 3. Crosshatch at 4px read as chequerboard; never use it.

**Texture on paper.** Every textured fill is the texture over paper (`ground="fill-paper"`) inside a 1px outline (`stroke-l5`, crisp), never hatch over a grey tint.

**Grid.** One system: solid 1px hairlines (`grid-line`, `hairline`). Dotted gridlines are gone (they were exactly the tweet's). Dots live in data textures and in engraved guides and rings only.

**Provisional / dormant / future.** One encoding: an evenly dotted 1px line or ring at pitch 3 (`DottedLine`, `DotRing step={3}`). No dashes anywhere, except a single target or SLA rule may stay a dash.

**Hero.** Exactly one per chart, in ink (solid or crosshatched). Red (`alert`) marks one exceptional thing only, never several, and colours marks, not label text.

**Density by texture, not alpha.** Where a chart layers to show density, step the hatch pitch or dot radius (for example 6 / 4 / 3) instead of stacking translucent greys. The one allowed translucency (overlap as meaning) stays a single tone at a single opacity.

**Paper, not dark.** All cells are paper except B1 (the single dark moment). Set `dark` to false/remove it for L2, G6, G11, B2, B3 and check them on paper.

**Composition.** At 1440 a half cell is about 560px wide inside. Size half-width charts to about 440–480px tall and full-width charts to about 520–560px, scaling the chart to fill rather than floating small in a tall cell (or overflowing). Only L17, B1, B3 and M2 keep `span: "full"`; every other chart is half width (rework its layout to read well at half width).

**Text.** Labels and values in ink or text tones; no red label text. No status sentences under charts (B3's "136 paths · 26 sources → …" line becomes three labelled counts or nothing).

**Distinctness.** If your chart is in the "still copies" list below, give it the move described.

## Amendment 3: finish (overrides everything above where they conflict)

- **Data.** Every chart's demo data comes from `docs/DATA.md` (Fieldnote). No label or number may match the chart's reference screenshot (`docs/BRIEF.md` maps ids to screenshots; open the screenshot and check). Keep each chart's story and hero.
- **Time axes, broadsheet style.** Month ticks print the year only on the first tick and where it changes: `monthTickLabels(dates)` in `src/lib/format.ts`. Year ticks abbreviate after the first: `yearTickLabels(dates)`. Use them wherever a chart labels months or years.
- **Right-hand value axis** for single-series time charts where it reads better (values sit next to the latest data, as on a financial page): ticks right-aligned to the plot's right edge, on the gridlines. Not for multi-series charts whose line-end labels need the right margin.
- **Key swatches are now 12 × 12** (`KeySwatch`). Re-check every legend you own for spacing.
- **The house frame** is in the gallery cell: a short ink bar and the chart's name above every chart. Charts must not add their own title.
- Baselines and zero lines use `hairline` (now full ink); leaders, connectors, tracks and per-row lines use the new quiet `rule` utility; gridlines use `grid-line`.

## Per chart: what to do

For each chart you own:

1. **Clean it** against the direction above: type roles and casing, the three stroke widths, pixel snapping, solid grid, solid tones, one hero, the radius scale.
2. **Make it ours, ever so slightly.** One deliberate, small change of character that moves it away from its reference while keeping its chart type, for example: a different mark (a solid 2px rung instead of a hairline ladder; a hollow ring instead of a filled dot), a different emphasis (ink only on the hero, everything else at one grey), a cleaner composition (labels aligned to one edge, values set on the baseline), fewer elements (drop a decorative ring or guide). Keep it small and consistent with your other charts. Name the change in your report.
3. **Rename it** in its gallery entry (`name`): a plain, sentence-case description of what the chart shows, one to three words, our own vocabulary. Never reuse the reference's coined name (no "Launch fan", "Hourglass stream", "Rung bars", "Hundred field", "Ballot tally", "Tick gauge", "Dot cascade", "Barcode lollipop", "Arc matrix", "Radial convergence", "Cluster field", "Brand spectrum", "Dotty matrix", "Bubble almanac", "Radial patchwork", "Trend lineage", "Type colonnade", "Calendar heat", "Ridgeline", "Parallel coordinates" style names). Standard type names are fine when that's what it is ("Choropleth" → "States", "Sankey" → "Channel flow"). Keep the `id`.
4. Keep data as it is (a separate pass will replace it), but **sentence-case** the label strings per the type rule.

## Code rules

- `@howells/lint` with zero findings in your folder: `pnpm exec howells-fix src/charts/<folder>` then `pnpm exec howells-check src/charts/<folder>`. Never run them on `.` or another folder. Never disable a rule.
- Kebab-case files, arrow functions, `interface` for object types, `import type` on its own line, data in `.data.ts`, sorted keys, strict booleans, braces always, no nested ternaries, no `++`, no `as` (without a `// SAFETY:` line), keys from data, no `role="img"` (aria-label + `<title>`), no inline `fontSize`, no arbitrary Tailwind values (theme tokens only), functions under 120 lines.
- **Only edit files inside your folder.** Do not touch `src/charts/core.tsx`, `axes.ts`, `util.ts`, `motion.ts`, `hooks.ts`, `src/system/*`, `src/gallery/*`, other folders or pages. If you need a shared change, write it in your report.
- TypeScript: `npx tsc -b 2>&1 | grep 'src/charts/<folder>'` must print nothing. Errors in other folders are other agents' work in progress; ignore them.
- The dev server runs at `http://localhost:5199` (do not start or stop it). If it is down, say so in your report.

## Verification (required, per chart)

Use your own browser session name (`--session <folder>`). For each chart:

```sh
agent-browser --session <folder> set viewport 1440 1000 2
agent-browser --session <folder> open "about:blank"
agent-browser --session <folder> open "http://localhost:5199/#/chart/<ID>"
agent-browser --session <folder> wait 2600
agent-browser --session <folder> screenshot /tmp/refine/<folder>/<ID>-wide.png
agent-browser --session <folder> errors
```

Repeat at `set viewport 390 900 2` for `<ID>-narrow.png`. Read every screenshot. Check: nothing clipped or overlapping, labels sentence case, no dotted grids, lines crisp, one hero, the chart still reads. Hover one mark to check hover still works (`agent-browser --session <folder> hover <selector>` or `eval` a pointer event), then screenshot. Also check one chart in another palette: `agent-browser --session <folder> eval 'document.documentElement.dataset.palette="porcelain"'`. Fix and re-shoot until right.

## Report (your final message)

1. A table: `ID | old name → new name | the small change of character | cleanups (widths, snapping, tones, grid, casing)`.
2. Rule 1 sweep on your folder: `rg -n 'uppercase|small-caps|font-variant-caps|font-mono|tracking-wid|tracking-\[|letter-spacing|tracking-(mono|label|caps|strip)' src/charts/<folder>`: hits removed and any kept (with why).
3. Stroke sweep: remaining stroke widths in your folder and why each is allowed.
4. Verification: "works" (hover/scrub paths you exercised) and "looks right" (screenshots you read), separately. Console errors, if any.
5. Shared changes you need, if any. Lint and tsc status for your folder.
