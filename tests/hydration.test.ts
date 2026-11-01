// @vitest-environment jsdom
// Seam 1, client side: the server HTML of a fixed-size chart hydrates in a
// browser-like document with no warning, and leaves the markup unchanged.
// jsdom stands in for the browser; it lacks the two observers and matchMedia,
// so those get inert versions, as any non-layout environment must.
import { RungBars } from "@howells/hairline";
import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const nothing = () => {
  /* inert */
};
class Inert {
  disconnect = nothing;
  observe = nothing;
}
vi.stubGlobal("IntersectionObserver", Inert);
vi.stubGlobal("ResizeObserver", Inert);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
vi.stubGlobal("matchMedia", (media: string) => ({
  addEventListener: nothing,
  matches: false,
  media,
  removeEventListener: nothing,
}));

describe("hydration", () => {
  it("fixed-size server HTML hydrates without a warning and without changing", async () => {
    const props = {
      data: [
        { label: "2021", value: 19 },
        { label: "2022", value: 11 },
      ],
      height: 320,
      width: 480,
    };
    const html = renderToString(createElement(RungBars, props));
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.append(root);

    const problems: unknown[] = [];
    const logged = vi.spyOn(console, "error").mockImplementation((...args) => {
      problems.push(args);
    });
    await act(async () => {
      hydrateRoot(root, createElement(RungBars, props), {
        onRecoverableError: (error) => {
          problems.push(error);
        },
      });
      await Promise.resolve();
    });
    logged.mockRestore();

    expect(problems).toStrictEqual([]);
    expect(root.innerHTML).toBe(html);
  });

  it("a wrapped footnote under custom metrics hydrates unchanged", async () => {
    const props = {
      data: [{ label: "2021", value: 19 }],
      height: 320,
      metrics: { advances: { "1": 0.5 }, fallback: 1.2 },
      note: "One rung = 100 rings · Source: the county survey · Rounded",
      width: 480,
    };
    const html = renderToString(createElement(RungBars, props));
    const root = document.createElement("div");
    root.innerHTML = html;
    document.body.append(root);
    await act(async () => {
      hydrateRoot(root, createElement(RungBars, props));
      await Promise.resolve();
    });
    expect(root.innerHTML).toBe(html);
  });
});
