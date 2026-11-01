#!/bin/bash
# Run the acceptance suite in the official Playwright image, the one the
# baselines are made in, so the screenshot comparison is what Linux draws. Both
# node_modules (the package's and the docs site's) live in named volumes so the
# macOS installs are left alone.
# usage: acceptance/docker.sh [playwright args]   e.g. --update-snapshots
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE="mcr.microsoft.com/playwright:v1.64.1-noble"

docker run --rm --ipc=host \
  -v "$PWD":/work \
  -v hairline-acceptance-node-modules:/work/node_modules \
  -v hairline-acceptance-site-node-modules:/work/site/node_modules \
  -w /work \
  "$IMAGE" \
  bash -c 'corepack enable && pnpm install --frozen-lockfile && pnpm build:lib && pnpm exec playwright test -c acceptance/playwright.config.ts "$@"' _ "$@"
