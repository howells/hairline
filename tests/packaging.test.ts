// Packaging seam: the built lib/ and the `npm pack` tarball, looked at the way
// a consumer's bundler and registry would. Run with `pnpm test`, which builds
// lib/ first.
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));

interface Manifest {
  dependencies: Record<string, string>;
  exports: Record<string, string | { default: string; types: string }>;
  private: boolean;
}
const manifest = JSON.parse(
  readFileSync(path.join(root, "package.json"), "utf-8")
) as Manifest;

/** The built file a subpath resolves to. */
const entryOf = (subpath: string) => {
  const target = manifest.exports[subpath];
  if (target === undefined || typeof target === "string") {
    throw new Error(`No code export named ${subpath}`);
  }
  return path.join(root, target.default);
};

interface Graph {
  bare: Set<string>;
  bytes: number;
  files: Set<string>;
}

/** Everything a bundler would pull in for one entry: files and bare imports. */
const reach = (entry: string): Graph => {
  const graph: Graph = { bare: new Set(), bytes: 0, files: new Set() };
  const queue = [entry];
  for (const file of queue) {
    if (graph.files.has(file)) {
      continue;
    }
    graph.files.add(file);
    graph.bytes += statSync(file).size;
    const text = readFileSync(file, "utf-8");
    for (const match of text.matchAll(
      /(?:from|import)\s*["'](?<spec>[^"']+)["']/gu
    )) {
      const spec = match.groups?.spec ?? "";
      if (spec.startsWith(".")) {
        queue.push(path.resolve(path.dirname(file), spec));
      } else {
        graph.bare.add(spec);
      }
    }
  }
  return graph;
};

const CHARTS = [
  "rung-bars",
  "hairline-line",
  "hairline-area",
  "plumb-scatter",
  "dumbbell-queue",
  "slope",
];
const heavy = (graph: Graph) =>
  [...graph.files].filter((file) =>
    /(?:atlas|node_modules|\.data\.js|\.tenors|\/maps\/)/u.test(file)
  );

describe("per-chart subpaths", () => {
  it.each(CHARTS)("%s bundles no atlas, force layout or demo data", (name) => {
    const graph = reach(entryOf(`./${name}`));
    expect(heavy(graph)).toEqual([]);
    const bare = [...graph.bare];
    expect(bare.filter((spec) => /force|topojson|atlas/u.test(spec))).toEqual(
      []
    );
    // A single chart is a small slice of the package.
    expect(graph.bytes).toBeLessThan(250_000);
  });

  it("each subpath exports its chart", async () => {
    const mod: Record<string, unknown> = await import(
      `@howells/hairline/${CHARTS[0]}`
    );
    expect(typeof mod.RungBars).toBe("function");
  });

  it("the main entry no longer reaches the map atlases", () => {
    expect(heavy(reach(entryOf(".")))).toEqual([]);
  });
});

describe("maps subpath", () => {
  it("carries the atlases and the map charts", () => {
    const graph = reach(entryOf("./maps"));
    expect(
      [...graph.files].some((file) => file.includes("countries-110m"))
    ).toBe(true);
  });

  it("keeps atlases out of runtime dependencies", () => {
    expect(Object.keys(manifest.dependencies)).not.toEqual(
      expect.arrayContaining(["world-atlas"])
    );
    expect(manifest.dependencies["us-atlas"]).toBeUndefined();
    expect(manifest.dependencies["world-atlas"]).toBeUndefined();
  });
});

describe("React-free entries", () => {
  it.each(["./schema", "./theme"])("%s imports without React", (subpath) => {
    const bare = [...reach(entryOf(subpath)).bare];
    expect(bare.filter((spec) => /^react(?:-dom)?(?:\/|$)/u.test(spec))).toEqual(
      []
    );
  });
});

describe("tarball", () => {
  const packed = () => {
    const out = execFileSync(
      "npm",
      ["pack", "--dry-run", "--json", "--ignore-scripts"],
      { cwd: root, encoding: "utf-8" }
    );
    const [info] = JSON.parse(out) as { files: { path: string }[] }[];
    return (info?.files ?? []).map((file) => file.path);
  };

  it("has no source maps and no node_modules paths", () => {
    const files = packed();
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((file) => file.endsWith(".map"))).toEqual([]);
    expect(files.filter((file) => file.includes("node_modules"))).toEqual([]);
  });

  it("every exports target is in it", () => {
    const files = new Set(packed());
    const targets = Object.values(manifest.exports)
      .flatMap((target) =>
        typeof target === "string" ? [target] : [target.default, target.types]
      )
      .filter((target) => !target.includes("*"))
      .map((target) => target.replace(/^\.\//u, ""));
    expect(targets.filter((target) => !files.has(target))).toEqual([]);
  });
});

describe("types under NodeNext", () => {
  it("resolve every relative import in the emitted declarations", () => {
    // skipLibCheck is off in the fixture: an unresolved import in a .d.ts is
    // otherwise silently `any`.
    expect(() =>
      execFileSync(
        "pnpm",
        ["exec", "tsc", "-p", "tests/fixtures/nodenext/tsconfig.json"],
        { cwd: root, encoding: "utf-8", stdio: "pipe" }
      )
    ).not.toThrow();
  });
});

describe("release tooling", () => {
  it("configures Changesets with a changelog", () => {
    const config = JSON.parse(
      readFileSync(path.join(root, ".changeset/config.json"), "utf-8")
    ) as { access: string; changelog: unknown };
    expect(config.changelog).toBeTruthy();
    expect(config.access).toBe("public");
  });

  it("generates CHANGELOG.md from a changeset", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "hairline-changeset-"));
    cpSync(path.join(root, ".changeset"), path.join(dir, ".changeset"), {
      recursive: true,
    });
    writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: "@howells/hairline", private: true, version: "0.1.0" })
    );
    writeFileSync(
      path.join(dir, ".changeset/example.md"),
      '---\n"@howells/hairline": minor\n---\n\nAn example change.\n'
    );
    execFileSync(
      path.join(root, "node_modules/.bin/changeset"),
      ["version"],
      { cwd: dir, stdio: "pipe" }
    );
    expect(readFileSync(path.join(dir, "CHANGELOG.md"), "utf-8")).toContain(
      "An example change."
    );
  });

  it("has a release workflow gated on the first publish", () => {
    const file = path.join(root, ".github/workflows/release.yml");
    expect(existsSync(file)).toBe(true);
    const text = readFileSync(file, "utf-8");
    expect(text).toContain("id-token: write");
    expect(text).toContain("vars.HAIRLINE_FIRST_PUBLISH_DONE == 'true'");
  });

  it("stays private until the licence is settled", () => {
    expect(manifest.private).toBe(true);
  });
});
