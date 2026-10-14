# Fieldnote: the one world every chart draws from

Every chart's demo data describes one fictional company, so the grid reads as one paper's coverage of one business. Fieldnote makes a note-taking and research app. Its year is 2026; time series run from January 2025 to December 2026 unless a chart needs a different span.

No chart may reuse the labels or numbers of its reference screenshot (`reference/`, mapping in `docs/BRIEF.md`). Keep each chart's shape and story (the same kind of distribution, a clear hero), but with Fieldnote's names and fresh numbers. Data stays deterministic: fixed values or seeded randomness (`src/lib/random.ts`), never `Math.random`.

## Names to use

- **Features** (twelve, in roughly this order of size): Notes, Search, Clips, Canvas, Tags, Sync, Share, Comments, Templates, Calendar, Export, Assistant. Use as many as a chart needs, from the top.
- **Plans:** Free, Plus, Pro, Business, Enterprise.
- **Platforms:** Web, iOS, Android, Desktop.
- **Teams:** Product, Platform, Growth, Data, Design, Support, Infra, Mobile.
- **Acquisition channels:** Search, Word of mouth, Newsletter, Podcasts, Partners.
- **Cloud regions:** US East, US West, EU West, EU Central, AP South, AP Northeast.
- **Cities** (twelve): London, Berlin, Lisbon, Stockholm, Toronto, Austin, Mexico City, São Paulo, Nairobi, Bangalore, Seoul, Melbourne.
- **Countries with users** (for the world map): US, UK, DE, FR, CA, BR, IN, JP, AU, KR, MX, NG, KE, SE, NL (others "not opened").
- **Integrations:** Google Drive, Dropbox, Slack, Zoom, GitHub, Linear, Figma, Notion import, Readwise, Zotero, Calendar, Email.
- **Services** (systems charts): api, auth, search, sync, clips, canvas, export, billing, notify, assistant.
- **Incident causes:** Deploy, Config, Capacity, Dependency, Database, Cache, Network, Certificate, DNS, Queue, Human, Unknown.
- **Survey answers** ("What gets in the way of your work?"): Notes I never find again, Too many tools, Meetings eat the day, Losing context between projects.
- **Moods** (people out of 100): Devoted 38, Curious 31, Wavering 19, Lapsed 12.
- **Funnel:** Visitors 52,000 → Trials 9,800 → Activated 4,100 → Retained 2,300 → Paying 1,250.
- **Brand traits** (pairs): Calm–Lively, Personal–Professional, Simple–Powerful, Familiar–Novel.

## Scale, so numbers agree across charts

- About 410,000 monthly active users at the end of 2026, 1.6 million sign-ups to date.
- Annual recurring revenue about $18.4m at the end of 2026 (up from $14.9m a year earlier); Business and Enterprise together about 55% of it. By plan, 2026 (2025): Enterprise $5.8m ($4.1m), Pro $5.1m ($4.4m), Business $4.3m ($3.4m), Plus $3.2m ($3.0m).
- About 120 engineers in eight teams; roughly 6 to 20 deploys a working day.
- Support: about 2,000 tickets a month; median first response under an hour on chat, a few hours on email.

These are guides, not constraints: a chart may show its own slice, but its numbers should be plausible against them.
