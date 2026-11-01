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
      // A chart is one image to a screen reader: the svg root takes
      // role="img" with a name and a <desc>. There is no tag for that, so
      // the rule is off for this one file and nowhere else.
      files: ["src/charts/svg.tsx"],
      rules: { "jsx-a11y/prefer-tag-over-role": "off" },
    },
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
      // swaps the Vitest rules for the Playwright ones, and a spec waits on one
      // page after another by design.
      ...playwrightOverride(["acceptance/*.spec.ts"]),
      rules: {
        ...playwrightOverride(["acceptance/*.spec.ts"]).rules,
        "no-await-in-loop": "off",
      },
    },
    {
      // Playwright reads CI and the port from the environment, and the
      // artefact spec reads its switch there; these files are the boundary.
      files: [
        "acceptance/playwright.config.ts",
        "acceptance/serve.ts",
        "acceptance/artefacts.spec.ts",
      ],
      rules: { "no-restricted-properties": "off" },
    },
  ],
  rules: {
    "howells/no-raw-type-utilities": ["error", { allow: TYPE_CASE }],
  },
};
