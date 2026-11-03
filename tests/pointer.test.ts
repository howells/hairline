// @vitest-environment jsdom
// Seam 1: the one pointer and its one tip, on charts mounted in a real root
// through the built package, the way a reader meets them: hover, keys, pin,
// touch. The arithmetic is in pointer-model.test.ts.
import {
  HairlineLine,
  PairedRungs,
  PlumbScatter,
  RangeDots,
  RungBars,
  StackedRungs,
} from "@howells/hairline";
import { Facets } from "@howells/hairline/kit";
import { act, createElement } from "react";
import type { ComponentProps, ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
/** A page that lays the chart out at 480px and has it in view. */
class FixedWidth {
  readonly disconnect = vi.fn<() => void>();

  readonly observe: () => void;

  constructor(report: (entries: unknown[]) => void) {
    this.observe = () => {
      report([{ contentRect: { width: 480 }, isIntersecting: true }]);
    };
  }
}
vi.stubGlobal("ResizeObserver", FixedWidth);
vi.stubGlobal("IntersectionObserver", FixedWidth);
vi.stubGlobal("matchMedia", (media: string) => ({
  addEventListener: vi.fn<() => void>(),
  matches: false,
  media,
  removeEventListener: vi.fn<() => void>(),
}));

const bars = createElement(RungBars, {
  data: [
    { detail: "the tallest", label: "Oak", value: 19 },
    { label: "Ash", value: 11 },
    { label: "Elm", value: 7 },
  ],
  height: 320,
  width: 480,
});
const days = createElement(HairlineLine, {
  data: [
    { date: "2024-03-04", value: 3 },
    { date: "2024-03-05", value: 5 },
    { date: "2024-03-06", value: 4 },
    { date: "2024-03-07", value: 6 },
  ],
  height: 320,
  width: 480,
});
const noted = createElement(HairlineLine, {
  data: [
    { date: "2024-03-04", value: 3 },
    { date: "2024-03-05", value: 5 },
    { date: "2024-03-06", value: 4 },
    { date: "2024-03-07", value: 6 },
  ],
  height: 320,
  notes: [{ at: "2024-03-05", title: "Launch week" }],
  width: 480,
});
const pairs = createElement(PairedRungs, {
  data: [
    { current: 12, label: "North", previous: 8 },
    { current: 7, label: "South", previous: 9 },
  ],
  height: 320,
  periods: ["2011", "2021"],
  width: 480,
});
const stacks = createElement(StackedRungs, {
  data: [
    { label: "Mon", parts: [5, 3, 2] },
    { label: "Tue", parts: [4, 4, 1] },
  ],
  height: 320,
  series: ["Orders", "Samples", "Returns"],
});
const points = createElement(PlumbScatter, {
  data: [
    { label: "Oak", x: 1, y: 4 },
    { label: "Ash", x: 3, y: 2 },
    { label: "Elm", x: 5, y: 6 },
  ],
  height: 320,
  width: 480,
});

const week = (offset: number) =>
  [3, 5, 4, 6].map((value, i) => ({
    date: `2024-03-0${4 + i}`,
    value: value + offset,
  }));
const facets = (props: ComponentProps<typeof Facets>) =>
  createElement(Facets, props);
const panelled = facets({
  children: (cell) =>
    createElement(HairlineLine, {
      data: week(cell.panel.key === "a" ? 0 : 10),
      domain: cell.domain,
      height: 200,
      width: cell.width,
    }),
  label: "Regions",
  panels: [
    { domain: [0, 20], key: "a", name: "A", value: "6" },
    { domain: [0, 20], key: "b", name: "B", value: "16" },
  ],
  width: 480,
});

const ranges = createElement(RangeDots, {
  data: [
    { estimate: 40, high: 46, label: "North", low: 34 },
    { estimate: 52, high: 55, label: "South", low: 49 },
  ],
  height: 320,
  width: 480,
});

const mounted: (() => Promise<void>)[] = [];
const mount = async (chart: ReactElement) => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(chart);
    await Promise.resolve();
  });
  mounted.push(async () => {
    await act(async () => {
      root.unmount();
      await Promise.resolve();
    });
    host.remove();
  });
  const svg = host.querySelector("svg");
  if (svg === null) {
    throw new Error("the chart drew no svg");
  }
  return { host, svg };
};

const tipOf = (host: HTMLElement) => {
  const tip = host.querySelector("[data-hl-tip]");
  return tip instanceof HTMLElement ? tip : null;
};
const tipText = (host: HTMLElement) => tipOf(host)?.textContent ?? null;
const tipState = (host: HTMLElement) => tipOf(host)?.dataset.hlTip;
const live = (host: HTMLElement) =>
  host.querySelector("output[aria-live]")?.textContent;

const fire = async (target: Element, event: Event) => {
  await act(async () => {
    target.dispatchEvent(event);
    await Promise.resolve();
  });
  return event;
};
const key = async (target: Element, name: string) =>
  await fire(
    target,
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: name })
  );
const mouse = async (target: Element, type: string, x: number, y = 100) =>
  await fire(
    target,
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y })
  );
const touchmove = async (target: Element) =>
  await fire(
    target,
    new Event("touchmove", { bubbles: true, cancelable: true })
  );
const wait = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

/** Moves the mouse across the drawing until a tip shows, and says where. */
const hoverSomewhere = async (
  host: HTMLElement,
  svg: Element,
  x = 0
): Promise<number> => {
  if (x > 480) {
    throw new Error("no point on the chart showed a tip");
  }
  await mouse(svg, "pointermove", x);
  return tipOf(host) === null ? await hoverSomewhere(host, svg, x + 4) : x;
};

/** The pointer leaving the chart, as a browser sends it. */
const leave = async (svg: Element) => {
  await fire(svg, new MouseEvent("pointerout", { bubbles: true }));
  await fire(svg, new MouseEvent("pointerleave"));
};

/** A finger: React reads pointerType from the event. */
const finger = (type: string, x: number, y = 100) => {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
  });
  Object.defineProperty(event, "pointerType", { value: "touch" });
  return event;
};

const placed = (host: HTMLElement) => {
  const tip = tipOf(host);
  return {
    left: Number(tip?.style.left.replace("px", "")),
    top: Number(tip?.style.top.replace("px", "")),
    visibility: tip?.style.visibility,
  };
};

const everyChart = [
  ["HairlineLine", days],
  ["RungBars", bars],
  ["PairedRungs", pairs],
  ["StackedRungs", stacks],
  ["PlumbScatter", points],
  ["RangeDots", ranges],
] as const;

describe("the pointer on real charts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(async () => {
    await Promise.all(
      mounted.splice(0).map(async (done) => {
        await done();
      })
    );
    vi.useRealTimers();
  });

  describe.each(everyChart)("%s: one pointer, one tip", (_name, chart) => {
    it("is a focusable root, and shows nothing until it is asked", async () => {
      const { host, svg } = await mount(chart);
      expect(svg.getAttribute("tabindex")).toBe("0");
      expect(tipOf(host)).toBeNull();
    });

    it("a click or tap does not ask for the focus ring; a key does", async () => {
      const { host, svg } = await mount(chart);
      await fire(svg, finger("pointerdown", 100));
      expect(svg.dataset.hlInput).toBe("pointer");
      await key(svg, "ArrowRight");
      expect(svg.dataset.hlInput).toBeUndefined();
      expect(host.querySelector("[data-hl-pointer]")).toBe(svg);
    });

    it("the tip's corners are on the radius scale, not the tip token", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      const classes = tipOf(host)?.className.split(" ") ?? [];
      expect(classes).toContain("rounded-sm");
      expect(classes).not.toContain("rounded-tip");
    });

    it("hover snaps to a stop and shows one tip, hidden from the reader", async () => {
      const { host, svg } = await mount(chart);
      await hoverSomewhere(host, svg);
      expect(host.querySelectorAll("[data-hl-tip]")).toHaveLength(1);
      expect(tipState(host)).toBe("hover");
      expect(tipOf(host)?.getAttribute("aria-hidden")).toBe("true");
    });

    it("the arrows step through the stops, and the page does not scroll", async () => {
      const { host, svg } = await mount(chart);
      const home = await key(svg, "Home");
      const first = tipText(host);
      await key(svg, "ArrowRight");
      expect(home.defaultPrevented).toBe(true);
      expect(first).not.toBeNull();
      expect(tipText(host)).not.toBe(first);
    });

    it("Home and End jump to the ends, and the last stop is the end", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      const first = tipText(host);
      const end = await key(svg, "End");
      const last = tipText(host);
      await key(svg, "ArrowRight");
      expect(end.defaultPrevented).toBe(true);
      expect(last).not.toBe(first);
      expect(tipText(host)).toBe(last);
      await key(svg, "Home");
      expect(tipText(host)).toBe(first);
    });

    it("keys are announced politely; a passing mouse is not", async () => {
      const { host, svg } = await mount(chart);
      expect(host.querySelector("output[aria-live=polite]")).not.toBeNull();
      await hoverSomewhere(host, svg);
      expect(live(host)).toBe("");
      await key(svg, "Home");
      const lead = tipOf(host)?.querySelector("b")?.textContent ?? "";
      expect(lead).not.toBe("");
      expect(live(host)).toContain(lead);
    });

    it("Enter pins, and says so aloud", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      const pin = await key(svg, "Enter");
      expect(pin.defaultPrevented).toBe(true);
      expect(tipState(host)).toBe("pinned");
      expect(tipText(host)).toContain("Pinned · Esc");
      expect(live(host)).toContain("Pinned");
    });

    it("Esc lets go; with nothing showing it is left to the page", async () => {
      const { host, svg } = await mount(chart);
      const idle = await key(svg, "Escape");
      await key(svg, "Home");
      await key(svg, "Enter");
      const esc = await key(svg, "Escape");
      expect(idle.defaultPrevented).toBe(false);
      expect(esc.defaultPrevented).toBe(true);
      expect(tipOf(host)).toBeNull();
    });

    it("Space pins too, and a second press lets go", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "End");
      await key(svg, " ");
      expect(tipState(host)).toBe("pinned");
      await key(svg, " ");
      expect(tipState(host)).toBe("hover");
    });

    it("a click pins; a second click lets go", async () => {
      const { host, svg } = await mount(chart);
      const x = await hoverSomewhere(host, svg);
      await mouse(svg, "click", x);
      expect(tipState(host)).toBe("pinned");
      await mouse(svg, "click", x);
      expect(tipState(host)).toBe("hover");
    });

    it("a pinned tip stays when the mouse leaves", async () => {
      const { host, svg } = await mount(chart);
      const x = await hoverSomewhere(host, svg);
      await mouse(svg, "click", x);
      const pinned = tipText(host);
      await leave(svg);
      await wait(1000);
      expect(tipText(host)).toBe(pinned);
    });

    it("a press outside the chart lets go", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      await key(svg, "Enter");
      await mouse(document.body, "pointerdown", 10);
      expect(tipOf(host)).toBeNull();
    });

    it("Esc anywhere on the page lets go", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      await key(svg, "Enter");
      await key(document.body, "Escape");
      expect(tipOf(host)).toBeNull();
    });

    it("a press on the pinned tip itself does not let go", async () => {
      const { host, svg } = await mount(chart);
      await key(svg, "Home");
      await key(svg, "Enter");
      await mouse(tipOf(host) ?? svg, "pointerdown", 10);
      expect(tipOf(host)).not.toBeNull();
    });

    it("the tip stays a moment after the pointer leaves, and a pointer on it keeps it", async () => {
      const { host, svg } = await mount(chart);
      await hoverSomewhere(host, svg);
      await leave(svg);
      expect(tipOf(host)).not.toBeNull();
      await fire(
        tipOf(host) ?? svg,
        new MouseEvent("pointerover", { bubbles: true })
      );
      await wait(1000);
      expect(tipOf(host)).not.toBeNull();
    });

    it("leaving for good removes it", async () => {
      const { host, svg } = await mount(chart);
      await hoverSomewhere(host, svg);
      await leave(svg);
      await wait(1000);
      expect(tipOf(host)).toBeNull();
    });

    it("a swipe that starts a scroll is the page's: no scrub, nothing blocked", async () => {
      const { host, svg } = await mount(chart);
      await fire(svg, finger("pointerdown", 100));
      await fire(svg, finger("pointermove", 100, 140));
      await wait(1000);
      const scroll = await touchmove(svg);
      expect(tipOf(host)).toBeNull();
      expect(scroll.defaultPrevented).toBe(false);
    });

    it("press and hold scrubs and keeps the page still", async () => {
      const { host, svg } = await mount(chart);
      await fire(svg, finger("pointerdown", 100));
      expect(tipOf(host)).toBeNull();
      await wait(400);
      const drag = await touchmove(svg);
      expect(tipOf(host)).not.toBeNull();
      expect(drag.defaultPrevented).toBe(true);
    });

    it("lifting the finger pins the tip, and the click after it does not undo that", async () => {
      const { host, svg } = await mount(chart);
      await fire(svg, finger("pointerdown", 100));
      await wait(400);
      await fire(svg, finger("pointermove", 400, 104));
      await fire(svg, finger("pointerup", 400, 104));
      expect(tipState(host)).toBe("pinned");
      await mouse(svg, "click", 400);
      expect(tipState(host)).toBe("pinned");
    });
  });

  describe("what the tip says", () => {
    it("RungBars: the label in bold, its value, and its detail quietly", async () => {
      const { host, svg } = await mount(bars);
      await key(svg, "Home");
      expect(tipOf(host)?.querySelector("b")?.textContent).toBe("Oak");
      expect(tipText(host)).toContain("19");
      expect(tipText(host)).toContain("the tallest");
    });

    it("PairedRungs: one row per period, the current one first, each with a swatch", async () => {
      const { host, svg } = await mount(pairs);
      await key(svg, "Home");
      const text = tipText(host) ?? "";
      expect(text.indexOf("2021")).toBeGreaterThan(-1);
      expect(text.indexOf("2021")).toBeLessThan(text.indexOf("2011"));
      expect(tipOf(host)?.querySelectorAll("span.h-0\\.5")).toHaveLength(2);
    });

    it("StackedRungs: a row per segment, then the total", async () => {
      const { host, svg } = await mount(stacks);
      await key(svg, "Home");
      const text = tipText(host) ?? "";
      for (const word of ["Orders", "Samples", "Returns", "Total"]) {
        expect(text).toContain(word);
      }
      expect(text.indexOf("Returns")).toBeLessThan(text.indexOf("Total"));
    });

    it("PlumbScatter: the point's name, then its x and y", async () => {
      const { host, svg } = await mount(points);
      await key(svg, "Home");
      expect(tipOf(host)?.querySelector("b")?.textContent).toBe("Oak");
      expect(tipText(host)).toContain("X");
      expect(tipText(host)).toContain("Y");
    });

    it("HairlineLine: the date, then the value, with a crosshair and a ringed dot on the day", async () => {
      const { host, svg } = await mount(days);
      await key(svg, "Home");
      expect(tipOf(host)?.querySelector("b")?.textContent).toMatch(/4/u);
      expect(svg.querySelectorAll("line.stroke-faint")).toHaveLength(1);
      expect(svg.querySelectorAll("circle.fill-paper").length).toBeGreaterThan(
        0
      );
    });

    it("the crosshair follows the keys and goes with the tip", async () => {
      const { host, svg } = await mount(days);
      await key(svg, "Home");
      const first = svg.querySelector("line.stroke-faint")?.getAttribute("x1");
      await key(svg, "ArrowRight");
      const second = svg.querySelector("line.stroke-faint")?.getAttribute("x1");
      await key(svg, "Escape");
      expect(second).not.toBe(first);
      expect(svg.querySelector("line.stroke-faint")).toBeNull();
      expect(tipOf(host)).toBeNull();
    });

    it("RungBars: the other bars drop back while one is shown", async () => {
      const { svg } = await mount(bars);
      await key(svg, "Home");
      expect(svg.querySelectorAll("g.opacity-30")).toHaveLength(2);
      await key(svg, "Escape");
      expect(svg.querySelectorAll("g.opacity-30")).toHaveLength(0);
    });
  });

  describe("inside Facets", () => {
    it("each panel has its own pointer and tip; a press in another panel lets go", async () => {
      const { host } = await mount(panelled);
      const [first, second] = [...host.querySelectorAll("svg")];
      await key(first, "Home");
      await key(first, "Enter");
      expect(host.querySelectorAll("[data-hl-tip]")).toHaveLength(1);
      await mouse(second, "pointerdown", 100);
      expect(tipOf(host)).toBeNull();
      await key(second, "Home");
      expect(host.querySelectorAll("[data-hl-tip]")).toHaveLength(1);
    });
  });

  describe("the column's band", () => {
    it("HairlineLine: stays off the day whose value label is printed, and is there elsewhere", async () => {
      const { host, svg } = await mount(days);
      await key(svg, "Home");
      expect(host.querySelector("rect.fill-l6")).not.toBeNull();
      await key(svg, "End");
      expect(host.querySelector("rect.fill-l6")).toBeNull();
    });
  });

  describe("notes and the tip", () => {
    it("HairlineLine: the note still shows beside the tip", async () => {
      const { host, svg } = await mount(noted);
      await key(svg, "Home");
      expect(host.textContent).toContain("Launch week");
      expect(tipText(host)).toContain("4 Mar");
    });
  });

  describe("the tip stays inside the chart", () => {
    it("is placed, visible, and inside the drawing at every stop", async () => {
      const { host, svg } = await mount(bars);
      await key(svg, "Home");
      const one = placed(host);
      await key(svg, "ArrowRight");
      const two = placed(host);
      await key(svg, "End");
      const three = placed(host);
      for (const at of [one, two, three]) {
        expect(at.visibility).toBe("visible");
        expect(at.left).toBeGreaterThanOrEqual(4);
        expect(at.top).toBeGreaterThanOrEqual(4);
      }
    });
  });
});
