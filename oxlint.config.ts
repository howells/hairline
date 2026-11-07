import {
  playwrightJsPlugins,
  playwrightOverride,
} from "@howells/lint/oxlint/playwright";
import react from "@howells/lint/oxlint/react";

/*
 * The type case (see the @theme block in src/system/app.css): two HTML
 * sizes and two weights. Chart text uses the t-* roles, which this rule
 * cannot misspell into a raw size.
 */
const TYPE_CASE = ["text-tick", "text-small", "font-medium", "font-semibold"];

export default {
  extends: [react],
  jsPlugins: playwrightJsPlugins,
  overrides: [
    {
      // Keys set their line flat (leading 1) so a row of swatches and
      // figures centres on the marks; they own that one leading.
      files: ["src/charts/board/key.tsx", "src/charts/board/heatmap.tsx"],
      rules: {
        "howells/no-raw-type-utilities": [
          "error",
          { allow: [...TYPE_CASE, "leading-none"] },
        ],
      },
    },
    {
      // The acceptance suite is Playwright's, not Vitest's: the lint preset
      // swaps the Vitest rules for the Playwright ones.
      ...playwrightOverride(["acceptance/*.spec.ts"]),
    },
  ],
  rules: {
    "howells/no-raw-type-utilities": ["error", { allow: TYPE_CASE }],
    // <Label> is the chart's SVG <text> voice, not a form label: only HTML
    // <label> is held to having a control.
    "jsx-a11y/label-has-associated-control": ["error", { labelComponents: [] }],
  },
};
