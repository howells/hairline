// @vitest-environment jsdom
// Seam 1, accessibility: what a screen-reader user and a sighted reader get
// from the built package. The server HTML is checked as text; axe runs on that
// same HTML parsed into a document.
import { RungBars } from "@howells/hairline";
import type { RungBarsProps } from "@howells/hairline";
import axe from "axe-core";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const props: RungBarsProps = {
  data: [
    { label: "Oak", value: 19 },
    { label: "Ash", value: 11 },
    { label: "Elm", value: 7 },
  ],
  height: 320,
  width: 480,
};
const render = (extra: Partial<RungBarsProps> = {}) =>
  renderToString(createElement(RungBars, { ...props, ...extra }));
const tag = (html: string, name: string) =>
  new RegExp(`<${name}[^>]*>`, "u").exec(html)?.[0] ?? "";
/**
 * Hidden means inside an sr-only block: a table given sr-only itself ignores
 * the 1px box, grows to its rows and lengthens the page.
 */
const hidden = (html: string) =>
  /<div class="sr-only"><table>/u.test(html) &&
  !tag(html, "table").includes("sr-only");
const cells = (html: string) =>
  [...html.matchAll(/<t[dh][^>]*>(?<text>[^<]*)<\/t[dh]>/gu)].map(
    (m) => m.groups?.text
  );
/** Axe's violation ids for the markup placed in a page. */
const violations = async (html: string) => {
  document.body.innerHTML = `<main>${html}</main>`;
  const result = await axe.run(document.body);
  return result.violations.map((v) => v.id);
};

describe("the chart is an image with a name and a description", () => {
  it("the svg has role img, an accessible name and a desc", () => {
    const html = render();
    const svg = tag(html, "svg");
    expect(svg).toContain('role="img"');
    expect(svg).toMatch(/aria-label="[^"]+"/u);
    expect(svg).toMatch(/aria-describedby="[^"]+"/u);
    expect(html).toMatch(/<desc[^>]*>[^<]+<\/desc>/u);
  });

  it("the name is the consumer's title when given", () => {
    expect(tag(render({ title: "Trees by count" }), "svg")).toContain(
      'aria-label="Trees by count"'
    );
  });

  it("the summary describes the payload, not demo copy", () => {
    const html = render();
    const desc =
      /<desc[^>]*>(?<text>[^<]+)<\/desc>/u.exec(html)?.groups?.text ?? "";
    expect(desc).toBe(
      "3 bars. Largest: Oak, 19. Smallest: Elm, 7. The data table lists every bar."
    );
    expect(html).not.toContain("2016");
  });
});

describe("a table carries every value", () => {
  it("is in the first server HTML, hidden from sight, in responsive mode too", () => {
    const html = renderToString(
      createElement(RungBars, { data: props.data, initialWidth: 400 })
    );
    expect(hidden(html)).toBe(true);
    expect(cells(html)).toStrictEqual([
      "Label",
      "Value",
      "Oak",
      "19",
      "Ash",
      "11",
      "Elm",
      "7",
    ]);
  });

  it("is there before the width is known", () => {
    const html = renderToString(createElement(RungBars, { data: props.data }));
    expect(cells(html)).toContain("Ash");
    expect(html).not.toContain("<svg");
  });

  it("shows the values as the chart formats them", () => {
    const html = render({
      data: [{ label: "Oak", value: 1234 }],
      format: "compact",
    });
    expect(cells(html)).toContain("1.2K");
  });

  it("is visible when the consumer opts in", () => {
    const shown = render({ table: true });
    expect(hidden(render())).toBe(true);
    expect(tag(shown, "table")).toContain("<table");
    expect(tag(shown, "table")).not.toContain("sr-only");
    expect(shown).not.toContain('<div class="sr-only">');
  });
});

describe("the accessibility checker", () => {
  it("reports nothing on the default chart", async () => {
    await expect(violations(render())).resolves.toStrictEqual([]);
  });

  it("reports nothing with the visible table", async () => {
    await expect(violations(render({ table: true }))).resolves.toStrictEqual(
      []
    );
  });
});
