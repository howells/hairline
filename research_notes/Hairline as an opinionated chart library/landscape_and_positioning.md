# Competitive landscape of JS/React charting libraries (late 2026) and positioning for an opinionated, editorial library (Hairline)

Method note: npm and GitHub numbers below were pulled live from the npm downloads API and GitHub REST API on 2026-11-01 (the "last-week" npm window). Third-party blog figures conflict wildly (Recharts is quoted at 1.8M, 2.4M, 40.9M, 48.9M and 62M weekly), so only the API pulls are treated as primary. Items from my own background knowledge, with no source found, are listed under Gaps, not as findings.

## 1. Who are the incumbents, what is their positioning, and what are the adoption numbers?

### Takeaway

Recharts dominates React by a huge margin (about 62M weekly downloads, 27.7k stars) and is the substrate for shadcn/ui charts, Tremor and Evil Charts. Canvas/enterprise engines (Chart.js, ECharts, Highcharts) lead on stars or breadth, and d3 (about 31M weekly) is the shared foundation. Every popular React option is either "default dashboard chart" or "low-level primitives"; none is positioned as a house-style or print-grade editorial kit.

### Cited Findings

Weekly npm downloads (API, last-week window, 2026-11-01) and GitHub stars:

- recharts: 62.3M/wk, 27,680 stars, pushed 2026-11-01 — [npm API](https://api.npmjs.org/downloads/point/last-week/recharts), [GitHub](https://api.github.com/repos/recharts/recharts). Current version 3.10.1, MIT, React-only, SVG-only, built on D3 submodules — [search summary of npmtrends/Strapi](https://npmtrends.com/chart.js-vs-echarts-vs-recharts)
- chart.js: 16.8M/wk, 67,774 stars; react-chartjs-2: 5.9M/wk — [npm API](https://api.npmjs.org/downloads/point/last-week/chart.js), [GitHub](https://api.github.com/repos/chartjs/Chart.js)
- echarts: 9.06M/wk, 67,655 stars; echarts-for-react: 2.25M/wk — [npm API](https://api.npmjs.org/downloads/point/last-week/echarts), [GitHub](https://api.github.com/repos/apache/echarts). Version 6.1.0 per [npmtrends](https://npmtrends.com/chart.js-vs-echarts-vs-recharts)
- d3: 30.9M/wk, 113,843 stars (d3-hierarchy alone 36.6M/wk, so counts include transitive installs) — [npm API](https://api.npmjs.org/downloads/point/last-week/d3), [GitHub](https://api.github.com/repos/d3/d3)
- highcharts: 3.49M/wk, 12,502 stars (commercial licence; v13.1.1 per npmtrends) — [npm API](https://api.npmjs.org/downloads/point/last-week/highcharts), [GitHub](https://api.github.com/repos/highcharts/highcharts)
- @nivo/core: 2.18M/wk (@nivo/bar 1.27M, @nivo/line 1.26M), 14,131 stars, last push 2026-07-21 — [npm API](https://api.npmjs.org/downloads/point/last-week/@nivo/core), [GitHub](https://api.github.com/repos/plouc/nivo)
- visx: umbrella @visx/visx only 119k/wk, but @visx/shape 9.5M, @visx/scale 9.6M, @visx/group 9.7M/wk (transitive via other libs and direct use); 21,092 stars, last push 2026-06-22 — [npm API](https://api.npmjs.org/downloads/point/last-week/@visx/shape), [GitHub](https://api.github.com/repos/airbnb/visx)
- victory: 657k/wk, 11,244 stars, active (pushed 2026-11-01) — [npm API](https://api.npmjs.org/downloads/point/last-week/victory), [GitHub](https://api.github.com/repos/FormidableLabs/victory)
- plotly.js: 928k/wk (react-plotly.js 979k), 18,376 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/plotly.js), [GitHub](https://api.github.com/repos/plotly/plotly.js)
- vega-lite: 1.78M/wk, 5,539 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/vega-lite), [GitHub](https://api.github.com/repos/vega/vega-lite)
- @observablehq/plot: 1.56M/wk, 5,417 stars, active — [npm API](https://api.npmjs.org/downloads/point/last-week/@observablehq/plot), [GitHub](https://api.github.com/repos/observablehq/plot)
- @tremor/react: 555k/wk; tremor-npm repo 16,467 stars but last push 2025-01-13 (dormant) — [npm API](https://api.npmjs.org/downloads/point/last-week/@tremor/react), [GitHub](https://api.github.com/repos/tremorlabs/tremor-npm)
- shadcn-ui/ui (parent of shadcn charts): 127,109 stars — [GitHub](https://api.github.com/repos/shadcn-ui/ui)
- AG Charts: ag-charts-community 2.59M/wk, ag-charts-react 424k/wk; the ag-grid/ag-charts repo shows 488 stars but is likely a mirror/secondary repo — [npm API](https://api.npmjs.org/downloads/point/last-week/ag-charts-community), [GitHub](https://api.github.com/repos/ag-grid/ag-charts)
- Unovis: @unovis/ts 346k/wk, @unovis/react 16k/wk, 2,861 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/@unovis/ts), [GitHub](https://api.github.com/repos/f5/unovis)
- Semiotic: 16.6k/wk, 2,717 stars (nteract/semiotic) — [npm API](https://api.npmjs.org/downloads/point/last-week/semiotic), [GitHub](https://api.github.com/repos/nteract/semiotic)
- LayerCake (Svelte): 69k/wk, 1,796 stars; LayerChart (Svelte): 1,369 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/layercake), [GitHub](https://api.github.com/repos/mhkeller/layercake)
- Mosaic (uwdata): @uwdata/mosaic-core 41.7k/wk, 1,399 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/@uwdata/mosaic-core), [GitHub](https://api.github.com/repos/uwdata/mosaic)
- Chartist 143k/wk, 13,452 stars; frappe-charts 225k/wk, 15,091 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/chartist), [GitHub](https://api.github.com/repos/Chartist-js/chartist)
- Others: apexcharts 2.78M/wk (react-apexcharts 1.43M), 15,185 stars; @mantine/charts 538k/wk; @amcharts/amcharts5 467k/wk; TanStack react-charts 91k/wk, 3,135 stars; lightweight-charts (TradingView) 17,742 stars; uPlot 10,605 stars — [npm API](https://api.npmjs.org/downloads/point/last-week/apexcharts), [GitHub](https://api.github.com/repos/apexcharts/apexcharts.js)
- Datawrapper Core (open-source half of the product): 1,464 stars — [GitHub](https://api.github.com/repos/datawrapper/datawrapper)
- Third-party 2026 roundups agree on positioning: Recharts is the default for standard dashboards, Nivo for polished visuals with little setup, visx/D3 for fully custom, ECharts/AG Charts for large data — [PkgPulse / LogRocket / Databrain summary](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- Recharts is "ideal for 1K-5K points", Nivo is config-heavy with a large bundle, visx has the smallest footprint (about 8-20kb gz) but needs D3 expertise — [LogRocket (June 2026)](https://blog.logrocket.com/best-react-chart-libraries-2026/); sources disagree on Nivo bundle size (60-80kb vs 285kB gz) — [PkgPulse](https://www.pkgpulse.com/guides/recharts-chartjs-vs-nivo-vs-visx-react-charting-2026) vs Databrain, per the same search summary
- Newer entrants (2025-26):
  - Evil Charts (Legion Dev): shadcn-registry, Recharts-based, animated charts, MIT, about 49 components; chosen by nuqs when it left Tremor — [21st.dev](https://21st.dev/@LegionWebDev/library/evil-charts), [nuqs on X](https://x.com/nuqs47ng/status/1959248419194540089)
  - Rosen Charts (Filipe Sommer): "the first fully RSC compatible, copy-pasteable charting library", html + d3 rather than Recharts, shadcn CLI install, about 56 variants in 6 categories (bar, line, pie/donut, area, scatter, other incl. treemap, funnel, heatmap), gradient/neon styling — [rosencharts.com](https://rosencharts.com/)
  - shadcn/ui chart is a copy-paste wrapper on Recharts, now on v3 — [shadcn docs](https://ui.shadcn.com/docs/components/base/chart)
- Tremor: Vercel acquired it on 2025-01-22; all components and Blocks went free and MIT; founders joined Vercel's design engineering team — [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor). Copy-paste charts import Recharts — [tremor.so](https://www.tremor.so/). nuqs left Tremor in Aug 2025 because it was unmaintained and broke on Tailwind v4 — [PkgPulse](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026)

### Inferences

- The "copy-paste Recharts skin" lane (shadcn, Tremor, Evil Charts, Bklit-style kits) is crowded and shares a single dashboard look (rounded cards, gradients, neon). This is the visual context Hairline will be compared against.
- Recharts' lead is partly a shadcn/AI-codegen effect (shadcn is the default chart path for LLM-generated UIs), so its raw download count overstates deliberate selection.
- Star counts are poor signal for React fit: Chart.js and ECharts have about 67k each, but Recharts has more than 3x their React usage with 27k.
- Editorial/design-led niches get small numbers (Plot 5.4k stars, 1.6M/wk; Unovis 2.9k) yet earn outsized mindshare. Hairline should not benchmark itself against Recharts' download count.

### Gaps

- No reliable download or star data for Evil Charts and Rosen Charts (repo slugs I guessed returned 404; Rosen's repo is reportedly Filsommer/rosenCharts).
- No 2026 funding/ownership news found for Nivo, Victory, or AG Charts; no Bklit or other "AI-generated chart kit" figures found.
- Semiotic and Mosaic star counts are small, and I found no positioning statements for them. Highcharts and AG Charts licence prices not researched.

## 2. Which libraries are deliberately opinionated, and how did they earn trust?

### Takeaway

Opinionated libraries win by making the default output good enough to ship unedited, then letting users override. Observable Plot ("in a word: defaults") earned trust through the Bostock/D3 pedigree and speed to a first chart. Tremor/shadcn earned adoption via a single coherent look that matches the host design system, delivered as copy-paste code users own. Datawrapper earned newsroom trust by encoding journalistic best practice in layout, typography, accessible palettes and alt text.

### Cited Findings

- Observable Plot's own pitch: "In a word: defaults. The beauty of defaults is that you can override them as needed." It is for exploratory visualization: "with Plot, you'll see more charts" — [Why Plot](https://observablehq.com/plot/why-plot) (as relayed by search result; my direct fetch hit a 429)
- Plot.auto aims for a useful chart quickly "through opinionated defaults" — [npm @observablehq/plot](https://www.npmjs.com/package/@observablehq/plot/v/0.6.4)
- Bostock on HN: Plot is optimized for fast exploration, concise, good defaults, SVG output you can manipulate — [HN item 27036768](https://news.ycombinator.com/item?id=27036768)
- Plot's own limits in defaults: maintainers say there is probably no good universal default colour scheme; the white background default clashes with dark-theme apps (issue #1434) — [GitHub issue #1434](https://github.com/observablehq/plot/issues/1434)
- Tremor: React + Tailwind + Radix, 35 components and 300 blocks, copy-paste or npm; its stated downside is that it is "shadcn aesthetics only" and fights other design systems — [tremor.so](https://www.tremor.so/), [PkgPulse](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026)
- shadcn charts: copy-paste into your app, so users own the code; theming through CSS variables (--chart-1 etc.) — [shadcn docs](https://ui.shadcn.com/docs/components/base/chart)
- Datawrapper: built for newsrooms; "every element carefully optimized ... from layout and typography to legends, axes, and tooltips"; accessible colours by default; alt text field; reviewers say it goes from dataset to publishable embed within the hour and used by NYT and Guardian (vendor/review-blog claims) — [datawrapper.de](https://www.datawrapper.de/), [lowcode.agency review](https://www.lowcode.agency/nocode-tools/datawrapper). Its limit: defaults don't stop bad choices.
- Datawrapper vs Flourish split: Datawrapper = accurate/accessible routine charts; Flourish (owned by Canva since 2022) = striking narrative/animated output — [liquichart / lowcode.agency summaries](https://www.liquichart.com/blog/best-datawrapper-alternatives)
- Highcharts: palette tested for colour-blind neighbours, plus a high-contrast theme and pattern-fill module as an accessible-by-default story — [Highcharts accessibility docs](https://highcharts.com/docs/accessibility/patterns-and-contrast)
- BBC: bbplot (2018) encoded the BBC News chart style as a ggplot theme `bbc_style()` plus `finalise_plot()`; credited with changing the team's culture and removing bottlenecks. Limits: theme doesn't adapt to chart type, colours must be set explicitly — [bbc/bbplot](https://rdrr.io/github/bbc/bbplot/), [BBC R Cookbook](https://bbc.github.io/rcookbook/)
- FT: the Visual Vocabulary poster (9 categories, 40+ chart types) is a taxonomy, with code templates (visual-vocabulary-templates, updated June 2025, 89 stars) intended as starting points to be refined in Illustrator — [FT chart-doctor](https://github.com/ft-interactive/chart-doctor/tree/master/visual-vocabulary), [ft-interactive](https://github.com/ft-interactive/visual-vocabulary-templates)

### Inferences

- Trust was earned through a stated stance on what a good chart is (Plot: "see more charts", Datawrapper: communicate correctly, BBC/FT: house style as a shared artefact) and not through feature count.
- The owned-code model (shadcn, Tremor, Rosen, Evil) lowers the adoption barrier for an opinionated look because users can fork it. Hairline, with a very distinct house style, would benefit from that distribution model or a clearly layered token/theme API.
- A house style is only accepted when it is escapable: Plot and Tremor both took heat for defaults users could not easily alter.

### Gaps

- I could not fetch Plot's page directly (429), so the quoted lines are from a search summary.
- No first-hand source for why Datawrapper's design choices were made (blog post not found); newsroom adoption claims are from review blogs.
- Highcharts' theme gallery and its role in adoption not researched.

## 3. What do developers and designers complain about in incumbents?

### Takeaway

The recurring complaints are plain default styling and customization ceilings (Recharts), bundle weight and config-heaviness (Nivo), steep D3 knowledge needs (visx), no true SSR for Recharts, accessibility gaps (an accessibility layer only on by default in Recharts v3), and a shared "same dashboard" look.

### Cited Findings

- Recharts: reviewers cite lack of customization and that a native look is "nearly impossible"; the default tooltip is a plain white box with tiny text, fixed through the `content` render prop; animation hurts above about 2,000 points — [empire-ui 2026 tutorial](https://empire-ui.com/blog/chart-recharts-react), [embeddable review](https://embeddable.com/blog/what-is-recharts)
- Recharts SSR: components rely on useEffect/useContext to propagate config between siblings, so charts are absent from initial HTML; a proposed two-pass `renderToStringWithRecharts` would not work with streaming SSR — [recharts Discussion #6390 (Sept 2025)](https://github.com/recharts/recharts/discussions/6390). LogRocket states more positively that SVG gives a better SSR story than canvas — [LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- Recharts accessibility: v3 enables `accessibilityLayer` by default; earlier issues include customized charts not keyboard-accessible (#4809) and chart elements with role="img" breaking axe (#3449); a recent downstream issue notes no accessible name, role or text equivalent — [#4809](https://github.com/recharts/recharts/issues/4809), [#3449](https://github.com/recharts/recharts/issues/3449), [Rotula #139](https://github.com/Rotula-Labs/rotula-app/issues/139)
- shadcn/Recharts v3 migration friction (CSS-variable change `hsl(var(--chart-1))` to `var(--chart-1)`, container needs explicit height) — [shadcn docs](https://ui.shadcn.com/docs/components/base/chart)
- Tremor: unmaintained for a while and broke with Tailwind v4 (nuqs moved off in Aug 2025); tied to a single aesthetic — [PkgPulse](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026), [nuqs on X](https://x.com/nuqs47ng/status/1959248419194540089)
- Nivo: polished defaults but config-heavy with a big bundle; visx: needs D3 knowledge; Chart.js/canvas: weaker SSR and accessibility than SVG (canvas needs fallback content) — [LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- Chart.js has no built-in pattern fills; users add patternomaly and manual ARIA — [Chart.js accessibility guide](https://lobehub.com/skills/sjnims-chartjs-expert-chartjs-accessibility)
- Rosen Charts' pitch is itself a complaint list: server components, bundle size, network roundtrips — [rosencharts.com](https://rosencharts.com/)
- On HN, Highcharts is said to look more polished out of the box than Chart.js; ECharts is recommended for customer-facing dashboards — [HN 40196880](https://news.ycombinator.com/item?id=40196880)
- Design-led complaint: people make their own Economist-style charts by theming general tools (plotly walkthrough; ggthemes `theme_economist` in R), which indicates unmet demand — [Joram Mutenge](https://www.jorammutenge.com/posts/24/1029/index.html)

### Inferences

- SSR-first, zero-client-JS SVG is a real differentiator: Recharts cannot do it and only Rosen is explicitly pitching it. If Hairline renders static SVG on the server, this should be a headline claim, verified against its code.
- "Looks like every other dashboard" is the unarticulated complaint behind the Evil/Rosen explosion of gradient styling, which sets the contrast for a restrained editorial look.

### Gaps

- No Reddit threads were retrieved; HN evidence is thin and mostly older. No direct quote-level designer complaints (typography) found.
- No State of JS 2025 dataviz satisfaction data was found (the libraries page did not surface a charting category), so sentiment numbers are unavailable.

## 4. Is there an existing editorial/newsroom-grade React chart library, and how is Hairline different?

### Takeaway

I found no maintained, general-purpose, React editorial chart library from a newsroom or elsewhere. Newsroom assets are styles/themes (BBC bbplot for R), taxonomies and templates (FT Visual Vocabulary), SaaS tools (Datawrapper, Flourish), or Svelte/vanilla modules (Reuters, LayerCake). That leaves an open lane.

### Cited Findings

- Reuters Graphics' awesome-charts: a list of reusable chart modules (categorical bar, line/area, parliament chart); 10 stars, last push 2022-01-20 — [GitHub](https://github.com/reuters-graphics/awesome-charts), [API](https://api.github.com/repos/reuters-graphics/awesome-charts)
- FT: Visual Vocabulary templates are D3 starters for static graphics later finished by hand in Illustrator; 89 stars — [ft-interactive](https://github.com/ft-interactive/visual-vocabulary-templates)
- BBC: bbplot is R/ggplot only — [bbc/bbplot](https://rdrr.io/github/bbc/bbplot/)
- Datawrapper's open-source core is mostly plugin-based with most functionality closed; 1,464 stars — [GitHub fork description](https://github.com/suryatmodulus/datawrapper), [API](https://api.github.com/repos/datawrapper/datawrapper)
- Svelte options: LayerCake (1,796 stars, 69k/wk), LayerChart (1,369 stars) — [GitHub](https://api.github.com/repos/mhkeller/layercake)
- Economist: no library found; the HN thread says it publishes some data and models on GitHub, and community port of its look exists as ggthemes/plotly recipes — [HN 40391614](https://news.ycombinator.com/item?id=40391614)
- Semiotic (small React library, 2.7k stars, 16k/wk) and Unovis (2.9k stars) are the only other React-adjacent design-aware libraries surfaced — [GitHub](https://api.github.com/repos/nteract/semiotic)

### Inferences

- Hairline's differentiation is the combination: React-native + about 90 bespoke chart components + a single enforced print aesthetic (hairlines, one hero ink, label-on-mark, engraved textures) + paper modes. Nobody found ships this as an installable React package.
- Best framing is "the chart desk as a package", positioned beside Datawrapper (which is a tool) and BBC/FT (which are internal styles).

### Gaps

- Pudding and NYT open-source repos, The Economist's own tooling, and Reuters graphics-components were not retrieved; I cannot say what exists beyond what is listed.
- I did not verify Hairline's actual SSR and bundle claims against the repo (out of scope).

## 5. What chart typology breadth do serious libraries cover, and who ships textures, direct labelling, or print-grade aesthetics?

### Takeaway

Breadth leaders are ECharts, Highcharts, Plotly, Nivo and Vega-Lite; the FT's vocabulary frames about 40 types in 9 relationship categories. Textured fills exist only as accessibility add-ons (Highcharts pattern-fill, ECharts decal, Chart.js patternomaly, AnyChart hatch), always off by default and caveated as potentially confusing. No library found treats engraved/hatch texture or label-on-mark as a core aesthetic.

### Cited Findings

- FT Visual Vocabulary: 9 categories (deviation, correlation, ranking, distribution, change over time, magnitude, part-to-whole, spatial, flow), 40+ chart types — [FT chart-doctor](https://github.com/ft-interactive/chart-doctor/tree/master/visual-vocabulary), [GIJN](https://gijn.org/resource/document-of-the-day-visual-vocabulary/)
- Nivo covers heatmaps, treemaps, chord, Sankey, calendars, and renders in SVG, Canvas or HTML — [LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2026/)
- Rosen: about 56 variants over 6 categories; Evil Charts about 49 components across bar, line, area, pie, radar and composed — [rosencharts.com](https://rosencharts.com/), [21st.dev](https://21st.dev/@LegionWebDev/library/evil-charts)
- Highcharts pattern fills: pattern-fill.js since v6.1.0, patterns usable anywhere a colour is, built-in `patternIndex`, `anchorToPoint` option; docs warn patterns can be visually confusing and add cognitive load, so subtle patterns are recommended — [Highcharts pattern fills](https://www.highcharts.com/docs/chart-design-and-style/pattern-fills), [accessibility docs](https://highcharts.com/docs/accessibility/patterns-and-contrast), [best practices](https://www.highcharts.com/blog/best-practices/best-chart-accessibility-practices/)
- Highcharts also offers a series-label module and data labels so colour is not the only cue — [accessibility docs](https://highcharts.com/docs/accessibility/patterns-and-contrast)
- ECharts decal: parametric repeating patterns (symbol, dash arrays, rotation, colour), off by default, requires `aria.enabled` and `aria.decal.show` and the AriaComponent when tree-shaking — [ECharts aria handbook](https://echarts.apache.org/handbook/en/best-practices/aria/)
- Chart.js: patterns need patternomaly (`diagonal`, `dot`, `zigzag`, `cross`) — [Chart.js accessibility guide](https://lobehub.com/skills/sjnims-chartjs-expert-chartjs-accessibility)
- AnyChart/GraphicsJS: built-in hatch fill presets for B&W print and colour-blind users — [AnyChart docs](https://docs.anychart.com/Graphics/Hatch_Fill_Settings)
- Design research: people tell apart roughly 12-24 textures quickly vs fewer than 12 colours; texture is poor on small shapes and can produce moiré — [Kerry Kolosko](https://kerrykolosko.com/on-patterns-and-textures/)
- chartjs-plugin-datalabels (921 stars, last push 2024-01-17) is the Chart.js route to labels on marks — [GitHub](https://api.github.com/repos/chartjs/chartjs-plugin-datalabels)

### Inferences

- Textures are positioned industry-wide as an accessibility fallback. Hairline can invert this: texture as an aesthetic and informational layer that also serves colour-blind and B&W print, with moiré and small-shape rules built in (the Highcharts caveats are the known failure modes to design around).
- Hairline's roughly 90 components is broad compared with the copy-paste kits (about 50-56) and in the same band as Nivo; this should be a stated number only if all are consistently styled.

### Gaps

- I did not verify Plot's or Datawrapper's direct-labelling support, or Vega/Plotly pattern support; no data found.
- Exact chart-type counts for ECharts, Highcharts, Plotly, Nivo were not retrieved.

## 6. What positioning, naming and messaging works for an "opinionated" library; what promise does the user expect?

### Takeaway

Opinionated libraries lead with a one-line stance about defaults and an artefact users can see. Successful promises are "good result with no styling work" (Datawrapper, Plot), "matches your design system" (Tremor/shadcn) or "you own the code" (copy-paste). Users expect the house style to be consistent across every chart type, accessible, and overridable.

### Cited Findings

- Plot: "In a word: defaults." — [Why Plot](https://observablehq.com/plot/why-plot); Open Visualization Academy describes it as "opinionated without being rigid" — [OVA article](https://openvisualizationacademy.beehiiv.com/p/observable-plot-simplicity-meets-expressiveness-in-charts)
- Rosen: "The next[js] generation of charting"; promises "zero setup", RSC, dark mode, smaller bundles — [rosencharts.com](https://rosencharts.com/)
- Datawrapper: promises carefully optimized layout and typography and accessible colours — [datawrapper.de](https://www.datawrapper.de/)
- Tremor and shadcn: "copy and paste" ownership; Tremor flagged for being locked to one look — [tremor.so](https://www.tremor.so/), [PkgPulse](https://www.pkgpulse.com/guides/recharts-v3-vs-tremor-vs-nivo-react-charting-2026)
- Highcharts notes subtle patterns are best and that patterns can overload — [Highcharts best practices](https://www.highcharts.com/blog/best-practices/best-chart-accessibility-practices/)
- BBC's package name is a plain function (`bbc_style()`), and the stated win was speed and consistency for the team — [bbc/bbplot](https://rdrr.io/github/bbc/bbplot/)

### Inferences

- The expected promise from an editorial library: a chart that could run in a broadsheet without a designer touching it; honest data encodings (zero baselines, direct labels, source line); a printable/greyscale-safe output; accessible text alternatives; and quick escape hatches for colour, type and paper.
- Naming works best when it states a stance (Plot, Datawrapper, Tremor) over a tool category. "Hairline" is a stance-bearing name; messaging should translate it into one concrete rule ("one ink, labels on marks, nothing decorative") with side-by-side before/after against Recharts defaults.
- Avoid the Tremor trap (one look, no exit) by documenting what can be overridden (palette, typeface, paper mode) and what is deliberately not configurable.
- Positioning gap to own: "editorial / print-grade charts as React components", SSR-clean, texture and direct-label native. Candidate one-liner for testing: "The chart desk, as a React package."

### Gaps

- No user research on what people expect from an "opinionated" label; promises are inferred from vendor copy and reviews.
- Pricing/licence strategy comparisons (MIT vs commercial like Highcharts) not researched.
