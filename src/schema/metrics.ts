// React-free. Font metrics: how wide a face sets its glyphs, as a table, so a
// label's room is worked out the same on the server, in headless Chromium and
// in the browser. Fixed-size charts never measure the DOM; they read this.
import { z } from "zod";

/**
 * A face's glyph advances, in em. `advances` maps a character to its width;
 * any character not listed takes `fallback`. `tabular`, when given, is the
 * width of every digit in text set with tabular figures (it overrides the
 * digits listed in `advances` there).
 */
export const fontMetricsSchema = z.strictObject({
  advances: z.record(z.string().length(1), z.number().positive()),
  fallback: z.number().positive(),
  tabular: z.number().positive().optional(),
});

export type FontMetrics = z.infer<typeof fontMetricsSchema>;

const advancesOf = (chars: string, em: number) =>
  Object.fromEntries(chars.split("").map((ch) => [ch, em]));

/**
 * Inter, bucketed from measurements and rounded up so a label that "fits"
 * really does: narrow punctuation, slim brackets and `1`, wide `m` and `w`,
 * widest `%@MW—…`, then 0.63em lower case and 0.76em capitals (the fallback
 * is applied per case, see `advance`). Tabular figures are 0.65em.
 */
export const INTER_METRICS: FontMetrics = {
  advances: {
    ...advancesOf(" !',.:;Iijl|·’", 0.3),
    ...advancesOf("()/1[]frt", 0.41),
    ...advancesOf("mw", 0.9),
    ...advancesOf("%@MW—…", 1.02),
  },
  fallback: 0.63,
  tabular: 0.65,
};

/** Capitals and other upper-case letters, when the table has no entry. */
const UPPER_EM = 0.76;
const DIGIT = /\d/u;

/**
 * Em advance of one character. An unlisted character is `fallback` wide,
 * except that the default Inter table widens capitals to 0.76em.
 */
const advance = (ch: string, metrics: FontMetrics, tabular: boolean) => {
  if (tabular && metrics.tabular !== undefined && DIGIT.test(ch)) {
    return metrics.tabular;
  }
  const listed = metrics.advances[ch];
  if (listed !== undefined) {
    return listed;
  }
  if (metrics === INTER_METRICS && ch !== ch.toLowerCase()) {
    return UPPER_EM;
  }
  return metrics.fallback;
};

/**
 * Width of a string at `size` px, from a metrics table: the same answer
 * everywhere, because nothing is measured. `tabular` sets digits at the
 * table's tabular width.
 */
export const textWidth = (
  text: string,
  size: number,
  metrics: FontMetrics = INTER_METRICS,
  tabular = false
) => {
  let em = 0;
  for (const ch of text) {
    em += advance(ch, metrics, tabular);
  }
  return em * size;
};
