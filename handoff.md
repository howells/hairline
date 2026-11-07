# Handoff: chart audit and Codex review

Updated 7 November 2026. Read this before picking up the chart audit work.

## Where things stand

- **Released:** `@howells/hairline@0.5.0` is on npm and tagged `latest`. The audit fixes it carries:
  - #19: one tip card for every chart, placed by the pointer model
  - #21: round numbers, a quiet alert, and a scatter tip that keeps off the chart's names
  - #22: narrow charts never stagger labels
  - #23: reference names keep clear of marks; the selected bead in CircularBeadGraph is ringed
- **Baselines:** #24 regenerated the Docker visual baselines and added range-dots for the first time. It also fixed the acceptance fixture, which still passed plumb-scatter the old `emphasis` prop instead of `hero`.
- **First audit:** `reports/chart-audit.md`, taken on 0.4.1. It found 1 broken, 64 wrong and 175 rough across 107 charts. Its Paper page is "Audit".
- **Codex review of 0.5.0:** done. Four Codex reviewers (gpt-6.1-sol, high effort) reviewed all 107 charts against `docs/REFINE.md` and the house style. They found 0 broken, 80 wrong, 112 rough and 36 ideas.
  - **In Paper:** file "Hairline" (`01M68STKFT3RQG6SCH9M64BSWA`), page "Review · 0.5.0": https://app.paper.design/file/01M68STKFT3RQG6SCH9M64BSWA/p-4-1. There is one artboard per family. Each card shows the chart's screenshot strip (Pink 1280, Pink 390, Dark 1280, Dark 390, Pink hover), Codex's one-line verdict and its notes, worst first.
  - **In the repo:** `reports/review-0.5.0/findings.json`. It holds one object per chart: id, name, verdict, sheet URL, and items with severity, where and note.
- **Nothing in progress:** no open PRs, no uncommitted work.

| Family                    | Charts | Wrong | Rough | Ideas |
| ------------------------- | ------ | ----- | ----- | ----- |
| L · Editorial set         | 19     | 18    | 21    | 9     |
| F · Basics                | 21     | 13    | 24    | 6     |
| R · Ranges and references | 6      | 5     | 10    | 0     |
| G · Glance                | 21     | 9     | 17    | 9     |
| B · Big plates            | 5      | 5     | 8     | 1     |
| D · Boards                | 20     | 14    | 17    | 4     |
| M · Maps                  | 2      | 2     | 3     | 1     |
| O · Originals and forms   | 13     | 14    | 12    | 6     |

## Next steps

1. **Fix the "wrong" findings** in batches: one PR per family, or one per cause where several charts share it. Fix shared causes in the kit. The causes that recur most:
   - A narrow chart drops the names it needs (B1, B3, B4, and others).
   - A tip repeats a label already printed on the chart.
   - A unit or key is missing (R3, R4, R5).
2. **Each PR needs:**
   - tests
   - the gate: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
   - a changeset
   - before and after shots at 1280 and 390, in light and dark, linked from the PR
   - a check in a real browser Squash-merge once the Vercel check passes.
3. After visual changes, run `pnpm generate:baselines` (needs Docker; never generate from macOS) and commit `acceptance/baselines/`.
4. Merge the "Version Packages" PR to release.
5. Optionally, file the findings in Linear (team HAI) and mark them fixed on the Paper page.

## Known items not yet checked or fixed

- **F3:** at 390, a pinned tip clips the "3" note disc.
- **G20:** the hyphenation of narrow column headers needs a second look.
- **Pyramid:** the tip can flip over its own row.
- **D13:** left as designed. Its 5% plan line crosses every bar, so the plan's name stays on its paper plate over the bars.

## Tooling

- **Capture scripts:** the screenshot scripts live in `/tmp/hairline-audit/` and may be gone.
  - `capture.mjs <outDir> [IDs]`: every chart in 3 palettes × 2 widths at 2× scale, plus tip shots. Import Playwright from `node_modules/@playwright/test/index.mjs`.
  - `ba.py`: builds a before/after sheet and uploads it with `stow put`.
- **Gallery:** `pnpm exec vite --port 5199 --strictPort`. Routes are `#/chart/<ID>`; the palette is stored in localStorage under `hairline.palette` (pink, paper or dark).
- **Lint:** `pnpm build:lib` before lint or tests whenever kit exports change, because tests import the built package. Autofix with `pnpm exec howells-fix <paths>`.

## "Wrong" findings by chart (Codex, 0.5.0)

Each line is the first sentence of each wrong note. The full notes and suggested fixes are in `reports/review-0.5.0/findings.json`.

- **L1 Spring arrivals**: The Whitethroat tip covers part of Mar 2025 at the fan's origin
- **L3 Autumn tides**: There is no numeric height scale or zero reference for either end of the stems
- **L4 New woodland**: The Wales tip hides the end of the Row explanation in the exemplar
- **L5 Named storms**: The Dudley tip covers the printed 2021/22 season label
- **L6 Grape families**: Heunisch weiss · 10 sits far below its hub; at 390 it reads as the caption for the nearby Muscat blanc cluster
- **L7 Four summits**: The rails have ticks but no numeric values or units, so Low/High and Minor/Prominent cannot quantify the differences
- **L8 Years gained**: Nothing identifies the periods, their reading order or the dot-area scale
- **L9 Coffee growers**: The Uganda tip covers the tops of the Indonesia, Ethiopia and Uganda column names
- **L10 Solar flares**: Two M-class wedges have the same dark crosshatch and outline, so neither is the single hero
- **L11 Sea areas**: Open circles and Tay's pale, shortened stem have no visible explanation
- **L13 Library earnings**: The left percentages float between stages without saying that they compare with the preceding stage, while the tip uses a share of the first stage
- **L14 A hundred donors**: Open donor circles sit on sector dividers, including the O negative boundary and the lone AB negative mark
- **L15 Days out**: The printed 44, 41, 41 and 30 have no unit; only the tip explains 'of 100'
- **L16 Letter pairs**: The N then N tip sits over the I→N hero cell, hiding 25 and neighbouring values / The row and column letters do not identify which is the first letter and which follows it
- **L17 A year of births**: No legend maps the dot densities to birth counts
- **L20 Twelve cheeses**: The values are per 100 g, but neither the plot nor the tip states that basis / Only Roquefort is named, leaving the eleven comparison paths anonymous
- **F4 Where the bill goes**: The Wholesale card hides several strokes of the Wholesale arc and repeats the adjacent 41% label
- **F6 Getting to work**: The 2021 swatch shows horizontal rules while its bars use upright ticks
- **F7 Medals by Games**: The Tokyo card covers the Paris 2024 total of 65 and the top of its Bronze segment
- **F8 Apple orchards**: 'Smaller' and 'Larger' never identify area, and neither axis has numeric ticks
- **F12 Museum visits**: Nothing identifies the open dots as 2019 and the filled dots as 2025
- **F13 Milk by use**: 'Other · 14%' becomes four thin strips occupying only a small fraction of the visible tile area / The small cheese tiles are unnamed; at 390 Other cheese and every product in Other also lose their names
- **F17 Daily price**: The chart shows prices such as 21.30 without an instrument or currency
- **F19 Fuels by quarter**: The panels wrap three plus one, leaving Other alone beside a large empty area
- **F20 Best yields**: The three ink countries are identified only by 'Smallest orchards, biggest yields' and '3 points' / The axes show only Yield and Smaller/Larger, with no numerical calibration or area name
- **F21 Faint crowd**: '3 points' does not identify the three emphasised countries or their yields / Smaller/Larger does not name orchard area, and there are no numeric axis ticks
- **R2 Reservoir level**: The below-target dots, trough and final 63% label have weak contrast against the normal-range band
- **R3 Museum visits over six million**: The open and filled endpoints have no year key, and the tip's arrow names neither period
- **R4 Orchard yield and size**: The 100 to 200k ha band is the only calibration of orchard area; Smaller/Larger never names the axis and yield has no numeric ticks
- **R5 Orders ahead**: The data is thousands of orders per day, but the axis, 53 label and tip print bare numbers
- **R6 Households buying**: The Textiles card covers Flooring's estimate dot and the middle of its interval
- **G4 Pollen in honey**: The Borage family tip covers the Pea family legend row
- **G8 Rain and river**: The 12 Dec tip cuts across the lower flanks of the nearby 10 Dec river peak
- **G9 Largest asteroids**: Hygiea, Vesta and Sylvia lose their labels in the cluster around Ceres
- **G13 Free time**: The 35–44 tip covers the top of its wedge and the boundary with 25–34
- **G20 Kit by income**: Headers split inside words as Tum-ble, Dishw-asher, Com-puter and Inter-net / The 8th/Computer tip covers the seventh-row values in the middle columns
- **G21 Nobel countries**: The Germany tip hides France’s values in the right-hand columns
- **G22 Free vote**: The Conservative → No tip sits across the central ribbon crossings and hides other routes
- **G23 From the Wey**: The reach caption extends left from Wey across the Mole and Cherwell links
- **B1 Land borders**: Only Russia is named, so the highlighted border links cannot be matched to countries
- **B3 Mammal tree**: Families and Orders still have headers and counts, but every family and order name is missing
- **B4 From Germany**: None of Germany's four direct neighbours is named
- **B5 From Piccadilly**: Northern retains the strongest crosshatched hub while the selected Piccadilly hub has the same pale hatch as the others / The web of direct and second-step links is so similar in weight that Piccadilly's route cannot be followed through it
- **D2 Generation by fuel**: Hover replaces Wind, Imports, Gas and Nuclear with bare values
- **D4 Monthly mix**: The key values change on hover without a printed date or clear selected column
- **D5 Demand change**: The −8% readout floats above the +20% gridline while its bar extends below zero
- **D7 Cleaner regions**: The narrow layout removes every g/kWh unit
- **D8 Gigawatt stations**: Drax has the same mid-tone dot as the other non-fossil stations
- **D9 Where energy goes**: Conversion loss 286 and Own use and losses 138 extend across the ribbons entering the Use column
- **D10 Wind, year on year**: Darragh runs straight into the +200% tick label
- **D11 2024 against 2023**: The right label column consumes about a third of the available width and crushes the dotted tails
- **D13 Gas against the plan**: The 2030 plan 5% plate cuts through the first bars, especially at 390 / The hovered 31% value sits above the 50% gridline, detached from its bar
- **D14 Share by fuel**: Hover changes the Gas fills without showing a selected month or any fuel percentages
- **D15 Vitals**: There are no dates or time ticks anywhere in the panels, so the curves and headline readings have no visible period
- **D19 Stations by fuel**: Gas and Wind dots merge into solid runs, hiding how many stations occupy each age
- **D20 Demand by region**: The value axis and North 96 label never name the unit or index basis
- **M2 Wine drinking**: Portugal loses its label and is too small to read as the hero; AU becomes the only labelled country / The legend shows bare thresholds and values such as 6.8 without a unit
- **O1 Summer of 1976**: The 3 Aug card covers the descending weekly-mean line and daily texture to its left
- **O2 Everyday prices**: The Tea card covers the 100% ruler label and the right-hand ticks
- **O3 Arable crops**: The final values and tip use bare counts such as 1,531k and 135k without naming what is measured
- **O5 Against normal**: The September card lies across the July–August peaks and their crosshatching
- **O6 Goods exports**: The Manufactures card covers the ribbon ends entering the Manufactures sector
- **O7 A year by month**: The 10 °C label sits on the top of the shape and its hatch
- **O8 Hot year**: The 31 July card crosses the 37.3 °C spike stem and covers later daily stems and part of the mean line
- **O9 Towers by county**: The tip prints 2093 towers without a thousands separator
- **O10 Land by nation**: The right-hand values are farmland shares, but their position beside the whole stack makes them look like totals
- **O11 Share of orders**: Wood changes from 21% to 22%, but the tip says 1% more / The starting and ending shares have no named comparison periods
- **O12 Against plan**: Searches reads 1.2 of 2 without a count scale or unit, while Members prints 3100 of 3000 without separators / The Searches card now follows its own row, but its bottom edge still covers the measure bar
- **O13 Members by age**: The 25–34 card covers the age label and most of its Workplaces bar while repeating values already printed
