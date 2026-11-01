// Code in the charts' hand: a Shiki theme on the grey ramp, one ink for what
// names things and quieter steps for the rest. Every step used here reads at
// AA on the paper (l3 and below do not, so code never uses them).
import type { ThemeProperties } from "@howells/hairline/theme";

import { DARK, LIGHT, token } from "./palette";

const rule = (scope: string[], foreground: string) => ({
  scope,
  settings: { foreground },
});

const codeTheme = (
  name: string,
  type: "dark" | "light",
  theme: ThemeProperties
) => {
  const ink = token(theme, "--hl-ink");
  const quiet = token(theme, "--hl-l2");
  return {
    colors: {
      "editor.background": token(theme, "--hl-paper"),
      "editor.foreground": token(theme, "--hl-l1"),
    },
    name,
    tokenColors: [
      rule(
        ["comment", "punctuation.definition.comment"],
        token(theme, "--hl-muted")
      ),
      rule(["string", "string.quoted", "string.template"], quiet),
      rule(["punctuation", "meta.brace", "meta.delimiter"], quiet),
      rule(
        [
          "keyword",
          "storage",
          "constant",
          "entity.name",
          "support.class",
          "support.type.property-name",
          "meta.object-literal.key",
        ],
        ink
      ),
    ],
    type,
  };
};

export const CODE_THEME = {
  dark: codeTheme("hairline-dark", "dark", DARK),
  light: codeTheme("hairline-light", "light", LIGHT),
};
