import react from "@howells/lint/oxlint/react";

/*
 * The type case (see the @theme block in src/system/app.css): two HTML
 * sizes and two weights. Chart text uses the t-* roles, which this rule
 * cannot misspell into a raw size.
 */
const TYPE_CASE = ["text-tick", "text-small", "font-medium", "font-semibold"];

export default {
  extends: [react],
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
  ],
  rules: {
    "howells/no-raw-type-utilities": ["error", { allow: TYPE_CASE }],
  },
};
