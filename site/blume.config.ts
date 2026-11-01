import { registry } from "@howells/hairline/schema";
import { defineConfig } from "blume";
import { custom, filesystem } from "blume/sources";

import { agentDetails, markdownComponents } from "./src/agents";
import { chartPages } from "./src/chart-pages";
import { CODE_THEME } from "./src/code-theme";
import { DARK, LIGHT, token } from "./src/palette";
import { hairlineTheme } from "./src/theme";

const perMode = (name: `--hl-${string}`) => ({
  dark: token(DARK, name),
  light: token(LIGHT, name),
});

export default defineConfig({
  agents: {
    llmsTxt: { details: agentDetails(registry) },
    markdownComponents,
  },
  content: {
    sources: [filesystem({ root: "docs" }), custom(chartPages)],
  },
  deployment: { base: "/docs", site: "https://hairline.danielhowells.com" },
  description:
    "An engraved chart library for React: pixel-snapped hairlines, one ink hero per chart, and data an agent can check before it draws.",
  feedback: false,
  i18n: {
    defaultLocale: "en-GB",
    locales: [{ code: "en-GB", label: "English" }],
    ui: { "en-GB": { actions: { copied: "Copied" } } },
  },
  integrations: [hairlineTheme()],
  logo: { text: "Hairline" },
  markdown: { code: { icons: false, theme: CODE_THEME, wrap: true } },
  theme: {
    accent: perMode("--hl-ink"),
    background: perMode("--hl-paper"),
    fonts: { body: "inter", display: "inter" },
    mode: "system",
    radius: "none",
  },
  title: "Hairline",
});
