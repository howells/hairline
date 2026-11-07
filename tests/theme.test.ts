// Seam 1: the built package. A host themes charts with a few colours through
// deriveTheme, and the shipped stylesheets never leak onto :root or collide
// with the host's own variables.
import { readFileSync } from "node:fs";

import { RungBars } from "@howells/hairline";
import { deriveTheme } from "@howells/hairline/theme";
import type { ThemeProperties } from "@howells/hairline/theme";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

const lib = (name: string) =>
  readFileSync(new URL(`../lib/${name}`, import.meta.url), "utf-8");

// The three house palettes as shipped before the theme existed (the literal
// hex values the gallery drew), keyed by their three inputs.
const HOUSE = {
  dark: {
    alert: "#d87a6e",
    expected: {
      "--hl-faint": "#686663",
      "--hl-grid": "#242321",
      "--hl-heat-1": "#373533",
      "--hl-heat-2": "#686663",
      "--hl-heat-3": "#888683",
      "--hl-heat-4": "#cccac7",
      "--hl-heat-5": "#f0eeeb",
      "--hl-hero": "#d8d6d2",
      "--hl-l0": "#f0eeeb",
      "--hl-l1": "#cccac7",
      "--hl-l2": "#a9a7a4",
      "--hl-l3": "#888683",
      "--hl-l4": "#686663",
      "--hl-l5": "#4c4a47",
      "--hl-l6": "#373533",
      "--hl-muted": "#888683",
      "--hl-rule": "#2c2b29",
    },
    hero: "#d8d6d2",
    ink: "#f0eeeb",
    mode: "dark",
    paper: "#181715",
  },
  paper: {
    alert: "#c05951",
    expected: {
      "--hl-faint": "#9f9e9a",
      "--hl-grid": "#eeece7",
      "--hl-heat-1": "#dad9d5",
      "--hl-heat-2": "#9f9e9a",
      "--hl-heat-3": "#7e7d79",
      "--hl-heat-4": "#41403c",
      "--hl-heat-5": "#1d1d1b",
      "--hl-hero": "#1d1d1b",
      "--hl-l0": "#1d1d1b",
      "--hl-l1": "#41403c",
      "--hl-l2": "#5f5e5a",
      "--hl-l3": "#7e7d79",
      "--hl-l4": "#9f9e9a",
      "--hl-l5": "#bfbeb9",
      "--hl-l6": "#dad9d5",
      "--hl-muted": "#727068",
      "--hl-rule": "#e3e1dc",
    },
    hero: "#1d1d1b",
    ink: "#1d1d1b",
    mode: "light",
    paper: "#fbfbf9",
  },
  pink: {
    alert: "#9c433e",
    expected: {
      "--hl-faint": "#a59895",
      "--hl-grid": "#e4d3cf",
      "--hl-heat-1": "#dccbc8",
      "--hl-heat-2": "#a59895",
      "--hl-heat-3": "#837775",
      "--hl-heat-4": "#443b39",
      "--hl-heat-5": "#27201e",
      "--hl-hero": "#27201e",
      "--hl-l0": "#27201e",
      "--hl-l1": "#443b39",
      "--hl-l2": "#635856",
      "--hl-l3": "#837775",
      "--hl-l4": "#a59895",
      "--hl-l5": "#c4b5b2",
      "--hl-l6": "#dccbc8",
      "--hl-muted": "#6c605e",
      "--hl-rule": "#dccbc7",
    },
    hero: "#27201e",
    ink: "#27201e",
    mode: "light",
    paper: "#f1dfdc",
  },
} as const;

// OKLab, so distance means what the eye sees. Written out here rather than
// imported so the check cannot share a bug with the code under test.
// The published coefficients, as integers over ten decimal places.
const coefficient = (n: number) => n / 1e10;

const lin = (c: number) =>
  c <= 4045e-5 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const oklab = (hex: string) => {
  const channel = (i: number) =>
    lin(Number.parseInt(hex.slice(i, i + 2), 16) / 255);

  const [r, g, b] = [channel(1), channel(3), channel(5)] as const;

  const l = Math.cbrt(
    coefficient(4_122_214_708) * r +
      coefficient(5_363_325_363) * g +
      coefficient(514_459_929) * b
  );

  const m = Math.cbrt(
    coefficient(2_119_034_982) * r +
      coefficient(6_806_995_451) * g +
      coefficient(1_073_969_566) * b
  );

  const s = Math.cbrt(
    coefficient(883_024_619) * r +
      coefficient(2_817_188_376) * g +
      coefficient(6_299_787_005) * b
  );

  return [
    coefficient(2_104_542_553) * l +
      coefficient(7_936_177_850) * m -
      coefficient(40_720_468) * s,
    coefficient(19_779_984_951) * l -
      coefficient(24_285_922_050) * m +
      coefficient(4_505_937_099) * s,
    coefficient(259_040_371) * l +
      coefficient(7_827_717_662) * m -
      coefficient(8_086_757_660) * s,
  ] as const;
};

const distance = (a: string, b: string) => {
  const [l1, a1, b1] = oklab(a);
  const [l2, a2, b2] = oklab(b);

  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

const root = (style: ThemeProperties, id: string) =>
  createElement(
    "div",
    { className: "hl-root", id, style },
    createElement(RungBars, {
      data: [{ label: "a", value: 3 }],
      height: 120,
      width: 240,
    })
  );

/** A property by name; a missing one reads as black so it fails the distance check. */
const prop = (theme: ThemeProperties, key: string) =>
  Object.entries(theme).find(([name]) => name === key)?.[1] ?? "#000000";

const TOLERANCE = 0.02;

describe("deriveTheme reproduces the house palettes", () => {
  it.each(Object.entries(HOUSE))(
    "%s: every derived colour is within tolerance of the shipped one",
    (_name, house) => {
      const theme = deriveTheme({
        alert: house.alert,
        hero: house.hero,
        ink: house.ink,
        mode: house.mode,
        paper: house.paper,
      });

      const off = Object.entries(house.expected).filter(
        ([key, hex]) => distance(prop(theme, key), hex) > TOLERANCE
      );

      expect(off).toStrictEqual([]);
      expect(theme["--hl-paper"]).toBe(house.paper);
      expect(theme["--hl-ink"]).toBe(house.ink);
      expect(theme["--hl-text"]).toBe(house.ink);
      expect(theme["--hl-alert"]).toBe(house.alert);
    }
  );

  it("defaults the hero to the ink and the alert to a tone for the mode", () => {
    const light = deriveTheme({
      ink: "#1d1d1b",
      mode: "light",
      paper: "#fbfbf9",
    });

    expect(light["--hl-hero"]).toBe("#1d1d1b");
    expect(light["--hl-alert"]).toMatch(/^#[0-9a-f]{6}$/u);

    const dark = deriveTheme({
      ink: "#f0eeeb",
      mode: "dark",
      paper: "#181715",
    });

    expect(dark["--hl-alert"]).not.toBe(light["--hl-alert"]);
  });

  it("dark mode rebuilds contrast: light ink leads and the ramp descends to the page", () => {
    const theme = deriveTheme({
      ink: "#f0eeeb",
      mode: "dark",
      paper: "#181715",
    });

    const lightness = ["l0", "l1", "l2", "l3", "l4", "l5", "l6"].map(
      (k) => oklab(theme[`--hl-${k}`] ?? "#000000")[0]
    );

    expect(lightness).toStrictEqual(lightness.toSorted((a, b) => b - a));
    expect(lightness[6]).toBeGreaterThan(oklab("#181715")[0]);
  });

  it("sets the font only when one is given", () => {
    const base = { ink: "#111111", paper: "#ffffff" } as const;
    expect(deriveTheme(base)["--hl-font"]).toBeUndefined();
    expect(
      deriveTheme({ ...base, font: "Söhne, sans-serif" })["--hl-font"]
    ).toBe("Söhne, sans-serif");
  });
});

describe("a host themes charts with three colours", () => {
  // Wiredeck's mapping: ground to paper, ink to ink, clay accent to hero,
  // hairline to grid and rule.
  const wiredeck = deriveTheme({
    grid: "#3a3631",
    hero: "#c4694a",
    ink: "#efe9df",
    mode: "dark",
    paper: "#1a1815",
    rule: "#3a3631",
  });

  it("maps ground, ink, accent and hairline onto the tokens", () => {
    expect(wiredeck["--hl-paper"]).toBe("#1a1815");
    expect(wiredeck["--hl-ink"]).toBe("#efe9df");
    expect(wiredeck["--hl-hero"]).toBe("#c4694a");
    expect(wiredeck["--hl-grid"]).toBe("#3a3631");
    expect(wiredeck["--hl-rule"]).toBe("#3a3631");
  });

  it("every property it returns is hl-prefixed", () => {
    expect(
      Object.keys(wiredeck).filter((k) => !k.startsWith("--hl-"))
    ).toStrictEqual([]);
  });

  it("two roots on one page each carry their own colours", () => {
    const pink = deriveTheme({
      ink: "#27201e",
      mode: "light",
      paper: "#f1dfdc",
    });

    const html = renderToString(
      createElement("main", null, root(wiredeck, "one"), root(pink, "two"))
    );

    const styleOf = (id: string) =>
      new RegExp(`id="${id}" style="([^"]*)"`, "u").exec(html)?.[1] ?? "";

    expect(styleOf("one")).toContain("--hl-paper:#1a1815");
    expect(styleOf("one")).not.toContain("#f1dfdc");
    expect(styleOf("two")).toContain("--hl-paper:#f1dfdc");
    expect(styleOf("two")).not.toContain("#1a1815");
  });
});

describe("the shipped stylesheets stay out of the host's way", () => {
  const tokens = lib("tokens.css");
  const theme = lib("theme.css");

  it("tokens.css sets nothing on :root", () => {
    expect(tokens.replaceAll(/\/\*[\s\S]*?\*\//gu, "")).not.toMatch(/:root/u);
  });

  it("tokens.css declares only hl-prefixed properties", () => {
    const declared = [...tokens.matchAll(/^\s*(?<name>--[\w-]+)\s*:/gmu)].map(
      (m) => m.groups?.name
    );

    expect(declared.length).toBeGreaterThan(40);
    expect(
      declared.filter((name) => name?.startsWith("--hl-") !== true)
    ).toStrictEqual([]);
  });

  it("every selector in tokens.css is scoped under a Hairline root", () => {
    const selectors = tokens
      .replaceAll(/\/\*[\s\S]*?\*\//gu, "")
      .split("{")
      .slice(0, -1)
      .map((chunk) => chunk.split("}").pop()?.trim() ?? "")
      .filter((s) => s !== "" && !s.startsWith("@"));

    const unscoped = selectors
      .flatMap((s) => s.split(","))
      .map((s) => s.trim())
      .filter((s) => !s.includes(".hl-root"));

    expect(unscoped).toStrictEqual([]);
  });

  it("charts and the Tailwind theme read only hl-prefixed colour tokens", () => {
    const legacy =
      /var\(--(?:paper|ink|text|muted|faint|grid|rule|l[0-6]|hero|alert|cat-\d|heat-\d|grain|panel|dk-[\w-]+)\b/u;

    expect(theme).not.toMatch(legacy);
  });
});
