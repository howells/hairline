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

import { RungBars } from "@howells/hairline/rung-bars";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const root = fileURLToPath(new URL("../", import.meta.url));

const Target = z.object({ default: z.string(), types: z.string() });

const Manifest = z.object({
  dependencies: z.record(z.string(), z.string()),
  exports: z.record(z.string(), z.union([z.string(), Target])),
  license: z.string(),
  private: z.boolean().optional(),
});

const manifest = Manifest.parse(
  JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"))
);

/** The built file a subpath resolves to. */
const entryOf = (subpath: string) => {
  const target = Target.parse(manifest.exports[subpath]);

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
  "range-dots",
  "dumbbell-queue",
  "slope",
];

const heavy = (graph: Graph) =>
  [...graph.files].filter((file) =>
    /(?:atlas|node_modules|vendor|\.data\.js|\.tenors|\/maps\/)/u.test(file)
  );

describe("per-chart subpaths", () => {
  it.each(CHARTS)("%s bundles no atlas, force layout or demo data", (name) => {
    const graph = reach(entryOf(`./${name}`));
    expect(heavy(graph)).toStrictEqual([]);
    const bare = [...graph.bare];
    expect(
      bare.filter((spec) => /force|topojson|atlas/u.test(spec))
    ).toStrictEqual([]);
  });

  it("a subpath exports its chart", () => {
    expect(RungBars).toBeTypeOf("function");
  });

  it("the main entry no longer reaches the map atlases", () => {
    const graph = reach(entryOf("."));
    expect(
      [...graph.files].filter((file) =>
        /(?:atlas|node_modules|vendor)/u.test(file)
      )
    ).toStrictEqual([]);
    expect(
      [...graph.bare].filter((spec) => /topojson|atlas/u.test(spec))
    ).toStrictEqual([]);
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
    expect(Object.keys(manifest.dependencies)).not.toStrictEqual(
      expect.arrayContaining(["world-atlas"])
    );
    expect(manifest.dependencies["us-atlas"]).toBeUndefined();
    expect(manifest.dependencies["world-atlas"]).toBeUndefined();
  });
});

describe("React-free entries", () => {
  it.each(["./schema", "./theme"])("%s imports without React", (subpath) => {
    const bare = [...reach(entryOf(subpath)).bare];
    expect(
      bare.filter((spec) => /^react(?:-dom)?(?:\/|$)/u.test(spec))
    ).toStrictEqual([]);
  });
});

const packed = () => {
  const out = execFileSync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts"],
    { cwd: root, encoding: "utf-8" }
  );

  // npm 11 and earlier print an array of packs; npm 12 keys them by name.
  const pack = z.object({ files: z.array(z.object({ path: z.string() })) });
  const packs = z.union([z.array(pack), z.record(z.string(), pack)]);
  const parsed = packs.parse(JSON.parse(out));
  const [info] = Array.isArray(parsed) ? parsed : Object.values(parsed);

  return (info?.files ?? []).map((file) => file.path);
};

describe("exports conditions", () => {
  it("lists types before default in every condition object", () => {
    const raw = z
      .object({ exports: z.record(z.string(), z.unknown()) })
      .parse(
        JSON.parse(readFileSync(path.join(root, "package.json"), "utf-8"))
      );

    const orders = Object.entries(raw.exports).flatMap(([subpath, target]) => {
      const conditions = z.record(z.string(), z.string()).safeParse(target);

      return conditions.success
        ? [{ keys: Object.keys(conditions.data), subpath }]
        : [];
    });

    expect(orders.length).toBeGreaterThan(10);
    expect(
      orders.filter(({ keys }) => keys.join(",") !== "types,default")
    ).toStrictEqual([]);
  });
});

describe("tarball", () => {
  it("has no source maps and no node_modules paths", () => {
    const files = packed();
    expect(files.length).toBeGreaterThan(50);
    expect(files.filter((file) => file.endsWith(".map"))).toStrictEqual([]);
    expect(files.filter((file) => file.includes("node_modules"))).toStrictEqual(
      []
    );
  });

  it("every exports target is in it", () => {
    const files = new Set(packed());

    const targets = Object.values(manifest.exports)
      .flatMap((target) => {
        const parsed = Target.safeParse(target);

        return parsed.success
          ? [parsed.data.default, parsed.data.types]
          : [z.string().parse(target)];
      })
      .filter((target) => !target.includes("*"))
      .map((target) => target.replace(/^\.\//u, ""));

    expect(targets.filter((target) => !files.has(target))).toStrictEqual([]);
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
    const config = z
      .object({ access: z.string(), changelog: z.string() })
      .parse(
        JSON.parse(
          readFileSync(path.join(root, ".changeset/config.json"), "utf-8")
        )
      );

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
      JSON.stringify({
        name: "@howells/hairline",
        version: "0.1.0",
      })
    );
    writeFileSync(path.join(dir, "pnpm-workspace.yaml"), "packages:\n  - .\n");
    writeFileSync(
      path.join(dir, ".changeset/example.md"),
      '---\n"@howells/hairline": minor\n---\n\nAn example change.\n'
    );
    execFileSync(path.join(root, "node_modules/.bin/changeset"), ["version"], {
      cwd: dir,
      stdio: "pipe",
    });
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

  it("is MIT licensed and publishable", () => {
    expect(manifest.license).toBe("MIT");
    expect(manifest.private).toBeUndefined();
    expect(readFileSync(path.join(root, "LICENSE"), "utf-8")).toContain(
      "MIT License"
    );
  });
});
