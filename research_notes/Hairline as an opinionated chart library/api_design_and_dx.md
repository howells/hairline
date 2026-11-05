# API design and developer experience for modern React charting libraries (as of 2026), and what Hairline needs

Scope note: about 15 tool calls. Several fetches failed (tanstack.com blocked, observablehq.com returned 429), so some claims rest on search snippets and are marked. Hairline facts come from reading /Users/danielhowells/Sites/charts (README.md, src/index.ts, src/kit.ts, src/charts/axes.ts). Code blocks under "Inferences" are proposals, not findings.

## 1. Component-per-chart vs composable primitives vs grammar of graphics vs copy-paste

### Takeaway

The libraries people actually adopt in 2026 either (a) are composition-first with a thin styling layer on top (Recharts 3 plus shadcn), or (b) are a small grammar with defaults so strong that a one-liner works (Observable Plot). Hairline is currently a pure high-level layer (about 90 bespoke components) with a kit exposed separately; the gap is that the two layers do not share a contract, so users cannot start high-level and drop down.

### Cited Findings

- shadcn/ui charts explicitly refuse to wrap Recharts: "We do not wrap Recharts. This means you're not locked into an abstraction." Users write Recharts primitives (BarChart, Bar) themselves; shadcn adds only ChartContainer, ChartTooltip, ChartLegend and a config. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- shadcn's shared contract is a `ChartConfig` keyed by series, kept separate from the data: each key has `label`, optional `icon`, and either `color` or `theme: { light, dark }`. Each key becomes a CSS variable `var(--color-KEY)` usable in components, in data rows, and in Tailwind classes. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- Recharts 3 made composition sturdier: custom wrapper components that return `<XAxis/>`/`<YAxis/>` now work as children of `<BarChart>` (failed in 2.x); `CategoricalChartState` was removed in favour of hooks; `<Customized />` no longer receives internal state ("Please use hooks instead"). — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- The Recharts hooks list includes useActiveTooltipDataPoints, useActiveTooltipLabel, useMargin, useOffset, usePlotArea, useChartWidth/Height, useXAxisDomain, useCartesianScale (from a search summary of the API docs, not directly verified on the docs page). — [search result summary, Recharts migration/API](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Recharts 3.0-3.3 stack elements (Tooltip, Legend, chart items) by render order, so child order is semantically load-bearing; v3.4 adds a zIndex system. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Observable Plot's core is marks that share scales; marks can be nested arrays, or a function returning an SVG element; composite marks (axis, box) are built from public pieces. Issue #170 set the goal that all built-in marks are "unprivileged", relying only on public APIs. — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks); [Plot issue #170](https://github.com/observablehq/plot/issues/170)
- Plot options are interpreted by value: option values that are the same for all shapes are "constants", those that vary are "channels"; a string that is not a valid CSS color is treated as a column name. Transforms (`groupY`, stacking, binning) are composed by passing options from one to the next. Example: `Plot.barX(penguins, Plot.groupY({x: "count"}, {y: "species"}))`. — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks)
- Plot positions itself as optimising "for conciseness and memorability", a layered grammar of graphics. — [Why Plot](https://observablehq.com/plot/why-plot)
- visx is "low-level visualization primitives for React": d3 does the math, React owns the DOM, no built-in animation, modular packages (`@visx/shape`, `@visx/scale`, `@visx/group`), and it is "largely unopinionated" and intended as a base for teams to build their own chart library hiding d3. — [visx README/docs](https://github.com/airbnb/visx); [airbnb.tech visx](https://airbnb.tech/opensource/visx/)
- Tremor (acquired by Vercel, announced 22 Jan 2025) went free and open source, split into the older npm package `@tremor/react` and "Tremor Raw", a copy-paste version built on Tailwind, Radix and Recharts. — [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor); [tremorlabs/tremor](https://github.com/tremorlabs/tremor)
- Nivo is described as config-heavy ("fights React habits"); ECharts' React wrapper exposes everything through a single `option` object that sits awkwardly in React. — [Querio/LogRocket-style roundups via search](https://blog.logrocket.com/best-react-chart-libraries-2026/) (secondary sources, low rigor)
- Hairline today: `src/index.ts` is a generated flat list of ~90 `export { X } from "./charts/<group>/<kebab>"` lines; `src/kit.ts` exports `Chart, Plot, Tooltip, SplitClips`, hooks (`useMeasure`, `useReveal`, `useHover`, `useScrub`, ...), rules (`HRule, VRule, Stem, Tick, HGrid, VGrid, Cursor`), marks (`Dot, Ring, Bar`), textures, and `ChartSvg, Label, XLabels`. Two exports are named `CircularGraph` and `CircularBeadGraph` (an alias to disambiguate two different charts). — repo files `/Users/danielhowells/Sites/hairline/src/index.ts`, `/Users/danielhowells/Sites/hairline/src/kit.ts`

### Inferences

- Hairline's real peers for DX are shadcn charts (copy-paste, themeable, tokens) and Plot (concise, opinionated), not Recharts-the-toolkit. Its distinctive value (a finished look per chart) argues for keeping component-per-chart as the primary layer, which is the right call for an editorial library where the chart type is the design.
- What incumbents get right that Hairline lacks is a _documented seam_: Plot's built-in marks use only public API; Recharts 3 exposes the same hooks to users that its internals use. Hairline's kit is exported but nothing says the 90 charts are built from only the kit (check this; if some use private modules, make them go through the kit). A chart should be demonstrably re-creatable from `@howells/hairline/kit`.
- Proposed two-layer shape with one shared contract:
  ```tsx
  // High level: one component, strong defaults
  <PairedRungs data={rows} x="region" y={["before", "after"]} format={fmt.percent} />

  // Low level: same scales, same tokens, same prop names for shared concerns
  <Chart data={rows} x="region" y="after" height={240}>
    {(c) => (<>
      <HGrid {...c} />
      {c.rows.map((r) => <Dot key={r.key} cx={c.x(r)} cy={c.y(r)} tone="hero" />)}
    </>)}
  </Chart>
  ```
  The point is that `Chart` supplies resolved scales/size via render prop or hook (as Recharts 3 does with hooks) so kit parts need no manual margin/scale plumbing.
- Avoid a full grammar of graphics. 90 bespoke, art-directed charts are the opposite of a grammar; adopting only Plot's _value-interpretation_ convention (string = field name, function = accessor) is the cheap, high-value borrow.
- Naming: the `CircularGraph`/`CircularBeadGraph` collision shows that flat bespoke names do not scale; consider group sub-path exports (`/basics`, `/glance`, `/maps`) in addition to the flat index (tree-shaking and discoverability).

### Gaps

- Could not fetch the TanStack Charts guide (blocked), which a search surfaced as a 2026 Recharts alternative with `initialWidth` for SSR; its API design is therefore not assessed.
- Plot marks page fetch hit HTTP 429; Plot claims rely on search-tool summaries of the docs.
- Did not verify whether Hairline's charts import anything outside the kit.
- No primary sources reviewed for Unovis or AG Charts API design.

## 2. Data input conventions (accessors, tidy data, generics, dates, missing data)

### Takeaway

Best practice is tidy row arrays plus field selectors that accept either a key or a function, with the row type inferred as a generic. Hairline's "bespoke data per chart" is the biggest DX liability; the fix is a small number of shared row shapes and accessor props, not 90 unique shapes.

### Cited Findings

- Plot: a string option that is not a CSS colour is read as a column name; functions and arrays are also accepted, so one option accepts a field, an accessor, or a constant. — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks)
- Plot transforms derive data inside the spec (`groupY({x:"count"}, {y:"species"})`), so users rarely pre-shape data, and they work with faceting automatically. — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks)
- Recharts uses `dataKey` string props per series (shadcn's `<Bar dataKey="desktop" fill="var(--color-desktop)"/>`), with colour carried in config keyed by the same names. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- Recharts 3 changed missing-data semantics: with `connectNulls`, null points on Area are treated as 0 (a behavioural trap). — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Recharts 3 also: ErrorBar nullish values ignored for Y domain; new `symlog` scale; YAxis `width="auto"`. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Hairline's documented usage: `<PairedRungs data={rows} format={(v) => \`${v}%\`} periods={["Before","After"]} />`; the README states data is bespoke per chart (task brief) and prop types are not exported ("use `ComponentProps<typeof PairedRungs>`"). — `/Users/danielhowells/Sites/hairline/README.md`

### Inferences

- Proposed accessor convention (Plot-style, typed):
  ```ts
  type Accessor<T, V> = (keyof T & string) | ((d: T, i: number) => V);
  interface XYProps<T> {
    data: readonly T[];
    x: Accessor<T, number | Date | string>;
    y: Accessor<T, number | null | undefined>; // null/undefined = gap
    series?: Accessor<T, string>; // tidy/long form -> one line per value
  }
  export function HairlineLine<T>(props: XYProps<T> & CommonProps): JSX.Element;
  ```
  Charts whose natural input is not rows (flows for Sankey, hierarchy for treemap, matrices) keep their own shape, but each should be a named exported interface (`SankeyData`, `Hierarchy<T>`) with a JSDoc example.
- Missing data should be an explicit, documented, uniform rule across all charts: null/undefined/NaN break the line (gap), never coerce to 0; a `missing?: "gap" | "connect" | "zero"` prop only where it makes sense. Recharts' null-as-0 under `connectNulls` is the anti-example.
- Time: accept `Date | number | ISO string` at the boundary, normalise once, and take a `timeFormat`/`format` prop; do not make users convert. Pitfall to document: ISO strings parsed as UTC vs local shifting day labels.
- Hairline's engraved aesthetic (one ink hero, pixel snapping) means a dev-facing `emphasis` prop is a better first-class concept than a colour array; see section 4.

### Gaps

- Did not find primary-source guidance on date/time-scale handling for Recharts, Nivo, visx beyond Plot snippets; time-axis behaviour is not compared.
- No evidence gathered on how Tremor's `index`/`categories` props type their rows.

## 3. TypeScript: exported prop types, generics, discriminated unions, autocomplete

### Takeaway

Exporting named prop types is table stakes; the incumbents' DX is a `satisfies`-friendly config type plus generics over the row. Hairline's "types not exported by name" is a concrete, cheap-to-fix gap that also hurts AI tooling.

### Cited Findings

- shadcn recommends `const chartConfig = {...} satisfies ChartConfig`, with `type ChartConfig` exported from the component file. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- Recharts 3 raised minimum TypeScript to 5.x, retyped tooltip custom content (`TooltipProps` to `TooltipContentProps`), widened `label` to `undefined | string | number`, and removed unused `ref`s from types "to prevent confusion". — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- A real-world cost of untyped/internal-prop coupling: copying shadcn's old chart.tsx onto Recharts v3 threw errors because it referred "heavily to internal props of Recharts, which have now been removed". — [shadcn-ui/ui #7669](https://github.com/shadcn-ui/ui/issues/7669)
- Plot issue #2453: the Mark `initialize` method is missing from the TypeScript types and docs, i.e. even a mature grammar library has extension points that the types do not describe. — [Plot issue #2453](https://github.com/observablehq/plot/issues/2453)
- Roundup sources only rate TS support as "has types"/"solid"; none discussed generics. — [LogRocket 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- Hairline: prop types not exported by name; the README directs users to `ComponentProps<typeof PairedRungs>`; `src/kit.ts` exports some types (`Margin`, `TickMark`, `LegendItem`, `FillTone`, `FillFamily`, `Voice`, `RuleKind`, `Sync`, `HoverAt`, `Hover`, `DotSize`, `RingWeight`, `TickSize`, `StaggerTier`) but the main index exports none. — `/Users/danielhowells/Sites/hairline/README.md`, `/Users/danielhowells/Sites/hairline/src/kit.ts`

### Inferences

- Minimum bar: for each chart export `PairedRungsProps` (generated by the same `scripts/library-index.ts` that builds index.ts, so it cannot drift), plus shared `ChartProps`, `Format`, `Tone`, `Annotation`.
- Use discriminated unions only where a prop truly changes the required siblings:
  ```ts
  type Emphasis =
    | { emphasis?: undefined }
    | { emphasis: "last" | "max" | "min" }
    | { emphasis: (d: T, i: number) => boolean };
  type Labelled =
    | { labels?: "none" | "ends" | "all" }
    | { labels: "custom"; renderLabel: (d: T) => ReactNode };
  ```
  Keep unions shallow; deep ones produce unreadable errors and poor autocomplete.
- Make `format` a named type (`type Format = (v: number) => string | Intl.NumberFormatOptions-like spec`) so the RSC serialisation problem (section 7) has one fix point.
- Generic row inference needs the accessor-as-`keyof T` pattern in section 2 so autocomplete lists real field names; this is the main autocomplete win over Recharts' stringly-typed `dataKey`.

### Gaps

- No primary evidence on how visx, Nivo, Unovis or AG Charts type generics; not assessed.
- Did not check Hairline's actual type-emission settings in build:lib (are `.d.ts` files emitted and do they resolve through `exports`?).

## 4. Consistency of props across charts (shared contracts)

### Takeaway

Incumbent contracts are thin: a config/series map for colour and labels, a tooltip content slot, and axis props. Hairline has the opportunity to be more consistent than any of them because it controls all 90 charts, but it needs the contract written down and typed once.

### Cited Findings

- shadcn's tooltip/legend contract: `ChartTooltipContent` takes `labelKey`, `nameKey`, `indicator` (`dot|line|dashed`), `hideLabel`, `hideIndicator`; `ChartLegendContent` takes `nameKey`; colours come from the config automatically. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- shadcn requires a height/min-h/aspect on the container so responsive measurement works on first render, else the plot is 0px tall. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- Recharts 3: `accessibilityLayer` defaults to true (aria labels, roles, keyboard arrow navigation); Tooltip gained `portal` and `axisId`; Legend gained `itemSorter`. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide); [Recharts accessibility wiki](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility)
- Recharts ships `ResponsiveContainer`; v2.7.0 added `initialDimension`. — [recharts PR #3596](https://github.com/recharts/recharts/pull/3596)
- Hairline already has shared plumbing in the kit: `useMeasure`, `useReveal`, `useMotionPreference`, `useReducedMotion`, `useHover`, `useScrub`, `Tooltip`, `LegendItem`, tone/fill ladders (`FillTone`, `toneClass`), and "every chart in the same frame". — `/Users/danielhowells/Sites/hairline/src/kit.ts`, `/Users/danielhowells/Sites/hairline/README.md`

### Inferences

- Proposed `CommonChartProps` every chart extends (names chosen to match what people already guess):
  ```ts
  interface CommonChartProps {
    format?: Format; // value formatter
    emphasis?: Emphasis<T>; // which mark is the "ink hero" (Hairline's differentiator)
    tone?: Tone; // 'hero' | 'l0'..'l6' token, not raw colour
    labels?: "none" | "ends" | "all";
    legend?: boolean | LegendPosition;
    annotations?: Annotation[]; // see section 8
    tooltip?: boolean | ((d: T) => ReactNode);
    onSelect?: (d: T, i: number) => void; // click/keyboard activation
    onHover?: (d: T | null) => void;
    height?: number | { aspect: number }; // never 0px: default aspect baked in
    animate?: boolean | "reveal"; // false = static; auto-off for reduced motion
    title?: string;
    description?: string; // accessible name, not visible prose
    className?: string;
    style?: CSSProperties;
  }
  ```
  Note the user's memory file says no visible titles/prose in the chart grid, so `title`/`description` should feed `<title>/<desc>/aria-label` only.
- Fix the 0px-height trap by giving every chart an intrinsic aspect ratio default (shadcn and Recharts both push this footgun onto the user).
- Make accessibility on by default as Recharts 3 did: focusable marks, arrow-key traversal, `role="img"` with a generated summary. Engraved/hatched textures also need a non-colour encoding story; they are an accessibility asset worth advertising.
- A conformance test (one Vitest/Playwright suite iterating the 90 charts and asserting the common props work) is the practical way to keep the contract true.

### Gaps

- Did not review Nivo/Unovis/AG Charts prop contracts directly.
- No data on how widely `onClick`-style events are typed across libraries.

## 5. Theming: CSS variables, tokens, dark mode, Tailwind as asset or liability

### Takeaway

CSS variables are the consensus (shadcn, Hairline already). The liability is requiring Tailwind v4 in the host; the incumbents who do copy-paste accept it because their users already have it, but a distributable package should compile its own CSS and use Tailwind only as optional sugar.

### Cited Findings

- shadcn on Tailwind v4: chart tokens moved from `hsl(var(--chart-1))` to `var(--chart-1)`; dark colours via `theme: { light, dark }` in config or `.dark` token overrides. — [shadcn Tailwind v4 notes via Chart docs](https://ui.shadcn.com/docs/components/base/chart); [Tailwind v4 - shadcn/ui](https://ui.shadcn.com/docs/tailwind-v4)
- Tremor Raw requires Tailwind v4+, Radix, Recharts (third-party skill page, not official docs); official Tremor Next.js guide says to upgrade to Tailwind v4, while Vite/Remix guides were still on v3 when indexed, so the docs disagreed. — [Tremor docs, Next.js](https://tremor.so/docs/getting-started/installation/next); [Tremor docs, Vite](https://tremor.so/docs/getting-started/installation/vite)
- Tremor shares copy-paste utilities (`cx`, `focusRing`, `chartUtils.ts` with `chartColors`) tagged "Tremor Raw [vX.X.X]". — [Tremor docs, Next.js](https://tremor.so/docs/getting-started/installation/next)
- Hairline: the host must import `tailwindcss`, then `@howells/hairline/tokens.css` and `theme.css`, then override `--paper`, `--hero`; `.surface-dark` and `[data-palette]` remap; three modes (Pink default, Paper, Dark); text roles `t-axis`, `t-label`, `t-value`, `t-figure`; font from host `--font-sans`; label widths measured for Inter. — `/Users/danielhowells/Sites/hairline/README.md`

### Inferences

- Tailwind is a liability for Hairline in three ways: (1) a hard peer requirement shrinks the audience to Tailwind v4 projects (excludes CSS-modules, Panda, vanilla-extract, Tailwind v3 shops, many design-system teams); (2) the build order in the README (`@import "tailwindcss"` then the two CSS files) is a failure-prone setup step; (3) utility class names baked into components (`t-axis`, `shape-crisp`, `fill-(--x)`) must be generated in the host's Tailwind build, which only works if the host scans the package.
- Recommended: ship a precompiled `hairline.css` (all tokens, `@layer hairline`, namespaced custom properties like `--hl-paper`, `--hl-hero`, `--hl-ink-0..6`) that works with no Tailwind, keep `tokens.css`/`theme.css` as the editable layer, and offer a Tailwind v4 `@theme` snippet as an optional integration. Namespacing the custom properties avoids collisions with shadcn's `--background`/`--chart-1`.
- Offer a documented bridge so shadcn users can map their tokens: `--hl-hero: var(--chart-1)`.
- Dark mode: support three triggers, `.dark`, `[data-theme]`, and `prefers-color-scheme`, with the container-scoped `.surface-dark` kept as the unique feature (a dark card on a light page).
- Fonts: label widths "measured for Inter" is a layout-correctness constraint; ship a font-metrics fallback or measure at runtime with the actual font (`document.fonts.ready`) so other faces do not crowd.

### Gaps

- Could not confirm whether the official Tremor repo now supports Tailwind v4 across all frameworks (docs disagreed); no release-note source found.
- No evidence gathered on how Nivo/ECharts/AG Charts theme (JS theme objects are the known contrast, unverified here).

## 6. RSC and SSR

### Takeaway

SVG-based libraries can render server HTML, but everything stays behind "use client", responsive width is the main hydration hazard, and function props cannot cross the server/client boundary. Hairline's current stance (client components, measure in browser, assume reduced motion on first render) is reasonable; the missing pieces are static size support, serialisable formatters, and a documented RSC recipe.

### Cited Findings

- In the Next.js App Router, "use client" does not make a chart browser-only: the HTML is still generated on the server; a ResponsiveContainer chart may render without its size initially then appear after hydration. — [DZone: SSR/CSR data viz in Next.js](https://dzone.com/articles/mastering-ssr-and-csr-in-nextjs); [noqta.tn Recharts + Next.js](https://noqta.tn/en/tutorials/recharts-nextjs-interactive-charts-dashboard-2026)
- One 2026 tutorial claims Recharts will not render during SSR; the other sources and LogRocket say SVG charts do render server HTML, so the claim conflicts. — [noqta.tn](https://noqta.tn/en/tutorials/recharts-nextjs-interactive-charts-dashboard-2026) vs [LogRocket 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- `ResponsiveContainer` got `initialDimension={{ width, height }}` in v2.7.0 for a server/first-paint size. — [recharts PR #3596](https://github.com/recharts/recharts/pull/3596)
- The Recharts 3.0 migration guide does not cover SSR. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- A common workaround is `next/dynamic(() => import('./Chart'), { ssr: false })`, which skips server rendering entirely (and gives up static HTML). — [ApexCharts issue #3703](https://github.com/apexcharts/apexcharts.js/issues/3703)
- LogRocket (2026) recommends Recharts, MUI X Charts, Victory or static visx for App Router SSR because SVG libraries have the strongest SSR story; Nivo does server rendering for some chart variants but in App Router should be wrapped in Client Components. — [LogRocket 2026](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- TanStack Charts' migration guide (as reported in a search snippet) maps ResponsiveContainer to `height`/`aspectRatio` plus `initialWidth` for SSR. — [TanStack Charts: Coming from Recharts](https://tanstack.com/charts/latest/docs/guides/coming-from-recharts) (page could not be fetched; snippet only)
- shadcn requires a size class on ChartContainer so ResponsiveContainer can measure on first render. — [shadcn/ui Chart](https://ui.shadcn.com/docs/components/base/chart)
- Hairline today: every module is "use client"; charts measure width in the browser; the first render assumes reduced motion so server and client agree; README tells users to wrap charts that take a formatter function in their own client component because functions cannot cross the boundary. — `/Users/danielhowells/Sites/hairline/README.md`

### Inferences

- The "formatter is a function" problem is the most Hairline-specific DX defect: a server component cannot write `<PairedRungs format={(v)=>`${v}%`} />`. Fix with serialisable format specs, with function still allowed from client code:
  ```tsx
  // Server component, no wrapper needed
  <PairedRungs data={rows} format={{ style: "percent", maximumFractionDigits: 0 }} periods={["Before","After"]} />
  // or a registry of named formatters
  <PairedRungs data={rows} format="percent" />
  ```
  `type Format = FormatName | Intl.NumberFormatOptions & { locale?: string } | ((v:number)=>string)`; the chart calls `Intl.NumberFormat` internally. The same applies to any `renderLabel`/`tooltip` function prop (document that slots are client-only, or accept `ReactNode` children, which can cross the boundary).
- Static server SVG at a known size: accept `width` (number) so the chart is fully server-rendered at that width with no layout shift; without `width`, render a viewBox-scaled SVG (`width:100%`, `aspect-ratio`) so first paint is correct without JS and `useMeasure` only refines text sizing. A viewBox-based approach avoids the ResponsiveContainer first-paint problem that Recharts/shadcn push onto users.
- Because pixel-snapped hairlines (`crisp()`) depend on real pixel width, the static SVG should be sharp only after measurement; consider snapping at hydration and accepting sub-pixel rendering on the server HTML (verify visually).
- Split each chart into a pure `render(props, size) -> SVG` core (no hooks, importable from a server component, enabling true zero-JS charts for static pages and email/OG images) and a thin `"use client"` interactive wrapper. This is the real RSC-first design; "every module is use client" ships JS for charts that never need it.
- Hydration safety rules to document: no `Math.random`/`Date.now` ids (Hairline has `useSvgId`, good), no `window` reads in render, reduced-motion assumed on first render (already done).

### Gaps

- No primary source found on Next.js 15/16-specific RSC behaviour for chart libraries beyond secondary articles; Nivo/Unovis/AG Charts server rendering claims are from roundups only.
- Did not find visx-specific SSR documentation (LogRocket only).
- Not verified: whether `initialDimension` still exists unchanged in Recharts 3.
- ECharts has its own server-side SVG renderer; flagged by the search tool but not verified with a source.

## 7. Escape hatches: custom marks, render props, slots, annotations

### Takeaway

Incumbents solve this with hooks (Recharts 3), unprivileged built-in marks and function-valued marks (Plot), and slot components (shadcn tooltips/legends). Hairline's kit is the right raw material but needs a context so custom children get scales for free.

### Cited Findings

- Recharts 3: custom components can wrap chart children; hooks give scale/offset/plot-area/active-tooltip access; `Customized` is now optional; a wrapped `Label` needs `displayName = 'Label'`. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- Recharts 3 tooltip `content` is typed with `TooltipContentProps`; shadcn passes a component instance `content={<ChartTooltipContent />}`, with a v3 workaround `content={(props) => <ChartTooltipContent {...props} />}`. — [Recharts 3.0 migration guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide); [shadcn-ui/ui #7669](https://github.com/shadcn-ui/ui/issues/7669)
- Plot: marks may be functions returning SVG elements, and composite marks are ordinary user code (axis/box are built that way). — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks)
- Plot has `Plot.column`/`Plot.transform` for custom derived channels and transforms. — [Observable Plot marks (via search summary)](https://observablehq.com/plot/features/marks)
- visx intentionally leaves composition and animation to React and the user. — [visx](https://airbnb.tech/opensource/visx/)

### Inferences

- Proposed escape-hatch ladder for Hairline, from cheapest to most powerful:
  1. Props (`emphasis`, `tone`, `labels`).
  2. `annotations` data array: `{ at: x|[x,y], text?, kind: "note"|"band"|"rule"|"arrow" }`, serialisable, so it works from server components.
  3. Slots as `ReactNode` or render props for tooltip and legend (client-only if function).
  4. `children` rendered inside the plot's coordinate system: `<HairlineLine data x y><Rule y={0} /><Note at={...}/></HairlineLine>`, with `useChartScales()` exposing `{ x, y, width, height, margin, data }` (the Recharts 3 hooks idea).
  5. Full drop to `@howells/hairline/kit` for a new chart.
- Document, per chart, which layers are available. A "Customizing" page plus one worked "build a chart from the kit" tutorial is the single highest-value doc.

### Gaps

- No direct reading of how Nivo layers (`layers` prop) or Unovis components implement custom layers; not covered.
- Did not read how Hairline's `Plot`/`Chart` kit components currently pass geometry (only `src/kit.ts` export names read).

## 8. Distribution: npm vs shadcn-style registry vs both

### Takeaway

By 2026 the shadcn registry is cheap to publish, supports namespaces and (since June 2026) any public GitHub repo, so "both" is feasible. For a library whose value is a coherent 90-chart system with a measured-font and pixel-snapping core, npm should be primary and a registry an optional on-ramp for single charts.

### Cited Findings

- A registry is a `registry.json` plus source files on a static host; `npx shadcn build` emits one JSON per item under `public/r`. Item types include `registry:ui`, `registry:block`, `registry:hook`, `registry:lib`; `registryDependencies` resolve recursively (bare name = official registry, URL = anywhere). — [shadcn namespaces/registry docs](https://ui.shadcn.com/docs/registry/namespace)
- Namespaces (`@acme`) are configured in components.json as `"@acme": "https://registry.acme.com/{name}.json"` and installed with `npx shadcn add @acme/component-name`; authenticated registries are supported. — [Namespaces - shadcn/ui](https://ui.shadcn.com/docs/registry/namespace)
- May 2026: registry `include` for composing multiple registry.json files and `shadcn registry validate`. — [May 2026 changelog](https://ui.shadcn.com/docs/changelog/2026-05-registry-include)
- June 2026: any public GitHub repo with a root registry.json can be installed with `shadcn add <user>/<repo>/<item>`, with no build step or server. — [GitHub Registries](https://ui.shadcn.com/docs/registry/github)
- A March 2026 discussion says there is no official migration guide for custom registries; old `type` values were removed. — [shadcn-ui/ui discussion #9949](https://github.com/shadcn-ui/ui/discussions/9949)
- Community directory registry.directory expects a public `/r/registry.json`. — [registry.directory](https://github.com/codedthemes/registry.directory)
- Copy-paste has a maintenance cost seen in practice: old shadcn chart.tsx broke on Recharts 3 because it depended on Recharts internals. — [shadcn-ui/ui #7669](https://github.com/shadcn-ui/ui/issues/7669)
- Tremor shipped both models (npm `@tremor/react` and copy-paste Tremor Raw), with Raw described as the actively developed path. — [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor); third-party skill page via search
- Hairline today: a private package installed via `file:` path, rebuild-and-reinstall after changes. — `/Users/danielhowells/Sites/hairline/README.md`

### Inferences

- npm as source of truth (versioned, one tokens file, types), plus registry items generated from the same source for "give me this one chart": `npx shadcn add @hairline/paired-rungs` copies the chart and its kit dependencies. Since the user already generates `index.ts` with `scripts/library-index.ts`, generating a `registry.json` there is straightforward. A GitHub-hosted registry (June 2026 feature) gets this with no infrastructure.
- Hairline's charts depend on a shared kit and font-metric assumptions, so a registry item would pull `registry:lib` kit files plus CSS tokens; copied code diverges from upstream. Mitigate by having registry items import the kit from the npm package (thin copies) rather than copying the kit.
- Package hygiene: public npm publish, `exports` map with `.`, `./kit`, `./tokens.css`, `./theme.css`, `sideEffects: ["*.css"]`, `"use client"` preserved in the build (bundlers can strip directives; verify `lib/` output), provenance, a changelog, and semver discipline since prop names become API.

### Gaps

- Could not verify the exact current shadcn CLI flags beyond what the changelog pages state.
- No evidence on adoption rates for registries vs npm for chart libraries.
- The `include`/GitHub-registry details come from search summaries of the changelog pages.

## 9. AI/LLM-friendliness

### Takeaway

Agents succeed with libraries that have predictable, uniform props, a small number of examples, machine-readable docs (llms.txt, per-page markdown), and ideally an MCP server or registry the agent can query. Hairline's uniform naming across 90 charts could be a real advantage, but only if the prop contract and types exist.

### Cited Findings

- Component libraries on shadcn typically give agents docs three ways: an llms.txt, Markdown versions of each docs page, and an MCP server (`npx shadcn@latest mcp`, with `mcp init --client claude|cursor|vscode|opencode`). — [Cult UI LLMs & Agents](https://www.cult-ui.com/docs/llms); [Shadcn MCP server overview](https://www.shadcn.io/mcp)
- ui.shadcn.com/llms.txt is a ~12KB curated index; a July 2026 audit reported llms-full.txt returns 404 and there are no per-page .md files, with agents told to run `npx shadcn@latest docs <component>` (from a third-party audit page, medium confidence). — [State of AI in Design Systems: shadcn/ui](https://state-of-ai-in-design-systems.netlify.app/systems/shadcn-ui)
- Cult UI is cited as a good reference: /llms.txt, /llms-full.txt, `.md` for any docs URL, a registry at /r/registry.json, and a built-in `@cult-ui` namespace. The MCP server only searches registries listed in the project's components.json. — [Cult UI LLMs & Agents](https://www.cult-ui.com/docs/llms)
- Arc offers llms.txt, llms-small.txt, llms-full.txt, `/markdown` per-component pages, plus SKILL.md and INSTRUCTIONS.md for AGENTS.md/CLAUDE.md. — [uiarc.dev AI docs](https://uiarc.dev/docs/ai)
- An overview of how llms.txt, llms-full.txt, AGENTS.md, SKILL.md and MCP fit together. — [Hugging Face guide](https://huggingface.co/blog/phranzia/ai-agent-documentation-guide)
- A 2026 article asks why learn Recharts "if AI can build your charts", reflecting that AI tools generate Recharts/shadcn charts by default (opinion piece). — [DEV Community](https://dev.to/oluwadamisisamuel1/if-ai-can-build-your-charts-why-learn-recharts-53l7)
- Copy-paste source is itself the reason AI tools handle shadcn well ("code agents can read"), per a vendor-adjacent source (shadcn.io, independent of the official project, so treat as promotional). — [shadcn.io](https://www.shadcn.io/ui/why-ai-coding-tools-love-shadcn-ui)

### Inferences

- Agent-facing deliverables, in value order: (1) exported prop types with JSDoc `@example` on every prop (agents read `.d.ts`); (2) `/llms.txt` plus `/llms-full.txt` generated from the same script as index.ts, with one block per chart: name, one-line "use when", the data shape, a minimal example, and the notable props; (3) per-chart `.md` pages; (4) a `SKILL.md`/AGENTS.md snippet saying "use `format` not custom tick functions; set `emphasis`, never colours; charts take plain data"; (5) a registry so `shadcn mcp` can find it; (6) a chart-chooser table ("comparison of two periods -> PairedRungs").
- Predictability matters more than coverage: 90 charts with bespoke data shapes is a generation hazard (agents hallucinate props). Collapsing to a few row shapes (section 2) and the `CommonChartProps` contract (section 4) will reduce wrong-prop errors more than any doc.
- Runtime validation with helpful errors (dev-only `console.error("PairedRungs: `periods` needs exactly 2 labels, got 3")`) gives agents a feedback loop in the browser.
- Machine-readable example gallery: the existing `#/chart/<ID>` routes could emit a JSON manifest (id, name, props, sample data) consumed by llms-full.txt and the registry.

### Gaps

- No controlled evidence on which API traits improve LLM success rates; the above is reasoned from docs conventions, not measurement.
- Did not verify that the shadcn llms.txt audit is accurate (third-party, dated July 2026).
- No source found specifically on charting libraries' agent docs (Recharts, Plot, visx llms.txt status unknown).

## Cross-cutting priority list (inferences, for the report writer)

1. Export `*Props` types and shared contract types; generate them with the existing index script.
2. Define `CommonChartProps` and a conformance test across all charts.
3. Standardise data input around tidy rows plus `Accessor<T, V>`; document missing-data rules.
4. Make `format` serialisable (named/`Intl` spec) so server components need no wrapper.
5. Ship Tailwind-free precompiled CSS with namespaced variables; Tailwind v4 becomes optional.
6. Split pure SVG render from the client wrapper to give true zero-JS SSR; default to viewBox-scaled sizing with an intrinsic aspect.
7. Add `annotations` data plus a `useChartScales()` hook for children inside the plot.
8. Publish to npm (public) with `exports` map; add a GitHub/shadcn registry generated from the same manifest.
9. Generate llms.txt, per-chart markdown, and AGENTS/SKILL snippets from the same manifest.
