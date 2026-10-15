/**
 * G5 Long novels: the length of four long novels in English, in thousands of
 * words. One page glyph is 50 thousand words.
 *
 * Source: Project Gutenberg plain-text editions (public domain; the Project
 * Gutenberg licence lets the texts be used for any purpose, and these counts
 * are derived facts), fetched 2026-10-15 from https://www.gutenberg.org/cache/epub/<id>/pg<id>.txt :
 *   2600 War and Peace, translated by Aylmer Maude
 *   135  Les Misérables, translated by Isabel Florence Hapgood
 *   996  Don Quixote, translated by John Ormsby
 *   145  Middlemarch, by George Eliot (written in English)
 *
 * Transform: every whitespace-separated token containing a letter or digit,
 * between the "*** START OF" and "*** END OF" marker lines, so the Gutenberg
 * licence text is left out but any translator's preface or notes inside the
 * book are counted. Raw counts: 563,001, 564,986, 427,245 and 316,339 words,
 * rounded to the nearest thousand. These are English translations, so the
 * counts belong to a particular translation, not to the original. Les
 * Misérables (Hapgood) edges War and Peace (Maude) by about two thousand words.
 */

export interface PictorialDatum {
  label: string;
  /** Thousands of words. */
  value: number;
}

/** Words in four long novels, in thousands. */
export const pictorialBarDemo: PictorialDatum[] = [
  { label: "Les Misérables", value: 565 },
  { label: "War and Peace", value: 563 },
  { label: "Don Quixote", value: 427 },
  { label: "Middlemarch", value: 316 },
];
