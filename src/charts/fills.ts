/*
 * The fill taxonomy: every fill a chart may use, and nothing else. A fill is
 * a family (how the area is engraved) in a tone (how dark it reads), or a step
 * on one of the two value ladders when the fill itself encodes a quantity.
 * The Fills sheet at the end of the grid draws exactly this list, so drift is
 * visible at a glance; charts pick from it rather than inventing a pattern.
 */
import { HALFTONE_R, TEXTURE_PITCH } from "./texture-ids";

/** The tone steps a fill may take, darkest first. */
export const FILL_TONES = [
  { cls: "fill-hero", id: "ink", label: "Ink" },
  { cls: "fill-l2", id: "strong", label: "Strong" },
  { cls: "fill-l3", id: "mid", label: "Mid" },
  { cls: "fill-l4", id: "quiet", label: "Quiet" },
  { cls: "fill-l5", id: "faint", label: "Faint" },
  { cls: "fill-alert", id: "alert", label: "Alert" },
] as const;

export type FillTone = (typeof FILL_TONES)[number]["id"];

/**
 * The families, each with the tones it is drawn in. Hatch may run either
 * diagonal (rising by default; falling to tell a neighbour apart); every
 * engraved family sits on paper inside a 1px rule.
 */
export const FILL_FAMILIES = [
  {
    id: "solid",
    label: "Solid",
    tones: ["ink", "strong", "mid", "quiet", "faint", "alert"],
  },
  {
    id: "hatch",
    label: "Hatch",
    pitch: TEXTURE_PITCH.hatch,
    tones: ["ink", "strong", "mid", "quiet", "faint", "alert"],
  },
  {
    id: "cross",
    label: "Crosshatch",
    pitch: TEXTURE_PITCH.cross,
    tones: ["ink", "strong", "mid", "quiet", "alert"],
  },
  {
    id: "rules",
    label: "Rules",
    pitch: TEXTURE_PITCH.dense,
    tones: ["ink", "strong", "mid", "quiet", "faint"],
  },
  {
    id: "upright",
    label: "Upright rules",
    pitch: TEXTURE_PITCH.dense,
    tones: ["ink", "strong", "mid", "quiet", "faint"],
  },
  {
    id: "stipple",
    label: "Stipple",
    pitch: TEXTURE_PITCH.screen,
    tones: ["strong", "mid", "quiet", "faint"],
  },
  {
    id: "dense",
    label: "Dense stipple",
    pitch: TEXTURE_PITCH.dense,
    tones: ["strong", "mid", "quiet", "faint"],
  },
  {
    // Inside a 2px rung only: a row of evenly spaced dots, a deduction.
    id: "beads",
    label: "Broken rungs",
    pitch: TEXTURE_PITCH.dense,
    tones: ["mid"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  pitch?: number;
  tones: readonly FillTone[];
}[];

export type FillFamily = (typeof FILL_FAMILIES)[number]["id"];

/**
 * The value ladders: when a fill encodes a quantity, it steps along one of
 * these, lightest first. Halftone grows its dots on a 4px screen; hatch
 * density tightens its pitch.
 */
export const FILL_LADDERS = [
  {
    id: "halftone",
    label: "Halftone",
    steps: HALFTONE_R.map((r) => ({ pitch: TEXTURE_PITCH.screen, r })),
    tones: ["mid", "quiet"],
  },
  {
    id: "density",
    label: "Hatch density",
    steps: [
      { pitch: TEXTURE_PITCH.cross, r: 0 },
      { pitch: TEXTURE_PITCH.hatch, r: 0 },
      { pitch: TEXTURE_PITCH.dense, r: 0 },
    ],
    tones: ["mid"],
  },
] as const satisfies readonly {
  id: string;
  label: string;
  steps: readonly { pitch: number; r: number }[];
  tones: readonly FillTone[];
}[];

/** Ramp class for a tone. */
export const toneClass = (tone: FillTone) =>
  FILL_TONES.find((t) => t.id === tone)?.cls ?? "fill-l3";
