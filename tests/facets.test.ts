import { HairlineArea, HairlineLine, RungBars } from "@howells/hairline";
import type { DailyDatum } from "@howells/hairline";
import {
  Facets,
  facetColumns,
  facetDomains,
  facetWidth,
} from "@howells/hairline/kit";
import type { FacetPanel } from "@howells/hairline/kit";
import { createElement } from "react";
import type { ComponentProps } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const days = (values: number[]): DailyDatum[] =>
  values.map((value, i) => ({
    date: `2024-03-${String(4 + i).padStart(2, "0")}`,
    value,
  }));
const big = days([40, 60, 80, 70, 90, 100, 95]);
const small = days([4, 6, 8, 7, 9, 10, 9]);

const panels: FacetPanel[] = [
  { domain: [40, 100], key: "north", name: "North", value: "95" },
  { domain: [4, 10], key: "south", name: "South", value: "9" },
  { domain: [10, 20], key: "east", name: "East", value: "20" },
];

/** Facets on the server: a function, so a test passes its panels' renderer as a plain prop. */
const facets = (props: ComponentProps<typeof Facets>) =>
  renderToString(createElement(Facets, props));

const nothing = () => null;

const grid = (width: number) =>
  facets({ children: nothing, label: "Regions", panels, width });
const scaled = (scale?: "free" | "shared") =>
  facets({ children: nothing, label: "Regions", panels, scale, width: 800 });

describe("the facet grid takes its columns from the width", () => {
  it("one column on a phone, more as the width allows", () => {
    expect(facetColumns(358, 6)).toBe(1);
    expect(facetColumns(520, 6)).toBe(2);
    expect(facetColumns(800, 6)).toBe(3);
    expect(facetColumns(1200, 6)).toBe(4);
  });

  it("never more columns than panels, never fewer than one", () => {
    expect(facetColumns(1200, 3)).toBe(3);
    expect(facetColumns(100, 6)).toBe(1);
  });

  it("splits the width into equal panels with the gap between", () => {
    expect(facetWidth(800, 3, 24)).toBe(250);
    expect(facetWidth(358, 1)).toBe(358);
  });

  it.each([
    [358, 1],
    [800, 3],
  ])("lays the panels out at %ipx in %i grid columns", (width, columns) => {
    expect(grid(width)).toContain(`repeat(${columns}, minmax(0, 1fr))`);
  });
});

describe("the scale is shared by default", () => {
  it("gives every panel the one domain spanning them all", () => {
    const domains = facetDomains(panels, "shared");
    expect(new Set(domains.map((d) => d.join(",")))).toHaveProperty("size", 1);
    expect(domains[0][0]).toBeLessThanOrEqual(4);
    expect(domains[0][1]).toBeGreaterThanOrEqual(100);
  });

  it("gives each panel its own when freed", () => {
    expect(facetDomains(panels, "free")[1][1]).toBeLessThan(20);
  });

  it("says so when freed, and only then", () => {
    const note = "Each panel on its own scale";
    expect(scaled("free")).toContain(note);
    expect(scaled("shared")).not.toContain(note);
  });
});

/** The panels that were handed the hero. */
const heroes = (hero?: string | null) => {
  const seen: string[] = [];
  facets({
    children: (cell) => {
      if (cell.hero) {
        seen.push(cell.panel.key);
      }
      return null;
    },
    hero,
    label: "Regions",
    panels,
    width: 800,
  });
  return seen;
};

describe("one hero, the rest on the ramp", () => {
  it("is the panel reaching highest by default", () => {
    expect(heroes()).toStrictEqual(["north"]);
  });

  it("is the panel asked for, or none", () => {
    expect(heroes("east")).toStrictEqual(["east"]);
    expect(heroes(null)).toStrictEqual([]);
  });

  it("marks only the first column, so gridline values print once per row", () => {
    const firsts: boolean[] = [];
    facets({
      children: (cell) => {
        firsts.push(cell.first);
        return null;
      },
      label: "Regions",
      panels: [...panels, ...panels],
      width: 520,
    });
    expect(firsts).toStrictEqual([true, false, true, false, true, false]);
  });
});

/** The y of every gridline a chart draws. */
const gridYs = (html: string) =>
  [...html.matchAll(/class="grid-line"[^>]*?\sy1="(?<y>[\d.]+)"/gu)].map(
    (m) => m.groups?.y
  );
const labels = (html: string) => (html.match(/class="t-axis"/gu) ?? []).length;

/** The line's path, `d`. */
const path = (html: string) =>
  /class="draw[^"]*" d="(?<d>[^"]*)"/u.exec(html)?.groups?.d;

const sized = { height: 200, width: 320 };
const domain: [number, number] = [0, 100];
const area = (props: Partial<ComponentProps<typeof HairlineArea>>) =>
  renderToString(
    createElement(HairlineArea, { data: big, ...sized, ...props })
  );
const line = (props: Partial<ComponentProps<typeof HairlineLine>>) =>
  renderToString(
    createElement(HairlineLine, { data: big, ...sized, ...props })
  );

describe("a shared domain is really shared by the charts", () => {
  it("HairlineArea draws one gridline set whatever its data", () => {
    const a = area({ data: big, domain });
    expect(gridYs(a).length).toBeGreaterThan(1);
    expect(gridYs(area({ data: small, domain }))).toStrictEqual(gridYs(a));
  });

  it("without a domain the same data fills its own box instead", () => {
    expect(path(area({ data: small, domain }))).not.toBe(
      path(area({ data: small }))
    );
  });

  it("HairlineLine keeps one value scale across panels too", () => {
    expect(gridYs(line({ data: small, domain }))).toStrictEqual(
      gridYs(line({ data: big, domain }))
    );
  });
});

describe("a panel after the first drops the axis values and the hero", () => {
  it("valueLabels false keeps the area's gridlines and drops their values", () => {
    const without = area({ domain, valueLabels: false });
    expect(gridYs(without)).toStrictEqual(gridYs(area({ domain })));
    expect(labels(without)).toBeLessThan(labels(area({ domain })));
  });

  it("valueLabels false keeps the line's gridlines and drops their values", () => {
    const without = line({ domain, valueLabels: false });
    expect(gridYs(without)).toStrictEqual(gridYs(line({ domain })));
    expect(labels(without)).toBeLessThan(labels(line({ domain })));
  });

  it("emphasis null leaves the panel without a hero", () => {
    expect(area({ emphasis: null })).not.toContain("fill-hero");
    expect(area({})).toContain("fill-hero");
  });
});

/** The top edge of the tallest rung of a RungBars set to a shared max. */
const rungTop = (data: { label: string; value: number }[], max?: number) => {
  const html = renderToString(
    createElement(RungBars, { data, height: 200, max, unit: 1, width: 200 })
  );
  return Math.min(
    ...[...html.matchAll(/class="grow-x[^"]*"[^>]*?\sy="(?<y>[\d.]+)"/gu)].map(
      (m) => Number(m.groups?.y)
    )
  );
};

describe("RungBars takes the shared max", () => {
  const lone = [{ label: "a", value: 20 }];

  it("stands an equal value at an equal height whatever stands beside it", () => {
    const beside = [...lone, { label: "b", value: 10 }];
    expect(rungTop(beside, 40)).toBe(rungTop(lone, 40));
  });

  it("without it the lone bar fills the box instead", () => {
    expect(rungTop(lone)).toBeLessThan(rungTop(lone, 40));
  });
});
