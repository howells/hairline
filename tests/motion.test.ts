// @vitest-environment jsdom
// Seam 1: motion control and the ready signal, as a consumer meets them.
// Server HTML comes from renderToString; the client behaviour from a real
// React root in jsdom, which lacks the observers and matchMedia, so those get
// controllable stand-ins: an IntersectionObserver the test can fire, and a
// reduced-motion switch. Fake timers stand in for animation frames.
import { readFileSync } from "node:fs";
import path from "node:path";

import { RungBars } from "@howells/hairline";
import type { RungBarsProps } from "@howells/hairline";
import { getChart } from "@howells/hairline/schema";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Report = (entries: { isIntersecting: boolean }[]) => void;

const nothing = () => {
  /* inert */
};

let reduced = false;
const watching: Report[] = [];
/** Stands in for both observers; only the intersection one is ever fired. */
class Observer {
  report: Report;
  constructor(report: Report) {
    this.report = report;
  }
  disconnect = nothing;
  observe = () => {
    watching.push(this.report);
  };
}
vi.stubGlobal("IntersectionObserver", Observer);
vi.stubGlobal("ResizeObserver", Observer);
vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
vi.stubGlobal("matchMedia", (media: string) => ({
  addEventListener: nothing,
  matches: reduced,
  media,
  removeEventListener: nothing,
}));

const base: RungBarsProps = {
  data: [
    { label: "2021", value: 19 },
    { label: "2022", value: 11 },
  ],
  height: 320,
  width: 480,
};

const show = async (root: Root, props: RungBarsProps) => {
  await act(async () => {
    root.render(createElement(RungBars, props));
    await Promise.resolve();
  });
};
const mount = async (props: RungBarsProps) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await show(root, props);
  return { host, root };
};
/** One animation frame, with the effects it causes flushed, as in a browser. */
const frame = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20);
  });
};
/** Enough frames for reveal, then settle. */
const frames = async () => {
  await frame();
  await frame();
  await frame();
};
const scrollIntoView = async () => {
  await act(async () => {
    for (const report of watching.splice(0)) {
      report([{ isIntersecting: true }]);
    }
    await Promise.resolve();
  });
};
const ready = (host: HTMLElement) =>
  host.querySelector('[data-hl-ready="true"]') !== null;

/** The stylesheet with every `@media screen` block removed, braces tracked. */
const withoutScreenBlocks = (css: string) => {
  let rest = "";
  let depth = 0;
  let skipFrom = -1;
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === "{") {
      depth += 1;
    }
    if (skipFrom < 0 && css.startsWith("@media screen", i)) {
      skipFrom = depth;
    }
    if (skipFrom < 0) {
      rest += ch;
    }
    if (ch === "}") {
      depth -= 1;
      if (skipFrom >= 0 && depth === skipFrom) {
        skipFrom = -1;
      }
    }
  }
  return rest;
};

describe("motion", () => {
  beforeEach(() => {
    reduced = false;
    watching.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  describe("on the server", () => {
    it('animate="off" is the drawn chart, ready, and never hidden', () => {
      const html = renderToString(
        createElement(RungBars, { ...base, animate: "off" })
      );
      expect(html).toContain("</svg>");
      expect(html).toContain('data-hl-ready="true"');
      expect(html).not.toContain("is-hidden");
    });

    it("the default is scroll: it starts hidden and not ready, as the gallery does", () => {
      const html = renderToString(createElement(RungBars, base));
      expect(html).toContain("is-hidden");
      expect(html).not.toContain('data-hl-ready="true"');
    });
  });

  describe("in a payload", () => {
    const chart = getChart("rung-bars");

    it("animate and replayKey validate", () => {
      expect(
        chart.validate({ ...base, animate: "mount", replayKey: 3 }).ok
      ).toBe(true);
    });

    it("a bad animate is a path-specific issue", () => {
      const bad = chart.validate({ ...base, animate: "sometimes" });
      expect(bad.ok ? [] : bad.issues.map((i) => i.pointer)).toStrictEqual([
        "animate",
      ]);
    });
  });

  describe("in the browser", () => {
    it('animate="off" calls onReady once, on mount', async () => {
      const onReady = vi.fn<() => void>();
      const { host } = await mount({ ...base, animate: "off", onReady });
      expect(ready(host)).toBe(true);
      expect(onReady).toHaveBeenCalledOnce();
    });

    it('animate="mount" draws in without scrolling', async () => {
      const { host } = await mount({ ...base, animate: "mount" });
      await frames();
      expect(host.querySelector(".is-shown")).not.toBeNull();
      expect(host.querySelector(".is-hidden")).toBeNull();
    });

    it('animate="mount" then sets ready and calls onReady once', async () => {
      const onReady = vi.fn<() => void>();
      const { host } = await mount({ ...base, animate: "mount", onReady });
      expect(ready(host)).toBe(false);
      await frames();
      expect(ready(host)).toBe(true);
      expect(onReady).toHaveBeenCalledOnce();
    });

    it('animate="scroll" stays hidden and not ready until scrolled into view', async () => {
      const onReady = vi.fn<() => void>();
      const { host } = await mount({ ...base, onReady });
      await frames();
      expect(host.querySelector(".is-hidden")).not.toBeNull();
      expect(ready(host)).toBe(false);
      expect(onReady).not.toHaveBeenCalled();
    });

    it('animate="scroll" draws and is ready once scrolled into view', async () => {
      const onReady = vi.fn<() => void>();
      const { host } = await mount({ ...base, onReady });
      await scrollIntoView();
      await frames();
      expect(host.querySelector(".is-shown")).not.toBeNull();
      expect(ready(host)).toBe(true);
      expect(onReady).toHaveBeenCalledOnce();
    });

    it("changing replayKey replays the entry in place", async () => {
      const props = { ...base, animate: "mount", replayKey: 1 } as const;
      const { host, root } = await mount(props);
      await frames();
      const svg = host.querySelector("svg");

      await show(root, { ...props, replayKey: 2 });
      expect(ready(host)).toBe(false);
      expect(host.querySelector(".is-hidden")).not.toBeNull();

      await frames();
      expect(host.querySelector(".is-shown")).not.toBeNull();
      expect(ready(host)).toBe(true);
      expect(host.querySelector("svg")).toBe(svg);
    });

    it("each replay calls onReady again, and an unchanged key does not", async () => {
      const onReady = vi.fn<() => void>();
      const props = {
        ...base,
        animate: "mount",
        onReady,
        replayKey: 1,
      } as const;
      const { root } = await mount(props);
      await frames();
      await show(root, { ...props });
      await frames();
      expect(onReady).toHaveBeenCalledOnce();

      await show(root, { ...props, replayKey: 2 });
      await frames();
      expect(onReady).toHaveBeenCalledTimes(2);
    });

    it("under reduced motion the chart is drawn and ready at once, without scrolling", async () => {
      reduced = true;
      const onReady = vi.fn<() => void>();
      const { host } = await mount({ ...base, onReady });
      expect(host.querySelector(".is-hidden")).toBeNull();
      expect(ready(host)).toBe(true);
      expect(onReady).toHaveBeenCalledOnce();
    });
  });

  describe("in print", () => {
    // The entry hides marks with .is-hidden rules. Browsers print with the
    // print media type, so every such rule must live under `screen` only, or
    // an all-charts print page exports blank plots.
    it("the stylesheet hides unrevealed plots on screen only", () => {
      const css = readFileSync(
        path.join(process.cwd(), "lib/theme.css"),
        "utf-8"
      );
      const hiding = withoutScreenBlocks(css)
        .split("\n")
        .filter((line) => line.includes("is-hidden") && !line.includes("*"));
      expect(css).toContain("is-hidden");
      expect(hiding).toStrictEqual([]);
    });
  });
});
