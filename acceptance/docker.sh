#!/bin/bash
# Run the acceptance suite in the official Playwright image, the same image CI
# compares in, so the screenshot baselines are what Linux draws. node_modules
# lives in a named volume so the macOS install is left alone.
# usage: acceptance/docker.sh [playwright args]   e.g. --update-snapshots
set -euo pipefail
cd "$(dirname "$0")/.."

IMAGE="mcr.microsoft.com/playwright:v1.64.1-noble"

docker run --rm --ipc=host \
  -v "$PWD":/work \
  -v hairline-acceptance-node-modules:/work/node_modules \
  -w /work \
  "$IMAGE" \
  bash -c 'corepack enable && pnpm install --frozen-lockfile && pnpm build:lib && pnpm exec playwright test -c acceptance/playwright.config.ts "$@"' _ "$@"
