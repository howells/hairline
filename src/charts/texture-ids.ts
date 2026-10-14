import { useSvgId } from "./hooks";

/** The engraving pitches, in whole px. Every texture uses one of these. */
export const TEXTURE_PITCH = {
  /** Crosshatch: wider, so two families of lines never read as chequerboard. */
  cross: 6,
  /** Dense screens, fine rules, beads, and dotted guides. */
  dense: 3,
  /** Single diagonal hatch. */
  hatch: 4,
  /** Dot screens and stipple. */
  screen: 4,
} as const;

/**
 * The halftone ladder: dot radii for five value steps on a 4px screen, from a
 * fine stipple to dots that nearly touch. The top step stops short of merging,
 * so even the darkest tile still reads as an engraved screen, never a flat grey.
 */
export const HALFTONE_R = [0.75, 1, 1.3, 1.6, 1.85] as const;

/** `url(#id)` for a pattern fill. */
export const paint = (id: string) => `url(#${id})`;

/**
 * Unique pattern ids for one chart, all derived from a single `useSvgId`:
 * call the result with a pattern's name to get its id.
 */
export const useTextureIds = (prefix: string) => {
  const base = useSvgId(prefix);
  return (name: string) => `${base}-${name}`;
};
