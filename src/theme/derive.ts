/*
 * The theme function. A host gives Hairline its paper, its ink and (if it
 * likes) a hero, an alert and a font; this returns every colour the charts
 * draw with as plain `--hl-*` custom properties, ready to set as a style on
 * (or a stylesheet rule for) a Hairline root. React-free.
 *
 * The ramp is OKLab-linear between ink and paper. Each mode has its own step
 * table, fitted to the house palettes: light mode steps wider toward the
 * paper, dark mode keeps the ladder shorter so the faintest step stays
 * visibly above the page. Contrast is rebuilt per mode, never inverted.
 */

export type ThemeMode = "light" | "dark";

export interface ThemeInput {
  /** The ground of the chart: page, slide or card. `#rrggbb`. */
  paper: string;
  /** The strongest mark and text colour. `#rrggbb`. */
  ink: string;
  /** The one highlighted element. Defaults to the ink (a step below it in dark mode). */
  hero?: string;
  /** Thresholds and regressions. Defaults to a red chosen for the mode. */
  alert?: string;
  /** Override the faint grid line colour (defaults to a step off the paper). */
  grid?: string;
  /** Override the quiet rule colour (defaults to a step off the paper). */
  rule?: string;
  /** The chart font stack, set as `--hl-font`. Omitted: the host's inherited font. */
  font?: string;
  /** Whether the paper is light or dark. Defaults to light. */
  mode?: ThemeMode;
}

/** Plain CSS custom properties; assignable to a React `style` prop. */
export type ThemeProperties = Record<`--hl-${string}`, string>;

/** Position on the line from ink (0) to paper (1). */
interface Steps {
  ramp: readonly [number, number, number, number, number, number, number];
  muted: number;
  grid: number;
  rule: number;
  hero: number;
  grain: number;
  alert: string;
}

const STEPS: Record<ThemeMode, Steps> = {
  dark: {
    alert: "#d87a6e",
    grain: 0.036,
    grid: 0.931,
    hero: 0.105,
    muted: 0.442,
    ramp: [0, 0.148, 0.296, 0.442, 0.589, 0.725, 0.832],
    rule: 0.887,
  },
  light: {
    alert: "#c05951",
    grain: 0.045,
    grid: 0.942,
    hero: 0,
    muted: 0.39,
    ramp: [0, 0.17, 0.33, 0.49, 0.64, 0.78, 0.89],
    rule: 0.9,
  },
};

type Lab = readonly [number, number, number];

const toLinear = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const fromLinear = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

const HEX = /^#(?<digits>[\da-f]{3}|[\da-f]{6})$/iu;

/** The linear-light sRGB channels of a #rgb or #rrggbb colour. */
const parseHex = (hex: string): Lab => {
  const digits = HEX.exec(hex.trim())?.groups?.digits;
  if (digits === undefined) {
    throw new TypeError(
      `deriveTheme: "${hex}" is not a #rgb or #rrggbb colour`
    );
  }
  const full =
    digits.length === 3
      ? digits.replaceAll(/[\da-f]/giu, (c) => c + c)
      : digits;
  const at = (i: number) =>
    toLinear(Number.parseInt(full.slice(i, i + 2), 16) / 255);
  return [at(0), at(2), at(4)];
};

const toLab = (hex: string): Lab => {
  const [r, g, b] = parseHex(hex);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const channel = (c: number) =>
  Math.round(Math.min(1, Math.max(0, fromLinear(c))) * 255)
    .toString(16)
    .padStart(2, "0");

const toHex = ([L, a, b]: Lab) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return `#${channel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${channel(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  )}${channel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
};

const between = (from: Lab, to: Lab, t: number): Lab => [
  from[0] + (to[0] - from[0]) * t,
  from[1] + (to[1] - from[1]) * t,
  from[2] + (to[2] - from[2]) * t,
];

const normal = (hex: string) => toHex(toLab(hex));

/** The paper's grain: noise in the ink's colour at a whisper of opacity. */
const grain = (ink: string, opacity: number) => {
  const [r, g, b] = parseHex(ink);
  const [red, green, blue] = [r, g, b].map((c) => fromLinear(c).toFixed(3));
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 ${red} 0 0 0 0 ${green} 0 0 0 0 ${blue} 0 0 0 ${opacity} 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url%28%23g%29'/%3E%3C/svg%3E")`;
};

/** Every colour a chart draws with, from a few. */
export const deriveTheme = (input: ThemeInput): ThemeProperties => {
  const steps = STEPS[input.mode ?? "light"];
  const paper = normal(input.paper);
  const ink = normal(input.ink);
  const inkLab = toLab(ink);
  const paperLab = toLab(paper);
  const at = (t: number) => toHex(between(inkLab, paperLab, t));
  const pick = (given: string | undefined, fallback: () => string) =>
    given === undefined || given === "" ? fallback() : normal(given);

  const [s0, s1, s2, s3, s4, s5, s6] = steps.ramp;
  const l0 = at(s0);
  const l1 = at(s1);
  const l2 = at(s2);
  const l3 = at(s3);
  const l4 = at(s4);
  const l5 = at(s5);
  const l6 = at(s6);

  const theme = {
    "--hl-alert": normal(input.alert ?? steps.alert),
    "--hl-faint": l4,
    "--hl-grain": grain(ink, steps.grain),
    "--hl-grid": pick(input.grid, () => at(steps.grid)),
    "--hl-heat-1": l6,
    "--hl-heat-2": l4,
    "--hl-heat-3": l3,
    "--hl-heat-4": l1,
    "--hl-heat-5": l0,
    "--hl-hero": pick(input.hero, () => at(steps.hero)),
    "--hl-ink": ink,
    "--hl-l0": l0,
    "--hl-l1": l1,
    "--hl-l2": l2,
    "--hl-l3": l3,
    "--hl-l4": l4,
    "--hl-l5": l5,
    "--hl-l6": l6,
    "--hl-muted": at(steps.muted),
    "--hl-paper": paper,
    "--hl-rule": pick(input.rule, () => at(steps.rule)),
    "--hl-text": ink,
  };
  return input.font === undefined || input.font === ""
    ? theme
    : { ...theme, "--hl-font": input.font };
};
