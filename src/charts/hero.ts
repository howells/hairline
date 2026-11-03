import type { HeroContext } from "../schema/hero";

/*
 * One hero group against context. The hero is solid ink on a paper ring,
 * drawn above the rest; the rest ("context") is pushed back in one of two
 * ways: a pale solid tone (`grey`), or the ink at low opacity (`opacity`),
 * where overlaps build darker so a dense middle still reads as density. A
 * thin stroke reads lighter than a fill of the same tone, so grey strokes
 * sit one step darker than grey fills.
 */

/** The class of a context mark: a fill, or a 1 to 2px stroke. */
export const contextClass = (
  context: HeroContext | undefined,
  as: "fill" | "stroke"
) => {
  if (context === "opacity") {
    return as === "fill" ? "fill-ink opacity-25" : "stroke-ink opacity-25";
  }
  return as === "fill" ? "fill-l5" : "stroke-l4";
};

/** The keys given as `hero`, as a set; `fallback` when none were given. */
export const heroKeys = (
  hero: readonly string[] | undefined,
  fallback: readonly string[]
): ReadonlySet<string> => new Set(hero ?? fallback);

/** Draw order: context first, then the hero above it. Stable within each. */
export const heroLast = <T>(
  items: readonly T[],
  isHero: (item: T) => boolean
) => [
  ...items.filter((item) => !isHero(item)),
  ...items.filter((item) => isHero(item)),
];
