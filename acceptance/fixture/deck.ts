// The host page, as Wiredeck builds it: look a chart up by kind, validate the
// JSON payload against the registry, theme a slide with deriveTheme, and draw
// the chart at its logical size, shown 2.5 times larger by `scale`. No JSX and
// no Tailwind: the same module renders on the server and hydrates in the page.
import {
  DumbbellQueue,
  HairlineArea,
  HairlineLine,
  PlumbScatter,
  RungBars,
  Slope,
} from "@howells/hairline";
import { charts } from "@howells/hairline/schema";
import type { ChartEntry, Payload } from "@howells/hairline/schema";
import { deriveTheme } from "@howells/hairline/theme";
import type { ThemeInput } from "@howells/hairline/theme";
import { createElement } from "react";
import type { ComponentType, ReactElement } from "react";
import { z } from "zod";

import { KIND_ORDER, PAYLOADS } from "./payloads.ts";
import type { Kind } from "./payloads.ts";

export const deckConfigSchema = z.strictObject({
  animate: z.enum(["mount", "off", "scroll"]),
  /** "compare": one light row per chart, proportional strokes beside device strokes, at 2x. */
  layout: z.enum(["compare", "slides"]),
});
export type DeckConfig = z.infer<typeof deckConfigSchema>;
type Animate = DeckConfig["animate"];

const FONT = '"Inter", ui-sans-serif, system-ui, sans-serif';

// A Wiredeck-like mapping: the deck's ground is the paper, its text the ink,
// and the clay accent the hero.
const THEMES = {
  dark: { hero: "#d9825f", ink: "#efe9de", mode: "dark", paper: "#161412" },
  light: { hero: "#b4532f", ink: "#1d1b18", mode: "light", paper: "#f6f1e7" },
} as const satisfies Record<string, ThemeInput>;

type ThemeName = keyof typeof THEMES;

const SLIDE = { height: 400, scale: 2.5, width: 720 } as const;
const COMPARE = { height: 300, scale: 2, width: 440 } as const;

/** Check a payload against the chart's registry entry, then draw it. */
const drawer = <T extends object>(
  entry: ChartEntry<T>,
  Component: ComponentType<T>
) =>
  function draw(input: Payload): ReactElement {
    const checked = entry.validate(input);
    if (!checked.ok) {
      throw new Error(
        `${entry.kind}: ${checked.issues.map((issue) => `${issue.pointer} ${issue.message}`).join("; ")}`
      );
    }
    return createElement(Component, checked.value);
  };

// The registry says which chart a kind is; this table says which component.
const DRAW = {
  "dumbbell-queue": drawer(charts["dumbbell-queue"], DumbbellQueue),
  "hairline-area": drawer(charts["hairline-area"], HairlineArea),
  "hairline-line": drawer(charts["hairline-line"], HairlineLine),
  "plumb-scatter": drawer(charts["plumb-scatter"], PlumbScatter),
  "rung-bars": drawer(charts["rung-bars"], RungBars),
  slope: drawer(charts.slope, Slope),
};

interface Extra {
  animate: Animate;
  strokes?: "device" | "proportional";
}

const chart = (
  kind: Kind,
  id: string,
  size: { height: number; scale: number; width: number },
  extra: Extra
) =>
  DRAW[kind]({
    ...PAYLOADS[kind],
    height: size.height,
    idPrefix: id,
    scale: size.scale,
    width: size.width,
    ...extra,
  });

const themed = (name: ThemeName) =>
  deriveTheme({ ...THEMES[name], font: FONT });

const slide = (kind: Kind, name: ThemeName, animate: Animate) =>
  createElement(
    "section",
    {
      className: "slide",
      "data-slide": `${kind}-${name}`,
      key: `${kind}-${name}`,
      style: { background: THEMES[name].paper },
    },
    createElement(
      "div",
      { className: "hl-root", style: themed(name) },
      chart(kind, `${kind}-${name}`, SLIDE, { animate })
    )
  );

const compareRow = (kind: Kind, animate: Animate) =>
  createElement(
    "section",
    {
      className: "compare",
      "data-compare": kind,
      key: kind,
      style: { background: THEMES.light.paper },
    },
    (["proportional", "device"] as const).map((strokes) =>
      createElement(
        "div",
        {
          className: "hl-root",
          "data-strokes": strokes,
          key: strokes,
          style: themed("light"),
        },
        chart(kind, `${kind}-${strokes}`, COMPARE, { animate, strokes })
      )
    )
  );

export const Deck = ({ animate, layout }: DeckConfig) =>
  createElement(
    "main",
    null,
    layout === "slides"
      ? KIND_ORDER.flatMap((kind) =>
          (["dark", "light"] as const).map((name) => slide(kind, name, animate))
        )
      : KIND_ORDER.map((kind) => compareRow(kind, animate))
  );
