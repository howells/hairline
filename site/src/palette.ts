// The site's two modes, from the package's own theme function: the gallery's
// Paper for light and its Dark for dark. The charts, the page chrome and the
// code colours all read from these, so the docs and the charts are one hand.
import { deriveTheme } from "@howells/hairline/theme";
import type { ThemeProperties } from "@howells/hairline/theme";

export const LIGHT: ThemeProperties = deriveTheme({
  ink: "#1d1d1b",
  paper: "#fbfbf9",
});

export const DARK: ThemeProperties = deriveTheme({
  ink: "#f0eeeb",
  mode: "dark",
  paper: "#181715",
});

/** One token of a mode, which deriveTheme always sets. */
export const token = (theme: ThemeProperties, name: `--hl-${string}`) => {
  const value = theme[name];

  if (value === undefined) {
    throw new Error(`deriveTheme set no ${name}`);
  }

  return value;
};
