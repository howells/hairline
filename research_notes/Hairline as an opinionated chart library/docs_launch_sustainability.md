# Hairline: docs, launch, release engineering, licensing, community and sustainability (as of Nov 2026)

Scope note: about 14 searches/fetches. Primary sources were fetched where possible (Vercel blog, Prettier docs, Motion's own post). Several planned items could not be verified (see Gaps in each section). Nothing below is invented; unverified items are marked as gaps.

## Documentation patterns that make chart libraries beloved

### Takeaway

The best-evidenced documentation model for a taste-led chart library is: one page per chart, a gallery as the front door, and a chart-choosing vocabulary organised by purpose (FT Visual Vocabulary, Datawrapper). I could verify only part of the per-library docs claims (Nivo's per-chart routes, Evil Charts' registry install). Tooling choice is mostly a stack decision: Fumadocs or Nextra if the showcase is already Next.js, Starlight if standalone and static.

### Cited Findings

- Nivo's home page is a visual gallery of about 20 chart types, and each chart has its own route (/line/, /bar/, /sankey/, /chord/ and so on). Whether live prop controls or code export sit on those pages was not confirmed from the home page alone. — [nivo.rocks](https://nivo.rocks/)
- The FT Visual Vocabulary was built because the FT graphics desk kept arguing with non-graphics colleagues about which chart suited a story. They wanted "a common vocabulary to talk about chart types". It exists as a poster and a web page (ft.com/vocabulary). — [VitaraCharts summary](https://blog.vitaracharts.com/financial-times-visual-vocabulary-which-chart-to-use-when)
- The Visual Vocabulary has 8 categories: Deviation, Correlation, Ranking, Distribution, Change over Time, Part-to-Whole, Magnitude, Spatial. One source says 9; the others agree on 8. The source PDF is in the FT's chart-doctor repo. — [VitaraCharts](https://blog.vitaracharts.com/financial-times-visual-vocabulary-which-chart-to-use-when); [FT chart-doctor PDF](https://github.com/Financial-Times/chart-doctor/blob/main/visual-vocabulary/Visual-vocabulary.pdf); [data.europa.eu](https://data.europa.eu/apps/data-visualisation-guide/visual-vocabulary) says 9
- Datawrapper's chart-type guide is organised by purpose (shares, absolute numbers, correlations). It gives practical guidance such as "a bar chart is often a safer pick for small screens than a column chart", and it points readers to the FT Visual Vocabulary and Storytelling with Data's Chart Guide. — [Datawrapper blog](https://www.datawrapper.de/blog/chart-types-guide)
- Other chart-chooser references: From Data to Viz (decision tree, with R and Python code), the Data Viz Project (150 types), the Data Visualisation Catalogue, the Chartmaker Directory. — [GMU InfoGuide](https://infoguides.gmu.edu/data-visualization/types)
- Evil Charts distributes charts as source through a shadcn registry (`npx shadcn@latest add @evilcharts/{chart-name}`). It lists 49 components, is MIT, and installs into its own folders so it doesn't collide with shadcn/ui. It ships each chart in two versions (Recharts and Apache ECharts) behind one compound API. — [evilcharts.com docs](https://evilcharts.com/docs/installation); [Zenn write-up](https://zenn.dev/suwash/articles/evilcharts_20260729?locale=en); [21st.dev](https://21st.dev/@LegionWebDev/library/evil-charts)
- Docs framework landscape in 2026: Starlight (Astro), Fumadocs (Next.js, React Router, TanStack Start, Waku, Astro), Nextra (Next.js) and VitePress (Vue) are all MIT. Nextra is the more opinionated, easier start. Fumadocs is more flexible and assumes you can read the source. Starlight reaches a cohesive default sooner but its override system is more limited than Fumadocs' headless approach. — [PkgPulse](https://www.pkgpulse.com/guides/fumadocs-vs-nextra-v4-vs-starlight-documentation-sites-2026); [Fumadocs comparisons](https://fumadocs.dev/docs/comparisons); [Context7 guide](https://context7.com/docusaurus-alternatives)
- Fumadocs lists TypeScript docs generation as a feature that Nextra lacks. That is relevant for generating props tables from chart types. — [Fumadocs comparisons](https://fumadocs.dev/docs/comparisons)
- Starlight's own page estimates 0.01g CO2 per page visit against 0.09g (Fumadocs) and 0.10g (Nextra). This is self-published and not neutral. — [Starlight environmental impact](https://starlight.astro.build/environmental-impact/)
- Tremor's docs and charts pages install via npm and sit on Recharts; the library has 35 components and 300 blocks. — [Tremor charts](https://tremor.so/charts); [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor)

### Inferences

- Hairline already has a ~90-chart grid. That maps naturally onto a Nivo-style gallery to per-chart-page structure. Each page could carry: live example, props table, data shape, "when to use" (tagged with a Visual Vocabulary category), and a "don't" note.
- Tagging the 90 charts by the FT's 8 categories would give a navigation axis that Nivo and Recharts lack, and it fits an opinionated, editorial position. This is my suggestion, not something a source asserts.
- If the showcase site is Next.js, Fumadocs is the best fit for the flexibility and the TypeScript docs generation. If the docs are separate, Starlight is the lightest option.
- The user's memory note says "no prose in charts" in the grid. Docs pages are a separate surface, so explanatory text can live there without violating that.

### Gaps

- I could not verify the current structure of Observable Plot's docs (the fetch hit a 429), visx's gallery, Highcharts demos, Tremor's per-component docs, or whether Nivo has live prop controls. I did not rely on memory for these.
- I did not find Datawrapper Academy's structure specifically; only its blog chart guide.
- No data on Ladle or Storybook for chart libraries in 2026.

## Release engineering

### Takeaway

For a new package with no existing users, ESM-only, Changesets plus npm trusted publishing (OIDC) with provenance is the current default. Changesets v3 (Aug 2026) itself went ESM-only. There is a first-publish bootstrap quirk to plan for.

### Cited Findings

- Changesets v3.0 shipped on 11 Aug 2026 with a new docs site and changesets/action v2. It is ESM-only, needs Node 22.11 or newer, and needs pnpm 10+, npm 10.9+ or Yarn 4.5.2+. Yarn Classic is dropped. — [InfoQ](https://www.infoq.com/news/2026/09/changesets-v3-release/)
- npm trusted publishing (OIDC) requires npm 11.5.1 or newer (bundled with Node 22.14+). Typical setup: remove NPM_TOKEN, add `id-token: write` and `NPM_CONFIG_PROVENANCE`. Many projects publish on Node 24. — [PkgPulse publishing guide](https://www.pkgpulse.com/guides/publishing-npm-package-complete-guide-2026); [eslint-plugin-prettier PR 807](https://github.com/prettier/eslint-plugin-prettier/pull/807)
- First-publish bootstrap: the trusted publisher can only be configured once the package exists on npm, so use a temporary short-lived token for 0.1.0, then configure OIDC and revoke the token. Provenance needs a public repository. In one reported project, 0.1.0 ended up without provenance for unknown reasons. Only one trusted publisher can be set per package. — [graph-tooling PR 2126](https://github.com/graphprotocol/graph-tooling/pull/2126)
- Setting `publishConfig.provenance: true` in package.json works across package managers (used when Yarn publishing). — [eslint-plugin-prettier PR 807](https://github.com/prettier/eslint-plugin-prettier/pull/807)
- Standard flow: each user-facing PR includes a changeset, changesets/action on main opens a "Version packages" PR, and merging it publishes. — [PkgPulse](https://www.pkgpulse.com/guides/publishing-npm-package-complete-guide-2026)
- For packages targeting modern environments (browsers, Deno, Node 22+ where require(ESM) works), ESM-only is increasingly practical, especially with no existing users. — [jsmanifest guide](https://jsmanifest.com/create-modern-npm-package-2026)

### Inferences

- Hairline is private v0.1.0 with no users, so there is no legacy CJS burden. ESM-only is low-risk. React as a peer dependency and a clean `exports` map are the other decisions to settle before the first publish.
- Plan the first publish deliberately: the repo must be public before provenance works, and the OIDC publisher is configured after the first publish.
- The repo log shows recent work on SSR hydration and packaging for React apps, so ESM plus SSR safety is already a stated concern. Nivo's refusal to support React Server Components (below) is a differentiator Hairline could claim.

### Gaps

- No sourced guidance found on deprecation policy or semver discipline for pre-1.0 UI libraries. Nivo remaining at 0.99 after years is an observed example, not a policy.
- No sourced detail on versioned docs practices.

## Licensing and business models

### Takeaway

Three live models: pure open source plus premium extras (Motion+, Tailwind Plus), open-core with commercial enterprise tier (AG Charts), and dual licence with free non-commercial tier (Highcharts). The Tremor and Tailwind stories show that both paid templates and acquisition are fragile or lopsided. For a solo designer-developer, MIT code plus an optional one-time paid product is the best-evidenced route.

### Cited Findings

- Tremor: Vercel announced the acquisition on 22 Jan 2025. Tremor Blocks, previously the paid Pro product, became free under MIT. Tremor had 16,000+ GitHub stars, about 300,000 monthly downloads and 5.5 million total installs. Co-founders Severin Landolt and Christopher Kindl joined Vercel's Design Engineering team. Vercel's stated reason: strengthening v0 for data-heavy UIs. — [Vercel blog](https://vercel.com/blog/vercel-acquires-tremor)
- Highcharts is dual-licensed: free for non-commercial use, paid for commercial. Third-party 2026 estimates are about $185/developer/year internal and about $366 SaaS; perpetual SaaS prices run roughly $1,007 to $2,010. Highcharts' own EULA 1.0 says free use is Personal and Educational only and excludes non-profit organisations, contradicting third-party sites that say non-profits are free. — [Vendr](https://www.vendr.com/marketplace/highcharts-js); [Highcharts EULA](https://shop.highcharts.com/license-eula); [LightningChart comparison](https://lightningchart.com/blog/chart-js-vs-highcharts-vs-lightningchart-which-should-you-choose/)
- AG Charts: Community is MIT and free in production; Enterprise features need a commercial licence, perpetual with 1 year of updates, one per front-end developer. No public prices found. — [AG Charts licence](https://www.ag-grid.com/charts/license-pricing/)
- Motion (ex-Framer Motion) became independent on 12 Nov 2024. It is sustained by Motion+ (one-time purchase, about USD 399 per the page's structured data, originally 299 EUR) and company sponsorships. Motion+ examples and APIs are MIT-licensed; products that resell Motion+ capability need a Builder's Licence. — [Motion+](https://motion.dev/plus); [Motion about](https://motion.dev/about)
- Perry's one-year post: sponsor-only income for Motion One topped out near 1k EUR/month. Individual sponsor tiers (10 and 25 EUR) produced about 8 sponsors and about 100 EUR/month after a week. Corporate tiers are 249, 999 and 2,499 EUR. A paid one-time bundle sold better than subscriptions. Motion Examples launched early 2025 and "remains the primary driver of sales". Release announcements did not produce visible sales spikes. Framer sponsored him for 12 months and extended it. "Don't expect sponsors to come to you. It's an active process." — [Motion: independence, one year in review](https://motion.dev/magazine/motion-independence-one-year-in-review)
- Motion's GitHub Sponsors page is explicitly donations only, with benefits pushed to Motion+; top tiers are $1,499 and $2,999/month. — [GitHub Sponsors](https://github.com/sponsors/mattgperry)
- Tailwind Plus: lifetime licence, $299 individual and $979 team; Tailwind UI launched March 2020 and Wathan reported about $400K on day one and nearly $2M in five months. — [indiemakerlist](https://indiemakerlist.com/revenue/tailwind-plus/); [ppc.land](https://ppc.land/tailwind-css-lays-off-75-of-engineering-team-as-ai-impacts-revenue/)
- Tailwind collapse: on 6 Jan 2026 Tailwind Labs laid off 3 of 4 engineers. Wathan said revenue was down close to 80% while usage was at a record, and docs traffic was down about 40% from early 2023. The paid products depended on docs traffic. A Nov 2025 PR proposing /llms.txt was rejected for this reason. — [DevClass](https://devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/); [Socket](https://socket.dev/blog/tailwind-css-announces-layoffs)
- Counter-view: critics also blame the lifetime pricing saturating the customer base, and shadcn/ui's rise. — [indiemakerlist / danielcoulter.com summary](https://danielcoulter.com/posts/tailwinds-paradox)
- Single-source, unconfirmed: that Tailwind Labs announced joining Shopify on 9 Sep 2026, with Tailwind Plus sign-ups closed. — [indiemakerlist](https://indiemakerlist.com/revenue/tailwind-plus/) (needs confirmation)

### Inferences

- A solo designer-developer cannot realistically sell enterprise licences or a dual licence like Highcharts; those depend on sales and legal support. MIT plus a one-time paid companion is the model with a solo precedent (Motion).
- Motion's lesson about examples driving sales translates directly: for Hairline, the paid thing would most plausibly be polished, ready-made chart compositions, templates or dashboards, not the core library.
- Tailwind's collapse suggests that a paid product funnelled through docs traffic is exposed to AI-generated code. A pack of designed charts that an LLM cannot reproduce from docs may be more defensible than a docs-gated funnel. This is reasoning, not a sourced claim.
- Donations alone are unlikely to cover income (about 100 EUR/month after a week for Motion with a large audience).

### Gaps

- Tremor Blocks' pre-acquisition revenue and pricing: not found.
- AG Charts and amCharts exact prices: not found. amCharts not researched.
- GitHub Sponsors typical income for design-led libraries: no data found.
- Whether Tailwind Labs joined Shopify: single secondary source only.

## Launch case studies

### Takeaway

Design-led UI libraries mostly launched with a short demo clip on X from an established personal account, a very small API surface ("insert one component, call one function") and distribution through a bigger vehicle (shadcn/ui adopting Sonner). I did not find Hacker News launch threads for any of them.

### Cited Findings

- Sonner: Emil Kowalski (then at Linear) announced it on X on 23 Feb 2023 as "an opinionated toast component for React"; the post had about 202K views. He tested several announcement videos focused on the stacking animation. He chose the name Sonner (French for "to ring") over a more discoverable name. — [X post](https://x.com/emilkowalski/status/1628742238548250624); [Emil's blog](https://emilkowal.ski/ui/building-a-toast-component); [Learn UI](https://learn-ui.com/chapters/components/toast)
- Sonner's biggest growth driver was shadcn/ui making it the default toast in 2023 and deprecating its old Toast. Emil's blog cites over 40 million weekly npm downloads and users like Cursor, X and OpenAI. — [Emil's blog](https://emilkowal.ski/ui/building-a-toast-component); [PkgPulse](https://www.pkgpulse.com/guides/react-hot-toast-vs-react-toastify-vs-sonner-2026)
- Why it caught on, per Emil: no hooks or context, one `<Toaster />` plus `toast()`, a promise API with loading/success/error states, and API design inspired by react-hot-toast. — [Emil's blog](https://emilkowal.ski/ui/building-a-toast-component)
- Sonner has framework ports (svelte-sonner, and Vue and other versions). — [svelte-sonner](https://github.com/wobsoriano/svelte-sonner)
- Vaul: about 8.7k GitHub stars; Emil said in April 2025 that Sonner and Vaul together exceeded 4.2M weekly downloads (a later site claim says 90M, a very different figure; the figures conflict and the basis is unclear). A Vue port's README says the original Vaul is no longer actively maintained. — [Emil on X](https://x.com/emilkowalski/status/1907760748899570089); [vaul GitHub](https://github.com/emilkowalski/vaul); [vaul-vue](https://github.com/unovue/vaul-vue); [animations.dev](https://animations.dev/)
- Observable Plot: announced by Mike Bostock on X on 4 May 2021 as "a new open-source JavaScript library for exploratory data visualization". It had a Bostock-led release cadence with feature posts on X (0.6.7 in May 2023 was its first interactive features; 0.6.16 in Aug 2024 added waffle marks). It launched on the back of the D3 reputation. — [X launch](https://twitter.com/mbostock/status/1389611128339144704); [0.6.7](https://x.com/mbostock/status/1661814623962812416?lang=en)
- Tremor was acquired by Vercel in Jan 2025 and announced via X and Bluesky; reactions speculated about a merge with shadcn. — [Vercel on X](https://x.com/vercel/status/1882133531595604428); [Bluesky](https://bsky.app/profile/vercel.com/post/3lgdyxkyskk26)
- Evil Charts has 3,000+ GitHub stars per one source, and is built by "Legion Dev" (legions-developer), with a stated motive of smooth animation and dynamic data. — [Best of JS](https://bestofjs.org/projects/evilcharts); [evilcharts.com](https://evilcharts.com/)

### Inferences

- The consistent pattern is a short motion-led demo plus an integration into someone else's distribution (shadcn registry, shadcn defaults). For Hairline, a shadcn-style registry install path (as Evil Charts does) would plug into the same channel. Copy-paste or registry distribution is a design choice to weigh against the "package" model.
- Aesthetic restraint (engraved FT feel) is hard to show in motion; a launch artefact would more likely be a single striking static chart plus the 90-chart grid. This is my inference.
- Motion's note that releases did not create sales spikes suggests launches are one event, not a growth engine; continuous example output matters more.

### Gaps

- No Hacker News, Product Hunt or Bluesky launch threads found for Plot, Sonner, Vaul, Tremor or shadcn charts. No data on what a Show HN for a chart library yields.
- shadcn/ui charts launch date and reception: not found. "Rosen Charts" could not be identified; the search surfaced nothing under that name.
- Motion (Framer Motion) launch story: only the 2024 independence story found.

## Community, governance and saying no

### Takeaway

Prettier's option philosophy is the clearest published template for an opinionated project: freeze the option surface, close requests without discussion, and make the exceptions technical rather than taste-based. Publishing the rule in advance is what makes saying no cheap.

### Cited Findings

- Prettier: "we won't add more" options; "The debates over styles just turn into debates over which Prettier options to use." Option requests "aren't accepted anymore" and "will be closed without discussion". Asking to preserve input formatting counts as "an option in disguise". The only exceptions are technical necessity such as compatibility. Some options, such as `--arrow-parens` and `--jsx-single-quote`, are called regretted and kept only because removal is hard. — [Prettier option philosophy](https://prettier.io/docs/option-philosophy)
- Nivo's maintainer closed an SSR/RSC issue as "not planned", and says the project is maintained "when I can find time". — [PkgPulse compare](https://www.pkgpulse.com/compare/nivo-vs-recharts); [visx discussion 1656](https://github.com/airbnb/visx/discussions/1656)
- Eghbal's "stadium" model: a few maintainers, millions of users who don't contribute. She suggests making attention "excludable" (for example by charging). — [Changelog #408](https://changelog.com/podcast/408); [Lessons from Nadia Eghbal](https://www.antoinebuteau.com/lessons-from-nadia-eghbal/) (the second source's quotes may be paraphrases)
- Projects limiting outside contributions in 2026: tldraw closed external PRs because of AI slop; Mitchell Hashimoto has considered the same; GitHub has been evaluating letting maintainers disable PRs or restrict them to trusted collaborators. — [Register](https://www.theregister.com/ai-and-ml/2026/10/21/ai-cuts-coding-time-but-its-also-filling-open-sources-inbox-with-crap/5304389); [Help Net Security](https://www.helpnetsecurity.com/2026/10/26/linux-foundation-open-source-ai-slop/)

### Inferences

- Hairline's taste rules (single ink hero, no prose in charts, engraved texture) could be written as an explicit "design philosophy" page with the same structure as Prettier's: what's fixed, what is configurable, and which requests close without discussion. This is a recommendation.
- Because Hairline is likely a stadium-model project, accepting issues but not PRs for new charts or style options (or requiring an issue-first RFC) is consistent with where other projects are heading in 2026.

### Gaps

- Observable Plot's actual contribution policy and handling of feature requests: not retrieved.
- No sourced examples of issue or PR templates, RFC processes or governance docs for chart libraries.

## Maintenance burden and sustainability pitfalls

### Takeaway

Download counts do not bring maintenance capacity. Popular chart libraries run on thin maintainer time, and 2026 added AI-generated contribution noise as a new cost.

### Cited Findings

- Linux Foundation survey (Oct 2026, 234 respondents): 59% of maintainers report growing contribution volume since GenAI; about 25% of incoming PRs are estimated to be low-quality "AI slop" (31% for projects with 50+ contributors); burnout is the top concern at 63%. 35% of projects have a formal AI policy, 10% ban AI contributions. — [Help Net Security](https://www.helpnetsecurity.com/2026/10/26/linux-foundation-open-source-ai-slop/); [Slashdot](https://news.slashdot.org/story/26/10/26/0131241/25-of-incoming-pull-requests-may-be-ai-slop-finds-study-from-linux-foundation-research)
- curl ended its six-year, $86,000 bug bounty in Jan 2026 because about 20% of submissions were AI slop. — [Help Net Security](https://www.helpnetsecurity.com/2026/10/26/linux-foundation-open-source-ai-slop/)
- CodeRabbit argues burnout predates AI and AI removed buffers that made it manageable. — [CodeRabbit](https://www.coderabbit.ai/blog/ai-is-burning-out-the-people-who-keep-open-source-alive) (vendor blog)
- Chart library snapshot: Nivo 0.99.0 (May 2025), 30.8M @nivo/core downloads in 2025, 56 open issues, not RSC-compatible. Recharts 3.10.1 with about 35M weekly downloads, 27.7k stars and 465 open issues. visx had about a year without releases before 4.0.0, with 159 open issues on a sub-package. — [npmtrends](https://npmtrends.com/@nivo/core-vs-@visx/visx-vs-nivo-vs-recharts-vs-victory); [PkgPulse](https://www.pkgpulse.com/compare/nivo-vs-recharts)
- Tailwind's 2026 layoffs happened despite record usage, a reminder that scale does not equal income. — [DevClass](https://devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
- Perry works about 35 hours a week on Motion despite a working income model. — [Motion post](https://motion.dev/magazine/motion-independence-one-year-in-review)

### Inferences

- A 90-chart library multiplies the issue surface (each chart times each edge case). Limiting the public API per chart and shipping fewer options reduces the inbound volume.
- A written AI-contribution policy and issue-first workflow are cheap protections given the 2026 data.

### Gaps

- No specific named solo-maintainer burnout cases from the chart world surfaced (the search results were about large projects). Older cases such as faker.js or core-js were not researched, so are omitted.
- Typical issues per week for a library of Hairline's size: no data.

## Brand: naming, logo, site design

### Takeaway

The only sourced brand evidence is that Sonner's name was a deliberate trade of discoverability for elegance, and that Vercel and others treated polish as part of adoption. Broader brand claims are unsupported by my research.

### Cited Findings

- Emil Kowalski chose "Sonner" (French "to ring") from a list of French notification-related words, accepting lower discoverability for elegance. — [Learn UI](https://learn-ui.com/chapters/components/toast); [Emil's blog](https://emilkowal.ski/ui/building-a-toast-component)
- Evil Charts' name and pitch ("copy, paste, and ship beautiful charts") are positioned against "boring charts". — [evilcharts.com](https://evilcharts.com/)
- Hairline's repo recently replaced its favicons with an approved icon (git log: f5444ab). — local repo

### Inferences

- "Hairline" is a descriptive typographic term that suits the aesthetic and is searchable alongside "chart". Check for npm, GitHub and trademark conflicts before the public launch (the `nomen` skill exists for this).
- No sourced comparison of site design versus adoption exists in my results; treat this section as thin.

### Gaps

- No research on logo or site design as a credibility factor, nor on naming conflicts for "Hairline". Not covered by sources found.
