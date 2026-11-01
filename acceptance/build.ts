// Builds the acceptance pages into acceptance/dist: the client bundle, the
// package's own hairline.css (copied, as a host without Tailwind would), and
// one HTML file per page, each with the deck's server render in it.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { build } from "vite";

import { Deck } from "./fixture/deck.ts";
import type { DeckConfig } from "./fixture/deck.ts";

const dist = fileURLToPath(new URL("dist/", import.meta.url));
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

const PAGES = {
  compare: { animate: "off", layout: "compare" },
  mount: { animate: "mount", layout: "slides" },
  off: { animate: "off", layout: "slides" },
  scroll: { animate: "scroll", layout: "slides" },
} satisfies Record<string, DeckConfig>;

const css = `
html, body { margin: 0; background: #888; font-family: "Inter", ui-sans-serif, system-ui, sans-serif; }
@page { size: 1920px 1080px; margin: 0; }
.slide { box-sizing: border-box; width: 1920px; height: 1080px; padding: 65px 60px; overflow: hidden; break-after: page; }
.compare { display: flex; gap: 40px; padding: 24px; width: 1920px; box-sizing: border-box; }
.compare > .hl-root { flex: none; }
`;

rmSync(dist, { force: true, recursive: true });
await build({
  build: {
    emptyOutDir: true,
    lib: {
      entry: here("fixture/client.ts"),
      fileName: () => "client.js",
      formats: ["iife"],
      name: "deck",
    },
    minify: false,
    outDir: dist,
    // The package marks its chunks "use client" for React Server Components
    // hosts; a plain browser bundle has no use for the directive.
    rolldownOptions: {
      onLog: (level, log, handler) => {
        if (log.code !== "MODULE_LEVEL_DIRECTIVE") {
          handler(level, log);
        }
      },
    },
  },
  configFile: false,
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warn",
  publicDir: false,
});

mkdirSync(dist, { recursive: true });
copyFileSync(
  here("../lib/hairline.css"),
  fileURLToPath(new URL("hairline.css", `file://${dist}`))
);
for (const [name, config] of Object.entries(PAGES)) {
  const html = renderToString(createElement(Deck, config));
  writeFileSync(
    `${dist}${name}.html`,
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Hairline acceptance: ${name}</title>
<link rel="stylesheet" href="/hairline.css">
<style>${css}</style>
</head>
<body>
<div id="root">${html}</div>
<script type="application/json" id="config">${JSON.stringify(config)}</script>
<script src="/client.js"></script>
</body>
</html>
`
  );
}
