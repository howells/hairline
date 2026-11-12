# Hairline

An engraved chart library for React (`@howells/hairline`): ninety charts, pixel-snapped hairlines, one ink hero per chart, banknote textures. `README.md` has the design intent; `site/` is the docs site (blume).

## Commands

```sh
pnpm dev          # gallery, http://localhost:5173
pnpm typecheck
pnpm lint         # @howells/lint; lint:fix to autofix
pnpm test         # builds the library, typechecks tests, runs vitest
pnpm build        # app + docs site (build:lib builds the package)
pnpm e2e          # visual acceptance suite, needs Docker; see acceptance/README.md
```

Never regenerate `acceptance/baselines/` from macOS; use `pnpm generate:baselines` (Docker).

## Releases

Versioning uses changesets. For a user-visible change, run `pnpm changeset` and commit the generated file with the change. Merging to `main` makes `.github/workflows/release.yml` open a "Version packages" PR; merging that publishes to npm. The workflow is dormant until the first manual publish is done and the `HAIRLINE_FIRST_PUBLISH_DONE` repo variable is `true`.

Don't overwrite others' uncommitted work.

## Agent skills

### Issue tracker

Issues live in Linear (howells, HAI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default triage labels. See `~/Sites/home/docs/agents/triage-labels.md`.

### Domain docs

Single-context. See `~/Sites/home/docs/agents/domain.md`.
