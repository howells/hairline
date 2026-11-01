// Tidies lib/ for the tarball, after the build and the declaration emit:
//  - the bundled map atlases leave lib/node_modules for lib/vendor, so no
//    node_modules path ships;
//  - the emitted declarations get the .js extensions NodeNext resolution
//    needs on relative imports (tsc leaves them bare).
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const lib = new URL("../lib/", import.meta.url).pathname;

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

// lib/node_modules/.pnpm/<id>/node_modules/<pkg>/... -> lib/vendor/<pkg>/...
const NESTED = /node_modules\/\.pnpm\/[^/]+\/node_modules\//gu;
const nodeModules = path.join(lib, "node_modules");
if (existsSync(nodeModules)) {
  for (const file of walk(nodeModules)) {
    const relative = path
      .relative(lib, file)
      .replaceAll(path.sep, "/")
      .replace(NESTED, "vendor/");
    const target = path.join(lib, relative);
    mkdirSync(path.dirname(target), { recursive: true });
    renameSync(file, target);
  }
  rmSync(nodeModules, { force: true, recursive: true });
}
for (const file of walk(lib).filter((name) => name.endsWith(".js"))) {
  const text = readFileSync(file, "utf-8");
  const next = text.replace(NESTED, "vendor/");
  if (next !== text) {
    writeFileSync(file, next);
  }
}

// Declarations: ./x -> ./x.js, or ./x/index.js when x is a directory.
const SPECIFIER =
  /(?<head>\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)(?<quote>["'])(?<spec>\.{1,2}(?:\/[^"']*)?)\k<quote>/gu;
for (const file of walk(path.join(lib, "types")).filter((name) =>
  name.endsWith(".d.ts")
)) {
  const text = readFileSync(file, "utf-8");
  const next = text.replace(
    SPECIFIER,
    (match, head: string, quote: string, spec: string) => {
      if (/\.(?:js|css|json)$/u.test(spec)) {
        return match;
      }
      const resolved = path.resolve(path.dirname(file), spec);
      const fixed = existsSync(`${resolved}.d.ts`)
        ? `${spec}.js`
        : `${spec.replace(/\/$/u, "")}/index.js`;
      return `${head}${quote}${fixed}${quote}`;
    }
  );
  if (next !== text) {
    writeFileSync(file, next);
  }
}
