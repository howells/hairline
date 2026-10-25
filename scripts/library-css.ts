// Copies the chart styles into lib/: tokens.css (the palette variables) and
// theme.css (hairline.css, told to scan the built charts for class names).
import { readFileSync, writeFileSync } from "node:fs";

const source = (name: string) =>
  readFileSync(new URL(`../src/system/${name}`, import.meta.url), "utf-8");
const out = (name: string, text: string) => {
  writeFileSync(new URL(`../lib/${name}`, import.meta.url), text);
};

out("tokens.css", source("tokens.css"));
out("theme.css", `@source "./charts";\n\n${source("hairline.css")}`);
