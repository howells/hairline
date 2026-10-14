# Hairline: build brief for chart components

Hairline is a React + TypeScript charting system (Vite, d3 for maths only, hand-written SVG). It merges two visual references:

1. **Boards**: dense, scrubbable dashboard charts (`src/charts/board/`, done).
2. **Editorial**: Lupi Editorial (L), Lupi Basics (F), Glance (G), Interactive (B) and Maps (M) families. These are being built now.

Read this whole brief before writing code.

## Clean-room rule (mandatory)

The editorial families are inspired by a third-party project whose code is under a **non-commercial licence**. This project may be used commercially, so:

- **Do not open, read, copy or translate any file under `/tmp/lieflat-charts`** (HTML, JS, MD, anything).
- Your only references are the screenshots in `reference/lieflat/` and this brief. Rebuild each chart from what you **see**, in this project's own idiom.
- Use your own demo data that resembles the screenshot (labels, counts and shape are fine to echo; they are not code).

## Stack and files

- React 19, TypeScript (strict), d3 modules already installed: `d3-scale d3-shape d3-array d3-format d3-time d3-time-format d3-sankey d3-force d3-hierarchy d3-geo d3-interpolate d3-color d3-chord d3-polygon d3-delaunay topojson-client world-atlas us-atlas`. **Do not install packages.** If you truly need one, say so in your final report.
- No chart libraries (no Chart.js, ECharts, Recharts, visx). SVG by hand; `<canvas>` only if SVG cannot cope (thousands of animated marks).
- Your folder: `src/charts/<family>/`. One file per chart: `kebab-case-name.tsx`, demo data in `kebab-case-name.data.ts`. Shared helpers for your family go in `src/charts/<family>/util-<you>.ts`.
- **Only edit files inside your family folder.** In particular, `src/charts/<family>/index.tsx` is yours: register every chart there as a `GalleryEntry` (see `src/gallery/types.ts`). Do not touch `src/charts/core.tsx`, `src/system/*`, `src/lib/*`, other families or pages. If you need a shared change, describe it in your final report instead.
- Worked example: `src/charts/basics/rung-bars.tsx` (+ `rung-bars.data.ts`) plus its entry in `src/charts/basics/index.tsx`. **Read them before you start** and match their structure. (It is being converted to the lint and Tailwind rules below; if it still shows the old style when you read it, follow the rules, not the file.)

## Code style: `@howells/lint` (mandatory)

The repo is on `@howells/lint` (oxlint + oxfmt, React preset). Your folder must finish with **zero findings**:

```sh
pnpm exec howells-fix src/charts/<family>     # autofix + format, YOUR folder only
pnpm exec howells-check src/charts/<family>   # must print no errors or warnings
```

Never run them on `.` or on another agent's folder, and never disable rules (no `oxlint-disable` comments, no config changes). Write code this way from the start:

- **Kebab-case filenames:** `rung-bars.tsx`, `launch-fan.tsx`, `util-a.ts`.
- **Arrow functions everywhere,** components included: `export const LaunchFan = (props: LaunchFanProps) => { … }`. No `function` declarations.
- **`interface` for object types** (`interface LaunchFanProps { … }`), not `type X = { … }`. Unions/aliases stay `type`.
- **Type-only imports on their own line:** `import type { CSSProperties } from "react";`, not inline `type` specifiers.
- **Demo data in a sibling file:** a `.tsx` file exports components only (Fast Refresh). Put demo data and data types in `launch-fan.data.ts` and import them.
- **Object keys sorted alphabetically** (`{ bottom, left, right, top }`). The fixer does this for you.
- **Strict booleans:** compare explicitly (`x !== undefined`, `list.length > 0`, `label !== ""`). No truthiness checks on nullable or non-boolean values.
- **Always braces** on `if`/`else`. **No nested ternaries:** use a lookup object, early returns or a small helper. No `++` (use `+= 1`). Numeric separators: `10_000`.
- Prefer `toSorted()` / `toReversed()` (never mutate with `sort()`), `.at(-1)`, and `for…of` over `forEach`.
- **Keys from data, not array indices:** use a label/id/date. For generated geometry, build objects with an `id` string first (e.g. `` `rung-${bar}-${n}` ``) and key on that.
- **No type assertions** (`as`). If one is genuinely unavoidable, put a `// SAFETY: <the invariant you checked>` comment on the line before. CSS custom properties need no assertion: `style={{ "--i": i }}` typechecks as is.
- Don't annotate constants with anonymous object types (`const x: { a: number }[] = …`). Use a named interface or `satisfies`.
- Event handlers with braces: `onPointerLeave={() => { setHover(null); }}`. Don't return a void call from an arrow.
- Name symbols for their domain role (`petal`, `wedge`, `rung`), not their structure (`shape`, `obj`, `item`).
- **SVG accessibility:** no `role="img"` (the linter wants a real element). Give the `<svg>` an `aria-label` and a `<title>` first child.
- **No inline `fontSize`** in `style`. For chart text use the `t-*` utilities, plus theme size classes such as `text-tick` or `text-small`, in `className`.
- Keep functions under 120 lines: split a chart into small subcomponents (axis, layer, labels) in the same file.

## Styling: Tailwind v4, inline (mandatory)

**No arbitrary values.** The lint's `shadcn(no-arbitrary-values)` rule rejects `text-[11px]`, `tracking-[0.08em]`, `rounded-[10px]` and the like. Use the theme tokens in `src/system/app.css`:

- Type: `text-3xs` 9 · `text-2xs` 10 · `text-caps` 10.5 · `text-tick` 11 · `text-xs` 12 · `text-caption` 12.5 · `text-small` 13.5 · `text-card` 15 · `text-lede` 17 · `text-title` 19 · `text-h3` 26 · `text-kpi` 32 · `text-h1` 34 · `text-stat` 40 · `text-display-sm…2xl`.
- `tracking-mono` / `label` / `caps` / `strip` / `heading` / `display` (plus Tailwind's `tight`, `tighter`, `wide`, `widest`); `leading-display` / `heading` (plus `none`, `tight`, `normal`, `relaxed`).
- `rounded-card` / `panel` / `tip`; `shadow-tip` / `ring` / `ring-ink` / `hollow` / `swatch`.
- Spacing and durations come from Tailwind's open scales: `px-4.5` = 18px, `gap-1.75` = 7px, `duration-160`. Non-integer stroke widths go in the SVG `strokeWidth` attribute. Name transitions specifically (`transition-opacity`, `transition-colors`, `transition`), never `transition-all`.

Tailwind v4 is set up (`src/system/app.css`). **Style with utility classes in `className`; create no CSS files** and add no `<style>` blocks. The palette is exposed as Tailwind colours, so prefer classes to SVG colour attributes:

- Colours: `fill-ink`, `stroke-l3`, `fill-hero`, `stroke-alert`, `fill-paper`, `text-muted`, `bg-panel`, … (paper, panel, ink, text, muted, faint, grid, rule, l0–l6, hero, hero-soft, alert, alert-soft, alert-faded, alert-rule, cat-1–4, heat-1–5). Opacity modifiers work: `fill-ink/40`.
- Fonts: `font-sans`, `font-mono`. Text roles (`t-axis`, `t-label`, `t-name`, `t-value`, `t-value-lg`, `t-note`, `t-annot`, `t-halo`) and line roles (`hairline`, `grid-dotted`) are Tailwind utilities and compose with others: `className="t-value text-[13px] fill-hero"`.
- Motion: `grow-y`, `from-top`, `grow-x`, `from-right`, `pop`, `fade`, `draw`, `sweep` are utilities too.
- Interaction states: Tailwind variants (`hover:`, `group-hover:`, `transition-opacity duration-150`, `data-[active=true]:…`, `group-data-[focus]:…`).
- Use `style` only for **per-datum dynamic values** that can't be a class: CSS custom properties (`style={{ "--i": i }}`), or a colour/opacity computed from data. SVG geometry attributes (`x`, `y`, `d`, `r`, `width`) stay attributes, as they must.

## Component contract

```tsx
// foo.data.ts
export interface FooDatum { label: string; value: number }
export const fooDemo: FooDatum[] = [...];

// foo.tsx
interface FooProps {
  data?: FooDatum[];                 // defaults to the demo
  height?: number;                   // sensible default
  format?: (v: number) => string;
  note?: string;                     // optional unit footnote inside the plot
  highlight?: number | string;       // optional hero element
  // ...whatever else the form genuinely needs
}

export const Foo = (props: FooProps) => (
  <Plot overlay={tip === null ? null : <Tooltip …/>}>{(width) => <svg …/>}</Plot>
);
```

- Charts render **only the plot**. Title, subtitle, form name and source come from `<Card>`, which the gallery wraps around your component using the entry metadata.
- Props should be general enough that a worked-example page can pass its own data, labels and units. Keep them typed and minimal. No `any`.
- Width comes from `Plot` (it measures); choose height from props. Lay out responsively from `width` down to ~340px (mobile), shrinking or dropping labels sensibly rather than overflowing.
- `src/charts/core.tsx` exports components: `Plot`, `Tooltip` (and board helpers). `src/charts/hooks.ts` exports `useSvgId` (safe ids for clipPath/gradients), `useMeasure`, `useReveal`. `src/charts/axes.ts` has small helpers (`crisp` for pixel-snapped 1px lines). `src/lib/random.ts` exports `rnd(i, k)`, `rndSigned`, `mulberry32`. **Never use `Math.random()`**: renders must be identical on every load. `src/lib/format.ts` has number/date formatters (true minus sign `−`).

## Visual system

### Colour: CSS variables only, never hex

Use Tailwind colour classes (`fill-ink`, `stroke-l3`) or, for data-driven values, `var(--…)` strings. The palette switcher (Mono, Porcelain, Palm, Wire) and dark cards remap these names. A chart with a hard-coded hex is a bug.

| Variable | Use |
| --- | --- |
| `--paper` | background (also the halo colour behind text over marks) |
| `--ink` | strongest marks |
| `--text`, `--muted`, `--faint` | text hierarchy |
| `--grid` (dotted grid), `--rule` (solid hairlines/baselines) | structure |
| `--l0` … `--l6` | importance ladder. **Lightness is data**: the most important series is the darkest (brightest on dark cards). Assign by importance, not order. |
| `--hero` | the single highlighted element in a chart (at most one hero per chart) |
| `--alert`, `--alert-soft`, `--alert-faded`, `--alert-rule` | thresholds, regressions, over-budget, incidents |
| `--cat-1` … `--cat-4` | categorical series (≤4) |
| `--heat-1` … `--heat-5` | sequential ramp, low → high |

- Solid, opaque marks. No gradients-as-decoration, no shadows, no glow. Transparency only where it **encodes density** (overlaid events), or for de-emphasis on hover.
- Dark cards: set `dark: true` on the gallery entry. Use them only for forms that need a dark ground (luminous networks, threads, dot cascades). The same CSS variables invert automatically.

### Type: SVG text roles (classes in `src/system/base.css`)

| Class | Font | Use |
| --- | --- | --- |
| `t-axis` | mono 10px, muted, uppercase | axis ticks, scale labels |
| `t-label` | mono 10px 500, uppercase | category names, stage names |
| `t-name` | Inter 11px 500 | mixed-case proper names (products, people) |
| `t-value` | mono 11px 600, ink | numbers inside the chart |
| `t-value-lg` | Inter 800 30px | a big centre number (gauge, donut) |
| `t-note` | mono 9px, faint, uppercase, tracked | in-plot unit footnote ("ONE DOT = ONE DAY") |
| `t-annot` | Inter 11px, muted | callouts, annotations |
| `t-halo` | add to any text over marks | paper-coloured stroke behind glyphs |

Override size with a theme size class (`text-tick`, `text-small`, …), never inline `fontSize`, and nothing below `text-3xs` (9px). Don't set font families directly.

Utility classes: `hairline` (solid 1px rule line), `grid-dotted` (dotted grid line).

### Shape language

- **Lupi Editorial / Basics:** hairlines 0.6–1.4px, record-level marks (one dot = one record, one rung = one unit), generous whitespace, "furniture" that carries no data (ledger lines, dotted guides, rim ticks, a dot every 5th/10th unit, leader lines) to give sparse data texture.
- **Glance:** bold. Strokes 2px and up, chunky bars with **capsule ends** (round the outer end only), big numbers, conclusion first. Pre-aggregated.
- Area encodings use `Math.sqrt(value)` for radius. Never put a raw value on a radius.
- Bars never break the axis.
- Labels: all-caps mono with tracking for categories and axes; numbers in mono. Callout leader lines are hairlines in `--faint`.
- Every chart should carry a unit footnote (`t-note`) or make the unit obvious through the gallery subtitle.

### Motion (`src/system/base.css`)

`Plot` toggles `.is-hidden` → `.is-shown` when it scrolls into view; the Card's Replay button remounts it. Animate with these classes and stagger with `style={{ "--i": index }}`, optionally overriding `"--stagger": "12ms"`:

- `grow-y` (add `from-top` for downward bars), `grow-x` (`from-right`): bars and rungs
- `pop`: dots scale in. `fade`: labels and annotations.
- `draw`: stroke drawn along a path. Set `pathLength={1}` on the path.
- `sweep`: on a rect inside a clipPath, wipes the plot left to right.

Dots stagger 8–15ms each, bars 80–130ms each. Fast in, soft landing, no bounce (except a wave entry where called for). Reduced motion is already handled by these classes. For continuous or state-driven animation (bar race, streaming, morphs, force layouts), use `requestAnimationFrame` or React state with CSS transitions, start it only when `.is-shown` applies (read `useReveal`), and fall back to the final state under `prefers-reduced-motion`.

### Interaction

- Interaction only where marks are real records. Never put hover on decorative texture.
- Default hover: hovered item stays, others dim to ~0.25–0.35 opacity (`transition: opacity 160ms`), plus a `<Tooltip>` with the record's values (`<b>Label</b> · value`).
- Interactive networks/flows (B family): hover a node or thread to trace its connections; click to pin; Escape or click empty space to release.
- Give the `<svg>` a meaningful `aria-label` and a `<title>` first child (no `role="img"`).

## Checking your work

The dev server is already running at http://localhost:5199 (do not start another).

- One chart: `http://localhost:5199/#/chart/<ID>` (e.g. `#/chart/L13`). Your family: `#/gallery/<family>`.
- Screenshot: `scripts/shot.sh <your-session-name> chart/L13 /tmp/<you>/L13.png [width] [height] [wait-ms]`. Use a unique session name (your agent name). **Don't use `--full` screenshots**; they restart animations.
- Compare against the matching reference image in `reference/lieflat/` (mapping below) by reading both images. Iterate until the form, proportions, texture and typography read as the same chart in our system. Our type is Inter + Spline Sans Mono rather than all-Inter; that difference is intentional.
- Check at least one non-Mono palette: in the browser, `agent-browser --session <you> eval 'document.documentElement.dataset.palette="palm"'`, then screenshot. If the gallery entry is dark, check that too.
- Typecheck: `pnpm exec tsc -p . 2>&1 | grep 'src/charts/<family>/'` must be empty. Other agents are editing other folders at the same time, so ignore errors outside yours.
- Check the browser console for errors: `agent-browser --session <you> errors`.

## Reference images (`reference/lieflat/`)

Gallery screenshots, one card each. `XX-NN.png` where NN is the 0-based position in that gallery:

**Lupi (L):** L-00 L1 Launch Fan · L-01 L2 Dot Cascade (dark) · L-02 L3 Barcode Lollipop (full width) · L-03 L4 Arc Matrix · L-04 L5 Radial Convergence · L-05 L6 Cluster Field (full) · L-06 L7 Brand Spectrum · L-07 L8 Dotty Matrix · L-08 L9 Bubble Almanac (full) · L-09 L10 Radial Patchwork · L-10 L11 Trend Lineage · L-11 L12 Type Colonnade · L-12 L13 Hourglass Stream · L-13 L14 Hundred Field · L-14 L15 Ballot Tally · L-15 L16 Matrix Heat · L-16 L17 Calendar Heat (full) · L-17 L19 Ridgeline · L-18 L20 Parallel Coordinates. (There is no L18.)

**Basics (F):** F-00 F1 Rung Bars (done) · F-01 F2 Hairline Line · F-02 F3 Hairline Area · F-03 F4 Tick Donut · F-04 F5 Tick Rows · F-05 F6 Paired Rungs · F-06 F7 Stacked Rungs · F-07 F8 Plumb Scatter · F-08 F9 Rung Waterfall · F-09 F10 Dot Heat · F-10 F11 Tick Gauge · F-11 F12 Dumbbell Queue · F-12 F13 Nested Treemap · F-13 F14 Rung Histogram · F-14 F15 Tick Box · F-15 F16 Stream Ribbon (full) · F-16 F17 Candlestick.

**Glance (G):** G-00 G3 Chunky Bars · G-01 G4 Dot Waffle · G-02 G5 Pictorial Bar · G-03 G6 Circular Graph (dark) · G-04 G7 Tree LR · G-05 G8 Rainfall Dual Area · G-06 G9 Scatter Morph (cycles three views) · G-07 G10 Diverging Bar · G-08 G11 Force Graph small (dark) · G-09 G12 Stagger Wave · G-10 G13 Big Slice · G-11 G14 Single Axis · G-12 G15 Jitter Strip · G-13 G16 Bar Race (animated) · G-14 G17 Dynamic Stream (live) · G-15 G18 Draw-in + Counter · G-16 G19 Violin · G-17 G20 Matrix Heat Glance · G-18 G21 Rank Strip · G-19 G22 Aggregate Sankey.

**Interactive (B), full-width:** B-big-circular.png B1 Circular Graph (60 nodes) · B-big-force.png B2 Force Galaxy (~180 nodes, drag) · B-big-threads.png B3 Thread Triptych (source → processor → destination paths).

**Maps (M):** M-00 M1 US Choropleth · M-01 M2 World Choropleth. Use `us-atlas` / `world-atlas` TopoJSON with `topojson-client` and `d3-geo`, all offline.

**Palettes:** `P-*.png` show the same charts in Porcelain, Palm and Wire.

Some screenshots are animated forms caught at one moment; the catalogue notes say what moves.

### What each form is (data shape → encoding)

- **L1 Launch Fan**: entities with a launch time and current size. One spoke per entity fanned around an arc; a big dot at the launch week (sqrt-sized by current size), small dots for every week since.
- **L2 Dot Cascade**: ranked counts as stacked unit dots (one dot = N), ascending staircase, value on top, vertical category labels.
- **L3 Barcode Lollipop**: ~90 daily readings. A vertical hairline for every day (the barcode), a lollipop dot at each day's value; hollow = weekend; top-3 labelled.
- **L4 Arc Matrix**: category × category + magnitude. Rows bow like a horizon (slight arc); bubble = sqrt-size; column labels rotated.
- **L5 Radial Convergence**: many items, each belonging to one of a few themes. Items on a rim, lines bundle inward to theme hubs.
- **L6 Cluster Field**: a core-plus-satellites network as a poster. Big core cluster with radial spokes, satellite islands, faint dotted cross paths. Not interactive (decorative spokes).
- **L7 Brand Spectrum**: bipolar scales (both ends valid). Rows of left ↔ right axes, us vs competitors marked along each.
- **L8 Dotty Matrix**: groups × grid × amount, isometric stacked dot grids.
- **L9 Bubble Almanac**: category × year + amount + status over a long span, hand-drawn-feel blobs, margin notes.
- **L10 Radial Patchwork**: events overlaid on a 24h dial. Wedge angle = time of day, radius = size, translucent so density builds ink; outlined wedges = incidents.
- **L11 Trend Lineage**: event life histories. Columns per feature: shipped (filled), reworked (hollow), dormant (dashed), alive-today line to the floor.
- **L12 Type Colonnade**: many-to-one ownership. Long list of names on the left, hairline curves to a few owner nodes on the right, sized by count.
- **L13 Hourglass Stream**: funnel. Each stage is a barcode strip whose width = people; threads trickle down; "% get through" on the left; stage + count on the right.
- **L14 Hundred Field**: 100% composition as 100 units (one dot = one person in a hundred).
- **L15 Ballot Tally**: multi-select percentages as tick tallies (one tick = one respondent), each row independent 0–100.
- **L16 Matrix Heat**: two discrete dimensions × value, ≤100 cells, key cells marked.
- **L17 Calendar Heat**: full year, 52 weeks × 7 days.
- **L19 Ridgeline**: 3–8 density shapes stacked with overlap.
- **L20 Parallel Coordinates**: entities across 3–6 continuous axes, one line each.
- **F2 Hairline Line**: ≤30 daily points, dot per day, hollow = weekend, barcode tick floor, peak and last labelled.
- **F3 Hairline Area**: one vertical hairline per day from floor to value; area made of days; peak labelled.
- **F4 Tick Donut**: 100 radial ticks (one = 1%), segments shaded by source, big total in the centre, labels outside.
- **F5 Tick Rows**: horizontal rows of countable ticks with a value at the end.
- **F6 Paired Rungs**: two rung bars per category (this year vs last).
- **F7 Stacked Rungs**: rungs stacked in ≤3 tones per category.
- **F8 Plumb Scatter**: ≤20 points each with a plumb line to the floor, labelled.
- **F9 Rung Waterfall**: gross → net steps as floating rung blocks.
- **F10 Dot Heat**: weekday × hour dots sized/toned by volume.
- **F11 Tick Gauge**: single progress value as a tick arc with a big number.
- **F12 Dumbbell Queue**: before/after per category, beads between as real units.
- **F13 Nested Treemap**: two-level hierarchy, area = value (use d3-hierarchy treemap; parents as title bands).
- **F14 Rung Histogram**: binned counts as rung bars with meaningful bins.
- **F15 Tick Box**: five-number summary + outliers per group, drawn with ticks.
- **F16 Stream Ribbon**: 2–5 series composition over continuous time, total visible.
- **F17 Candlestick**: OHLC; hollow = up, solid = down.
- **G3 Chunky Bars**: few categories, fat capsule bars, big value labels.
- **G4 Dot Waffle**: 10×10 waffle of dots for composition.
- **G5 Pictorial Bar**: rows of repeated icons (one icon = fixed amount; draw the icon as an SVG path), partial last icon clipped, value label.
- **G6 Circular Graph**: ≤12 nodes on a circle, curved links, sized nodes (dark card).
- **G7 Tree LR**: 2–3 level hierarchy, left-to-right smooth links.
- **G8 Rainfall Dual Area**: input bars hanging from the top (spend) vs output area rising below (sign-ups).
- **G9 Scatter Morph**: same entity set cycling through three views (scatter → bars → grid…) with smooth transitions.
- **G10 Diverging Bar**: signed values around zero, capsule ends, gains ink and losses alert or lighter.
- **G11 Force Graph small**: hub plus satellites, draggable (d3-force), dark card.
- **G12 Stagger Wave**: 30–60 bars entering in a wave.
- **G13 Big Slice**: pie where angle = share and radius = intensity.
- **G14 Single Axis**: day rows × hour axis, circles sized by volume (punch card).
- **G15 Jitter Strip**: hundreds of records per group jittered along a value axis.
- **G16 Bar Race**: ranking over time, bars re-sort as values animate; period label.
- **G17 Dynamic Stream**: live-scrolling series with new points arriving.
- **G18 Draw-in + Counter**: one cumulative line drawn in with a big counting number.
- **G19 Violin**: grouped density outlines plus a median.
- **G20 Matrix Heat Glance**: ≤60 cells, each with its number printed.
- **G21 Rank Strip**: rank per entity per period as a grid of positions, the hero entity's path highlighted.
- **G22 Aggregate Sankey**: two-sided aggregate flows (channels → plans), band width = amount.
- **B1 Circular Graph (big)**: 60 nodes on a ring, chords inside, hover focuses neighbours, click replays.
- **B2 Force Galaxy**: ~180 nodes, force layout, drag with spring-back, hover focus, zoom optional.
- **B3 Thread Triptych**: 3 columns (source → processor → destination), one thread per path (100+), hover a thread or label to trace its bundle, click to pin, status line underneath.

## Final report (what to tell the parent)

List each chart you built (ID, component name, file) and confirm you compared it to its reference. Note any deviations and why, any shared change you'd like (in core/system), and anything you couldn't finish.
