// A browser stand-in for the charts that measure their own width: jsdom has no
// layout, so every element is 640px wide and each svg reports its own size as
// its box, which puts the pointer in chart pixels one to one. The observers
// and matchMedia are inert.
import { act, createElement } from "react";
import type { ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { vi } from "vitest";

const nothing = () => {
  /* inert */
};

class Inert {
  disconnect = nothing;
  observe = nothing;
}

export const WIDTH = 640;

/** An element's box, taken from its width and height attributes. */
const boundingBox = function boundingBox(this: Element) {
  const width = Number(this.getAttribute("width") ?? WIDTH);
  const height = Number(this.getAttribute("height") ?? 0);

  return new DOMRect(0, 0, width, height);
};

/** Call once at the top of a test file. */
export const stubBrowser = () => {
  vi.stubGlobal("IntersectionObserver", Inert);
  vi.stubGlobal("ResizeObserver", Inert);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", (media: string) => ({
    addEventListener: nothing,
    matches: false,
    media,
    removeEventListener: nothing,
  }));
  // Fonts "still loading": text is measured by estimate, not by the DOM.
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { status: "loading" },
  });
  Object.defineProperty(HTMLElement.prototype, "clientWidth", {
    configurable: true,
    get: () => WIDTH,
  });
  Element.prototype.getBoundingClientRect = boundingBox;
};

/** Mounts a chart at 640px wide and lets its effects run. */
export const mount = async (chart: ReactElement) => {
  const host = document.createElement("div");
  document.body.append(host);
  await act(async () => {
    createRoot(host).render(createElement("div", null, chart));
    await Promise.resolve();
  });

  return host;
};

/** The chart's svg; a chart without one fails the test. */
export const svgOf = (host: Element) => {
  const svg = host.querySelector("svg");

  if (svg === null) {
    throw new Error("The chart drew no svg");
  }

  return svg;
};

/** Dispatches a pointer event at a point of the svg, as a mouse or a finger. */
export const pointerAt = async (
  svg: Element,
  type: "pointerdown" | "pointermove",
  at: { x: number; y: number },
  pointerType: "mouse" | "touch" = "mouse"
) => {
  await act(async () => {
    svg.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: at.x,
        clientY: at.y,
        pointerType,
      })
    );
    await Promise.resolve();
  });
};

/** Presses a key on the svg. */
export const press = async (svg: Element, key: string) => {
  await act(async () => {
    svg.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
    await Promise.resolve();
  });
};
