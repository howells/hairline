// Writes the library's two entry points. src/index.ts exports every chart
// the gallery shows, by its component name; src/kit.ts exports the parts the
// charts are drawn from, name by name. Run after adding a chart or a part:
// node scripts/library-index.ts
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { z } from "zod";

const src = new URL("../src/", import.meta.url).pathname;
const charts = path.join(src, "charts");
// Two families each have a CircularGraph; the beaded one is renamed.
const RENAME = new Map([["big/circular-graph", "CircularBeadGraph"]]);
const SKIP = new Set(["palette"]);
// Map charts bundle their atlases, so they leave the main entry for ./maps.
const MAPS = "maps";
// The charts that ship with a subpath of their own (`@howells/hairline/rung-bars`),
// each importable without the rest of the package.
const SUBPATH_CHARTS = new Set([
  "DumbbellQueue",
  "HairlineArea",
  "HairlineLine",
  "PlumbScatter",
  "RangeDots",
  "RungBars",
  "Slope",
]);
// The frame, hover, text roles, rules, marks and textures every chart uses.
const KIT = [
  "axes",
  "core",
  "facet-layout",
  "facets",
  "fills",
  "glyph-box",
  "glyph-key",
  "hooks",
  "hover",
  "markers",
  "marks",
  "motion",
  "plot-note",
  "pointer",
  "pointer-model",
  "rules",
  "svg",
  "text",
  "texture",
  "texture-ids",
  "use-pointer",
];

interface ChartFile {
  family: string;
  name: string;
  text: string;
}

const read = (file: string) => readFileSync(file, "utf-8");

// Public charts with no gallery entry of their own: the board draws Slope
// inside its own frame, so no entries file names the bare plot.
const used = new Set<string>(["Slope"]);
const files: ChartFile[] = [];
for (const family of readdirSync(charts, { withFileTypes: true })) {
  if (!family.isDirectory() || SKIP.has(family.name)) {
    continue;
  }
  for (const name of readdirSync(path.join(charts, family.name))) {
    const text = read(path.join(charts, family.name, name));
    if (/^(?:entries-[ab]|index)\.tsx$/u.test(name)) {
      for (const match of text.matchAll(/<(?<tag>[A-Z][A-Za-z0-9]+)/gu)) {
        used.add(match.groups?.tag ?? "");
      }
    } else if (name.endsWith(".tsx")) {
      files.push({ family: family.name, name, text });
    }
  }
}

const chartLines: string[] = [];
const mapLines: string[] = [];
const chartNames: string[] = [];
const subpaths: { component: string; line: string; slug: string }[] = [];
for (const { family, name, text } of files.toSorted((a, b) =>
  `${a.family}/${a.name}`.localeCompare(`${b.family}/${b.name}`)
)) {
  const at = `${family}/${name.replace(/\.tsx$/u, "")}`;
  for (const match of text.matchAll(
    /^export const (?<component>[A-Z][A-Za-z0-9]+)/gmu
  )) {
    const component = match.groups?.component ?? "";
    if (!used.has(component)) {
      continue;
    }
    const alias = RENAME.get(at);
    chartNames.push(alias ?? component);
    if (SUBPATH_CHARTS.has(component)) {
      subpaths.push({
        component,
        line: `export { ${component} } from "../charts/${at}";`,
        slug: name.replace(/\.tsx$/u, ""),
      });
    }
    (family === MAPS ? mapLines : chartLines).push(
      alias === undefined
        ? `export { ${component} } from "./charts/${at}";`
        : `export { ${component} as ${alias} } from "./charts/${at}";`
    );
  }
}
const dupes = chartNames.filter((n, i) => chartNames.indexOf(n) !== i);
if (dupes.length > 0) {
  throw new Error(`Duplicate exports: ${dupes.join(", ")}`);
}

/** A module's own exports, values and types apart. */
const exportsOf = (text: string) => {
  const values: string[] = [];
  const types: string[] = [];
  for (const match of text.matchAll(
    /^export (?<kind>const|function|interface|type) (?<name>\w+)/gmu
  )) {
    const { kind = "", name = "" } = match.groups ?? {};
    (kind === "interface" || kind === "type" ? types : values).push(name);
  }
  // An overloaded function is declared more than once.
  return { types: [...new Set(types)], values: [...new Set(values)] };
};

const kitLines = KIT.flatMap((name) => {
  const file = ["ts", "tsx"]
    .map((extension) => path.join(charts, `${name}.${extension}`))
    .find((candidate) => {
      try {
        read(candidate);
        return true;
      } catch {
        return false;
      }
    });
  if (file === undefined) {
    throw new Error(`No kit module named ${name}`);
  }
  const { types, values } = exportsOf(read(file));
  return [
    ...(values.length > 0
      ? [`export { ${values.join(", ")} } from "./charts/${name}";`]
      : []),
    ...(types.length > 0
      ? [`export type { ${types.join(", ")} } from "./charts/${name}";`]
      : []),
  ];
});

// src/schema/ is React-free: one module per chart (props schema, inferred
// types) plus the shared format, validate and registry modules. The chart
// modules' types ride along with the charts in index.ts; every schema
// module's exports make up the React-free `schema` entry.
const SHARED = new Set(["format", "registry", "validate"]);
const schemaDir = path.join(src, "schema");
const schemaModules = readdirSync(schemaDir)
  .filter((name) => name.endsWith(".ts"))
  .map((name) => name.replace(/\.ts$/u, ""))
  .toSorted();
const schemaLines: string[] = [];
const chartTypeLines: string[] = [];
for (const name of schemaModules) {
  const { types, values } = exportsOf(read(path.join(schemaDir, `${name}.ts`)));
  if (values.length > 0) {
    schemaLines.push(
      `export { ${values.join(", ")} } from "./schema/${name}";`
    );
  }
  if (types.length > 0) {
    schemaLines.push(
      `export type { ${types.join(", ")} } from "./schema/${name}";`
    );
    if (!SHARED.has(name)) {
      chartTypeLines.push(
        `export type { ${types.join(", ")} } from "./schema/${name}";`
      );
    }
  }
}

const GENERATED = "Generated by scripts/library-index.ts; do not edit.";
writeFileSync(
  path.join(src, "index.ts"),
  `/* Every Hairline chart. ${GENERATED} */\n${[...chartLines, ...chartTypeLines].join("\n")}\n`
);
writeFileSync(
  path.join(src, "schema.ts"),
  `/*\n * The React-free side: schemas, inferred types, validation, formatters and\n * the chart registry. ${GENERATED}\n */\n${schemaLines.join("\n")}\n`
);
writeFileSync(
  path.join(src, "kit.ts"),
  `/*\n * The parts every Hairline chart is built from, for drawing a new chart in\n * the same hand. ${GENERATED}\n */\n${kitLines.join("\n")}\n`
);
writeFileSync(
  path.join(src, "maps.ts"),
  `/*\n * The map charts. They carry their atlases, so they sit apart from the main\n * entry. ${GENERATED}\n */\n${mapLines.join("\n")}\n`
);

// One entry per subpath chart: the component and its schema types, nothing else.
const entriesDir = path.join(src, "entries");
rmSync(entriesDir, { force: true, recursive: true });
mkdirSync(entriesDir);
for (const { component, line, slug } of subpaths) {
  const { types } = exportsOf(read(path.join(schemaDir, `${slug}.ts`)));
  const typeLine =
    types.length > 0
      ? `\nexport type { ${types.join(", ")} } from "../schema/${slug}";`
      : "";
  writeFileSync(
    path.join(entriesDir, `${slug}.ts`),
    `/* ${component} on its own. ${GENERATED} */\n${line}${typeLine}\n`
  );
}
if (subpaths.length !== SUBPATH_CHARTS.size) {
  throw new Error("A subpath chart was not found");
}

// The exports map: each subpath chart and ./maps are generated here; the
// other entries (".", kit, schema, theme, frame, stylesheets) stay as written.
const manifestUrl = new URL("../package.json", import.meta.url);
const Entry = z.object({ default: z.string(), types: z.string() });
const Manifest = z.looseObject({
  exports: z.record(z.string(), z.union([z.string(), Entry])),
});
type Exported = z.infer<typeof Manifest>["exports"][string];
const manifest = Manifest.parse(JSON.parse(readFileSync(manifestUrl, "utf-8")));
const entry = (js: string, dts: string) => ({
  default: `./lib/${js}.js`,
  types: `./lib/types/${dts}.d.ts`,
});
// `types` comes before `default`: a resolver takes the first condition that
// matches. The pairs are written as entries so the key sorter leaves the order.
const typesFirst = (value: Exported) => {
  const conditions = Entry.safeParse(value);
  return conditions.success
    ? Object.fromEntries([
        ["types", conditions.data.types],
        ["default", conditions.data.default],
      ])
    : value;
};
const generatedKeys = new Set([
  "./maps",
  ...subpaths.map(({ slug }) => `./${slug}`),
]);
const exportsMap: Record<string, Exported> = {};
for (const [key, value] of Object.entries(manifest.exports)) {
  if (!generatedKeys.has(key)) {
    exportsMap[key] = value;
  }
}
exportsMap["./maps"] = entry("maps", "maps");
for (const { slug } of subpaths) {
  exportsMap[`./${slug}`] = entry(`entries/${slug}`, `entries/${slug}`);
}
const ordered = Object.fromEntries(
  Object.entries(exportsMap).map(([key, value]) => [key, typesFirst(value)])
);
writeFileSync(
  manifestUrl,
  `${JSON.stringify({ ...manifest, exports: ordered }, null, 2)}\n`
);
console.log(
  `${chartLines.length} charts, ${mapLines.length} maps, ${subpaths.length} subpaths, ${KIT.length} kit modules`
);
