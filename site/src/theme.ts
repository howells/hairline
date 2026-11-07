// An Astro integration that gives every page one stylesheet, written from the
// two deriveTheme palettes: Blume's own tokens (page, text, rules, accent)
// and the `--hl-*` tokens the live charts draw with. Nothing is copied by
// hand, so the chrome cannot drift from the charts. The stylesheet is a
// virtual module; nothing is written to disk.
import type { ThemeProperties } from "@howells/hairline/theme";
import type { BlumeConfig } from "blume";

import { DARK, LIGHT, token } from "./palette";

type Integration = NonNullable<BlumeConfig["integrations"]>[number];

const ID = "virtual:hairline-site.css";

/** Resolved id: it ends in .css, so Vite treats the module as a stylesheet. */
const RESOLVED = "/@hairline-site/theme.css";

/** Blume's tokens for one mode, from the mode's Hairline palette. */
const chrome = (theme: ThemeProperties) => ({
  "--blume-accent": token(theme, "--hl-ink"),
  "--blume-accent-foreground": token(theme, "--hl-paper"),
  "--blume-action": token(theme, "--hl-ink"),
  "--blume-action-foreground": token(theme, "--hl-paper"),
  "--blume-background": token(theme, "--hl-paper"),
  "--blume-border": token(theme, "--hl-rule"),
  "--blume-code-background": token(theme, "--hl-paper"),
  "--blume-foreground": token(theme, "--hl-ink"),
  "--blume-muted": token(theme, "--hl-grid"),
  "--blume-muted-foreground": token(theme, "--hl-muted"),
  "--site-grain": token(theme, "--hl-grain"),
});

const block = (selector: string, properties: Record<string, string>) =>
  `${selector} {\n${Object.entries(properties)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n")}\n}`;

/*
 * Specificity: Blume sets its light tokens on :root and its dark ones on
 * :root[data-theme="dark"]. Both blocks here outrank both of those, and the
 * light block excludes dark, so neither mode leaks into the other.
 */
export const stylesheet = () =>
  [
    block(':root:root:not([data-theme="dark"])', chrome(LIGHT)),
    block(':root:root[data-theme="dark"]', chrome(DARK)),
    block(':root:not([data-theme="dark"]) .hl-root', LIGHT),
    block(':root[data-theme="dark"] .hl-root', DARK),
    "",
  ].join("\n\n");

export const hairlineTheme = (): Integration => ({
  hooks: {
    "astro:config:setup": ({ injectScript, updateConfig }) => {
      updateConfig({
        vite: {
          plugins: [
            {
              enforce: "pre",
              load: (id) => (id === RESOLVED ? stylesheet() : undefined),
              name: "hairline-site-theme",
              resolveId: (id) => (id === ID ? RESOLVED : undefined),
            },
          ],
        },
      });
      injectScript("page-ssr", `import "${ID}";`);
    },
  },
  name: "hairline-site-theme",
});
