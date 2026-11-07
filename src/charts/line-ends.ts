// React-free. Direct labels at the right end of a set of lines: the hero and
// a few extremes named, the rest folded into one quiet group label, every
// label nudged clear of its neighbours. The drawing is in ./line-ends.tsx.

import { relax } from "./spread";
import { sansWidth } from "./util";

/** One line, as the end labels see it. */
export interface EndSeries {
  /** What to print beside the hero's name, e.g. its last value. */
  display?: string;
  /** The hero is named first, and in ink. */
  hero?: boolean;
  name: string;
  /** Where the line ends, in px. */
  y: number;
  /** The last value: the highest and lowest are named after the hero. */
  value: number;
}

export interface EndOptions {
  /** Smallest distance between two labels, px. */
  gap?: number;
  /** Lowest and highest y a label may take, px. */
  max: number;
  min: number;
  /** How many lines get a name, the hero included. Defaults to 4. */
  named?: number;
  /** The plural for the group label: "regions" gives "7 other regions". */
  others: string;
}

/** A named line's label. */
export interface EndLabel {
  display?: string;
  hero: boolean;
  name: string;
  /** True when the label moved off its line's end, so it wants a leader. */
  nudged: boolean;
  /** The label's y. */
  y: number;
  /** Where the line ends. */
  at: number;
}

/** The lines that were not named, as one label. */
export interface EndGroup {
  text: string;
  y: number;
}

export interface EndPlacement {
  group: EndGroup | null;
  labels: EndLabel[];
}

/** Where a leader meets its label, from the line's end, px. */
export const LEAD = 10;

/** Gap between the leader and the label, px. */
export const TEXT_GAP = 4;

/** Labels sit this far apart at the least, px. */
const DEFAULT_GAP = 15;
export const DEFAULT_NAMED = 4;

/** A label further than this from its line's end has been nudged, px. */
const NUDGED = 1;

/**
 * Which lines get a name: the heroes first, then the highest and lowest end
 * values in turn, until `named` are chosen. A lone line left over is named
 * too: "1 other region" saves nothing. Names come back in the order given.
 */
export const chooseNamed = (series: readonly EndSeries[], named: number) => {
  const chosen = new Set(series.filter((s) => s.hero === true));

  const rest = series
    .filter((s) => !chosen.has(s))
    .toSorted((a, b) => b.value - a.value);

  let top = true;

  while (rest.length > 1 && chosen.size < named) {
    const next = top ? rest.shift() : rest.pop();

    if (next !== undefined) {
      chosen.add(next);
    }

    top = !top;
  }

  if (rest.length === 1) {
    chosen.add(rest[0]);
  }

  return {
    folded: series.filter((s) => !chosen.has(s)),
    named: series.filter((s) => chosen.has(s)),
  };
};

/** The words of the group label: "7 other regions". */
export const groupText = (count: number, others: string) =>
  `${count} other ${others}`;

/**
 * Where each label goes. The named lines and the folded group are nudged
 * apart together (sorted, never closer than `gap`, inside [min, max]); the
 * group sits at the middle of the lines it folds.
 */
export const placeEndLabels = (
  series: readonly EndSeries[],
  options: EndOptions
): EndPlacement => {
  const { folded, named } = chooseNamed(series, options.named ?? DEFAULT_NAMED);

  const groupAt =
    folded.length === 0
      ? null
      : folded.reduce((sum, s) => sum + s.y, 0) / folded.length;

  const ys = relax(
    [...named.map((s) => s.y), ...(groupAt === null ? [] : [groupAt])],
    options.gap ?? DEFAULT_GAP,
    options.min,
    options.max
  );

  return {
    group:
      groupAt === null
        ? null
        : {
            text: groupText(folded.length, options.others),
            y: ys[named.length],
          },
    labels: named.map((s, k) => ({
      at: s.y,
      display: s.display,
      hero: s.hero === true,
      name: s.name,
      nudged: Math.abs(ys[k] - s.y) > NUDGED,
      y: ys[k],
    })),
  };
};

/** A line's y moved clear of its neighbours, and whether it moved. */
export interface Nudged {
  moved: boolean;
  y: number;
}

/** Labels nudged apart on one side of a chart, each told whether it moved. */
export const nudge = (
  ys: readonly number[],
  gap: number,
  min: number,
  max: number
): Nudged[] =>
  ys.length === 0
    ? []
    : relax([...ys], gap, min, max).map((y, k) => ({
        moved: Math.abs(y - ys[k]) > NUDGED,
        y,
      }));

/**
 * The right margin the labels need, in px: the leader, and the widest of the
 * names (the hero's with its value) and the group label. Zero room for none.
 */
export const endLabelRoom = (
  series: readonly EndSeries[],
  options: Pick<EndOptions, "named" | "others">
) => {
  if (series.length === 0) {
    return 0;
  }

  const { folded, named } = chooseNamed(series, options.named ?? DEFAULT_NAMED);

  const lines = named.map((s) =>
    s.hero === true && s.display !== undefined
      ? `${s.name} ${s.display}`
      : s.name
  );

  const group =
    folded.length === 0 ? [] : [groupText(folded.length, options.others)];

  return (
    LEAD +
    TEXT_GAP +
    Math.ceil(Math.max(...[...lines, ...group].map((t) => sansWidth(t, 11))))
  );
};
