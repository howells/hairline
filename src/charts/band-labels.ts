import { wrapWords } from "./util";

/*
 * Labels under a row of bands (columns, years) that would touch at a narrow
 * width. A narrow chart never staggers them onto two lines, where a label
 * reads as belonging to its neighbour. A run of years shortens the
 * broadsheet way (2016, ’17, ’18); failing that, the labels thin to every
 * second, third… band from the first, and the hero's label always prints.
 */

const YEAR = /^\d{4}$/u;

/** Line height of a wrapped column header, px. */
export const HEAD_LINE = 13;

/** A year run shortened after its first: 2016, ’17, ’18; a new century prints in full. */
const shortYears = (labels: readonly string[]) =>
  labels.map((label, i) =>
    i === 0 || label.endsWith("00") ? label : `’${label.slice(2)}`
  );

interface FitOptions {
  /** Labels whose bands must keep theirs, like the hero's. */
  keep?: readonly number[];
  /** A label's width, px. */
  measure: (label: string) => number;
  /** Room kept between two neighbouring labels, px. */
  room: number;
  /** Distance between neighbouring bands' centres, px. */
  step: number;
}

/** Whether the shown labels (null for none) clear each other. */
const clears = (labels: readonly (string | null)[], o: FitOptions) => {
  let last = -1;

  for (const [i, label] of labels.entries()) {
    if (label === null) {
      continue;
    }

    const prev = labels[last];

    if (
      last >= 0 &&
      prev !== null &&
      (o.measure(prev) + o.measure(label)) / 2 + o.room > (i - last) * o.step
    ) {
      return false;
    }

    last = i;
  }

  return true;
};

/** Every `every`th label from the first, plus the kept ones, which push out a neighbour they would touch. */
const thinned = (labels: readonly string[], every: number, o: FitOptions) => {
  const keep = new Set(o.keep);

  const shown: (string | null)[] = labels.map((label, i) =>
    i % every === 0 || keep.has(i) ? label : null
  );

  for (const k of keep) {
    for (const j of [k - 1, k + 1]) {
      const near = shown[j];

      if (near !== undefined && near !== null && !keep.has(j)) {
        const pair = shown.map((label, i) =>
          i === j || i === k ? label : null
        );

        if (!clears(pair, o)) {
          shown[j] = null;
        }
      }
    }
  }

  return shown;
};

/** The labels to print under each band, null where a band prints none. */
export const fitBandLabels = (
  labels: readonly string[],
  o: FitOptions
): (string | null)[] => {
  if (clears(labels, o)) {
    return [...labels];
  }

  const base =
    labels.length > 1 && labels.every((l) => YEAR.test(l))
      ? shortYears(labels)
      : labels;

  if (clears(base, o)) {
    return [...base];
  }

  for (let every = 2; every < base.length; every += 1) {
    const shown = thinned(base, every, o);

    if (clears(shown, o)) {
      return shown;
    }
  }

  return base.map((label, i) => (i === 0 ? label : null));
};

const VOWEL = /[aeiouy]/iu;

/**
 * A word too wide for its column, hyphenated where it fits: the longest
 * first part, at least three letters each side, preferring a break between
 * two consonants or after a vowel ("Dish-" over "washer", "Com-" over
 * "puter"). A word with no such break keeps its line.
 */
const hyphenate = (
  word: string,
  room: number,
  measure: (s: string) => number
): string[] => {
  let best: number | undefined;
  let bestScore = -1;

  for (let i = word.length - 3; i >= 3; i -= 1) {
    const head = `${word.slice(0, i)}-`;

    if (measure(head) > room || measure(word.slice(i)) > room) {
      continue;
    }

    const [a, b] = [word[i - 1], word[i]];
    const soft = !VOWEL.test(a) && !VOWEL.test(b) ? 2 : Number(VOWEL.test(a));

    if (soft > bestScore) {
      best = i;
      bestScore = soft;
    }
  }

  return best === undefined
    ? [word]
    : [`${word.slice(0, best)}-`, word.slice(best)];
};

/**
 * A column's header set over its own column at a narrow width: wrapped at
 * spaces, then after a dash ("1996–" over "2010"), then hyphenated, so it
 * never staggers onto a neighbour's line or runs into it.
 */
export const headerLines = (
  label: string,
  room: number,
  measure: (s: string) => number
) =>
  wrapWords(label, room, measure).flatMap((line) => {
    if (measure(line) <= room) {
      return [line];
    }

    return line.includes("–")
      ? line.replaceAll("–", "–\n").split("\n")
      : hyphenate(line, room, measure);
  });
