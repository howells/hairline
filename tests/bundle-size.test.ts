// HAI-15: what a host pays for one chart. Each subpath is bundled the way a
// consumer's bundler would bundle it (minified, tree-shaken, React and ReactDOM
// left to the host as peers, every other dependency included) and the result
// is gzipped. The budgets are published in the README's Size section; a chart
// that outgrows its budget fails here, and raising a budget is a reviewed edit
// to both places.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { build } from "vite";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const root = fileURLToPath(new URL("../", import.meta.url));

const Target = z.object({ default: z.string(), types: z.string() });

const Manifest = z.object({
  exports: z.record(z.string(), z.union([z.string(), Target])),
});

const manifest = Manifest.parse(
  JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"))
);

/** Gzipped kilobytes (1 KB = 1,000 bytes) each chart may cost on its own. */
const BUDGETS_KB = {
  "dumbbell-queue": 52,
  "hairline-area": 62,
  "hairline-line": 62,
  "plumb-scatter": 55,
  "range-dots": 51,
  "rung-bars": 49,
  slope: 51,
} satisfies Record<string, number>;

const entryOf = (subpath: string) =>
  path.join(root, Target.parse(manifest.exports[`./${subpath}`]).default);

/** The gzipped size of one chart's bundle, in bytes. */
const gzipped = async (subpath: string) => {
  const result = await build({
    build: {
      lib: { entry: entryOf(subpath), fileName: "chart", formats: ["es"] },
      minify: true,
      rolldownOptions: { external: /^react(?:-dom)?(?:\/.*)?$/u },
      write: false,
    },
    configFile: false,
    logLevel: "silent",
  });

  const outputs = (Array.isArray(result) ? result : [result]).flatMap((item) =>
    "output" in item ? item.output : []
  );

  const code = outputs
    .map((chunk) => ("code" in chunk ? chunk.code : ""))
    .join("\n");

  return gzipSync(code).length;
};

describe("one chart's bundle, minified and gzipped", () => {
  it.each(Object.entries(BUDGETS_KB))(
    "%s stays inside its budget",
    async (name, budget) => {
      const bytes = await gzipped(name);
      expect(bytes).toBeLessThanOrEqual(budget * 1000);
    },
    60_000
  );
});
