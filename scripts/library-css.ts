// Builds the chart styles into lib/:
//   tokens.css    the palette variables, copied as written
//   theme.css     hairline.css for a Tailwind v4 host, told to scan the built charts
//   hairline.css  the same styles precompiled, for a host with no Tailwind at all:
//                 tokens, text roles, rules, textures and motion in one file
//
// The precompiled sheet is Tailwind's own output for the classes the charts
// emit, made safe to drop into any page: every selector sits under the
// Hairline root (.hl-root), Tailwind's theme values are written in, layers are
// flattened, and every custom property, keyframe name and Tailwind internal
// carries a Hairline prefix so nothing meets the host's own.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { compile } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { transform } from "lightningcss";

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const source = (name: string) => readFileSync(here(`../src/system/${name}`), "utf-8");
const out = (name: string, text: string) => {
  writeFileSync(here(`../lib/${name}`), text);
};

const KEYFRAMES = ["grow-y", "grow-x", "pop", "fade-in", "draw"];

/** Tailwind's compiled utilities for every class the built charts contain. */
const compiled = async () => {
  const css = [
    '@import "tailwindcss/theme.css" layer(theme);',
    '@import "tailwindcss/utilities.css" layer(utilities);',
    source("hairline.css"),
  ].join("\n");
  const compiler = await compile(css, {
    base: here("../src/system"),
    onDependency() {
      // Nothing to watch: this runs once per build.
    },
  });
  const scanner = new Scanner({
    sources: [
      { base: here("../lib/charts"), negated: false, pattern: "**/*.js" },
    ],
  });
  return compiler.build(scanner.scan());
};

/** The theme block's values, written into the rules that read them. */
const inlineTheme = (css: string) => {
  const block = /@layer theme \{\s*:root, :host \{(?<body>[^}]*)\}\s*\}/u.exec(
    css
  );
  const body = block?.groups?.body ?? "";
  let text = css.replace(block?.[0] ?? "", "");
  for (const found of body.matchAll(/(?<name>--[\w-]+):\s*(?<value>[^;]+);/gu)) {
    const { name = "", value = "" } = found.groups ?? {};
    text = text.replaceAll(`var(${name})`, value.replaceAll(/\s+/gu, " "));
  }
  return text;
};

/** The top-level rules of a stylesheet, as text. */
const topLevel = (css: string) => {
  const rules: string[] = [];
  let depth = 0;
  let start = 0;
  for (const [i, char] of [...css].entries()) {
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1).trim());
        start = i + 1;
      }
    }
  }
  return rules;
};

/**
 * Layers flattened away, and every style rule moved under the Hairline root
 * by nesting, which lightningcss then lowers to plain descendant selectors.
 * At-rules that cannot nest (keyframes, properties) stay at the top.
 */
const scoped = (css: string): string => {
  const bare = css
    .replaceAll(/\/\*[\s\S]*?\*\//gu, "")
    .replaceAll(/@layer [\w-]+;/gu, "");
  const wrapped = topLevel(bare).flatMap((rule): string[] => {
    if (rule.startsWith("@layer properties")) {
      return [];
    }
    if (rule.startsWith("@layer")) {
      return [scoped(rule.slice(rule.indexOf("{") + 1, -1))];
    }
    if (/^@(?:keyframes|property)\b/u.test(rule)) {
      return [rule];
    }
    return [`.hl-root {\n${rule}\n}`];
  });
  return wrapped.join("\n");
};

const flatten = (css: string) =>
  transform({
    code: Buffer.from(scoped(css)),
    filename: "hairline.css",
    minify: false,
    targets: { chrome: 100 << 16, firefox: 100 << 16, safari: 15 << 16 },
  }).code.toString();

const namespaced = (css: string) => {
  let text = css.replaceAll("--tw-", "--hl-tw-");
  for (const name of KEYFRAMES) {
    text = text
      .replaceAll(`@keyframes ${name} `, `@keyframes hl-${name} `)
      .replaceAll(`animation: ${name} `, `animation: hl-${name} `)
      .replaceAll(`animation-name: ${name}`, `animation-name: hl-${name}`);
  }
  return text;
};

out("tokens.css", source("tokens.css"));
out("theme.css", `@source "./charts";\n\n${source("hairline.css")}`);
out(
  "hairline.css",
  `${source("tokens.css")}\n${namespaced(flatten(inlineTheme(await compiled())))}`
);
